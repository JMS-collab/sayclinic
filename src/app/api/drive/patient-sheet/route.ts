import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parsePatientSheetData, ExtractedPatientData } from '@/services/patientSheetParser';
import dns from 'node:dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // ignore
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
    const { patientName, folderId, fileId } = body;

    if (!patientName && !folderId && !fileId) {
      return NextResponse.json(
        { error: 'Musíte zadať patientName, folderId alebo fileId.' },
        { status: 400 }
      );
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };

    let targetFileId = fileId;
    let targetFileName = '';
    let targetMimeType = '';

    // 1. Ak fileId nebolo zadané priamo, nájdeme ho cez priečinok pacienta
    if (!targetFileId) {
      let resolvedFolderId = folderId;

      // Ak nemáme folderId, vyhľadáme zložku pacienta v "Klienti SAY"
      if (!resolvedFolderId && patientName) {
        // Nájdenie kmeňovej zložky Klienti SAY
        const rootQ = "name = 'Klienti SAY' and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
        const rootRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(rootQ)}&fields=files(id)&supportsAllDrives=true&includeItemsFromAllDrives=true`,
          { headers, signal: AbortSignal.timeout(6000) }
        );
        const rootData = await rootRes.json();
        const rootFolderId = rootData.files?.[0]?.id;

        if (rootFolderId) {
          const escapedName = patientName.replace(/'/g, "\\'");
          const pFolderQ = `'${rootFolderId}' in parents and name = '${escapedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
          const pFolderRes = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(pFolderQ)}&fields=files(id)&supportsAllDrives=true&includeItemsFromAllDrives=true`,
            { headers, signal: AbortSignal.timeout(6000) }
          );
          const pFolderData = await pFolderRes.json();
          resolvedFolderId = pFolderData.files?.[0]?.id;
        }
      }

      if (!resolvedFolderId) {
        return NextResponse.json(
          { error: `Zložka pre pacienta "${patientName || folderId}" nebola na Google Disku nájdená.` },
          { status: 404 }
        );
      }

      // Vyhľadáme tabuľkové súbory v zložke pacienta
      const filesQ = `'${resolvedFolderId}' in parents and trashed = false`;
      const filesRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(filesQ)}&fields=files(id,name,mimeType,webViewLink)&orderBy=modifiedTime desc&supportsAllDrives=true&includeItemsFromAllDrives=true`,
        { headers, signal: AbortSignal.timeout(6000) }
      );
      const filesData = await filesRes.json();
      const files: any[] = filesData.files || [];

      // Priorita 1: Google Spreadsheet
      let matchedFile = files.find(f => f.mimeType === 'application/vnd.google-apps.spreadsheet');

      // Priorita 2: Súbor s názvom obsahujúcim "sheet", "kartoteka", "karta" alebo meno pacienta
      if (!matchedFile) {
        matchedFile = files.find(f => {
          const lower = f.name.toLowerCase();
          return lower.includes('sheet') || lower.includes('kartotek') || lower.includes('karta') || (patientName && lower.includes(patientName.toLowerCase()));
        });
      }

      // Priorita 3: Excel (.xlsx, .xls, .csv)
      if (!matchedFile) {
        matchedFile = files.find(f => {
          const lower = f.name.toLowerCase();
          return lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv') || f.mimeType.includes('spreadsheet') || f.mimeType.includes('excel');
        });
      }

      // Priorita 4: profil_klienta.json (ak už existuje uložený profil)
      if (!matchedFile) {
        matchedFile = files.find(f => f.name.toLowerCase() === 'profil_klienta.json');
      }

      if (!matchedFile) {
        return NextResponse.json({
          success: false,
          error: `V zložke pacienta "${patientName || resolvedFolderId}" sa nenašiel žiadny Google Sheet ani tabuľkový súbor s údajmi.`,
          filesFound: files.map(f => f.name)
        }, { status: 404 });
      }

      targetFileId = matchedFile.id;
      targetFileName = matchedFile.name;
      targetMimeType = matchedFile.mimeType;
    }

    // 2. Stiahnutie obsahu súboru z Google Drive
    let extractedData: ExtractedPatientData;

    if (targetMimeType === 'application/vnd.google-apps.spreadsheet') {
      // Export Google Sheetu ako CSV
      const exportUrl = `https://www.googleapis.com/drive/v3/files/${targetFileId}/export?mimeType=text/csv`;
      const exportRes = await fetch(exportUrl, { headers, signal: AbortSignal.timeout(8000) });

      if (!exportRes.ok) {
        return NextResponse.json(
          { error: `Chyba pri exporte Google Sheetu: ${exportRes.statusText}` },
          { status: exportRes.status }
        );
      }

      const csvText = await exportRes.text();
      extractedData = parsePatientSheetData(csvText, targetFileName, patientName);
    } else {
      // Priame stiahnutie média (JSON, CSV, XLSX)
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${targetFileId}?alt=media`;
      const downloadRes = await fetch(downloadUrl, { headers, signal: AbortSignal.timeout(8000) });

      if (!downloadRes.ok) {
        return NextResponse.json(
          { error: `Chyba pri sťahovaní súboru: ${downloadRes.statusText}` },
          { status: downloadRes.status }
        );
      }

      if (targetFileName.endsWith('.xlsx') || targetFileName.endsWith('.xls') || targetMimeType.includes('excel')) {
        const arrayBuf = await downloadRes.arrayBuffer();
        extractedData = parsePatientSheetData(arrayBuf, targetFileName, patientName);
      } else {
        const textContent = await downloadRes.text();
        extractedData = parsePatientSheetData(textContent, targetFileName, patientName);
      }
    }

    return NextResponse.json({
      success: true,
      fileId: targetFileId,
      fileName: targetFileName,
      extractedData,
      fieldsCount: extractedData.extractedFieldsCount
    });

  } catch (error: any) {
    console.error('Chyba v patient-sheet API:', error);
    return NextResponse.json(
      { error: error?.message || 'Chyba servera pri čítaní Google Sheetu' },
      { status: 500 }
    );
  }
}
