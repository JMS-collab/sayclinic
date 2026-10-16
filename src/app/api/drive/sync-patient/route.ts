import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dns from 'node:dns';

// Zabezpečí okamžité spojenie cez IPv4 namiesto zlyhávajúcich IPv6 timeoutov v cloud prostredí
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // ignore
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const session: any = await getServerSession(authOptions);
    const accessToken = bearerToken || session?.accessToken;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Neautorizovaný prístup k Google Drive.', needsReauth: true },
        { status: 401 }
      );
    }

    const patient = await req.json();
    if (!patient || !patient.name) {
      return NextResponse.json({ error: 'Meno pacienta je povinné.' }, { status: 400 });
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // 1. Vyhľadáme hlavnú zložku "Klienti SAY"
    const rootQuery = "name = 'Klienti SAY' and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(rootQuery)}&supportsAllDrives=true&includeItemsFromAllDrives=true`,
      { headers, signal: AbortSignal.timeout(6000) }
    );

    if (searchRes.status === 401 || searchRes.status === 403) {
      return NextResponse.json(
        { error: 'Platnosť tokenu vypršala.', needsReauth: true },
        { status: 401 }
      );
    }

    const searchData = await searchRes.json();
    let parentFolderId = '';
    if (searchData.files && searchData.files.length > 0) {
      parentFolderId = searchData.files[0].id;
    } else {
      const createParentRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'Klienti SAY',
          mimeType: 'application/vnd.google-apps.folder',
        }),
        signal: AbortSignal.timeout(6000),
      });
      const parentData = await createParentRes.json();
      parentFolderId = parentData.id;
    }

    // 2. Nájdeme alebo vytvoríme zložku pacienta
    const escapedName = patient.name.replace(/'/g, "\\'");
    const patientQuery = `name = '${escapedName}' and '${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const patientFolderRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(patientQuery)}&supportsAllDrives=true&includeItemsFromAllDrives=true`,
      { headers, signal: AbortSignal.timeout(6000) }
    );
    const patientFolderData = await patientFolderRes.json();

    let patientFolderId = '';
    let webViewLink = '';

    if (patientFolderData.files && patientFolderData.files.length > 0) {
      patientFolderId = patientFolderData.files[0].id;
      webViewLink = `https://drive.google.com/drive/folders/${patientFolderId}`;
    } else {
      const createPatientFolderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: patient.name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentFolderId],
        }),
        signal: AbortSignal.timeout(6000),
      });
      const patientFolder = await createPatientFolderRes.json();
      patientFolderId = patientFolder.id;
      webViewLink = `https://drive.google.com/drive/folders/${patientFolderId}`;
    }

    // 3. Vytvoríme/aktualizujeme profil_klienta.json priamo v zložke pacienta
    const profileJson = JSON.stringify({
      ...patient,
      driveFolderId: patientFolderId,
      driveFolderLink: webViewLink,
      updatedAt: new Date().toISOString(),
      synchronizedFrom: 'SAY Clinic Cloud System'
    }, null, 2);

    const profileQuery = `name = 'profil_klienta.json' and '${patientFolderId}' in parents and trashed = false`;
    const profileSearchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(profileQuery)}&supportsAllDrives=true&includeItemsFromAllDrives=true`,
      { headers, signal: AbortSignal.timeout(6000) }
    );
    const profileSearchData = await profileSearchRes.json();

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: 'profil_klienta.json',
      mimeType: 'application/json',
      ...(profileSearchData.files && profileSearchData.files.length > 0 ? {} : { parents: [patientFolderId] })
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      profileJson +
      closeDelimiter;

    if (profileSearchData.files && profileSearchData.files.length > 0) {
      const existingFileId = profileSearchData.files[0].id;
      await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
          signal: AbortSignal.timeout(6000),
        }
      );
    } else {
      await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
          signal: AbortSignal.timeout(6000),
        }
      );
    }

    return NextResponse.json({
      success: true,
      folderId: patientFolderId,
      driveFolderLink: webViewLink,
    });
  } catch (error: any) {
    console.warn('Upozornenie pri synchronizácii profilu pacienta na Google Drive:', error?.message || error);
    return NextResponse.json({ 
      success: false, 
      warning: error?.message || 'Google Drive je dočasne nedostupný, údaje sú však bezpečne uložené vo Firestore.' 
    }, { status: 200 });
  }
}
