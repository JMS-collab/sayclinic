import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST() {
  const session: any = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Nie ste prihlásený do Google účtu.' }, { status: 401 });
  }

  try {
    // 1. Vyhľadáme zložku, ktorá sa volá alebo obsahuje "Klienti SAY"
    const rootQuery = "mimeType = 'application/vnd.google-apps.folder' and trashed = false";
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(rootQuery)}&pageSize=100&fields=files(id, name)&supportsAllDrives=true&includeItemsFromAllDrives=true`;

    const rootRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    const rootData = await rootRes.json();
    const folders = rootData.files || [];

    // Hľadáme presnú zhodu alebo čiastočnú zhodu (case-insensitive)
    const rootFolder = folders.find((f: any) => 
      f.name.toLowerCase().trim() === 'klienti say' || 
      f.name.toLowerCase().includes('klienti')
    );

    if (!rootFolder) {
      const foundNames = folders.map((f: any) => f.name).slice(0, 5).join(', ');
      return NextResponse.json({ 
        error: `Zložka "Klienti SAY" nebola nájdená. Na vašom Disku som našiel napríklad tieto zložky: [${foundNames || 'žiadne'}]` 
      }, { status: 404 });
    }

    // 2. Načítame podzložky pacientov
    let allPatientFolders: any[] = [];
    let pageToken: string | null = null;

    do {
      const pageQuery = `'${rootFolder.id}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      let url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(pageQuery)}&pageSize=1000&fields=nextPageToken, files(id, name, webViewLink)&supportsAllDrives=true&includeItemsFromAllDrives=true`;
      if (pageToken) url += `&pageToken=${pageToken}`;

      const foldersRes = await fetch(url, { headers: { Authorization: `Bearer ${session.accessToken}` } });
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