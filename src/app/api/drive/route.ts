import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const session: any = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Nie ste prihlásený.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const patientName = searchParams.get('patientName');

  if (!patientName) {
    return NextResponse.json({ error: 'Meno pacienta je povinné.' }, { status: 400 });
  }

  try {
    // 1. Najprv nájdeme hlavnú zložku "Klienti SAY"
    const rootFolderRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent("name = 'Klienti SAY' and mimeType = 'application/vnd.google-apps.folder' and trashed = false")}&fields=files(id, name)`,
      { headers: { Authorization: `Bearer ${session.accessToken}` } }
    );
    const rootFolderData = await rootFolderRes.json();
    const rootFolder = rootFolderData.files?.[0];

    if (!rootFolder) {
      return NextResponse.json({ error: 'Hlavná zložka "Klienti SAY" nebola na Google Disku nájdená.' }, { status: 404 });
    }

    // 2. V zložke "Klienti SAY" vyhľadáme podzložku pre daného pacienta
    const patientFolderQuery = `'${rootFolder.id}' in parents and name contains '${patientName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const patientFolderRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(patientFolderQuery)}&fields=files(id, name, webViewLink)`,
      { headers: { Authorization: `Bearer ${session.accessToken}` } }
    );
    const patientFolderData = await patientFolderRes.json();
    const patientFolder = patientFolderData.files?.[0];

    if (!patientFolder) {
      return NextResponse.json({ found: false, message: `Zložka pre ${patientName} nebola v "Klienti SAY" nájdená.` });
    }

    // 3. Načítame všetky súbory (Google Sheety, PDF, fotky) z podzložky pacienta
    const filesQuery = `'${patientFolder.id}' in parents and trashed = false`;
    const filesRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(filesQuery)}&fields=files(id, name, mimeType, webViewLink, iconLink, thumbnailLink)`,
      { headers: { Authorization: `Bearer ${session.accessToken}` } }
    );
    const filesData = await filesRes.json();

    return NextResponse.json({
      found: true,
      folderId: patientFolder.id,
      folderLink: patientFolder.webViewLink,
      files: filesData.files || []
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}