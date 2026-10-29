'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  getAccessToken,
  googleSignIn,
  subscribeWorkspaceAuth,
  setExternalAccessToken,
} from '@/lib/workspaceAuth';
import { User } from 'firebase/auth';
import {
  HardDrive,
  FolderPlus,
  FolderOpen,
  ExternalLink,
  RefreshCw,
  FileText,
  Camera,
  FileCheck,
  Activity,
  Table2,
  AlertCircle,
  CheckCircle2,
  Settings,
  Sparkles,
  Loader2,
  FolderCheck,
} from 'lucide-react';
import { DriveClientService } from '@/services/driveClientService';
import { PatientCloudService, Patient } from '@/services/patientCloudService';
import { CategorizedPatientFiles } from '@/services/patientDriveOrganizerService';
import GoogleDriveModal from './GoogleDriveModal';

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
  patient?: Patient;
  onPatientUpdated?: (patient: Patient) => void;
  categorizedFiles?: CategorizedPatientFiles | null;
  onOrganizeFiles?: () => void;
  isOrganizing?: boolean;
}

export default function PatientDriveFiles({ 
  patientName, 
  patient, 
  onPatientUpdated,
  categorizedFiles,
  onOrganizeFiles,
  isOrganizing
}: PatientDriveFilesProps) {
  const { data: session } = useSession();
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [driveData, setDriveData] = useState<{
    found: boolean;
    folderLink?: string;
    files: DriveFile[];
    message?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    const unsub = subscribeWorkspaceAuth((user, token, err) => {
      setGoogleUser(user);
      setAccessToken(token);
      if (err) setAuthError(err);
    });
    return () => unsub();
  }, []);

  const effectiveToken = accessToken || (session as any)?.accessToken || null;
  const isConnected = Boolean(effectiveToken);

  const fetchDriveFiles = useCallback(async (overrideToken?: string) => {
    const tokenToUse = overrideToken || (await getAccessToken()) || effectiveToken;
    if (!tokenToUse || !patientName) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setStatusNotice(null);
    try {
      // 1. Primárne načítame súbory priamo cez klientsky servis s CORS (bez serverových timeoutov)
      const directData = await DriveClientService.getPatientFiles(tokenToUse, patientName);
      if (directData && (directData.found || directData.files.length > 0)) {
        setDriveData(directData as any);
        return;
      }

      // 2. Fallback na serverless proxy route
      const res = await fetch(`/api/drive?patientName=${encodeURIComponent(patientName)}`, {
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
        },
      });
      const data = await res.json();

      if (res.status === 401 || data?.needsReauth) {
        setExternalAccessToken(null);
        setAuthError(data?.error || 'Platnosť pripojenia ku Google Drive vypršala. Pripojte účet znova.');
        setDriveData(null);
        return;
      }

      setDriveData(data);
    } catch (err) {
      console.error('Chyba pri načítavaní zložky z Google Drive:', err);
      setStatusNotice({
        type: 'error',
        text: 'Nepodarilo sa spojiť s Google Drive API. Skúste obnoviť pripojenie.',
      });
    } finally {
      setLoading(false);
    }
  }, [patientName, effectiveToken]);

  useEffect(() => {
    if (isConnected) {
      fetchDriveFiles();
    }
  }, [isConnected, fetchDriveFiles]);

  // Automatické prečítanie súborov po uložení nového vyšetrenia / dokumentu
  useEffect(() => {
    const handleSaved = (e: any) => {
      if (!patientName || !e?.detail?.patientName || e.detail.patientName.toLowerCase() === patientName.toLowerCase()) {
        fetchDriveFiles();
      }
    };
    window.addEventListener('say_clinic_record_saved', handleSaved);
    return () => window.removeEventListener('say_clinic_record_saved', handleSaved);
  }, [fetchDriveFiles, patientName]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    setStatusNotice(null);
    try {
      const res = await googleSignIn();
      if (res?.accessToken) {
        setExternalAccessToken(res.accessToken, res.user);
        await fetchDriveFiles(res.accessToken);
      } else {
        setShowDriveModal(true);
      }
    } catch (err: any) {
      if (
        err?.code !== 'auth/popup-closed-by-user' &&
        err?.code !== 'auth/cancelled-popup-request'
      ) {
        setAuthError(err?.message || 'Prihlásenie do Google Drive sa nepodarilo dokončiť.');
        setShowDriveModal(true);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleCreateDriveFolder = async () => {
    setIsCreatingFolder(true);
    setStatusNotice(null);
    try {
      let token = (await getAccessToken()) || effectiveToken;
      if (!token) {
        const signResult = await googleSignIn();
        token = signResult?.accessToken || null;
      }
      if (!token) {
        setShowDriveModal(true);
        setStatusNotice({
          type: 'error',
          text: 'Pre vytvorenie zložky na Google Disku sa najprv prihláste cez Google účet.',
        });
        return;
      }

      // Primárne vytvoríme priamo cez prehliadač
      try {
        const directFolder = await DriveClientService.ensurePatientFolder(token, patientName);
        if (directFolder?.folderId) {
          setStatusNotice({
            type: 'success',
            text: `Zložka a medicínske podzložky pre "${patientName}" boli na Google Disku úspešne pripravené.`,
          });
          await fetchDriveFiles(token);
          return;
        }
      } catch (directErr) {
        console.warn('Priame zakladanie priečinka zlyhalo, prepínam na proxy:', directErr);
      }

      const res = await fetch('/api/drive/create-patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ patientName }),
      });
      const data = await res.json();
      if (res.status === 401) {
        setExternalAccessToken(null);
        setAuthError('Platnosť pripojenia vypršala. Prihláste sa prosím znova.');
        setShowDriveModal(true);
        return;
      }
      if (data.success) {
        setStatusNotice({
          type: 'success',
          text: `Zložka a podzložky pre "${patientName}" boli v Google Drive úspešne vytvorené.`,
        });
        await fetchDriveFiles(token);
      } else {
        setStatusNotice({
          type: 'error',
          text: `Chyba pri zakladaní zložky: ${data.error || 'Neznáma chyba'}`,
        });
      }
    } catch (err) {
      console.error(err);
      setStatusNotice({
        type: 'error',
        text: 'Chyba komunikácie s Google Drive API.',
      });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleExtractFromSheet = async () => {
    if (!sheetFile || !effectiveToken) return;
    setIsExtracting(true);
    setStatusNotice(null);
    try {
      const res = await DriveClientService.readAndExtractPatientSheet(
        effectiveToken,
        patientName,
        patient?.driveFolderId,
        sheetFile.id
      );

      if (res.success && res.data) {
        const d = res.data;
        if (patient) {
          const updatedPatient: Patient = {
            ...patient,
            phone: (d.phone && d.phone !== '---') ? d.phone : patient.phone,
            email: (d.email && d.email !== '---') ? d.email : patient.email,
            address: (d.address && d.address !== '---') ? d.address : patient.address,
            birthNumber: (d.birthNumber && d.birthNumber !== 'Importované z Drive') ? d.birthNumber : patient.birthNumber,
            dob: (d.dob && d.dob !== '---') ? d.dob : patient.dob,
            insurance: (d.insurance && d.insurance !== 'Drive Klient') ? d.insurance : patient.insurance,
          };
          await PatientCloudService.savePatient(updatedPatient, effectiveToken);
          if (onPatientUpdated) {
            onPatientUpdated(updatedPatient);
          }
        }

        const summaryParts: string[] = [];
        if (d.phone) summaryParts.push(`Tel: ${d.phone}`);
        if (d.email) summaryParts.push(`Email: ${d.email}`);
        if (d.address) summaryParts.push(`Bydlisko: ${d.address}`);
        if (d.birthNumber) summaryParts.push(`RČ: ${d.birthNumber}`);
        if (d.dob) summaryParts.push(`Nar.: ${d.dob}`);

        setStatusNotice({
          type: 'success',
          text: `Údaje úspešne načítané zo Sheetu (${summaryParts.join(', ') || 'Nájdené údaje boli synchronizované do karty pacienta'}).`,
        });
      } else {
        setStatusNotice({
          type: 'error',
          text: res.error || 'V súbore sa nepodarilo rozpoznať kontaktné údaje pacienta.',
        });
      }
    } catch (err: any) {
      setStatusNotice({
        type: 'error',
        text: 'Chyba pri čítaní zo Sheetu: ' + (err?.message || 'Neznáma chyba'),
      });
    } finally {
      setIsExtracting(false);
    }
  };

  if (!isConnected) {
    return (
      <>
        <div className="bg-[#FAF8F5] border border-[#E8E2D9] p-6 rounded-2xl text-center space-y-3.5">
          <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E2D9] flex items-center justify-center mx-auto text-[#C5A059]">
            <HardDrive className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="font-brand text-base font-bold text-[#2C2A29] uppercase tracking-wider">
              Pripojenie ku Google Drive
            </h4>
            <p className="text-xs text-[#8C857B]">
              {googleUser?.email
                ? `Účet ${googleUser.email} vyžaduje obnovenie prístupového tokenu pre prácu so zložkou pacienta v "Klienti SAY".`
                : 'Pre prístup ku kartotéke a zložke pacienta na Google Disku pripojte svoj Google účet.'}
            </p>
          </div>

          {authError && (
            <div className="max-w-md mx-auto p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="gsi-material-button inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <div className="w-4 h-4 flex-shrink-0 bg-white p-0.5 rounded-full">
                <svg viewBox="0 0 48 48" className="w-full h-full">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
              </div>
              <span>{isSigningIn ? 'Pripájam Google Drive...' : 'Pripojiť Google Drive'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDriveModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-[#2C2A29] text-xs font-semibold hover:border-[#C5A059] transition-all cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Pomocník & Správa</span>
            </button>
          </div>
        </div>

        <GoogleDriveModal
          isOpen={showDriveModal}
          onClose={() => setShowDriveModal(false)}
        />
      </>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#FBF9F6] border border-[#E8E2D9] p-5 rounded-xl text-center text-xs text-[#8C857B] flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 text-[#C5A059] animate-spin" />
        <span>Vyhľadávam zložku pacienta v &quot;Klienti SAY&quot; na Google Disku...</span>
      </div>
    );
  }

  if (!driveData || !driveData.found) {
    return (
      <div className="bg-[#FBF9F6] border border-[#E8E2D9] p-5 rounded-xl text-xs space-y-3">
        {statusNotice && (
          <div
            className={`p-3 rounded-xl flex items-center gap-2 ${
              statusNotice.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {statusNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusNotice.text}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="font-bold text-[#2C2A29] flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-[#C5A059]" />
              <span>Zložka pacienta na Google Disku zatiaľ nebola vytvorená</span>
            </p>
            <p className="text-[11px] text-[#8C857B] mt-0.5">
              V kmeňovej zložke <strong className="text-[#2C2A29]">Klienti SAY</strong> sa zatiaľ nenachádza priečinok pre klienta <strong>{patientName}</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchDriveFiles()}
              className="px-3 py-2 bg-white hover:bg-[#FAF8F5] text-[#2C2A29] border border-[#E8E2D9] rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Znova načítať z Google Drive"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#8C857B]" />
              <span>Obnoviť</span>
            </button>
            <button
              type="button"
              onClick={handleCreateDriveFolder}
              disabled={isCreatingFolder}
              className="px-4 py-2 bg-[#2C2A29] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              <FolderPlus className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>{isCreatingFolder ? 'Vytváram v Drive...' : 'Vytvoriť zložku & podzložky v Drive'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Rozdelenie na podzložky a bežné súbory
  const subfoldersList = (driveData.files || []).filter((f) => f.mimeType === 'application/vnd.google-apps.folder');
  const actualFiles = (driveData.files || []).filter((f) => f.mimeType !== 'application/vnd.google-apps.folder');

  // Odseparovanie Google Sheet súboru (kartotéky) od ostatných dokumentov/fotiek
  const sheetFile = actualFiles.find((f) =>
    f.mimeType.includes('spreadsheet') || f.name.toLowerCase().includes('sheet') || f.name.toLowerCase().includes('kartoteka')
  );
  const otherFiles = actualFiles.filter((f) => f.id !== sheetFile?.id);

  // Zoznam požadovaných štandardných podzložiek
  const STANDARD_SUBFOLDERS = [
    { name: 'Fotodokumentácia', Icon: Camera, desc: 'Pred/pooperačné fotografie' },
    { name: 'Dokumentácia', Icon: FileText, desc: 'Lekárske správy a nálezy' },
    { name: 'Predoperačné vyšetrenia', Icon: Activity, desc: 'Odbery, EKG, interné vyšetrenia' },
    { name: 'Súhlasy a protokoly', Icon: FileCheck, desc: 'Informované súhlasy & protokoly' },
  ];

  return (
    <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 space-y-4">
      {statusNotice && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            statusNotice.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {statusNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusNotice.text}</span>
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center border-b border-[#E8E2D9]/80 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E8E2D9] flex items-center justify-center text-[#C5A059]">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-brand text-sm font-bold text-[#2C2A29] uppercase tracking-wider">
              Google Drive: Klienti SAY / {patientName}
            </h3>
            <p className="text-[10px] text-[#8C857B] tracking-wider uppercase">
              Cloudové úložisko kliniky SAY CLINIC
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCreateDriveFolder}
            disabled={isCreatingFolder}
            className="text-[10px] font-bold text-[#8C857B] hover:text-[#2C2A29] uppercase tracking-wider px-2.5 py-1.5 bg-[#FBF9F6] border border-[#E8E2D9] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Doplniť chýbajúce podzložky"
          >
            <RefreshCw className={`w-3 h-3 text-[#C5A059] ${isCreatingFolder ? 'animate-spin' : ''}`} />
            <span>{isCreatingFolder ? 'Synchronizujem...' : 'Doplniť podzložky'}</span>
          </button>
          {driveData.folderLink && (
            <a
              href={driveData.folderLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-[#C5A059] hover:text-[#2C2A29] uppercase tracking-wider flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E8E2D9]/80 hover:border-[#C5A059] transition-colors"
            >
              <span>Otvoriť na Disku</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Štandardné podzložky pacienta na Google Disku */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-[10px] uppercase font-bold tracking-wider text-[#8C857B]">
            Priečinky pacienta v Klienti SAY
          </h4>
          {categorizedFiles && (
            <span className="text-[10px] text-[#8C857B] font-medium">
              Celkovo {categorizedFiles.totalCount} súborov na Disku
            </span>
          )}
        </div>

        {/* UPOZORNENIE A AKCIA NA NEZARADENÉ SÚBORY */}
        {categorizedFiles && categorizedFiles.rootUnsorted.length > 0 && (
          <div className="mb-3 bg-sky-50 border border-sky-200/90 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-sky-950 font-medium">
              <FolderOpen className="w-4 h-4 text-sky-700 shrink-0" />
              <div>
                <p className="font-bold text-sky-900 leading-tight">
                  {categorizedFiles.rootUnsorted.length} nezaradených súborov v koreni zložky
                </p>
                <p className="text-[10px] text-sky-700 leading-tight mt-0.5">
                  Fotky, predoperačné vyšetrenia a správy ležia v hlavnom priečinku.
                </p>
              </div>
            </div>
            {onOrganizeFiles && (
              <button
                type="button"
                onClick={onOrganizeFiles}
                disabled={isOrganizing}
                className="bg-sky-800 hover:bg-sky-900 text-white font-bold text-[10px] uppercase px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs disabled:opacity-60"
              >
                {isOrganizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <FolderCheck className="w-3 h-3" />}
                <span>⚡ Roztriediť do podzložiek</span>
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {STANDARD_SUBFOLDERS.map((std) => {
            const foundSub = subfoldersList.find((sub) => sub.name.toLowerCase() === std.name.toLowerCase());
            const SubIcon = std.Icon;

            let fileCount: number | null = null;
            if (categorizedFiles) {
              const lower = std.name.toLowerCase();
              if (lower.includes('foto')) fileCount = categorizedFiles.fotodokumentacia.length;
              else if (lower.includes('predoperac')) fileCount = categorizedFiles.predoperacne.length;
              else if (lower.includes('dokument')) fileCount = categorizedFiles.dokumentacia.length;
              else if (lower.includes('suhlas')) fileCount = categorizedFiles.suhlasy.length;
            }

            return (
              <div
                key={std.name}
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                  foundSub ? 'bg-[#FBF9F6] border-[#E8E2D9] hover:border-[#C5A059]' : 'bg-stone-50 border-stone-200 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <SubIcon className="w-4 h-4 text-[#C5A059]" />
                    {foundSub ? (
                      <span className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                        {fileCount !== null ? `${fileCount} súborov` : 'Vytvorená'}
                      </span>
                    ) : (
                      <span className="text-[9px] bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded">
                        Chýba
                      </span>
                    )}
                  </div>
                  <h5 className="font-bold text-xs text-[#2C2A29]">{std.name}</h5>
                  <p className="text-[10px] text-[#8C857B] mt-0.5 leading-tight">{std.desc}</p>
                </div>

                <div className="pt-2 mt-2 border-t border-[#E8E2D9]/60 flex justify-between items-center">
                  {foundSub?.webViewLink ? (
                    <a
                      href={foundSub.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-[#C5A059] hover:underline flex items-center gap-1"
                    >
                      <span>Otvoriť podzložku</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCreateDriveFolder}
                      disabled={isCreatingFolder}
                      className="text-[10px] font-bold text-[#8C857B] hover:text-[#2C2A29] cursor-pointer"
                    >
                      + Vytvoriť
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hlavné tlačidlo pre otváranie Google Sheet Kartotéky a extrakciu údajov */}
      {sheetFile ? (
        <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Table2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <h4 className="font-bold text-xs text-emerald-950">{sheetFile.name}</h4>
              <p className="text-[10px] text-emerald-700">Oficiálna Google Sheet kartotéka klienta</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={handleExtractFromSheet}
              disabled={isExtracting}
              className="flex-1 sm:flex-none bg-[#2C2A29] hover:bg-[#C5A059] text-white font-bold text-[10px] uppercase px-3.5 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
              title="Prečítať telefón, e-mail, adresu a RČ zo Sheetu a uložiť do karty pacienta"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Čítam Sheet...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>⚡ Doplniť do karty</span>
                </>
              )}
            </button>
            <a
              href={sheetFile.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] uppercase px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Otvoriť Kartotéku</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      ) : null}

      {/* Ostatné súbory v zložke (PDF, fotky, nálezy) */}
      {otherFiles.length > 0 && (
        <div className="space-y-2 pt-2">
          <h4 className="text-[10px] uppercase font-bold tracking-wider text-[#8C857B]">
            Súbory priamo v koreni zložky ({otherFiles.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {otherFiles.map((file) => (
              <a
                key={file.id}
                href={file.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-[#E8E2D9] hover:border-[#C5A059] bg-[#FBF9F6] transition-colors text-xs group"
              >
                <FileText className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                <span className="truncate flex-1 font-medium text-[#2C2A29] group-hover:text-[#C5A059]">
                  {file.name}
                </span>
                <ExternalLink className="w-3 h-3 text-[#8C857B] shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}