import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST() {
  const session: any = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Nie ste prihlásený do Google účtu.' }, { status: 401 });
  }

  try {
    // 1. Získame zoznam VŠETKÝCH zložiek dostupných pre účet
    const url = "https://www.googleapis.com/drive/v3/files?q=mimeType%3D'application%2Fvnd.google-apps.folder'+and+trashed%3Dfalse&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true";

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || 'Chyba Google Drive API' }, { status: res.status });
    }

    const folders = data.files || [];

    // Ak nenašiel vôbec nič
    if (folders.length === 0) {
      return NextResponse.json({
        error: 'Google API nevrátilo žiadne zložky. Uistite sa, že máte zapnuté Google Drive API v Google Console a dali ste aplikácii povolenie pri prihlásení.'
      }, { status: 404 });
    }

    // 2. Vyhľadáme zložku Klienti SAY
    const rootFolder = folders.find((f: any) => 
      f.name.toLowerCase().includes('klienti') || 
      f.name.toLowerCase().includes('say')
    );

    if (!rootFolder) {
      const folderList = folders.map((f: any) => `"${f.name}"`).join(', ');
      return NextResponse.json({
        error: `Zložku "Klienti SAY" som nenašiel. Tvoj účet vidí tieto zložky: [${folderList}]`
      }, { status: 404 });
    }

    // 3. Načítame podzložky klientov
    let allPatientFolders: any[] = [];
    let pageToken: string | null = null;

    do {
      const pageQuery = `'${rootFolder.id}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      let pageUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(pageQuery)}&pageSize=1000&fields=nextPageToken, files(id, name, webViewLink)&supportsAllDrives=true&includeItemsFromAllDrives=true`;
      if (pageToken) pageUrl += `&pageToken=${pageToken}`;

      const foldersRes = await fetch(pageUrl, { headers: { Authorization: `Bearer ${session.accessToken}` } });
      const foldersData = await foldersRes.json();
      
      if (foldersData.files) {
        allPatientFolders = [...allPatientFolders, ...foldersData.files];
      }
      pageToken = foldersData.nextPageToken || null;
    } while (pageToken);

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
      patients: importedPatients
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}