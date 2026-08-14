'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';

export interface UserAccount {
  id: string;
  name: string;
  role: 'doctor' | 'manager' | 'nurse';
  title: string;
  avatarBg: string;
}

export const SAY_CLINIC_USERS: UserAccount[] = [
  // LEKÁRI
  { id: 'u1', name: 'MUDr. Ján Mráz', role: 'doctor', title: 'Plastický chirurg', avatarBg: 'bg-[#2C2A29]' },
  { id: 'u2', name: 'MUDr. Zuzana Sroková', role: 'doctor', title: 'Lekár / Chirurg', avatarBg: 'bg-[#2C2A29]' },
  { id: 'u3', name: 'MUDr. Minh Tuong Tran', role: 'doctor', title: 'Lekár / Chirurg', avatarBg: 'bg-[#2C2A29]' },
  
  // MANAŽÉRI
  { id: 'u4', name: 'Ing. Barbara Mecerodová, MBA', role: 'manager', title: 'Klinický Manažment', avatarBg: 'bg-[#C5A059]' },
  { id: 'u5', name: 'Mgr. Elena Solivajsová', role: 'manager', title: 'Klinický Manažment', avatarBg: 'bg-[#C5A059]' },

  // SESTRY
  { id: 'u6', name: 'Ema Foltáni', role: 'nurse', title: 'Zdravotná sestra', avatarBg: 'bg-emerald-800' },
  { id: 'u7', name: 'Sabina Lenhartová', role: 'nurse', title: 'Zdravotná sestra', avatarBg: 'bg-emerald-800' },
];

interface LoginFormProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleUserClick = (user: UserAccount) => {
    setSelectedUser(user);
    setPin('');
    setPinError(false);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Rýchly prístupový PIN pre demo/prevádzku (napr. 1234) alebo akýkoľvek 4-miestny kód
    if (pin.length >= 4) {
      onLoginSuccess(selectedUser!);
    } else {
      setPinError(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      
      {/* BRAND HLAVIČKA */}
      <div className="text-center space-y-3 mb-10">
        <div className="inline-block border-b-2 border-[#C5A059] pb-2">
          <h1 className="font-brand text-3xl font-light uppercase tracking-widest text-[#2C2A29]">
            SAY CLINIC
          </h1>
        </div>
        <p className="text-xs uppercase tracking-[0.25em] text-[#8C857B]">
          Interný Klinický Systém • Prihlásenie
        </p>
      </div>

      {!selectedUser ? (
        
        /* KROK 1: VÝBER POUŽÍVATEĽA */
        <div className="space-y-8">
          <p className="text-center text-xs text-[#8C857B] uppercase tracking-wider font-bold">
            Vyberte svoj profil pre vstup do systému
          </p>

          {/* SEKČNÉ ROZDELENIE */}
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
                    onClick={() => handleUserClick(u)}
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
                    onClick={() => handleUserClick(u)}
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
                    onClick={() => handleUserClick(u)}
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

          {/* PRIHLÁSENIE CEZ GOOGLE ÚČET AKO ZÁLOHA */}
          <div className="pt-6 border-t border-[#E8E2D9] text-center">
            <button
              onClick={() => signIn('google')}
              className="bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-[#2C2A29] px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
            >
              🔑 Prepojiť / Prihlásiť cez Google Účet
            </button>
          </div>
        </div>

      ) : (

        /* KROK 2: PIN KÓD / OVERENIE */
        <div className="max-w-md mx-auto bg-white border border-[#E8E2D9] p-8 rounded-2xl shadow-lg space-y-6">
          <div className="text-center space-y-2 border-b border-[#E8E2D9] pb-4">
            <div className={`${selectedUser.avatarBg} text-white w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg mx-auto shadow-sm`}>
              {selectedUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <h2 className="font-bold text-base text-[#2C2A29] mt-2">{selectedUser.name}</h2>
            <p className="text-[10px] uppercase tracking-wider text-[#C5A059] font-bold">{selectedUser.title}</p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-2 text-center">
                Zadajte bezpečnostný PIN kód
              </label>
              <input
                type="password"
                maxLength={4}
                autoFocus
                placeholder="••••"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setPinError(false);
                }}
                className="w-full border border-[#E8E2D9] p-3 rounded-xl text-center text-2xl tracking-[0.5em] font-mono bg-[#FBF9F6] outline-none focus:border-[#C5A059]"
              />
              {pinError && (
                <p className="text-[10px] text-rose-600 text-center mt-2 font-bold">
                  Zadajte minimálne 4-miestny PIN kód.
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="flex-1 border border-[#E8E2D9] bg-[#FBF9F6] text-[#8C857B] hover:text-[#2C2A29] py-3 rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                Späť
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#2C2A29] hover:bg-[#C5A059] text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
              >
                Vstúpiť →
              </button>
            </div>
          </form>
        </div>

      )}

    </div>
  );
}