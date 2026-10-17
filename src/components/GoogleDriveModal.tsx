'use client';

import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Cloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  LogOut,
  X,
  Key,
  ShieldCheck,
  Copy,
  Check,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  googleSignIn,
  signInWithGIS,
  googleLogout,
  subscribeWorkspaceAuth,
  setExternalAccessToken,
  testGoogleDriveConnection,
  getLastAuthError,
} from '@/lib/workspaceAuth';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
}

export default function GoogleDriveModal({ isOpen, onClose, currentUser }: GoogleDriveModalProps) {
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [showManualTokenInput, setShowManualTokenInput] = useState(false);
  const [manualToken, setManualToken] = useState('');

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'sayclinic.vercel.app';
  const isVercelDomain = currentHostname.includes('vercel.app') || currentHostname.includes('sayclinic.sk');

  useEffect(() => {
    const unsub = subscribeWorkspaceAuth((user, token, err) => {
      setGoogleUser(user);
      setAccessToken(token);
      if (err) setAuthError(err);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setAuthError(getLastAuthError());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConnected = Boolean(accessToken);

  const handleStandardSignIn = async () => {
    setIsConnecting(true);
    setAuthError(null);
    setTestResult(null);
    try {
      const res = await googleSignIn();
      if (res?.accessToken) {
        setExternalAccessToken(res.accessToken, res.user);
        setTestResult({
          success: true,
          message: 'Google Drive bol úspešne pripojený.',
        });
      } else {
        const err = getLastAuthError();
        if (err) setAuthError(err);
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Prihlásenie zlyhalo.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleGisSignIn = async () => {
    setIsConnecting(true);
    setAuthError(null);
    setTestResult(null);
    try {
      const res = await signInWithGIS();
      if (res?.accessToken) {
        setExternalAccessToken(res.accessToken, res.user);
        setTestResult({
          success: true,
          message: 'Úspešne pripojené cez Google Identity Services.',
        });
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Chyba prihlásenia cez GIS.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testGoogleDriveConnection();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Chyba testu spojenia.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = async () => {
    await googleLogout();
    setTestResult(null);
    setAuthError(null);
  };

  const handleSaveManualToken = () => {
    if (!manualToken.trim()) return;
    setExternalAccessToken(manualToken.trim(), {
      email: 'say@sayclinic.sk',
      displayName: 'SAY CLINIC Token',
    });
    setManualToken('');
    setShowManualTokenInput(false);
    setTestResult({
      success: true,
      message: 'Prístupový token bol aktivovaný v pamäti relácie.',
    });
  };

  const copyDomainToClipboard = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2C2A29]/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-[0_25px_60px_rgba(44,42,41,0.25)] border border-[#E8E2D9] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HLAVIČKA */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8E2D9] bg-[#FAF8F5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-[#E8E2D9] flex items-center justify-center text-[#C5A059] shadow-2xs">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-brand text-lg font-bold text-[#2C2A29] uppercase tracking-wider">
                Google Drive & Cloud Sync
              </h3>
              <p className="text-[11px] text-[#8C857B]">
                Prepojenie zdravotnej dokumentácie SAY CLINIC s Google Workspace
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#E8E2D9] flex items-center justify-center text-[#8C857B] hover:text-[#2C2A29] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TELO MODALU */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* STAVOVÁ KARTA */}
          <div className={`p-4 rounded-2xl border ${
            isConnected 
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' 
              : 'bg-amber-50/60 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {isConnected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                )}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    {isConnected ? 'Google Drive je aktívny' : 'Google Drive nie je pripojený'}
                  </h4>
                  <p className="text-[11px] mt-0.5 opacity-90">
                    {isConnected
                      ? `Prepojený účet: ${googleUser?.email || googleUser?.displayName || 'say@sayclinic.sk'}`
                      : 'Prihláste sa cez Google účet kliniky pre synchronizáciu kariet, fotografií a nálezov.'}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {isConnected ? 'ONLINE' : 'ODPOJENÉ'}
              </span>
            </div>
          </div>

          {/* CHYBOVÝ OZNAM */}
          {authError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Upozornenie pripojenia Google Drive</span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-800">{authError}</p>
            </div>
          )}

          {/* TESTOVACÍ VÝSLEDOK */}
          {testResult && (
            <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="text-[11px] font-medium">{testResult.message}</span>
            </div>
          )}

          {/* AKCIE PRI PRIPOJENOM STAVE */}
          {isConnected ? (
            <div className="space-y-3 pt-1">
              <div className="bg-[#FAF8F5] border border-[#E8E2D9] p-4 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#8C857B] font-medium">Koreňová zložka na Disku:</span>
                  <span className="font-bold text-[#2C2A29]">Klienti SAY</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8C857B] font-medium">Režim komunikácie:</span>
                  <span className="font-bold text-emerald-700">Priamy browser CORS (Vysoká rýchlosť)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href="https://drive.google.com/drive/u/0/search?q=Klienti%20SAY"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-[#2C2A29] text-xs font-bold uppercase tracking-wider transition-all shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Otvoriť Google Drive</span>
                </a>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-[#2C2A29] text-xs font-bold uppercase tracking-wider transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#C5A059] ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testujem...' : 'Otestovať spojenie'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleDisconnect}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Odpojiť Google Drive z relácie</span>
              </button>
            </div>
          ) : (
            /* AKCIE PRI ODPOJENOM STAVE */
            <div className="space-y-4 pt-1">
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleStandardSignIn}
                  disabled={isConnecting}
                  className="w-full inline-flex items-center justify-center gap-3 px-5 py-3 rounded-2xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <div className="w-5 h-5 flex-shrink-0 bg-white p-0.5 rounded-full">
                    <svg viewBox="0 0 48 48" className="w-full h-full">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                  </div>
                  <span>{isConnecting ? 'Pripájam Google Drive...' : 'Prihlásiť sa cez Google (SAY CLINIC)'}</span>
                </button>

                {/* ALTERNATÍVA GIS PRE VERCEL */}
                <button
                  type="button"
                  onClick={handleGisSignIn}
                  disabled={isConnecting}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E8E2D9] text-[#2C2A29] text-xs font-semibold tracking-wider transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Priame prihlásenie cez Google Identity Services</span>
                </button>
              </div>

              {/* NÁVOD PRE VERCEL DOMÉNU (SAYCLINIC.VERCEL.APP) */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#2C2A29]">
                  <span className="flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-[#C5A059]" />
                    <span>Používate aplikáciu na doméne {currentHostname}?</span>
                  </span>
                  <button
                    type="button"
                    onClick={copyDomainToClipboard}
                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-white border border-[#E8E2D9] text-[#8C857B] hover:text-[#2C2A29] cursor-pointer"
                  >
                    {copiedDomain ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedDomain ? 'Skopírované' : 'Kopírovať doménu'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#8C857B] leading-relaxed">
                  Aby Google prihlásenie fungovalo bezpečne na hostingu Vercel, pridajte túto doménu do zoznamu povolených domén:
                </p>
                <ol className="text-[11px] text-[#2C2A29] space-y-1 list-decimal list-inside bg-white p-3 rounded-xl border border-[#E8E2D9]">
                  <li>Otvorte <strong>Firebase Console</strong> (projekt <code>gen-lang-client-0588591925</code>)</li>
                  <li>Prejdite do <strong>Authentication → Settings → Authorized domains</strong></li>
                  <li>Kliknite <strong>Add domain</strong> a vložte: <code className="bg-[#FAF8F5] px-1.5 py-0.5 rounded text-[#C5A059] font-bold">{currentHostname}</code></li>
                </ol>
              </div>

              {/* MOŽNOSŤ MANUÁLNEHO TOKENU */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowManualTokenInput(!showManualTokenInput)}
                  className="text-[11px] text-[#8C857B] hover:text-[#C5A059] flex items-center gap-1 cursor-pointer"
                >
                  <Key className="w-3 h-3" />
                  <span>{showManualTokenInput ? 'Skryť manuálne zadanie tokenu' : 'Máte priamy OAuth prístupový token? (pre vývojárov)'}</span>
                </button>

                {showManualTokenInput && (
                  <div className="mt-2 p-3 bg-white border border-[#E8E2D9] rounded-xl space-y-2">
                    <input
                      type="text"
                      placeholder="Vložte Bearer token (začína ya29...)"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-[#E8E2D9] focus:outline-none focus:border-[#C5A059]"
                    />
                    <button
                      type="button"
                      onClick={handleSaveManualToken}
                      className="px-3 py-1.5 bg-[#2C2A29] hover:bg-[#C5A059] text-white text-[11px] font-bold rounded-lg uppercase cursor-pointer"
                    >
                      Aktivovať token
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* PÄTA */}
        <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#E8E2D9] flex items-center justify-between text-[11px] text-[#8C857B]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>GDPR šifrovaný prenos cez Google Workspace API</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white border border-[#E8E2D9] hover:bg-[#FAF8F5] text-[#2C2A29] font-semibold cursor-pointer"
          >
            Zavrieť
          </button>
        </div>
      </div>
    </div>
  );
}
