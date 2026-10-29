import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PatientDriveOrganizerService } from '@/services/patientDriveOrganizerService';

export async function GET(req: Request) {
  try {
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

    const { searchParams } = new URL(req.url);
    const patientName = searchParams.get('patientName');
    const folderId = searchParams.get('folderId') || undefined;
    const refresh = searchParams.get('refresh') === 'true';

    if (!patientName) {
      return NextResponse.json(
        { error: 'Chýba parameter patientName.' },
        { status: 400 }
      );
    }

    const categorized = await PatientDriveOrganizerService.getCategorizedPatientFiles(
      accessToken,
      patientName,
      folderId,
      refresh
    );

    return NextResponse.json({
      success: true,
      data: categorized
    });
  } catch (error: any) {
    console.error('Chyba pri čítaní súborov pacienta:', error);
    return NextResponse.json(
      { error: error.message || 'Nepodarilo sa načítať súbory pacienta.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
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

    const body = await req.json();
    const { action, patientName, folderId } = body;

    if (!patientName) {
      return NextResponse.json(
        { error: 'Chýba meno pacienta.' },
        { status: 400 }
      );
    }

    if (action === 'organize') {
      const result = await PatientDriveOrganizerService.autoOrganizePatientFolder(
        accessToken,
        patientName,
        folderId
      );

      // Získame aktualizovaný zoznam
      const updatedData = await PatientDriveOrganizerService.getCategorizedPatientFiles(
        accessToken,
        patientName,
        folderId,
        true
      );

      return NextResponse.json({
        success: result.success,
        movedCount: result.movedCount,
        errors: result.errors,
        data: updatedData
      });
    }

    return NextResponse.json(
      { error: `Neznáma akcia "${action}".` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Chyba pri organizácii zložiek pacienta:', error);
    return NextResponse.json(
      { error: error.message || 'Chyba servera pri presúvaní súborov.' },
      { status: 500 }
    );
  }
}
