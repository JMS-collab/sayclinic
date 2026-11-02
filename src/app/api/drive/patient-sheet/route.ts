import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parsePatientSheetData, ExtractedPatientData } from '@/services/patientSheetParser';
import dns from 'node:dns';
import fs from 'node:fs';
import path from 'node:path';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // ignore
}

const LOCAL_DRIVE_PATH = '/Users/Jan/Library/CloudStorage/GoogleDrive-say@sayclinic.sk/Môj disk/Klienti SAY';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const session: any = await getServerSession(authOptions);
    const accessToken = bearerToken || session?.accessToken;

    const body = await req.json();
    const { patientName, folderId, fileId } = body;

    if (!patientName && !folderId && !fileId) {
      return NextResponse.json(
        { error: 'Musíte zadať patientName, folderId alebo fileId.' },
        { status: 400 }
      );
    }

    // LOKÁLNY FALLBACK: Ak nemáme Google OAuth token alebo bežíme na Macu s lokálnym Google Drive
    if (!accessToken && fs.existsSync(LOCAL_DRIVE_PATH) && patientName) {
      try {
        const folders = fs.readdirSync(LOCAL_DRIVE_PATH);
        const normTarget = patientName.normalize('NFC').trim().toLowerCase();
        const matchedFolder = folders.find(f => {
          const normF = f.normalize('NFC').trim().toLowerCase();
          return normF === normTarget || normF.includes(normTarget) || normTarget.includes(normF);
        });

        if (matchedFolder) {
          const folderFullPath = path.join(LOCAL_DRIVE_PATH, matchedFolder);
          const files = fs.readdirSync(folderFullPath);
          
          // Hľadáme .gsheet, .xlsx alebo .csv
          const gsheet = files.find(f => f.endsWith('.gsheet'));
          const xlsx = files.find(f => f.endsWith('.xlsx') || f.endsWith('.xls'));
          const csv = files.find(f => f.endsWith('.csv'));

          if (gsheet) {
            const rawGsheet = fs.readFileSync(path.join(folderFullPath, gsheet), 'utf-8');
            const gMeta = JSON.parse(rawGsheet);
            if (gMeta.doc_id) {
              const exportUrl = `https://docs.google.com/spreadsheets/d/${gMeta.doc_id}/export?format=csv`;
              const expRes = await fetch(exportUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                signal: AbortSignal.timeout(6000),
              });
              if (expRes.ok) {
                const csvText = await expRes.text();
                const extracted = parsePatientSheetData(csvText, gsheet, patientName);
                if (extracted.extractedFieldsCount > 0) {
                  return NextResponse.json({
                    success: true,
                    fileId: gMeta.doc_id,
                    fileName: gsheet,
                    extractedData: extracted,
                    fieldsCount: extracted.extractedFieldsCount,
                    source: 'local_drive_sheet',
                  });
                }
              }
            }
          } else if (xlsx) {
            const fileBuf = fs.readFileSync(path.join(folderFullPath, xlsx));
            const extracted = parsePatientSheetData(fileBuf, xlsx, patientName);
            if (extracted.extractedFieldsCount > 0) {
              return NextResponse.json({
                success: true,
                fileId: xlsx,
                fileName: xlsx,
                extractedData: extracted,
                fieldsCount: extracted.extractedFieldsCount,
                source: 'local_drive_excel',
              });
            }
          } else if (csv) {
            const csvText = fs.readFileSync(path.join(folderFullPath, csv), 'utf-8');
            const extracted = parsePatientSheetData(csvText, csv, patientName);
            if (extracted.extractedFieldsCount > 0) {
              return NextResponse.json({
                success: true,
                fileId: csv,
                fileName: csv,
                extractedData: extracted,
                fieldsCount: extracted.extractedFieldsCount,
                source: 'local_drive_csv',
              });
            }
          }
        }
      } catch (localErr) {
        console.warn('Lokálny fallback pre čítanie Sheetu zlyhal:', localErr);
      }
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Nie ste prihlásený do Google účtu. Kliknite na "Pripojiť Drive" vpravo hore.', needsReauth: true },
        { status: 401 }
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
      let csvText = '';
      // 1. Skúsime export cez Drive API
      try {
        const exportUrl = `https://www.googleapis.com/drive/v3/files/${targetFileId}/export?mimeType=text/csv`;
        const exportRes = await fetch(exportUrl, { headers, signal: AbortSignal.timeout(8000) });
        if (exportRes.ok) {
          csvText = await exportRes.text();
        }
      } catch {
        // fallback
      }

      // 2. Fallback na Docs export
      if (!csvText) {
        try {
          const directUrl = `https://docs.google.com/spreadsheets/d/${targetFileId}/export?format=csv`;
          const dRes = await fetch(directUrl, { headers, signal: AbortSignal.timeout(8000) });
          if (dRes.ok) {
            csvText = await dRes.text();
          }
        } catch {
          // ignore
        }
      }

      if (!csvText) {
        return NextResponse.json(
          { error: `Chyba pri exporte Google Sheetu do formátu CSV.` },
          { status: 502 }
        );
      }

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
