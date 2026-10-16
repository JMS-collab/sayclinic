import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dns from 'node:dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // ignore
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const session: any = await getServerSession(authOptions);
  const accessToken = bearerToken || session?.accessToken;

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Nie ste prihlásený do Google účtu.', needsReauth: true },
      { status: 401 }
    );
  }

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  try {
    // 1. Najprv vyhľadáme hlavnú zložku "Klienti SAY"
    const rootQuery = "mimeType = 'application/vnd.google-apps.folder' and trashed = false and name contains 'Klienti'";
    const rootUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(rootQuery)}&pageSize=10&supportsAllDrives=true&includeItemsFromAllDrives=true`;

    const rootRes = await fetch(rootUrl, { headers });

    if (rootRes.status === 401 || rootRes.status === 403) {
      return NextResponse.json(
        {
          error: 'Platnosť pripojenia ku Google Drive vypršala. Prihláste sa prosím znova.',
          needsReauth: true,
        },
        { status: 401 }
      );
    }

    const rootData = await rootRes.json();
    const folders = rootData.files || [];

    // Nájdenie zložky Klienti SAY
    let targetRootFolder = folders.find(
      (f: any) =>
        f.name.toLowerCase().trim() === 'klienti say' ||
        f.name.toLowerCase().includes('klienti say') ||
        f.name.toLowerCase().includes('klienti')
    );

    // Ak ešte zložka "Klienti SAY" na disku neexistuje, automaticky ju vytvoríme
    if (!targetRootFolder) {
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'Klienti SAY',
          mimeType: 'application/vnd.google-apps.folder',
        }),
      });
      if (createRes.ok) {
        targetRootFolder = await createRes.json();
      } else {
        return NextResponse.json(
          {
            error: 'Zložka "Klienti SAY" nebola na Google Disku nájdená.',
          },
          { status: 404 }
        );
      }
    }

    // 2. Načítame VŠETKY podzložky (klientov) priamo zo zložky Klienti SAY
    let allPatientFolders: any[] = [];
    let pageToken: string | null = null;

    do {
      const pageQuery = `'${targetRootFolder.id}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      let pageUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(pageQuery)}&pageSize=1000&fields=nextPageToken,files(id,name,webViewLink)&supportsAllDrives=true&includeItemsFromAllDrives=true`;
      if (pageToken) pageUrl += `&pageToken=${pageToken}`;

      const foldersRes = await fetch(pageUrl, { headers });
      const foldersData = await foldersRes.json();

      if (foldersData.files) {
        allPatientFolders = [...allPatientFolders, ...foldersData.files];
      }
      pageToken = foldersData.nextPageToken || null;
    } while (pageToken);

    // 3. Vytvorenie kariet pre SAY CLINIC
    const importedPatients = allPatientFolders.map((folder) => ({
      id: `drive-patient-${folder.id}`,
      name: folder.name,
      driveFolderId: folder.id,
      driveFolderLink: folder.webViewLink,
      createdAt: new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      totalImported: importedPatients.length,
      parentFolderName: targetRootFolder.name,
      patients: importedPatients,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}