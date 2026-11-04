'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  Plus,
  SlidersHorizontal,
  Tag,
  Search,
  ChevronLeft,
  UserCheck,
  RefreshCw,
  Flame,
  Activity,
  Clock,
  Copy,
  CheckCircle2,
  Stethoscope,
  Syringe,
  FileSpreadsheet,
  Layers,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { 
  getSurgeryReadinessSummary, 
  getAnesthesiaInfo, 
  getClinicStayInfo, 
  EVENT_STATUS_OPTIONS, 
  EventAttendanceStatus, 
  getEventStatusInfo 
} from '../data/calendarConfig';
import { 
  fetchGoogleCalendarEvents, 
  mergeCalendarEvents 
} from '../services/calendarSyncService';
import { matchesQuery } from '../utils/fuzzySearch';
import { DevicePinService } from '../services/devicePinService';
import MedicalRecordForm from '../components/MedicalRecordForm';
import PatientDatabase, { Patient, MOCK_PATIENTS } from '../components/PatientDatabase';
import { PatientCloudService } from '../services/patientCloudService';
import ActivePatientBar from '../components/ActivePatientBar';
import LoginForm, { UserAccount } from '../components/LoginForm';
import { LiquidAvatar } from '../components/LiquidAvatar';
import FinanceCRM from '../components/FinanceCRM';
import Calendar, { CalendarEvent, getRoomInfo } from '../components/Calendar';
import InventoryCRM from '../components/InventoryCRM';
import { AestheticsModule } from '../components/AestheticsModule';
import { CosmeticsPOSModule } from '../components/CosmeticsPOSModule';
import ProjectManagement from '../components/ProjectManagement';
import ClinicPriceListManagement from '../components/ClinicPriceListManagement';
import OperativeNotesWidget from '../components/OperativeNotesWidget';
import RolePermissionsModal from '../components/RolePermissionsModal';
import AutoLogoutGuard from '../components/AutoLogoutGuard';
import AuditLogModal from '../components/AuditLogModal';
import GoogleDriveModal from '../components/GoogleDriveModal';
import QuickActionsCustomizeModal from '../components/QuickActionsCustomizeModal';
import { 
  QUICK_ACTIONS_CATALOG, 
  QuickActionItem, 
  UserQuickActionPreference, 
  getUserQuickActionPreferences 
} from '../data/quickActionsCatalog';
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

export interface ScheduleRoomTab {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
}

const SCHEDULE_ROOM_TABS: ScheduleRoomTab[] = [
  { id: 'all', label: 'Všetky', shortLabel: 'Všetky', icon: '🌐' },
  { id: 'ambulancia', label: 'Ambulancia', shortLabel: 'Ambulancia', icon: '🩺' },
  { id: 'operacky_all', label: 'Operačky', shortLabel: 'Operačky', icon: '🏥' },
  { id: 'sala_say', label: 'Sála SAY', shortLabel: 'Sála SAY', icon: '✨' },
  { id: 'sala_rudlova', label: 'Rudlová', shortLabel: 'Rudlová', icon: '🏛️' },
  { id: 'dospavacia_izba', label: 'Dospávanie', shortLabel: 'Dospávanie', icon: '🛏️' },
];

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
  const [showGoogleDriveModal, setShowGoogleDriveModal] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [googleAuthNotice, setGoogleAuthNotice] = useState<string | null>(null);
  const [permissionsVersion, setPermissionsVersion] = useState(0);
  const [simulatedRole, setSimulatedRole] = useState<RoleType | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [logoutNotice, setLogoutNotice] = useState<string | null>(null);

  // Stav pre prispôsobiteľné rýchle akcie používateľa
  const [showQuickActionsModal, setShowQuickActionsModal] = useState(false);
  const [userQuickActions, setUserQuickActions] = useState<UserQuickActionPreference[]>([]);

  // Načítanie osobných preferencií rýchlych akcií pre prihláseného používateľa
  useEffect(() => {
    if (currentUser) {
      const prefs = getUserQuickActionPreferences(currentUser.id, currentUser.role);
      setUserQuickActions(prefs);
    }
  }, [currentUser?.id, currentUser?.role]);

  // Dynamicky aktívne akcie vyfiltrované podľa aktuálnych oprávnení
  const activeUserQuickActions = useMemo(() => {
    if (!currentUser) return [];
    const map = new Map<string, QuickActionItem>();
    QUICK_ACTIONS_CATALOG.forEach(item => {
      if (PermissionsService.canUserAccessTab(currentUser, item.tabId)) {
        map.set(item.id, item);
      }
    });

    return userQuickActions
      .filter(pref => pref.enabled && map.has(pref.id))
      .map(pref => map.get(pref.id)!);
  }, [currentUser, userQuickActions, permissionsVersion]);

  const handleQuickActionClick = (action: QuickActionItem) => {
    if (action.actionType === 'new_patient') {
      setSelectedPatientForFolder(null);
      changeTab('patients');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('say_open_add_patient_modal'));
      }, 60);
      return;
    }
    if (action.actionType === 'new_calendar_event') {
      changeTab('calendar');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('say_open_add_calendar_event', { detail: { date: effectiveScheduleDate } }));
      }, 60);
      return;
    }
    changeTab(action.tabId);
  };

  const renderQuickActionIcon = (iconName: string) => {
    const iconClass = "w-4 h-4 text-[#C5A059]";
    switch (iconName) {
      case 'FolderOpen': return <FolderOpen className={iconClass} />;
      case 'UserPlus': return <UserPlus className={iconClass} />;
      case 'Calendar': return <CalendarIcon className={iconClass} />;
      case 'FileText': return <FileText className={iconClass} />;
      case 'Pill': return <Pill className={iconClass} />;
      case 'Sparkles': return <Sparkles className={iconClass} />;
      case 'ShoppingBag': return <ShoppingBag className={iconClass} />;
      case 'Boxes': return <Boxes className={iconClass} />;
      case 'BarChart3': return <BarChart3 className={iconClass} />;
      case 'Briefcase': return <Briefcase className={iconClass} />;
      default: return <Sparkles className={iconClass} />;
    }
  };

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

  // 1. ZACHOVANIE AKTÍVNEHO PRIHLÁSENIA LEKÁRA AJ PO OBNOVENÍ STRÁNKY (F5 / REFRESH) & SANITIZÁCIA CACHE
  useEffect(() => {
    setIsMounted(true);

    // JEDNORAZOVÉ DÔKLADNÉ VYČISTENIE MOCK ÚDAJOV Z LOKÁLNEJ CACHE PREHLIADAČA
    try {
      const cleanupVersionKey = 'say_clinic_mock_purged_v2';
      if (typeof window !== 'undefined' && !localStorage.getItem(cleanupVersionKey)) {
        // 1. Pacienti
        const rawPatients = localStorage.getItem('say_clinic_patients');
        if (rawPatients) {
          const parsed = JSON.parse(rawPatients);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter((p: any) => p && !['P1', 'P2', 'P3'].includes(p.id));
            localStorage.setItem('say_clinic_patients', JSON.stringify(cleaned));
          }
        }
        // 2. Zdravotné záznamy
        const rawRecords = localStorage.getItem('say_clinic_patient_records');
        if (rawRecords) {
          const parsed = JSON.parse(rawRecords);
          if (parsed && typeof parsed === 'object') {
            delete parsed['P1'];
            delete parsed['P2'];
            delete parsed['P3'];
            localStorage.setItem('say_clinic_patient_records', JSON.stringify(parsed));
          }
        }
        // 3. Plány pacientov
        const rawPlans = localStorage.getItem('say_clinic_patient_plans');
        if (rawPlans) {
          const parsed = JSON.parse(rawPlans);
          if (parsed && typeof parsed === 'object') {
            delete parsed['P1'];
            delete parsed['P2'];
            delete parsed['P3'];
            for (const [pId, pList] of Object.entries(parsed)) {
              if (Array.isArray(pList)) {
                const seen = new Set<string>();
                parsed[pId] = pList.filter((p: any) => {
                  if (!p || !p.id || seen.has(p.id)) return false;
                  seen.add(p.id);
                  return true;
                });
              }
            }
            localStorage.setItem('say_clinic_patient_plans', JSON.stringify(parsed));
          }
        }
        // 4. Meicet reporty
        const rawMeicet = localStorage.getItem('say_clinic_meicet_reports');
        if (rawMeicet) {
          const parsed = JSON.parse(rawMeicet);
          if (parsed && typeof parsed === 'object') {
            delete parsed['P1'];
            delete parsed['P2'];
            delete parsed['P3'];
            localStorage.setItem('say_clinic_meicet_reports', JSON.stringify(parsed));
          }
        }
        // 5. Opiátová kniha & spotreba
        const rawOplLogs = localStorage.getItem('say_clinic_opiate_book_logs_v1');
        if (rawOplLogs) {
          const parsed = JSON.parse(rawOplLogs);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter((l: any) => l && !['P1', 'P2', 'P3'].includes(l.patientId) && !l.id?.startsWith('opl-log-'));
            localStorage.setItem('say_clinic_opiate_book_logs_v1', JSON.stringify(cleaned));
          }
        }
        const rawUsageLogs = localStorage.getItem('say_clinic_material_usage_logs_v2');
        if (rawUsageLogs) {
          const parsed = JSON.parse(rawUsageLogs);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter((l: any) => l && !['P1', 'P2', 'P3'].includes(l.patientId) && !l.id?.startsWith('log-init-'));
            localStorage.setItem('say_clinic_material_usage_logs_v2', JSON.stringify(cleaned));
          }
        }
        // 6. Skladové položky sa nepremazávajú - uchovávajú sa položky z cenníka
        // (predchádzajúce fiktívne položky boli vyčistené)
        // 7. Aktívny rozpracovaný pacient
        const rawActive = localStorage.getItem('say_clinic_active_patient_session_v1');
        if (rawActive) {
          const parsed = JSON.parse(rawActive);
          if (parsed && ['P1', 'P2', 'P3'].includes(parsed.id)) {
            localStorage.removeItem('say_clinic_active_patient_session_v1');
          }
        }
        localStorage.setItem(cleanupVersionKey, 'true');
      }
    } catch (cleanErr) {
      console.warn('Čistenie starej lokálnej cache:', cleanErr);
    }

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

  // Dynamická predvolená záložka podľa oprávnení prihláseného profilu
  const getFallbackTab = useCallback((user: UserAccount | null): TabType => {
    if (!user) return 'home';
    if (PermissionsService.canUserAccessTab(user, 'home')) return 'home';
    if (PermissionsService.canUserAccessTab(user, 'calendar')) return 'calendar';
    if (PermissionsService.canUserAccessTab(user, 'patients')) return 'patients';
    return 'calendar';
  }, []);

  // Ochrana prístupu k záložke: ak používateľ nemá právo na aktuálnu záložku, vráti ho na predvolenú povolenú záložku
  useEffect(() => {
    if (currentUser && !PermissionsService.canUserAccessTab(currentUser, activeTab as TabId)) {
      const fallback = getFallbackTab(currentUser);
      setActiveTab(fallback);
      window.history.replaceState({ tab: fallback }, '', `#${fallback}`);
    }
  }, [currentUser, activeTab, permissionsVersion, simulatedRole, getFallbackTab]);

  // 2. NAVIGÁCIA ŠÍPKAMI V PREHLIADAČI (POPSTATE LISTENER)
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '') as TabType;
      const validTabs: TabType[] = ['home', 'generator', 'patients', 'prescriptions', 'aesthetics', 'cosmetics', 'finance', 'calendar', 'inventory', 'projects', 'pricelist'];
      if (validTabs.includes(hash)) {
        if (currentUser && !PermissionsService.canUserAccessTab(currentUser, hash as TabId)) {
          const fallback = getFallbackTab(currentUser);
          setActiveTab(fallback);
        } else {
          setActiveTab(hash);
        }
      } else {
        const fallback = getFallbackTab(currentUser);
        setActiveTab(fallback);
      }
    };

    window.addEventListener('popstate', handlePopState);
    handlePopState(); // Načítanie pri prvom otvorení

    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser, permissionsVersion, simulatedRole, getFallbackTab]);

  // Funkcia pre prepínanie záložiek s zápisom do histórie prehliadača s overením oprávnenia
  const changeTab = (tab: TabType) => {
    if (currentUser && !PermissionsService.canUserAccessTab(currentUser, tab as TabId)) {
      const fallback = getFallbackTab(currentUser);
      setActiveTab(fallback);
      window.history.pushState({ tab: fallback }, '', `#${fallback}`);
      return;
    }
    setActiveTab(tab);
    window.history.pushState({ tab }, '', `#${tab}`);
  };

  // Skutočné pripojenie ku Google Drive / Kalendáru vyžaduje platný OAuth access token v pamäti
  const isGoogleConnected = Boolean(workspaceToken || (session as any)?.accessToken);
  const connectedGoogleEmail = workspaceGoogleUser?.email || session?.user?.email || null;

  const handleDirectGoogleSignIn = async () => {
    setIsConnectingGoogle(true);
    setGoogleAuthNotice(null);
    try {
      const res = await googleSignIn();
      if (res?.accessToken) {
        setExternalAccessToken(res.accessToken, res.user);
        setShowGoogleDriveModal(false);
      } else {
        const { getLastAuthError } = await import('../lib/workspaceAuth');
        const err = getLastAuthError();
        if (err) setGoogleAuthNotice(err);
        setShowGoogleDriveModal(true);
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setGoogleAuthNotice(err?.message || 'Prihlásenie do Google Drive sa nepodarilo dokončiť.');
        setShowGoogleDriveModal(true);
      }
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    const { googleLogout } = await import('../lib/workspaceAuth');
    await googleLogout();
    if (session) signOut({ redirect: false });
    setShowGoogleDriveModal(false);
  };

  const handleGoogleConnectToggle = async () => {
    setShowGoogleDriveModal(true);
  };

  const handleLoginSuccess = (user: UserAccount, rememberMe: boolean = true) => {
    setCurrentUser(user);
    AuthService.saveSession(user, rememberMe);
    if (!PermissionsService.canUserAccessTab(user, activeTab as TabId)) {
      const fallback = getFallbackTab(user);
      setActiveTab(fallback);
      window.history.replaceState({ tab: fallback }, '', `#${fallback}`);
    }
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

  // Načítanie pacientov a synchronizácia s Firestore Cloud
  useEffect(() => {
    const cached = PatientCloudService.getCachedPatients().filter(p => p && !['P1', 'P2', 'P3'].includes(p.id));
    if (cached.length > 0) {
      setPatients(cached);
    }

    const unsubscribe = PatientCloudService.subscribePatients((cloudPatients) => {
      const valid = (cloudPatients || []).filter(p => p && !['P1', 'P2', 'P3'].includes(p.id));
      setPatients(valid);
    });

    return () => unsubscribe();
  }, []);

  // Obnovenie rozpracovaného pacienta zo session storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('say_clinic_active_patient_session_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && !['P1', 'P2', 'P3'].includes(parsed.id)) {
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
        } else if (parsed && ['P1', 'P2', 'P3'].includes(parsed.id)) {
          localStorage.removeItem('say_clinic_active_patient_session_v1');
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
      if (Array.isArray(updated)) {
        const filtered = updated.filter((p: Patient) => p && !['P1', 'P2', 'P3'].includes(p.id));
        setPatients(filtered);
        setActivePatient((prev) => {
          if (!prev) return null;
          if (['P1', 'P2', 'P3'].includes(prev.id)) return null;
          const refreshed = filtered.find((p: Patient) => p.id === prev.id);
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

  const handleOpenPatientFromCalendar = useCallback((patientId: string, patientName?: string) => {
    let found = patients.find(p => p.id === patientId);
    if (!found && patientName) {
      found = patients.find(p => p.name.toLowerCase() === patientName.toLowerCase());
    }
    if (found) {
      handleSetActivePatient(found);
    }
    changeTab('patients');
  }, [patients]);

  const handleAddCalendarEvent = useCallback((newEvent: CalendarEvent) => {
    let updated: CalendarEvent[] = [];
    setCalendarEvents((prev) => {
      updated = dedupeEventsList([newEvent, ...prev]);
      return updated;
    });
    queueMicrotask(() => {
      localStorage.setItem('say_clinic_calendar_events', JSON.stringify(updated));
      RealtimeSyncService.publish('calendar_events', updated, currentUser?.id);
    });
  }, [currentUser?.id]);

  const handleCalendarEventsChange = useCallback((updated: CalendarEvent[]) => {
    setCalendarEvents(dedupeEventsList(updated));
  }, []);

  const handlePatientCreatedFromCalendar = useCallback((newPat: Patient) => {
    setPatients((prev) => (prev.some((p) => p.id === newPat.id) ? prev : [newPat, ...prev]));
  }, []);

  const handleCheckoutInPOSFromCalendar = useCallback((evt: CalendarEvent) => {
    const remaining = Math.max(0, (evt.totalPrice || 0) - (evt.isDepositPaid ? (evt.depositAmount || 0) : 0));
    const matchedPat = patients.find(
      (p) => p.id === evt.patientId || p.name.toLowerCase().trim() === (evt.patientName || '').toLowerCase().trim()
    );
    setPosSelectedPatientId(matchedPat?.id || evt.patientId || '');
    setPosPrefillItems([
      {
        name: `${evt.title}${evt.isDepositPaid && evt.depositAmount ? ` (doplatok po odpočítaní zálohy ${evt.depositAmount} €)` : ''}`,
        brand: 'SAY CLINIC',
        price: remaining,
        quantity: 1,
      },
    ]);
    changeTab('cosmetics');
  }, [patients]);

  const handleCreateMedicalDocumentFromCalendar = useCallback((evt: CalendarEvent) => {
    const matchedPat = patients.find(
      (p) => p.id === evt.patientId || p.name.toLowerCase().trim() === (evt.patientName || '').toLowerCase().trim()
    );
    handleNavigateToGenerator({
      id: matchedPat?.id || evt.patientId || `P-${Date.now()}`,
      name: evt.patientName || matchedPat?.name || 'Pacient',
      birthNumber: matchedPat?.birthNumber || evt.patientBirthNumber || '',
      phone: evt.patientPhone || matchedPat?.phone || '',
      email: evt.patientEmail || matchedPat?.email || '',
      address: matchedPat?.address || '',
      insurance: matchedPat?.insurance || 'Samoplatca',
      initialDocType: evt.type === 'operacia' ? 'operacny_protokol' : 'lekarska_sprava',
    });
  }, [patients]);

  useEffect(() => {
    const handleGlobalNav = (e: Event) => {
      const custom = e as CustomEvent<string>;
      if (custom.detail) {
        changeTab(custom.detail as any);
      }
    };
    window.addEventListener('say_navigate_tab', handleGlobalNav);
    return () => window.removeEventListener('say_navigate_tab', handleGlobalNav);
  }, []);

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

  // Filter miestností pre harmonogram na prehľade ('all' | 'ambulancia' | 'operacky_all' | 'sala_say' | 'sala_rudlova' | 'dospavacia_izba')
  const [todayRoomFilter, setTodayRoomFilter] = useState<string>('all');
  
  // Zvolený dátum harmonogramu (predvolene prázdny = dnešok)
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<string>('');
  
  // Filter len pre mojich pacientov
  const [onlyMyPatients, setOnlyMyPatients] = useState<boolean>(false);
  
  // Zobraziť stornované / zrušené termíny
  const [showCancelledSchedule, setShowCancelledSchedule] = useState<boolean>(false);
  
  // Rýchla notifikácia / toast
  const [scheduleToast, setScheduleToast] = useState<string | null>(null);
  const showScheduleToast = useCallback((msg: string) => {
    setScheduleToast(msg);
    setTimeout(() => setScheduleToast(null), 3500);
  }, []);

  // Spotlight vyhľadávanie pacienta v hlavičke
  const [spotlightQuery, setSpotlightQuery] = useState('');
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const spotlightRef = useRef<HTMLDivElement>(null);

  // Kontextové menu pravého kliknutia na kartu termínu v harmonograme
  const [eventContextMenu, setEventContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    event: CalendarEvent | null;
  }>({ isOpen: false, x: 0, y: 0, event: null });
  const eventContextMenuRef = useRef<HTMLDivElement>(null);

  // Zatvorenie kontextového menu udalosti pri kliknutí mimo alebo stlačení Escape
  useEffect(() => {
    if (!eventContextMenu.isOpen) return;
    const handleClose = () => setEventContextMenu((prev) => ({ ...prev, isOpen: false }));
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('mousedown', handleClose);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClose);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [eventContextMenu.isOpen]);

  // Zatvorenie spotlight vyhľadávača pri kliknutí mimo
  useEffect(() => {
    if (!isSpotlightOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (spotlightRef.current && !spotlightRef.current.contains(e.target as Node)) {
        setIsSpotlightOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isSpotlightOpen]);

  // Pomocná funkcia na posun dátumu
  const shiftDate = useCallback((dateStr: string, days: number): string => {
    try {
      const parts = dateStr.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      d.setDate(d.getDate() + days);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  }, []);

  // Pomocná funkcia na zistenie priradenej miestnosti udalosti
  const getEventRoomId = useCallback((evt: CalendarEvent): string => {
    if (evt.roomId) return evt.roomId;
    if (evt.type === 'operacia') return 'sala_say';
    return 'ambulancia';
  }, []);

  // Dnešný dátum v tvare YYYY-MM-DD synchronizovaný s hodinami
  const todayString = useMemo(() => {
    const d = currentTime || new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, [currentTime]);

  // Efektívny zvolený dátum pre harmonogram
  const effectiveScheduleDate = selectedScheduleDate || todayString;
  const isScheduleToday = effectiveScheduleDate === todayString;
  const isScheduleTomorrow = effectiveScheduleDate === shiftDate(todayString, 1);

  // Tichá synchronizácia Google Kalendára pri štarte na Prehľade
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [lastCalendarSyncTime, setLastCalendarSyncTime] = useState<string | null>(null);

  const triggerCalendarSync = useCallback(async (isSilent = false) => {
    setIsSyncingCalendar(true);
    try {
      const res = await fetchGoogleCalendarEvents(session);
      if (res && res.events) {
        let merged: CalendarEvent[] = [];
        setCalendarEvents((prev) => {
          merged = dedupeEventsList(mergeCalendarEvents(prev, res.events, res.successfulCalendarIds));
          return merged;
        });
        queueMicrotask(() => {
          localStorage.setItem('say_clinic_calendar_events', JSON.stringify(merged));
          RealtimeSyncService.publish('calendar_events', merged, currentUser?.id);
        });
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        setLastCalendarSyncTime(timeStr);
        if (!isSilent) {
          showScheduleToast(`Kalendár synchronizovaný (${timeStr})`);
        }
      } else if (!isSilent) {
        showScheduleToast('Kalendár je aktuálny');
      }
    } catch (err) {
      console.warn('Synchronizácia kalendára na Prehľade:', err);
      if (!isSilent) showScheduleToast('Chyba spojenia s kalendárom');
    } finally {
      setIsSyncingCalendar(false);
    }
  }, [session, currentUser?.id, showScheduleToast]);

  // Automatická synchronizácia pri pripojenom účte
  useEffect(() => {
    if (isMounted && isGoogleConnected) {
      triggerCalendarSync(true);
    }
  }, [isMounted, isGoogleConnected, triggerCalendarSync]);

  // Zmena stavu dochádzky termínu (Check-in)
  const handleUpdateEventStatus = useCallback((eventId: string, newStatus: EventAttendanceStatus) => {
    let updated: CalendarEvent[] = [];
    setCalendarEvents((prev) => {
      updated = prev.map((e) => {
        if (e.id === eventId) {
          const isCanc = newStatus === 'cancelled';
          return {
            ...e,
            status: newStatus,
            isCancelled: isCanc,
          };
        }
        return e;
      });
      return updated;
    });
    queueMicrotask(() => {
      localStorage.setItem('say_clinic_calendar_events', JSON.stringify(updated));
      RealtimeSyncService.publish('calendar_events', updated, currentUser?.id);
    });
    setEventContextMenu((prev) => ({ ...prev, isOpen: false }));
    const label = EVENT_STATUS_OPTIONS.find((s) => s.id === newStatus)?.label || newStatus;
    showScheduleToast(`Stav termínu zmenený: ${label}`);
  }, [currentUser?.id, showScheduleToast]);

  // Zrušenie / Storno termínu
  const handleToggleCancelEvent = useCallback((eventId: string) => {
    let updated: CalendarEvent[] = [];
    setCalendarEvents((prev) => {
      updated = prev.map((e) => {
        if (e.id === eventId) {
          const nextCancelled = !e.isCancelled;
          return {
            ...e,
            isCancelled: nextCancelled,
            status: nextCancelled ? ('cancelled' as EventAttendanceStatus) : ('planned' as EventAttendanceStatus),
          };
        }
        return e;
      });
      return updated;
    });
    queueMicrotask(() => {
      localStorage.setItem('say_clinic_calendar_events', JSON.stringify(updated));
      RealtimeSyncService.publish('calendar_events', updated, currentUser?.id);
    });
    setEventContextMenu((prev) => ({ ...prev, isOpen: false }));
    showScheduleToast('Zmena stavu stornovania bola uložená');
  }, [currentUser?.id, showScheduleToast]);

  // Vyúčtovanie termínu v POS
  const handleCheckoutInPOSFromSchedule = useCallback((evt: CalendarEvent) => {
    const remaining = Math.max(0, (evt.totalPrice || 0) - (evt.isDepositPaid ? (evt.depositAmount || 0) : 0));
    const matchedPat = patients.find(
      (p) => p.id === evt.patientId || p.name.toLowerCase().trim() === (evt.patientName || '').toLowerCase().trim()
    );
    if (matchedPat) {
      handleSetActivePatient(matchedPat);
    }
    setPosSelectedPatientId(matchedPat?.id || evt.patientId || '');
    setPosPrefillItems([
      {
        name: `${evt.title}${evt.isDepositPaid && evt.depositAmount ? ` (doplatok po odpočítaní zálohy ${evt.depositAmount} €)` : ''}`,
        brand: 'SAY CLINIC',
        price: remaining,
        quantity: 1,
      },
    ]);
    changeTab('cosmetics');
  }, [patients]);

  // Vystavenie lekárskeho záznamu / protokolu z harmonogramu
  const handleCreateDocFromSchedule = useCallback((evt: CalendarEvent) => {
    const matchedPat = patients.find(
      (p) => p.id === evt.patientId || p.name.toLowerCase().trim() === (evt.patientName || '').toLowerCase().trim()
    );
    if (matchedPat) {
      handleSetActivePatient(matchedPat);
    }
    handleNavigateToGenerator({
      id: matchedPat?.id || evt.patientId || `P-${Date.now()}`,
      name: evt.patientName || matchedPat?.name || 'Pacient',
      birthNumber: matchedPat?.birthNumber || evt.patientBirthNumber || '',
      phone: evt.patientPhone || matchedPat?.phone || '',
      email: evt.patientEmail || matchedPat?.email || '',
      address: matchedPat?.address || '',
      insurance: matchedPat?.insurance || 'Samoplatca',
      initialDocType: evt.type === 'operacia' ? 'operacny_protokol' : 'lekarska_sprava',
    });
  }, [patients]);

  // Vystavenie receptu z harmonogramu
  const handleIssuePrescriptionFromSchedule = useCallback((evt: CalendarEvent) => {
    const matchedPat = patients.find(
      (p) => p.id === evt.patientId || p.name.toLowerCase().trim() === (evt.patientName || '').toLowerCase().trim()
    );
    if (matchedPat) {
      handleSetActivePatient(matchedPat);
    }
    changeTab('prescriptions');
  }, [patients]);

  // Otvorenie estetickej mapy z harmonogramu
  const handleOpenAestheticsFromSchedule = useCallback((evt: CalendarEvent) => {
    const matchedPat = patients.find(
      (p) => p.id === evt.patientId || p.name.toLowerCase().trim() === (evt.patientName || '').toLowerCase().trim()
    );
    if (matchedPat) {
      handleSetActivePatient(matchedPat);
    }
    changeTab('aesthetics');
  }, [patients]);

  // Kopírovanie údajov pacienta do schránky
  const handleCopyPatientInfo = useCallback((evt: CalendarEvent) => {
    const matchedPat = patients.find(
      (p) => p.id === evt.patientId || p.name.toLowerCase().trim() === (evt.patientName || '').toLowerCase().trim()
    );
    const rc = matchedPat?.birthNumber || evt.patientBirthNumber || '---';
    const tel = matchedPat?.phone || evt.patientPhone || '---';
    const text = `${evt.patientName} | RČ: ${rc} | Tel: ${tel} | Termín: ${evt.date} ${evt.startTime} (${evt.title})`;
    navigator.clipboard.writeText(text);
    setEventContextMenu((prev) => ({ ...prev, isOpen: false }));
    showScheduleToast('Údaje pacienta skopírované do schránky');
  }, [patients, showScheduleToast]);

  // Otvorenie kontextového menu udalosti pravým kliknutím
  const handleOpenEventContextMenu = (e: React.MouseEvent, evt: CalendarEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX, window.innerWidth - 290);
    const y = Math.min(e.clientY, window.innerHeight - 440);
    setEventContextMenu({
      isOpen: true,
      x: Math.max(10, x),
      y: Math.max(10, y),
      event: evt,
    });
  };

  // Našepkávanie pacientov v spotlight vyhľadávaní
  const spotlightResults = useMemo(() => {
    if (!spotlightQuery.trim()) return [];
    const q = spotlightQuery.trim().toLowerCase();
    return patients
      .filter((p) => {
        return (
          (p.name && matchesQuery(p.name, q).match) ||
          (p.birthNumber && p.birthNumber.toLowerCase().includes(q)) ||
          (p.phone && p.phone.replace(/\s+/g, '').includes(q.replace(/\s+/g, '')))
        );
      })
      .slice(0, 5);
  }, [patients, spotlightQuery]);

  // Dynamický pozdrav podľa dennej doby
  const dynamicGreeting = useMemo(() => {
    const hour = currentTime ? currentTime.getHours() : new Date().getHours();
    if (hour < 10) return 'Dobré ráno';
    if (hour < 18) return 'Dobrý deň';
    return 'Dobrý večer';
  }, [currentTime]);

  // Všetky časové udalosti pre vybraný deň v harmonograme (celodenné udalosti sú vylúčené)
  const dayScheduleEvents = useMemo(() => {
    const seen = new Set<string>();
    const list = calendarEvents.filter((e) => {
      if (!e || e.date !== effectiveScheduleDate) return false;
      const isAllDay = Boolean(e.isAllDay || !e.startTime || (e.startTime === '00:00' && (e.endTime === '23:59' || e.endTime === '00:00')));
      if (isAllDay) return false;
      const key = e.id || `${e.title}-${e.startTime}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return list.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }, [calendarEvents, effectiveScheduleDate]);

  // Aktívne (nezrušené) udalosti pre štatistiky
  const dayActiveEvents = useMemo(() => {
    return dayScheduleEvents.filter((e) => !e.isCancelled && e.status !== 'cancelled');
  }, [dayScheduleEvents]);

  // Filtrované udalosti pre zobrazenie podľa miestnosti, filtra lekára a stavu zrušenia
  const filteredScheduleEvents = useMemo(() => {
    return dayScheduleEvents.filter((e) => {
      // 1. Filter stornovaných
      const isCanc = e.isCancelled || e.status === 'cancelled';
      if (!showCancelledSchedule && isCanc) return false;

      // 2. Filter "Len moji pacienti"
      if (onlyMyPatients && currentUser) {
        const myName = currentUser.name.toLowerCase();
        const mySurname = currentUser.name.split(' ').pop()?.toLowerCase() || '';
        const doc = (e.doctorName || '').toLowerCase();
        const op = (e.operator || '').toLowerCase();
        const an = (e.anesthesiologist || '').toLowerCase();
        const sn = (e.scrubNurse || '').toLowerCase();
        const as = (e.assignedTo || '').toLowerCase();
        const matchesMe =
          doc.includes(myName) || doc.includes(mySurname) ||
          op.includes(myName) || op.includes(mySurname) ||
          an.includes(myName) || an.includes(mySurname) ||
          sn.includes(myName) || sn.includes(mySurname) ||
          as.includes(myName) || as.includes(mySurname);
        if (!matchesMe) return false;
      }

      // 3. Filter miestnosti
      if (todayRoomFilter === 'all') return true;
      if (todayRoomFilter === 'operacky_all') {
        const rId = getEventRoomId(e);
        return rId === 'sala_say' || rId === 'sala_rudlova' || e.type === 'operacia';
      }
      return getEventRoomId(e) === todayRoomFilter;
    });
  }, [dayScheduleEvents, showCancelledSchedule, onlyMyPatients, currentUser, todayRoomFilter, getEventRoomId]);

  // Aktuálny čas v minútach od začiatku dňa
  const nowMinutes = useMemo(() => {
    if (!currentTime) return null;
    return currentTime.getHours() * 60 + currentTime.getMinutes();
  }, [currentTime]);

  // Počet udalostí pre danú kategóriu / miestnosť (len aktívne)
  const getRoomEventCount = useCallback((tabId: string) => {
    if (tabId === 'all') return dayActiveEvents.length;
    if (tabId === 'operacky_all') {
      return dayActiveEvents.filter((e) => {
        const rId = getEventRoomId(e);
        return rId === 'sala_say' || rId === 'sala_rudlova' || e.type === 'operacia';
      }).length;
    }
    return dayActiveEvents.filter((e) => getEventRoomId(e) === tabId).length;
  }, [dayActiveEvents, getEventRoomId]);

  // Identifikácia najbližšej nasledujúcej udalosti (pre dnes)
  const { ongoingEventId, nextUpcomingEventId } = useMemo(() => {
    if (!isScheduleToday || nowMinutes === null || dayActiveEvents.length === 0) {
      return { ongoingEventId: null, nextUpcomingEventId: null };
    }

    const parseTimeToMin = (t?: string) => {
      if (!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    // 1. Udalosť, ktorá práve prebieha
    const ongoing = dayActiveEvents.find((e) => {
      const s = parseTimeToMin(e.startTime);
      const end = parseTimeToMin(e.endTime) || (s + 30);
      return nowMinutes >= s && nowMinutes < end;
    });

    if (ongoing) {
      return { ongoingEventId: ongoing.id, nextUpcomingEventId: null };
    }

    // 2. Najbližšia nadchádzajúca
    const upcoming = dayActiveEvents
      .filter((e) => parseTimeToMin(e.startTime) > nowMinutes)
      .sort((a, b) => parseTimeToMin(a.startTime) - parseTimeToMin(b.startTime));

    return { ongoingEventId: null, nextUpcomingEventId: upcoming[0]?.id || null };
  }, [isScheduleToday, dayActiveEvents, nowMinutes]);

  // Štatistické výpočty pre Klinický Pulz (KPIs)
  const clinicalPulseStats = useMemo(() => {
    const surgeries = dayActiveEvents.filter((e) => e.type === 'operacia').length;
    const outpatient = dayActiveEvents.filter((e) => e.type !== 'operacia').length;
    const arrived = dayActiveEvents.filter((e) => e.status === 'arrived').length;
    const confirmed = dayActiveEvents.filter((e) => e.status === 'confirmed').length;
    const cancelled = dayScheduleEvents.filter((e) => e.isCancelled || e.status === 'cancelled').length;

    // Dnešný obrat (predaje + uhradené zálohy v tento deň)
    const salesSum = sales
      .filter((s) => s.date === effectiveScheduleDate)
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const depositsSum = dayScheduleEvents
      .filter((e) => e.isDepositPaid && (e.depositAmount || 0) > 0)
      .reduce((acc, curr) => acc + (curr.depositAmount || 0), 0);
    const totalTurnover = salesSum + depositsSum;

    return {
      total: dayActiveEvents.length,
      surgeries,
      outpatient,
      arrived,
      confirmed,
      cancelled,
      turnover: totalTurnover,
    };
  }, [dayActiveEvents, dayScheduleEvents, sales, effectiveScheduleDate]);

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
                ? (['finance', 'projects', 'pricelist'].includes(activeTab) ? activeTab : 'finance')
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

          {/* PRIAMY INDIKÁTOR GOOGLE DRIVE + KOMPAKTNÉ PROFILOVÉ MENU */}
          <div className="flex items-center gap-2">
            {currentUser.role !== 'external_clinic' && (
              <button
                type="button"
                onClick={handleGoogleConnectToggle}
                disabled={isConnectingGoogle}
                title={
                  isGoogleConnected
                    ? `Google Drive aktívny (${connectedGoogleEmail || 'SAY CLINIC'}). Kliknite pre správu.`
                    : 'Kliknite pre pripojenie Google Drive a Kalendára'
                }
                className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isGoogleConnected
                    ? 'bg-[#FAF8F5] text-[#2C2A29] border-[#E8E2D9] hover:border-[#C5A059]'
                    : 'bg-[#FAF8F5] text-[#2C2A29] border-[#C5A059]/60 hover:bg-[#2C2A29] hover:text-white'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isGoogleConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                  }`}
                />
                <Cloud className="w-3.5 h-3.5 text-[#C5A059]" />
                <span className="hidden sm:inline">
                  {isConnectingGoogle
                    ? 'Pripájam...'
                    : isGoogleConnected
                    ? 'Drive aktívny'
                    : 'Pripojiť Drive'}
                </span>
              </button>
            )}

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
                    {currentUser.role !== 'external_clinic' && (
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
                    )}

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
        </div>
      </header>

      {/* MODÁLNE OKNO SPRÁVY GOOGLE DRIVE PRIPOJENIA (BEZ WINDOW.CONFIRM) */}
      {showGoogleDriveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2A29]/30 backdrop-blur-md animate-in fade-in duration-200 print:hidden">
          <div className="bg-white border border-[#E8E2D9] w-full max-w-md rounded-3xl shadow-[0_25px_70px_rgba(44,42,41,0.18)] overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E2D9]/80 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#C5A059]">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-brand text-lg font-bold text-[#2C2A29] uppercase tracking-wider">
                    Google Drive & Kalendár
                  </h3>
                  <p className="text-[11px] text-[#8C857B]">
                    Cloudová synchronizácia zložky Klienti SAY
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleDriveModal(false)}
                className="p-1.5 text-[#8C857B] hover:text-[#2C2A29] rounded-lg hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isGoogleConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-xs font-bold text-[#2C2A29]">
                  {isGoogleConnected ? 'Aktívne pripojenie ku Google Workspace' : 'Pripojenie vyžaduje autorizáciu'}
                </span>
              </div>
              {connectedGoogleEmail && (
                <p className="text-xs text-[#8C857B] font-mono">
                  Pripojený účet: <strong className="text-[#2C2A29]">{connectedGoogleEmail}</strong>
                </p>
              )}
            </div>

            {googleAuthNotice && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{googleAuthNotice}</span>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleDirectGoogleSignIn}
                disabled={isConnectingGoogle}
                className="w-full py-2.5 px-4 bg-[#2C2A29] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
              >
                {isConnectingGoogle ? 'Pripájam Google účet...' : 'Obnoviť pripojenie / Prepnúť Google účet'}
              </button>

              {isGoogleConnected && (
                <button
                  type="button"
                  onClick={handleGoogleDisconnect}
                  className="w-full py-2.5 px-4 bg-white hover:bg-rose-50 text-rose-600 border border-[#E8E2D9] hover:border-rose-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Odpojiť Google Drive zo stanice
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
                
                {/* PLÁVAJÚCI TOAST OZNAM */}
                {scheduleToast && (
                  <div className="fixed top-20 right-6 z-50 bg-[#2C2A29] text-white px-4 py-2.5 rounded-2xl shadow-xl border border-[#C5A059]/40 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse" />
                    <span>{scheduleToast}</span>
                  </div>
                )}

                {/* HERO BANNER A SPOTLIGHT VYHĽADÁVANIE (VZDUŠNÝ EDITORIÁLOVÝ LUXUS) */}
                <div className="bg-white border border-[#E8E2D9]/80 rounded-3xl p-6 shadow-xs relative overflow-hidden space-y-5">
                  {/* Zlatý ambientný lúč v pozadí */}
                  <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#C5A059]/10 via-[#FAF8F5]/30 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-[0.2em] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
                          <span>Klinický prehľad & velín</span>
                        </span>
                        {lastCalendarSyncTime && (
                          <span className="text-[10px] text-[#8C857B] font-mono bg-[#FAF8F5] border border-[#E8E2D9] px-2 py-0.2 rounded-full">
                            Sync: {lastCalendarSyncTime}
                          </span>
                        )}
                      </div>
                      <h2 className="font-brand text-2xl md:text-3xl font-light text-[#2C2A29] uppercase tracking-wider">
                        {dynamicGreeting}, <span className="font-semibold">{currentUser.name}</span>
                      </h2>
                      <p className="text-xs text-[#8C857B]">
                        Vitajte v operačnom a ambulantnom systéme SAY CLINIC. Tu je váš harmonogram a úlohy.
                      </p>
                    </div>

                    {/* SPOTLIGHT RÝCHLE VYHĽADÁVANIE PACIENTA */}
                    <div className="w-full lg:w-80 relative" ref={spotlightRef}>
                      <div className="relative">
                        <Search className="w-4 h-4 text-[#8C857B] absolute left-3 top-2.5 pointer-events-none" />
                        <input
                          type="text"
                          value={spotlightQuery}
                          onChange={(e) => {
                            setSpotlightQuery(e.target.value);
                            setIsSpotlightOpen(true);
                          }}
                          onFocus={() => setIsSpotlightOpen(true)}
                          placeholder="Rýchle hľadanie pacienta..."
                          className="w-full bg-[#FAF8F5] border border-[#E8E2D9] hover:border-[#C5A059] focus:border-[#C5A059] focus:bg-white pl-9 pr-8 py-2 rounded-2xl text-xs outline-none transition-all placeholder:text-[#8C857B]"
                        />
                        {spotlightQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setSpotlightQuery('');
                              setIsSpotlightOpen(false);
                            }}
                            className="absolute right-2.5 top-2.5 text-[#8C857B] hover:text-[#2C2A29] cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* NAŠEPKÁVAČ SPOTLIGHT VÝSLEDKOV */}
                      {isSpotlightOpen && spotlightQuery.trim() && (
                        <div className="absolute top-full mt-2 left-0 right-0 bg-white/98 backdrop-blur-xl border border-[#E8E2D9] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                          {spotlightResults.length === 0 ? (
                            <div className="py-3 px-3 text-center text-xs text-[#8C857B]">
                              Žiaden pacient nenájdený pre &quot;{spotlightQuery}&quot;
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {spotlightResults.map((p) => (
                                <div
                                  key={p.id}
                                  onClick={() => {
                                    handleSetActivePatient(p);
                                    changeTab('patients');
                                    setIsSpotlightOpen(false);
                                    setSpotlightQuery('');
                                  }}
                                  className="p-2 hover:bg-[#FAF8F5] rounded-xl cursor-pointer flex items-center justify-between transition-colors group"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 rounded-full bg-[#C5A059]/20 text-[#C5A059] flex items-center justify-center font-bold text-[10px] shrink-0 font-brand">
                                      {p.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-xs text-[#2C2A29] group-hover:text-[#C5A059] truncate">
                                        {p.name}
                                      </p>
                                      <p className="text-[10px] text-[#8C857B] font-mono truncate">
                                        RČ: {p.birthNumber} {p.phone ? `· ${p.phone}` : ''}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-[10px] text-[#C5A059] font-bold uppercase tracking-wider group-hover:underline shrink-0">
                                    Otvoriť 360° →
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* HODINY, DÁTUM A TLAČIDLO SYNCHRONIZÁCIE */}
                    <div className="flex items-center gap-4 xl:pl-6 xl:border-l xl:border-[#E8E2D9]/80 shrink-0 select-none">
                      <div className="text-right">
                        <div className="flex items-start justify-end gap-1 tabular-nums leading-none">
                          <span className="font-brand text-3xl md:text-4xl font-light tracking-tight text-[#2C2A29]">
                            {currentTime ? String(currentTime.getHours()).padStart(2, '0') : '--'}
                          </span>
                          <span className="font-brand text-3xl md:text-4xl font-light text-[#C5A059] animate-pulse -mt-0.5">
                            :
                          </span>
                          <span className="font-brand text-3xl md:text-4xl font-semibold tracking-tight text-[#2C2A29]">
                            {currentTime ? String(currentTime.getMinutes()).padStart(2, '0') : '--'}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-[#C5A059] mt-1 ml-0.5 w-4 text-left">
                            {currentTime ? String(currentTime.getSeconds()).padStart(2, '0') : '--'}
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-1.5 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8C857B]">
                            {currentTime
                              ? currentTime.toLocaleDateString('sk-SK', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                })
                              : 'Načítavam...'}
                          </span>
                        </div>
                      </div>

                      {/* Tlačidlo ručnej synchronizácie kalendára */}
                      <button
                        type="button"
                        onClick={() => triggerCalendarSync(false)}
                        disabled={isSyncingCalendar}
                        title="Synchronizovať kalendár s Google Workspace teraz"
                        className="p-2.5 rounded-2xl border border-[#E8E2D9] hover:border-[#C5A059] hover:bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] transition-all cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${isSyncingCalendar ? 'animate-spin text-[#C5A059]' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* ŽIVÝ KLINICKÝ PULZ (4 INTERAKTÍVNE KPI KARTY) */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-[#E8E2D9]/60">
                    {/* KPI 1: VÝKONY V ZVOLENÝ DEŇ */}
                    <div 
                      onClick={() => setTodayRoomFilter('all')}
                      className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] hover:border-[#C5A059] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8C857B] group-hover:text-[#2C2A29]">
                          {isScheduleToday ? 'Dnes na pláne' : `Plán na ${effectiveScheduleDate}`}
                        </span>
                        <Activity className="w-3.5 h-3.5 text-[#C5A059]" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-brand text-2xl font-bold text-[#2C2A29] tabular-nums">
                          {clinicalPulseStats.total}
                        </span>
                        <span className="text-xs text-[#8C857B]">výkonov</span>
                      </div>
                      <p className="text-[10px] text-[#8C857B] mt-0.5 truncate">
                        🏥 {clinicalPulseStats.surgeries} operácií · 🩺 {clinicalPulseStats.outpatient} ambulancia
                      </p>
                    </div>

                    {/* KPI 2: PACIENTI NA KLINIKE (CHECK-IN) */}
                    <div 
                      onClick={() => setTodayRoomFilter('all')}
                      className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] hover:border-[#C5A059] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8C857B] group-hover:text-[#2C2A29]">
                          Check-in / Čakáreň
                        </span>
                        <span className="flex h-2 w-2 relative">
                          {clinicalPulseStats.arrived > 0 && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          )}
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${clinicalPulseStats.arrived > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-brand text-2xl font-bold text-emerald-800 tabular-nums">
                          {clinicalPulseStats.arrived}
                        </span>
                        <span className="text-xs text-emerald-700 font-semibold">na klinike</span>
                      </div>
                      <p className="text-[10px] text-[#8C857B] mt-0.5 truncate">
                        ✅ {clinicalPulseStats.confirmed} potvrdených termínov
                      </p>
                    </div>

                    {/* KPI 3: MOJE ÚLOHY & OPERATÍVNE POZNÁMKY */}
                    <div 
                      onClick={() => {
                        const el = document.getElementById('operative-notes-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] hover:border-[#C5A059] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8C857B] group-hover:text-[#2C2A29]">
                          Moje úlohy
                        </span>
                        <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-brand text-2xl font-bold text-[#2C2A29] tabular-nums">
                          {filteredScheduleEvents.length}
                        </span>
                        <span className="text-xs text-[#8C857B]">na harmonograme</span>
                      </div>
                      <p className="text-[10px] text-[#8C857B] mt-0.5 truncate">
                        Pripomienky a operatíva tímu
                      </p>
                    </div>

                    {/* KPI 4: DNEŠNÝ OBRAT / HOSPODÁRENIE (CEO & MANAŽMENT) */}
                    {(isRealCeo || currentUser.role === 'manager') ? (
                      <div 
                        onClick={() => changeTab('finance')}
                        className="p-3.5 rounded-2xl bg-gradient-to-br from-[#FAF8F5] to-amber-50/50 border border-[#C5A059]/40 hover:border-[#C5A059] transition-all cursor-pointer group shadow-2xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A6827] group-hover:text-[#2C2A29]">
                            Klinický obrat dnes
                          </span>
                          <BarChart3 className="w-3.5 h-3.5 text-[#C5A059]" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-brand text-2xl font-bold text-[#2C2A29] tabular-nums">
                            {clinicalPulseStats.turnover.toLocaleString('sk-SK')}
                          </span>
                          <span className="text-xs font-bold text-[#C5A059]">€</span>
                        </div>
                        <p className="text-[10px] text-[#8C857B] mt-0.5 truncate">
                          Tržby POS & zálohy operácií →
                        </p>
                      </div>
                    ) : (
                      <div 
                        onClick={() => changeTab('calendar')}
                        className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] hover:border-[#C5A059] transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8C857B] group-hover:text-[#2C2A29]">
                            Operačné sály
                          </span>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-brand text-2xl font-bold text-[#2C2A29] tabular-nums">
                            {clinicalPulseStats.surgeries}
                          </span>
                          <span className="text-xs text-[#8C857B]">plánovaných</span>
                        </div>
                        <p className="text-[10px] text-emerald-800 font-semibold mt-0.5 truncate">
                          Režim sál SAY & Rudlová aktívny
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* OBSAH HOMESCREENU: 12 STĹPCOV PRE EFEKTÍVNE VYUŽITIE PLOCHY */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* STĹPEC 1: HARMONOGRAM PACIENTOV (8 STĹPCOV NA VEĽKOM MONITORE) */}
                  <div className="lg:col-span-7 2xl:col-span-8 bg-white border border-[#E8E2D9]/80 rounded-3xl p-6 space-y-4 shadow-xs">
                    
                    {/* VRCHNÁ LIŠTA HARMONOGRAMU: PREPÍNAČ DŇA A AKCIE */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#E8E2D9]/70 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-brand text-lg font-bold text-[#2C2A29] uppercase tracking-wider">
                            Harmonogram pacientov
                          </h3>
                          <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E8E2D9] text-[#2C2A29]">
                            {clinicalPulseStats.total}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#8C857B] uppercase tracking-[0.14em] mt-0.5">
                          {isScheduleToday ? 'Dnešný deň' : isScheduleTomorrow ? 'Zajtrajší deň' : `Dátum: ${effectiveScheduleDate}`}
                          {' · '}Pravým kliknutím na kartu otvoríte rýchle možnosti
                        </p>
                      </div>

                      {/* NAVIGÁCIA DŇA: ◄ DNES / ZAJTRA ► */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div className="flex items-center bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl p-1 gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedScheduleDate(shiftDate(effectiveScheduleDate, -1))}
                            className="p-1.5 rounded-xl hover:bg-white text-[#8C857B] hover:text-[#2C2A29] transition-colors cursor-pointer"
                            title="Predchádzajúci deň"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setSelectedScheduleDate(todayString)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isScheduleToday
                                ? 'bg-[#2C2A29] text-white shadow-2xs'
                                : 'text-[#8C857B] hover:text-[#2C2A29]'
                            }`}
                          >
                            Dnes
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedScheduleDate(shiftDate(todayString, 1))}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isScheduleTomorrow
                                ? 'bg-[#2C2A29] text-white shadow-2xs'
                                : 'text-[#8C857B] hover:text-[#2C2A29]'
                            }`}
                          >
                            Zajtra
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedScheduleDate(shiftDate(effectiveScheduleDate, 1))}
                            className="p-1.5 rounded-xl hover:bg-white text-[#8C857B] hover:text-[#2C2A29] transition-colors cursor-pointer"
                            title="Nasledujúci deň"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* FILTER "LEN MOJI PACIENTI" */}
                        <button
                          type="button"
                          onClick={() => setOnlyMyPatients((prev) => !prev)}
                          className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                            onlyMyPatients
                              ? 'bg-[#C5A059] text-white border-[#C5A059] shadow-2xs'
                              : 'bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] border-[#E8E2D9]'
                          }`}
                          title="Filtrovať len pacientov, kde ste priradený ako lekár / operatér / sestra"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Len moji</span>
                        </button>

                        <button 
                          onClick={() => changeTab('calendar')}
                          className="text-xs text-[#C5A059] hover:text-[#2C2A29] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer pl-1"
                        >
                          <span>Celý kalendár</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* PREPÍNAČ MIESTNOSTÍ PRE HARMONOGRAM */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
                        {SCHEDULE_ROOM_TABS.map((tab) => {
                          const count = getRoomEventCount(tab.id);
                          const isSelected = todayRoomFilter === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setTodayRoomFilter(tab.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border cursor-pointer ${
                                isSelected
                                  ? 'bg-[#2C2A29] text-white border-[#2C2A29] shadow-2xs scale-[1.02]'
                                  : 'bg-[#FAF8F5] text-[#6B6357] hover:bg-white hover:text-[#2C2A29] border-[#E8E2D9]'
                              }`}
                            >
                              <span>{tab.icon}</span>
                              <span>{tab.label}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : count > 0
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-black/5 text-[#8C857B]'
                                }`}
                              >
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* TOGGLE STORNOVANÝCH TERMÍNOV */}
                      {clinicalPulseStats.cancelled > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowCancelledSchedule((prev) => !prev)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                            showCancelledSchedule
                              ? 'bg-rose-50 text-rose-800 border-rose-300 font-extrabold'
                              : 'bg-[#FAF8F5] text-[#8C857B] border-[#E8E2D9] hover:border-rose-300'
                          }`}
                        >
                          {showCancelledSchedule ? 'Skryť storná' : `Zobraziť storná (${clinicalPulseStats.cancelled})`}
                        </button>
                      )}
                    </div>

                    {/* VIZUÁLNY MINI-INDIKÁTOR VYŤAŽENOSTI MIESTNOSTÍ */}
                    {clinicalPulseStats.total > 0 && (
                      <div className="space-y-1 pt-0.5">
                        <div className="h-1.5 w-full bg-[#FAF8F5] rounded-full overflow-hidden flex border border-[#E8E2D9]/60">
                          {getRoomEventCount('ambulancia') > 0 && (
                            <div 
                              style={{ width: `${(getRoomEventCount('ambulancia') / clinicalPulseStats.total) * 100}%` }}
                              className="bg-sky-500 h-full"
                              title={`Ambulancia: ${getRoomEventCount('ambulancia')}`}
                            />
                          )}
                          {getRoomEventCount('sala_say') > 0 && (
                            <div 
                              style={{ width: `${(getRoomEventCount('sala_say') / clinicalPulseStats.total) * 100}%` }}
                              className="bg-[#2C2A29] h-full"
                              title={`Sála SAY: ${getRoomEventCount('sala_say')}`}
                            />
                          )}
                          {getRoomEventCount('sala_rudlova') > 0 && (
                            <div 
                              style={{ width: `${(getRoomEventCount('sala_rudlova') / clinicalPulseStats.total) * 100}%` }}
                              className="bg-[#C5A059] h-full"
                              title={`Rudlová: ${getRoomEventCount('sala_rudlova')}`}
                            />
                          )}
                          {getRoomEventCount('dospavacia_izba') > 0 && (
                            <div 
                              style={{ width: `${(getRoomEventCount('dospavacia_izba') / clinicalPulseStats.total) * 100}%` }}
                              className="bg-emerald-500 h-full"
                              title={`Dospávanie: ${getRoomEventCount('dospavacia_izba')}`}
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {/* ZOZNAM KARIET VÝKONOV */}
                    <div className="space-y-2.5">
                      {filteredScheduleEvents.length === 0 ? (
                        <div className="text-center py-12 text-[#8C857B] text-xs bg-[#FBF9F6]/60 rounded-2xl border border-dashed border-[#E8E2D9] space-y-2">
                          <p>
                            {dayScheduleEvents.length === 0
                              ? `Na zvolený deň (${effectiveScheduleDate}) nie sú naplánované žiadne udalosti.`
                              : onlyMyPatients
                              ? 'Pre zvoleného lekára/sestru sa nenašli žiadne priradené zákroky.'
                              : `V kategórii "${SCHEDULE_ROOM_TABS.find((t) => t.id === todayRoomFilter)?.label || 'Zvolená miestnosť'}" nie sú žiadne výkony.`}
                          </p>
                          {dayScheduleEvents.length > 0 && todayRoomFilter !== 'all' ? (
                            <button
                              type="button"
                              onClick={() => setTodayRoomFilter('all')}
                              className="text-[11px] text-[#C5A059] font-bold hover:underline cursor-pointer"
                            >
                              Zobraziť všetky zákroky dňa ({dayActiveEvents.length}) →
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                changeTab('calendar');
                                setTimeout(() => {
                                  window.dispatchEvent(new CustomEvent('say_open_add_calendar_event', { detail: { date: effectiveScheduleDate } }));
                                }, 60);
                              }}
                              className="px-4 py-2 bg-[#2C2A29] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer mt-1"
                            >
                              <span>+</span>
                              <span>Naplánovať termín na tento deň</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className={`grid gap-3 ${filteredScheduleEvents.length > 1 ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
                          {filteredScheduleEvents.map((evt, idx) => {
                            const parseTimeToMin = (t?: string) => {
                              if (!t) return 0;
                              const [h, m] = t.split(':').map(Number);
                              return (h || 0) * 60 + (m || 0);
                            };
                            const startMin = parseTimeToMin(evt.startTime);
                            const endMin = parseTimeToMin(evt.endTime) || (startMin + 45);
                            const isOngoing = isScheduleToday && nowMinutes !== null && !evt.isCancelled && nowMinutes >= startMin && nowMinutes < endMin;
                            const isNext = isScheduleToday && !isOngoing && evt.id === nextUpcomingEventId;
                            const isPast = isScheduleToday && nowMinutes !== null && !evt.isCancelled && nowMinutes >= endMin;
                            const roomInfo = getRoomInfo(getEventRoomId(evt));
                            const remainingMin = nowMinutes !== null ? Math.max(0, endMin - nowMinutes) : 0;
                            const minutesUntil = nowMinutes !== null ? Math.max(0, startMin - nowMinutes) : 0;
                            const isCancelled = evt.isCancelled || evt.status === 'cancelled';

                            // Výpočet priebehu prebiehajúcej operácie v %
                            const ongoingProgress = isOngoing && endMin > startMin
                              ? Math.min(100, Math.max(0, ((nowMinutes - startMin) / (endMin - startMin)) * 100))
                              : 0;

                            // Predoperačný semafor & Anestézia
                            const surgeryReadiness = evt.type === 'operacia' ? getSurgeryReadinessSummary(evt) : null;
                            const anesthesia = getAnesthesiaInfo(evt.anesthesiaType);
                            const clinicStay = getClinicStayInfo(evt.clinicStay);
                            const statusInfo = getEventStatusInfo(evt.status, evt.isCancelled);

                            return (
                              <div 
                                key={`${evt.id || 'schedule-evt'}-${idx}`} 
                                onContextMenu={(e) => handleOpenEventContextMenu(e, evt)}
                                onClick={() => handleOpenPatientFromCalendar(evt.patientId || '', evt.patientName)}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between gap-3 relative overflow-hidden select-none ${
                                  isCancelled
                                    ? 'bg-[#FAF8F5]/40 border-rose-200/80 opacity-60 hover:opacity-100'
                                    : isOngoing
                                    ? 'bg-gradient-to-r from-amber-50/95 via-white to-amber-50/40 border-[#C5A059] ring-2 ring-[#C5A059]/40 shadow-md border-l-4 border-l-[#C5A059]'
                                    : isNext
                                    ? 'bg-white border-[#C5A059]/70 hover:border-[#C5A059] shadow-xs border-l-4 border-l-[#C5A059]/70'
                                    : isPast
                                    ? 'bg-[#FBF9F6]/50 border-[#E8E2D9]/70 opacity-75 hover:opacity-100'
                                    : 'bg-[#FBF9F6]/50 hover:bg-white border-[#E8E2D9]/80 hover:border-[#C5A059]'
                                }`}
                                title="Kliknutím otvoríte kartu. Pravým kliknutím otvoríte rýchle možnosti."
                              >
                                {/* ŽIVÝ PROGRESS BAR PRE PREBIEHAJÚCI VÝKON */}
                                {isOngoing && (
                                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#E8E2D9]/40 overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-[#C5A059] to-amber-500 transition-all duration-1000 ease-out"
                                      style={{ width: `${ongoingProgress}%` }}
                                    />
                                  </div>
                                )}

                                {/* VRCHNÁ LIŠTA: ČAS, MIESTNOSŤ A STAV PRÁVE PREBIEHA */}
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {/* Časový interval */}
                                    <div className="flex items-center gap-1 font-mono text-xs font-bold text-[#2C2A29] bg-white px-2 py-0.5 rounded-lg border border-[#E8E2D9] shadow-2xs">
                                      <span className={isOngoing ? 'text-[#C5A059]' : 'text-[#2C2A29]'}>{evt.startTime}</span>
                                      <span className="text-[#8C857B] font-normal">–</span>
                                      <span className="text-[#8C857B]">{evt.endTime}</span>
                                    </div>

                                    {/* Miestnosť (Ambulancia, Operačky...) */}
                                    <span 
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${roomInfo.badgeBg || 'bg-gray-100 text-gray-800 border-gray-200'}`}
                                      title={roomInfo.name}
                                    >
                                      <span>{roomInfo.icon}</span>
                                      <span>{roomInfo.shortName || roomInfo.name}</span>
                                    </span>

                                    {/* Typ zákroku */}
                                    <span className="text-[9px] uppercase font-bold tracking-wider text-[#8C857B] bg-black/5 px-2 py-0.5 rounded-md">
                                      {evt.type ? evt.type.replace('_', ' ') : 'ZÁKROK'}
                                    </span>
                                  </div>

                                  {/* Indikátor aktuálneho stavu */}
                                  {isCancelled ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                      <span>❌</span>
                                      <span>ZRUŠENÉ</span>
                                    </span>
                                  ) : isOngoing ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#C5A059] text-white shadow-xs animate-pulse">
                                      <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                                      </span>
                                      <span>PRÁVE PREBIEHA</span>
                                      <span className="text-white/80 font-normal font-mono text-[9px] border-l border-white/30 pl-1.5">
                                        zostáva {remainingMin} min
                                      </span>
                                    </span>
                                  ) : isNext ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                      <span>⏱️</span>
                                      <span>Nasleduje o {minutesUntil} min</span>
                                    </span>
                                  ) : (
                                    /* Interaktívny stav dochádzky (Clickable Check-in) */
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const nextSt = evt.status === 'planned' ? 'confirmed' : evt.status === 'confirmed' ? 'arrived' : evt.status === 'arrived' ? 'completed' : 'planned';
                                        handleUpdateEventStatus(evt.id, nextSt as EventAttendanceStatus);
                                      }}
                                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-transform hover:scale-105 flex items-center gap-1 cursor-pointer ${statusInfo.badge}`}
                                      title="Kliknutím posuniete stav dochádzky"
                                    >
                                      <span>{statusInfo.icon}</span>
                                      <span>{statusInfo.shortLabel}</span>
                                    </button>
                                  )}
                                </div>

                                {/* STREDOVÁ ČASŤ: NÁZOV ZÁKROKU A PACIENT */}
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between gap-3">
                                    <h4 className={`font-bold text-sm truncate transition-colors ${
                                      isCancelled
                                        ? 'line-through text-[#8C857B]'
                                        : isOngoing
                                        ? 'text-[#C5A059]'
                                        : 'text-[#2C2A29] group-hover:text-[#C5A059]'
                                    }`}>
                                      {evt.title}
                                    </h4>
                                    <ChevronRight className={`w-4 h-4 text-[#8C857B] group-hover:text-[#C5A059] group-hover:translate-x-0.5 transition-all shrink-0 ${isOngoing ? 'text-[#C5A059]' : ''}`} />
                                  </div>

                                  <p className="text-xs text-[#8C857B] truncate flex items-center gap-2">
                                    <span className="font-semibold text-[#2C2A29]">👤 {evt.patientName}</span>
                                    <span>·</span>
                                    <span>🩺 {evt.doctorName || evt.operator}</span>
                                    {evt.anesthesiologist && (
                                      <>
                                        <span>·</span>
                                        <span className="text-[11px] text-purple-700">💉 {evt.anesthesiologist}</span>
                                      </>
                                    )}
                                  </p>
                                </div>

                                {/* ODZNAKY PRIPRAVENOSTI & ANESTÉZIE */}
                                <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[9px]">
                                  {anesthesia && (
                                    <span className={`px-2 py-0.5 rounded font-bold border ${anesthesia.badge}`}>
                                      💉 {anesthesia.shortLabel}
                                    </span>
                                  )}
                                  {clinicStay && clinicStay.id !== 'ambulantne' && (
                                    <span className={`px-2 py-0.5 rounded font-bold border ${clinicStay.badge}`}>
                                      {clinicStay.icon} {clinicStay.shortLabel}
                                    </span>
                                  )}
                                  {surgeryReadiness && (
                                    <span className={`px-2 py-0.5 rounded font-bold border flex items-center gap-1 ${surgeryReadiness.badgeClass}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${surgeryReadiness.dotClass}`} />
                                      <span>Sála: {surgeryReadiness.statusLabel}</span>
                                    </span>
                                  )}
                                  {evt.isDepositPaid && (
                                    <span className="px-2 py-0.5 rounded font-bold border bg-emerald-50 text-emerald-800 border-emerald-300">
                                      💳 Záloha uhradená
                                    </span>
                                  )}
                                </div>

                                {/* PÄTIČKA KARTY: MINI-AKČNÁ LIŠTA */}
                                <div className="flex items-center justify-between pt-2 border-t border-[#E8E2D9]/60 text-[10px] text-[#8C857B]">
                                  <span className="italic opacity-80">
                                    Pravý klik: viac možností
                                  </span>

                                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    {evt.status !== 'arrived' && evt.status !== 'completed' && !isCancelled && (
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateEventStatus(evt.id, 'arrived')}
                                        className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 transition-colors cursor-pointer flex items-center gap-1"
                                        title="Označiť príchod pacienta na kliniku"
                                      >
                                        <UserCheck className="w-3 h-3" />
                                        <span>Check-in</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleCreateDocFromSchedule(evt)}
                                      className="px-2 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#2C2A29] hover:text-white text-[#2C2A29] font-semibold border border-[#E8E2D9] transition-colors cursor-pointer"
                                      title="Vytvoriť lekársku správu / operačný protokol"
                                    >
                                      📝 Záznam
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleCheckoutInPOSFromSchedule(evt)}
                                      className="px-2 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#C5A059] hover:text-white text-[#2C2A29] font-semibold border border-[#E8E2D9] transition-colors cursor-pointer"
                                      title="Vyúčtovať doplatok v Pokladni POS"
                                    >
                                      💳 POS
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* STĹPEC 2: RÝCHLE AKCIE & OPERATÍVNE POZNÁMKY (4 STĹPCE NA VEĽKOM MONITORE) */}
                  <div className="lg:col-span-5 2xl:col-span-4 space-y-6">
                    
                    {/* BENTO MRIEŽKA RÝCHLYCH AKCIÍ */}
                    <div className="bg-white border border-[#E8E2D9]/80 rounded-3xl p-5 space-y-3.5 shadow-xs">
                      <div className="flex items-center justify-between border-b border-[#E8E2D9]/70 pb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-brand text-sm font-bold text-[#2C2A29] uppercase tracking-wider">
                            Rýchle Akcie
                          </h3>
                          <span className="text-[10px] font-bold text-[#8C857B] bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#E8E2D9]">
                            {activeUserQuickActions.length}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowQuickActionsModal(true)}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-[#C5A059] hover:text-[#2C2A29] transition-colors px-2.5 py-1 rounded-xl hover:bg-[#FAF8F5] cursor-pointer"
                          title="Prispôsobiť rýchle akcie pre váš profil"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Upraviť</span>
                        </button>
                      </div>

                      {activeUserQuickActions.length === 0 ? (
                        <div className="text-center py-6 px-4 bg-[#FAF8F5]/60 rounded-2xl border border-dashed border-[#E8E2D9] space-y-2">
                          <p className="text-xs text-[#8C857B]">
                            Nemáte zapnuté žiadne rýchle akcie.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowQuickActionsModal(true)}
                            className="px-3 py-1.5 bg-[#2C2A29] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <SlidersHorizontal className="w-3 h-3" />
                            <span>Pridať akcie</span>
                          </button>
                        </div>
                      ) : (
                        /* 2-STĹPCOVÁ BENTO MRIEŽKA PRE LUXUSNÝ VZHĽAD */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {activeUserQuickActions.map((action) => (
                            <div 
                              key={action.id}
                              onClick={() => handleQuickActionClick(action)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                setShowQuickActionsModal(true);
                              }}
                              className="p-3 bg-[#FAF8F5] hover:bg-white rounded-2xl border border-[#E8E2D9] hover:border-[#C5A059] transition-all cursor-pointer group flex flex-col justify-between gap-2 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 select-none"
                              title={`${action.description} · Pravým kliknutím upravíte akcie`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="p-2 rounded-xl bg-white border border-[#E8E2D9] group-hover:border-[#C5A059] text-[#C5A059] transition-colors shadow-2xs">
                                  {renderQuickActionIcon(action.iconName)}
                                </div>
                                {action.actionType === 'new_patient' || action.actionType === 'new_calendar_event' ? (
                                  <Plus className="w-3.5 h-3.5 text-[#8C857B] group-hover:text-[#2C2A29] transition-colors" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-[#8C857B] group-hover:text-[#C5A059] group-hover:translate-x-0.5 transition-all" />
                                )}
                              </div>

                              <div>
                                <h4 className="text-xs font-bold text-[#2C2A29] group-hover:text-[#C5A059] transition-colors leading-snug">
                                  {action.label}
                                </h4>
                                <p className="text-[10px] text-[#8C857B] truncate mt-0.5">
                                  {action.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* RÝCHLE KLINICKÉ POZNÁMKY (OPERATÍVA & PROJEKTOVÉ ÚLOHY) */}
                    <div id="operative-notes-section">
                      <OperativeNotesWidget 
                        currentUser={currentUser}
                        onConvertToProject={(noteText, noteId) => handleConvertNoteToProject(noteText, noteId)}
                        onOpenProjects={() => changeTab('projects')}
                      />
                    </div>

                  </div>
                </div>

                {/* PLÁVAJÚCE KONTEXTOVÉ MENU (RIGHT CLICK) PRE KARTY HARMONOGRAMU */}
                {eventContextMenu.isOpen && eventContextMenu.event && (
                  <div
                    ref={eventContextMenuRef}
                    className="fixed z-[160] w-72 bg-white/98 backdrop-blur-xl border border-[#E8E2D9] rounded-2xl shadow-[0_25px_60px_rgba(44,42,41,0.25)] overflow-hidden text-xs text-[#2C2A29] flex flex-col animate-in fade-in zoom-in-95 duration-150 select-none"
                    style={{ top: eventContextMenu.y, left: eventContextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* HLAVIČKA KONTEXTOVÉHO MENU */}
                    <div className="px-3.5 py-3 bg-[#2C2A29] text-white border-b border-[#3E3A37]">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-brand font-bold text-sm text-white truncate">
                          {eventContextMenu.event.patientName}
                        </p>
                        <span className="text-[9px] bg-white/15 px-2 py-0.5 rounded font-mono font-bold text-[#C5A059] shrink-0">
                          {eventContextMenu.event.startTime}–{eventContextMenu.event.endTime}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#E8E2D9]/80 truncate mt-0.5">
                        {eventContextMenu.event.title}
                      </p>
                    </div>

                    <div className="p-1.5 space-y-0.5 max-h-[75vh] overflow-y-auto">
                      {/* RÝCHLY CHECK-IN & ZMENA STAVU */}
                      <div className="px-3 py-1.5 border-b border-[#E8E2D9]/60">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-[#8C857B] block mb-1">
                          Zmeniť stav dochádzky:
                        </span>
                        <div className="grid grid-cols-2 gap-1">
                          <button
                            type="button"
                            onClick={() => eventContextMenu.event && handleUpdateEventStatus(eventContextMenu.event.id, 'planned')}
                            className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                              eventContextMenu.event.status === 'planned'
                                ? 'bg-[#2C2A29] text-white border-[#2C2A29]'
                                : 'bg-white hover:bg-[#FAF8F5] text-[#2C2A29] border-[#E8E2D9]'
                            }`}
                          >
                            <span>🗓️</span>
                            <span className="truncate">Plánované</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => eventContextMenu.event && handleUpdateEventStatus(eventContextMenu.event.id, 'confirmed')}
                            className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                              eventContextMenu.event.status === 'confirmed'
                                ? 'bg-emerald-700 text-white border-emerald-700'
                                : 'bg-white hover:bg-emerald-50 text-emerald-800 border-[#E8E2D9]'
                            }`}
                          >
                            <span>✅</span>
                            <span className="truncate">Potvrdené</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => eventContextMenu.event && handleUpdateEventStatus(eventContextMenu.event.id, 'arrived')}
                            className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                              eventContextMenu.event.status === 'arrived'
                                ? 'bg-amber-600 text-white border-amber-600'
                                : 'bg-white hover:bg-amber-50 text-amber-900 border-[#E8E2D9]'
                            }`}
                          >
                            <span>🏥</span>
                            <span className="truncate">Na klinike</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => eventContextMenu.event && handleUpdateEventStatus(eventContextMenu.event.id, 'completed')}
                            className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                              eventContextMenu.event.status === 'completed'
                                ? 'bg-sky-700 text-white border-sky-700'
                                : 'bg-white hover:bg-sky-50 text-sky-900 border-[#E8E2D9]'
                            }`}
                          >
                            <span>🏁</span>
                            <span className="truncate">Ukončené</span>
                          </button>
                        </div>
                      </div>

                      {/* KLINICKÉ SKRATKY */}
                      <div className="py-1 space-y-0.5">
                        {/* 1. Nastaviť ako aktívneho pacienta */}
                        <button
                          type="button"
                          onClick={() => {
                            if (eventContextMenu.event) {
                              const p = patients.find(pat => pat.id === eventContextMenu.event?.patientId || pat.name.toLowerCase() === eventContextMenu.event?.patientName.toLowerCase());
                              if (p) handleSetActivePatient(p);
                            }
                            setEventContextMenu((prev) => ({ ...prev, isOpen: false }));
                            showScheduleToast('Pacient nastavený v hornej lište');
                          }}
                          className="w-full px-3 py-1.5 rounded-xl text-left font-semibold hover:bg-emerald-50 text-emerald-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Nastaviť ako aktívneho pacienta</span>
                        </button>

                        {/* 2. Otvoriť Kartu 360° */}
                        <button
                          type="button"
                          onClick={() => {
                            if (eventContextMenu.event) {
                              handleOpenPatientFromCalendar(eventContextMenu.event.patientId || '', eventContextMenu.event.patientName);
                            }
                            setEventContextMenu((prev) => ({ ...prev, isOpen: false }));
                          }}
                          className="w-full px-3 py-1.5 rounded-xl text-left font-semibold hover:bg-[#FAF8F5] flex items-center gap-2.5 transition-colors cursor-pointer text-[#2C2A29]"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Otvoriť Kartu pacienta (360°)</span>
                        </button>

                        {/* 3. Vystaviť záznam / protokol */}
                        <button
                          type="button"
                          onClick={() => {
                            if (eventContextMenu.event) {
                              handleCreateDocFromSchedule(eventContextMenu.event);
                            }
                            setEventContextMenu((prev) => ({ ...prev, isOpen: false }));
                          }}
                          className="w-full px-3 py-1.5 rounded-xl text-left font-semibold hover:bg-[#FAF8F5] flex items-center gap-2.5 transition-colors cursor-pointer text-[#2C2A29]"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Vystaviť Záznam / Protokol</span>
                        </button>

                        {/* 4. Vystaviť recept */}
                        <button
                          type="button"
                          onClick={() => {
                            if (eventContextMenu.event) {
                              handleIssuePrescriptionFromSchedule(eventContextMenu.event);
                            }
                            setEventContextMenu((prev) => ({ ...prev, isOpen: false }));
                          }}
                          className="w-full px-3 py-1.5 rounded-xl text-left font-semibold hover:bg-[#FAF8F5] flex items-center gap-2.5 transition-colors cursor-pointer text-[#2C2A29]"
                        >
                          <Pill className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Vystaviť recept (Rp.)</span>
                        </button>

                        {/* 5. Otvoriť Estetickú mapu */}
                        <button
                          type="button"
                          onClick={() => {
                            if (eventContextMenu.event) {
                              handleOpenAestheticsFromSchedule(eventContextMenu.event);
                            }
                            setEventContextMenu((prev) => ({ ...prev, isOpen: false }));
                          }}
                          className="w-full px-3 py-1.5 rounded-xl text-left font-semibold hover:bg-[#FAF8F5] flex items-center gap-2.5 transition-colors cursor-pointer text-[#2C2A29]"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Estetická mapa & aplikácia</span>
                        </button>

                        {/* 6. Vyúčtovať v POS */}
                        <button
                          type="button"
                          onClick={() => {
                            if (eventContextMenu.event) {
                              handleCheckoutInPOSFromSchedule(eventContextMenu.event);
                            }
                            setEventContextMenu((prev) => ({ ...prev, isOpen: false }));
                          }}
                          className="w-full px-3 py-1.5 rounded-xl text-left font-semibold hover:bg-amber-50 text-amber-900 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Vyúčtovať v Pokladni POS</span>
                        </button>

                        {/* 7. Zobraziť v Kalendári */}
                        <button
                          type="button"
                          onClick={() => {
                            changeTab('calendar');
                            setEventContextMenu((prev) => ({ ...prev, isOpen: false }));
                          }}
                          className="w-full px-3 py-1.5 rounded-xl text-left font-semibold hover:bg-[#FAF8F5] flex items-center gap-2.5 transition-colors cursor-pointer text-[#2C2A29]"
                        >
                          <CalendarIcon className="w-3.5 h-3.5 text-[#8C857B]" />
                          <span>Zobraziť v Kalendári</span>
                        </button>
                      </div>

                      {/* POMOCNÉ NÁSTROJE & STORNO */}
                      <div className="pt-1 border-t border-[#E8E2D9]/80 space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (eventContextMenu.event) {
                              handleCopyPatientInfo(eventContextMenu.event);
                            }
                          }}
                          className="w-full px-3 py-1.5 rounded-xl text-left font-semibold hover:bg-[#FAF8F5] flex items-center gap-2.5 transition-colors cursor-pointer text-[#2C2A29]"
                        >
                          <Copy className="w-3.5 h-3.5 text-[#8C857B]" />
                          <span>Kopírovať údaje pacienta</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (eventContextMenu.event) {
                              handleToggleCancelEvent(eventContextMenu.event.id);
                            }
                          }}
                          className={`w-full px-3 py-1.5 rounded-xl text-left font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                            eventContextMenu.event.isCancelled
                              ? 'text-emerald-700 hover:bg-emerald-50'
                              : 'text-rose-600 hover:bg-rose-50'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{eventContextMenu.event.isCancelled ? 'Obnoviť zrušený termín' : 'Zrušiť termín (Storno)'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

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
                        if (updatedActive && JSON.stringify(updatedActive) !== JSON.stringify(activePatient)) {
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
                currentUser={currentUser}
                onOpenPatientFolder={handleOpenPatientFromCalendar}
                onAddEvent={handleAddCalendarEvent}
                onEventsChange={handleCalendarEventsChange}
                onPatientCreated={handlePatientCreatedFromCalendar}
                onCheckoutInPOS={handleCheckoutInPOSFromCalendar}
                onCreateMedicalDocument={handleCreateMedicalDocumentFromCalendar}
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

                {activeTab === 'inventory' && (
                  <InventoryCRM 
                    patients={patients}
                    activePatient={activePatient}
                    onSelectPatient={(p) => handleSetActivePatient(p)}
                  />
                )}
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

            {/* MANAŽMENT: FINANCIE, PROJEKTY & CENNÍK */}
            {(activeTab === 'finance' || activeTab === 'projects' || activeTab === 'pricelist') && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#E8E2D9]/80 pb-4">
                  <div>
                    <h2 className="font-brand text-2xl font-bold text-[#2C2A29] uppercase tracking-wider">
                      Manažment & Financie
                    </h2>
                    <p className="text-xs text-[#8C857B]">
                      Finančné riadenie kliniky, P&L výkaz, cenník služieb a operatívne projekty tímu
                    </p>
                  </div>
                  
                  {/* PREPÍNAČ MEDZI FINANCIAMI, PROJEKTAMI A CENNÍKOM */}
                  <div className="flex items-center gap-1 p-1 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl flex-wrap">
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
                    {PermissionsService.canUserAccessTab(currentUser, 'pricelist') && (
                      <button
                        type="button"
                        onClick={() => changeTab('pricelist')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                          activeTab === 'pricelist'
                            ? 'bg-[#2C2A29] text-white shadow-2xs'
                            : 'text-[#8C857B] hover:text-[#2C2A29]'
                        }`}
                      >
                        <Tag className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Cenník služieb</span>
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
                {activeTab === 'pricelist' && (
                  <ClinicPriceListManagement 
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

      {/* MODÁLNE OKNO PRE SPRÁVU GOOGLE DRIVE A SYNCHRONIZÁCIU */}
      <GoogleDriveModal
        isOpen={showGoogleDriveModal}
        onClose={() => setShowGoogleDriveModal(false)}
        currentUser={currentUser}
      />

      {/* MODÁLNE OKNO PRE PRISPÔSOBENIE RÝCHLYCH AKCIÍ POUŽÍVATEĽA */}
      {currentUser && (
        <QuickActionsCustomizeModal
          isOpen={showQuickActionsModal}
          onClose={() => setShowQuickActionsModal(false)}
          currentUser={currentUser}
          currentPreferences={userQuickActions}
          onSave={(updated) => setUserQuickActions(updated)}
        />
      )}
    </div>
  );
}