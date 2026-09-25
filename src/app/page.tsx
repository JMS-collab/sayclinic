'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { KeyRound, X, Lock, Eye, EyeOff, AlertCircle, Check, Shield, ShieldAlert } from 'lucide-react';
import MedicalRecordForm from '../components/MedicalRecordForm';
import PatientDatabase, { Patient, MOCK_PATIENTS } from '../components/PatientDatabase';
import LoginForm, { UserAccount } from '../components/LoginForm';
import { LiquidAvatar } from '../components/LiquidAvatar';
import FinanceCRM from '../components/FinanceCRM';
import Calendar, { CalendarEvent } from '../components/Calendar';
import InventoryCRM from '../components/InventoryCRM';
import { AestheticsModule } from '../components/AestheticsModule';
import { CosmeticsPOSModule } from '../components/CosmeticsPOSModule';
import ProjectManagement from '../components/ProjectManagement';
import OperativeNotesWidget from '../components/OperativeNotesWidget';
import RolePermissionsModal from '../components/RolePermissionsModal';
import AutoLogoutGuard from '../components/AutoLogoutGuard';
import AuditLogModal from '../components/AuditLogModal';
import { AuthService } from '../services/authService';
import { AuditLogService } from '../services/auditLogService';
import { 
  PermissionsService, 
  TabId, 
  RoleType, 
  TABS_REGISTRY 
} from '../services/permissionsService';

export interface SaleItem {
  id: string;
  date: string;
  patientName: string;
  doctorName: string;
  serviceType: string;
  amount: number;
}

const INITIAL_SALES: SaleItem[] = [];

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

  const [isMounted, setIsMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [sales, setSales] = useState<SaleItem[]>(INITIAL_SALES);

  // Počúvanie zmien predajov
  useEffect(() => {
    const handleSalesChanged = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setSales(e.detail);
      }
    };
    window.addEventListener('say_clinic_sales_changed', handleSalesChanged);
    return () => window.removeEventListener('say_clinic_sales_changed', handleSalesChanged);
  }, []);

  // Živý čas a dátum
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Stav pre vybraného pacienta z Kartotéky pre Generátor alebo detail
  const [selectedPatient, setSelectedPatient] = useState<{ name: string; birthNumber: string } | null>(null);
  const [selectedPatientForFolder, setSelectedPatientForFolder] = useState<Patient | null>(null);

  // Stav pre predvyplnenie POS z karty pacienta a plánu
  const [posSelectedPatientId, setPosSelectedPatientId] = useState<string>('');
  const [posPrefillItems, setPosPrefillItems] = useState<any[]>([]);

  // Zoznam pacientov a udalostí
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  // Správa hesla používateľa (Modal zmeny hesla)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Stav pre správu oprávnení (RBAC Modal) a simuláciu roly
  const [showRolePermissionsModal, setShowRolePermissionsModal] = useState(false);
  const [showAuditLogModal, setShowAuditLogModal] = useState(false);
  const [logoutNotice, setLogoutNotice] = useState<string | null>(null);
  const [permissionsVersion, setPermissionsVersion] = useState(0);
  const [simulatedRole, setSimulatedRole] = useState<RoleType | null>(null);

  const isRealCeo = currentUser ? (currentUser.role === 'ceo' || currentUser.email === 'mraz@sayclinic.sk' || currentUser.id === 'u1') : false;

  // Počúvanie zmien oprávnení a simulácie rolí
  useEffect(() => {
    const handlePermissionsChanged = () => setPermissionsVersion(v => v + 1);
    const handleRoleSimulated = (e: any) => {
      setSimulatedRole(e.detail);
      setPermissionsVersion(v => v + 1);
    };
    window.addEventListener('say_clinic_permissions_changed', handlePermissionsChanged);
    window.addEventListener('say_clinic_role_simulated', handleRoleSimulated);
    return () => {
      window.removeEventListener('say_clinic_permissions_changed', handlePermissionsChanged);
      window.removeEventListener('say_clinic_role_simulated', handleRoleSimulated);
    };
  }, []);

  // 1. ZACHOVANIE PRIHLÁSENÉHO POUŽÍVATEĽA A DÁT PRI MOUNTE NA KLIENTSKOM PREHLIADAČI
  useEffect(() => {
    setIsMounted(true);
    const sessionUser = AuthService.getCurrentSession();
    if (sessionUser) {
      setCurrentUser(sessionUser);
    }
    const savedRole = PermissionsService.getSimulatedRole();
    if (savedRole) {
      setSimulatedRole(savedRole);
    }
    try {
      const savedSales = localStorage.getItem('say_clinic_sales_v1');
      if (savedSales !== null) {
        const parsed = JSON.parse(savedSales);
        if (Array.isArray(parsed)) setSales(parsed);
      }
    } catch (e) {
      console.error('Chyba načítania predajov:', e);
    }
  }, []);

  // Ochrana prístupu k záložke: ak používateľ nemá právo na aktuálnu záložku, vráti ho na domovskú obrazovku
  useEffect(() => {
    if (currentUser && !PermissionsService.canUserAccessTab(currentUser, activeTab as TabId)) {
      setActiveTab('home');
      window.history.replaceState({ tab: 'home' }, '', '#home');
    }
  }, [currentUser, activeTab, permissionsVersion, simulatedRole]);

  // 2. NAVIGÁCIA ŠÍPKAMI V PREHLIADAČI (POPSTATE LISTENER)
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '') as TabType;
      if (['home', 'generator', 'patients', 'aesthetics', 'cosmetics', 'finance', 'calendar', 'inventory', 'projects'].includes(hash)) {
        if (currentUser && !PermissionsService.canUserAccessTab(currentUser, hash as TabId)) {
          setActiveTab('home');
        } else {
          setActiveTab(hash);
        }
      } else {
        setActiveTab('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    handlePopState(); // Načítanie pri prvom otvorení

    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser, permissionsVersion, simulatedRole]);

  // Funkcia pre prepínanie záložiek s zápisom do histórie prehliadača s overením oprávnenia
  const changeTab = (tab: TabType) => {
    if (currentUser && !PermissionsService.canUserAccessTab(currentUser, tab as TabId)) {
      setActiveTab('home');
      window.history.pushState({ tab: 'home' }, '', '#home');
      return;
    }
    setActiveTab(tab);
    window.history.pushState({ tab }, '', `#${tab}`);
  };

  const handleLoginSuccess = (user: UserAccount, rememberMe: boolean = true) => {
    setCurrentUser(user);
    AuthService.saveSession(user, rememberMe);
  };

  const handleLogout = (reason?: string) => {
    AuthService.clearSession(currentUser, reason || 'Používateľské odhlásenie');
    setCurrentUser(null);
    if (reason) {
      setLogoutNotice(reason);
      setTimeout(() => setLogoutNotice(null), 8000);
    }
    if (session) signOut();
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!oldPassword) {
      setPasswordChangeStatus({ type: 'error', message: 'Zadajte pôvodné heslo.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordChangeStatus({ type: 'error', message: 'Nové heslo musí mať minimálne 6 znakov.' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordChangeStatus({ type: 'error', message: 'Nové heslo a jeho potvrdenie sa nezhodujú.' });
      return;
    }

    const res = AuthService.changePassword(currentUser.id, oldPassword, newPassword);
    if (res.success) {
      setPasswordChangeStatus({ type: 'success', message: 'Heslo bolo úspešne zmenené.' });
      setTimeout(() => {
        setShowChangePasswordModal(false);
        setPasswordChangeStatus(null);
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }, 1500);
    } else {
      setPasswordChangeStatus({ type: 'error', message: res.message });
    }
  };

  // Aktualizácia živého času
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Načítanie uložených pacientov z localStorage (so zachovaním predvolených pacientov)
  useEffect(() => {
    const saved = localStorage.getItem('say_clinic_patients');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingNames = new Set(parsed.map((p: any) => p.name?.toLowerCase().trim()));
          const missingDefaults = MOCK_PATIENTS.filter(p => !existingNames.has(p.name.toLowerCase().trim()));
          const combined = missingDefaults.length > 0 ? [...parsed, ...missingDefaults] : parsed;
          setPatients(combined);
          if (missingDefaults.length > 0) {
            localStorage.setItem('say_clinic_patients', JSON.stringify(combined));
          }
          return;
        }
      } catch (e) {
        console.error('Chyba načítania pacientov:', e);
      }
    }
    setPatients(MOCK_PATIENTS);
    localStorage.setItem('say_clinic_patients', JSON.stringify(MOCK_PATIENTS));
  }, []);

  // Načítanie kešovaných kalendárových udalostí
  useEffect(() => {
    const cachedEvents = localStorage.getItem('say_clinic_calendar_events');
    if (cachedEvents) {
      try {
        const parsed = JSON.parse(cachedEvents);
        if (Array.isArray(parsed)) {
          const realEvents = parsed.filter((e: any) => !e.id?.startsWith('seed-') && !e.id?.startsWith('demo-'));
          setCalendarEvents(realEvents);
          localStorage.setItem('say_clinic_calendar_events', JSON.stringify(realEvents));
        }
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
    setSales((prev) => {
      const updated = [item, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem('say_clinic_sales_v1', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('say_clinic_sales_changed', { detail: updated }));
      }
      return updated;
    });
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

  // Počas úvodného SSR a hydratácie zobrazíme jednotný čistý loader, aby sa zamedzilo akémukoľvek hydration mismatch
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#FBF9F6] flex items-center justify-center selection:bg-[#C5A059]/20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
          <p className="text-[11px] uppercase tracking-widest text-[#8C857B] font-medium font-brand">
            SAY CLINIC • Načítavam...
          </p>
        </div>
      </div>
    );
  }

  // AK NIE JE POUŽÍVATEĽ PRIHLÁSENÝ, ZOBRAZUJEME IBA PRIHLASOVACÍ PORTÁL BEZ HORNEJ LIŠTY
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FBF9F6] text-[#2C2A29] flex flex-col justify-between selection:bg-[#C5A059]/20">
        {logoutNotice && (
          <div className="bg-amber-600 text-white px-6 py-3 text-center text-xs font-semibold shadow-md flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <ShieldAlert className="w-4 h-4 text-amber-200 flex-shrink-0" />
            <span>{logoutNotice}</span>
          </div>
        )}
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
      {/* 60-MINÚTOVÝ AUTO-LOGOUT GUARD (GDPR & HIPAA BEZPEČNOSŤ) */}
      <AutoLogoutGuard
        currentUser={currentUser}
        inactivityLimitMinutes={60}
        warningCountdownSeconds={120}
        onLogout={(reason) => handleLogout(reason)}
      />

      {/* SIMULAČNÁ LIŠTA (PRE CEO) */}
      {simulatedRole && (
        <div className="bg-amber-500 text-white px-6 py-2.5 flex items-center justify-between text-xs font-semibold shadow-md z-50 sticky top-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="animate-pulse">👁️</span>
            <span>
              Režim simulácie: Práve vidíte systém presne tak, ako profil <strong>{PermissionsService.getRoleTitle(simulatedRole)}</strong>.
            </span>
          </div>
          <button
            type="button"
            onClick={() => PermissionsService.setSimulatedRole(null)}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold underline cursor-pointer transition-colors"
          >
            Ukončiť náhľad (Späť k CEO)
          </button>
        </div>
      )}

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

          {/* DYNAMICKÁ NAVIGÁCIA PODĽA OPRÁVNENÍ PROFILU */}
          <nav className="flex flex-wrap gap-2 text-[11px] font-light uppercase tracking-wider text-[#8C857B]">
            {TABS_REGISTRY.map((tabMeta) => {
              if (!PermissionsService.canUserAccessTab(currentUser, tabMeta.id)) return null;
              const isActive = activeTab === tabMeta.id;
              return (
                <button
                  key={tabMeta.id}
                  onClick={() => {
                    if (tabMeta.id === 'generator') setSelectedPatient(null);
                    if (tabMeta.id === 'patients') setSelectedPatientForFolder(null);
                    changeTab(tabMeta.id);
                  }}
                  className={`px-3 py-2 transition-all ${
                    isActive ? 'text-[#2C2A29] border-b-2 border-[#C5A059] font-semibold' : 'hover:text-[#2C2A29]'
                  }`}
                >
                  {tabMeta.icon} {tabMeta.label}
                </button>
              );
            })}
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
                {currentUser.title || (currentUser.role === 'ceo' ? 'CEO & Primár' : currentUser.role === 'doctor' ? 'Lekár' : currentUser.role === 'manager' ? 'Manažment' : 'Sestra')}
              </p>
            </div>
            
            {/* TLAČIDLO PRE SPRÁVU OPRÁVNENÍ (LEN PRE CEO) */}
            {isRealCeo && (
              <button
                type="button"
                onClick={() => setShowRolePermissionsModal(true)}
                title="Správa oprávnení a rolí SAY CLINIC"
                className="p-1.5 text-[#8C857B] hover:text-[#C5A059] hover:bg-[#FAF8F5] rounded-lg border border-transparent hover:border-[#E8E2D9] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-[#C5A059]" />
                <span className="hidden lg:inline text-[11px] font-bold text-[#2C2A29]">Oprávnenia</span>
              </button>
            )}

            {/* TLAČIDLO PRE GDPR AUDITNÝ LOG (PRE CEO A MANAŽMENT) */}
            {(isRealCeo || currentUser.role === 'manager') && (
              <button
                type="button"
                onClick={() => setShowAuditLogModal(true)}
                title="GDPR Bezpečnostná auditná stopa (Audit Log)"
                className="p-1.5 text-[#8C857B] hover:text-amber-600 hover:bg-amber-50/50 rounded-lg border border-transparent hover:border-amber-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden lg:inline text-[11px] font-bold text-[#2C2A29]">Audit Log</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setShowChangePasswordModal(true);
                setPasswordChangeStatus(null);
                setOldPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
              }}
              title="Zmeniť heslo účtu"
              className="p-1.5 text-[#8C857B] hover:text-[#C5A059] hover:bg-[#FAF8F5] rounded-lg border border-transparent hover:border-[#E8E2D9] transition-all"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => handleLogout()}
              className="text-xs text-[#8C857B] hover:text-rose-600 transition-colors font-medium underline underline-offset-4 cursor-pointer"
            >
              Odhlásiť
            </button>
          </div>
        </div>
      </header>

      {/* MODAL PRE ZMENU HESLA PRIHLÁSENÉHO POUŽÍVATEĽA */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2A29]/30 backdrop-blur-md animate-in fade-in duration-200">
          <div className="backdrop-blur-3xl bg-white/95 border border-white/90 w-full max-w-md rounded-[32px] shadow-[0_35px_80px_rgba(0,0,0,0.18)] overflow-hidden">
            <div className="p-6 border-b border-[#E8E2D9] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#C5A059]/15 text-[#C5A059]">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#2C2A29]">Zmena hesla</h3>
                  <p className="text-xs text-[#8C857B]">{currentUser.name} ({currentUser.email})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowChangePasswordModal(false)}
                className="p-1.5 text-[#8C857B] hover:text-[#2C2A29] rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="p-6 space-y-4">
              {passwordChangeStatus && (
                <div
                  className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
                    passwordChangeStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {passwordChangeStatus.type === 'success' ? (
                    <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  )}
                  <span>{passwordChangeStatus.message}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#2C2A29] mb-1.5">
                  Aktuálne (pôvodné) heslo
                </label>
                <div className="relative">
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Zadajte súčasné heslo"
                    className="w-full border border-[#E8E2D9] p-3 rounded-xl text-sm outline-none focus:border-[#C5A059] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3 top-3 text-[#8C857B] hover:text-[#2C2A29]"
                  >
                    {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2C2A29] mb-1.5">
                  Nové heslo (min. 6 znakov)
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Zadajte nové bezpečné heslo"
                    className="w-full border border-[#E8E2D9] p-3 rounded-xl text-sm outline-none focus:border-[#C5A059] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-3 text-[#8C857B] hover:text-[#2C2A29]"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2C2A29] mb-1.5">
                  Potvrdenie nového hesla
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Zopakujte nové heslo"
                  className="w-full border border-[#E8E2D9] p-3 rounded-xl text-sm outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="flex-1 py-3 border border-[#E8E2D9] text-[#8C857B] hover:text-[#2C2A29] rounded-xl text-xs font-semibold hover:bg-gray-50 transition-all"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#2C2A29] hover:bg-[#C5A059] text-white rounded-xl text-xs font-semibold transition-all shadow-md"
                >
                  Uložiť nové heslo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

                  {PermissionsService.canUserDo(currentUser, 'view_financial_kpis') ? (
                    <div className="bg-white border border-[#E8E2D9] p-4 rounded-xl shadow-sm">
                      <p className="text-[10px] uppercase text-[#8C857B] font-bold">Dnešný predpokladovaný obrat</p>
                      <p className="text-2xl font-bold text-[#2C2A29] mt-1">
                        {sales.reduce((acc, s) => acc + s.amount, 0).toLocaleString('sk-SK')} €
                      </p>
                      <p className="text-[10px] text-[#8C857B] mt-1">Záznamy z CRM</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-[#E8E2D9] p-4 rounded-xl shadow-sm">
                      <p className="text-[10px] uppercase text-[#8C857B] font-bold">Dnešný program výkonov</p>
                      <p className="text-2xl font-bold text-[#2C2A29] mt-1">
                        {todayEvents.length} výkonov
                      </p>
                      <p className="text-[10px] text-sky-600 mt-1 font-semibold">Harmonogram sály</p>
                    </div>
                  )}

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
                        {PermissionsService.canUserAccessTab(currentUser, 'aesthetics') && (
                          <button 
                            onClick={() => changeTab('aesthetics')}
                            className="w-full bg-[#FBF9F6] border border-[#E8E2D9] hover:border-[#C5A059] p-3 rounded-xl text-left font-bold text-[#2C2A29] transition-all flex items-center justify-between"
                          >
                            <span>💉 Nová aplikácia Botoxu / Výplne</span>
                            <span className="text-[#C5A059]">+</span>
                          </button>
                        )}
                        {PermissionsService.canUserAccessTab(currentUser, 'cosmetics') && (
                          <button 
                            onClick={() => changeTab('cosmetics')}
                            className="w-full bg-[#FBF9F6] border border-[#E8E2D9] hover:border-[#C5A059] p-3 rounded-xl text-left font-bold text-[#2C2A29] transition-all flex items-center justify-between"
                          >
                            <span>🛍️ Pultový predaj dermokozmetiky</span>
                            <span className="text-[#C5A059]">+</span>
                          </button>
                        )}
                        {PermissionsService.canUserAccessTab(currentUser, 'generator') && (
                          <button 
                            onClick={() => { setSelectedPatient(null); changeTab('generator'); }}
                            className="w-full bg-[#FBF9F6] border border-[#E8E2D9] hover:border-[#C5A059] p-3 rounded-xl text-left font-bold text-[#2C2A29] transition-all flex items-center justify-between"
                          >
                            <span>📄 Nový lekársky nález</span>
                            <span className="text-[#C5A059]">+</span>
                          </button>
                        )}
                        {PermissionsService.canUserAccessTab(currentUser, 'patients') && (
                          <button 
                            onClick={() => { setSelectedPatientForFolder(null); changeTab('patients'); }}
                            className="w-full bg-[#FBF9F6] border border-[#E8E2D9] hover:border-[#C5A059] p-3 rounded-xl text-left font-bold text-[#2C2A29] transition-all flex items-center justify-between"
                          >
                            <span>🗂️ Zaevidovať nového pacienta</span>
                            <span className="text-[#C5A059]">+</span>
                          </button>
                        )}
                        {PermissionsService.canUserAccessTab(currentUser, 'calendar') && (
                          <button 
                            onClick={() => changeTab('calendar')}
                            className="w-full bg-[#2C2A29] text-white hover:bg-[#C5A059] p-3 rounded-xl text-left font-bold transition-all flex items-center justify-between"
                          >
                            <span>📅 Naplánovať operáciu v kalendári</span>
                            <span>+</span>
                          </button>
                        )}
                        {PermissionsService.canUserAccessTab(currentUser, 'projects') && (
                          <button 
                            onClick={() => changeTab('projects')}
                            className="w-full bg-[#FAF4E9] border border-[#E6D4B2] hover:border-[#C5A059] p-3 rounded-xl text-left font-bold text-[#2C2A29] transition-all flex items-center justify-between"
                          >
                            <span className="text-[#8A6827]">📑 Projekty & Delegovanie úloh (CEO)</span>
                            <span className="text-[#C5A059] font-bold">➔</span>
                          </button>
                        )}
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
                onNavigateToCosmetics={(patient, prefillItems) => {
                  if (patient) {
                    setSelectedPatientForFolder(patient);
                    setPosSelectedPatientId(patient.id);
                  }
                  if (prefillItems) {
                    setPosPrefillItems(prefillItems);
                  }
                  changeTab('cosmetics');
                }}
                initialPatient={selectedPatientForFolder}
                onPatientsUpdated={(updatedList) => setPatients(updatedList)}
                calendarEvents={calendarEvents}
                onAddCalendarEvent={handleAddCalendarEvent}
                onNavigateToCalendar={() => changeTab('calendar')}
              />
            )}

            {/* ESTETICKÁ MEDICÍNA & FACE MAPPING */}
            {activeTab === 'aesthetics' && PermissionsService.canUserAccessTab(currentUser, 'aesthetics') && (
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
            {activeTab === 'cosmetics' && PermissionsService.canUserAccessTab(currentUser, 'cosmetics') && (
              <CosmeticsPOSModule 
                patients={patients}
                onSaleCompleted={handleAddSale}
                initialSelectedPatientId={posSelectedPatientId}
                initialPrefillItems={posPrefillItems}
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

            {/* FINANCIE - PRÍSTUPNÉ LEN PRE CEO A MANAŽMENT */}
            {activeTab === 'finance' && PermissionsService.canUserAccessTab(currentUser, 'finance') && (
              <FinanceCRM 
                sales={sales} 
                calendarEvents={calendarEvents}
                patients={patients}
                currentUser={currentUser}
              />
            )}

            {/* PROJEKTY & OPERATÍVNY MANAŽMENT (CEO & TÍM) */}
            {activeTab === 'projects' && PermissionsService.canUserAccessTab(currentUser, 'projects') && (
              <ProjectManagement 
                currentUser={currentUser}
              />
            )}
          </>
      </main>

      {/* MODÁLNE OKNO PRE SPRÁVU OPRÁVNENÍ A ROLÍ (PRÍSTUPNÉ PRE CEO) */}
      {currentUser && (
        <RolePermissionsModal
          isOpen={showRolePermissionsModal}
          onClose={() => setShowRolePermissionsModal(false)}
          currentUser={currentUser}
        />
      )}

      {/* MODÁLNE OKNO PRE GDPR BEZPEČNOSTNÝ AUDITNÝ LOG */}
      {currentUser && (
        <AuditLogModal
          isOpen={showAuditLogModal}
          onClose={() => setShowAuditLogModal(false)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}