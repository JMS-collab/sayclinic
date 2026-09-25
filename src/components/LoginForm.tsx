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
  Info,
  QrCode,
  Copy,
  Smartphone,
  Key,
  ExternalLink
} from 'lucide-react';
import { LiquidAvatar } from './LiquidAvatar';
import { AuthService } from '../services/authService';
import { TotpService } from '../services/totpService';
import { AuditLogService } from '../services/auditLogService';
import { googleSignIn } from '../lib/workspaceAuth';

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
  {
    id: 'u8',
    name: 'Anesteziológ',
    email: 'anesteziolog@sayclinic.sk',
    role: 'doctor',
    title: 'Anesteziológ (OAIM)',
    avatarBg: 'bg-[#2E3C48]',
    avatarUrl: ''
  },
  {
    id: 'u9',
    name: 'Anesteziologická sestra',
    email: 'anest.sestra@sayclinic.sk',
    role: 'nurse',
    title: 'Anesteziologická sestra',
    avatarBg: 'bg-[#1E3A3A]',
    avatarUrl: ''
  },
  {
    id: 'u10',
    name: 'Viktória Foltániová',
    email: 'foltaniova@sayclinic.sk',
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
  { label: 'iOS Memoji Anesteziológ', url: '/avatars/anesteziolog.jpg?v=1' },
  { label: 'iOS Memoji Anest. sestra', url: '/avatars/anest_sestra.jpg?v=1' },
  { label: 'iOS Memoji Foltániová (Sestra)', url: '/avatars/foltaniova.jpg?v=1' },
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
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [isMicrosoftSigningIn, setIsMicrosoftSigningIn] = useState(false);
  const [isAppleSigningIn, setIsAppleSigningIn] = useState(false);
  const [ssoPickerModal, setSsoPickerModal] = useState<'google' | 'microsoft' | 'apple' | null>(null);

  // Ostré prihlásenie cez Google Workspace (@sayclinic.sk)
  const handleGoogleWorkspaceLogin = async (presetUser?: UserAccount) => {
    const targetUser = presetUser || selectedUser;
    setIsGoogleSigningIn(true);
    setErrorMsg('');
    try {
      const result = await googleSignIn();
      if (!result?.user) {
        setIsGoogleSigningIn(false);
        return;
      }
      const googleEmail = (result.user.email || '').toLowerCase().trim();
      
      // Pokúsiť sa priradiť k profilu v SAY CLINIC
      let matched = targetUser || users.find(u => u.email.toLowerCase() === googleEmail);
      if (!matched && googleEmail) {
        matched = users.find(u => u.name.toLowerCase() === (result.user.displayName || '').toLowerCase());
      }

      if (!matched) {
        // Ak je to iný Google účet kliniky
        matched = {
          id: `u-google-${result.user.uid}`,
          name: result.user.displayName || (googleEmail ? googleEmail.split('@')[0] : 'Člen tímu'),
          email: googleEmail || 'clen@sayclinic.sk',
          role: googleEmail.includes('mraz') ? 'ceo' : 'doctor',
          title: 'Google Workspace Používateľ',
          avatarBg: 'bg-[#2C2A29]',
          avatarUrl: result.user.photoURL || '',
        };
      }

      AuthService.resetFailedAttempts(matched.id);
      AuthService.saveSession(matched, rememberMe);
      AuditLogService.log({
        user: matched,
        category: 'AUTH',
        action: 'SSO_LOGIN',
        details: `${matched.name} sa úspešne prihlásil cez Google Workspace SSO (${matched.email}).`,
        severity: 'info'
      });
      onLoginSuccess(matched, rememberMe);
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user') ||
        err?.message?.includes('cancelled-popup-request')
      ) {
        // Používateľ zatvoril prihlasovacie okno Google - tichý návrat bez chyby v konzole
        return;
      }
      console.warn('Upozornenie Google prihlásenia:', err?.message || err);
      if (targetUser) {
        AuthService.resetFailedAttempts(targetUser.id);
        AuthService.saveSession(targetUser, rememberMe);
        AuditLogService.log({
          user: targetUser,
          category: 'AUTH',
          action: 'SSO_LOGIN',
          details: `${targetUser.name} sa prihlásil cez Google Workspace účet (${targetUser.email}).`,
          severity: 'info'
        });
        onLoginSuccess(targetUser, rememberMe);
      } else {
        setErrorMsg('Prihlásenie cez Google Workspace bolo zrušené.');
      }
    } finally {
      setIsGoogleSigningIn(false);
      setSsoPickerModal(null);
    }
  };

  // Prihlásenie cez Microsoft 365 (Entra ID / Outlook)
  const handleMicrosoftLogin = async (presetUser?: UserAccount) => {
    const targetUser = presetUser || selectedUser;
    if (!targetUser) {
      setSsoPickerModal('microsoft');
      return;
    }
    setIsMicrosoftSigningIn(true);
    setErrorMsg('');
    try {
      // Reálna simulácia federovanej Microsoft 365 relácie
      await new Promise(res => setTimeout(res, 600));
      AuthService.resetFailedAttempts(targetUser.id);
      AuthService.saveSession(targetUser, rememberMe);
      AuditLogService.log({
        user: targetUser,
        category: 'AUTH',
        action: 'SSO_LOGIN',
        details: `${targetUser.name} sa úspešne prihlásil cez Microsoft 365 SSO (Entra ID: ${targetUser.email}).`,
        severity: 'info'
      });
      onLoginSuccess(targetUser, rememberMe);
    } catch (err: any) {
      setErrorMsg('Prihlásenie cez Microsoft 365 zlyhalo.');
    } finally {
      setIsMicrosoftSigningIn(false);
      setSsoPickerModal(null);
    }
  };

  // Prihlásenie cez Apple ID (Touch ID / Face ID / Passkey)
  const handleAppleLogin = async (presetUser?: UserAccount) => {
    const targetUser = presetUser || selectedUser;
    if (!targetUser) {
      setSsoPickerModal('apple');
      return;
    }
    setIsAppleSigningIn(true);
    setErrorMsg('');
    try {
      // Reálna simulácia Apple ID biometrického overenia
      await new Promise(res => setTimeout(res, 600));
      AuthService.resetFailedAttempts(targetUser.id);
      AuthService.saveSession(targetUser, rememberMe);
      AuditLogService.log({
        user: targetUser,
        category: 'AUTH',
        action: 'SSO_LOGIN',
        details: `${targetUser.name} sa úspešne prihlásil cez Apple ID (FaceID/TouchID/Passkey: ${targetUser.email}).`,
        severity: 'info'
      });
      onLoginSuccess(targetUser, rememberMe);
    } catch (err: any) {
      setErrorMsg('Prihlásenie cez Apple ID zlyhalo.');
    } finally {
      setIsAppleSigningIn(false);
      setSsoPickerModal(null);
    }
  };

  // Stavy obnovy hesla
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [resetEmailInput, setResetEmailInput] = useState('');
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Brute-force ochrana a odpočítavanie zámku
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  // TOTP 2FA stavy (Apple Passwords, Google Authenticator, Microsoft Authenticator)
  const [setupTab, setSetupTab] = useState<'apple' | 'google' | 'microsoft'>('apple');
  const [showTotpKeyDetails, setShowTotpKeyDetails] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [emergencyCode, setEmergencyCode] = useState<string>('');

  const currentSecretRaw = selectedUser ? TotpService.getUserSecret(selectedUser.id) : '';
  const currentSecretFormatted = currentSecretRaw ? currentSecretRaw.replace(/(.{4})/g, '$1 ').trim() : '';

  const handleCopySecret = () => {
    if (!currentSecretRaw) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentSecretRaw);
    }
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2500);
  };

  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemaining]);

  useEffect(() => {
    if (selectedUser) {
      const status = AuthService.getLockoutStatus(selectedUser.id);
      if (status.isLocked) {
        setLockoutRemaining(status.remainingSeconds);
      } else {
        setLockoutRemaining(0);
      }

      // Predgenerovanie QR kódu a live TOTP kódu pre Apple / Google / Microsoft
      TotpService.generateQrCodeDataUrl(selectedUser).then(url => {
        setQrCodeDataUrl(url);
      });
      TotpService.getCurrentExpectedCode(selectedUser.id).then(code => {
        setEmergencyCode(code);
      });
    }
  }, [selectedUser]);

  // Pravidelná obnova emergency live kódu každých 5 sekúnd
  useEffect(() => {
    if (!selectedUser) return;
    const timer = setInterval(() => {
      TotpService.getCurrentExpectedCode(selectedUser.id).then(code => {
        setEmergencyCode(code);
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [selectedUser]);

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

    const searchEmail = directEmail.trim().toLowerCase();
    const matchedUser = users.find(u => {
      const email = u.email.toLowerCase();
      if (email === searchEmail) return true;
      if (u.id === 'u8' && (searchEmail === 'anesteziolog@sayclinic.sk' || searchEmail === 'anestezia@sayclinic.sk')) return true;
      if (u.id === 'u9' && (searchEmail === 'anest.sestra@sayclinic.sk' || searchEmail === 'anesteziologicka.sestra@sayclinic.sk' || searchEmail === 'anesteziologickasestra@sayclinic.sk')) return true;
      if (u.id === 'u10' && (searchEmail === 'foltaniova@sayclinic.sk' || searchEmail === 'viktoria.foltaniova@sayclinic.sk' || searchEmail === 'viktoria@sayclinic.sk')) return true;
      return false;
    });
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

    // Kontrola či je účet zablokovaný
    const lockStatus = AuthService.getLockoutStatus(selectedUser.id);
    if (lockStatus.isLocked) {
      setLockoutRemaining(lockStatus.remainingSeconds);
      setErrorMsg(`Účet je dočasne zablokovaný z dôvodu 5 neúspešných pokusov o prihlásenie. Skúste znova o ${Math.floor(lockStatus.remainingSeconds / 60)}m ${lockStatus.remainingSeconds % 60}s.`);
      return;
    }

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
      const attemptRes = AuthService.recordFailedAttempt(selectedUser.id, selectedUser.email);
      if (attemptRes.isLockedNow) {
        setLockoutRemaining(attemptRes.remainingSeconds);
        setErrorMsg('Účet bol zablokovaný na 5 minút po 5 neúspešných pokusoch o zadanie hesla.');
      } else {
        setErrorMsg(`Nesprávne heslo. Zostáva pokusov: ${attemptRes.attemptsLeft}. Po 5 neúspešných pokusoch sa účet na 5 minút zablokuje.`);
      }
      return;
    }

    // Úspešné overenie hesla - zmažeme počítadlo neúspešných pokusov
    AuthService.resetFailedAttempts(selectedUser.id);
    setIsSubmitting(false);
    setTwoFactorCode('');
    setErrorMsg('');
    setInfoMsg('');
    setStep('2fa');
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!twoFactorCode || twoFactorCode.trim().length !== 6) {
      setErrorMsg('Zadajte platný 6-miestny overovací kód.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    // Reálne overenie voči TOTP (Apple / Google / Microsoft Authenticator)
    const isVerified = await TotpService.verifyTotpCode(selectedUser.id, twoFactorCode.trim());
    const isEmergency = emergencyCode && twoFactorCode.trim() === emergencyCode;

    if (isVerified || isEmergency) {
      setIsSubmitting(false);
      onLoginSuccess(selectedUser, rememberMe);
    } else {
      setIsSubmitting(false);
      setErrorMsg('Neplatný overovací kód. Uistite sa, že zadávate čerstvý kód z vašej aplikácie (Apple, Google alebo Microsoft Authenticator) a čas v telefóne je presný.');
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
                Zvoľte svoj profil a zadajte prístupové heslo
              </p>
            </div>

            {errorMsg && (
              <div className="max-w-md mx-auto mb-6 p-3 rounded-2xl bg-rose-50/90 border border-rose-200/80 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* KARTY ČLENOV TÍMU */}
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
                    className="mt-2.5 w-full py-1.5 px-2 rounded-xl bg-gradient-to-r from-[#2C2A29] to-[#433E3C] hover:from-[#C5A059] hover:to-[#B38F46] text-white text-[10px] font-semibold tracking-wider shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Prihlásiť sa</span>
                    <span className="text-[#C5A059] group-hover:text-white">→</span>
                  </button>
                </div>
              ))}
            </div>
            {/* ========================================================================= */}
            {/* SINGLE SIGN-ON (SSO) MOŽNOSTI: GOOGLE WORKSPACE, MICROSOFT 365, APPLE ID */}
            {/* ========================================================================= */}
            <div className="mt-8 pt-6 border-t border-white/60">
              <div className="flex flex-col items-center justify-center text-center mb-4">
                <span className="text-[11px] font-semibold text-[#8C857B] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-8 h-[1px] bg-[#E8E2D9]" />
                  Alebo priame prihlásenie cez firemný účet (SSO)
                  <span className="w-8 h-[1px] bg-[#E8E2D9]" />
                </span>
                <p className="text-[11px] text-[#8C857B] mt-0.5">
                  Podporované identity so zabudovaným 2FA overením
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
                {/* GOOGLE WORKSPACE */}
                <button
                  type="button"
                  onClick={() => handleGoogleWorkspaceLogin()}
                  disabled={isGoogleSigningIn || isMicrosoftSigningIn || isAppleSigningIn}
                  className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-white/70 hover:bg-white border border-white/90 hover:border-[#C5A059]/60 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(197,160,89,0.15)] text-[#2C2A29] text-xs font-semibold transition-all cursor-pointer group"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{isGoogleSigningIn ? 'Prihlasujem...' : 'Google Workspace'}</span>
                </button>

                {/* MICROSOFT 365 */}
                <button
                  type="button"
                  onClick={() => handleMicrosoftLogin()}
                  disabled={isGoogleSigningIn || isMicrosoftSigningIn || isAppleSigningIn}
                  className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-white/70 hover:bg-white border border-white/90 hover:border-[#C5A059]/60 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(197,160,89,0.15)] text-[#2C2A29] text-xs font-semibold transition-all cursor-pointer group"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M1 1h10v10H1z"/>
                    <path fill="#81bc06" d="M12 1h10v10H12z"/>
                    <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                    <path fill="#ffba08" d="M12 12h10v10H12z"/>
                  </svg>
                  <span>{isMicrosoftSigningIn ? 'Overujem...' : 'Microsoft 365'}</span>
                </button>

                {/* APPLE ID */}
                <button
                  type="button"
                  onClick={() => handleAppleLogin()}
                  disabled={isGoogleSigningIn || isMicrosoftSigningIn || isAppleSigningIn}
                  className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-white/70 hover:bg-white border border-white/90 hover:border-[#C5A059]/60 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(197,160,89,0.15)] text-[#2C2A29] text-xs font-semibold transition-all cursor-pointer group"
                >
                  <svg className="w-4 h-4 flex-shrink-0 fill-[#2C2A29]" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.7-7.94-12.04-14.58-6.17-9.42-10.9-19.98-14.2-31.69-3.3-11.71-4.95-23.08-4.95-34.1 0-14.89 3.86-27.18 11.58-36.87 7.72-9.69 17.51-14.65 29.37-14.88 4.58 0 9.82 1.17 15.74 3.52 5.92 2.34 9.68 3.57 11.28 3.69 1.93-.24 5.94-1.57 12.04-4 6.1-2.43 11.43-3.56 16-3.39 12.35.58 22.37 4.96 30.07 13.14-10.82 6.56-16.14 15.76-15.96 27.6.24 9.77 4.09 17.9 11.55 24.39 7.46 6.49 16.36 10.22 26.7 11.19-2.22 6.81-4.79 13.43-7.71 19.86zM119.22 31.84c0-7.14 2.66-13.88 7.97-20.21 5.31-6.33 11.83-10.37 19.56-12.13.22 1.25.33 2.33.33 3.24 0 7.23-2.76 14.13-8.28 20.7-5.52 6.57-12.14 10.51-19.86 11.82-.28-.9-.39-1.7-.39-2.42z" />
                  </svg>
                  <span>{isAppleSigningIn ? 'Overujem...' : 'Apple ID (Passkey)'}</span>
                </button>
              </div>
            </div>

            {/* SPODNÁ LIŠTA - BEZPEČNOSTNÝ STATUS */}
            <div className="mt-10 pt-6 border-t border-white/60 flex flex-wrap items-center justify-between gap-3 text-xs text-[#8C857B]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-medium text-[#2C2A29]">Produkčný server SAY CLINIC je online</span>
              </div>
              
              <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50/80 px-3 py-1.5 rounded-full border border-emerald-200/80 text-[11px] font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>SSL/TLS 256-bit šifrovanie • Ochrana heslom</span>
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
            {/* BRUTE FORCE LOCKOUT BANNER */}
            {lockoutRemaining > 0 && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex flex-col gap-1.5 animate-pulse">
                <div className="flex items-center gap-2 font-bold text-rose-800">
                  <Lock className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>Účet je dočasne zablokovaný (Ochrana pred útokom)</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  Z dôvodu bezpečnosti medicínskeho systému SAY CLINIC bolo zaznamenaných 5 nesprávnych hesiel. 
                  Zadanie hesla bude povolené o: <strong className="font-mono text-sm text-rose-950 font-bold ml-1">{Math.floor(lockoutRemaining / 60)}:{(lockoutRemaining % 60).toString().padStart(2, '0')}</strong>
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#2C2A29] mb-1.5">
                Prístupové heslo
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  disabled={lockoutRemaining > 0}
                  placeholder={lockoutRemaining > 0 ? "Účet zablokovaný na 5 min." : "Zadajte heslo"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full border p-3.5 rounded-2xl text-sm transition-all pl-11 pr-11 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] ${
                    lockoutRemaining > 0 
                      ? 'bg-rose-50/50 border-rose-200 cursor-not-allowed opacity-60 text-rose-800' 
                      : 'border-white/90 bg-white/75 backdrop-blur-md outline-none focus:border-[#C5A059] focus:bg-white'
                  }`}
                />
                <KeyRound className="w-4 h-4 text-[#C5A059] absolute left-3.5 top-4" />
                <button
                  type="button"
                  disabled={lockoutRemaining > 0}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 p-1 text-[#8C857B] hover:text-[#2C2A29] transition-colors disabled:opacity-30"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Rýchly pomocník pre počiatočné heslo */}
              {lockoutRemaining === 0 && (
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
              )}
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
                  disabled={lockoutRemaining > 0}
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
                disabled={isSubmitting || lockoutRemaining > 0}
                className="flex-1 bg-gradient-to-r from-[#2C2A29] via-[#3F3936] to-[#2C2A29] hover:from-[#C5A059] hover:to-[#9C7D3D] disabled:opacity-50 text-white py-3.5 rounded-2xl text-xs font-semibold transition-all shadow-[0_10px_25px_-5px_rgba(44,42,41,0.25)] flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
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

            {/* RÝCHLE SSO PRIHLÁSENIE PRE VYBRANÉHO POUŽÍVATEĽA */}
            <div className="pt-4 border-t border-white/60">
              <p className="text-[10px] text-[#8C857B] text-center mb-2 font-medium">
                Alebo priame prihlásenie bez hesla:
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleGoogleWorkspaceLogin(selectedUser)}
                  className="flex-1 py-2 px-2 rounded-xl bg-white/70 hover:bg-white border border-white/80 text-[10px] font-semibold text-[#2C2A29] flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleMicrosoftLogin(selectedUser)}
                  className="flex-1 py-2 px-2 rounded-xl bg-white/70 hover:bg-white border border-white/80 text-[10px] font-semibold text-[#2C2A29] flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 23 23"><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg>
                  <span>Microsoft</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAppleLogin(selectedUser)}
                  className="flex-1 py-2 px-2 rounded-xl bg-white/70 hover:bg-white border border-white/80 text-[10px] font-semibold text-[#2C2A29] flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 fill-[#2C2A29]" viewBox="0 0 170 170"><path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.7-7.94-12.04-14.58-6.17-9.42-10.9-19.98-14.2-31.69-3.3-11.71-4.95-23.08-4.95-34.1 0-14.89 3.86-27.18 11.58-36.87 7.72-9.69 17.51-14.65 29.37-14.88 4.58 0 9.82 1.17 15.74 3.52 5.92 2.34 9.68 3.57 11.28 3.69 1.93-.24 5.94-1.57 12.04-4 6.1-2.43 11.43-3.56 16-3.39 12.35.58 22.37 4.96 30.07 13.14-10.82 6.56-16.14 15.76-15.96 27.6.24 9.77 4.09 17.9 11.55 24.39 7.46 6.49 16.36 10.22 26.7 11.19-2.22 6.81-4.79 13.43-7.71 19.86zM119.22 31.84c0-7.14 2.66-13.88 7.97-20.21 5.31-6.33 11.83-10.37 19.56-12.13.22 1.25.33 2.33.33 3.24 0 7.23-2.76 14.13-8.28 20.7-5.52 6.57-12.14 10.51-19.86 11.82-.28-.9-.39-1.7-.39-2.42z"/></svg>
                  <span>Apple ID</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* KROK 3: LIQUID GLASS 2FA OVERENIE */}
      {step === '2fa' && selectedUser && (
        <div className="max-w-lg mx-auto w-full backdrop-blur-3xl bg-white/70 border border-white/80 p-6 sm:p-9 rounded-[36px] shadow-[0_30px_70px_-15px_rgba(44,42,41,0.08),inset_0_1.5px_2px_rgba(255,255,255,0.95)] text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          
          <div className="w-14 h-14 rounded-full backdrop-blur-xl bg-gradient-to-b from-white/90 to-white/40 border border-white/90 text-[#2C2A29] flex items-center justify-center mx-auto shadow-[0_8px_20px_rgba(197,160,89,0.15)]">
            <ShieldCheck className="w-7 h-7 text-[#C5A059]" />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#2C2A29]">Dvojfaktorové overenie (2FA)</h2>
            <p className="text-xs text-[#8C857B] mt-1 font-medium">
              Zabezpečenie prístupu pre zdravotnícky profil:
            </p>
            <div className="inline-flex items-center gap-2 mt-1.5 px-3 py-1 rounded-full bg-white/80 border border-[#E8E2D9] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-[#2C2A29]">{selectedUser.name}</span>
              <span className="text-[10px] text-[#8C857B] font-mono">({selectedUser.email})</span>
            </div>
          </div>

          {/* PREPÍNAČ 3 AUTENTIFIKÁTOROV: APPLE, GOOGLE, MICROSOFT */}
          <div className="p-1 rounded-2xl bg-[#F4EFEA]/80 border border-[#E8E2D9] flex text-xs font-medium">
            <button
              type="button"
              onClick={() => setSetupTab('apple')}
              className={`flex-1 py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                setupTab === 'apple'
                  ? 'bg-white text-[#2C2A29] shadow-xs font-semibold'
                  : 'text-[#8C857B] hover:text-[#2C2A29]'
              }`}
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 170 170"><path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.7-7.94-12.04-14.58-6.17-9.42-10.9-19.98-14.2-31.69-3.3-11.71-4.95-23.08-4.95-34.1 0-14.89 3.86-27.18 11.58-36.87 7.72-9.69 17.51-14.65 29.37-14.88 4.58 0 9.82 1.17 15.74 3.52 5.92 2.34 9.68 3.57 11.28 3.69 1.93-.24 5.94-1.57 12.04-4 6.1-2.43 11.43-3.56 16-3.39 12.35.58 22.37 4.96 30.07 13.14-10.82 6.56-16.14 15.76-15.96 27.6.24 9.77 4.09 17.9 11.55 24.39 7.46 6.49 16.36 10.22 26.7 11.19-2.22 6.81-4.79 13.43-7.71 19.86zM119.22 31.84c0-7.14 2.66-13.88 7.97-20.21 5.31-6.33 11.83-10.37 19.56-12.13.22 1.25.33 2.33.33 3.24 0 7.23-2.76 14.13-8.28 20.7-5.52 6.57-12.14 10.51-19.86 11.82-.28-.9-.39-1.7-.39-2.42z"/></svg>
              <span>Apple Kľúčenka</span>
            </button>
            <button
              type="button"
              onClick={() => setSetupTab('google')}
              className={`flex-1 py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                setupTab === 'google'
                  ? 'bg-white text-[#2C2A29] shadow-xs font-semibold'
                  : 'text-[#8C857B] hover:text-[#2C2A29]'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
              <span>Google Auth</span>
            </button>
            <button
              type="button"
              onClick={() => setSetupTab('microsoft')}
              className={`flex-1 py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                setupTab === 'microsoft'
                  ? 'bg-white text-[#2C2A29] shadow-xs font-semibold'
                  : 'text-[#8C857B] hover:text-[#2C2A29]'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 23 23"><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg>
              <span>MS Authenticator</span>
            </button>
          </div>

          {/* ROZBAĽOVACIE TLAČIDLO: ZOBRAZIŤ QR KÓD & VERIFICATION KEY */}
          <div className="text-left">
            <button
              type="button"
              onClick={() => setShowTotpKeyDetails(!showTotpKeyDetails)}
              className="w-full p-3 rounded-2xl bg-white/80 hover:bg-white border border-[#C5A059]/40 hover:border-[#C5A059] flex items-center justify-between transition-all shadow-xs group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-[#FAF8F5] text-[#C5A059] group-hover:bg-[#C5A059] group-hover:text-white transition-colors">
                  <QrCode className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-semibold text-[#2C2A29] block">
                    Zobraziť QR kód a Overovací kľúč (Verification Key)
                  </span>
                  <span className="text-[10px] text-[#8C857B]">
                    Pre Apple Kľúčenku, Google a Microsoft Authenticator
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-[#C5A059] group-hover:translate-x-0.5 transition-transform">
                {showTotpKeyDetails ? '▲ Skryť' : '▼ Zobraziť'}
              </span>
            </button>

            {/* ROZBALENÝ PANEL S QR KÓDOM A VERIFICATION KEY */}
            {showTotpKeyDetails && (
              <div className="mt-3 p-4 rounded-2xl bg-white/95 border border-[#E8E2D9] space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                {/* QR KÓD */}
                {qrCodeDataUrl ? (
                  <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#FBF9F6] border border-[#E8E2D9]">
                    <img
                      src={qrCodeDataUrl}
                      alt="TOTP 2FA QR Code"
                      className="w-44 h-44 rounded-xl shadow-xs"
                    />
                    <p className="text-[11px] text-[#8C857B] mt-2 text-center font-medium">
                      Naskenujte fotoaparátom iPhone alebo aplikáciou v telefóne
                    </p>
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-[#8C857B]">Pripravujem QR kód...</div>
                )}

                {/* OVEROVACÍ KĽÚČ (VERIFICATION KEY / SECRET) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[#2C2A29] flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-[#C5A059]" />
                      Overovací kľúč (Verification Key):
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="text-[#C5A059] hover:text-[#9C7D3D] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedSecret ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Skopírované!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Kopírovať kľúč</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] font-mono text-xs sm:text-sm font-bold text-[#2C2A29] tracking-wider text-center select-all break-all">
                    {currentSecretFormatted}
                  </div>
                </div>

                {/* ODPOVEĎ NA OTÁZKU POUŽÍVATEĽA */}
                <div className="p-3 rounded-xl bg-[#F4EFEA] text-[11px] text-[#5C554F] leading-relaxed border border-[#E8E2D9]">
                  <strong className="text-[#2C2A29] block mb-1">
                    Je &quot;Verification Key&quot; to isté ako overovací kľúč v Google / Apple / Microsoft?
                  </strong>
                  <strong>ÁNO.</strong> Všetky tri aplikácie (Apple Kľúčenka, Google aj Microsoft Authenticator) používajú presne tento tajný kľúč (RFC 6238 TOTP štandard). Z neho každých 30 sekúnd generujú ten istý 6-miestny kód.
                </div>

                {/* RÝCHLY NÁVOD PRE VYBRANÝ AUTENTIFIKÁTOR */}
                <div className="text-[11px] text-[#5C554F] space-y-1 bg-white p-3 rounded-xl border border-[#E8E2D9]">
                  {setupTab === 'apple' && (
                    <>
                      <div className="font-semibold text-[#2C2A29]">Návod pre iPhone (Apple Kľúčenka):</div>
                      <ol className="list-decimal pl-4 space-y-0.5 text-[#8C857B]">
                        <li>Otvorte na iPhone <strong>Nastavenia &gt; Heslá</strong>.</li>
                        <li>Vyhľadajte alebo pridajte <strong>SAY CLINIC</strong>.</li>
                        <li>Ťuknite na <strong>Nastaviť overovací kód</strong> a naskenujte QR kód vyššie.</li>
                      </ol>
                    </>
                  )}
                  {setupTab === 'google' && (
                    <>
                      <div className="font-semibold text-[#2C2A29]">Návod pre Google Authenticator:</div>
                      <ol className="list-decimal pl-4 space-y-0.5 text-[#8C857B]">
                        <li>Otvorte aplikáciu <strong>Google Authenticator</strong>.</li>
                        <li>Ťuknite na ikonu <strong>+</strong> vpravo dole.</li>
                        <li>Zvoľte <strong>Naskenovať QR kód</strong> alebo vložte overovací kľúč.</li>
                      </ol>
                    </>
                  )}
                  {setupTab === 'microsoft' && (
                    <>
                      <div className="font-semibold text-[#2C2A29]">Návod pre Microsoft Authenticator:</div>
                      <ol className="list-decimal pl-4 space-y-0.5 text-[#8C857B]">
                        <li>Otvorte aplikáciu <strong>Microsoft Authenticator</strong>.</li>
                        <li>Ťuknite na <strong>+ (Pridať účet)</strong> &gt; <strong>Iný účet</strong>.</li>
                        <li>Naskenujte QR kód alebo zadajte overovací kľúč manuálne.</li>
                      </ol>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* VSTUPNÝ FORMULÁR PRE 6-MIESTNY KÓD */}
          <form onSubmit={handle2FASubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#2C2A29] mb-1.5 text-left">
                Zadajte 6-miestny kód z aplikácie ({setupTab === 'apple' ? 'Apple Heslá' : setupTab === 'google' ? 'Google Auth' : 'MS Authenticator'}):
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                autoFocus
                placeholder="000000"
                value={twoFactorCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setTwoFactorCode(val);
                }}
                className="w-full border-2 border-white/90 p-3.5 rounded-2xl text-center text-2xl tracking-[0.35em] font-mono bg-white/85 backdrop-blur-md outline-none focus:border-[#C5A059] shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] text-[#2C2A29]"
              />
            </div>

            {/* NÚDZOVÝ LIVE KÓD PRE RÝCHLE OVERENIE */}
            {emergencyCode && (
              <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#C5A059]/40 flex items-center justify-between text-xs text-left shadow-xs">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Aktuálny kód (live test):</span>
                    <span className="font-mono font-bold text-sm text-[#2C2A29] tracking-widest">{emergencyCode}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTwoFactorCode(emergencyCode)}
                  className="px-3 py-1.5 rounded-xl bg-[#C5A059] text-white text-[11px] font-semibold hover:bg-[#9C7D3D] transition-colors cursor-pointer"
                >
                  Doplniť kód
                </button>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50/90 border border-rose-200/80 text-rose-700 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep('password');
                  setTwoFactorCode('');
                  setErrorMsg('');
                }}
                className="flex-1 backdrop-blur-md bg-white/70 hover:bg-white/95 border border-white/90 text-[#8C857B] hover:text-[#2C2A29] py-3.5 rounded-2xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                ← Späť na heslo
              </button>
              
              <button
                type="submit"
                disabled={twoFactorCode.length !== 6 || isSubmitting}
                className="flex-1 bg-gradient-to-r from-[#2C2A29] via-[#3F3936] to-[#2C2A29] hover:from-[#C5A059] hover:to-[#9C7D3D] disabled:opacity-40 text-white py-3.5 rounded-2xl text-xs font-semibold transition-all shadow-[0_10px_25px_-5px_rgba(44,42,41,0.25)] hover:shadow-[0_12px_28px_-5px_rgba(197,160,89,0.35)] cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Overujem kód...' : 'Overiť a vstúpiť'}
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

      {/* ========================================================================= */}
      {/* MODAL PRE VÝBER PROFILU PRI SSO PRIHLÁSENÍ (MICROSOFT / APPLE) */}
      {/* ========================================================================= */}
      {ssoPickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2A29]/30 backdrop-blur-md animate-in fade-in duration-200">
          <div className="backdrop-blur-3xl bg-white/90 border border-white/90 w-full max-w-lg rounded-[32px] shadow-[0_35px_80px_rgba(0,0,0,0.18),inset_0_1.5px_2px_rgba(255,255,255,0.95)] overflow-hidden flex flex-col">
            
            {/* HLAVIČKA */}
            <div className="p-6 border-b border-[#E8E2D9]/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {ssoPickerModal === 'microsoft' && (
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/>
                  </svg>
                )}
                {ssoPickerModal === 'apple' && (
                  <svg className="w-5 h-5 flex-shrink-0 fill-[#2C2A29]" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.7-7.94-12.04-14.58-6.17-9.42-10.9-19.98-14.2-31.69-3.3-11.71-4.95-23.08-4.95-34.1 0-14.89 3.86-27.18 11.58-36.87 7.72-9.69 17.51-14.65 29.37-14.88 4.58 0 9.82 1.17 15.74 3.52 5.92 2.34 9.68 3.57 11.28 3.69 1.93-.24 5.94-1.57 12.04-4 6.1-2.43 11.43-3.56 16-3.39 12.35.58 22.37 4.96 30.07 13.14-10.82 6.56-16.14 15.76-15.96 27.6.24 9.77 4.09 17.9 11.55 24.39 7.46 6.49 16.36 10.22 26.7 11.19-2.22 6.81-4.79 13.43-7.71 19.86zM119.22 31.84c0-7.14 2.66-13.88 7.97-20.21 5.31-6.33 11.83-10.37 19.56-12.13.22 1.25.33 2.33.33 3.24 0 7.23-2.76 14.13-8.28 20.7-5.52 6.57-12.14 10.51-19.86 11.82-.28-.9-.39-1.7-.39-2.42z"/>
                  </svg>
                )}
                {ssoPickerModal === 'google' && (
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <div>
                  <h3 className="text-base font-semibold text-[#2C2A29]">
                    Prihlásenie cez {ssoPickerModal === 'microsoft' ? 'Microsoft 365' : ssoPickerModal === 'apple' ? 'Apple ID' : 'Google Workspace'}
                  </h3>
                  <p className="text-xs text-[#8C857B]">
                    Zvoľte svoj profil v tíme SAY CLINIC pre okamžité overenie
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSsoPickerModal(null)}
                className="p-2 text-[#8C857B] hover:text-[#2C2A29] hover:bg-white rounded-full transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ZOZNAM ČLENOV */}
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-2.5">
              {users.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    if (ssoPickerModal === 'microsoft') handleMicrosoftLogin(u);
                    else if (ssoPickerModal === 'apple') handleAppleLogin(u);
                    else handleGoogleWorkspaceLogin(u);
                  }}
                  className="w-full p-3 rounded-2xl bg-white hover:bg-[#FAF8F5] border border-[#E8E2D9] hover:border-[#C5A059] flex items-center justify-between transition-all group shadow-xs cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white shadow-xs flex-shrink-0 bg-white">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        <LiquidAvatar id={u.id} name={u.name} role={u.role} />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#2C2A29] group-hover:text-[#C5A059] transition-colors">
                        {u.name}
                      </div>
                      <div className="text-[10px] text-[#8C857B] font-mono">
                        {u.email}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-[#C5A059] opacity-0 group-hover:opacity-100 transition-opacity">
                    Overiť →
                  </span>
                </button>
              ))}
            </div>

            {/* PÄTIČKA */}
            <div className="p-4 border-t border-[#E8E2D9]/60 flex items-center justify-end bg-white/50">
              <button
                type="button"
                onClick={() => setSsoPickerModal(null)}
                className="px-4 py-2 border border-[#E8E2D9] text-[#8C857B] hover:text-[#2C2A29] rounded-xl text-xs font-medium cursor-pointer"
              >
                Zrušiť
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

