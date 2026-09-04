'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import MedicalRecordForm from '../components/MedicalRecordForm';
import PatientDatabase, { Patient } from '../components/PatientDatabase';
import LoginForm, { UserAccount, SAY_CLINIC_USERS } from '../components/LoginForm';
import { LiquidAvatar } from '../components/LiquidAvatar';
import FinanceCRM from '../components/FinanceCRM';
import Calendar, { CalendarEvent } from '../components/Calendar';
import InventoryCRM from '../components/InventoryCRM';
import { AestheticsModule } from '../components/AestheticsModule';
import { CosmeticsPOSModule } from '../components/CosmeticsPOSModule';
import ProjectManagement from '../components/ProjectManagement';
import OperativeNotesWidget from '../components/OperativeNotesWidget';

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

type TabType = 'home' | 'generator' | 'patients' | 'aesthetics' | 'cosmetics' | 'calendar' | 'inventory' | 'finance' | 'projects';

function buildProjectFromNote(noteText: string, currentUser: UserAccount) {
  const isCeoUser = currentUser.role === 'ceo' || currentUser.email === 'mraz@sayclinic.sk' || currentUser.id === 'u1';
  const timestamp = Date.now();
  const dateStr = new Date(timestamp).toISOString().split('T')[0];
  const deadlineStr = new Date(timestamp + 7 * 86400000).toISOString().split('T')[0];

  return {
    id: `PRJ-${timestamp}`,
    title: noteText,
    category: 'operativa',
    description: `Operatívne poverenie vytvorené z poznámok kliniky: "${noteText}". Zadal: ${currentUser.name}.`,
    status: 'in_progress',
    priority: 'high',
    leadId: currentUser.id,
    leadName: currentUser.name,
    assigneeIds: ['u1', 'u4', 'u7'],
    deadline: deadlineStr,
    startDate: dateStr,
    createdById: currentUser.id,
    createdByName: `${currentUser.name} (${isCeoUser ? 'CEO' : currentUser.title})`,
    createdAt: new Date(timestamp).toISOString(),
    updatedAt: new Date(timestamp).toISOString(),
    attachments: [],
    tasks: [
      {
        id: `tsk-${timestamp}-1`,
        projectId: `PRJ-${timestamp}`,
        title: noteText,
        description: 'Úloha prenesená z operatívnej pripomienky kliniky.',
        assignedToId: 'u4',
        assignedToName: 'Ing. Barbara Mecerodová, MBA',
        assignedToRole: 'manager',
        createdById: currentUser.id,
        createdByName: currentUser.name,
        completed: false,
        priority: 'high',
        deadline: deadlineStr,
      }
    ],
    comments: [
      {
        id: `c-${timestamp}`,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorRole: isCeoUser ? 'CEO & Zakladateľ' : currentUser.title,
        text: `Projekt a poverenie automaticky prenesené z operatívnych poznámok.`,
        timestamp: new Date(timestamp).toLocaleDateString('sk-SK') + ' ' + new Date(timestamp).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' }),
      }
    ]
  };
}

export default function Home() {
  const { data: session, status } = useSession();

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('say_clinic_user');
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch (e) {
          console.error('Chyba načítania používateľa:', e);
        }
      }
    }
    return SAY_CLINIC_USERS[0];
  });
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [sales, setSales] = useState<SaleItem[]>(INITIAL_SALES);

  // Živý čas a dátum
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Stav pre vybraného pacienta z Kartotéky pre Generátor alebo detail
  const [selectedPatient, setSelectedPatient] = useState<{ name: string; birthNumber: string } | null>(null);
  const [selectedPatientForFolder, setSelectedPatientForFolder] = useState<Patient | null>(null);

  // Zoznam pacientov a udalostí
  const [patients, setPatients] = useState<Patient[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  // 1. ZACHOVANIE PRIHLÁSENÉHO POUŽÍVATEĽA PRI OBNOVENÍ / NÁVRATE SPÄŤ
  useEffect(() => {
    const savedUser = localStorage.getItem('say_clinic_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Chyba načítania používateľa:', e);
      }
    }
  }, []);

  // 2. NAVIGÁCIA ŠÍPKAMI V PREHLIADAČI (POPSTATE LISTENER)
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '') as TabType;
      if (['home', 'generator', 'patients', 'aesthetics', 'cosmetics', 'finance', 'calendar', 'inventory', 'projects'].includes(hash)) {
        setActiveTab(hash);
      } else {
        setActiveTab('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    handlePopState(); // Načítanie pri prvom otvorení

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Funkcia pre prepínanie záložiek s zápisom do histórie prehliadača
  const changeTab = (tab: TabType) => {
    setActiveTab(tab);
    window.history.pushState({ tab }, '', `#${tab}`);
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    localStorage.setItem('say_clinic_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('say_clinic_user');
    if (session) signOut();
  };

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

  const handleNavigateToGenerator = (patient: { 
    name: string; 
    birthNumber: string; 
    phone?: string; 
    email?: string; 
    address?: string; 
    insurance?: string; 
    initialDocType?: any;
  }) => {
    setSelectedPatient(patient);
    changeTab('generator');
  };

  const handleOpenPatientFromCalendar = (patientId: string) => {
    const found = patients.find(p => p.id === patientId);
    if (found) {
      setSelectedPatientForFolder(found);
    }
    changeTab('patients');
  };

  const handleAddCalendarEvent = (newEvent: CalendarEvent) => {
    setCalendarEvents((prev) => {
      const updated = [newEvent, ...prev];
      localStorage.setItem('say_clinic_calendar_events', JSON.stringify(updated));
      return updated;
    });
  };

  const handleConvertNoteToProject = (noteText: string, _noteId?: string) => {
    if (!currentUser) return;
    const newProj = buildProjectFromNote(noteText, currentUser);

    try {
      const existingStr = localStorage.getItem('say_clinic_projects');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      localStorage.setItem('say_clinic_projects', JSON.stringify([newProj, ...existing]));
    } catch (e) {
      console.error('Chyba ukladania prekonvertovaného projektu:', e);
    }

    changeTab('projects');
  };

  // Dnešné udalosti pre Homescreen
  const todayString = new Date().toISOString().split('T')[0];
  const todayEvents = calendarEvents.filter(e => e.date === todayString);

  // AK NIE JE POUŽÍVATEĽ PRIHLÁSENÝ, ZOBRAZUJEME IBA PRIHLASOVACÍ PORTÁL BEZ HORNEJ LIŠTY
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FBF9F6] text-[#2C2A29] flex flex-col justify-between selection:bg-[#C5A059]/20">
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <LoginForm onLoginSuccess={handleLoginSuccess} />
        </main>
        <footer className="border-t border-[#E8E2D9] py-4 text-center text-xs text-[#8C857B]">
          <p>© {new Date().getFullYear()} SAY CLINIC s.r.o. • Všetky práva vyhradené • Šifrované end-to-end spojenie</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F6]">
      {/* HLAVIČKA A PRECHOD NA HOMESCREEN CEZ LOGO */}
      <header className="bg-white border-b border-[#E8E2D9] sticky top-0 z-40 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* LOGO (KLIKNUTIE PRESMERUJE NA HOMESCREEN) */}
          <div className="flex items-center cursor-pointer group" onClick={() => changeTab('home')}>
            <img 
              src="/logo.png" 
              alt="SAY BY MRAZ" 
              className="h-14 md:h-16 w-auto object-contain transition-transform group-hover:scale-105" 
            />
          </div>

          {/* NAVIGÁCIA */}
          <nav className="flex flex-wrap gap-2 text-[11px] font-light uppercase tracking-wider text-[#8C857B]">
            <button
              onClick={() => changeTab('home')}
              className={`px-3 py-2 transition-all ${
                activeTab === 'home' ? 'text-[#2C2A29] border-b-2 border-[#C5A059] font-semibold' : 'hover:text-[#2C2A29]'
              }`}
            >
              🏠 Prehľad (Home)
            </button>
            <button
              onClick={() => {
                setSelectedPatient(null);
                changeTab('generator');
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
                changeTab('patients');
              }}
              className={`px-3 py-2 transition-all ${
                activeTab === 'patients' ? 'text-[#2C2A29] border-b-2 border-[#C5A059] font-semibold' : 'hover:text-[#2C2A29]'
              }`}
            >
              🗂️ Kartotéka Pacientov
            </button>
            <button
              onClick={() => changeTab('aesthetics')}
              className={`px-3 py-2 transition-all ${
                activeTab === 'aesthetics' ? 'text-[#2C2A29] border-b-2 border-[#C5A059] font-semibold' : 'hover:text-[#2C2A29]'
              }`}
            >
              💉 Botox & Výplne
            </button>
            <button
              onClick={() => changeTab('cosmetics')}
              className={`px-3 py-2 transition-all ${
                activeTab === 'cosmetics' ? 'text-[#2C2A29] border-b-2 border-[#C5A059] font-semibold' : 'hover:text-[#2C2A29]'
              }`}
            >
              🛍️ Predaj & Kozmetika
            </button>
            <button
              onClick={() => changeTab('calendar')}
              className={`px-3 py-2 transition-all ${
                activeTab === 'calendar' ? 'text-[#2C2A29] border-b-2 border-[#C5A059] font-semibold' : 'hover:text-[#2C2A29]'
              }`}
            >
              📅 Kalendár & Plánovanie
            </button>
            <button
              onClick={() => changeTab('inventory')}
              className={`px-3 py-2 transition-all ${
                activeTab === 'inventory' ? 'text-[#2C2A29] border-b-2 border-[#C5A059] font-semibold' : 'hover:text-[#2C2A29]'
              }`}
            >
              📦 Sklad & Materiál
            </button>
            <button
              onClick={() => changeTab('finance')}
              className={`px-3 py-2 transition-all ${
                activeTab === 'finance' ? 'text-[#2C2A29] border-b-2 border-[#C5A059] font-semibold' : 'hover:text-[#2C2A29]'
              }`}
            >
              📊 Financie & Výsledky
            </button>
            <button
              onClick={() => changeTab('projects')}
              className={`px-3 py-2 transition-all ${
                activeTab === 'projects' ? 'text-[#2C2A29] border-b-2 border-[#C5A059] font-semibold' : 'hover:text-[#2C2A29]'
              }`}
            >
              📑 Projekty & Úlohy
            </button>
          </nav>

          {/* PROFIL */}
          <div className="border-l border-[#E8E2D9] pl-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-[#C5A059] p-0.5 shadow-sm bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white">
                  <LiquidAvatar id={currentUser.id} name={currentUser.name} role={currentUser.role} />
                </div>
              )}
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-[#2C2A29]">{currentUser.name}</p>
              <p className="text-[9px] uppercase tracking-widest text-[#C5A059]">
                {currentUser.role === 'ceo' ? 'CEO & Primár' : currentUser.role === 'doctor' ? 'Lekár' : currentUser.role === 'manager' ? 'Manažment' : 'Sestra'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-[#8C857B] hover:text-[#2C2A29] underline underline-offset-4"
            >
              Odhlásiť
            </button>
          </div>
        </div>
      </header>

      {/* OBSAH */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
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
                        onClick={() => changeTab('calendar')}
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
                          onClick={() => changeTab('aesthetics')}
                          className="w-full bg-[#FBF9F6] border border-[#E8E2D9] hover:border-[#C5A059] p-3 rounded-xl text-left font-bold text-[#2C2A29] transition-all flex items-center justify-between"
                        >
                          <span>💉 Nová aplikácia Botoxu / Výplne</span>
                          <span className="text-[#C5A059]">+</span>
                        </button>
                        <button 
                          onClick={() => changeTab('cosmetics')}
                          className="w-full bg-[#FBF9F6] border border-[#E8E2D9] hover:border-[#C5A059] p-3 rounded-xl text-left font-bold text-[#2C2A29] transition-all flex items-center justify-between"
                        >
                          <span>🛍️ Pultový predaj dermokozmetiky</span>
                          <span className="text-[#C5A059]">+</span>
                        </button>
                        <button 
                          onClick={() => { setSelectedPatient(null); changeTab('generator'); }}
                          className="w-full bg-[#FBF9F6] border border-[#E8E2D9] hover:border-[#C5A059] p-3 rounded-xl text-left font-bold text-[#2C2A29] transition-all flex items-center justify-between"
                        >
                          <span>📄 Nový lekársky nález</span>
                          <span className="text-[#C5A059]">+</span>
                        </button>
                        <button 
                          onClick={() => { setSelectedPatientForFolder(null); changeTab('patients'); }}
                          className="w-full bg-[#FBF9F6] border border-[#E8E2D9] hover:border-[#C5A059] p-3 rounded-xl text-left font-bold text-[#2C2A29] transition-all flex items-center justify-between"
                        >
                          <span>🗂️ Zaevidovať nového pacienta</span>
                          <span className="text-[#C5A059]">+</span>
                        </button>
                        <button 
                          onClick={() => changeTab('calendar')}
                          className="w-full bg-[#2C2A29] text-white hover:bg-[#C5A059] p-3 rounded-xl text-left font-bold transition-all flex items-center justify-between"
                        >
                          <span>📅 Naplánovať operáciu v kalendári</span>
                          <span>+</span>
                        </button>
                        <button 
                          onClick={() => changeTab('projects')}
                          className="w-full bg-[#FAF4E9] border border-[#E6D4B2] hover:border-[#C5A059] p-3 rounded-xl text-left font-bold text-[#2C2A29] transition-all flex items-center justify-between"
                        >
                          <span className="text-[#8A6827]">📑 Projekty & Delegovanie úloh (CEO)</span>
                          <span className="text-[#C5A059] font-bold">➔</span>
                        </button>
                      </div>
                    </div>

                    {/* RÝCHLE KLINICKÉ POZNÁMKY (OPERATÍVA) */}
                    <OperativeNotesWidget 
                      currentUser={currentUser}
                      onConvertToProject={(noteText, noteId) => handleConvertNoteToProject(noteText, noteId)}
                      onOpenProjects={() => changeTab('projects')}
                    />

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
                onNavigateToAesthetics={(patient) => {
                  setSelectedPatientForFolder(patient);
                  changeTab('aesthetics');
                }}
                initialPatient={selectedPatientForFolder}
                onPatientsUpdated={(updatedList) => setPatients(updatedList)}
                calendarEvents={calendarEvents}
                onAddCalendarEvent={handleAddCalendarEvent}
                onNavigateToCalendar={() => changeTab('calendar')}
              />
            )}

            {/* ESTETICKÁ MEDICÍNA & FACE MAPPING */}
            {activeTab === 'aesthetics' && (
              <AestheticsModule 
                patients={patients}
                selectedPatientId={selectedPatientForFolder?.id || (patients.length > 0 ? patients[0].id : undefined)}
                onSelectPatient={(id) => {
                  const p = patients.find(pat => pat.id === id);
                  if (p) setSelectedPatientForFolder(p);
                }}
                onOpenPatientFolder={(patient) => {
                  setSelectedPatientForFolder(patient);
                  changeTab('patients');
                }}
              />
            )}

            {/* PREDAJ KOZMETIKY & POS */}
            {activeTab === 'cosmetics' && (
              <CosmeticsPOSModule 
                patients={patients}
                onSaleCompleted={handleAddSale}
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
                calendarEvents={calendarEvents}
                patients={patients}
              />
            )}

            {/* PROJEKTY & OPERATÍVNY MANAŽMENT (CEO) */}
            {activeTab === 'projects' && (
              <ProjectManagement 
                currentUser={currentUser}
              />
            )}
          </>
      </main>
    </div>
  );
}