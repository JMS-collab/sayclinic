'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Trash2, X, Check, RefreshCw, KeyRound, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { LiquidAvatar } from './LiquidAvatar';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'doctor' | 'manager' | 'nurse';
  title: string;
  avatarBg: string;
  avatarUrl?: string;
}

export const SAY_CLINIC_USERS: UserAccount[] = [
  {
    id: 'u1',
    name: 'MUDr. Ján Mráz',
    email: 'mraz@sayclinic.sk',
    role: 'doctor',
    title: 'Plastický chirurg',
    avatarBg: 'bg-[#2C2A29]',
    avatarUrl: ''
  },
  {
    id: 'u2',
    name: 'MUDr. Zuzana Sroková',
    email: 'srokova@sayclinic.sk',
    role: 'doctor',
    title: 'Lekár / Chirurg',
    avatarBg: 'bg-[#3A3532]',
    avatarUrl: ''
  },
  {
    id: 'u3',
    name: 'MUDr. Minh Tuong Tran',
    email: 'tran@sayclinic.sk',
    role: 'doctor',
    title: 'Lekár / Chirurg',
    avatarBg: 'bg-[#2C2A29]',
    avatarUrl: ''
  },
  {
    id: 'u4',
    name: 'Ing. Barbara Mecerodová, MBA',
    email: 'mecerodova@sayclinic.sk',
    role: 'manager',
    title: 'Klinický manažment',
    avatarBg: 'bg-[#C5A059]',
    avatarUrl: ''
  },
  {
    id: 'u5',
    name: 'Mgr. Elena Solivajsová',
    email: 'solivajsova@sayclinic.sk',
    role: 'manager',
    title: 'Recepcia & Manažment',
    avatarBg: 'bg-[#B59148]',
    avatarUrl: ''
  },
  {
    id: 'u6',
    name: 'Ema Foltáni',
    email: 'foltani@sayclinic.sk',
    role: 'nurse',
    title: 'Zdravotná sestra',
    avatarBg: 'bg-[#2A4736]',
    avatarUrl: ''
  },
  {
    id: 'u7',
    name: 'Sabina Lenhartová',
    email: 'lenhartova@sayclinic.sk',
    role: 'nurse',
    title: 'Zdravotná sestra',
    avatarBg: 'bg-[#2A4736]',
    avatarUrl: ''
  },
];

const PRESET_PORTRAITS = [
  { label: 'iOS Memoji Mraz (Chirurg)', url: '/avatars/mraz.jpg' },
  { label: 'iOS Memoji Srokova (Lekár)', url: '/avatars/srokova.jpg' },
  { label: 'iOS Memoji Tran (Chirurg)', url: '/avatars/tran.jpg' },
  { label: 'iOS Memoji Mecerodova (Manažment)', url: '/avatars/mecerodova.jpg' },
  { label: 'iOS Memoji Solivajsova (Recepcia)', url: '/avatars/solivajsova.jpg' },
  { label: 'iOS Memoji Sestra (Operačná sála)', url: '/avatars/foltani.jpg' },
  { label: 'Klinický portrét Lekár', url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400&auto=format&fit=crop' },
  { label: 'Klinický portrét Lekárka', url: 'https://images.unsplash.com/photo-1594824813689-c4391694d4d8?q=80&w=400&auto=format&fit=crop' },
];

interface LoginFormProps {
  onLoginSuccess: (user: UserAccount) => void;
}

type AuthStep = 'select_user' | 'password' | '2fa' | 'reset_password';

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [users, setUsers] = useState<UserAccount[]>(SAY_CLINIC_USERS);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [step, setStep] = useState<AuthStep>('select_user');

  // Správa vlastných fotografií (Modal)
  const [photoModalUser, setPhotoModalUser] = useState<UserAccount | null>(null);
  const [activePhotoTab, setActivePhotoTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [tempPreviewUrl, setTempPreviewUrl] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [photoSuccessToast, setPhotoSuccessToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Formulárové stavy
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Načítanie uložených fotografií z LocalStorage
  useEffect(() => {
    try {
      const savedAvatars = localStorage.getItem('say_clinic_custom_avatars');
      if (savedAvatars) {
        const avatarMap: Record<string, string> = JSON.parse(savedAvatars);
        setUsers(prevUsers =>
          prevUsers.map(u => ({
            ...u,
            avatarUrl: avatarMap[u.id] !== undefined ? avatarMap[u.id] : u.avatarUrl
          }))
        );
      }
    } catch (e) {
      console.error('Chyba pri načítaní vlastných avatarov:', e);
    }
  }, []);

  // Kompresia a prevod nahraného obrázka na Canvas Data URL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Prosím, nahrajte platný súbor s obrázkom (JPG, PNG, WebP).');
      return;
    }

    setIsProcessingPhoto(true);
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.src = readerEvent.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 480;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setTempPreviewUrl(compressedDataUrl);
        } else {
          setTempPreviewUrl(readerEvent.target?.result as string);
        }
        setIsProcessingPhoto(false);
      };
      img.onerror = () => {
        setIsProcessingPhoto(false);
        alert('Obrázok sa nepodarilo spracovať.');
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = (newAvatarUrl: string) => {
    if (!photoModalUser) return;

    const targetId = photoModalUser.id;
    const updatedUsers = users.map(u => (u.id === targetId ? { ...u, avatarUrl: newAvatarUrl } : u));
    setUsers(updatedUsers);

    if (selectedUser && selectedUser.id === targetId) {
      setSelectedUser({ ...selectedUser, avatarUrl: newAvatarUrl });
    }

    try {
      const currentMap = JSON.parse(localStorage.getItem('say_clinic_custom_avatars') || '{}');
      currentMap[targetId] = newAvatarUrl;
      localStorage.setItem('say_clinic_custom_avatars', JSON.stringify(currentMap));
    } catch (e) {
      console.error('Chyba zápisu do LocalStorage:', e);
    }

    setPhotoSuccessToast(`Profilová fotka bola úspešne uložená.`);
    setTimeout(() => setPhotoSuccessToast(null), 3000);

    setPhotoModalUser(null);
    setTempPreviewUrl(null);
    setUrlInput('');
  };

  const handleRemovePhoto = () => {
    if (!photoModalUser) return;

    const targetId = photoModalUser.id;
    const updatedUsers = users.map(u => (u.id === targetId ? { ...u, avatarUrl: '' } : u));
    setUsers(updatedUsers);

    if (selectedUser && selectedUser.id === targetId) {
      setSelectedUser({ ...selectedUser, avatarUrl: '' });
    }

    try {
      const currentMap = JSON.parse(localStorage.getItem('say_clinic_custom_avatars') || '{}');
      currentMap[targetId] = '';
      localStorage.setItem('say_clinic_custom_avatars', JSON.stringify(currentMap));
    } catch (e) {
      console.error('Chyba zápisu do LocalStorage:', e);
    }

    setPhotoSuccessToast(`Fotka bola odstránená.`);
    setTimeout(() => setPhotoSuccessToast(null), 3000);

    setPhotoModalUser(null);
    setTempPreviewUrl(null);
    setUrlInput('');
  };

  const openPhotoModal = (user: UserAccount, e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoModalUser(user);
    setTempPreviewUrl(user.avatarUrl || null);
    setUrlInput(user.avatarUrl && !user.avatarUrl.startsWith('data:') ? user.avatarUrl : '');
    setActivePhotoTab('upload');
  };

  const handleSelectUser = (user: UserAccount) => {
    setSelectedUser(user);
    setStep('password');
    setPassword('');
    setErrorMsg('');
    setInfoMsg('');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('Zadajte heslo.');
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setErrorMsg('');
    setInfoMsg(`TESTOVACÍ REŽIM: Váš 2FA kód je ${code} (alebo 123456)`);
    setStep('2fa');
  };

  const handle2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFactorCode === generatedOtp || twoFactorCode === '123456') {
      onLoginSuccess(selectedUser!);
    } else {
      setErrorMsg('Neplatný 2FA kód. Použite 123456.');
    }
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser?.email) return;

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    setInfoMsg(`Odkaz na obnovu hesla pre ${selectedUser.email} bol odoslaný (Kód: ${resetCode})`);
    setTimeout(() => {
      setStep('password');
    }, 3000);
  };

  return (
    <div className="relative min-h-[90vh] flex flex-col justify-center items-center py-10 px-4 sm:px-8 overflow-hidden select-none">
      
      {/* ========================================================================= */}
      {/* LIQUID GLASS AMBIENT LIGHT & FLUID ORBS */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        {/* Zlatý tekutý opar vľavo hore */}
        <div className="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-gradient-to-br from-[#F5E5C9]/60 via-[#C5A059]/25 to-transparent blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
        {/* Jemný perlový opar vpravo hore */}
        <div className="absolute top-1/4 -right-28 w-[420px] h-[420px] rounded-full bg-gradient-to-bl from-[#E8E2D9]/70 via-[#C5A059]/20 to-transparent blur-[120px]" />
        {/* Hlbší teplý opar dole */}
        <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#D9C4A5]/40 via-[#FBF9F6]/50 to-transparent blur-[130px]" />
        {/* Jemná fluidná textúra */}
        <div className="absolute inset-0 bg-[radial-gradient(#C5A059_0.5px,transparent_0.5px)] opacity-[0.07] [background-size:24px_24px]" />
      </div>

      {/* OZNÁMENIE */}
      {photoSuccessToast && (
        <div className="fixed top-8 right-8 z-50 backdrop-blur-2xl bg-[#2C2A29]/90 text-white border border-white/20 px-6 py-3 rounded-full shadow-[0_15px_35px_rgba(0,0,0,0.2)] flex items-center gap-2.5 text-xs font-medium tracking-wide animate-in fade-in slide-in-from-top-4 duration-300">
          <Check className="w-4 h-4 text-[#C5A059]" />
          <span>{photoSuccessToast}</span>
        </div>
      )}

      {/* MINIMALISTICKÉ LOGO V LIQUID GLASS ŠTÝLE */}
      <div className="text-center mb-10 relative">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 mb-3 rounded-full backdrop-blur-xl bg-white/40 border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.8)] text-[10px] uppercase tracking-widest text-[#8C857B] font-semibold">
          <Sparkles className="w-3 h-3 text-[#C5A059]" />
          <span>SAY CLINIC • Klientsky & Zdravotný Systém</span>
        </div>
        <div>
          <img
            src="/logo.png"
            alt="SAY CLINIC"
            className="h-16 sm:h-20 md:h-22 w-auto object-contain mx-auto transition-all duration-500 hover:scale-103 drop-shadow-[0_8px_16px_rgba(0,0,0,0.04)]"
          />
        </div>
      </div>

      {/* KROK 1: VÝBER POUŽÍVATEĽOV V ŠTÝLE LIQUID GLASS */}
      {step === 'select_user' && (
        <div className="w-full max-w-5xl mx-auto space-y-10">
          
          {/* HLAVNÁ LIQUID GLASS KARTA S AVATARMI */}
          <div className="backdrop-blur-3xl bg-white/45 border border-white/80 rounded-[36px] p-8 sm:p-12 shadow-[0_25px_60px_-15px_rgba(44,42,41,0.06),inset_0_1.5px_2px_rgba(255,255,255,0.95),inset_0_-1px_2px_rgba(197,160,89,0.12)] relative overflow-hidden">
            
            {/* Vnútorný specular svetelný odlesk na vrchu karty */}
            <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
            
            <div className="text-center mb-10">
              <h2 className="text-xl sm:text-2xl font-light text-[#2C2A29] tracking-tight">
                Vyberte svoj profil pre prihlásenie
              </h2>
              <p className="text-xs text-[#8C857B] mt-1.5 font-normal tracking-wide">
                Zabezpečený klinický prístup s dvojfaktorovým overením
              </p>
            </div>

            <div className="flex flex-wrap justify-center items-start gap-7 sm:gap-9 md:gap-10">
              {users.map(u => (
                <div
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  className="group flex flex-col items-center cursor-pointer transition-all duration-400 w-32 sm:w-36 text-center"
                >
                  {/* LIQUID GLASS GULA AVATARA */}
                  <div className="relative mb-3.5">
                    {/* Vonkajší liquid glass kruh s optickým lomom */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1.5 backdrop-blur-xl bg-gradient-to-b from-white/90 via-white/50 to-white/20 border border-white/90 shadow-[0_12px_28px_-6px_rgba(44,42,41,0.08),inset_0_2px_4px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(197,160,89,0.18)] group-hover:shadow-[0_20px_40px_-5px_rgba(197,160,89,0.32),inset_0_2px_6px_rgba(255,255,255,1)] group-hover:border-[#C5A059]/60 group-hover:scale-106 transition-all duration-400 flex items-center justify-center overflow-hidden">
                      {u.avatarUrl ? (
                        <img
                          src={u.avatarUrl}
                          alt={u.name}
                          className="w-full h-full rounded-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white shadow-inner">
                          <LiquidAvatar id={u.id} name={u.name} role={u.role} />
                        </div>
                      )}
                    </div>

                    {/* Tlačidlo úpravy avataru */}
                    <button
                      type="button"
                      onClick={(e) => openPhotoModal(u, e)}
                      title="Zmeniť profilový avatar"
                      className="absolute -bottom-1 -right-1 p-1.5 backdrop-blur-md bg-white/90 text-[#2C2A29] hover:bg-[#C5A059] hover:text-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-white transition-all transform group-hover:scale-110"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                  </div>

                  {/* MENO A POZÍCIA */}
                  <h3 className="text-xs sm:text-sm font-semibold text-[#2C2A29] group-hover:text-[#C5A059] transition-colors leading-tight line-clamp-2">
                    {u.name}
                  </h3>
                  
                  {/* Glass rola štítok */}
                  <span className="mt-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-medium backdrop-blur-md bg-white/60 border border-white/80 text-[#8C857B] group-hover:text-[#2C2A29] group-hover:bg-white/90 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    {u.title}
                  </span>
                </div>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* KROK 2: LIQUID GLASS ZADANIE HESLA */}
      {step === 'password' && selectedUser && (
        <div className="max-w-md mx-auto w-full backdrop-blur-3xl bg-white/55 border border-white/80 p-8 sm:p-10 rounded-[36px] shadow-[0_30px_70px_-15px_rgba(44,42,41,0.08),inset_0_1.5px_2px_rgba(255,255,255,0.95)] text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          
          {/* LIQUID GLASS GULA VYBRANÉHO POUŽÍVATEĽA */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1.5 backdrop-blur-xl bg-gradient-to-b from-white/90 via-white/50 to-white/20 border-2 border-[#C5A059]/70 mx-auto shadow-[0_16px_36px_-6px_rgba(197,160,89,0.28),inset_0_2px_4px_rgba(255,255,255,0.95)] flex items-center justify-center overflow-hidden">
            {selectedUser.avatarUrl ? (
              <img
                src={selectedUser.avatarUrl}
                alt={selectedUser.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white shadow-inner">
                <LiquidAvatar id={selectedUser.id} name={selectedUser.name} role={selectedUser.role} />
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#2C2A29]">{selectedUser.name}</h2>
            <p className="text-xs text-[#8C857B] mt-0.5 font-medium">{selectedUser.title}</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-left">
            <div>
              <div className="relative">
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Zadajte heslo"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-white/90 p-3.5 rounded-2xl text-sm font-mono bg-white/70 backdrop-blur-md outline-none focus:border-[#C5A059] focus:bg-white transition-all pl-11 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.02)]"
                />
                <KeyRound className="w-4 h-4 text-[#C5A059] absolute left-3.5 top-4" />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 font-medium text-center bg-rose-50/80 backdrop-blur-sm border border-rose-200/60 p-2.5 rounded-xl">
                {errorMsg}
              </p>
            )}

            <div className="flex justify-between items-center text-xs pt-1">
              <button
                type="button"
                onClick={() => setStep('reset_password')}
                className="text-[#8C857B] hover:text-[#2C2A29] transition-colors font-medium"
              >
                Zabudnuté heslo?
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('select_user')}
                className="flex-1 backdrop-blur-md bg-white/60 hover:bg-white/90 border border-white/90 text-[#8C857B] hover:text-[#2C2A29] py-3 rounded-2xl text-xs font-semibold transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
              >
                Späť
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-[#2C2A29] via-[#3F3936] to-[#2C2A29] hover:from-[#C5A059] hover:to-[#9C7D3D] text-white py-3 rounded-2xl text-xs font-semibold transition-all shadow-[0_10px_25px_-5px_rgba(44,42,41,0.25)] hover:shadow-[0_12px_28px_-5px_rgba(197,160,89,0.35)]"
              >
                Pokračovať →
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KROK 3: LIQUID GLASS 2FA OVERENIE */}
      {step === '2fa' && selectedUser && (
        <div className="max-w-md mx-auto w-full backdrop-blur-3xl bg-white/55 border border-white/80 p-8 sm:p-10 rounded-[36px] shadow-[0_30px_70px_-15px_rgba(44,42,41,0.08),inset_0_1.5px_2px_rgba(255,255,255,0.95)] text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-14 h-14 rounded-full backdrop-blur-xl bg-gradient-to-b from-white/90 to-white/40 border border-white/90 text-[#2C2A29] flex items-center justify-center mx-auto shadow-[0_8px_20px_rgba(197,160,89,0.15)]">
            <ShieldCheck className="w-7 h-7 text-[#C5A059]" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#2C2A29]">2FA Overenie</h2>
            <p className="text-xs text-[#8C857B] mt-0.5">{selectedUser.name}</p>
          </div>

          {infoMsg && (
            <div className="backdrop-blur-md bg-[#FAF8F5]/80 border border-[#C5A059]/30 text-[#2C2A29] p-3.5 rounded-2xl text-xs font-mono text-center shadow-inner">
              {infoMsg}
            </div>
          )}

          <form onSubmit={handle2FASubmit} className="space-y-4">
            <div>
              <input
                type="text"
                maxLength={6}
                required
                autoFocus
                placeholder="123456"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                className="w-full border-2 border-white/90 p-3.5 rounded-2xl text-center text-xl tracking-[0.3em] font-mono bg-white/80 backdrop-blur-md outline-none focus:border-[#C5A059] shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)]"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 font-medium text-center bg-rose-50/80 p-2.5 rounded-xl border border-rose-200/60">
                {errorMsg}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('password')}
                className="flex-1 backdrop-blur-md bg-white/60 hover:bg-white/90 border border-white/90 text-[#8C857B] hover:text-[#2C2A29] py-3 rounded-2xl text-xs font-semibold transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
              >
                Späť
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-[#2C2A29] via-[#3F3936] to-[#2C2A29] hover:from-[#C5A059] hover:to-[#9C7D3D] text-white py-3 rounded-2xl text-xs font-semibold transition-all shadow-[0_10px_25px_-5px_rgba(44,42,41,0.25)] hover:shadow-[0_12px_28px_-5px_rgba(197,160,89,0.35)]"
              >
                Vstúpiť
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KROK 4: LIQUID GLASS OBNOVA HESLA */}
      {step === 'reset_password' && selectedUser && (
        <div className="max-w-md mx-auto w-full backdrop-blur-3xl bg-white/55 border border-white/80 p-8 sm:p-10 rounded-[36px] shadow-[0_30px_70px_-15px_rgba(44,42,41,0.08),inset_0_1.5px_2px_rgba(255,255,255,0.95)] text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <h2 className="text-lg font-semibold text-[#2C2A29]">Obnova hesla</h2>
            <p className="text-xs text-[#8C857B] mt-1">{selectedUser.email}</p>
          </div>

          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            {infoMsg ? (
              <p className="text-xs text-emerald-800 bg-emerald-50/90 backdrop-blur-sm border border-emerald-200 p-3.5 rounded-2xl text-center">
                {infoMsg}
              </p>
            ) : (
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('password')}
                  className="flex-1 backdrop-blur-md bg-white/60 hover:bg-white/90 border border-white/90 text-[#8C857B] hover:text-[#2C2A29] py-3 rounded-2xl text-xs font-semibold transition-all"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#2C2A29] via-[#3F3936] to-[#2C2A29] hover:from-[#C5A059] hover:to-[#9C7D3D] text-white py-3 rounded-2xl text-xs font-semibold transition-all shadow-[0_10px_25px_-5px_rgba(44,42,41,0.25)]"
                >
                  Odoslať odkaz
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIALÓG NA ZMENU / PRIDANIE AVATARU (LIQUID GLASS) */}
      {/* ========================================================================= */}
      {photoModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2A29]/30 backdrop-blur-md animate-in fade-in duration-200">
          <div className="backdrop-blur-3xl bg-white/80 border border-white/90 w-full max-w-md rounded-[32px] shadow-[0_35px_80px_rgba(0,0,0,0.18),inset_0_1.5px_2px_rgba(255,255,255,0.95)] overflow-hidden flex flex-col">
            
            {/* HLAVIČKA */}
            <div className="p-6 border-b border-[#E8E2D9]/60 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#2C2A29]">
                  {photoModalUser.name}
                </h3>
                <p className="text-xs text-[#8C857B]">Prispôsobenie profilového avataru</p>
              </div>
              <button
                type="button"
                onClick={() => setPhotoModalUser(null)}
                className="p-2 text-[#8C857B] hover:text-[#2C2A29] hover:bg-white/80 rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* OBSAH */}
            <div className="p-6 space-y-6">
              
              {/* NÁHĽAD GULE */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-28 h-28 rounded-full p-1.5 backdrop-blur-xl bg-gradient-to-b from-white via-white/60 to-white/20 border-2 border-[#C5A059] shadow-[0_12px_28px_rgba(197,160,89,0.25)] flex items-center justify-center overflow-hidden">
                  {tempPreviewUrl ? (
                    <img
                      src={tempPreviewUrl}
                      alt="Náhľad"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white shadow-inner">
                      <LiquidAvatar id={photoModalUser.id} name={photoModalUser.name} role={photoModalUser.role} />
                    </div>
                  )}
                </div>
              </div>

              {/* TABS */}
              <div className="flex border-b border-[#E8E2D9]/60 text-xs">
                <button
                  type="button"
                  onClick={() => setActivePhotoTab('presets')}
                  className={`flex-1 py-2.5 border-b-2 font-medium transition-all ${
                    activePhotoTab === 'presets'
                      ? 'border-[#2C2A29] text-[#2C2A29]'
                      : 'border-transparent text-[#8C857B] hover:text-[#2C2A29]'
                  }`}
                >
                  iOS Memoji
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhotoTab('upload')}
                  className={`flex-1 py-2.5 border-b-2 font-medium transition-all ${
                    activePhotoTab === 'upload'
                      ? 'border-[#2C2A29] text-[#2C2A29]'
                      : 'border-transparent text-[#8C857B] hover:text-[#2C2A29]'
                  }`}
                >
                  Nahrať vlastnú
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhotoTab('url')}
                  className={`flex-1 py-2.5 border-b-2 font-medium transition-all ${
                    activePhotoTab === 'url'
                      ? 'border-[#2C2A29] text-[#2C2A29]'
                      : 'border-transparent text-[#8C857B] hover:text-[#2C2A29]'
                  }`}
                >
                  URL odkaz
                </button>
              </div>

              {/* 1. PRESETS (iOS MEMOJI) */}
              {activePhotoTab === 'presets' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
                    {PRESET_PORTRAITS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTempPreviewUrl(preset.url)}
                        className="group flex flex-col items-center gap-1 p-1.5 rounded-2xl bg-white/70 hover:bg-white border border-[#E8E2D9] hover:border-[#C5A059] transition-all shadow-xs"
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-white/80 shadow-xs bg-white">
                          <img src={preset.url} alt={preset.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <span className="text-[9px] text-[#8C857B] group-hover:text-[#2C2A29] truncate w-full text-center leading-tight">
                          {preset.label.split(' ')[1] || preset.label}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setTempPreviewUrl('')}
                    className="w-full py-2.5 rounded-2xl bg-white/80 border border-[#E8E2D9] hover:border-[#C5A059] text-xs font-medium text-[#2C2A29] flex items-center justify-center gap-2 shadow-xs transition-all mt-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                    Použiť originálny predvolený avatar
                  </button>
                </div>
              )}

              {/* 3. URL */}
              {activePhotoTab === 'url' && (
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setTempPreviewUrl(e.target.value);
                    }}
                    className="flex-1 border border-white/90 p-2.5 rounded-xl text-xs bg-white/80 outline-none focus:border-[#C5A059]"
                  />
                  <button
                    type="button"
                    onClick={() => setTempPreviewUrl(urlInput)}
                    className="bg-[#2C2A29] text-white px-3 py-2 rounded-xl text-xs font-medium"
                  >
                    Načítať
                  </button>
                </div>
              )}

            </div>

            {/* PÄTIČKA */}
            <div className="p-5 border-t border-[#E8E2D9]/60 flex items-center justify-between bg-white/40">
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-rose-600 hover:text-rose-700 text-xs font-medium flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Resetovať</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPhotoModalUser(null)}
                  className="px-4 py-2 border border-[#E8E2D9] text-[#8C857B] hover:text-[#2C2A29] rounded-xl text-xs font-medium"
                >
                  Zrušiť
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePhoto(tempPreviewUrl || '')}
                  className="px-4 py-2 bg-[#2C2A29] hover:bg-[#C5A059] text-white rounded-xl text-xs font-medium transition-colors shadow-sm"
                >
                  Uložiť avatar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

