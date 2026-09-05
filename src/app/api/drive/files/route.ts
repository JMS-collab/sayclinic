import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const session: any = await getServerSession(authOptions);
    const accessToken = bearerToken || session?.accessToken;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Nie ste prihlásený do Google účtu.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get('folderId');
    const queryTerm = searchParams.get('q');
    const pageSize = searchParams.get('pageSize') || '40';

    let q = 'trashed = false';

    if (folderId) {
      q += ` and '${folderId}' in parents`;
    }

    if (queryTerm) {
      q += ` and name contains '${queryTerm.replace(/'/g, "\\'")}'`;
    }

    const fields = 'nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink, iconLink, thumbnailLink, owners(displayName, emailAddress), parents)';
    const driveUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=${pageSize}&fields=${encodeURIComponent(fields)}&orderBy=folder,modifiedTime desc&supportsAllDrives=true&includeItemsFromAllDrives=true`;

    const res = await fetch(driveUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const errData = await res.json();
      return NextResponse.json(
        { error: errData.error?.message || 'Chyba pri získavaní súborov z Google Drive' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      files: data.files || [],
      nextPageToken: data.nextPageToken,
    });
  } catch (error: any) {
    console.error('Drive files API error:', error);
    return NextResponse.json({ error: error.message || 'Chyba servera' }, { status: 500 });
  }
}

// Vytvorenie nového priečinka na Google Drive
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const session: any = await getServerSession(authOptions);
    const accessToken = bearerToken || session?.accessToken;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Nie ste prihlásený do Google účtu.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, parentId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Názov priečinka je povinný.' }, { status: 400 });
    }

    const metadata: Record<string, any> = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
    };

    if (parentId) {
      metadata.parents = [parentId];
    }

    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      return NextResponse.json({ error: err.error?.message || 'Nepodarilo sa vytvoriť priečinok' }, { status: createRes.status });
    }

    const folder = await createRes.json();
    return NextResponse.json({
      success: true,
      folder,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Chyba servera' }, { status: 500 });
  }
}

// Zmazanie súboru alebo priečinka z Google Drive (vyžaduje potvrdenie na klientovi)
export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const session: any = await getServerSession(authOptions);
    const accessToken = bearerToken || session?.accessToken;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Nie ste prihlásený do Google účtu.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: 'ID súboru je povinné.' }, { status: 400 });
    }

    const deleteRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!deleteRes.ok && deleteRes.status !== 204) {
      const err = await deleteRes.json();
      return NextResponse.json({ error: err.error?.message || 'Chyba pri mazaní súboru' }, { status: deleteRes.status });
    }

    return NextResponse.json({ success: true, message: 'Súbor bol úspešne odstránený.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Chyba servera' }, { status: 500 });
  }
}
