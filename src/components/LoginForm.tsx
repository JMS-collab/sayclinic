'use client';

import React, { useState } from 'react';

export default function LoginForm({ onLoginSuccess }: { onLoginSuccess: (user: { name: string; role: string }) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'doctor' | 'nurse'>('doctor');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Jednoduchá overovacia logika (zatiaľ MOCK prihlásenie)
    if (!email.includes('@')) {
      setError('Zadajte platný služobný e-mail.');
      return;
    }

    if (password.length < 4) {
      setError('Heslo musí mať alespoň 4 znaky.');
      return;
    }

    // Simulácia úspešného prihlásenia
    const userName = role === 'doctor' ? 'MUDr. Peter Kováč' : 'Sestra Mária Nováková';
    onLoginSuccess({ name: userName, role });
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Prihlásenie do systému</h2>
        <p className="text-sm text-gray-500 mt-1">SayClinic • Ambulantný portál</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Výber roly */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rola v ambulancii:</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('doctor')}
              className={`py-2 px-4 rounded-lg font-medium text-sm transition-all border ${
                role === 'doctor'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              👨‍⚕️ Lekár
            </button>
            <button
              type="button"
              onClick={() => setRole('nurse')}
              className={`py-2 px-4 rounded-lg font-medium text-sm transition-all border ${
                role === 'nurse'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              👩‍⚕️ Sestra
            </button>
          </div>
        </div>

        {/* E-mail */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Služobný E-mail:</label>
          <input
            type="email"
            required
            placeholder={role === 'doctor' ? 'mraz@sayclinic.sk' : 'sestra@sayclinic.sk'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>

        {/* Heslo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Heslo:</label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>

        {/* Chybové hlásenie */}
        {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">{error}</div>}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-md"
        >
          Vstúpiť do systému
        </button>
      </form>
    </div>
  );
}
