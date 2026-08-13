import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST() {
  const session: any = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Nie ste prihlásený.' }, { status: 401 });
  }

  try {
    // 1. Nájdeme hlavnú zložku "Klienti SAY"
    const rootRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent("name = 'Klienti SAY' and mimeType = 'application/vnd.google-apps.folder' and trashed = false")}&fields=files(id, name)`,
      { headers: { Authorization: `Bearer ${session.accessToken}` } }
    );
    const rootData = await rootRes.json();
    const rootFolder = rootData.files?.[0];

    if (!rootFolder) {
      return NextResponse.json({ error: 'Zložka "Klienti SAY" nebola nájdená na Google Disku.' }, { status: 404 });
    }

    // 2. Načítame VŠETKY podzložky (klientov) - nastavíme vysoke maxResults
    let allPatientFolders: any[] = [];
    let pageToken: string | null = null;

    do {
      const pageQuery = `'${rootFolder.id}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      let url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(pageQuery)}&pageSize=1000&fields=nextPageToken, files(id, name, webViewLink)`;
      if (pageToken) url += `&pageToken=${pageToken}`;

      const foldersRes = await fetch(url, { headers: { Authorization: `Bearer ${session.accessToken}` } });
      const foldersData = await foldersRes.json();
      
      if (foldersData.files) {
        allPatientFolders = [...allPatientFolders, ...foldersData.files];
      }
      pageToken = foldersData.nextPageToken || null;
    } while (pageToken);

    // 3. Transformácia zložiek na Karty Klientov pre SAY CLINIC
    const importedPatients = allPatientFolders.map((folder, index) => {
      return {
        id: `drive-patient-${folder.id}`,
        name: folder.name, // Meno z názvu zložky
        driveFolderId: folder.id,
        driveFolderLink: folder.webViewLink, // Odkaz na celú zložku
        createdAt: new Date().toISOString(),
        notes: `Automaticky importované z Google Drive zložky "Klienti SAY".`,
      };
    });

    return NextResponse.json({
      success: true,
      totalImported: importedPatients.length,
      patients: importedPatients
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}