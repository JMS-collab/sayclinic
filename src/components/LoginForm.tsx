'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Trash2, X, Check, RefreshCw, KeyRound, ShieldCheck } from 'lucide-react';

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
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'u2',
    name: 'MUDr. Zuzana Sroková',
    email: 'srokova@sayclinic.sk',
    role: 'doctor',
    title: 'Lekár / Chirurg',
    avatarBg: 'bg-[#3A3532]',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813689-c4391694d4d8?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'u3',
    name: 'MUDr. Minh Tuong Tran',
    email: 'tran@sayclinic.sk',
    role: 'doctor',
    title: 'Lekár / Chirurg',
    avatarBg: 'bg-[#2C2A29]',
    avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'u4',
    name: 'Ing. Barbara Mecerodová, MBA',
    email: 'mecerodova@sayclinic.sk',
    role: 'manager',
    title: 'Klinický manažment',
    avatarBg: 'bg-[#C5A059]',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'u5',
    name: 'Mgr. Elena Solivajsová',
    email: 'solivajsova@sayclinic.sk',
    role: 'manager',
    title: 'Recepcia & Manažment',
    avatarBg: 'bg-[#B59148]',
    avatarUrl: 'https://images.unsplash.com/photo-1580894732484-98442a59d997?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'u6',
    name: 'Ema Foltáni',
    email: 'foltani@sayclinic.sk',
    role: 'nurse',
    title: 'Zdravotná sestra',
    avatarBg: 'bg-[#2A4736]',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'u7',
    name: 'Sabina Lenhartová',
    email: 'lenhartova@sayclinic.sk',
    role: 'nurse',
    title: 'Zdravotná sestra',
    avatarBg: 'bg-[#2A4736]',
    avatarUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?q=80&w=400&auto=format&fit=crop'
  },
];

const PRESET_PORTRAITS = [
  { label: 'Portrét 1', url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400&auto=format&fit=crop' },
  { label: 'Portrét 2', url: 'https://images.unsplash.com/photo-1594824813689-c4391694d4d8?q=80&w=400&auto=format&fit=crop' },
  { label: 'Portrét 3', url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=400&auto=format&fit=crop' },
  { label: 'Portrét 4', url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400&auto=format&fit=crop' },
  { label: 'Portrét 5', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop' },
  { label: 'Portrét 6', url: 'https://images.unsplash.com/photo-1580894732484-98442a59d997?q=80&w=400&auto=format&fit=crop' },
  { label: 'Portrét 7', url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?q=80&w=400&auto=format&fit=crop' },
  { label: 'Portrét 8', url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=400&auto=format&fit=crop' },
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
    <div className="min-h-[85vh] flex flex-col justify-center max-w-6xl mx-auto py-12 px-4 sm:px-8">
      
      {/* OZNÁMENIE */}
      {photoSuccessToast && (
        <div className="fixed top-8 right-8 z-50 bg-[#2C2A29] text-white px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-xs">
          <Check className="w-4 h-4 text-[#C5A059]" />
          <span>{photoSuccessToast}</span>
        </div>
      )}

      {/* MINIMALISTICKÉ LOGO */}
      <div className="text-center mb-10">
        <img
          src="/logo.png"
          alt="SAY CLINIC"
          className="h-16 sm:h-20 md:h-24 w-auto object-contain mx-auto transition-transform hover:scale-102"
        />
      </div>

      {/* KROK 1: MINIMALISTICKÝ VÝBER POUŽÍVATEĽOV S VEĽKÝMI GULAMI */}
      {step === 'select_user' && (
        <div className="space-y-12">
          
          <div className="flex flex-wrap justify-center items-start gap-8 sm:gap-10 md:gap-12 max-w-5xl mx-auto">
            {users.map(u => (
              <div
                key={u.id}
                onClick={() => handleSelectUser(u)}
                className="group flex flex-col items-center cursor-pointer transition-all duration-300 w-36 sm:w-40 text-center"
              >
                {/* VEĽKÁ GUĽA (AVATAR) */}
                <div className="relative mb-4">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 border-2 border-[#E8E2D9] group-hover:border-[#C5A059] group-hover:shadow-xl transition-all duration-300 bg-white flex items-center justify-center overflow-hidden">
                    {u.avatarUrl ? (
                      <img
                        src={u.avatarUrl}
                        alt={u.name}
                        className="w-full h-full rounded-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className={`w-full h-full rounded-full ${u.avatarBg} text-white flex items-center justify-center font-light text-xl tracking-wider`}>
                        {u.name.replace(/(MUDr\.|Ing\.|Mgr\.|, MBA)/g, '').trim().split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                  </div>

                  {/* MINIMALISTICKÁ IKONA KAMERY NA ÚPRAVU FOTKY */}
                  <button
                    type="button"
                    onClick={(e) => openPhotoModal(u, e)}
                    title="Zmeniť profilovú fotku"
                    className="absolute bottom-0 right-0 p-2 bg-[#2C2A29] text-white hover:bg-[#C5A059] rounded-full shadow-md border-2 border-white transition-all transform group-hover:scale-110"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* MENO A POZÍCIA */}
                <h3 className="text-sm sm:text-base font-medium text-[#2C2A29] group-hover:text-[#C5A059] transition-colors leading-tight">
                  {u.name}
                </h3>
                <p className="text-xs text-[#8C857B] mt-1 font-light tracking-wide">
                  {u.title}
                </p>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* KROK 2: MINIMALISTICKÉ ZADANIE HESLA */}
      {step === 'password' && selectedUser && (
        <div className="max-w-sm mx-auto w-full bg-white border border-[#E8E2D9] p-8 rounded-3xl shadow-sm text-center space-y-6">
          
          {/* VEĽKÁ GUĽA VYBRANÉHO POUŽÍVATEĽA */}
          <div className="w-28 h-28 rounded-full p-1 border-2 border-[#C5A059] mx-auto shadow-md bg-white flex items-center justify-center overflow-hidden">
            {selectedUser.avatarUrl ? (
              <img
                src={selectedUser.avatarUrl}
                alt={selectedUser.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className={`w-full h-full rounded-full ${selectedUser.avatarBg} text-white flex items-center justify-center text-2xl font-light`}>
                {selectedUser.name.replace(/(MUDr\.|Ing\.|Mgr\.|, MBA)/g, '').trim().split(' ').map(n => n[0]).join('')}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-medium text-[#2C2A29]">{selectedUser.name}</h2>
            <p className="text-xs text-[#8C857B] mt-0.5">{selectedUser.title}</p>
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
                  className="w-full border border-[#E8E2D9] p-3 rounded-2xl text-sm font-mono bg-[#FAF8F5] outline-none focus:border-[#C5A059] transition-colors pl-10"
                />
                <KeyRound className="w-4 h-4 text-[#8C857B] absolute left-3.5 top-3.5" />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 font-medium text-center">
                {errorMsg}
              </p>
            )}

            <div className="flex justify-between items-center text-xs pt-1">
              <button
                type="button"
                onClick={() => setStep('reset_password')}
                className="text-[#8C857B] hover:text-[#2C2A29] transition-colors"
              >
                Zabudnuté heslo?
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('select_user')}
                className="flex-1 border border-[#E8E2D9] text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FAF8F5] py-2.5 rounded-2xl text-xs font-medium transition-colors"
              >
                Späť
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#2C2A29] hover:bg-[#C5A059] text-white py-2.5 rounded-2xl text-xs font-medium transition-colors shadow-sm"
              >
                Pokračovať →
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KROK 3: 2FA OVERENIE */}
      {step === '2fa' && selectedUser && (
        <div className="max-w-sm mx-auto w-full bg-white border border-[#E8E2D9] p-8 rounded-3xl shadow-sm text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#E8E2D9] text-[#2C2A29] flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6 text-[#C5A059]" />
          </div>

          <div>
            <h2 className="text-lg font-medium text-[#2C2A29]">2FA Overenie</h2>
            <p className="text-xs text-[#8C857B] mt-0.5">{selectedUser.name}</p>
          </div>

          {infoMsg && (
            <div className="bg-[#FAF8F5] border border-[#E8E2D9] text-[#2C2A29] p-3 rounded-2xl text-xs font-mono text-center">
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
                className="w-full border-2 border-[#E8E2D9] p-3 rounded-2xl text-center text-xl tracking-[0.3em] font-mono bg-[#FAF8F5] outline-none focus:border-[#C5A059]"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 font-medium text-center">
                {errorMsg}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('password')}
                className="flex-1 border border-[#E8E2D9] text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FAF8F5] py-2.5 rounded-2xl text-xs font-medium transition-colors"
              >
                Späť
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#2C2A29] hover:bg-[#C5A059] text-white py-2.5 rounded-2xl text-xs font-medium transition-colors shadow-sm"
              >
                Vstúpiť
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KROK 4: OBNOVA HESLA */}
      {step === 'reset_password' && selectedUser && (
        <div className="max-w-sm mx-auto w-full bg-white border border-[#E8E2D9] p-8 rounded-3xl shadow-sm text-center space-y-6">
          <div>
            <h2 className="text-lg font-medium text-[#2C2A29]">Obnova hesla</h2>
            <p className="text-xs text-[#8C857B] mt-1">{selectedUser.email}</p>
          </div>

          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            {infoMsg ? (
              <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-center">
                {infoMsg}
              </p>
            ) : (
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('password')}
                  className="flex-1 border border-[#E8E2D9] text-[#8C857B] hover:text-[#2C2A29] py-2.5 rounded-2xl text-xs font-medium transition-colors"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#2C2A29] hover:bg-[#C5A059] text-white py-2.5 rounded-2xl text-xs font-medium transition-colors shadow-sm"
                >
                  Odoslať odkaz
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIALÓG NA ZMENU / PRIDANIE FOTOGRAFIE */}
      {/* ========================================================================= */}
      {photoModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2A29]/40 backdrop-blur-sm">
          <div className="bg-white border border-[#E8E2D9] w-full max-w-md rounded-3xl shadow-xl overflow-hidden flex flex-col">
            
            {/* HLAVIČKA */}
            <div className="p-5 border-b border-[#E8E2D9] flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium text-[#2C2A29]">
                  {photoModalUser.name}
                </h3>
                <p className="text-xs text-[#8C857B]">Zmena profilovej fotografie</p>
              </div>
              <button
                type="button"
                onClick={() => setPhotoModalUser(null)}
                className="p-1.5 text-[#8C857B] hover:text-[#2C2A29] rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* OBSAH */}
            <div className="p-6 space-y-6">
              
              {/* NÁHĽAD GULE */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-32 h-32 rounded-full p-1 border-2 border-[#C5A059] shadow-lg bg-white flex items-center justify-center overflow-hidden">
                  {tempPreviewUrl ? (
                    <img
                      src={tempPreviewUrl}
                      alt="Náhľad"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full rounded-full ${photoModalUser.avatarBg} text-white flex items-center justify-center text-2xl font-light`}>
                      {photoModalUser.name.replace(/(MUDr\.|Ing\.|Mgr\.|, MBA)/g, '').trim().split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                </div>
              </div>

              {/* TABS */}
              <div className="flex border-b border-[#E8E2D9] text-xs">
                <button
                  type="button"
                  onClick={() => setActivePhotoTab('upload')}
                  className={`flex-1 py-2.5 border-b-2 font-medium transition-all ${
                    activePhotoTab === 'upload'
                      ? 'border-[#2C2A29] text-[#2C2A29]'
                      : 'border-transparent text-[#8C857B] hover:text-[#2C2A29]'
                  }`}
                >
                  Nahrať súbor
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhotoTab('presets')}
                  className={`flex-1 py-2.5 border-b-2 font-medium transition-all ${
                    activePhotoTab === 'presets'
                      ? 'border-[#2C2A29] text-[#2C2A29]'
                      : 'border-transparent text-[#8C857B] hover:text-[#2C2A29]'
                  }`}
                >
                  Výber z galérie
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

              {/* 1. UPLOAD */}
              {activePhotoTab === 'upload' && (
                <div className="space-y-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#E8E2D9] hover:border-[#2C2A29] bg-[#FAF8F5] p-6 rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5 text-[#8C857B]" />
                    <p className="text-xs font-medium text-[#2C2A29]">
                      Kliknite sem pre výber fotografie z PC / Mobilu
                    </p>
                  </div>
                  {isProcessingPhoto && (
                    <div className="flex items-center justify-center gap-2 text-xs text-[#8C857B]">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Spracovávam fotografiu...</span>
                    </div>
                  )}
                </div>
              )}

              {/* 2. PRESETS */}
              {activePhotoTab === 'presets' && (
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                  {PRESET_PORTRAITS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTempPreviewUrl(preset.url)}
                      className={`relative rounded-full p-0.5 border-2 transition-all ${
                        tempPreviewUrl === preset.url
                          ? 'border-[#2C2A29] scale-105'
                          : 'border-[#E8E2D9] hover:border-[#8C857B]'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    </button>
                  ))}
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
                    className="flex-1 border border-[#E8E2D9] p-2.5 rounded-xl text-xs bg-[#FAF8F5] outline-none focus:border-[#2C2A29]"
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
            <div className="p-4 border-t border-[#E8E2D9] flex items-center justify-between">
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-rose-600 hover:text-rose-700 text-xs font-medium flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Odstrániť</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPhotoModalUser(null)}
                  className="px-3 py-2 border border-[#E8E2D9] text-[#8C857B] hover:text-[#2C2A29] rounded-xl text-xs font-medium"
                >
                  Zrušiť
                </button>
                <button
                  type="button"
                  disabled={!tempPreviewUrl}
                  onClick={() => tempPreviewUrl && handleSavePhoto(tempPreviewUrl)}
                  className="px-4 py-2 bg-[#2C2A29] hover:bg-[#C5A059] disabled:opacity-40 text-white rounded-xl text-xs font-medium transition-colors"
                >
                  Uložiť fotku
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

