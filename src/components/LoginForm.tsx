'use client';

import React, { useState } from 'react';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'doctor' | 'manager' | 'nurse';
  title: string;
  avatarBg: string;
}

export const SAY_CLINIC_USERS: UserAccount[] = [
  // LEKÁRI
  { id: 'u1', name: 'MUDr. Ján Mráz', email: 'mraz@sayclinic.sk', role: 'doctor', title: 'Plastický chirurg', avatarBg: 'bg-[#2C2A29]' },
  { id: 'u2', name: 'MUDr. Zuzana Sroková', email: 'srokova@sayclinic.sk', role: 'doctor', title: 'Lekár / Chirurg', avatarBg: 'bg-[#2C2A29]' },
  { id: 'u3', name: 'MUDr. Minh Tuong Tran', email: 'tran@sayclinic.sk', role: 'doctor', title: 'Lekár / Chirurg', avatarBg: 'bg-[#2C2A29]' },
  
  // MANAŽMENT
  { id: 'u4', name: 'Ing. Barbara Mecerodová, MBA', email: 'mecerodova@sayclinic.sk', role: 'manager', title: 'Klinický Manažment', avatarBg: 'bg-[#C5A059]' },
  { id: 'u5', name: 'Mgr. Elena Solivajsová', email: 'solivajsova@sayclinic.sk', role: 'manager', title: 'Klinický Manažment', avatarBg: 'bg-[#C5A059]' },

  // SESTRY
  { id: 'u6', name: 'Ema Foltáni', email: 'foltani@sayclinic.sk', role: 'nurse', title: 'Zdravotná sestra', avatarBg: 'bg-emerald-800' },
  { id: 'u7', name: 'Sabina Lenhartová', email: 'lenhartova@sayclinic.sk', role: 'nurse', title: 'Zdravotná sestra', avatarBg: 'bg-emerald-800' },
];

interface LoginFormProps {
  onLoginSuccess: (user: UserAccount) => void;
}

type AuthStep = 'select_user' | 'password' | '2fa' | 'reset_password';

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [step, setStep] = useState<AuthStep>('select_user');

  // Formulárové stavy
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  
  // Stavy chýb a notifikácií
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleSelectUser = (user: UserAccount) => {
    setSelectedUser(user);
    setStep('password');
    setPassword('');
    setErrorMsg('');
    setInfoMsg('');
  };

  // 1. KROK: Overenie hesla + Generovanie 2FA (Testovací režim)
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('Prosím, zadajte vaše heslo.');
      return;
    }

    // Vygenerovanie 6-miestneho testovacieho OTP kódu
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);

    setErrorMsg('');
    setInfoMsg(`🧪 TESTOVACÍ REŽIM: Váš 2FA kód je ${code} (môžete použiť aj kód 123456)`);
    setStep('2fa');
  };

  // 2. KROK: Overenie 2FA kódu
  const handle2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFactorCode === generatedOtp || twoFactorCode === '123456') {
      onLoginSuccess(selectedUser!);
    } else {
      setErrorMsg('Neplatný 2FA kód. Použite vygenerovaný kód vyššie alebo 123456.');
    }
  };

  // 3. KROK: Obnova hesla (Testovací režim)
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser?.email) return;

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    setInfoMsg(`🧪 TESTOVACÍ REŽIM: Odkaz na obnovu hesla pre ${selectedUser.email} bol vygenerovaný. Kód obnovy: ${resetCode}`);
    setTimeout(() => {
      setStep('password');
    }, 4000);
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* BRAND HLAVIČKA */}
      <div className="text-center space-y-3 mb-10">
        <div className="inline-block border-b-2 border-[#C5A059] pb-2">
          <h1 className="font-brand text-3xl font-light uppercase tracking-widest text-[#2C2A29]">
            SAY CLINIC
          </h1>
        </div>
        <p className="text-xs uppercase tracking-[0.25em] text-[#8C857B]">
          Bezpečný Klinický Portál • 2FA Autentifikácia (Testovací Režim)
        </p>
      </div>

      {/* KROK 1: VÝBER POUŽÍVATEĽA */}
      {step === 'select_user' && (
        <div className="space-y-6">
          <p className="text-center text-xs text-[#8C857B] uppercase tracking-wider font-bold">
            Vyberte svoj profil pre vstup do systému
          </p>

          <div className="space-y-6">
            {/* LEKÁRI */}
            <div className="bg-white border border-[#E8E2D9] p-5 rounded-2xl shadow-sm space-y-3">
              <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-widest block border-b border-[#E8E2D9] pb-2">
                👨‍⚕️ Lekársky Tím
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SAY_CLINIC_USERS.filter(u => u.role === 'doctor').map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    className="p-4 border border-[#E8E2D9] hover:border-[#C5A059] rounded-xl bg-[#FBF9F6] hover:bg-white text-left transition-all group shadow-sm flex items-center gap-3"
                  >
                    <div className={`${u.avatarBg} text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-sm`}>
                      {u.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-[#2C2A29] group-hover:text-[#C5A059] transition-colors">{u.name}</h3>
                      <p className="text-[10px] text-[#8C857B]">{u.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* MANAŽMENT */}
            <div className="bg-white border border-[#E8E2D9] p-5 rounded-2xl shadow-sm space-y-3">
              <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-widest block border-b border-[#E8E2D9] pb-2">
                🏢 Klinický Manažment & Recepcia
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SAY_CLINIC_USERS.filter(u => u.role === 'manager').map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    className="p-4 border border-[#E8E2D9] hover:border-[#C5A059] rounded-xl bg-[#FBF9F6] hover:bg-white text-left transition-all group shadow-sm flex items-center gap-3"
                  >
                    <div className={`${u.avatarBg} text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-sm`}>
                      {u.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-[#2C2A29] group-hover:text-[#C5A059] transition-colors">{u.name}</h3>
                      <p className="text-[10px] text-[#8C857B]">{u.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* SESTRY */}
            <div className="bg-white border border-[#E8E2D9] p-5 rounded-2xl shadow-sm space-y-3">
              <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-widest block border-b border-[#E8E2D9] pb-2">
                👩‍⚕️ Ošetrovateľský Tím
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SAY_CLINIC_USERS.filter(u => u.role === 'nurse').map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    className="p-4 border border-[#E8E2D9] hover:border-[#C5A059] rounded-xl bg-[#FBF9F6] hover:bg-white text-left transition-all group shadow-sm flex items-center gap-3"
                  >
                    <div className={`${u.avatarBg} text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-sm`}>
                      {u.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-[#2C2A29] group-hover:text-[#C5A059] transition-colors">{u.name}</h3>
                      <p className="text-[10px] text-[#8C857B]">{u.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KROK 2: ZADANIE HESLA */}
      {step === 'password' && selectedUser && (
        <div className="max-w-md mx-auto bg-white border border-[#E8E2D9] p-8 rounded-2xl shadow-lg space-y-6">
          <div className="text-center space-y-2 border-b border-[#E8E2D9] pb-4">
            <div className={`${selectedUser.avatarBg} text-white w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg mx-auto shadow-sm`}>
              {selectedUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <h2 className="font-bold text-base text-[#2C2A29] mt-2">{selectedUser.name}</h2>
            <p className="text-[10px] uppercase tracking-wider text-[#C5A059] font-bold">{selectedUser.title}</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">
                Prihlasovacie Heslo
              </label>
              <input
                type="password"
                required
                autoFocus
                placeholder="Zadajte akékoľvek heslo"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-[#E8E2D9] p-3 rounded-xl text-sm font-mono bg-[#FBF9F6] outline-none focus:border-[#C5A059]"
              />
            </div>

            {errorMsg && <p className="text-[10px] text-rose-600 font-bold text-center">{errorMsg}</p>}

            <div className="flex justify-between items-center text-[10px]">
              <button
                type="button"
                onClick={() => setStep('reset_password')}
                className="text-[#C5A059] hover:underline font-bold"
              >
                Zabudli ste heslo?
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('select_user')}
                className="flex-1 border border-[#E8E2D9] bg-[#FBF9F6] text-[#8C857B] hover:text-[#2C2A29] py-3 rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                Späť
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#2C2A29] hover:bg-[#C5A059] text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
              >
                Pokračovať (2FA) →
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KROK 3: 2FA OVERENIE */}
      {step === '2fa' && selectedUser && (
        <div className="max-w-md mx-auto bg-white border border-[#E8E2D9] p-8 rounded-2xl shadow-lg space-y-6">
          <div className="text-center space-y-2 border-b border-[#E8E2D9] pb-4">
            <span className="text-2xl">🔐</span>
            <h2 className="font-brand text-lg font-bold text-[#2C2A29] uppercase">2FA Dvojfázové Overenie</h2>
            <p className="text-[10px] text-[#8C857B]">
              Profil: <strong>{selectedUser.name}</strong> ({selectedUser.email})
            </p>
          </div>

          {infoMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-mono text-center font-bold">
              {infoMsg}
            </div>
          )}

          <form onSubmit={handle2FASubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1 text-center">
                Zadajte 6-miestny 2FA kód
              </label>
              <input
                type="text"
                maxLength={6}
                required
                autoFocus
                placeholder="123456"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                className="w-full border border-[#E8E2D9] p-3 rounded-xl text-center text-2xl tracking-[0.4em] font-mono bg-[#FBF9F6] outline-none focus:border-[#C5A059]"
              />
            </div>

            {errorMsg && <p className="text-[10px] text-rose-600 font-bold text-center">{errorMsg}</p>}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('password')}
                className="flex-1 border border-[#E8E2D9] bg-[#FBF9F6] text-[#8C857B] hover:text-[#2C2A29] py-3 rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                Späť
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#2C2A29] hover:bg-[#C5A059] text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
              >
                Potvrdiť & Vstúpiť
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KROK 4: OBNOVA HESLA */}
      {step === 'reset_password' && selectedUser && (
        <div className="max-w-md mx-auto bg-white border border-[#E8E2D9] p-8 rounded-2xl shadow-lg space-y-6">
          <div className="text-center space-y-2 border-b border-[#E8E2D9] pb-4">
            <span className="text-2xl">✉️</span>
            <h2 className="font-brand text-lg font-bold text-[#2C2A29] uppercase">Obnova Hesla</h2>
            <p className="text-[10px] text-[#8C857B]">
              E-mail pre obnovu: <strong>{selectedUser.email}</strong>
            </p>
          </div>

          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            {infoMsg ? (
              <p className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center font-bold">
                {infoMsg}
              </p>
            ) : (
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('password')}
                  className="flex-1 border border-[#E8E2D9] bg-[#FBF9F6] text-[#8C857B] hover:text-[#2C2A29] py-3 rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#C5A059] hover:bg-[#b08d4b] text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                >
                  Simulovať obnovu
                </button>
              </div>
            )}
          </form>
        </div>
      )}

    </div>
  );
}