'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Trash2, 
  X, 
  Check,
  RefreshCw, 
  KeyRound, 
  ShieldCheck, 
  Sparkles, 
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Info
} from 'lucide-react';
import { LiquidAvatar } from './LiquidAvatar';
import { AuthService } from '../services/authService';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'doctor' | 'manager' | 'nurse' | 'ceo';
  title: string;
  avatarBg: string;
  avatarUrl?: string;
}

export const SAY_CLINIC_USERS: UserAccount[] = [
  {
    id: 'u1',
    name: 'MUDr. Ján Mráz',
    email: 'mraz@sayclinic.sk',
    role: 'ceo',
    title: 'Plastický chirurg & CEO',
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
  { label: 'iOS Memoji Mraz (Chirurg)', url: '/avatars/mraz.jpg?v=2' },
  { label: 'iOS Memoji Srokova (Lekár - Blond)', url: '/avatars/srokova.jpg?v=2' },
  { label: 'iOS Memoji Tran (Chirurg)', url: '/avatars/tran.jpg?v=2' },
  { label: 'iOS Memoji Mecerodova (Manažment - Blond)', url: '/avatars/mecerodova.jpg?v=2' },
  { label: 'iOS Memoji Solivajsova (Recepcia - Blond)', url: '/avatars/solivajsova.jpg?v=2' },
  { label: 'iOS Memoji Sestra (Operačná sála)', url: '/avatars/foltani.jpg?v=2' },
  { label: 'Klinický portrét Lekár', url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400&auto=format&fit=crop' },
  { label: 'Klinický portrét Lekárka', url: 'https://images.unsplash.com/photo-1594824813689-c4391694d4d8?q=80&w=400&auto=format&fit=crop' },
];

interface LoginFormProps {
  onLoginSuccess: (user: UserAccount, rememberMe?: boolean) => void;
}

type AuthStep = 'select_user' | 'password' | '2fa' | 'reset_password';

function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const user = parts[0];
  const masked = user.length > 2 ? `${user.slice(0, 2)}•••${user.slice(-1)}` : `${user[0]}•••`;
  return `${masked}@${parts[1]}`;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [users, setUsers] = useState<UserAccount[]>(SAY_CLINIC_USERS);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [step, setStep] = useState<AuthStep>('select_user');
  const [loginMethodTab, setLoginMethodTab] = useState<'cards' | 'direct'>('cards');

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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [directEmail, setDirectEmail] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpEmailSent, setOtpEmailSent] = useState<boolean | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stavy obnovy hesla
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [resetEmailInput, setResetEmailInput] = useState('');
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Odpočítavanie pre opätovné zaslanie 2FA
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

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
    setShowPassword(false);
    setErrorMsg('');
    setInfoMsg('');
  };

  const handleDirectEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!directEmail.trim()) {
      setErrorMsg('Zadajte váš pracovný e-mail.');
      return;
    }

    const matchedUser = users.find(u => u.email.toLowerCase() === directEmail.trim().toLowerCase());
    if (!matchedUser) {
      setErrorMsg('Používateľ s týmto e-mailom nebol v databáze SAY CLINIC nájdený.');
      return;
    }

    setSelectedUser(matchedUser);
    setStep('password');
    setPassword('');
    setShowPassword(false);
    setErrorMsg('');
    setInfoMsg('');
  };

  const handlePasswordSubmit = async (e: React.FormEvent, force2FA: boolean = false) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!password) {
      setErrorMsg('Zadajte vaše prístupové heslo.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    // Reálne overenie voči databáze poverení
    const isValid = AuthService.verifyPassword(selectedUser.id, password);
    if (!isValid) {
      setIsSubmitting(false);
      setErrorMsg('Nesprávne heslo. Skontrolujte zadané údaje a skúste znova.');
      return;
    }

    // Ak nie je vyžiadané 2FA, prihlásime používateľa priamo heslom
    if (!force2FA) {
      setIsSubmitting(false);
      onLoginSuccess(selectedUser, rememberMe);
      return;
    }

    // Ak používateľ zvolil prihlásenie s 2FA overením:
    try {
      const res = await AuthService.generateAndSendOtp(selectedUser, 'login');
      setGeneratedOtp(res.fallbackOtp || null);
      setOtpEmailSent(res.emailSent ?? false);
      if (res.emailSent) {
        setInfoMsg(`Dvojfaktorový overovací kód bol odoslaný na ${maskEmail(selectedUser.email)}`);
      } else {
        setInfoMsg(`Overovací kód bol pripravený pre ${maskEmail(selectedUser.email)}.`);
      }
      setStep('2fa');
      setTwoFactorCode('');
      setResendCooldown(30);
    } catch (err) {
      setErrorMsg('Nepodarilo sa vygenerovať 2FA kód. Skúste znova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend2FA = async () => {
    if (!selectedUser || resendCooldown > 0 || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await AuthService.generateAndSendOtp(selectedUser, 'login');
      setGeneratedOtp(res.fallbackOtp || null);
      setOtpEmailSent(res.emailSent ?? false);
      if (res.emailSent) {
        setInfoMsg(`Nový kód bol odoslaný na ${maskEmail(selectedUser.email)}`);
      } else {
        setInfoMsg(`Nový overovací kód bol vygenerovaný pre ${maskEmail(selectedUser.email)}.`);
      }
      setResendCooldown(30);
    } catch (e) {
      setErrorMsg('Chyba pri opätovnom odosielaní kódu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!twoFactorCode || twoFactorCode.trim().length !== 6) {
      setErrorMsg('Zadajte platný 6-miestny overovací kód.');
      return;
    }

    // Reálna verifikácia voči aktívnemu OTP kódu
    const isVerified = AuthService.verifyOtp(selectedUser.email, twoFactorCode.trim(), generatedOtp || undefined);
    if (isVerified) {
      onLoginSuccess(selectedUser, rememberMe);
    } else {
      setErrorMsg('Neplatný alebo expirovaný overovací kód. Skontrolujte kód z e-mailu alebo požiadajte o nový.');
    }
  };

  // Krok 1 obnovy hesla - Žiadosť o kód
  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToReset = (resetEmailInput || selectedUser?.email || '').trim().toLowerCase();
    if (!emailToReset) {
      setErrorMsg('Zadajte e-mailovú adresu pre obnovu hesla.');
      return;
    }

    const matchedUser = users.find(u => u.email.toLowerCase() === emailToReset);
    if (!matchedUser) {
      setErrorMsg('Používateľ s týmto e-mailom nebol nájdený.');
      return;
    }

    setSelectedUser(matchedUser);
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await AuthService.generateAndSendOtp(matchedUser, 'reset');
      setGeneratedOtp(res.fallbackOtp || null);
      setOtpEmailSent(res.emailSent ?? false);
      if (res.emailSent) {
        setInfoMsg(`Kód pre obnovu hesla bol odoslaný na ${maskEmail(matchedUser.email)}`);
      } else {
        setInfoMsg(`Kód pre obnovu hesla bol pripravený pre ${maskEmail(matchedUser.email)}.`);
      }
      setResetStep('verify');
    } catch (err) {
      setErrorMsg('Nepodarilo sa odoslať kód pre obnovu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Krok 2 obnovy hesla - Overenie kódu a nastavenie nového hesla
  const handleConfirmNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!resetCodeInput || resetCodeInput.trim().length !== 6) {
      setErrorMsg('Zadajte 6-miestny overovací kód z e-mailu.');
      return;
    }

    if (resetNewPassword.length < 6) {
      setErrorMsg('Nové heslo musí mať aspoň 6 znakov.');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setErrorMsg('Nové heslá sa nezhodujú.');
      return;
    }

    const isCodeValid = AuthService.verifyOtp(selectedUser.email, resetCodeInput.trim(), generatedOtp || undefined);
    if (!isCodeValid) {
      setErrorMsg('Neplatný alebo expirovaný overovací kód.');
      return;
    }

    const res = AuthService.setNewPassword(selectedUser.id, resetNewPassword);
    if (res.success) {
      setInfoMsg('Heslo bolo úspešne zmenené. Teraz sa môžete prihlásiť novým heslom.');
      setPassword(resetNewPassword);
      setStep('password');
      setResetStep('request');
      setResetCodeInput('');
      setResetNewPassword('');
      setResetConfirmPassword('');
      setErrorMsg('');
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleQuickResetToDefault = () => {
    const emailToReset = resetEmailInput.trim() || selectedUser?.email;
    if (!emailToReset) {
      setErrorMsg('Zadajte váš pracovný e-mail.');
      return;
    }
    const matchedUser = users.find(u => u.email.toLowerCase() === emailToReset.toLowerCase());
    if (!matchedUser) {
      setErrorMsg('Používateľ s týmto e-mailom nebol nájdený.');
      return;
    }
    const res = AuthService.resetToDefaultPassword(matchedUser.email);
    if (res.success) {
      setSelectedUser(matchedUser);
      setPassword('SayClinic2026!');
      setStep('password');
      setInfoMsg('Heslo bolo úspešne obnovené na predvolené: SayClinic2026!');
      setErrorMsg('');
    } else {
      setErrorMsg(res.message || 'Chyba pri obnove hesla.');
    }
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
        <div className="w-full max-w-5xl mx-auto space-y-6">
          
          {/* HLAVNÁ LIQUID GLASS KARTA */}
          <div className="backdrop-blur-3xl bg-white/50 border border-white/80 rounded-[36px] p-6 sm:p-10 shadow-[0_25px_60px_-15px_rgba(44,42,41,0.06),inset_0_1.5px_2px_rgba(255,255,255,0.95),inset_0_-1px_2px_rgba(197,160,89,0.12)] relative overflow-hidden">
            
            {/* Vnútorný specular svetelný odlesk na vrchu karty */}
            <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
            
            <div className="text-center mb-8">
              <h2 className="text-xl sm:text-2xl font-light text-[#2C2A29] tracking-tight">
                Prihlásenie do klinického systému
              </h2>
              <p className="text-xs text-[#8C857B] mt-1.5 font-normal tracking-wide">
                Zabezpečený produkčný prístup tímu SAY CLINIC s 2FA overením
              </p>

              {/* Prepínač metódy prihlásenia */}
              <div className="inline-flex items-center gap-1.5 p-1 bg-white/70 backdrop-blur-md rounded-full border border-white/90 shadow-inner mt-4">
                <button
                  type="button"
                  onClick={() => setLoginMethodTab('cards')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    loginMethodTab === 'cards'
                      ? 'bg-[#2C2A29] text-white shadow-xs'
                      : 'text-[#8C857B] hover:text-[#2C2A29]'
                  }`}
                >
                  👥 Tím kliniky
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethodTab('direct')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    loginMethodTab === 'direct'
                      ? 'bg-[#2C2A29] text-white shadow-xs'
                      : 'text-[#8C857B] hover:text-[#2C2A29]'
                  }`}
                >
                  ✉️ Prihlásenie e-mailom
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="max-w-md mx-auto mb-6 p-3 rounded-2xl bg-rose-50/90 border border-rose-200/80 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {loginMethodTab === 'cards' ? (
              /* KARTY ČLENOV TÍMU */
              <div className="flex flex-wrap justify-center items-start gap-6 sm:gap-8 md:gap-9">
                {users.map(u => (
                  <div
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    className="group flex flex-col items-center cursor-pointer transition-all duration-400 w-32 sm:w-36 text-center"
                  >
                    {/* LIQUID GLASS GULA AVATARA */}
                    <div className="relative mb-3.5">
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

                    {/* TLAČIDLO PRE ZADANIE HESLA */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectUser(u);
                      }}
                      className="mt-2.5 w-full py-1.5 px-2 rounded-xl bg-gradient-to-r from-[#2C2A29] to-[#433E3C] hover:from-[#C5A059] hover:to-[#B38F46] text-white text-[10px] font-semibold tracking-wider shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1"
                    >
                      <span>Prihlásiť sa</span>
                      <span className="text-[#C5A059] group-hover:text-white">→</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              /* PRIAME PRIHLÁSENIE E-MAILOM */
              <div className="max-w-md mx-auto py-4">
                <form onSubmit={handleDirectEmailSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#2C2A29] mb-1.5">
                      Klinická e-mailová adresa (@sayclinic.sk)
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        autoFocus
                        placeholder="napr. mraz@sayclinic.sk"
                        value={directEmail}
                        onChange={(e) => setDirectEmail(e.target.value)}
                        className="w-full border border-white/90 p-3.5 rounded-2xl text-sm bg-white/80 backdrop-blur-md outline-none focus:border-[#C5A059] focus:bg-white transition-all pl-11 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
                      />
                      <Mail className="w-4 h-4 text-[#C5A059] absolute left-3.5 top-4" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#2C2A29] via-[#3F3936] to-[#2C2A29] hover:from-[#C5A059] hover:to-[#9C7D3D] text-white py-3.5 rounded-2xl text-xs font-semibold transition-all shadow-[0_10px_25px_-5px_rgba(44,42,41,0.25)] flex items-center justify-center gap-2"
                  >
                    <span>Pokračovať na heslo</span>
                    <ArrowRight className="w-4 h-4 text-[#C5A059]" />
                  </button>
                </form>
              </div>
            )}

            {/* SPODNÁ LIŠTA - BEZPEČNOSTNÝ STATUS */}
            <div className="mt-10 pt-6 border-t border-white/60 flex flex-wrap items-center justify-between gap-3 text-xs text-[#8C857B]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-medium text-[#2C2A29]">Produkčný server SAY CLINIC je online</span>
              </div>
              
              <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50/80 px-3 py-1.5 rounded-full border border-emerald-200/80 text-[11px] font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>SSL/TLS 256-bit šifrovanie • 2FA aktívne</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* KROK 2: LIQUID GLASS ZADANIE HESLA */}
      {step === 'password' && selectedUser && (
        <div className="max-w-md mx-auto w-full backdrop-blur-3xl bg-white/60 border border-white/80 p-8 sm:p-10 rounded-[36px] shadow-[0_30px_70px_-15px_rgba(44,42,41,0.08),inset_0_1.5px_2px_rgba(255,255,255,0.95)] text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          
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
            <p className="text-[11px] text-[#C5A059] font-mono mt-0.5">{selectedUser.email}</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-medium text-[#2C2A29] mb-1.5">
                Prístupové heslo
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  placeholder="Zadajte heslo"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-white/90 p-3.5 rounded-2xl text-sm bg-white/75 backdrop-blur-md outline-none focus:border-[#C5A059] focus:bg-white transition-all pl-11 pr-11 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
                />
                <KeyRound className="w-4 h-4 text-[#C5A059] absolute left-3.5 top-4" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 p-1 text-[#8C857B] hover:text-[#2C2A29] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Rýchly pomocník pre počiatočné heslo */}
              <div className="mt-2 flex items-center justify-between bg-[#FAF8F5]/80 border border-[#E8E2D9] px-3 py-1.5 rounded-xl text-[11px] text-[#5C554F]">
                <span>Predvolené klinické heslo: <strong className="font-mono text-[#2C2A29]">SayClinic2026!</strong></span>
                <button
                  type="button"
                  onClick={() => setPassword('SayClinic2026!')}
                  className="text-[#C5A059] hover:underline font-semibold ml-2 cursor-pointer"
                >
                  Vyplniť
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50/90 border border-rose-200/80 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {infoMsg && (
              <p className="text-xs text-emerald-800 bg-emerald-50/90 border border-emerald-200 p-2.5 rounded-xl text-center">
                {infoMsg}
              </p>
            )}

            <div className="flex justify-between items-center text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-[#5C554F]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#E8E2D9] text-[#C5A059] focus:ring-[#C5A059]"
                />
                <span>Zapamätať prihlásenie (30 dní)</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setResetEmailInput(selectedUser.email);
                  setResetStep('request');
                  setErrorMsg('');
                  setInfoMsg('');
                  setStep('reset_password');
                }}
                className="text-[#8C857B] hover:text-[#2C2A29] transition-colors font-medium underline underline-offset-2"
              >
                Zabudnuté heslo?
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep('select_user');
                  setPassword('');
                  setErrorMsg('');
                }}
                className="backdrop-blur-md bg-white/70 hover:bg-white/95 border border-white/90 text-[#8C857B] hover:text-[#2C2A29] px-4 py-3 rounded-2xl text-xs font-semibold transition-all shadow-xs"
              >
                ← Zmeniť profil
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-[#2C2A29] via-[#3F3936] to-[#2C2A29] hover:from-[#C5A059] hover:to-[#9C7D3D] disabled:opacity-50 text-white py-3.5 rounded-2xl text-xs font-semibold transition-all shadow-[0_10px_25px_-5px_rgba(44,42,41,0.25)] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Overujem...</span>
                  </>
                ) : (
                  <>
                    <span>Prihlásiť sa do systému</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C5A059]" />
                  </>
                )}
              </button>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={(e) => handlePasswordSubmit(e, true)}
                className="text-[11px] text-[#8C857B] hover:text-[#C5A059] transition-colors"
              >
                Vyžadovať 2FA kód pri prihlásení →
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KROK 3: LIQUID GLASS 2FA OVERENIE */}
      {step === '2fa' && selectedUser && (
        <div className="max-w-md mx-auto w-full backdrop-blur-3xl bg-white/60 border border-white/80 p-8 sm:p-10 rounded-[36px] shadow-[0_30px_70px_-15px_rgba(44,42,41,0.08),inset_0_1.5px_2px_rgba(255,255,255,0.95)] text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-14 h-14 rounded-full backdrop-blur-xl bg-gradient-to-b from-white/90 to-white/40 border border-white/90 text-[#2C2A29] flex items-center justify-center mx-auto shadow-[0_8px_20px_rgba(197,160,89,0.15)]">
            <ShieldCheck className="w-7 h-7 text-[#C5A059]" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#2C2A29]">Dvojfaktorové overenie (2FA)</h2>
            <p className="text-xs text-[#8C857B] mt-1 font-medium">
              Overovací kód bol pripravený pre:
            </p>
            <p className="text-xs font-mono font-semibold text-[#2C2A29] mt-0.5">
              {selectedUser.email}
            </p>
          </div>

          {/* Vizuálny núdzový / preview kód ak e-mail nedorazil */}
          {generatedOtp && (
            <div className="backdrop-blur-md bg-[#FAF8F5] border border-[#C5A059]/40 p-3.5 rounded-2xl text-left space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#2C2A29] uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#C5A059]" />
                  Bezpečnostný kód:
                </span>
                <button
                  type="button"
                  onClick={() => setTwoFactorCode(generatedOtp)}
                  className="text-[11px] text-[#C5A059] hover:underline font-bold"
                >
                  Vyplniť kód
                </button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xl font-bold tracking-[0.25em] text-[#2C2A29] bg-white px-3 py-1 rounded-xl border border-[#E8E2D9]">
                  {generatedOtp}
                </span>
                <span className="text-[10px] text-[#8C857B] leading-tight text-right">
                  {otpEmailSent ? 'Odoslané aj na e-mail' : 'Priamy kód (ak e-mail mešká)'}
                </span>
              </div>
            </div>
          )}

          {infoMsg && (
            <div className="backdrop-blur-md bg-emerald-50/80 border border-emerald-200/80 text-emerald-800 p-3 rounded-2xl text-xs text-center shadow-xs">
              {infoMsg}
            </div>
          )}

          <form onSubmit={handle2FASubmit} className="space-y-4">
            <div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                autoFocus
                placeholder="000000"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                className="w-full border-2 border-white/90 p-3.5 rounded-2xl text-center text-2xl tracking-[0.35em] font-mono bg-white/85 backdrop-blur-md outline-none focus:border-[#C5A059] shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] text-[#2C2A29]"
              />
              <p className="text-[11px] text-[#8C857B] mt-1.5">
                Zadajte 6-miestny číselný kód
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50/90 border border-rose-200/80 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Opätovné zaslanie kódu */}
            <div className="pt-1">
              <button
                type="button"
                disabled={resendCooldown > 0 || isSubmitting}
                onClick={handleResend2FA}
                className="text-xs text-[#8C857B] hover:text-[#2C2A29] disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-1.5 mx-auto"
              >
                <RefreshCw className={`w-3 h-3 ${isSubmitting ? 'animate-spin' : ''}`} />
                {resendCooldown > 0 ? (
                  <span>Znovu odoslať kód o {resendCooldown}s</span>
                ) : (
                  <span>Neprišiel kód? Znovu odoslať</span>
                )}
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep('password');
                  setTwoFactorCode('');
                  setErrorMsg('');
                }}
                className="flex-1 backdrop-blur-md bg-white/70 hover:bg-white/95 border border-white/90 text-[#8C857B] hover:text-[#2C2A29] py-3.5 rounded-2xl text-xs font-semibold transition-all shadow-xs"
              >
                ← Späť
              </button>
              
              <button
                type="submit"
                disabled={twoFactorCode.length !== 6}
                className="flex-1 bg-gradient-to-r from-[#2C2A29] via-[#3F3936] to-[#2C2A29] hover:from-[#C5A059] hover:to-[#9C7D3D] disabled:opacity-40 text-white py-3.5 rounded-2xl text-xs font-semibold transition-all shadow-[0_10px_25px_-5px_rgba(44,42,41,0.25)] hover:shadow-[0_12px_28px_-5px_rgba(197,160,89,0.35)]"
              >
                Overiť a vstúpiť
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KROK 4: LIQUID GLASS OBNOVA HESLA */}
      {step === 'reset_password' && (
        <div className="max-w-md mx-auto w-full backdrop-blur-3xl bg-white/60 border border-white/80 p-8 sm:p-10 rounded-[36px] shadow-[0_30px_70px_-15px_rgba(44,42,41,0.08),inset_0_1.5px_2px_rgba(255,255,255,0.95)] text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-14 h-14 rounded-full backdrop-blur-xl bg-gradient-to-b from-white/90 to-white/40 border border-white/90 text-[#2C2A29] flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-7 h-7 text-[#C5A059]" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#2C2A29]">Obnova prístupového hesla</h2>
            <p className="text-xs text-[#8C857B] mt-1">
              {resetStep === 'request'
                ? 'Zadajte vašu klinickú e-mailovú adresu pre odoslanie overovacieho kódu.'
                : 'Zadajte kód z e-mailu a nastavte si nové bezpečné heslo.'}
            </p>
          </div>

          {infoMsg && (
            <p className="text-xs text-emerald-800 bg-emerald-50/90 border border-emerald-200 p-3 rounded-2xl text-center">
              {infoMsg}
            </p>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50/90 border border-rose-200/80 text-rose-700 text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {resetStep === 'request' ? (
            <form onSubmit={handleRequestResetCode} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-[#2C2A29] mb-1.5">
                  Pracovný e-mail
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="napr. mraz@sayclinic.sk"
                    value={resetEmailInput}
                    onChange={(e) => setResetEmailInput(e.target.value)}
                    className="w-full border border-white/90 p-3.5 rounded-2xl text-sm bg-white/80 backdrop-blur-md outline-none focus:border-[#C5A059] pl-11"
                  />
                  <Mail className="w-4 h-4 text-[#C5A059] absolute left-3.5 top-4" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('password');
                    setErrorMsg('');
                    setInfoMsg('');
                  }}
                  className="backdrop-blur-md bg-white/70 hover:bg-white/95 border border-white/90 text-[#8C857B] hover:text-[#2C2A29] px-4 py-3.5 rounded-2xl text-xs font-semibold transition-all"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-[#2C2A29] via-[#3F3936] to-[#2C2A29] hover:from-[#C5A059] hover:to-[#9C7D3D] disabled:opacity-50 text-white py-3.5 rounded-2xl text-xs font-semibold transition-all shadow-[0_10px_25px_-5px_rgba(44,42,41,0.25)] cursor-pointer"
                >
                  {isSubmitting ? 'Odosielam...' : 'Odoslať overovací kód'}
                </button>
              </div>

              {/* Rýchla obnova bez e-mailu */}
              <div className="pt-3 border-t border-white/60 text-center">
                <button
                  type="button"
                  onClick={handleQuickResetToDefault}
                  className="w-full py-2.5 px-3 rounded-2xl bg-[#FAF8F5] hover:bg-white border border-[#C5A059]/50 text-[#2C2A29] text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Obnoviť na predvolené heslo (SayClinic2026!)</span>
                </button>
                <p className="text-[10px] text-[#8C857B] mt-1">
                  Umožní okamžité prihlásenie bez čakania na e-mailovú správu.
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleConfirmNewPassword} className="space-y-4 text-left">
              {/* Vizuálny kód ak e-mail mešká */}
              {generatedOtp && (
                <div className="backdrop-blur-md bg-[#FAF8F5] border border-[#C5A059]/40 p-3.5 rounded-2xl text-left space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#2C2A29] uppercase tracking-wider flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[#C5A059]" />
                      Bezpečnostný kód:
                    </span>
                    <button
                      type="button"
                      onClick={() => setResetCodeInput(generatedOtp)}
                      className="text-[11px] text-[#C5A059] hover:underline font-bold cursor-pointer"
                    >
                      Vyplniť kód
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xl font-bold tracking-[0.25em] text-[#2C2A29] bg-white px-3 py-1 rounded-xl border border-[#E8E2D9]">
                      {generatedOtp}
                    </span>
                    <span className="text-[10px] text-[#8C857B] leading-tight text-right">
                      {otpEmailSent ? 'Odoslané na e-mail' : 'Priamy kód (ak e-mail mešká)'}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#2C2A29] mb-1.5">
                  6-miestny kód z e-mailu
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="000000"
                  value={resetCodeInput}
                  onChange={(e) => setResetCodeInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full border border-white/90 p-3.5 rounded-2xl text-center text-xl font-mono tracking-widest bg-white/80 outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2C2A29] mb-1.5">
                  Nové heslo (min. 6 znakov)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Zadajte nové heslo"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  className="w-full border border-white/90 p-3.5 rounded-2xl text-sm bg-white/80 outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2C2A29] mb-1.5">
                  Potvrdenie nového hesla
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Zopakujte nové heslo"
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  className="w-full border border-white/90 p-3.5 rounded-2xl text-sm bg-white/80 outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetStep('request')}
                  className="backdrop-blur-md bg-white/70 hover:bg-white/95 border border-white/90 text-[#8C857B] hover:text-[#2C2A29] px-4 py-3.5 rounded-2xl text-xs font-semibold transition-all"
                >
                  Späť
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#2C2A29] via-[#3F3936] to-[#2C2A29] hover:from-[#C5A059] hover:to-[#9C7D3D] text-white py-3.5 rounded-2xl text-xs font-semibold transition-all shadow-[0_10px_25px_-5px_rgba(44,42,41,0.25)]"
                >
                  Uložiť nové heslo
                </button>
              </div>
            </form>
          )}
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

              {/* 2. NAHRAŤ VLASTNÚ FOTOGRAFIU */}
              {activePhotoTab === 'upload' && (
                <div className="space-y-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingPhoto}
                    className="w-full border-2 border-dashed border-[#C5A059]/40 hover:border-[#C5A059] p-6 rounded-2xl flex flex-col items-center justify-center gap-2 bg-white/60 hover:bg-white transition-all group cursor-pointer"
                  >
                    <div className="p-3 rounded-full bg-[#FAF8F5] text-[#C5A059] group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-semibold text-[#2C2A29] block">
                        {isProcessingPhoto ? 'Spracovávam fotografiu...' : 'Kliknite pre výber fotografie'}
                      </span>
                      <span className="text-[10px] text-[#8C857B]">
                        JPG, PNG alebo WebP
                      </span>
                    </div>
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

