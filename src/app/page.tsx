'use client';

import React, { useState } from 'react';
import MedicalRecordForm from '../components/MedicalRecordForm';
import LoginForm from '../components/LoginForm';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-left">
            <h1 className="text-2xl font-extrabold text-blue-900">SayClinic Ambulancia</h1>
            <p className="text-xs text-gray-500">Integrácia NCZI & HealthPro</p>
          </div>

          {currentUser && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800">{currentUser.name}</p>
                <p className="text-xs text-blue-600 uppercase font-semibold">{currentUser.role === 'doctor' ? 'Lekár' : 'Sestra'}</p>
              </div>
              <button
                onClick={() => setCurrentUser(null)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-1.5 px-3 rounded-lg transition-colors"
              >
                Odhlásiť
              </button>
            </div>
          )}
        </header>

        {/* Ak používateľ NIE JE prihlásený, ukážeme Login. Ak JE prihlásený, ukážeme formulár. */}
        {!currentUser ? (
          <LoginForm onLoginSuccess={(user) => setCurrentUser(user)} />
        ) : (
          <MedicalRecordForm />
        )}
      </div>
    </main>
  );
}
