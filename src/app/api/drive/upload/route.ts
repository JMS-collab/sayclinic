import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const session: any = await getServerSession(authOptions);
    const accessToken = bearerToken || session?.accessToken;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Neautorizovaný prístup k Google Drive. Prihláste sa cez Google účet.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { 
      patientName, 
      fileName, 
      contentBase64, 
      contentText, 
      mimeType = 'application/pdf', 
      subfolderName = 'Dokumentácia' 
    } = body;

    if (!patientName || !fileName) {
      return NextResponse.json(
        { error: 'Meno pacienta a názov súboru sú povinné.' },
        { status: 400 }
      );
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // 1. Vyhľadáme hlavnú zložku "Klienti SAY"
    const searchParentRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='Klienti SAY' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      { headers }
    );
    const parentData = await searchParentRes.json();
    let parentFolderId = '';

    if (parentData.files && parentData.files.length > 0) {
      parentFolderId = parentData.files[0].id;
    } else {
      const createParentRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'Klienti SAY',
          mimeType: 'application/vnd.google-apps.folder',
        }),
      });
      const newParent = await createParentRes.json();
      parentFolderId = newParent.id;
    }

    // 2. Vyhľadáme alebo vytvoríme zložku pacienta (napr. "Mária Kováčová")
    const escapedName = patientName.replace(/'/g, "\\'");
    const searchPatientRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${escapedName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      { headers }
    );
    const patientData = await searchPatientRes.json();
    let patientFolderId = '';

    if (patientData.files && patientData.files.length > 0) {
      patientFolderId = patientData.files[0].id;
    } else {
      const createPatientRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: patientName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentFolderId],
        }),
      });
      const newPatientFolder = await createPatientRes.json();
      patientFolderId = newPatientFolder.id;
    }

    // 3. Vyhľadáme alebo vytvoríme cieľovú podzložku (napr. "Dokumentácia")
    const searchSubfolderRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${subfolderName}' and '${patientFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      { headers }
    );
    const subfolderData = await searchSubfolderRes.json();
    let targetFolderId = patientFolderId;

    if (subfolderData.files && subfolderData.files.length > 0) {
      targetFolderId = subfolderData.files[0].id;
    } else {
      const createSubRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: subfolderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [patientFolderId],
        }),
      });
      const newSubfolder = await createSubRes.json();
      targetFolderId = newSubfolder.id || patientFolderId;
    }

    // 4. Pripravíme binárne alebo textové telo pre multipart upload
    let fileBuffer: Buffer;
    if (contentBase64) {
      fileBuffer = Buffer.from(contentBase64, 'base64');
    } else if (contentText) {
      fileBuffer = Buffer.from(contentText, 'utf-8');
    } else {
      fileBuffer = Buffer.from('Prázdny medicínsky záznam', 'utf-8');
    }

    const metadata = {
      name: fileName,
      parents: [targetFolderId],
      mimeType,
      description: `Lekársky záznam vytvorený v SAY CLINIC pre pacienta ${patientName}`,
    };

    const boundary = '-------sayclinic' + Date.now();
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody = Buffer.concat([
      Buffer.from(
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${mimeType}\r\n` +
        'Content-Transfer-Encoding: base64\r\n\r\n' +
        fileBuffer.toString('base64') +
        closeDelimiter
      ),
    ]);

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,size,createdTime',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': String(multipartRequestBody.length),
        },
        body: multipartRequestBody,
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error('Chyba pri Google Drive upload:', errText);
      return NextResponse.json({ error: 'Chyba pri nahrávaní do Google Drive: ' + errText }, { status: uploadRes.status });
    }

    const uploadedFile = await uploadRes.json();

    return NextResponse.json({
      success: true,
      file: uploadedFile,
      folderId: targetFolderId,
      patientFolderId,
    });
  } catch (error: any) {
    console.error('Google Drive Upload Route Error:', error);
    return NextResponse.json({ error: error.message || 'Chyba servera pri nahrávaní súboru' }, { status: 500 });
  }
}
