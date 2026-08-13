import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

// GET: Načítanie súborov z Google Drive (alebo vyhľadanie priečinka pacienta)
export async function GET(req: Request) {
  const session: any = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Nie ste prihlásený.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const folderName = searchParams.get('folderName');

  try {
    let query = "trashed = false";
    if (folderName) {
      query += ` and mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}'`;
    }

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id, name, mimeType, webViewLink, iconLink)`,
      {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      }
    );

    const data = await res.json();
    return NextResponse.json(data.files || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Vytvorenie nového priečinka pre pacienta na Google Drive
export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Nie ste prihlásený.' }, { status: 401 });
  }

  try {
    const { folderName } = await req.json();

    const driveMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };

    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(driveMetadata),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}