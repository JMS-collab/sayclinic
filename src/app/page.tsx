'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import MedicalRecordForm from '../components/MedicalRecordForm';
import PatientDatabase, { Patient } from '../components/PatientDatabase';
import LoginForm from '../components/LoginForm';
import FinanceCRM from '../components/FinanceCRM';
import Calendar, { CalendarEvent } from '../components/Calendar';
import InventoryCRM from '../components/InventoryCRM';

export interface SaleItem {
  id: string;
  date: string;
  patientName: string;
  doctorName: string;
  serviceType: string;
  amount: number;
}

const INITIAL_SALES: SaleItem[] = [
  { id: 'S1', date: '2026-08-14', patientName: 'Ján Novák', doctorName: 'MUDr. Ján Mráz', serviceType: 'Augmentácia prsníkov', amount: 4100 },
];

export default function Home() {
  const { data: session, status } = useSession();

  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'generator' | 'patients' | 'finance' | 'calendar' | 'inventory'>('home');
  const [sales, setSales] = useState<SaleItem[]>(INITIAL_SALES);

  // Živý čas a dátum
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Stav pre vybraného pacienta z Kartotéky pre Generátor alebo detail
  const [selectedPatient, setSelectedPatient] = useState<{ name: string; birthNumber: string } | null>(null);
  const [selectedPatientForFolder, setSelectedPatientForFolder] = useState<Patient | null>(null);

  // Zoznam pacientov a udalostí
  const [patients, setPatients] = useState<Patient[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  // Tipy / Rýchle poznámky pre kliniku
  const [clinicNotes, setClinicNotes] = useState<string[]>([
    'Skontrolovať predoperačné výsledky pre p. Máriu Kováčovú (09:00)',
    'Objednať kompresnú bielizeň Lipoelastic veľkosť M',
  ]);
  const [newNote, setNewNote] = useState('');

  // Aktualizácia živého času
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Načítanie uložených pacientov z localStorage
  useEffect(() => {
    const saved = localStorage.getItem('say_clinic_patients');
    if (saved) {
      try {
        setPatients(JSON.parse(saved));
      } catch (e) {
        console.error('Chyba načítania pacientov:', e);
      }
    }
  }, []);

  // Načítanie kešovaných kalendárových udalostí
  useEffect(() => {
    const cachedEvents = localStorage.getItem('say_clinic_calendar_events');
    if (cachedEvents) {
      try {
        setCalendarEvents(JSON.parse(cachedEvents));
      } catch (e) {
        console.error('Chyba načítania kešovaných udalostí kalendára:', e);
      }
    }
  }, []);

  const handleAddSale = (newSale: Omit<SaleItem, 'id'>) => {
    const item: SaleItem = {
      ...newSale,
      id: `S-${Date.now()}`,
    };
    setSales((prev) => [item, ...prev]);
  };

  const handleNavigateToGenerator = (patient: { name: string; birthNumber: string }) => {
    setSelectedPatient(patient);
    setActiveTab('generator');
  };

  const handleOpenPatientFromCalendar = (patientId: string) => {
    const found = patients.find(p => p.id === patientId);
    if (found) {
      setSelectedPatientForFolder(found);
    }
    setActiveTab('patients');
  };

  const handleAddCalendarEvent = (newEvent: CalendarEvent) => {
    setCalendarEvents((prev) => {
      const updated = [newEvent, ...prev];
      localStorage.setItem('say_clinic_calendar_events', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddClinicNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setClinicNotes(prev => [newNote.trim(), ...prev]);
    setNewNote('');
  };

  const handleRemoveClinicNote = (index: number) => {
    setClinicNotes(prev => prev.filter((_, i) => i !== index));
  };

  // Dnešné udalosti pre Homescreen
  const todayString = new Date().toISOString().split('T')[0];
  const todayEvents = calendarEvents.filter(e => e.date === todayString);

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F6]">
      {/* HLAVIČKA A PRECHOD NA HOMESCREEN CEZ LOGO */}
      <header className="bg-white border-b border-[#E8E2D9] sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* LOGO (KLIKNUTIE PRESMERUJE NA HOMESCREEN) */}
          <div className="flex items-center space-x-5 cursor-pointer group" onClick={() => setActiveTab('home')}>
            <div className="border-l-2 border-[#C5A059] pl-4 transition-all group-hover:border-[#2C2A29]">
              <h1 className="font-brand text-2xl font-light uppercase tracking-widest text-[#2C2A29] group-hover:text-[#C5A059] transition-colors">
                SAY CLINIC
              </h1>
              <p className="text-[9px] uppercase tracking-[0.25em] text-[#8C857B] font-light">
                PLASTICKÁ CHIRURGIA & DERMATOLÓGIA
              </p>
            </div>
          </div>

          {/* NAVIGÁCIA */}
          {currentUser && (
            <nav className="flex flex-wrap gap-2 text-[11px] font-light uppercase tracking-wider text-[#8C857B]">
              <button
                onClick={() => setActiveTab('home')}
                className={`px-3 py-2 transition-all ${
                  activeTab === 'home' ? 'text-[#2C2A29] border-b-2 border-[#C5A059] font-semibold' : 'hover:text-[#2C2A29]'
                }`}
              >
                🏠 Prehľad (Home)
              </button>
              <button
                onClick={() => {
                  setSelectedPatient(null);
                  setActiveTab('generator');
                }}
                className={`px-3 py-2 transition-all ${
                  activeTab === 'generator' ? 'text-[#2C2A29] border-b-2 border-[#C5A059] font-semibold' : 'hover:text-[#2C2A29]'
                }`}
              >
                📄 Generátor Dokumentov
              </button>
              <button
                onClick={() => {
                  setSelectedPatientForFolder(null);
                  setActiveTab('patients');
                }}
                className={`px-3 py-2 transition-all ${
                  activeTab === 'patients' ? 'text-[#2C2A29] border-b-2 border-[#C5A059] font-semibold' : 'hover:text-[#2C2A29]'
                }`}
              >
                🗂️ Kartotéka Pacientov
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`px-3 py-2 transition-all ${
                  activeTab === 'calendar' ? 'text-[#2C2A29] border-b-2 border-[#C5A059] font-semibold' : 'hover:text-[#2C2A29]'
                }`}
              >
                📅 Kalendár & Plánovanie
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-3 py-2 transition-all ${
                  activeTab === 'inventory' ? 'text-[#2C2A29] border-b-2 border-[#C5A059] font-semibold' : 'hover:text-[#2C2A29]'
                }`}
              >
                📦 Sklad & Materiál
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
            {/* HOMESCREEN (PREHĽAD KLINIKY) */}
            {activeTab === 'home' && (
              <div className="space-y-6">
                
                {/* BANNER A ŽIVÝ ČAS */}
                <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-white via-white to-[#FBF9F6]">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-widest">Klinický prehľad</span>
                    <h2 className="font-brand text-2xl md:text-3xl font-light text-[#2C2A29] uppercase mt-1">
                      Dobrý deň, <span className="font-bold">{currentUser.name}</span>
                    </h2>
                    <p className="text-xs text-[#8C857B] mt-1">
                      Vitajte v internom systéme SAY CLINIC. Tu je váš prehľad na dnešný deň.
                    </p>
                  </div>

                  {/* ŽIVÝ ČAS A DÁTUM */}
                  <div className="bg-[#2C2A29] text-white px-6 py-3 rounded-xl text-right font-mono border border-[#C5A059]/30 shadow-sm min-w-[200px]">
                    <div className="text-xs text-[#C5A059] uppercase font-bold tracking-wider">
                      {currentTime ? currentTime.toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Načítavam...'}
                    </div>
                    <div className="text-2xl font-bold tracking-widest text-white mt-0.5">
                      {currentTime ? currentTime.toLocaleTimeString('sk-SK') : '--:--:--'}
                    </div>
                  </div>
                </div>

                {/* KPI ŠTATISTIKY */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white border border-[#E8E2D9] p-4 rounded-xl shadow-sm">
                    <p className="text-[10px] uppercase text-[#8C857B] font-bold">Dnešní klienti</p>
                    <p className="text-2xl font-bold text-[#2C2A29] mt-1">{todayEvents.length}</p>
                    <p className="text-[10px] text-[#C5A059] mt-1 font-semibold">Naplánované na dnes</p>
                  </div>

                  <div className="bg-white border border-[#E8E2D9] p-4 rounded-xl shadow-sm">
                    <p className="text-[10px] uppercase text-[#8C857B] font-bold">Celkovo v kartotéke</p>
                    <p className="text-2xl font-bold text-[#2C2A29] mt-1">{patients.length}</p>
                    <p className="text-[10px] text-emerald-600 mt-1 font-semibold">Prepojené s Google Drive</p>
                  </div>

                  <div className="bg-white border border-[#E8E2D9] p-4 rounded-xl shadow-sm">
                    <p className="text-[10px] uppercase text-[#8C857B] font-bold">Dnešný predpokladovaný obrat</p>
                    <p className="text-2xl font-bold text-[#2C2A29] mt-1">
                      {sales.reduce((acc, s) => acc + s.amount, 0).toLocaleString('sk-SK')} €
                    </p>
                    <p className="text-[10px] text-[#8C857B] mt-1">Záznamy z CRM</p>
                  </div>

                  {/* INTERAKTÍVNA KARTA PRE GOOGLE PREPOJENIE */}
                  <button
                    onClick={() => (session ? signOut() : signIn('google'))}
                    disabled={status === 'loading'}
                    className="bg-white border border-[#E8E2D9] hover:border-[#C5A059] p-4 rounded-xl shadow-sm text-left transition-all w-full group cursor-pointer"
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] uppercase text-[#8C857B] font-bold">Stav Google API</p>
                      <span className="text-[10px] text-[#C5A059] opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase">
                        {session ? 'Odpojiť ➔' : 'Pripojiť ➔'}
                      </span>
                    </div>

                    <p className={`text-2xl font-bold mt-1 flex items-center gap-2 ${session ? 'text-emerald-600' : 'text-rose-600'}`}>
                      <span>{session ? '🟢' : '🔴'}</span>
                      <span>{status === 'loading' ? 'Pripájam...' : session ? 'Aktívne' : 'Nepripojené'}</span>
                    </p>

                    <p className="text-[10px] text-[#8C857B] mt-1 truncate">
                      {session ? `Prihlásený: ${session.user?.email}` : 'Kliknite pre prepojenie s Google Diskom & Kalendárom'}
                    </p>
                  </button>
                </div>

                {/* OBSAH HOMESCREENU: 2 STĹPCE */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* STĹPEC 1: DNEŠNÍ KLIENTI (2 TRETINY) */}
                  <div className="lg:col-span-2 bg-[#ffffff] border border-[#E8E2D9] rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-3">
                      <div>
                        <h3 className="font-brand text-lg font-bold text-[#2C2A29] uppercase">Dnešný harmonogram pacientov</h3>
                        <p className="text-[10px] text-[#8C857B] uppercase tracking-wider">Naplánované operácie a vyšetrenia na dnes</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('calendar')}
                        className="text-xs text-[#C5A059] hover:underline font-bold uppercase tracking-wider"
                      >
                        Otvoriť celý kalendár →
                      </button>
                    </div>

                    <div className="space-y-3">
                      {todayEvents.length === 0 ? (
                        <div className="text-center py-10 text-[#8C857B] text-xs italic bg-[#FBF9F6] rounded-xl border border-[#E8E2D9]">
                          Na dnešný deň nie sú naplánované žiadne udalosti v Google Kalendári.
                        </div>
                      ) : (
                        todayEvents.map((evt) => (
                          <div 
                            key={evt.id} 
                            onClick={() => handleOpenPatientFromCalendar(evt.patientId || '')}
                            className="p-4 border border-[#E8E2D9] hover:border-[#C5A059] rounded-xl flex justify-between items-center bg-[#FBF9F6] hover:bg-white transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="bg-[#2C2A29] text-white p-2.5 rounded-lg text-center font-mono min-w-[75px]">
                                <span className="text-xs font-bold block">{evt.startTime}</span>
                                <span className="text-[9px] text-[#C5A059] block">{evt.endTime}</span>
                              </div>
                              <div>
                                <span className="text-[8px] uppercase font-bold bg-[#C5A059] text-white px-2 py-0.5 rounded">
                                  {evt.type ? evt.type.replace('_', ' ') : 'ZÁKROK'}
                                </span>
                                <h4 className="font-bold text-sm text-[#2C2A29] group-hover:text-[#C5A059] transition-colors mt-1">
                                  {evt.title}
                                </h4>
                                <p className="text-xs text-[#8C857B]">{evt.patientName} | {evt.doctorName}</p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-[#8C857B] group-hover:text-[#2C2A29]">
                              📁 Otvoriť kartu →
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* STĹPEC 2: RÝCHLE POZNÁMKY & AKCIE (1 TRETINA) */}
                  <div className="space-y-6">
                    
                    {/* RÝCHLE AKCIE */}
                    <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 shadow-sm space-y-3">
                      <h3 className="font-brand text-sm font-bold text-[#2C2A29] uppercase border-b border-[#E8E2D9] pb-2">
                        Rýchle Akcie
                      </h3>
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        <button 
                          onClick={() => { setSelectedPatient(null); setActiveTab('generator'); }}
                          className="w-full bg-[#FBF9F6] border border-[#E8E2D9] hover:border-[#C5A059] p-3 rounded-xl text-left font-bold text-[#2C2A29] transition-all flex items-center justify-between"
                        >
                          <span>📄 Nový lekársky nález</span>
                          <span className="text-[#C5A059]">+</span>
                        </button>
                        <button 
                          onClick={() => { setSelectedPatientForFolder(null); setActiveTab('patients'); }}
                          className="w-full bg-[#FBF9F6] border border-[#E8E2D9] hover:border-[#C5A059] p-3 rounded-xl text-left font-bold text-[#2C2A29] transition-all flex items-center justify-between"
                        >
                          <span>🗂️ Zaevidovať nového pacienta</span>
                          <span className="text-[#C5A059]">+</span>
                        </button>
                        <button 
                          onClick={() => setActiveTab('calendar')}
                          className="w-full bg-[#2C2A29] text-white hover:bg-[#C5A059] p-3 rounded-xl text-left font-bold transition-all flex items-center justify-between"
                        >
                          <span>📅 Naplánovať operáciu v kalendári</span>
                          <span>+</span>
                        </button>
                      </div>
                    </div>

                    {/* RÝCHLE KLINICKÉ POZNÁMKY (OPERATÍVA) */}
                    <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 shadow-sm space-y-4">
                      <h3 className="font-brand text-sm font-bold text-[#2C2A29] uppercase border-b border-[#E8E2D9] pb-2">
                        Operatívne Poznámky
                      </h3>

                      <form onSubmit={handleAddClinicNote} className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Pridať pripomienku..."
                          value={newNote}
                          onChange={e => setNewNote(e.target.value)}
                          className="flex-1 border border-[#E8E2D9] p-2 rounded-lg text-xs bg-[#FBF9F6] outline-none focus:border-[#C5A059]"
                        />
                        <button type="submit" className="bg-[#C5A059] text-white px-3 py-2 rounded-lg text-xs font-bold uppercase">+</button>
                      </form>

                      <ul className="space-y-2 text-xs">
                        {clinicNotes.map((note, idx) => (
                          <li key={idx} className="p-2.5 bg-[#FBF9F6] border border-[#E8E2D9] rounded-lg flex justify-between items-center text-[#2C2A29]">
                            <span>• {note}</span>
                            <button onClick={() => handleRemoveClinicNote(idx)} className="text-[#8C857B] hover:text-rose-600 font-bold ml-2">✕</button>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* GENERÁTOR DOKUMENTOV */}
            {activeTab === 'generator' && (
              <MedicalRecordForm 
                onRecordCreated={handleAddSale} 
                initialPatient={selectedPatient} 
              />
            )}

            {/* KARTOTÉKA PACIENTOV */}
            {activeTab === 'patients' && (
              <PatientDatabase 
                onNavigateToGenerator={handleNavigateToGenerator} 
                initialPatient={selectedPatientForFolder}
                onPatientsUpdated={(updatedList) => setPatients(updatedList)}
              />
            )}

            {/* KALENDÁR */}
            {activeTab === 'calendar' && (
              <Calendar 
                events={calendarEvents}
                patients={patients}
                onOpenPatientFolder={handleOpenPatientFromCalendar}
                onAddEvent={handleAddCalendarEvent}
              />
            )}

            {/* SKLAD & MATERIÁL */}
            {activeTab === 'inventory' && (
              <InventoryCRM />
            )}

            {/* FINANCIE */}
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