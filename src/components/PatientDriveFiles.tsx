'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  iconLink?: string;
  thumbnailLink?: string;
}

interface PatientDriveFilesProps {
  patientName: string;
}

export default function PatientDriveFiles({ patientName }: PatientDriveFilesProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<boolean>(true);
  const [driveData, setDriveData] = useState<{
    found: boolean;
    folderLink?: string;
    files: DriveFile[];
    message?: string;
  } | null>(null);

  useEffect(() => {
    if (!session || !patientName) return;

    setLoading(true);
    fetch(`/api/drive?patientName=${encodeURIComponent(patientName)}`)
      .then((res) => res.json())
      .then((data) => {
        setDriveData(data);
      })
      .catch((err) => console.error('Chyba pri načítavaní zložky z Google Drive:', err))
      .finally(() => setLoading(false));
  }, [session, patientName]);

  if (!session) {
    return (
      <div className="bg-[#FBF9F6] border border-[#E8E2D9] p-4 rounded-xl text-center text-xs text-[#8C857B]">
        🔒 Pre prístup ku kartotéke na Google Disku sa musíte prihlásiť cez Google účet.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#FBF9F6] border border-[#E8E2D9] p-4 rounded-xl text-center text-xs text-[#8C857B] animate-pulse">
        🔎 Vyhľadávam zložku pacienta v "Klienti SAY" na Google Disku...
      </div>
    );
  }

  if (!driveData || !driveData.found) {
    return (
      <div className="bg-[#FBF9F6] border border-[#E8E2D9] p-4 rounded-xl text-xs text-[#8C857B] space-y-2">
        <p className="font-bold text-[#2C2A29]">📂 Zložka na Google Disku nebola nájdená</p>
        <p className="text-[11px]">
          {driveData?.message || `V zložke "Klienti SAY" sa nenachádza podzložka pre mená: "${patientName}".`}
        </p>
      </div>
    );
  }

  // Odseparovanie Google Sheet súboru (kartotéky) od ostatných dokumentov/fotiek
  const sheetFile = driveData.files.find((f) =>
    f.mimeType.includes('spreadsheet') || f.name.toLowerCase().includes('sheet') || f.name.toLowerCase().includes('kartoteka')
  );
  const otherFiles = driveData.files.filter((f) => f.id !== sheetFile?.id);

  return (
    <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 space-y-4 shadow-sm">
      <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📁</span>
          <div>
            <h3 className="font-brand text-sm font-bold text-[#2C2A29] uppercase">Google Drive Dokumentácia</h3>
            <p className="text-[10px] text-[#8C857B] tracking-wider uppercase">Propojené so zložkou "Klienti SAY"</p>
          </div>
        </div>

        {driveData.folderLink && (
          <a
            href={driveData.folderLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-[#C5A059] hover:underline uppercase tracking-wider flex items-center gap-1"
          >
            Otvoriť celú zložku ↗
          </a>
        )}
      </div>

      {/* Hlavné tlačidlo pre otváranie Google Sheet Kartotéky */}
      {sheetFile ? (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h4 className="font-bold text-xs text-emerald-950">{sheetFile.name}</h4>
              <p className="text-[10px] text-emerald-700">Oficiálna Google Sheet kartotéka klienta</p>
            </div>
          </div>
          <a
            href={sheetFile.webViewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] uppercase px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            Otvoriť Kartotéku ↗
          </a>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-800">
          ⚠️ V zložke pacienta sa nenašiel žiadny Google Sheet súbor.
        </div>
      )}

      {/* Ostatné súbory v zložke (PDF, fotky, nálezy) */}
      {otherFiles.length > 0 && (
        <div className="space-y-2 pt-2">
          <h4 className="text-[10px] uppercase font-bold text-[#8C857B]">Ďalšie súbory v zložke ({otherFiles.length})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {otherFiles.map((file) => (
              <a
                key={file.id}
                href={file.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg border border-[#E8E2D9] hover:border-[#C5A059] bg-[#FBF9F6] transition-colors text-xs group"
              >
                <span>📄</span>
                <span className="truncate flex-1 font-medium text-[#2C2A29] group-hover:text-[#C5A059]">{file.name}</span>
                <span className="text-[10px] text-[#8C857B]">↗</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}