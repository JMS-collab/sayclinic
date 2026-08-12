'use client';

import React, { useState } from 'react';

export default function LoginForm({ onLoginSuccess }: { onLoginSuccess: (user: { name: string; role: string }) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'doctor' | 'nurse'>('doctor');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Zadajte platný e-mail.');
      return;
    }

    const userName = role === 'doctor' ? 'MUDr. Ján Mráz' : 'Sestra Mária Nováková';
    onLoginSuccess({ name: userName, role });
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#E8E3DA] max-w-md mx-auto">
      <div className="text-center mb-8">
        <span className="text-xs uppercase tracking-widest text-[#C5A880] font-semibold">Vítajte späť</span>
        <h2 className="text-2xl font-serif text-[#2C2A29] font-bold mt-1">Prihlásenie personálu</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs uppercase tracking-wider text-[#8C857B] font-semibold mb-2">
            Rola
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('doctor')}
              className={`py-2.5 px-4 rounded-xl font-medium text-xs uppercase tracking-wider transition-all border ${
                role === 'doctor'
                  ? 'bg-[#3D4A3E] text-white border-[#3D4A3E]'
                  : 'bg-[#FBF9F5] text-[#8C857B] border-[#E8E3DA]'
              }`}
            >
              👨‍⚕️ Lekár
            </button>
            <button
              type="button"
              onClick={() => setRole('nurse')}
              className={`py-2.5 px-4 rounded-xl font-medium text-xs uppercase tracking-wider transition-all border ${
                role === 'nurse'
                  ? 'bg-[#3D4A3E] text-white border-[#3D4A3E]'
                  : 'bg-[#FBF9F5] text-[#8C857B] border-[#E8E3DA]'
              }`}
            >
              👩‍⚕️ Sestra
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-[#8C857B] font-semibold mb-2">
            Služobný E-mail
          </label>
          <input
            type="email"
            required
            placeholder="mraz@sayclinic.sk"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-[#FBF9F5] border border-[#E8E3DA] rounded-xl text-sm text-[#2C2A29] focus:outline-none focus:border-[#3D4A3E]"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-[#8C857B] font-semibold mb-2">
            Heslo
          </label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-[#FBF9F5] border border-[#E8E3DA] rounded-xl text-sm text-[#2C2A29] focus:outline-none focus:border-[#3D4A3E]"
          />
        </div>

        {error && <div className="p-3 text-xs text-red-600 bg-red-50 rounded-xl border border-red-200">{error}</div>}

        <button
          type="submit"
          className="w-full bg-[#3D4A3E] hover:bg-[#2E382E] text-white font-medium py-3.5 px-6 rounded-xl transition-all text-xs uppercase tracking-wider shadow-sm"
        >
          Vstúpiť do ambulancie
        </button>
      </form>
    </div>
  );
}
