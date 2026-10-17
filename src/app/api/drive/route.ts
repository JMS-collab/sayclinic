import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dns from 'node:dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // ignore
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const session: any = await getServerSession(authOptions);
  const accessToken = bearerToken || session?.accessToken;

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Nie ste pripojený ku Google Drive.', needsReauth: true },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const patientName = searchParams.get('patientName');

  if (!patientName) {
    return NextResponse.json({ error: 'Meno pacienta je povinné.' }, { status: 400 });
  }

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  try {
    // 1. Najprv nájdeme hlavnú zložku "Klienti SAY" (vrátane zdieľaných diskov)
    const rootQuery = "name = 'Klienti SAY' and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
    const rootFolderRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(rootQuery)}&fields=files(id,name,webViewLink)&supportsAllDrives=true&includeItemsFromAllDrives=true`,
      { headers, signal: AbortSignal.timeout(6000) }
    );

    if (rootFolderRes.status === 401 || rootFolderRes.status === 403) {
      return NextResponse.json(
        {
          error: 'Platnosť pripojenia ku Google Drive vypršala alebo chýbajú povolenia. Pripojte účet znova.',
          needsReauth: true,
        },
        { status: 401 }
      );
    }

    const rootFolderData = await rootFolderRes.json();
    let rootFolder = rootFolderData.files?.[0];

    // Ak hlavná zložka "Klienti SAY" ešte na disku neexistuje, automaticky ju vytvoríme
    if (!rootFolder) {
      const createRootRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'Klienti SAY',
          mimeType: 'application/vnd.google-apps.folder',
        }),
        signal: AbortSignal.timeout(6000),
      });
      if (createRootRes.ok) {
        rootFolder = await createRootRes.json();
      } else {
        return NextResponse.json({
          found: false,
          message: 'Hlavná zložka "Klienti SAY" zatiaľ nebola nájdená.',
          files: [],
        });
      }
    }

    // 2. V zložke "Klienti SAY" vyhľadáme podzložku pre daného pacienta
    const escapedPatientName = patientName.replace(/'/g, "\\'");
    const patientFolderQuery = `'${rootFolder.id}' in parents and name contains '${escapedPatientName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const patientFolderRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(patientFolderQuery)}&fields=files(id,name,webViewLink)&supportsAllDrives=true&includeItemsFromAllDrives=true`,
      { headers, signal: AbortSignal.timeout(6000) }
    );
    const patientFolderData = await patientFolderRes.json();
    const patientFolder = patientFolderData.files?.[0];

    if (!patientFolder) {
      return NextResponse.json({
        found: false,
        rootFolderId: rootFolder.id,
        rootFolderLink: rootFolder.webViewLink,
        files: [],
        message: `Zložka pre ${patientName} zatiaľ v "Klienti SAY" neexistuje.`,
      });
    }

    // 3. Načítame všetky súbory a podzložky z podzložky pacienta
    const filesQuery = `'${patientFolder.id}' in parents and trashed = false`;
    const filesRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(filesQuery)}&fields=files(id,name,mimeType,webViewLink,iconLink,thumbnailLink)&supportsAllDrives=true&includeItemsFromAllDrives=true`,
      { headers, signal: AbortSignal.timeout(6000) }
    );
    const filesData = await filesRes.json();

    return NextResponse.json({
      found: true,
      folderId: patientFolder.id,
      folderLink: patientFolder.webViewLink || `https://drive.google.com/drive/folders/${patientFolder.id}`,
      files: filesData.files || [],
    });
  } catch (error: any) {
    console.warn('Upozornenie pri načítavaní Google Drive cez server:', error?.message || error);
    return NextResponse.json({
      found: false,
      files: [],
      warning: error?.message || 'Google Drive je dočasne nedostupný cez server.',
    }, { status: 200 });
  }
}