import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session: any = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: 'Neautorizovaný prístup k Google Drive.' },
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
      Authorization: `Bearer ${session.accessToken}`,
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

    // 2. Vytvoríme hlavnú zložku pre pacienta (napr. "Mária Kováčová")
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

    // 3. Vytvoríme podzložky: Fotodokumentácia, Predoperačné vyšetrenia, Dokumenty
    const subfolders = ['Fotodokumentácia', 'Predoperačné vyšetrenia', 'Dokumenty'];
    for (const sub of subfolders) {
      await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: sub,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [patientFolder.id],
        }),
      });
    }

    return NextResponse.json({
      success: true,
      folderId: patientFolder.id,
      webViewLink: `https://drive.google.com/drive/folders/${patientFolder.id}`,
    });

  } catch (error: any) {
    console.error('Chyba pri vytváraní zložky pacienta na Google Drive:', error);
    return NextResponse.json(
      { error: 'Chyba servera pri komunikácii s Google Drive API.' },
      { status: 500 }
    );
  }
}