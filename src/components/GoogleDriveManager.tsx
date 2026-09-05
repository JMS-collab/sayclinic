'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signIn as nextAuthSignIn } from 'next-auth/react';
import {
  initWorkspaceAuth,
  googleSignIn,
  googleLogout,
  getAccessToken,
  subscribeWorkspaceAuth,
} from '@/lib/workspaceAuth';
import { User } from 'firebase/auth';
import {
  Folder,
  FileText,
  Table,
  Image as ImageIcon,
  ExternalLink,
  Trash2,
  FolderPlus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Users,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Home,
} from 'lucide-react';

interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  owners?: { displayName: string; emailAddress: string }[];
}

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

export default function GoogleDriveManager() {
  const { data: nextAuthSession } = useSession();
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // File browser state
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: null, name: 'Môj Google Disk' },
  ]);

  // Modals state
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Destructive action confirmation state (MANDATORY for Workspace guidelines)
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  // Status & notifications
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // 1. Subscribe to Workspace Auth
  useEffect(() => {
    initWorkspaceAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
      },
      () => {
        // Not signed in via Firebase
      }
    );

    const unsubscribe = subscribeWorkspaceAuth((user, token) => {
      setGoogleUser(user);
      setAccessToken(token);
    });

    return () => unsubscribe();
  }, []);

  // Effective token (either from Firebase client-side OAuth or NextAuth session)
  const effectiveToken = accessToken || (nextAuthSession as any)?.accessToken || null;
  const isConnected = Boolean(effectiveToken || googleUser || nextAuthSession);

  // Helper to get auth header for API requests
  const getAuthHeaders = useCallback(async (): Promise<HeadersInit> => {
    const token = (await getAccessToken()) || effectiveToken;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, [effectiveToken]);

  // Load files from Google Drive
  const loadFiles = useCallback(async (folderId: string | null = null, query: string = '') => {
    setIsLoadingFiles(true);
    setAuthError(null);

    try {
      const headers = await getAuthHeaders();
      let url = '/api/drive/files?pageSize=60';
      if (folderId) {
        url += `&folderId=${encodeURIComponent(folderId)}`;
      }
      if (query.trim()) {
        url += `&q=${encodeURIComponent(query.trim())}`;
      }

      const res = await fetch(url, { headers });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Nepodarilo sa načítať súbory z Google Disku.');
      }

      setFiles(data.files || []);
    } catch (err: any) {
      console.error('Chyba pri načítavaní Google Drive súborov:', err);
      setAuthError(err.message || 'Chyba spojenia s Google Drive.');
    } finally {
      setIsLoadingFiles(false);
    }
  }, [getAuthHeaders]);

  // Reload when token or folder changes
  useEffect(() => {
    if (isConnected) {
      loadFiles(currentFolderId, searchQuery);
    }
  }, [isConnected, currentFolderId, searchQuery, loadFiles]);

  // Handle Google Sign-in with Firebase popup (Workspace skill requirement)
  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setAccessToken(res.accessToken);
        setActionSuccessMsg('Google Disk bol úspešne prepojený!');
      }
    } catch (err: any) {
      console.error('Chyba Google prihlásenia:', err);
      // Fallback to NextAuth signIn if user popup was blocked or preferred
      if (err?.code === 'auth/popup-blocked') {
        nextAuthSignIn('google');
      } else {
        setAuthError(err.message || 'Prihlásenie cez Google zlyhalo.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = async () => {
    await googleLogout();
    setGoogleUser(null);
    setAccessToken(null);
    setFiles([]);
    setActionSuccessMsg('Google účet bol odpojený.');
  };

  // Navigate into folder
  const handleFolderClick = (folder: DriveFileItem) => {
    setCurrentFolderId(folder.id);
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setSearchQuery('');
  };

  // Navigate via breadcrumbs
  const handleBreadcrumbClick = (crumb: BreadcrumbItem, index: number) => {
    setCurrentFolderId(crumb.id);
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
    setSearchQuery('');
  };

  // Create new folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setIsCreatingFolder(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/drive/files', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentId: currentFolderId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Nepodarilo sa vytvoriť priečinok.');
      }

      setShowNewFolderModal(false);
      setNewFolderName('');
      setActionSuccessMsg(`Priečinok "${data.folder.name}" bol vytvorený.`);
      loadFiles(currentFolderId, searchQuery);
    } catch (err: any) {
      setAuthError(err.message || 'Chyba pri vytváraní priečinka.');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // Confirm and delete file (Destructive operation confirmation)
  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;

    setIsDeletingFile(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/drive/files?fileId=${encodeURIComponent(fileToDelete.id)}`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Nepodarilo sa odstrániť súbor.');
      }

      setActionSuccessMsg(`"${fileToDelete.name}" bol odstránený z Google Disku.`);
      setFileToDelete(null);
      loadFiles(currentFolderId, searchQuery);
    } catch (err: any) {
      setAuthError(err.message || 'Chyba pri mazaní.');
    } finally {
      setIsDeletingFile(false);
    }
  };

  // Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadFiles(currentFolderId, searchQuery);
  };

  // Format file size
  const formatFileSize = (bytes?: string) => {
    if (!bytes) return '—';
    const num = parseInt(bytes, 10);
    if (isNaN(num)) return '—';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format mime type icon
  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') {
      return <Folder className="w-5 h-5 text-[#C5A059] fill-[#C5A059]/20 flex-shrink-0" />;
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) {
      return <Table className="w-5 h-5 text-emerald-600 flex-shrink-0" />;
    }
    if (mimeType.includes('image')) {
      return <ImageIcon className="w-5 h-5 text-indigo-500 flex-shrink-0" />;
    }
    return <FileText className="w-5 h-5 text-[#8C857B] flex-shrink-0" />;
  };

  // Quick navigate to "Klienti SAY"
  const handleGoToKlientiSAY = async () => {
    setIsLoadingFiles(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/drive/files?q=Klienti SAY', { headers });
      const data = await res.json();
      const klientiFolder = data.files?.find(
        (f: DriveFileItem) => f.mimeType === 'application/vnd.google-apps.folder' && f.name.includes('Klienti')
      );
      if (klientiFolder) {
        setCurrentFolderId(klientiFolder.id);
        setBreadcrumbs([
          { id: null, name: 'Môj Disk' },
          { id: klientiFolder.id, name: klientiFolder.name },
        ]);
      } else {
        setAuthError('Zložka "Klienti SAY" nebola nájdená.');
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER & STATUS BAR */}
      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FAF8F5] to-[#E8E2D9] border border-[#C5A059]/30 flex items-center justify-center shadow-xs">
              <HardDrive className="w-6 h-6 text-[#C5A059]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-brand text-xl font-bold text-[#2C2A29] uppercase tracking-wide">
                  Google Drive Integrácia
                </h2>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Pripojené
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    Nepripojené
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8C857B] mt-0.5">
                Bezpečný prístup k dokumentácii, kartotékam a fotografiám pacientov SAY CLINIC.
              </p>
            </div>
          </div>

          {/* AUTHENTICATION CONTROLS */}
          <div className="flex items-center gap-2">
            {!isConnected ? (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isAuthenticating}
                className="gsi-material-button inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E2D9] bg-white hover:bg-[#FAF8F5] text-[#2C2A29] text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <div className="w-4 h-4 flex-shrink-0">
                  <svg viewBox="0 0 48 48" className="w-4 h-4">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                </div>
                <span>{isAuthenticating ? 'Pripájam Google účet...' : 'Prihlásiť sa cez Google'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-[#2C2A29]">
                    {googleUser?.displayName || (nextAuthSession?.user as any)?.name || 'Google Používateľ'}
                  </p>
                  <p className="text-[10px] text-[#8C857B]">
                    {googleUser?.email || (nextAuthSession?.user as any)?.email || 'Autorizovaný Google účet'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  title="Odpojiť Google účet"
                  className="p-2.5 rounded-xl border border-[#E8E2D9] hover:border-rose-300 hover:bg-rose-50 text-[#8C857B] hover:text-rose-600 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ALERTS */}
        {actionSuccessMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{actionSuccessMsg}</span>
            </div>
            <button
              onClick={() => setActionSuccessMsg(null)}
              className="text-emerald-700 hover:underline text-[10px] font-bold"
            >
              Zatvoriť
            </button>
          </div>
        )}

        {authError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{authError}</span>
            </div>
            <button
              onClick={() => setAuthError(null)}
              className="text-rose-700 hover:underline text-[10px] font-bold"
            >
              Zatvoriť
            </button>
          </div>
        )}
      </div>

      {/* MAIN BROWSER CONTENT */}
      {isConnected ? (
        <div className="bg-white border border-[#E8E2D9] rounded-2xl shadow-xs overflow-hidden">
          {/* TOOLBAR */}
          <div className="p-4 border-b border-[#E8E2D9] bg-[#FAF8F5] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* SEARCH */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#8C857B] absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Hľadať súbory a zložky pacientov..."
                className="w-full bg-white border border-[#E8E2D9] rounded-xl pl-9 pr-3 py-2 text-xs text-[#2C2A29] placeholder-[#8C857B] focus:border-[#C5A059] outline-none"
              />
            </form>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGoToKlientiSAY}
                className="px-3 py-2 rounded-xl bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-xs font-semibold text-[#2C2A29] flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Klienti SAY</span>
              </button>

              <button
                type="button"
                onClick={() => setShowNewFolderModal(true)}
                className="px-3 py-2 rounded-xl bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-xs font-semibold text-[#2C2A29] flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Nový priečinok</span>
              </button>

              <button
                type="button"
                onClick={() => loadFiles(currentFolderId, searchQuery)}
                disabled={isLoadingFiles}
                title="Obnoviť"
                className="p-2 rounded-xl bg-white border border-[#E8E2D9] hover:bg-[#FAF8F5] text-[#8C857B] transition-all cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin text-[#C5A059]' : ''}`} />
              </button>
            </div>
          </div>

          {/* BREADCRUMBS */}
          <div className="px-5 py-2.5 border-b border-[#E8E2D9] bg-white flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => handleBreadcrumbClick({ id: null, name: 'Môj Google Disk' }, 0)}
              className="text-[#8C857B] hover:text-[#2C2A29] font-medium flex items-center gap-1 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Disk</span>
            </button>
            {breadcrumbs.slice(1).map((crumb, idx) => (
              <React.Fragment key={crumb.id || idx}>
                <ChevronRight className="w-3.5 h-3.5 text-[#8C857B]/60 flex-shrink-0" />
                <button
                  type="button"
                  onClick={() => handleBreadcrumbClick(crumb, idx + 1)}
                  className={`truncate max-w-[160px] cursor-pointer ${
                    idx === breadcrumbs.length - 2
                      ? 'font-bold text-[#2C2A29]'
                      : 'text-[#8C857B] hover:text-[#2C2A29]'
                  }`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* FILE LIST TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E8E2D9] text-[10px] font-bold text-[#8C857B] uppercase tracking-wider bg-[#FAF8F5]/50">
                  <th className="py-3 px-5">Názov</th>
                  <th className="py-3 px-4 hidden md:table-cell">Veľkosť</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Upravené</th>
                  <th className="py-3 px-5 text-right">Akcie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]/60 text-xs">
                {isLoadingFiles ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-[#8C857B]">
                      <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-[#C5A059]" />
                      <span>Načítavam súbory z Google Disku...</span>
                    </td>
                  </tr>
                ) : files.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-[#8C857B]">
                      <Folder className="w-8 h-8 mx-auto mb-2 text-[#8C857B]/40" />
                      <p className="font-semibold text-[#2C2A29]">V tomto priečinku sa nenachádzajú žiadne položky</p>
                      <p className="text-[11px] mt-1">Môžete vytvoriť nový priečinok alebo nahrať dokumentáciu.</p>
                    </td>
                  </tr>
                ) : (
                  files.map((file) => {
                    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                    return (
                      <tr
                        key={file.id}
                        className="hover:bg-[#FAF8F5] transition-colors group"
                      >
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            {getFileIcon(file.mimeType)}
                            <div className="min-w-0">
                              {isFolder ? (
                                <button
                                  type="button"
                                  onClick={() => handleFolderClick(file)}
                                  className="font-semibold text-[#2C2A29] hover:text-[#C5A059] text-left truncate block cursor-pointer"
                                >
                                  {file.name}
                                </button>
                              ) : (
                                <span className="font-medium text-[#2C2A29] truncate block">
                                  {file.name}
                                </span>
                              )}
                              <span className="text-[10px] text-[#8C857B] block truncate">
                                {isFolder ? 'Priečinok' : file.mimeType.split('.').pop() || 'Súbor'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-[#8C857B] hidden md:table-cell">
                          {isFolder ? '—' : formatFileSize(file.size)}
                        </td>

                        <td className="py-3.5 px-4 text-[#8C857B] hidden sm:table-cell">
                          {file.modifiedTime
                            ? new Date(file.modifiedTime).toLocaleDateString('sk-SK')
                            : '—'}
                        </td>

                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Otvoriť na Google Drive"
                                className="p-1.5 rounded-lg text-[#8C857B] hover:text-[#C5A059] hover:bg-white transition-all"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => setFileToDelete(file)}
                              title="Odstrániť z Google Drive"
                              className="p-1.5 rounded-lg text-[#8C857B] hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CONNECT CALLOUT IF NOT SIGNED IN */
        <div className="bg-[#FAF8F5] border border-[#C5A059]/30 rounded-2xl p-8 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white border border-[#E8E2D9] flex items-center justify-center shadow-xs">
            <HardDrive className="w-7 h-7 text-[#C5A059]" />
          </div>
          <div>
            <h3 className="font-brand text-lg font-bold text-[#2C2A29] uppercase">
              Prepojenie s Google Drive
            </h3>
            <p className="text-xs text-[#8C857B] mt-1.5 leading-relaxed max-w-md mx-auto">
              Prihláste sa cez svoj Google účet s povolením pre Google Drive. Získate okamžitý prístup ku kartotéke v zložke <strong>„Klienti SAY“</strong>, fotografiám a zdravotným záznamom.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isAuthenticating}
            className="gsi-material-button inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            <div className="w-4 h-4 flex-shrink-0 bg-white p-0.5 rounded-full">
              <svg viewBox="0 0 48 48" className="w-full h-full">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
            </div>
            <span>{isAuthenticating ? 'Otváram Google okno...' : 'Pripojiť Google Drive účet'}</span>
          </button>
        </div>
      )}

      {/* CREATE NEW FOLDER MODAL */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <h3 className="font-brand text-sm font-bold text-[#2C2A29] uppercase">
              Nový priečinok na Google Disku
            </h3>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2C2A29] mb-1">
                  Názov priečinka
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="napr. Mária Kováčová"
                  className="w-full border border-[#E8E2D9] rounded-xl p-2.5 text-xs text-[#2C2A29] focus:border-[#C5A059] outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8E2D9] text-xs font-semibold text-[#8C857B] hover:text-[#2C2A29]"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  disabled={isCreatingFolder}
                  className="px-4 py-2 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-semibold transition-all disabled:opacity-50"
                >
                  {isCreatingFolder ? 'Vytváram...' : 'Vytvoriť'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DESTRUCTIVE OPERATION CONFIRMATION MODAL (MANDATORY PER WORKSPACE SKILL) */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#2C2A29]">
                  Odstrániť položku z Google Disku?
                </h3>
                <p className="text-xs text-[#8C857B]">
                  Potvrdenie trvalej úpravy dát
                </p>
              </div>
            </div>

            <p className="text-xs text-[#2C2A29] leading-relaxed bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E2D9]">
              Naozaj chcete zmazať <strong>„{fileToDelete.name}“</strong> z Google Disku? Táto operácia odstráni súbor zo vzdialeného úložiska.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={isDeletingFile}
                className="px-4 py-2 rounded-xl border border-[#E8E2D9] text-xs font-semibold text-[#8C857B] hover:text-[#2C2A29]"
              >
                Zrušiť
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletingFile}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingFile ? 'Odstraňujem...' : 'Potvrdiť zmazanie'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
