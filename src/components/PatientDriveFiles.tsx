'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getAccessToken, googleSignIn, subscribeWorkspaceAuth } from '@/lib/workspaceAuth';
import { User } from 'firebase/auth';

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
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [driveData, setDriveData] = useState<{
    found: boolean;
    folderLink?: string;
    files: DriveFile[];
    message?: string;
  } | null>(null);

  useEffect(() => {
    const unsub = subscribeWorkspaceAuth((user, token) => {
      setGoogleUser(user);
      setAccessToken(token);
    });
    return () => unsub();
  }, []);

  const effectiveToken = accessToken || (session as any)?.accessToken || null;
  const isConnected = Boolean(effectiveToken || googleUser || session);

  const fetchDriveFiles = useCallback(async () => {
    if (!isConnected || !patientName) return;

    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      const token = (await getAccessToken()) || effectiveToken;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/drive?patientName=${encodeURIComponent(patientName)}`, { headers });
      const data = await res.json();
      setDriveData(data);
    } catch (err) {
      console.error('Chyba pri načítavaní zložky z Google Drive:', err);
    } finally {
      setLoading(false);
    }
  }, [isConnected, patientName, effectiveToken]);

  useEffect(() => {
    fetchDriveFiles();
  }, [fetchDriveFiles]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await googleSignIn();
    } catch (err) {
      console.error('Prihlásenie zlyhalo:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-[#FAF8F5] border border-[#E8E2D9] p-5 rounded-2xl text-center space-y-3">
        <p className="text-xs text-[#8C857B]">
          🔒 Pre prístup ku kartotéke a zložke pacienta na Google Disku pripojte svoj Google účet.
        </p>
        <button
          type="button"
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="gsi-material-button inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          <div className="w-3.5 h-3.5 flex-shrink-0 bg-white p-0.5 rounded-full">
            <svg viewBox="0 0 48 48" className="w-full h-full">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
          </div>
          <span>{isSigningIn ? 'Pripájam...' : 'Pripojiť Google Drive'}</span>
        </button>
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