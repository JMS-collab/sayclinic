'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { 
  KeyRound, 
  X, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Check, 
  Shield, 
  ShieldAlert, 
  Monitor, 
  Cpu,
  LayoutDashboard,
  FolderOpen,
  Calendar as CalendarIcon,
  Boxes,
  Briefcase,
  ShoppingBag,
  BarChart3,
  FileText,
  Sparkles,
  Pill,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  UserPlus,
  LogOut,
  Cloud,
  Plus
} from 'lucide-react';
import { DevicePinService } from '../services/devicePinService';
import MedicalRecordForm from '../components/MedicalRecordForm';
import PatientDatabase, { Patient, MOCK_PATIENTS } from '../components/PatientDatabase';
import ActivePatientBar from '../components/ActivePatientBar';
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
import { RealtimeSyncService } from '../services/realtimeSyncService';
import PrescriptionModule from '../components/PrescriptionModule';
import { 
  setExternalAccessToken, 
  subscribeWorkspaceAuth, 
  googleSignIn, 
  getAccessToken, 
  initWorkspaceAuth 
} from '../lib/workspaceAuth';
import { 
  PermissionsService, 
  TabId, 
  RoleType, 
  TABS_REGISTRY,
  NAVIGATION_PILLARS,
  TabMeta
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

type TabType = TabId;

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
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    if (typeof window !== 'undefined') {
      return AuthService.getCurrentSession();
    }
    return null;
  });
  const [workspaceGoogleUser, setWorkspaceGoogleUser] = useState<any>(null);
  const [workspaceToken, setWorkspaceToken] = useState<string | null>(null);

  // Sledovanie autorizácie cez Google Workspace
  useEffect(() => {
    const unsub = subscribeWorkspaceAuth((user, token) => {
      setWorkspaceGoogleUser(user);
      setWorkspaceToken(token);
    });
    return () => unsub();
  }, []);

  // Automatické prepojenie Google Drive & Kalendára pri štarte aplikácie
  useEffect(() => {
    if (!isMounted) return;

    // 1. Ak NextAuth session obsahuje token, prepojíme do workspaceAuth
    if (session && (session as any).accessToken) {
      setExternalAccessToken((session as any).accessToken, session.user);
    } else {
      // 2. Skúsime overiť token cez /api/auth/session alebo tichý init
      initWorkspaceAuth(
        (user, token) => {
          setExternalAccessToken(token, user);
        },
        () => {
          getAccessToken().then((tok) => {
            if (tok) setExternalAccessToken(tok);
          });
        }
      );
    }
  }, [isMounted, session]);

  // Synchronizácia relácie používateľa medzi viacerými oknami/kartami
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'say_clinic_user') {
        const updated = AuthService.getCurrentSession();
        setCurrentUser(updated);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

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

  // Šírka rozhrania: automatická responzívna šírka prispôsobená pre notebooky, monitory aj 2K/4K displeje
  const containerClass = 'w-full max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12';

  // Stav pre vybraného pacienta z Kartotéky pre Generátor alebo detail
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<{ 
    id?: string;
    name: string; 
    birthNumber: string; 
    phone?: string; 
    email?: string; 
    address?: string; 
    insurance?: string; 
    initialDocType?: any;
  } | null>(null);
  const [selectedPatientForFolder, setSelectedPatientForFolder] = useState<Patient | null>(null);
  const [patientActiveFolder, setPatientActiveFolder] = useState<any>('dokumenty');

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
  const [securityModalTab, setSecurityModalTab] = useState<'password' | 'pin'>('password');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [pinChangeStatus, setPinChangeStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Stav pre správu oprávnení (RBAC Modal), simuláciu roly a profilové menu
  const [showRolePermissionsModal, setShowRolePermissionsModal] = useState(false);
  const [showAuditLogModal, setShowAuditLogModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [logoutNotice, setLogoutNotice] = useState<string | null>(null);
  const [permissionsVersion, setPermissionsVersion] = useState(0);
  const [simulatedRole, setSimulatedRole] = useState<RoleType | null>(null);

  const isRealCeo = currentUser ? (currentUser.role === 'ceo' || currentUser.email === 'mraz@sayclinic.sk' || currentUser.id === 'u1') : false;

  // Zatvorenie používateľského menu pri kliknutí mimo
  useEffect(() => {
    if (!showUserMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

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

  // 1. ZACHOVANIE AKTÍVNEHO PRIHLÁSENIA LEKÁRA AJ PO OBNOVENÍ STRÁNKY (F5 / REFRESH)
  useEffect(() => {
    setIsMounted(true);
    // Overenie a obnovenie aktívnej relácie lekára
    const activeSessionUser = AuthService.getCurrentSession();
    if (activeSessionUser) {
      setCurrentUser(activeSessionUser);
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
      if (['home', 'generator', 'patients', 'prescriptions', 'aesthetics', 'cosmetics', 'finance', 'calendar', 'inventory', 'projects'].includes(hash)) {
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

  const isGoogleConnected = Boolean(workspaceToken || (session as any)?.accessToken || workspaceGoogleUser || session);
  const connectedGoogleEmail = workspaceGoogleUser?.email || session?.user?.email || null;

  const handleGoogleConnectToggle = async () => {
    if (isGoogleConnected) {
      const confirmDisconnect = window.confirm(
        `Google účet (${connectedGoogleEmail || 'SAY CLINIC'}) je momentálne prepojený s Google Drive a Kalendárom.\n\nChcete odpojiť Google účet?`
      );
      if (confirmDisconnect) {
        const { googleLogout } = await import('../lib/workspaceAuth');
        await googleLogout();
        if (session) signOut({ redirect: false });
      }
    } else {
      try {
        const res = await googleSignIn();
        if (res?.accessToken) {
          setExternalAccessToken(res.accessToken, res.user);
        }
      } catch (err: any) {
        if (err?.code !== 'auth/popup-closed-by-user') {
          signIn('google');
        }
      }
    }
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

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
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

    const res = await AuthService.changePasswordAsync(currentUser.id, oldPassword, newPassword);
    if (res.success) {
      setPasswordChangeStatus({ type: 'success', message: 'Heslo bolo úspešne zmenené a platí na tablete, mobile aj všetkých počítačoch kliniky.' });
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

  const handleSaveNewPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeStatus(null);
    if (!currentUser) return;

    if (!/^\d{4}$/.test(newPin)) {
      setPinChangeStatus({ type: 'error', message: 'PIN musí obsahovať presne 4 číslice (0-9).' });
      return;
    }

    if (newPin !== confirmNewPin) {
      setPinChangeStatus({ type: 'error', message: 'Zadané PIN kódy sa nezhodujú.' });
      return;
    }

    try {
      const saved = await DevicePinService.saveDevicePin(currentUser.id, newPin);
      if (saved) {
        setPinChangeStatus({ 
          type: 'success', 
          message: `Nový 4-miestny PIN bol úspešne aktivovaný pre stanicu ${DevicePinService.getMachineName()}.` 
        });
        AuditLogService.log({
          user: currentUser,
          category: 'AUTH',
          action: 'DEVICE_PIN_ZMENA',
          details: `${currentUser.name} zmenil svoj osobný PIN pre pracovnú stanicu (${DevicePinService.getMachineName()} • ${DevicePinService.getMachineId()}).`,
          severity: 'info',
        });
        setTimeout(() => {
          setNewPin('');
          setConfirmNewPin('');
          setShowChangePasswordModal(false);
          setPinChangeStatus(null);
        }, 1500);
      } else {
        setPinChangeStatus({ type: 'error', message: 'Nepodarilo sa uložiť PIN do pamäte zariadenia.' });
      }
    } catch (err: any) {
      setPinChangeStatus({ type: 'error', message: err?.message || 'Chyba pri ukladaní PINu.' });
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

  // Obnovenie rozpracovaného pacienta zo session storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('say_clinic_active_patient_session_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          setActivePatient(parsed);
          setSelectedPatientForFolder(parsed);
          setSelectedPatient({
            name: parsed.name,
            birthNumber: parsed.birthNumber,
            phone: parsed.phone,
            email: parsed.email,
            address: parsed.address,
            insurance: parsed.insurance
          });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Pomocná funkcia na striktnú deduplikáciu udalostí podľa ID
  const dedupeEventsList = (events: CalendarEvent[]): CalendarEvent[] => {
    const seen = new Set<string>();
    return events.filter((e) => {
      if (!e || !e.id) return false;
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
  };

  // Načítanie kešovaných kalendárových udalostí
  useEffect(() => {
    const cachedEvents = localStorage.getItem('say_clinic_calendar_events');
    if (cachedEvents) {
      try {
        const parsed = JSON.parse(cachedEvents);
        if (Array.isArray(parsed)) {
          const realEvents = parsed.filter((e: any) => !e.id?.startsWith('seed-') && !e.id?.startsWith('demo-'));
          const deduped = dedupeEventsList(realEvents);
          setCalendarEvents(deduped);
          localStorage.setItem('say_clinic_calendar_events', JSON.stringify(deduped));
        }
      } catch (e) {
        console.error('Chyba načítania kešovaných udalostí kalendára:', e);
      }
    }
  }, []);

  // Centrálna real-time synchronizácia pre všetky počítače v sieti SAY CLINIC
  useEffect(() => {
    RealtimeSyncService.init();

    const unsubPatients = RealtimeSyncService.subscribe('patients', (updated) => {
      if (Array.isArray(updated) && updated.length > 0) {
        setPatients(updated);
        setActivePatient((prev) => {
          if (!prev) return null;
          const refreshed = updated.find((p: Patient) => p.id === prev.id);
          return refreshed || prev;
        });
      }
    });

    const unsubEvents = RealtimeSyncService.subscribe('calendar_events', (updated) => {
      if (Array.isArray(updated)) {
        setCalendarEvents(dedupeEventsList(updated));
      }
    });

    const unsubSales = RealtimeSyncService.subscribe('sales', (updated) => {
      if (Array.isArray(updated)) {
        setSales(updated);
      }
    });

    const unsubProjects = RealtimeSyncService.subscribe('projects', (updated) => {
      // Projekty sa spravujú v komponente ProjectManagement
    });

    return () => {
      unsubPatients();
      unsubEvents();
      unsubSales();
      unsubProjects();
    };
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
        RealtimeSyncService.publish('sales', updated, currentUser?.id);
      }
      return updated;
    });
  };

  // Správa aktívneho rozpracovaného pacienta (Active Patient Session - jediný zdroj pravdy)
  const handleSetActivePatient = (patient: Patient | null, extraDocType?: any) => {
    setActivePatient(patient);
    setSelectedPatientForFolder(patient);
    setPosSelectedPatientId(patient ? patient.id : '');
    if (patient) {
      setSelectedPatient((prev) => ({
        id: patient.id,
        name: patient.name,
        birthNumber: patient.birthNumber,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        insurance: patient.insurance,
        initialDocType: extraDocType !== undefined ? extraDocType : prev?.initialDocType
      }));
      try {
        localStorage.setItem('say_clinic_active_patient_session_v1', JSON.stringify(patient));
      } catch {
        // ignore
      }
    } else {
      setSelectedPatient(null);
      try {
        localStorage.removeItem('say_clinic_active_patient_session_v1');
      } catch {
        // ignore
      }
    }
  };

  const handleNavigateToGenerator = (patient: { 
    id?: string;
    name: string; 
    birthNumber: string; 
    phone?: string; 
    email?: string; 
    address?: string; 
    insurance?: string; 
    initialDocType?: any;
  }) => {
    const found = patients.find(p => (patient.id && p.id === patient.id) || p.birthNumber === patient.birthNumber || p.name.toLowerCase() === patient.name.toLowerCase());
    if (found) {
      handleSetActivePatient(found, patient.initialDocType);
    } else {
      setSelectedPatient(patient);
    }
    changeTab('generator');
  };

  const handleOpenPatientFromCalendar = (patientId: string, patientName?: string) => {
    let found = patients.find(p => p.id === patientId);
    if (!found && patientName) {
      found = patients.find(p => p.name.toLowerCase() === patientName.toLowerCase());
    }
    if (found) {
      handleSetActivePatient(found);
    }
    changeTab('patients');
  };

  const handleAddCalendarEvent = (newEvent: CalendarEvent) => {
    setCalendarEvents((prev) => {
      const updated = [newEvent, ...prev];
      localStorage.setItem('say_clinic_calendar_events', JSON.stringify(updated));
      RealtimeSyncService.publish('calendar_events', updated, currentUser?.id);
      return updated;
    });
  };

  const handleConvertNoteToProject = (noteText: string, _noteId?: string) => {
    if (!currentUser) return;
    const newProj = buildProjectFromNote(noteText, currentUser);

    try {
      const existingStr = localStorage.getItem('say_clinic_projects');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      const updatedProjects = [newProj, ...existing];
      localStorage.setItem('say_clinic_projects', JSON.stringify(updatedProjects));
      RealtimeSyncService.publish('projects', updatedProjects, currentUser?.id);
    } catch (e) {
      console.error('Chyba ukladania prekonvertovaného projektu:', e);
    }

    changeTab('projects');
  };

  // Dnešné udalosti pre Homescreen so zárukou unikátnych kľúčov
  const todayString = new Date().toISOString().split('T')[0];
  const todayEvents = useMemo(() => {
    const seen = new Set<string>();
    return calendarEvents.filter((e) => {
      if (!e || e.date !== todayString) return false;
      const key = e.id || `${e.title}-${e.startTime}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [calendarEvents, todayString]);

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
      {/* 60-MINÚTOVÝ AUTO-LOGOUT GUARD (GDPR & ZDRAVOTNÍCKA BEZPEČNOSŤ V AMBULANCII) */}
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
      <header className="bg-white/95 backdrop-blur-md border-b border-[#E8E2D9] sticky top-0 z-40 print:hidden">
        <div className={`${containerClass} py-3 flex flex-col md:flex-row justify-between items-center gap-4`}>
          
          {/* LOGO (KLIKNUTIE PRESMERUJE NA HOMESCREEN) */}
          <div className="flex items-center cursor-pointer group" onClick={() => changeTab('home')}>
            <img 
              src="/logo.png" 
              alt="SAY BY MRAZ" 
              className="h-14 md:h-15 w-auto object-contain transition-transform group-hover:scale-[1.02]" 
            />
          </div>

          {/* 5 PRIAMYCH PILIEROV S VEKTOROVÝMI IKONAMI */}
          <nav className="flex flex-wrap items-center gap-1.5 text-[11px] tracking-wider">
            {NAVIGATION_PILLARS.map((pillar) => {
              const hasAccess = pillar.tabs.some(tabId => PermissionsService.canUserAccessTab(currentUser, tabId));
              if (!hasAccess) return null;

              const isPillarActive = pillar.tabs.includes(activeTab);

              const targetTab: TabId = pillar.id === 'operations'
                ? (['inventory', 'cosmetics'].includes(activeTab) ? activeTab : 'inventory')
                : pillar.id === 'management'
                ? (['finance', 'projects'].includes(activeTab) ? activeTab : 'finance')
                : pillar.id === 'patients'
                ? (['patients', 'generator', 'aesthetics', 'prescriptions'].includes(activeTab) ? activeTab : 'patients')
                : pillar.id === 'calendar'
                ? 'calendar'
                : 'home';

              const PillarIcon =
                pillar.id === 'home'
                  ? LayoutDashboard
                  : pillar.id === 'patients'
                  ? FolderOpen
                  : pillar.id === 'calendar'
                  ? CalendarIcon
                  : pillar.id === 'operations'
                  ? Boxes
                  : Briefcase;

              return (
                <button
                  key={pillar.id}
                  onClick={() => changeTab(targetTab)}
                  className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 border ${
                    isPillarActive
                      ? 'bg-[#2C2A29] text-white border-[#2C2A29] font-bold shadow-2xs'
                      : 'bg-transparent hover:bg-[#FAF8F5] text-[#2C2A29] border-transparent hover:border-[#E8E2D9] font-semibold'
                  }`}
                  title={pillar.description}
                >
                  <PillarIcon className={`w-3.5 h-3.5 ${isPillarActive ? 'text-[#C5A059]' : 'text-[#8C857B]'}`} />
                  <span className="uppercase text-[11px] tracking-[0.12em]">{pillar.label}</span>
                  {isPillarActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] ml-0.5"></span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* KOMPAKTNÉ PROFILOVÉ A ADMINISTRÁTORSKÉ MENU */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu((prev) => !prev)}
              className="flex items-center gap-3 px-2.5 py-1.5 rounded-2xl border border-transparent hover:border-[#E8E2D9] hover:bg-[#FAF8F5] transition-all cursor-pointer group"
              title="Účet používateľa, Google Workspace a správa kliniky"
            >
              <div className="relative w-9 h-9 rounded-full border border-[#C5A059]/70 p-0.5 bg-white flex items-center justify-center flex-shrink-0">
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
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                    isGoogleConnected ? 'bg-emerald-500' : 'bg-amber-400'
                  }`}
                  title={isGoogleConnected ? 'Google Workspace pripojený' : 'Google Workspace nepripojený'}
                />
              </div>

              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-[#2C2A29] leading-tight">{currentUser.name}</p>
                <p className="text-[9px] uppercase tracking-[0.15em] text-[#C5A059] font-semibold mt-0.5">
                  {currentUser.title || (currentUser.role === 'ceo' ? 'CEO & Primár' : currentUser.role === 'doctor' ? 'Lekár' : currentUser.role === 'manager' ? 'Manažment' : 'Sestra')}
                </p>
              </div>

              <ChevronDown className={`w-3.5 h-3.5 text-[#8C857B] transition-transform duration-200 ${showUserMenu ? 'rotate-180 text-[#C5A059]' : ''}`} />
            </button>

            {/* ROZBAĽOVACÍ PANEL POUŽÍVATEĽA A SPRÁVY KLINIKY */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white/98 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(44,42,41,0.14)] border border-[#E8E2D9] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2.5 border-b border-[#E8E2D9]/80">
                  <p className="text-xs font-bold text-[#2C2A29]">{currentUser.name}</p>
                  <p className="text-[11px] text-[#8C857B] truncate">{currentUser.email}</p>
                </div>

                <div className="py-1.5 space-y-0.5">
                  {/* GOOGLE WORKSPACE / DRIVE */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      handleGoogleConnectToggle();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#2C2A29] hover:bg-[#FAF8F5] flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Cloud className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Google Drive & Kalendár</span>
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isGoogleConnected
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {isGoogleConnected ? 'Pripojené' : 'Pripojiť'}
                    </span>
                  </button>

                  {/* SPRÁVA OPRÁVNENÍ A TÍMU (CEO & MANAŽMENT) */}
                  {(isRealCeo || currentUser.role === 'manager') && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowRolePermissionsModal(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#2C2A29] hover:bg-[#FAF8F5] flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Oprávnenia & Tím kliniky</span>
                    </button>
                  )}

                  {/* GDPR AUDIT LOG (CEO & MANAŽMENT) */}
                  {(isRealCeo || currentUser.role === 'manager') && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowAuditLogModal(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#2C2A29] hover:bg-[#FAF8F5] flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>GDPR Auditná stopa</span>
                    </button>
                  )}

                  {/* ZMENA HESLA A PIN STANICE */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowChangePasswordModal(true);
                      setPasswordChangeStatus(null);
                      setOldPassword('');
                      setNewPassword('');
                      setConfirmNewPassword('');
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#2C2A29] hover:bg-[#FAF8F5] flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Zmena hesla & PIN stanice</span>
                  </button>
                </div>

                <div className="pt-1.5 border-t border-[#E8E2D9]/80">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-rose-600 hover:bg-rose-50/70 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Odhlásiť sa zo systému</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* PERSISTENTNÁ LIŠTA ROZPRACOVANÉHO PACIENTA (PRE CELÝ KLINICKÝ SYSTÉM) */}
      <ActivePatientBar
        activePatient={activePatient}
        allPatients={patients}
        currentTab={activeTab}
        currentUser={currentUser}
        containerClassName={containerClass}
        onNavigateToTab={(tab, extra) => {
          if (extra?.folder && activePatient) {
            setSelectedPatientForFolder(activePatient);
            setPatientActiveFolder(extra.folder);
          }
          if (extra?.initialDocType && activePatient) {
            setSelectedPatient({
              name: activePatient.name,
              birthNumber: activePatient.birthNumber,
              phone: activePatient.phone,
              email: activePatient.email,
              address: activePatient.address,
              insurance: activePatient.insurance,
              initialDocType: extra.initialDocType
            });
          }
          changeTab(tab);
        }}
        onSelectPatient={(p) => handleSetActivePatient(p)}
        onClearActivePatient={() => handleSetActivePatient(null)}
      />

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

            {/* ZÁLOŽKY: HESLO ÚČTU vs. OSOBNÝ PIN STANICE */}
            <div className="px-6 pt-3 flex gap-2 border-b border-[#E8E2D9]">
              <button
                type="button"
                onClick={() => {
                  setSecurityModalTab('password');
                  setPasswordChangeStatus(null);
                  setPinChangeStatus(null);
                }}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  securityModalTab === 'password'
                    ? 'border-[#C5A059] text-[#2C2A29]'
                    : 'border-transparent text-[#8C857B] hover:text-[#2C2A29]'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Heslo účtu</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSecurityModalTab('pin');
                  setPasswordChangeStatus(null);
                  setPinChangeStatus(null);
                }}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  securityModalTab === 'pin'
                    ? 'border-[#C5A059] text-[#2C2A29]'
                    : 'border-transparent text-[#8C857B] hover:text-[#2C2A29]'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Osobný PIN stanice</span>
              </button>
            </div>

            {securityModalTab === 'password' ? (
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
                    className="flex-1 py-3 border border-[#E8E2D9] text-[#8C857B] hover:text-[#2C2A29] rounded-xl text-xs font-semibold hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    Zrušiť
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#2C2A29] hover:bg-[#C5A059] text-white rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer"
                  >
                    Uložiť nové heslo
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSaveNewPin} className="p-6 space-y-4">
                {/* INFO O STANICI */}
                <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-[#2C2A29]">
                    <span className="flex items-center gap-1.5">
                      <Monitor className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>{DevicePinService.getMachineName()}</span>
                    </span>
                    <span className="text-[10px] text-[#8C857B] font-mono bg-white px-2 py-0.5 rounded border border-[#E8E2D9]">
                      {DevicePinService.getMachineId()}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8C857B]">
                    Tento 4-miestny PIN je viazaný na toto konkrétne zariadenie pre rýchle 2FA overenie v ambulancii.
                  </p>
                </div>

                {pinChangeStatus && (
                  <div
                    className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
                      pinChangeStatus.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {pinChangeStatus.type === 'success' ? (
                      <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                    )}
                    <span>{pinChangeStatus.message}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#2C2A29] mb-1.5">
                    Nový 4-miestny PIN (číslice 0-9)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPin ? 'text' : 'password'}
                      required
                      maxLength={4}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="Napr. 4826"
                      className="w-full border border-[#E8E2D9] p-3 rounded-xl text-lg font-mono font-bold tracking-widest outline-none focus:border-[#C5A059] pr-10 text-center"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPin(!showNewPin)}
                      className="absolute right-3 top-3.5 text-[#8C857B] hover:text-[#2C2A29] cursor-pointer"
                    >
                      {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2C2A29] mb-1.5">
                    Potvrďte nový 4-miestny PIN
                  </label>
                  <input
                    type={showNewPin ? 'text' : 'password'}
                    required
                    maxLength={4}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={confirmNewPin}
                    onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="Zopakujte 4 číslice"
                    className="w-full border border-[#E8E2D9] p-3 rounded-xl text-lg font-mono font-bold tracking-widest outline-none focus:border-[#C5A059] text-center"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowChangePasswordModal(false)}
                    className="flex-1 py-3 border border-[#E8E2D9] text-[#8C857B] hover:text-[#2C2A29] rounded-xl text-xs font-semibold hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    Zrušiť
                  </button>
                  <button
                    type="submit"
                    disabled={newPin.length !== 4 || confirmNewPin.length !== 4}
                    className="flex-1 py-3 bg-[#2C2A29] hover:bg-[#C5A059] disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer"
                  >
                    Aktivovať PIN stanice
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* OBSAH */}
      <main className={`${containerClass} py-6 sm:py-8 flex-1 w-full`}>
        <>
          {/* HOMESCREEN (PREHĽAD KLINIKY) */}
            {activeTab === 'home' && (
              <div className="space-y-6">
                
                {/* BANNER A ŽIVÝ ČAS (VZDUŠNÝ EDITORIÁLOVÝ LUXUS) */}
                <div className="bg-white border border-[#E8E2D9]/80 rounded-2xl px-6 py-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-[0.2em]">Klinický prehľad</span>
                    </div>
                    <h2 className="font-brand text-2xl md:text-3xl font-light text-[#2C2A29] uppercase tracking-wider">
                      Dobrý deň, <span className="font-semibold">{currentUser.name}</span>
                    </h2>
                    <p className="text-xs text-[#8C857B] mt-1">
                      Vitajte v ambulantnom systéme SAY CLINIC. Tu je váš harmonogram a úlohy na dnešný deň.
                    </p>
                  </div>

                  {/* ŠTATISTICKÉ UKAZOVATELE S JEMNÝM PREDELOM */}
                  <div className="hidden xl:flex items-center gap-6 px-4">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold tracking-[0.14em] text-[#8C857B] block">Dnes na pláne</span>
                      <span className="font-brand text-xl font-bold text-[#2C2A29] tabular-nums">{todayEvents.length} {todayEvents.length === 1 ? 'zákrok' : 'výkonov'}</span>
                    </div>
                    <div className="h-7 w-px bg-[#E8E2D9]/80" />
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold tracking-[0.14em] text-[#8C857B] block">Kartotéka</span>
                      <span className="font-brand text-xl font-bold text-[#2C2A29] tabular-nums">{patients.length} pacientov</span>
                    </div>
                  </div>

                  {/* ŽIVÝ ČAS A DÁTUM (BEZRÁMOVÁ TYPOGRAFIA) */}
                  <div className="xl:pl-6 xl:border-l xl:border-[#E8E2D9]/80 text-right flex flex-col justify-center select-none">
                    <div className="flex items-start justify-end gap-1 tabular-nums leading-none">
                      <span className="font-brand text-3xl md:text-4xl font-light tracking-tight text-[#2C2A29]">
                        {currentTime
                          ? String(currentTime.getHours()).padStart(2, '0')
                          : '--'}
                      </span>
                      <span className="font-brand text-3xl md:text-4xl font-light text-[#C5A059] animate-pulse -mt-0.5">
                        :
                      </span>
                      <span className="font-brand text-3xl md:text-4xl font-semibold tracking-tight text-[#2C2A29]">
                        {currentTime
                          ? String(currentTime.getMinutes()).padStart(2, '0')
                          : '--'}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-[#C5A059] mt-1 ml-0.5 w-4 text-left">
                        {currentTime
                          ? String(currentTime.getSeconds()).padStart(2, '0')
                          : '--'}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8C857B]">
                        {currentTime
                          ? currentTime.toLocaleDateString('sk-SK', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })
                          : 'Načítavam...'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* OBSAH HOMESCREENU: 12 STĹPCOV PRE EFEKTÍVNE VYUŽITIE PLOCHY */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* STĹPEC 1: DNEŠNÍ KLIENTI (8 STĹPCOV NA VEĽKOM MONITORE) */}
                  <div className="lg:col-span-7 2xl:col-span-8 bg-white border border-[#E8E2D9]/80 rounded-2xl p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-[#E8E2D9]/70 pb-3.5">
                      <div>
                        <h3 className="font-brand text-lg font-bold text-[#2C2A29] uppercase tracking-wider">Dnešný harmonogram pacientov</h3>
                        <p className="text-[10px] text-[#8C857B] uppercase tracking-[0.14em] mt-0.5">Naplánované operácie a vyšetrenia na dnes</p>
                      </div>
                      <button 
                        onClick={() => changeTab('calendar')}
                        className="text-xs text-[#C5A059] hover:text-[#2C2A29] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Celý kalendár</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {todayEvents.length === 0 ? (
                        <div className="text-center py-12 text-[#8C857B] text-xs italic bg-[#FBF9F6]/60 rounded-xl border border-dashed border-[#E8E2D9]">
                          Na dnešný deň nie sú naplánované žiadne udalosti v kalendári.
                        </div>
                      ) : (
                        <div className={`grid gap-3 ${todayEvents.length > 1 ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
                          {todayEvents.map((evt, idx) => (
                            <div 
                              key={`${evt.id || 'today-evt'}-${idx}`} 
                              onClick={() => handleOpenPatientFromCalendar(evt.patientId || '')}
                              className="p-3.5 border border-[#E8E2D9]/80 hover:border-[#C5A059] rounded-xl flex justify-between items-center bg-[#FBF9F6]/50 hover:bg-white transition-all cursor-pointer group"
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className="border-r border-[#E8E2D9] pr-3.5 text-right font-mono min-w-[64px] shrink-0">
                                  <span className="text-xs font-bold text-[#2C2A29] block">{evt.startTime}</span>
                                  <span className="text-[10px] text-[#C5A059] block">{evt.endTime}</span>
                                </div>
                                <div className="min-w-0">
                                  <span className="text-[9px] uppercase font-bold tracking-wider text-[#C5A059] block">
                                    {evt.type ? evt.type.replace('_', ' ') : 'ZÁKROK'}
                                  </span>
                                  <h4 className="font-bold text-sm text-[#2C2A29] group-hover:text-[#C5A059] transition-colors truncate">
                                    {evt.title}
                                  </h4>
                                  <p className="text-xs text-[#8C857B] truncate">{evt.patientName} · {evt.doctorName}</p>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-[#8C857B] group-hover:text-[#C5A059] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* STĹPEC 2: RÝCHLE POZNÁMKY & AKCIE (4 STĹPCE NA VEĽKOM MONITORE) */}
                  <div className="lg:col-span-5 2xl:col-span-4 space-y-6">
                    
                    {/* RÝCHLE AKCIE (VEKTOROVÁ IKONOGRAFIA & JEMNÉ LINKY) */}
                    <div className="bg-white border border-[#E8E2D9]/80 rounded-2xl p-5 space-y-3">
                      <h3 className="font-brand text-sm font-bold text-[#2C2A29] uppercase tracking-wider border-b border-[#E8E2D9]/70 pb-2.5">
                        Rýchle Akcie
                      </h3>
                      <div className="divide-y divide-[#E8E2D9]/60 text-xs">
                        {PermissionsService.canUserAccessTab(currentUser, 'patients') && (
                          <button 
                            onClick={() => { setSelectedPatientForFolder(null); changeTab('patients'); }}
                            className="w-full py-2.5 px-2 hover:bg-[#FAF8F5] rounded-lg text-left font-semibold text-[#2C2A29] transition-all flex items-center justify-between cursor-pointer group"
                          >
                            <span className="flex items-center gap-2.5">
                              <FolderOpen className="w-4 h-4 text-[#C5A059]" />
                              <span>Kartotéka pacientov 360°</span>
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-[#8C857B] group-hover:text-[#C5A059] group-hover:translate-x-0.5 transition-all" />
                          </button>
                        )}
                        {PermissionsService.canUserAccessTab(currentUser, 'patients') && (
                          <button 
                            onClick={() => { 
                              setSelectedPatientForFolder(null); 
                              changeTab('patients'); 
                            }}
                            className="w-full py-2.5 px-2 hover:bg-[#FAF8F5] rounded-lg text-left font-semibold text-[#2C2A29] transition-all flex items-center justify-between cursor-pointer group"
                          >
                            <span className="flex items-center gap-2.5">
                              <UserPlus className="w-4 h-4 text-[#C5A059]" />
                              <span>Zaevidovať nového pacienta</span>
                            </span>
                            <Plus className="w-3.5 h-3.5 text-[#8C857B] group-hover:text-[#2C2A29]" />
                          </button>
                        )}
                        {PermissionsService.canUserAccessTab(currentUser, 'calendar') && (
                          <button 
                            onClick={() => changeTab('calendar')}
                            className="w-full py-2.5 px-2 hover:bg-[#FAF8F5] rounded-lg text-left font-semibold text-[#2C2A29] transition-all flex items-center justify-between cursor-pointer group"
                          >
                            <span className="flex items-center gap-2.5">
                              <CalendarIcon className="w-4 h-4 text-[#C5A059]" />
                              <span>Kalendár operačných sál</span>
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-[#8C857B] group-hover:text-[#C5A059] group-hover:translate-x-0.5 transition-all" />
                          </button>
                        )}
                        {PermissionsService.canUserAccessTab(currentUser, 'inventory') && (
                          <button 
                            onClick={() => changeTab('inventory')}
                            className="w-full py-2.5 px-2 hover:bg-[#FAF8F5] rounded-lg text-left font-semibold text-[#2C2A29] transition-all flex items-center justify-between cursor-pointer group"
                          >
                            <span className="flex items-center gap-2.5">
                              <Boxes className="w-4 h-4 text-[#C5A059]" />
                              <span>Sklad materiálu & Implantáty</span>
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-[#8C857B] group-hover:text-[#C5A059] group-hover:translate-x-0.5 transition-all" />
                          </button>
                        )}
                        {PermissionsService.canUserAccessTab(currentUser, 'projects') && (
                          <button 
                            onClick={() => changeTab('projects')}
                            className="w-full py-2.5 px-2 hover:bg-[#FAF8F5] rounded-lg text-left font-semibold text-[#2C2A29] transition-all flex items-center justify-between cursor-pointer group"
                          >
                            <span className="flex items-center gap-2.5">
                              <Briefcase className="w-4 h-4 text-[#C5A059]" />
                              <span>Projekty & Smernice kliniky</span>
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-[#8C857B] group-hover:text-[#C5A059] group-hover:translate-x-0.5 transition-all" />
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

            {/* KLINICKÝ PILIER: JEDNOTNÁ 4-DIELNA PODNAVIGÁCIA (KARTOTÉKA 360°, ZÁZNAM, ESTETIKA, RECEPTY) */}
            {(['patients', 'generator', 'aesthetics', 'prescriptions'] as TabId[]).includes(activeTab) && (
              <div className="space-y-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 border-b border-[#E8E2D9]/80 pb-4 print:hidden">
                  <div>
                    <h2 className="font-brand text-2xl font-bold text-[#2C2A29] uppercase tracking-wider">
                      Klinika & Kartotéka
                    </h2>
                    <p className="text-xs text-[#8C857B]">
                      {activePatient
                        ? `Aktívna karta: ${activePatient.name} (RČ: ${activePatient.birthNumber})`
                        : 'Komplexná zdravotná dokumentácia, operačné protokoly, estetická mapa a recepty'}
                    </p>
                  </div>

                  {/* JEDNOTNÝ 4-DIELNY KLINICKÝ PREPÍNAČ */}
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl">
                    {PermissionsService.canUserAccessTab(currentUser, 'patients') && (
                      <button
                        type="button"
                        onClick={() => changeTab('patients')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                          activeTab === 'patients'
                            ? 'bg-[#2C2A29] text-white shadow-2xs'
                            : 'text-[#8C857B] hover:text-[#2C2A29]'
                        }`}
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Kartotéka 360°</span>
                      </button>
                    )}
                    {PermissionsService.canUserAccessTab(currentUser, 'generator') && (
                      <button
                        type="button"
                        onClick={() => changeTab('generator')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                          activeTab === 'generator'
                            ? 'bg-[#2C2A29] text-white shadow-2xs'
                            : 'text-[#8C857B] hover:text-[#2C2A29]'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Záznam & Protokol</span>
                      </button>
                    )}
                    {PermissionsService.canUserAccessTab(currentUser, 'aesthetics') && (
                      <button
                        type="button"
                        onClick={() => changeTab('aesthetics')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                          activeTab === 'aesthetics'
                            ? 'bg-[#2C2A29] text-white shadow-2xs'
                            : 'text-[#8C857B] hover:text-[#2C2A29]'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Estetická mapa</span>
                      </button>
                    )}
                    {PermissionsService.canUserAccessTab(currentUser, 'prescriptions') && (
                      <button
                        type="button"
                        onClick={() => changeTab('prescriptions')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                          activeTab === 'prescriptions'
                            ? 'bg-[#2C2A29] text-white shadow-2xs'
                            : 'text-[#8C857B] hover:text-[#2C2A29]'
                        }`}
                      >
                        <Pill className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Recepty Rp.</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 1. KARTOTÉKA PACIENTOV */}
                {activeTab === 'patients' && (
                  <PatientDatabase 
                    onNavigateToGenerator={handleNavigateToGenerator} 
                    onNavigateToPrescriptions={(patient) => {
                      handleSetActivePatient(patient);
                      changeTab('prescriptions');
                    }}
                    onNavigateToAesthetics={(patient) => {
                      handleSetActivePatient(patient);
                      changeTab('aesthetics');
                    }}
                    onNavigateToCosmetics={(patient, prefillItems) => {
                      if (patient) {
                        handleSetActivePatient(patient);
                      }
                      if (prefillItems) {
                        setPosPrefillItems(prefillItems);
                      }
                      changeTab('cosmetics');
                    }}
                    initialPatient={activePatient || selectedPatientForFolder}
                    initialFolder={patientActiveFolder}
                    activePatient={activePatient}
                    onSetActivePatient={handleSetActivePatient}
                    onPatientsUpdated={(updatedList) => {
                      setPatients(updatedList);
                      if (activePatient) {
                        const updatedActive = updatedList.find(p => p.id === activePatient.id);
                        if (updatedActive) {
                          handleSetActivePatient(updatedActive);
                        }
                      }
                    }}
                    calendarEvents={calendarEvents}
                    onAddCalendarEvent={handleAddCalendarEvent}
                    onNavigateToCalendar={() => changeTab('calendar')}
                    currentUser={currentUser}
                  />
                )}

                {/* 2. GENERÁTOR DOKUMENTOV (SPRÁVY & NÁLEZY) */}
                {activeTab === 'generator' && (
                  <MedicalRecordForm 
                    onRecordCreated={handleAddSale} 
                    initialPatient={selectedPatient || (activePatient ? {
                      id: activePatient.id,
                      name: activePatient.name,
                      birthNumber: activePatient.birthNumber,
                      phone: activePatient.phone,
                      email: activePatient.email,
                      address: activePatient.address,
                      insurance: activePatient.insurance
                    } : null)}
                    allPatients={patients}
                    onSelectPatient={(foundPatient) => {
                      if (foundPatient && foundPatient.id) {
                        handleSetActivePatient(foundPatient);
                      }
                    }}
                    onNavigateToPatient={(pId) => {
                      const found = patients.find(p => p.id === pId || (selectedPatient && p.birthNumber === selectedPatient.birthNumber));
                      if (found) {
                        handleSetActivePatient(found);
                      }
                      changeTab('patients');
                    }}
                  />
                )}

                {/* 3. ESTETICKÁ MEDICÍNA & FACE MAPPING */}
                {activeTab === 'aesthetics' && PermissionsService.canUserAccessTab(currentUser, 'aesthetics') && (
                  <AestheticsModule 
                    patients={patients}
                    selectedPatientId={activePatient?.id || selectedPatientForFolder?.id || (patients.length > 0 ? patients[0].id : undefined)}
                    onSelectPatient={(id) => {
                      const p = patients.find(pat => pat.id === id);
                      if (p) handleSetActivePatient(p);
                    }}
                    onOpenPatientFolder={(patient) => {
                      handleSetActivePatient(patient);
                      changeTab('patients');
                    }}
                    onSessionCompleted={handleAddSale}
                  />
                )}

                {/* 4. LEKÁRSKE RECEPTY ŠEVT 14 282 2s */}
                {activeTab === 'prescriptions' && PermissionsService.canUserAccessTab(currentUser, 'prescriptions') && (
                  <PrescriptionModule
                    initialPatient={activePatient || selectedPatientForFolder || (selectedPatient ? {
                      name: selectedPatient.name,
                      birthNumber: selectedPatient.birthNumber || '',
                      address: selectedPatient.address || '',
                      insurance: selectedPatient.insurance || 'Samoplatca'
                    } : undefined)}
                  />
                )}
              </div>
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

            {/* PREVÁDZKA: SKLAD & POKLADŇA */}
            {(activeTab === 'inventory' || activeTab === 'cosmetics') && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#E8E2D9]/80 pb-4">
                  <div>
                    <h2 className="font-brand text-2xl font-bold text-[#2C2A29] uppercase tracking-wider">
                      Prevádzka & Logistika
                    </h2>
                    <p className="text-xs text-[#8C857B]">
                      Sklad materiálu, implantáty Motiva a pokladňa POS pre pultový predaj
                    </p>
                  </div>
                  
                  {/* PREPÍNAČ MEDZI SKLADOM A POKLADŇOU (VEKTOROVÉ IKONY) */}
                  <div className="flex items-center gap-1 p-1 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl">
                    {PermissionsService.canUserAccessTab(currentUser, 'inventory') && (
                      <button
                        type="button"
                        onClick={() => changeTab('inventory')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                          activeTab === 'inventory'
                            ? 'bg-[#2C2A29] text-white shadow-2xs'
                            : 'text-[#8C857B] hover:text-[#2C2A29]'
                        }`}
                      >
                        <Boxes className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Sklad & Materiál</span>
                      </button>
                    )}
                    {PermissionsService.canUserAccessTab(currentUser, 'cosmetics') && (
                      <button
                        type="button"
                        onClick={() => changeTab('cosmetics')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                          activeTab === 'cosmetics'
                            ? 'bg-[#2C2A29] text-white shadow-2xs'
                            : 'text-[#8C857B] hover:text-[#2C2A29]'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Pokladňa POS</span>
                      </button>
                    )}
                  </div>
                </div>

                {activeTab === 'inventory' && <InventoryCRM />}
                {activeTab === 'cosmetics' && (
                  <CosmeticsPOSModule 
                    patients={patients}
                    onSaleCompleted={handleAddSale}
                    initialSelectedPatientId={activePatient?.id || posSelectedPatientId}
                    onSelectPatient={(patientId) => {
                      const p = patients.find(pat => pat.id === patientId) || null;
                      handleSetActivePatient(p);
                    }}
                    initialPrefillItems={posPrefillItems}
                  />
                )}
              </div>
            )}

            {/* MANAŽMENT: FINANCIE & PROJEKTY */}
            {(activeTab === 'finance' || activeTab === 'projects') && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#E8E2D9]/80 pb-4">
                  <div>
                    <h2 className="font-brand text-2xl font-bold text-[#2C2A29] uppercase tracking-wider">
                      Manažment & Financie
                    </h2>
                    <p className="text-xs text-[#8C857B]">
                      Finančné riadenie kliniky, P&L výkaz, faktúry a operatívne projekty tímu
                    </p>
                  </div>
                  
                  {/* PREPÍNAČ MEDZI FINANCIAMI A PROJEKTAMI (VEKTOROVÉ IKONY) */}
                  <div className="flex items-center gap-1 p-1 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl">
                    {PermissionsService.canUserAccessTab(currentUser, 'finance') && (
                      <button
                        type="button"
                        onClick={() => changeTab('finance')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                          activeTab === 'finance'
                            ? 'bg-[#2C2A29] text-white shadow-2xs'
                            : 'text-[#8C857B] hover:text-[#2C2A29]'
                        }`}
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Finančné výsledky</span>
                      </button>
                    )}
                    {PermissionsService.canUserAccessTab(currentUser, 'projects') && (
                      <button
                        type="button"
                        onClick={() => changeTab('projects')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                          activeTab === 'projects'
                            ? 'bg-[#2C2A29] text-white shadow-2xs'
                            : 'text-[#8C857B] hover:text-[#2C2A29]'
                        }`}
                      >
                        <Briefcase className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Projekty & Úlohy</span>
                      </button>
                    )}
                  </div>
                </div>

                {activeTab === 'finance' && (
                  <FinanceCRM 
                    sales={sales} 
                    calendarEvents={calendarEvents}
                    patients={patients}
                    currentUser={currentUser}
                  />
                )}
                {activeTab === 'projects' && (
                  <ProjectManagement 
                    currentUser={currentUser}
                  />
                )}
              </div>
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