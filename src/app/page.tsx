'use client';

import React, { useState } from 'react';
import MedicalRecordForm from '../components/MedicalRecordForm';
import PatientDatabase from '../components/PatientDatabase';
import LoginForm from '../components/LoginForm';
import FinanceCRM from '../components/FinanceCRM';

export interface SaleItem {
  id: string;
  date: string;
  patientName: string;
  doctorName: string;
  serviceType: string;
  amount: number;
}

const INITIAL_SALES: SaleItem[] = [
  { id: 'S1', date: '2026-08-11', patientName: 'Ján Novák', doctorName: 'MUDr. Ján Mráz', serviceType: 'Augmentácia prsníkov', amount: 4100 },
];

export default function Home() {
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'generator' | 'patients' | 'finance'>('generator');
  const [sales, setSales] = useState<SaleItem[]>(INITIAL_SALES);

  // PRIDANÉ: Stav pre uchovanie vybraného pacienta z Kartotéky
  const [selectedPatient, setSelectedPatient] = useState<{ name: string; birthNumber: string } | null>(null);

  const handleAddSale = (newSale: Omit<SaleItem, 'id'>) => {
    const item: SaleItem = {
      ...newSale,
      id: `S-${Date.now()}`,
    };
    setSales((prev) => [item, ...prev]);
  };

  // PRIDANÉ: Funkcia pre navigáciu z Kartotéky do Generátora a prenos pacienta
  const handleNavigateToGenerator = (patient: { name: string; birthNumber: string }) => {
    setSelectedPatient(patient);
    setActiveTab('generator');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F6]">
      {/* HLAVIČKA */}
      <header className="bg-white border-b border-[#E8E2D9] sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-5">
            <div className="border-l-2 border-[#C5A059] pl-4">
              <h1 className="font-brand text-2xl font-light uppercase tracking-widest text-[#2C2A29]">
                SAY CLINIC
              </h1>
              <p className="text-[9px] uppercase tracking-[0.25em] text-[#8C857B] font-light">
                PLASTICKÁ CHIRURGIA & DERMATOLÓGIA
              </p>
            </div>
          </div>

          {/* NAVIGÁCIA */}
          {currentUser && (
            <nav className="flex gap-2 text-[11px] font-light uppercase tracking-wider text-[#8C857B]">
              <button
                onClick={() => {
                  setSelectedPatient(null); // Pri bežnom prekliku cez menu vyčistíme pacienta
                  setActiveTab('generator');
                }}
                className={`px-3 py-2 transition-all ${
                  activeTab === 'generator' ? 'text-[#2C2A29] border-b-2 border-[#C5A059] font-semibold' : 'hover:text-[#2C2A29]'
                }`}
              >
                📄 Generátor Dokumentov
              </button>
              <button
                onClick={() => setActiveTab('patients')}
                className={`px-3 py-2 transition-all ${
                  activeTab === 'patients' ? 'text-[#2C2A29] border-b-2 border-[#C5A059] font-semibold' : 'hover:text-[#2C2A29]'
                }`}
              >
                🗂️ Kartotéka Pacientov
              </button>
              <button
                onClick={() => setActiveTab('finance')}
                className={`px-3 py-2 transition-all ${
                  activeTab === 'finance' ? 'text-[#2C2A29] border-b-2 border-[#C5A059] font-semibold' : 'hover:text-[#2C2A29]'
                }`}
              >
                📊 Financie & Výsledky
              </button>
            </nav>
          )}

          {/* PROFIL */}
          {currentUser && (
            <div className="border-l border-[#E8E2D9] pl-4 flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-[#2C2A29]">{currentUser.name}</p>
                <p className="text-[9px] uppercase tracking-widest text-[#C5A059]">
                  {currentUser.role === 'doctor' ? 'Lekár' : 'Sestra'}
                </p>
              </div>
              <button
                onClick={() => setCurrentUser(null)}
                className="text-xs text-[#8C857B] hover:text-[#2C2A29] underline underline-offset-4"
              >
                Odhlásiť
              </button>
            </div>
          )}
        </div>
      </header>

      {/* OBSAH */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {!currentUser ? (
          <LoginForm onLoginSuccess={(user) => setCurrentUser(user)} />
        ) : (
          <>
            {/* PRIDANÉ: Odovzdanie initialPatient */}
            {activeTab === 'generator' && (
              <MedicalRecordForm 
                onRecordCreated={handleAddSale} 
                initialPatient={selectedPatient} 
              />
            )}
            {/* PRIDANÉ: Odovzdanie funkcie na navigáciu */}
            {activeTab === 'patients' && (
              <PatientDatabase 
                onNavigateToGenerator={handleNavigateToGenerator} 
              />
            )}
            {activeTab === 'finance' && (
              <FinanceCRM 
                sales={sales} 
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
