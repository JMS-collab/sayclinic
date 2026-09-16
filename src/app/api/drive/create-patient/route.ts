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

    const { patientName } = await req.json();

    if (!patientName) {
      return NextResponse.json(
        { error: 'Meno pacienta je povinné.' },
        { status: 400 }
      );
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // 1. Nájdeme hlavnú zložku "Klienti SAY"
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='Klienti SAY' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      { headers }
    );
    const searchData = await searchRes.json();

    let parentFolderId = '';
    if (searchData.files && searchData.files.length > 0) {
      parentFolderId = searchData.files[0].id;
    } else {
      // Ak zložka Klienti SAY neexistuje, vytvoríme ju v koreni Drive
      const createParentRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'Klienti SAY',
          mimeType: 'application/vnd.google-apps.folder',
        }),
      });
      const parentData = await createParentRes.json();
      parentFolderId = parentData.id;
    }

    // 2. Skontrolujeme, či zložka pre pacienta už neexistuje v "Klienti SAY"
    const escapedName = patientName.replace(/'/g, "\\'");
    const existingPatientFolderRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${escapedName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      { headers }
    );
    const existingData = await existingPatientFolderRes.json();

    let patientFolderId = '';
    let webViewLink = '';

    if (existingData.files && existingData.files.length > 0) {
      patientFolderId = existingData.files[0].id;
      webViewLink = `https://drive.google.com/drive/folders/${patientFolderId}`;
    } else {
      // Vytvoríme hlavnú zložku pre pacienta (napr. "Ján Mráz")
      const createPatientFolderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: patientName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentFolderId],
        }),
      });
      const patientFolder = await createPatientFolderRes.json();
      patientFolderId = patientFolder.id;
      webViewLink = `https://drive.google.com/drive/folders/${patientFolderId}`;
    }

    // 3. Vytvoríme podzložky: Fotodokumentácia, Dokumentácia, Predoperačné vyšetrenia, Súhlasy a protokoly
    const subfolders = [
      'Fotodokumentácia', 
      'Dokumentácia', 
      'Predoperačné vyšetrenia', 
      'Súhlasy a protokoly'
    ];

    // Zistíme existujúce podzložky, aby sme nevytvárali duplikáty
    const existingSubsRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${patientFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      { headers }
    );
    const existingSubsData = await existingSubsRes.json();
    const existingSubNames = new Set((existingSubsData.files || []).map((f: any) => f.name));

    for (const sub of subfolders) {
      if (!existingSubNames.has(sub)) {
        await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: sub,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [patientFolderId],
          }),
        });
      }
    }

    return NextResponse.json({
      success: true,
      folderId: patientFolderId,
      webViewLink,
      subfolders,
    });

  } catch (error: any) {
    console.error('Chyba pri vytváraní zložky pacienta na Google Drive:', error);
    return NextResponse.json(
      { error: 'Chyba servera pri komunikácii s Google Drive API.' },
      { status: 500 }
    );
  }
}