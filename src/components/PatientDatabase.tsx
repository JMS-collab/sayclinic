'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Search, 
  X, 
  Sparkles, 
  Clock, 
  PanelRightOpen, 
  PanelRightClose, 
  ShieldAlert,
  FileText,
  Calendar,
  Camera,
  Activity,
  Pill,
  Syringe,
  ShoppingBag,
  Boxes,
  Package,
  FileCheck,
  HardDrive,
  MoreHorizontal,
  ChevronDown,
  Stethoscope,
  Cloud,
  Check,
  Edit3,
  Loader2,
  RefreshCw,
  ClipboardList
} from 'lucide-react';
import { filterAndRankPatients, RankedPatient } from '../utils/fuzzySearch';
import { googleSignIn, subscribeWorkspaceAuth, setExternalAccessToken } from '@/lib/workspaceAuth';
import PatientDriveFiles from './PatientDriveFiles';
import PatientTimelineSidebar from './PatientTimelineSidebar';
import { InventoryService, MaterialUsageLog, InventoryItem } from '../services/inventoryService';
import { CalendarEvent, getPostOpTimeDiff } from '../data/calendarConfig';
import SchedulePatientEventModal from './patient/SchedulePatientEventModal';
import { PatientPlan, PRESET_PATIENT_PLANS, ScheduledTreatment } from '../data/patientPlanConfig';
import PatientPlanViewer from './patient/PatientPlanViewer';
import CreatePatientPlanModal from './patient/CreatePatientPlanModal';
import AIHealthRoadmapView from './patient/AIHealthRoadmapView';
import { MeicetModule } from './meicet/MeicetModule';
import { AuditLogService } from '../services/auditLogService';
import { RealtimeSyncService } from '../services/realtimeSyncService';
import { CloudRecordService, CloudMedicalRecord } from '../services/cloudRecordService';
import { PatientCloudService } from '../services/patientCloudService';
import GoogleDriveModal from './GoogleDriveModal';
import { LiquidAvatar } from './LiquidAvatar';

const INITIAL_DEMO_PLANS: Record<string, PatientPlan[]> = {};

export interface Patient {
  id: string;
  name: string;
  birthNumber: string;
  phone: string;
  email: string;
  address: string;
  dob: string;
  insurance: string;
  driveFolderLink?: string;
  allergies?: string[];
  notes?: string;
  updatedAt?: string;
}

export interface MedicalRecord {
  id: string;
  type: string;
  typeColor: string;
  title: string;
  doctor: string;
  diagnosis: string;
  date: string;
  content: string;
  driveFileId?: string;
  driveWebViewLink?: string;
  patientId?: string;
  patientName?: string;
  patientBirthNumber?: string;
}

export const MOCK_PATIENTS: Patient[] = [];

const PHOTO_CATEGORIES = ['Konzultácia', 'Predoperačné', 'Pooperačné', '1. mesiac', '6. mesiac', '1 rok'];

interface UploadedPhoto {
  name: string;
  url: string;
}

interface PatientDatabaseProps {
  onNavigateToGenerator?: (patient: Patient & { initialDocType?: any }) => void;
  onNavigateToPrescriptions?: (patient: Patient) => void;
  onNavigateToAesthetics?: (patient: Patient) => void;
  onNavigateToCosmetics?: (patient?: Patient | null, prefillItems?: any[]) => void;
  initialPatient?: Patient | null;
  initialFolder?: 'dokumenty' | 'fotodokumentacia' | 'predoperacne' | 'drive' | 'materialy' | 'terminy' | 'plany' | 'roadmap' | 'meicet' | 'zaznamy' | 'diagnostika' | string;
  onPatientsUpdated?: (patients: Patient[]) => void;
  calendarEvents?: CalendarEvent[];
  onAddCalendarEvent?: (event: CalendarEvent) => void;
  onNavigateToCalendar?: () => void;
  activePatient?: Patient | null;
  onSetActivePatient?: (patient: Patient | null) => void;
  currentUser?: any;
}

export type MainPatientFolder = 'zaznamy' | 'plany' | 'diagnostika' | 'terminy';
export type ZaznamySubTab = 'dekurzy' | 'vysetrenia' | 'materialy' | 'drive';
export type PlanySubTab = 'roadmap' | 'protokoly';
export type DiagnostikaSubTab = 'meicet' | 'foto';

export default function PatientDatabase({ 
  onNavigateToGenerator, 
  onNavigateToPrescriptions,
  onNavigateToAesthetics, 
  onNavigateToCosmetics,
  initialPatient, 
  initialFolder,
  onPatientsUpdated,
  calendarEvents = [],
  onAddCalendarEvent,
  onNavigateToCalendar,
  activePatient,
  onSetActivePatient,
  currentUser
}: PatientDatabaseProps) {
  const { data: session } = useSession();
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(initialPatient || activePatient || null);

  // POMOCNÝ RESOLVER PRE ZLÚČENÉ ZÁLOŽKY S RETRO-KOMPATIBILITOU
  const resolveFolderAndSub = (folder?: string) => {
    switch (folder) {
      case 'prevadzka':
      case 'odpis':
      case 'spotreba':
      case 'materialy':
        return { main: 'zaznamy' as MainPatientFolder, zaznamySub: 'materialy' as ZaznamySubTab, planySub: 'roadmap' as PlanySubTab, diagSub: 'meicet' as DiagnostikaSubTab };
      case 'roadmap':
        return { main: 'plany' as MainPatientFolder, zaznamySub: 'dekurzy' as ZaznamySubTab, planySub: 'roadmap' as PlanySubTab, diagSub: 'meicet' as DiagnostikaSubTab };
      case 'plany':
        return { main: 'plany' as MainPatientFolder, zaznamySub: 'dekurzy' as ZaznamySubTab, planySub: 'protokoly' as PlanySubTab, diagSub: 'meicet' as DiagnostikaSubTab };
      case 'meicet':
        return { main: 'diagnostika' as MainPatientFolder, zaznamySub: 'dekurzy' as ZaznamySubTab, planySub: 'roadmap' as PlanySubTab, diagSub: 'meicet' as DiagnostikaSubTab };
      case 'fotodokumentacia':
        return { main: 'diagnostika' as MainPatientFolder, zaznamySub: 'dekurzy' as ZaznamySubTab, planySub: 'roadmap' as PlanySubTab, diagSub: 'foto' as DiagnostikaSubTab };
      case 'diagnostika':
        return { main: 'diagnostika' as MainPatientFolder, zaznamySub: 'dekurzy' as ZaznamySubTab, planySub: 'roadmap' as PlanySubTab, diagSub: 'meicet' as DiagnostikaSubTab };
      case 'predoperacne':
        return { main: 'zaznamy' as MainPatientFolder, zaznamySub: 'vysetrenia' as ZaznamySubTab, planySub: 'roadmap' as PlanySubTab, diagSub: 'meicet' as DiagnostikaSubTab };
      case 'materialy':
        return { main: 'zaznamy' as MainPatientFolder, zaznamySub: 'materialy' as ZaznamySubTab, planySub: 'roadmap' as PlanySubTab, diagSub: 'meicet' as DiagnostikaSubTab };
      case 'drive':
        return { main: 'zaznamy' as MainPatientFolder, zaznamySub: 'drive' as ZaznamySubTab, planySub: 'roadmap' as PlanySubTab, diagSub: 'meicet' as DiagnostikaSubTab };
      case 'terminy':
        return { main: 'terminy' as MainPatientFolder, zaznamySub: 'dekurzy' as ZaznamySubTab, planySub: 'roadmap' as PlanySubTab, diagSub: 'meicet' as DiagnostikaSubTab };
      case 'zaznamy':
      case 'dokumenty':
      default:
        return { main: 'zaznamy' as MainPatientFolder, zaznamySub: 'dekurzy' as ZaznamySubTab, planySub: 'roadmap' as PlanySubTab, diagSub: 'meicet' as DiagnostikaSubTab };
    }
  };

  const initialResolved = resolveFolderAndSub(initialFolder);
  const [activeFolder, setActiveFolderRaw] = useState<MainPatientFolder>(initialResolved.main);
  const [zaznamySubTab, setZaznamySubTab] = useState<ZaznamySubTab>(initialResolved.zaznamySub);
  const [planySubTab, setPlanySubTab] = useState<PlanySubTab>(initialResolved.planySub);
  const [diagnostikaSubTab, setDiagnostikaSubTab] = useState<DiagnostikaSubTab>(initialResolved.diagSub);

  // Univerzálny setter priečinka zabezpečujúci kompatibilitu s pôvodnými volaniami
  const setActiveFolder = (folder: string) => {
    const resolved = resolveFolderAndSub(folder);
    setActiveFolderRaw(resolved.main);
    if (folder === 'roadmap' || folder === 'plany') {
      setPlanySubTab(resolved.planySub);
    } else if (folder === 'meicet' || folder === 'fotodokumentacia') {
      setDiagnostikaSubTab(resolved.diagSub);
    } else if (['predoperacne', 'materialy', 'drive', 'dokumenty', 'zaznamy'].includes(folder)) {
      setZaznamySubTab(resolved.zaznamySub);
    }
  };

  useEffect(() => {
    if (initialFolder) {
      setActiveFolder(initialFolder);
    }
  }, [initialFolder]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'saving' | 'syncing' | 'error'>('synced');
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveStatusMessage, setDriveStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // STAV PRE SKLADACÍ BOČNÝ PANEL ČASOVEJ OSI A ALERGIÍ PACIENTA
  const [isTimelineOpen, setIsTimelineOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('say_clinic_timeline_open_state');
      if (saved !== null) return saved === 'true';
    }
    return true; // Predvolene otvorený pre okamžitý prehľad
  });

  const toggleTimeline = () => {
    setIsTimelineOpen(prev => {
      const next = !prev;
      try {
        localStorage.setItem('say_clinic_timeline_open_state', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // STAV PRE PLÁNY PACIENTA (ROČNÝ ESTETICKÝ & PRED/POOPERAČNÝ PLÁN)
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [workspaceToken, setWorkspaceToken] = useState<string | null>(null);
  // STAV PRE SÚBEŽNÚ PRÁCU NA PACIENTOVI (LIVE PRESENCE TÍMU)
  const [patientConcurrentUsers, setPatientConcurrentUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!selectedPatient) {
      setPatientConcurrentUsers([]);
      return;
    }

    const effectiveUser = currentUser || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('say_clinic_user') || 'null')?.user : null);

    const updatePresence = () => {
      const active = RealtimeSyncService.getConcurrentUsersForPatient(selectedPatient.id, effectiveUser?.id);
      setPatientConcurrentUsers(active);
    };

    updatePresence();

    if (effectiveUser?.id) {
      RealtimeSyncService.reportPresence(selectedPatient.id, effectiveUser);
      const interval = setInterval(() => {
        RealtimeSyncService.reportPresence(selectedPatient.id, effectiveUser);
        updatePresence();
      }, 12000);

      const unsub = RealtimeSyncService.subscribe('patient_presence', () => {
        updatePresence();
      });

      return () => {
        clearInterval(interval);
        unsub();
        RealtimeSyncService.leavePresence(selectedPatient.id, effectiveUser.id);
      };
    }
  }, [selectedPatient?.id, currentUser?.id]);

  useEffect(() => {
    const unsub = subscribeWorkspaceAuth((user, token) => {
      setWorkspaceToken(token);
    });
    return () => unsub();
  }, []);

  const [allPatientPlans, setAllPatientPlans] = useState<Record<string, PatientPlan[]>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('say_clinic_patient_plans');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Chyba načítania plánov pacienta:', e);
        }
      }
    }
    return INITIAL_DEMO_PLANS;
  });

  const handleSaveNewPlan = (newPlan: PatientPlan) => {
    if (!selectedPatient) return;
    const patientPlans = allPatientPlans[selectedPatient.id] || [];
    const updated = [newPlan, ...patientPlans];
    const newAll = {
      ...allPatientPlans,
      [selectedPatient.id]: updated
    };
    setAllPatientPlans(newAll);
    localStorage.setItem('say_clinic_patient_plans', JSON.stringify(newAll));
    RealtimeSyncService.publish('patient_plans', newAll);
    setSelectedPlanId(newPlan.id);
    setActiveFolder('plany');
  };

  const handleUpdatePlan = (updatedPlan: PatientPlan) => {
    if (!selectedPatient) return;
    const patientPlans = allPatientPlans[selectedPatient.id] || [];
    const updated = patientPlans.map(p => p.id === updatedPlan.id ? updatedPlan : p);
    const newAll = {
      ...allPatientPlans,
      [selectedPatient.id]: updated
    };
    setAllPatientPlans(newAll);
    localStorage.setItem('say_clinic_patient_plans', JSON.stringify(newAll));
    RealtimeSyncService.publish('patient_plans', newAll);
  };

  // STAV PRE PLÁNOVANIE TERMÍNOV PRIAMO Z KARTY PACIENTA
  const [isSchedulingEvent, setIsSchedulingEvent] = useState(false);
  const [schedulingSourceRecord, setSchedulingSourceRecord] = useState<MedicalRecord | null>(null);
  const [schedulingInitialDetails, setSchedulingInitialDetails] = useState<{
    title?: string;
    eventType?: any;
    notes?: string;
    targetDate?: string;
    doctor?: string;
  } | undefined>(undefined);
  const [storedEvents, setStoredEvents] = useState<CalendarEvent[]>(calendarEvents);

  const handleScheduleTreatmentFromPlan = (treatment: ScheduledTreatment) => {
    setSchedulingSourceRecord(null);
    setSchedulingInitialDetails({
      title: treatment.name,
      eventType: treatment.category === 'surgery' ? 'operacia' : treatment.category === 'laser' ? 'osetrenie' : 'kontrola',
      notes: `Zákrok z plánu pacienta: ${treatment.name} (${treatment.seasonOrMonth}). Oblasť: ${treatment.targetArea}. ${treatment.notes || ''}`,
      targetDate: new Date().toISOString().split('T')[0]
    });
    setIsSchedulingEvent(true);
  };

  useEffect(() => {
    if (calendarEvents && calendarEvents.length > 0) {
      setStoredEvents(calendarEvents);
    } else {
      const saved = localStorage.getItem('say_clinic_calendar_events');
      if (saved) {
        try {
          setStoredEvents(JSON.parse(saved));
        } catch (e) {
          console.error('Chyba načítania udalostí kalendára:', e);
        }
      }
    }
  }, [calendarEvents]);

  const handleOpenScheduleModal = (sourceRecord?: MedicalRecord) => {
    setSchedulingSourceRecord(sourceRecord || null);
    setIsSchedulingEvent(true);
  };

  const handleSaveCalendarEvent = async (newEvent: CalendarEvent) => {
    const updated = [newEvent, ...storedEvents];
    setStoredEvents(updated);
    localStorage.setItem('say_clinic_calendar_events', JSON.stringify(updated));
    if (onAddCalendarEvent) {
      onAddCalendarEvent(newEvent);
    }
    if (session) {
      try {
        await fetch('/api/calendar/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newEvent)
        });
      } catch (err) {
        console.error('Chyba zápisu do Google Kalendára:', err);
      }
    }
  };

  // STAV PRE POUŽITÝ MATERIÁL & SKLAD
  const [patientMaterialLogs, setPatientMaterialLogs] = useState<MaterialUsageLog[]>([]);
  const [isDispensingMaterial, setIsDispensingMaterial] = useState(false);
  const [allStockItems, setAllStockItems] = useState<InventoryItem[]>([]);
  const [dispenseItemId, setDispenseItemId] = useState('');
  const [dispenseQuantity, setDispenseQuantity] = useState(1);
  const [dispenseType, setDispenseType] = useState<'ambulancia' | 'pradlo' | 'operacia' | 'estetika'>('pradlo');
  const [dispenseProcedureName, setDispenseProcedureName] = useState('Výdaj pooperačného prádla / ošetrenie');
  const [dispenseNote, setDispenseNote] = useState('');
  const [materialFilterType, setMaterialFilterType] = useState<string>('all');

  // STAV PRE ODPIS SPOTREBY PRE SESTRU (BALÍČKY & AUTO-PREDVÝBER)
  const [dispenseModalMode, setDispenseModalMode] = useState<'bundle' | 'manual'>('bundle');
  const [selectedBundleId, setSelectedBundleId] = useState<string>('bundle-augmentacia');
  const [bundleCustomQuantities, setBundleCustomQuantities] = useState<Record<string, number>>({});
  const [bundleDisabledItems, setBundleDisabledItems] = useState<Record<string, boolean>>({});
  const [detectedProcedureName, setDetectedProcedureName] = useState<string>('');
  const [dispensePerformerName, setDispensePerformerName] = useState<string>('Službukonajúca sestra');
  const [dispenseSuccessToast, setDispenseSuccessToast] = useState<string | null>(null);

  // Stav pre pridať pacienta
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [isCreatingDriveFolder, setIsCreatingDriveFolder] = useState(false);
  const [newPatientData, setNewPatientData] = useState<Omit<Patient, 'id'>>({
    name: '',
    birthNumber: '',
    phone: '',
    email: '',
    address: '',
    dob: '',
    insurance: 'Samoplatca',
  });

  // STAV PRE ÚPRAVU PACIENTA
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const [patientRecords, setPatientRecords] = useState<Record<string, MedicalRecord[]>>({});

  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [previewRecord, setPreviewRecord] = useState<MedicalRecord | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const [activePhotoCategory, setActivePhotoCategory] = useState<string | null>(null);
  const [patientPhotos, setPatientPhotos] = useState<Record<string, UploadedPhoto[]>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialPatient) {
      setSelectedPatient(initialPatient);
    } else if (activePatient) {
      setSelectedPatient(activePatient);
    }
  }, [initialPatient, activePatient]);

  // 1. Pri spustení prenesieme prípadné staré dáta z localStorage do Cloudu a vyčistíme localStorage
  useEffect(() => {
    CloudRecordService.migrateLocalStorageToCloud(patients);
  }, [patients]);

  // 2. Načítanie zdravotných záznamov z Cloud Firestore pre vybraného pacienta
  useEffect(() => {
    if (!selectedPatient) return;

    let isMounted = true;
    const loadCloudRecords = async () => {
      try {
        const cloudData = await CloudRecordService.getPatientRecordsFromCloud(
          selectedPatient.id,
          selectedPatient.birthNumber
        );
        if (isMounted && cloudData && cloudData.length > 0) {
          setPatientRecords(prev => ({
            ...prev,
            [selectedPatient.id]: cloudData
          }));
        }
      } catch (err) {
        console.warn('Chyba pri načítaní záznamov z Cloudu:', err);
      }
    };

    loadCloudRecords();

    // Odber zmien pre tohto pacienta v reálnom čase z Cloud Firestore
    const unsubCloud = CloudRecordService.subscribePatientRecords(selectedPatient.id, (records) => {
      if (isMounted && records && records.length > 0) {
        setPatientRecords(prev => ({
          ...prev,
          [selectedPatient.id]: records
        }));
      }
    });

    return () => {
      isMounted = false;
      unsubCloud();
    };
  }, [selectedPatient?.id, selectedPatient?.birthNumber]);

  // 3. Počúvanie okamžitého uloženia záznamu zo systému
  useEffect(() => {
    const handleSavedRecord = (e: any) => {
      const rec = e.detail;
      if (!rec) return;

      const pId = rec.patientId;
      if (pId) {
        setPatientRecords(prev => {
          const currentList = prev[pId] || [];
          const exists = currentList.some(r => r.id === rec.id);
          const updated = exists 
            ? currentList.map(r => r.id === rec.id ? rec : r)
            : [rec, ...currentList];
          return { ...prev, [pId]: updated };
        });
      }

      if (selectedPatient && (selectedPatient.id === rec.patientId || (rec.patientBirthNumber && selectedPatient.birthNumber === rec.patientBirthNumber))) {
        setPatientRecords(prev => {
          const currentList = prev[selectedPatient.id] || [];
          const exists = currentList.some(r => r.id === rec.id);
          const updated = exists 
            ? currentList.map(r => r.id === rec.id ? rec : r)
            : [rec, ...currentList];
          return { ...prev, [selectedPatient.id]: updated };
        });
      }
    };

    window.addEventListener('say_clinic_record_saved', handleSavedRecord);
    return () => window.removeEventListener('say_clinic_record_saved', handleSavedRecord);
  }, [selectedPatient]);

  // Počúvanie požiadavky na okamžité otvorenie formulára nového pacienta (napr. z Rýchlych akcií)
  useEffect(() => {
    const handleOpenAdd = () => setIsAddingPatient(true);
    window.addEventListener('say_open_add_patient_modal', handleOpenAdd);
    return () => window.removeEventListener('say_open_add_patient_modal', handleOpenAdd);
  }, []);

  // Real-time odber pacientov, záznamov a liečebných plánov z ostatných počítačov v sieti kliniky
  useEffect(() => {
    const unsubPatients = RealtimeSyncService.subscribe('patients', (updated) => {
      if (Array.isArray(updated) && updated.length > 0) {
        setPatients(updated);
        if (onPatientsUpdated) onPatientsUpdated(updated);
      }
    });

    const unsubRecs = RealtimeSyncService.subscribe('patient_records', (updated) => {
      if (updated && typeof updated === 'object') {
        setPatientRecords(prev => ({ ...prev, ...updated }));
      }
    });

    const unsubPlans = RealtimeSyncService.subscribe('patient_plans', (updated) => {
      if (updated && typeof updated === 'object') {
        setAllPatientPlans(prev => ({ ...prev, ...updated }));
      }
    });

    return () => {
      unsubPatients();
      unsubRecs();
      unsubPlans();
    };
  }, [onPatientsUpdated]);

  // Načítanie a sledovanie spotrebovaného materiálu pre vybraného pacienta
  const refreshPatientMaterials = () => {
    if (!selectedPatient) return;
    const logs = InventoryService.getLogsForPatient(selectedPatient.id, selectedPatient.birthNumber, selectedPatient.name);
    setPatientMaterialLogs(logs);
    setAllStockItems(InventoryService.getInventory());
  };

  useEffect(() => {
    refreshPatientMaterials();
    const onMaterialLogged = () => refreshPatientMaterials();
    window.addEventListener('say_clinic_material_usage_logged', onMaterialLogged);
    window.addEventListener('say_clinic_inventory_changed', onMaterialLogged);
    return () => {
      window.removeEventListener('say_clinic_material_usage_logged', onMaterialLogged);
      window.removeEventListener('say_clinic_inventory_changed', onMaterialLogged);
    };
  }, [selectedPatient]);

  const handleDispenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !dispenseItemId) return;
    const item = allStockItems.find(i => i.id === dispenseItemId);
    if (!item) return;

    InventoryService.logMaterialUsage({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      patientBirthNumber: selectedPatient.birthNumber,
      sourceType: dispenseType,
      procedureName: dispenseProcedureName || 'Priamy výdaj materiálu',
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      quantity: Number(dispenseQuantity) || 1,
      unit: item.unit,
      lotNumber: item.lotNumber,
      performerName: 'Sestra / SAY CLINIC',
      notes: dispenseNote || 'Manuálny výdaj zo zložky pacienta'
    });

    setIsDispensingMaterial(false);
    setDispenseItemId('');
    setDispenseQuantity(1);
    setDispenseNote('');
    refreshPatientMaterials();
  };

  // Otvorenie modalu odpisu spotreby pre sestru s auto-detekciou operácie a predvýberom balíčka
  const handleOpenNurseDispense = (preferredMode: 'bundle' | 'manual' = 'bundle') => {
    if (!selectedPatient) return;
    setDispenseModalMode(preferredMode);

    // Auto-detekcia najnovšej operácie alebo výkonu pacienta zo zdravotných záznamov
    const recs = patientRecords[selectedPatient.id] || [];
    const opRecord = recs.find(r => 
      (r.type && (r.type.toLowerCase().includes('opera') || r.type.toLowerCase().includes('protokol'))) ||
      (r.title && (r.title.toLowerCase().includes('augment') || r.title.toLowerCase().includes('blefaro') || r.title.toLowerCase().includes('plastik') || r.title.toLowerCase().includes('facelift') || r.title.toLowerCase().includes('liposuk') || r.title.toLowerCase().includes('karpál') || r.title.toLowerCase().includes('labio')))
    );

    // Prípadne z kalendára
    const calOp = storedEvents.find(evt => 
      ((evt.patientId && evt.patientId === selectedPatient.id) || (evt.patientName && selectedPatient.name && evt.patientName.toLowerCase().includes(selectedPatient.name.toLowerCase()))) &&
      (evt.type === 'operacia' || (evt.title && (evt.title.toLowerCase().includes('oper') || evt.title.toLowerCase().includes('augment'))))
    );

    const detected = opRecord?.title || (opRecord as any)?.procedureName || (calOp as any)?.operationTitle || calOp?.title || '';
    setDetectedProcedureName(detected);

    // Automatický predvýber najvhodnejšieho balíčka pre sestru
    const suggested = InventoryService.suggestBundleForProcedure(detected);
    const bundleToUse = suggested ? suggested.id : 'bundle-augmentacia';
    setSelectedBundleId(bundleToUse);
    setBundleCustomQuantities({});
    setBundleDisabledItems({});
    setDispenseNote('');
    setDispenseProcedureName(detected || 'Odpis spotreby materiálu');
    setDispenseSuccessToast(null);
    setIsDispensingMaterial(true);
  };

  // 1-klikové zaevidovanie a odpis balíčka zo skladu pre pacienta
  const handleApplyBundleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !selectedBundleId) return;

    const disabledList = Object.entries(bundleDisabledItems)
      .filter(([_, disabled]) => disabled)
      .map(([id]) => id);

    const logs = InventoryService.applyBundle({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      patientBirthNumber: selectedPatient.birthNumber,
      bundleId: selectedBundleId,
      performerName: dispensePerformerName || 'Službukonajúca sestra',
      notes: dispenseNote || undefined,
      customQuantities: bundleCustomQuantities,
      disabledItems: disabledList,
    });

    refreshPatientMaterials();
    setDispenseSuccessToast(`Úspešne odpísaných ${logs.length} položiek materiálu zo skladu!`);
    setTimeout(() => {
      setDispenseSuccessToast(null);
      setIsDispensingMaterial(false);
    }, 1200);
  };

  // 1. Načítanie pacientov z lokálnej cache a realtime synchronizácia s Firestore Cloudom
  useEffect(() => {
    // Okamžité načítanie z lokálnej pamäte pre bleskový štart bez blikania
    const cached = PatientCloudService.getCachedPatients();
    if (cached.length > 0) {
      setPatients(cached);
      if (onPatientsUpdated) onPatientsUpdated(cached);
    }

    // Real-time synchronizácia s Firestore kolekciou 'patients'
    const unsubscribe = PatientCloudService.subscribePatients((cloudPatients) => {
      if (cloudPatients && cloudPatients.length > 0) {
        setPatients(cloudPatients);
        setCloudSyncStatus('synced');
        if (onPatientsUpdated) onPatientsUpdated(cloudPatients);

        // Ak je vybratý pacient zhodný s aktualizovaným, osviežime jeho detail
        setSelectedPatient(prev => {
          if (!prev) return prev;
          const found = cloudPatients.find(p => p.id === prev.id);
          return found || prev;
        });
      } else if (cached.length === 0) {
        // Iba ak je Firestore aj lokálna pamäť úplne prázdna, seedujeme počiatočných
        PatientCloudService.seedIfEmpty(MOCK_PATIENTS).then(seeded => {
          if (seeded && seeded.length > 0) {
            setPatients(seeded);
            if (onPatientsUpdated) onPatientsUpdated(seeded);
          }
        });
      }
    }, () => {
      setCloudSyncStatus('error');
    });

    return () => unsubscribe();
  }, []);

  // 2. AUTOMATICKÝ IMPORT NA POZADÍ pri prihlásení do Google účtu
  useEffect(() => {
    const userSession = session as any;
    const effectiveToken = workspaceToken || userSession?.accessToken;
    if (effectiveToken) {
      setIsImporting(true);
      const headers: Record<string, string> = {
        Authorization: `Bearer ${effectiveToken}`,
      };
      fetch('/api/drive/import', { method: 'POST', headers })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.patients) {
            const importedList: Patient[] = data.patients.map((item: any, idx: number) => ({
              id: item.id || `P-drive-${idx}`,
              name: item.name,
              birthNumber: 'Importované z Drive',
              phone: '---',
              email: '---',
              address: '---',
              dob: '---',
              insurance: 'Drive Klient',
              driveFolderLink: item.driveFolderLink
            }));

            setPatients(prev => {
              const existingNames = new Set(prev.map(p => p.name.toLowerCase().trim()));
              const uniqueNew = importedList.filter(p => !existingNames.has(p.name.toLowerCase().trim()));
              if (uniqueNew.length === 0) return prev;
              const updatedAll = [...uniqueNew, ...prev];
              // Uložíme aj do Firestore Cloudu
              for (const np of uniqueNew) {
                PatientCloudService.savePatient(np, effectiveToken);
              }
              return updatedAll;
            });
          }
        })
        .catch(err => console.error('Automatický import z Google Drive zlyhal:', err))
        .finally(() => setIsImporting(false));
    }
  }, [session, workspaceToken]);

  useEffect(() => {
    if (onPatientsUpdated) {
      onPatientsUpdated(patients);
    }
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return filterAndRankPatients(patients, searchTerm);
  }, [patients, searchTerm]);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    if (onSetActivePatient) {
      onSetActivePatient(patient);
    }
    setActiveFolder('dokumenty');
    setActivePhotoCategory(null);
    AuditLogService.log({
      category: 'PATIENT_RECORD',
      action: 'OTVORENIE ZDRAVOTNEJ KARTY',
      details: `Otvorenie karty a zdravotnej zložky pacienta: ${patient.name} (${patient.birthNumber})`,
      patientId: patient.id,
      patientName: patient.name,
      severity: 'info'
    });
  };

  // VYTVORENIE PACIENTA S AUTOMATICKÝM VYTVORENÍM ZLOŽKY NA GOOGLE DRIVE
  const handleAddPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientData.name || !newPatientData.birthNumber) return;

    let driveLink = '';
    const userSession = session as any;
    let effectiveToken = workspaceToken || userSession?.accessToken;

    if (!effectiveToken) {
      try {
        const signResult = await googleSignIn();
        if (signResult?.accessToken) {
          effectiveToken = signResult.accessToken;
        }
      } catch (err) {
        console.warn('Prihlásenie cez Google Drive zrušené alebo zlyhalo:', err);
      }
    }

    if (effectiveToken) {
      setIsCreatingDriveFolder(true);
      try {
        const res = await fetch('/api/drive/create-patient', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${effectiveToken}`,
          },
          body: JSON.stringify({ patientName: newPatientData.name }),
        });
        const data = await res.json();
        if (data.success && data.webViewLink) {
          driveLink = data.webViewLink;
        }
      } catch (err) {
        console.error('Nepodarilo sa automaticky vytvoriť zložku na Google Drive:', err);
      } finally {
        setIsCreatingDriveFolder(false);
      }
    }

    const createdPatient: Patient = {
      ...newPatientData,
      id: `P-${Date.now()}`,
      driveFolderLink: driveLink
    };

    setCloudSyncStatus('saving');
    const saveRes = await PatientCloudService.savePatient(createdPatient, effectiveToken);
    setCloudSyncStatus(saveRes.success ? 'synced' : 'error');

    const finalCreated = saveRes.patient || createdPatient;
    const updatedPatients = [finalCreated, ...patients.filter(p => p.id !== finalCreated.id)];
    setPatients(updatedPatients);
    if (onPatientsUpdated) onPatientsUpdated(updatedPatients);
    
    setIsAddingPatient(false);
    const createdName = newPatientData.name;
    setNewPatientData({
      name: '',
      birthNumber: '',
      phone: '',
      email: '',
      address: '',
      dob: '',
      insurance: 'Samoplatca',
    });

    handlePatientSelect(finalCreated);

    if (driveLink) {
      setDriveStatusMessage({
        type: 'success',
        text: `Pacient "${createdName}" bol natrvalo uložený do Firestore Cloudu a jeho zložka na Google Disku bola pripravená.`,
      });
      setTimeout(() => setDriveStatusMessage(null), 6000);
    }
  };

  // ULOŽENIE ÚPRAVY PACIENTA (NATRVALO DO FIRESTORE & GOOGLE DRIVE)
  const handleSavePatientEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;

    const userSession = session as any;
    const effectiveToken = workspaceToken || userSession?.accessToken;

    setCloudSyncStatus('saving');
    const saveRes = await PatientCloudService.savePatient(editingPatient, effectiveToken);
    setCloudSyncStatus(saveRes.success ? 'synced' : 'error');

    const finalPatient = saveRes.patient || editingPatient;
    const updatedPatients = patients.map(p => p.id === editingPatient.id ? finalPatient : p);
    setPatients(updatedPatients);
    if (onPatientsUpdated) onPatientsUpdated(updatedPatients);

    if (selectedPatient && selectedPatient.id === editingPatient.id) {
      setSelectedPatient(finalPatient);
    }
    if (onSetActivePatient && selectedPatient && selectedPatient.id === editingPatient.id) {
      onSetActivePatient(finalPatient);
    }

    AuditLogService.log({
      category: 'PATIENT_RECORD',
      action: 'ÚPRAVA ZDRAVOTNEJ KARTY',
      details: `Aktualizácia údajov a anamnézy pacienta: ${finalPatient.name} (${finalPatient.birthNumber})`,
      patientId: finalPatient.id,
      patientName: finalPatient.name,
      severity: 'info'
    });

    setEditingPatient(null);
  };

  // VYNÚTENÁ SYNCHRONIZÁCIA KARTOTÉKY DO CLOUDU AJ GOOGLE DRIVE
  const handleForceSyncDriveAndCloud = async () => {
    let token = workspaceToken || (session as any)?.accessToken;
    if (!token) {
      try {
        const res = await googleSignIn();
        if (res?.accessToken) {
          token = res.accessToken;
          setExternalAccessToken(res.accessToken, res.user);
        }
      } catch {
        // ignore
      }
    }

    setIsDriveSyncing(true);
    setCloudSyncStatus('syncing');
    try {
      for (const p of patients) {
        await PatientCloudService.savePatient(p, token);
      }
      setCloudSyncStatus('synced');
      setDriveStatusMessage({
        type: 'success',
        text: `Všetky karty pacientov (${patients.length}) boli úspešne uložené do Firestore Cloudu a zosynchronizované s Google Diskom.`,
      });
      setTimeout(() => setDriveStatusMessage(null), 5000);
    } catch (err: any) {
      setCloudSyncStatus('error');
      setDriveStatusMessage({
        type: 'error',
        text: 'Synchronizácia zlyhala: ' + (err?.message || 'Neznáma chyba'),
      });
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const handleRunDriveImport = async () => {
    setDriveStatusMessage(null);
    let token = workspaceToken || (session as any)?.accessToken;
    if (!token) {
      try {
        const res = await googleSignIn();
        if (res?.accessToken) {
          token = res.accessToken;
          setExternalAccessToken(res.accessToken, res.user);
        }
      } catch {
        setDriveStatusMessage({
          type: 'error',
          text: 'Pre import z Google Disku sa prosím prihláste cez Google účet.',
        });
        return;
      }
    }

    if (!token) {
      setDriveStatusMessage({
        type: 'error',
        text: 'Pre import z Google Disku sa prosím prihláste cez Google účet.',
      });
      return;
    }

    setIsImporting(true);

    try {
      let res = await fetch('/api/drive/import', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      let data = await res.json();

      // Ak token vypršal (401), automaticky vyžiadame obnovenie cez Google popup
      if (res.status === 401 || data?.needsReauth) {
        setExternalAccessToken(null);
        const signRes = await googleSignIn();
        if (signRes?.accessToken) {
          token = signRes.accessToken;
          setExternalAccessToken(signRes.accessToken, signRes.user);
          res = await fetch('/api/drive/import', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          data = await res.json();
        } else {
          setDriveStatusMessage({
            type: 'error',
            text: 'Platnosť pripojenia ku Google Drive vypršala. Kliknite na "Pripojiť Drive" pre obnovenie.',
          });
          return;
        }
      }

      if (res.ok && data.success && data.patients) {
        const importedList: Patient[] = data.patients.map((item: any, idx: number) => ({
          id: item.id || `P-drive-${idx}`,
          name: item.name,
          birthNumber: 'Importované z Drive',
          phone: '---',
          email: '---',
          address: '---',
          dob: '---',
          insurance: 'Drive Klient',
          driveFolderLink: item.driveFolderLink
        }));

        setPatients(prev => {
          const existingNames = new Set(prev.map(p => p.name.toLowerCase().trim()));
          const uniqueNew = importedList.filter(p => !existingNames.has(p.name.toLowerCase().trim()));
          if (uniqueNew.length === 0) return prev;
          const updatedAll = [...uniqueNew, ...prev];
          for (const np of uniqueNew) {
            PatientCloudService.savePatient(np, token);
          }
          return updatedAll;
        });

        setDriveStatusMessage({
          type: 'success',
          text: `Úspešne sa synchronizovalo ${data.totalImported} kariet klientov zo zložky "${data.parentFolderName || 'Klienti SAY'}" na Google Disku.`,
        });
        setTimeout(() => setDriveStatusMessage(null), 6000);
      } else {
        setDriveStatusMessage({
          type: 'error',
          text: `Chyba synchronizácie: ${data.error || 'Nepodarilo sa načítať zložku Klienti SAY'}`,
        });
      }
    } catch (err) {
      console.error(err);
      setDriveStatusMessage({
        type: 'error',
        text: 'Chyba pri komunikácii s Google Drive API.',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!selectedPatient) return;
    if (confirm('Naozaj chcete natrvalo vymazať tento záznam z Cloud databázy?')) {
      await CloudRecordService.deleteRecordFromCloud(recordId, selectedPatient.id);
      setPatientRecords(prev => ({
        ...prev,
        [selectedPatient.id]: (prev[selectedPatient.id] || []).filter(r => r.id !== recordId)
      }));
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedPatient || !editingRecord) return;
    await CloudRecordService.updateRecordInCloud(editingRecord as any);
    setPatientRecords(prev => ({
      ...prev,
      [selectedPatient.id]: (prev[selectedPatient.id] || []).map(r => r.id === editingRecord.id ? editingRecord : r)
    }));
    setEditingRecord(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedPatient || !activePhotoCategory) return;
    const newFiles: UploadedPhoto[] = Array.from(e.target.files).map(f => ({
      name: f.name,
      url: URL.createObjectURL(f)
    }));
    const key = `${selectedPatient.id}_${activePhotoCategory}`;
    setPatientPhotos(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), ...newFiles]
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style type="text/css" media="print">
        {`
          @page { size: A4; margin: 0; }
          body * { visibility: hidden !important; }
          #printable-a4, #printable-a4 * { visibility: visible !important; }
          #printable-a4 {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            margin: 0 !important;
            padding: 20mm !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            z-index: 99999 !important;
          }
        `}
      </style>

      <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm min-h-[600px] relative print:border-none print:shadow-none print:p-0 print:static">
        {driveStatusMessage && (
          <div
            className={`mb-4 p-3.5 rounded-xl text-xs font-medium flex items-center justify-between gap-3 print:hidden ${
              driveStatusMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border border-amber-200 text-amber-900'
            }`}
          >
            <span>{driveStatusMessage.text}</span>
            <button
              type="button"
              onClick={() => setDriveStatusMessage(null)}
              className="text-xs font-bold opacity-70 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
        
        {/* MODAL: PRIDANIE NOVÉHO PACIENTA */}
        {isAddingPatient && (
          <div className="fixed inset-0 bg-[#2C2A29]/60 flex items-center justify-center z-50 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-xl border border-[#E8E2D9]">
              <div className="border-b border-[#E8E2D9] pb-3 mb-4 flex justify-between items-center">
                <div>
                  <h3 className="font-brand text-xl font-bold text-[#2C2A29] uppercase">Zaevidovať nového pacienta</h3>
                  <p className="text-[10px] text-[#8C857B] uppercase tracking-wider">
                    Vytvorenie karty & zložky v Klienti SAY na Google Disku
                  </p>
                </div>
                <button onClick={() => setIsAddingPatient(false)} className="text-xs text-[#8C857B] hover:text-[#2C2A29] font-bold">✕</button>
              </div>

              <form onSubmit={handleAddPatientSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Meno a priezvisko *</label>
                    <input type="text" required placeholder="napr. Mária Kováčová" value={newPatientData.name} onChange={e => setNewPatientData({...newPatientData, name: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Rodné číslo *</label>
                    <input type="text" required placeholder="885512/6789" value={newPatientData.birthNumber} onChange={e => setNewPatientData({...newPatientData, birthNumber: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Telefónne číslo</label>
                    <input type="text" placeholder="+421 905 123 456" value={newPatientData.phone} onChange={e => setNewPatientData({...newPatientData, phone: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Email</label>
                    <input type="email" placeholder="pacient@email.sk" value={newPatientData.email} onChange={e => setNewPatientData({...newPatientData, email: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Bydlisko</label>
                  <input type="text" placeholder="Ulica, Mesto, PSČ" value={newPatientData.address} onChange={e => setNewPatientData({...newPatientData, address: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Dátum narodenia</label>
                    <input type="text" placeholder="12.05.1988" value={newPatientData.dob} onChange={e => setNewPatientData({...newPatientData, dob: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Poisťovňa</label>
                    <select value={newPatientData.insurance} onChange={e => setNewPatientData({...newPatientData, insurance: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]">
                      <option value="Samoplatca">Samoplatca</option>
                      <option value="24 (Dôvera)">24 (Dôvera)</option>
                      <option value="25 (VšZP)">25 (VšZP)</option>
                      <option value="27 (Union)">27 (Union)</option>
                    </select>
                  </div>
                </div>

                {/* INFO O AUTOMATICKOM VYTVORENÍ V GOOGLE DRIVE */}
                <div className="bg-[#FAF8F5] border border-[#E8E2D9] p-3 rounded-xl flex items-center gap-3 mt-1">
                  <span className="text-xl flex-shrink-0">📁</span>
                  <div className="flex-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-[#2C2A29]">
                        Uloženie do Google Disku: Klienti SAY
                      </p>
                      {Boolean(workspaceToken || (session as any)?.accessToken) ? (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full whitespace-nowrap">✓ Drive pripojený</span>
                      ) : (
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full whitespace-nowrap">Vyžaduje Google účet</span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#8C857B] mt-0.5 leading-tight">
                      Vytvorí sa priečinok s menom pacienta a podzložkami: <strong>Fotodokumentácia</strong>, <strong>Dokumentácia</strong>, <strong>Predoperačné vyšetrenia</strong> a <strong>Súhlasy a protokoly</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#E8E2D9] mt-4">
                  <button type="button" onClick={() => setIsAddingPatient(false)} className="px-4 py-2 text-xs font-bold text-[#8C857B] hover:text-[#2C2A29]">ZRUŠIŤ</button>
                  <button type="submit" disabled={isCreatingDriveFolder} className="px-5 py-2 bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-colors shadow-sm flex items-center gap-2">
                    {isCreatingDriveFolder ? '⏳ Vytváram zložky v Google Drive...' : '+ Uložiť & Vytvoriť zložky v Drive'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ÚPRAVA PACIENTA */}
        {editingPatient && (
          <div className="fixed inset-0 bg-[#2C2A29]/60 flex items-center justify-center z-50 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-xl border border-[#E8E2D9]">
              <div className="border-b border-[#E8E2D9] pb-3 mb-4 flex justify-between items-center">
                <div>
                  <h3 className="font-brand text-xl font-bold text-[#2C2A29] uppercase">Upraviť kartu pacienta</h3>
                  <p className="text-[10px] text-[#8C857B] uppercase tracking-wider">Úprava osobných údajov</p>
                </div>
                <button onClick={() => setEditingPatient(null)} className="text-xs text-[#8C857B] hover:text-[#2C2A29] font-bold">✕</button>
              </div>

              <form onSubmit={handleSavePatientEdit} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Meno a priezvisko *</label>
                    <input type="text" required value={editingPatient.name} onChange={e => setEditingPatient({...editingPatient, name: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Rodné číslo *</label>
                    <input type="text" required value={editingPatient.birthNumber} onChange={e => setEditingPatient({...editingPatient, birthNumber: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Telefónne číslo</label>
                    <input type="text" value={editingPatient.phone} onChange={e => setEditingPatient({...editingPatient, phone: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Email</label>
                    <input type="email" value={editingPatient.email} onChange={e => setEditingPatient({...editingPatient, email: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Bydlisko</label>
                  <input type="text" value={editingPatient.address} onChange={e => setEditingPatient({...editingPatient, address: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Dátum narodenia</label>
                    <input type="text" value={editingPatient.dob} onChange={e => setEditingPatient({...editingPatient, dob: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Poisťovňa</label>
                    <select value={editingPatient.insurance} onChange={e => setEditingPatient({...editingPatient, insurance: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]">
                      <option value="24 (Dôvera)">24 (Dôvera)</option>
                      <option value="25 (VšZP)">25 (VšZP)</option>
                      <option value="27 (Union)">27 (Union)</option>
                      <option value="Samoplatca">Samoplatca</option>
                      <option value="Drive Klient">Drive Klient</option>
                    </select>
                  </div>
                </div>

                <div className="bg-[#FAF8F5] border border-[#E8E2D9] p-3 rounded-xl flex items-center gap-2.5 mt-2">
                  <Cloud className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
                  <p className="text-[10px] text-[#8C857B] leading-tight">
                    <strong className="text-[#2C2A29]">Trvalé uloženie:</strong> Všetky reálne údaje sa natrvalo ukladajú do Firestore Cloudu a synchronizujú s Google Drive. Už sa nikdy nevrátia vymyslené hodnoty.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#E8E2D9] mt-4">
                  <button type="button" onClick={() => setEditingPatient(null)} className="px-4 py-2 text-xs font-bold text-[#8C857B] hover:text-[#2C2A29] cursor-pointer">ZRUŠIŤ</button>
                  <button type="submit" disabled={cloudSyncStatus === 'saving'} className="px-5 py-2 bg-[#C5A059] hover:bg-[#b08d4b] text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer">
                    {cloudSyncStatus === 'saving' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Ukladám do Cloudu...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Uložiť reálne údaje</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ÚPRAVA ZÁZNAMU */}
        {editingRecord && (
          <div className="fixed inset-0 bg-[#2C2A29]/60 flex items-center justify-center z-50 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl border border-[#E8E2D9]">
              <h3 className="font-brand text-xl font-bold text-[#2C2A29] mb-4 uppercase">Upraviť záznam</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Typ dokumentu</label>
                  <input type="text" value={editingRecord.type} onChange={e => setEditingRecord({...editingRecord, type: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Názov zákroku</label>
                  <input type="text" value={editingRecord.title} onChange={e => setEditingRecord({...editingRecord, title: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Dátum</label>
                  <input type="date" value={editingRecord.date} onChange={e => setEditingRecord({...editingRecord, date: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Text záznamu</label>
                  <textarea rows={4} value={editingRecord.content} onChange={e => setEditingRecord({...editingRecord, content: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setEditingRecord(null)} className="px-4 py-2 text-xs font-bold text-[#8C857B] hover:text-[#2C2A29]">ZRUŠIŤ</button>
                <button onClick={handleSaveEdit} className="px-4 py-2 bg-[#C5A059] text-white text-xs font-bold rounded-lg uppercase">ULOŽIŤ ZMENY</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: NÁHĽAD A TLAČ */}
        {previewRecord && selectedPatient && (
          <div className="fixed inset-0 bg-[#2C2A29]/80 flex items-start justify-center z-50 p-6 backdrop-blur-sm overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0 print:block print:overflow-visible">
            <div className="bg-[#FBF9F6] p-6 rounded-2xl w-full max-w-3xl shadow-xl flex flex-col relative my-8 print:p-0 print:border-none print:shadow-none print:m-0 print:block print:static">
              
              <div className="flex justify-between items-center mb-4 print:hidden">
                <h3 className="font-brand text-lg font-bold text-[#2C2A29] uppercase">Náhľad historického dokumentu</h3>
                <div className="flex gap-2">
                  <button onClick={() => setPreviewRecord(null)} className="px-4 py-2 bg-white border border-[#E8E2D9] rounded-xl text-xs font-bold text-[#8C857B] hover:text-[#2C2A29] shadow-sm">
                    Zavrieť
                  </button>
                  <button onClick={handlePrint} className="bg-[#C5A059] hover:bg-[#b08d48] text-white text-xs font-bold uppercase px-4 py-2 rounded-xl transition-colors shadow-sm">
                    🖨️ Tlačiť dokument
                  </button>
                </div>
              </div>
              
              <div id="printable-a4" ref={printRef} className="bg-white border border-[#E8E2D9] p-10 shadow-sm text-xs leading-relaxed mx-auto w-full max-w-[595px] print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full">
                <div className="border-b border-[#E8E2D9] pb-6 mb-6 flex justify-between items-start">
                  <div>
                    <h2 className="font-brand text-2xl font-light tracking-widest uppercase text-[#2C2A29]">SAY CLINIC</h2>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#C5A059] font-bold mt-1">PLASTICKÁ CHIRURGIA & DERMATOLÓGIA</p>
                    <p className="text-[10px] text-[#8C857B] mt-1">Lazovná 43, 974 01 Banská Bystrica</p>
                  </div>
                  <div className="text-right text-[10px] text-[#8C857B]">
                    <span className={`text-white px-2 py-1 rounded text-[8px] uppercase tracking-wider font-bold ${previewRecord.typeColor}`}>
                      {previewRecord.type}
                    </span>
                    <p className="font-bold text-[#2C2A29] mt-2 text-sm">{previewRecord.doctor}</p>
                    <p className="mt-1">Dátum: {new Date(previewRecord.date).toLocaleDateString('sk-SK')}</p>
                  </div>
                </div>

                <div className="bg-[#FBF9F6] p-4 rounded-xl mb-6 border border-[#E8E2D9] text-xs space-y-2">
                  <p><strong className="text-[#8C857B] uppercase text-[9px] tracking-wider">Pacient:</strong> <span className="text-sm font-bold ml-2">{selectedPatient.name}</span></p>
                  <p><strong className="text-[#8C857B] uppercase text-[9px] tracking-wider">Rodné číslo:</strong> <span className="ml-2 font-mono">{selectedPatient.birthNumber}</span></p>
                  <p><strong className="text-[#8C857B] uppercase text-[9px] tracking-wider">Diagnóza:</strong> <span className="ml-2">{previewRecord.diagnosis || '---'}</span></p>
                </div>

                <div className="space-y-3 mb-8">
                  <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1">Názov výkonu / Zákroku:</p>
                  <p className="text-sm font-bold text-[#2C2A29]">{previewRecord.title}</p>
                </div>

                <div className="space-y-2 mb-8 flex-1">
                  <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1">Lekársky nález / Dekurzus:</p>
                  <div className="whitespace-pre-line text-sm text-[#2C2A29] leading-relaxed pt-2">
                    {previewRecord.content}
                  </div>
                </div>

                <div className="mt-16 pt-8 border-t border-[#E8E2D9] flex justify-between items-end text-[10px] text-[#8C857B]">
                  <div>
                    <p className="font-bold text-[#C5A059] mb-1">www.sayclinic.sk</p>
                    <p>Výpis z historickej databázy SAY CLINIC</p>
                  </div>
                  <div className="text-center">
                    <div className="w-40 border-b border-[#2C2A29] mb-2"></div>
                    <span className="font-bold text-[#2C2A29]">{previewRecord.doctor}</span><br />
                    Pečiatka a podpis lekára
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* POHĽAD 1: ZOZNAM PACIENTOV */}
        {!selectedPatient ? (
          <div className="space-y-6 print:hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#E8E2D9] pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-brand text-2xl font-bold text-[#2C2A29] uppercase">Kartotéka Pacientov</h2>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF8F5] border border-[#E8E2D9] text-[10px] font-medium text-[#2C2A29]">
                    {cloudSyncStatus === 'saving' || cloudSyncStatus === 'syncing' ? (
                      <>
                        <Loader2 className="w-3 h-3 text-[#C5A059] animate-spin" />
                        <span className="text-[#C5A059] font-bold">Ukladám do Cloudu...</span>
                      </>
                    ) : cloudSyncStatus === 'error' ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        <span className="text-rose-700 font-semibold">Chyba spojenia</span>
                      </>
                    ) : (
                      <>
                        <Cloud className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-800 font-bold">Firestore Cloud: Uložené</span>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDriveModal(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold cursor-pointer transition-all hover:border-[#C5A059]"
                    title="Správa Google Drive zložiek a pripojenia"
                  >
                    {Boolean(workspaceToken || (session as any)?.accessToken) ? (
                      <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ✓ Google Drive
                      </span>
                    ) : (
                      <span className="text-[#8C857B] hover:text-[#2C2A29] flex items-center gap-1">
                        <HardDrive className="w-3 h-3 text-[#C5A059]" />
                        <span>Pripojiť Drive</span>
                      </span>
                    )}
                  </button>
                </div>
                <p className="text-[10px] uppercase tracking-widest text-[#8C857B] mt-1">
                  Evidovaní klienti a ich zdravotná história ({patients.length})
                  {isImporting && <span className="ml-2 text-[#C5A059] font-bold animate-pulse">Synchronizujem s Google Drive...</span>}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <button 
                  onClick={handleForceSyncDriveAndCloud}
                  disabled={isDriveSyncing || isImporting}
                  className="bg-white hover:bg-[#FAF8F5] text-[#2C2A29] border border-[#E8E2D9] px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
                  title="Uložiť a synchronizovať všetkých pacientov do Firestore Cloudu aj Google Drive"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#C5A059] ${isDriveSyncing || isImporting ? 'animate-spin' : ''}`} />
                  <span>{isDriveSyncing ? 'Synchronizujem...' : 'Synchronizovať Cloud & Drive'}</span>
                </button>

                <button 
                  onClick={() => setIsAddingPatient(true)}
                  className="bg-[#2C2A29] hover:bg-[#C5A059] text-white px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  + Nový pacient
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-[#8C857B] absolute left-3.5 pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="Vyhľadať pacienta po mene (aj bez diakritiky / s preklepom), RČ alebo telefóne..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full border border-[#E8E2D9] pl-10 pr-10 py-3 rounded-xl bg-[#FBF9F6] text-xs text-[#2C2A29] placeholder-[#8C857B]/70 focus:ring-2 focus:ring-[#C5A059] focus:bg-white outline-none transition-all shadow-2xs" 
                />
                {searchTerm && (
                  <button 
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 p-1 text-[#8C857B] hover:text-[#2C2A29] rounded-full hover:bg-[#E8E2D9]/50 transition-colors"
                    title="Zmazať vyhľadávanie"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {searchTerm.trim().length > 0 && (
                <div className="flex flex-wrap items-center justify-between text-[11px] text-[#8C857B] px-1 gap-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Inteligentné vyhľadávanie: <strong>bez diakritiky & s toleranciou preklepov</strong></span>
                  </div>
                  <span>
                    Nájdených <strong>{filteredPatients.length}</strong> {filteredPatients.length === 1 ? 'pacient' : filteredPatients.length >= 2 && filteredPatients.length <= 4 ? 'pacienti' : 'pacientov'} z {patients.length}
                  </span>
                </div>
              )}
            </div>
            
            {filteredPatients.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-[#E8E2D9] rounded-2xl bg-[#FAF8F5]">
                <p className="text-sm font-bold text-[#2C2A29] mb-1">Žiadny pacient nebol nájdený</p>
                <p className="text-xs text-[#8C857B] max-w-md mx-auto mb-4">
                  Pre výraz <strong>„{searchTerm}“</strong> sme nenašli žiadnu zhodu. Skúste zadať časť priezviska, mena, rodné číslo bez lomítka alebo telefónne číslo.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="bg-[#2C2A29] text-white hover:bg-[#C5A059] px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-2xs"
                >
                  Vymazať vyhľadávanie
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4">
                {filteredPatients.map(patient => {
                  const isCurrentActive = activePatient && activePatient.id === patient.id;
                  return (
                    <div 
                      key={patient.id} 
                      className={`border p-4 rounded-xl hover:shadow-md transition-all group flex flex-col justify-between ${
                        isCurrentActive 
                          ? 'border-[#C5A059] bg-[#FAF8F5] ring-2 ring-[#C5A059]/30 shadow-xs' 
                          : 'border-[#E8E2D9] hover:border-[#C5A059] bg-white'
                      }`}
                    >
                      <div onClick={() => handlePatientSelect(patient)} className="cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-[#2C2A29] group-hover:text-[#C5A059] transition-colors">{patient.name}</h3>
                            {isCurrentActive && (
                              <span className="text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                Rozpracovaný
                              </span>
                            )}
                            {patient._isFuzzyMatch && (
                              <span className="text-[9px] bg-[#C5A059]/15 text-[#9C7D2B] px-1.5 py-0.5 rounded font-medium border border-[#C5A059]/30" title="Nájdené vďaka tolerancii preklepov">
                                Preklep tolerovaný
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] bg-[#FBF9F6] px-2 py-1 rounded text-[#8C857B] font-bold border border-[#E8E2D9]">{patient.insurance}</span>
                        </div>
                        <p className="text-xs text-[#8C857B]">RČ: {patient.birthNumber}</p>
                        <p className="text-xs text-[#8C857B]">Tel: {patient.phone}</p>
                      </div>

                    <div className="mt-3 pt-3 border-t border-[#E8E2D9] flex justify-between items-center text-[10px] gap-1">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPatient(patient);
                          }}
                          className="text-[#8C857B] hover:text-[#C5A059] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3 text-[#C5A059]" />
                          <span>Upraviť</span>
                        </button>

                        {onNavigateToPrescriptions && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToPrescriptions(patient);
                            }}
                            className="text-emerald-700 hover:text-emerald-800 font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 border-l border-[#E8E2D9] pl-2 cursor-pointer"
                            title="Vystaviť lekársky recept ŠEVT 14 282 2s"
                          >
                            <Pill className="w-3 h-3 text-emerald-600" />
                            <span>Recept</span>
                          </button>
                        )}

                        {onNavigateToAesthetics && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToAesthetics(patient);
                            }}
                            className="text-[#C5A059] hover:text-[#9C7D2B] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 border-l border-[#E8E2D9] pl-2 cursor-pointer"
                          >
                            <Syringe className="w-3 h-3 text-[#C5A059]" />
                            <span>Výplne & Botox</span>
                          </button>
                        )}
                      </div>

                      <button 
                        onClick={() => handlePatientSelect(patient)}
                        className="text-[#2C2A29] font-bold uppercase tracking-wider group-hover:text-[#C5A059]"
                      >
                        Otvoriť →
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        ) : (
          
          /* POHĽAD 2: KARTA PACIENTA */
          <div className="space-y-6 print:hidden">
            <button onClick={() => setSelectedPatient(null)} className="text-[10px] uppercase font-bold text-[#8C857B] hover:text-[#2C2A29] flex items-center gap-1 transition-colors">
              ← Späť na zoznam pacientov
            </button>

            {/* HLAVNÁ IDENTIFIKÁCIA PACIENTA */}
            <div className="bg-[#FBF9F6] border border-[#E8E2D9] p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-brand text-2xl font-bold text-[#2C2A29] uppercase tracking-wide">
                    {selectedPatient.name}
                  </h2>
                  <button 
                    type="button"
                    onClick={() => setEditingPatient(selectedPatient)}
                    className="text-xs bg-white border border-[#E8E2D9] px-2.5 py-1 rounded-lg text-[#8C857B] hover:text-[#C5A059] font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Upraviť profil</span>
                  </button>
                  <button 
                    type="button"
                    onClick={toggleTimeline}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer ${
                      isTimelineOpen 
                        ? 'bg-[#2C2A29] text-white border-[#2C2A29]' 
                        : 'bg-white border-[#E8E2D9] text-[#8C857B] hover:text-[#C5A059] hover:border-[#C5A059]'
                    }`}
                    title={isTimelineOpen ? 'Skryť bočný panel časovej osi' : 'Zobraziť časovú os a riziká'}
                  >
                    <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>{isTimelineOpen ? 'Časová os (Otvorená)' : 'Časová os & Riziká'}</span>
                  </button>
                  {activePatient && activePatient.id === selectedPatient.id && (
                    <span className="text-[10px] bg-emerald-600 text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                      Aktívny v celom systéme
                    </span>
                  )}

                  {/* SÚBEŽNÍ SPOLUPRACOVNÍCI NA KARTE PACIENTA */}
                  {patientConcurrentUsers.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-[#C5A059]/40 shadow-xs animate-in fade-in duration-200">
                      <div className="flex -space-x-2 overflow-hidden shrink-0">
                        {patientConcurrentUsers.map(u => (
                          <div 
                            key={u.userId} 
                            className="relative inline-block w-6 h-6 rounded-full ring-2 ring-white shadow-xs overflow-hidden" 
                            title={`${u.userName} (${u.userTitle || u.userRole}) práve pracuje na tomto pacientovi`}
                          >
                            <LiquidAvatar id={u.userId} name={u.userName} role={u.userRole as any} avatarUrl={u.avatarUrl} className="w-full h-full" />
                            <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-white animate-pulse" />
                          </div>
                        ))}
                      </div>
                      <div className="text-[11px] leading-tight">
                        <span className="text-[#8C857B] font-bold">V karte súbežne: </span>
                        <span className="text-[#2C2A29] font-bold">
                          {patientConcurrentUsers.map(u => `${u.userName} (${u.userRole === 'nurse' || u.userRole === 'receptionist' ? 'Sestra' : 'Lekár'})`).join(', ')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold mt-1">
                  Zdravotná karta & 360° Centrum pacienta
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-xs bg-white p-3 rounded-xl border border-[#E8E2D9] shadow-2xs">
                <div><span className="text-[#8C857B] block text-[9px] uppercase font-bold">Rodné číslo:</span><span className="font-mono font-bold text-[#2C2A29]">{selectedPatient.birthNumber}</span></div>
                <div><span className="text-[#8C857B] block text-[9px] uppercase font-bold">Dátum nar.:</span><span className="font-semibold text-[#2C2A29]">{selectedPatient.dob || '—'}</span></div>
                <div><span className="text-[#8C857B] block text-[9px] uppercase font-bold">Poisťovňa:</span><span className="font-semibold text-[#2C2A29]">{selectedPatient.insurance}</span></div>
                <div><span className="text-[#8C857B] block text-[9px] uppercase font-bold">Telefón:</span><span className="font-semibold text-[#2C2A29]">{selectedPatient.phone}</span></div>
                <div><span className="text-[#8C857B] block text-[9px] uppercase font-bold">Email:</span><span className="font-semibold text-[#2C2A29] truncate max-w-[140px] block">{selectedPatient.email || '—'}</span></div>
                <div><span className="text-[#8C857B] block text-[9px] uppercase font-bold">Bydlisko:</span><span className="font-semibold text-[#2C2A29] truncate max-w-[140px] block">{selectedPatient.address}</span></div>
              </div>
            </div>

            {/* ŠTÍHLA KLINICKÁ AKČNÁ LIŠTA (RÝCHLE AKCIE PACIENTA V 3 TEMATICKÝCH SKUPINÁCH - VŠETKO PRIAMO VIDITEĽNÉ) */}
            <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl p-3.5 shadow-2xs space-y-2.5">
              {/* Hlavička lišty */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E2D9]/70 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#C5A059] flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-[#E8E2D9] shadow-2xs">
                    <span>⚡</span>
                    <span className="font-brand">Rýchle akcie</span>
                  </span>
                  <span className="text-xs font-medium text-[#6B6357]">
                    Okamžitý prístup k vyšetreniam, receptom, estetike a plánovaniu bez skrytých položiek
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#8C857B]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Priame klinické spúšťače</span>
                </div>
              </div>

              {/* 3 Tematické skupiny: Dokumentácia, Estetika a Plánovanie */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. SKUPINA: DOKUMENTÁCIA & PREDPIS */}
                <div className="bg-white rounded-xl border border-[#E8E2D9] p-2.5 flex flex-col justify-between gap-2 shadow-2xs hover:border-[#C5A059]/40 transition-colors">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#F5F2EB]">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#2C2A29] uppercase tracking-wider font-brand">
                      <span className="w-2 h-2 rounded-full bg-[#C5A059]"></span>
                      <span>Dokumentácia & Predpis</span>
                    </div>
                    <span className="text-[9px] uppercase font-semibold text-[#8C857B] bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E8E2D9]">3 akcie</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {/* + Nová správa / Nález */}
                    <button
                      type="button"
                      onClick={() => onNavigateToGenerator?.(selectedPatient)}
                      className="w-full px-3 py-2 rounded-lg bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold transition-all shadow-2xs flex items-center justify-between group cursor-pointer"
                      title="Vytvoriť lekársku správu, dekurzus alebo operačný protokol"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-[#C5A059] group-hover:text-white transition-colors shrink-0" />
                        <span>+ Nová správa / Nález</span>
                      </span>
                      <span className="text-[9px] text-[#C5A059] group-hover:text-white/90 font-mono tracking-wider">GEN</span>
                    </button>

                    {/* Vystaviť recept ŠEVT */}
                    {onNavigateToPrescriptions && (
                      <button
                        type="button"
                        onClick={() => onNavigateToPrescriptions(selectedPatient)}
                        className="w-full px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200 text-emerald-950 text-xs font-semibold transition-all shadow-2xs flex items-center justify-between cursor-pointer"
                        title="Vystaviť lekársky recept ŠEVT 14 282 2s pre tohto pacienta"
                      >
                        <span className="flex items-center gap-2">
                          <Pill className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>Vystaviť recept ŠEVT</span>
                        </span>
                        <span className="text-[9px] text-emerald-700 font-mono">ŠEVT</span>
                      </button>
                    )}

                    {/* Dermatologické vyšetrenie */}
                    <button
                      type="button"
                      onClick={() => onNavigateToGenerator?.({ ...selectedPatient, initialDocType: 'dermatologicke_vysetrenie' })}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-white border border-[#E8E2D9] hover:border-violet-300 text-[#2C2A29] text-xs font-medium transition-all shadow-2xs flex items-center justify-between cursor-pointer"
                      title="Dermatoskopia, fototyp & dermatologický protokol"
                    >
                      <span className="flex items-center gap-2">
                        <Stethoscope className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                        <span>Dermatologické vyš.</span>
                      </span>
                      <span className="text-[9px] text-violet-700/80 font-mono">Dermato</span>
                    </button>
                  </div>
                </div>

                {/* 2. SKUPINA: ESTETIKA & DIAGNOSTIKA */}
                <div className="bg-white rounded-xl border border-[#E8E2D9] p-2.5 flex flex-col justify-between gap-2 shadow-2xs hover:border-[#C5A059]/40 transition-colors">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#F5F2EB]">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#2C2A29] uppercase tracking-wider font-brand">
                      <span className="w-2 h-2 rounded-full bg-[#C5A059]"></span>
                      <span>Estetika & Diagnostika</span>
                    </div>
                    <span className="text-[9px] uppercase font-semibold text-[#8C857B] bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E8E2D9]">2 akcie</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {/* Výplne & Botox (Face Mapping) */}
                    {onNavigateToAesthetics && (
                      <button
                        type="button"
                        onClick={() => onNavigateToAesthetics(selectedPatient)}
                        className="w-full px-3 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#C5A059] text-[#2C2A29] text-xs font-bold transition-all shadow-2xs flex items-center justify-between cursor-pointer group"
                        title="Aplikovať botulotoxín alebo dermálnu výplň v interaktívnej 3D mape tváre"
                      >
                        <span className="flex items-center gap-2">
                          <Syringe className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                          <span>Výplne & Botox</span>
                        </span>
                        <span className="text-[9px] text-[#C5A059] font-mono tracking-wider">3D Face</span>
                      </button>
                    )}

                    {/* Meicet Pro-A (Skin AI) */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFolder('diagnostika');
                        setDiagnostikaSubTab('meicet');
                      }}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-[#2C2A29] text-xs font-medium transition-all shadow-2xs flex items-center justify-between cursor-pointer"
                      title="3D spektrálna analýza pleti Meicet Pro-A"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                        <span>Meicet Pro-A (Skin AI)</span>
                      </span>
                      <span className="text-[9px] text-[#8C857B] font-mono">Spektro</span>
                    </button>
                  </div>
                </div>

                {/* 3. SKUPINA: PLÁNOVANIE & POKLADŇA */}
                <div className="bg-white rounded-xl border border-[#E8E2D9] p-2.5 flex flex-col justify-between gap-2 shadow-2xs hover:border-[#C5A059]/40 transition-colors">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#F5F2EB]">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#2C2A29] uppercase tracking-wider font-brand">
                      <span className="w-2 h-2 rounded-full bg-[#C5A059]"></span>
                      <span>Plánovanie & Pokladňa</span>
                    </div>
                    <span className="text-[9px] uppercase font-semibold text-[#8C857B] bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E8E2D9]">3 akcie</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {/* Naplánovať termín / Sálu */}
                    <button
                      type="button"
                      onClick={() => handleOpenScheduleModal()}
                      className="w-full px-3 py-1.5 rounded-lg bg-sky-50/70 hover:bg-sky-100/80 border border-sky-200/80 text-sky-950 text-xs font-medium transition-all shadow-2xs flex items-center justify-between cursor-pointer"
                      title="Zarezervovať operačnú sálu alebo ambulantný termín"
                    >
                      <span className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                        <span>Naplánovať termín / Sálu</span>
                      </span>
                      <span className="text-[9px] text-sky-700/80 font-mono">Sála</span>
                    </button>

                    {/* Vytvoriť plán liečby */}
                    <button
                      type="button"
                      onClick={() => setIsCreatingPlan(true)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-white border border-[#E8E2D9] hover:border-amber-300 text-[#2C2A29] text-xs font-medium transition-all shadow-2xs flex items-center justify-between cursor-pointer"
                      title="Ročný estetický alebo pred/pooperačný liečebný plán"
                    >
                      <span className="flex items-center gap-2">
                        <ClipboardList className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Vytvoriť plán liečby</span>
                      </span>
                      <span className="text-[9px] text-amber-700/80 font-mono">Plán</span>
                    </button>

                    {/* Pokladňa po ošetrení (POS) */}
                    {onNavigateToCosmetics && (
                      <button
                        type="button"
                        onClick={() => onNavigateToCosmetics(selectedPatient)}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-white border border-[#E8E2D9] hover:border-purple-300 text-[#2C2A29] text-xs font-medium transition-all shadow-2xs flex items-center justify-between cursor-pointer"
                        title="Pokladňa po ošetrení & nákup kozmetiky"
                      >
                        <span className="flex items-center gap-2">
                          <ShoppingBag className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span>Pokladňa po ošetrení</span>
                        </span>
                        <span className="text-[9px] text-purple-700/80 font-mono">POS</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SEKCIA KARTY PACIENTA S BOČNOU ČASOVOU OSOU (TIMELINE) */}
            <div className={`grid grid-cols-1 ${isTimelineOpen ? 'xl:grid-cols-12' : ''} gap-6 items-start`}>
              
              {/* ĽAVÁ HLAVNÁ ČASŤ (4 SEKCIE & OBSAH) */}
              <div className={`${isTimelineOpen ? 'xl:col-span-8' : 'w-full'} space-y-4 min-w-0`}>
                
                {/* AK JE PANEL ZBALENÝ, ZOBRAZÍ SA KOMPAKTNÁ LIŠTA PRE RÝCHLE ROZBALENIE */}
                {!isTimelineOpen && (
                  <div className="bg-[#FAF8F5] border border-[#E8E2D9] p-3 rounded-xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[#2C2A29] text-[#C5A059] flex items-center justify-center font-bold">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#2C2A29] block">
                          Časová os, výkony a alergie pacienta
                        </span>
                        <span className="text-[10px] text-[#8C857B]">
                          Bočný panel je skrytý. Rozbalením získate okamžitý prehľad o alergiách a histórii zákrokov.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsTimelineOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-[#C5A059] text-[#2C2A29] hover:bg-[#FAF8F5] font-bold text-xs transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <PanelRightOpen className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Rozbaliť časovú os</span>
                    </button>
                  </div>
                )}

                {(() => {
                  const patientEvents = storedEvents.filter(evt => 
                    (evt.patientId && evt.patientId === selectedPatient.id) ||
                    (evt.patientName && selectedPatient.name && (
                      evt.patientName.toLowerCase().includes(selectedPatient.name.toLowerCase()) ||
                      selectedPatient.name.toLowerCase().includes(evt.patientName.toLowerCase())
                    ))
                  );
                  const currentPatientPlans = allPatientPlans[selectedPatient.id] || [];
                  const currentRecords = patientRecords[selectedPatient.id] || [];
                  const totalZaznamyCount = currentRecords.length + patientMaterialLogs.length;

                  return (
                    <div className="flex flex-wrap gap-1.5 border-b border-[#E8E2D9] pt-1">
                      {/* 1. ZÁZNAMY & DOKUMENTÁCIA */}
                      <button 
                        onClick={() => { setActiveFolder('zaznamy'); setActivePhotoCategory(null); }} 
                        className={`px-4 py-2.5 text-xs font-bold tracking-wider rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${ 
                          activeFolder === 'zaznamy' 
                            ? 'bg-white border-t-2 border-x border-[#E8E2D9] border-t-[#C5A059] text-[#2C2A29] shadow-2xs' 
                            : 'text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FAF8F5]' 
                        }`}
                      >
                        <FileText className={`w-4 h-4 ${activeFolder === 'zaznamy' ? 'text-[#C5A059]' : 'text-[#8C857B]'}`} />
                        <span>Záznamy & Dokumentácia</span>
                        {totalZaznamyCount > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeFolder === 'zaznamy' ? 'bg-[#2C2A29] text-white' : 'bg-gray-100 text-gray-700'}`}>
                            {totalZaznamyCount}
                          </span>
                        )}
                      </button>

                      {/* 2. PLÁNY & STAROSTLIVOSŤ */}
                      <button 
                        onClick={() => { setActiveFolder('plany'); setActivePhotoCategory(null); }} 
                        className={`px-4 py-2.5 text-xs font-bold tracking-wider rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${ 
                          activeFolder === 'plany' 
                            ? 'bg-white border-t-2 border-x border-[#E8E2D9] border-t-[#C5A059] text-[#2C2A29] shadow-2xs' 
                            : 'text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FAF8F5]' 
                        }`}
                      >
                        <Sparkles className={`w-4 h-4 ${activeFolder === 'plany' ? 'text-[#C5A059]' : 'text-[#8C857B]'}`} />
                        <span>Plány & Starostlivosť</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${activeFolder === 'plany' ? 'bg-[#C5A059] text-white' : 'bg-[#C5A059]/15 text-[#9C7D2B]'}`}>
                          12M + Protokoly
                        </span>
                      </button>

                      {/* 3. DIAGNOSTIKA & FOTODOKUMENTÁCIA */}
                      <button 
                        onClick={() => { setActiveFolder('diagnostika'); setActivePhotoCategory(null); }} 
                        className={`px-4 py-2.5 text-xs font-bold tracking-wider rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${ 
                          activeFolder === 'diagnostika' 
                            ? 'bg-white border-t-2 border-x border-[#E8E2D9] border-t-[#C5A059] text-[#2C2A29] shadow-2xs' 
                            : 'text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FAF8F5]' 
                        }`}
                      >
                        <Activity className={`w-4 h-4 ${activeFolder === 'diagnostika' ? 'text-[#C5A059]' : 'text-[#8C857B]'}`} />
                        <span>Diagnostika & Foto</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${activeFolder === 'diagnostika' ? 'bg-[#2C2A29] text-white' : 'bg-gray-100 text-gray-700'}`}>
                          Meicet 3D
                        </span>
                      </button>

                      {/* 4. TERMÍNY & KONTROLY */}
                      <button 
                        onClick={() => { setActiveFolder('terminy'); setActivePhotoCategory(null); }} 
                        className={`px-4 py-2.5 text-xs font-bold tracking-wider rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${ 
                          activeFolder === 'terminy' 
                            ? 'bg-white border-t-2 border-x border-[#E8E2D9] border-t-[#C5A059] text-[#2C2A29] shadow-2xs' 
                            : 'text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FAF8F5]' 
                        }`}
                      >
                        <Calendar className={`w-4 h-4 ${activeFolder === 'terminy' ? 'text-sky-600' : 'text-[#8C857B]'}`} />
                        <span>Termíny & Kontroly</span>
                        {patientEvents.length > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeFolder === 'terminy' ? 'bg-sky-600 text-white' : 'bg-sky-100 text-sky-800'}`}>
                            {patientEvents.length}
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })()}

                {/* HLAVNÝ OBSAH AKTÍVNEJ SEKCIE */}
                <div className="min-h-[400px] border border-[#E8E2D9] rounded-b-2xl rounded-tr-2xl p-5 bg-white shadow-2xs">
                  
                  {/* ============================================================ */}
                  {/* SEKCIA 1: ZÁZNAMY & DOKUMENTÁCIA                             */}
                  {/* ============================================================ */}
                  {activeFolder === 'zaznamy' && (
                    <div className="space-y-4">
                      {/* Sub-navigácia pre Záznamy & Dokumentáciu */}
                      <div className="flex flex-wrap items-center gap-1.5 pb-3 border-b border-[#F0EBE1]">
                        <button
                          type="button"
                          onClick={() => setZaznamySubTab('dekurzy')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            zaznamySubTab === 'dekurzy'
                              ? 'bg-[#2C2A29] text-white shadow-2xs'
                              : 'bg-[#FAF8F5] text-[#8C857B] hover:bg-[#E8E2D9] hover:text-[#2C2A29]'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Dekurzy & Správy</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${zaznamySubTab === 'dekurzy' ? 'bg-white/20 text-white' : 'bg-white text-gray-700 border border-[#E8E2D9]'}`}>
                            {(patientRecords[selectedPatient.id] || []).length}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setZaznamySubTab('vysetrenia')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            zaznamySubTab === 'vysetrenia'
                              ? 'bg-[#2C2A29] text-white shadow-2xs'
                              : 'bg-[#FAF8F5] text-[#8C857B] hover:bg-[#E8E2D9] hover:text-[#2C2A29]'
                          }`}
                        >
                          <FileCheck className="w-3.5 h-3.5 text-rose-500" />
                          <span>Výsledky & Predoperačné</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setZaznamySubTab('materialy')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            zaznamySubTab === 'materialy'
                              ? 'bg-[#2C2A29] text-white shadow-2xs'
                              : 'bg-[#FAF8F5] text-[#8C857B] hover:bg-[#E8E2D9] hover:text-[#2C2A29]'
                          }`}
                        >
                          <Boxes className="w-3.5 h-3.5 text-amber-600" />
                          <span>Spotrebovaný materiál</span>
                          {patientMaterialLogs.length > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${zaznamySubTab === 'materialy' ? 'bg-white/20 text-white' : 'bg-white text-gray-700 border border-[#E8E2D9]'}`}>
                              {patientMaterialLogs.length}
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setZaznamySubTab('drive')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            zaznamySubTab === 'drive'
                              ? 'bg-[#2C2A29] text-white shadow-2xs'
                              : 'bg-[#FAF8F5] text-[#8C857B] hover:bg-[#E8E2D9] hover:text-[#2C2A29]'
                          }`}
                        >
                          <HardDrive className="w-3.5 h-3.5 text-sky-600" />
                          <span>Google Drive (Klienti SAY)</span>
                        </button>
                      </div>

                      {/* SUB-OBSAH 1A: DEKURZY & SPRÁVY */}
                      {zaznamySubTab === 'dekurzy' && (
                        <div className="space-y-3">
                          {patientRecords[selectedPatient.id] && patientRecords[selectedPatient.id].length > 0 ? (
                            <div className="space-y-2">
                              {patientRecords[selectedPatient.id].map(record => (
                                <div key={record.id} className="border border-[#E8E2D9] rounded-xl p-3.5 flex flex-wrap justify-between items-center hover:bg-[#FAF8F5] transition-all bg-white shadow-2xs gap-3">
                                  <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className={`text-[9px] text-white px-2 py-0.5 rounded-full uppercase font-bold ${record.typeColor}`}>{record.type}</span>
                                      <span className="text-xs font-bold text-[#2C2A29]">{record.title}</span>
                                      <span className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
                                        ☁️ Cloud
                                      </span>
                                      {record.driveWebViewLink && (
                                        <span className="text-[9px] bg-sky-50 text-sky-800 border border-sky-300 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
                                          📂 Google Drive
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-[#8C857B]">
                                      Lekár: <strong className="text-[#2C2A29]">{record.doctor}</strong> {record.diagnosis && <>| Diagnóza: <span className="font-mono text-[#C5A059]">{record.diagnosis}</span></>}
                                    </p>
                                  </div>
                                  
                                  <div className="flex flex-col items-end gap-1.5">
                                    <p className="text-xs font-mono text-[#8C857B] font-bold">{new Date(record.date).toLocaleDateString('sk-SK')}</p>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {record.driveWebViewLink && (
                                        <a 
                                          href={record.driveWebViewLink} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="text-[10px] text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-300 px-2 py-1 rounded-lg uppercase font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                          title="Otvoriť PDF dokument priamo na Google Disku"
                                        >
                                          <span>📂</span> Disk
                                        </a>
                                      )}
                                      {(record.type?.toLowerCase().includes('opera') || record.type?.toLowerCase().includes('protokol') || record.title?.toLowerCase().includes('augmentác') || record.title?.toLowerCase().includes('lipo')) && (
                                        <button 
                                          onClick={() => handleOpenScheduleModal(record)} 
                                          className="text-[10px] text-sky-900 bg-sky-100 hover:bg-sky-200 border border-sky-300 px-2 py-1 rounded-lg uppercase font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                          title="Naplánovať pooperačnú kontrolu z tohto operačného protokolu"
                                        >
                                          <span>🩺</span> Kontrola
                                        </button>
                                      )}
                                      <button onClick={() => setEditingRecord(record)} className="text-[10px] text-[#8C857B] hover:text-[#C5A059] uppercase font-bold px-2 py-1 rounded hover:bg-stone-100 transition-colors">✏️ Upraviť</button>
                                      <button onClick={() => handleDeleteRecord(record.id)} className="text-[10px] text-[#8C857B] hover:text-rose-600 uppercase font-bold px-2 py-1 rounded hover:bg-rose-50 transition-colors">🗑️ Zmazať</button>
                                      <button onClick={() => setPreviewRecord(record)} className="text-[10px] text-[#C5A059] hover:text-[#9C7D2B] bg-[#FAF8F5] border border-[#E8E2D9] px-2.5 py-1 rounded-lg uppercase font-bold transition-colors shadow-2xs">
                                        📄 Náhľad & PDF
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12 border border-dashed border-[#E8E2D9] rounded-xl bg-[#FAF8F5]">
                              <p className="text-3xl mb-2">☁️</p>
                              <p className="text-xs text-[#8C857B]">Tento pacient zatiaľ nemá žiadne zdravotné záznamy v Cloud databáze.</p>
                              <button 
                                onClick={() => onNavigateToGenerator && onNavigateToGenerator(selectedPatient)}
                                className="mt-3 text-xs bg-[#2C2A29] hover:bg-[#C5A059] text-white px-3.5 py-2 rounded-xl uppercase font-bold cursor-pointer transition-colors"
                              >
                                + Vystaviť prvú lekársku správu
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* SUB-OBSAH 1B: VÝSLEDKY & PREDOPERAČNÉ VYŠETRENIA */}
                      {zaznamySubTab === 'vysetrenia' && (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="text-xs uppercase font-bold text-[#2C2A29]">Výsledky laboratórií, EKG a interných vyšetrení</h4>
                              <p className="text-[11px] text-[#8C857B]">Predoperačné vyšetrenia k plánovaným anestéziologickým výkonom</p>
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            <div className="border border-[#E8E2D9] rounded-xl p-3.5 flex justify-between items-center hover:bg-[#FAF8F5] transition-all bg-white shadow-2xs">
                              <div className="flex items-center gap-3">
                                <div className="bg-rose-100 text-rose-700 p-2.5 rounded-xl text-xs font-bold flex items-center justify-center">
                                  PDF
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-[#2C2A29]">Predoperačné interné vyšetrenie & EKG</p>
                                  <p className="text-[10px] text-[#8C857B] mt-0.5">Záver: Schopná výkonu v celkovej anestézii • ASA I</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => alert('Predoperačné vyšetrenie bolo overené a je archivované v elektronickej karte pacienta.')}
                                className="text-[10px] bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-[#C5A059] hover:text-[#9C7D2B] px-3 py-1.5 rounded-lg uppercase font-bold transition-all shadow-2xs cursor-pointer"
                              >
                                Stiahnuť PDF
                              </button>
                            </div>

                            <div className="border border-[#E8E2D9] rounded-xl p-3.5 flex justify-between items-center hover:bg-[#FAF8F5] transition-all bg-white shadow-2xs">
                              <div className="flex items-center gap-3">
                                <div className="bg-blue-100 text-blue-700 p-2.5 rounded-xl text-xs font-bold flex items-center justify-center">
                                  LAB
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-[#2C2A29]">Krvný obraz, hemostáza (Quick, aPTT, INR) & Biochémia</p>
                                  <p className="text-[10px] text-[#8C857B] mt-0.5">Hb, Ery, Leu, Trc, Glykémia, Urea, Kreatinín v referenčnom rozmedzí</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => alert('Laboratórne výsledky sú platné 14 dní pred plánovaným dňom operácie.')}
                                className="text-[10px] bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-[#C5A059] hover:text-[#9C7D2B] px-3 py-1.5 rounded-lg uppercase font-bold transition-all shadow-2xs cursor-pointer"
                              >
                                Zobraziť výsledky
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SUB-OBSAH 1C: SPOTREBOVANÝ MATERIÁL & PRÁDLO */}
                      {zaznamySubTab === 'materialy' && (
                        <div className="space-y-4">
                          {/* Horný panel: Štatistiky a akcie */}
                          <div className="flex flex-wrap justify-between items-center gap-3 bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E8E2D9]">
                            <div className="flex flex-wrap items-center gap-4 text-xs">
                              <div>
                                <span className="text-[10px] uppercase text-[#8C857B] font-bold block">Minuté položky</span>
                                <span className="text-base font-bold text-[#2C2A29]">{patientMaterialLogs.length} záznamov</span>
                              </div>
                              <div className="h-8 w-px bg-[#E8E2D9] hidden sm:block" />
                              <div>
                                <span className="text-[10px] uppercase text-[#8C857B] font-bold block">Implantáty & Špeciál</span>
                                <span className="text-base font-bold text-[#C5A059]">
                                  {patientMaterialLogs.filter(l => l.category === 'implantaty').length} ks
                                </span>
                              </div>
                              <div className="h-8 w-px bg-[#E8E2D9] hidden sm:block" />
                              <div>
                                <span className="text-[10px] uppercase text-[#8C857B] font-bold block">Pooperačné prádlo</span>
                                <span className="text-base font-bold text-[#2C2A29]">
                                  {patientMaterialLogs.filter(l => l.category === 'kompresivne_pradlo').length} ks
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Filtre */}
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="text-[10px] uppercase font-bold text-[#8C857B] mr-1">Filter:</span>
                            {[
                              { id: 'all', label: 'Všetko' },
                              { id: 'operacia', label: '🏥 Operácie' },
                              { id: 'estetika', label: '💉 Estetika' },
                              { id: 'pradlo', label: '👙 Vydané prádlo' },
                              { id: 'ambulancia', label: '🩺 Ambulancia' },
                            ].map(f => (
                              <button
                                key={f.id}
                                onClick={() => setMaterialFilterType(f.id)}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                  materialFilterType === f.id
                                    ? 'bg-[#2C2A29] text-white'
                                    : 'bg-[#FBF9F6] text-[#8C857B] hover:bg-[#E8E2D9]'
                                }`}
                              >
                                {f.label}
                              </button>
                            ))}
                          </div>

                          {/* Zoznam položiek */}
                          {patientMaterialLogs.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-[#E8E2D9] rounded-xl bg-[#FAF8F5]">
                              <p className="text-3xl mb-2">📦</p>
                              <p className="text-sm font-semibold text-[#2C2A29]">Zatiaľ nebol zaznamenaný žiadny minutý materiál</p>
                              <p className="text-xs text-[#8C857B] max-w-md mx-auto mt-1">
                                Minutý materiál, lieky a šitie sa evidujú pri odpise výkonu v sekcii Prevádzka.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {patientMaterialLogs
                                .filter(log => materialFilterType === 'all' || log.sourceType === materialFilterType)
                                .map(log => (
                                  <div
                                    key={log.id}
                                    className="border border-[#E8E2D9] rounded-xl p-3.5 bg-white hover:border-[#C5A059]/50 transition-all shadow-2xs space-y-2"
                                  >
                                    <div className="flex flex-wrap justify-between items-start gap-2">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                            log.sourceType === 'operacia'
                                              ? 'bg-rose-100 text-rose-800'
                                              : log.sourceType === 'estetika'
                                              ? 'bg-purple-100 text-purple-800'
                                              : log.sourceType === 'pradlo'
                                              ? 'bg-amber-100 text-amber-800'
                                              : 'bg-blue-100 text-blue-800'
                                          }`}>
                                            {log.sourceType === 'operacia' ? '🏥 Operácia' : log.sourceType === 'estetika' ? '💉 Estetika' : log.sourceType === 'pradlo' ? '👙 Prádlo' : '🩺 Ambulancia'}
                                          </span>
                                          <span className="text-xs font-bold text-[#2C2A29]">{log.itemName}</span>
                                        </div>
                                        <p className="text-[11px] text-[#8C857B] mt-0.5">
                                          Výkon: <strong className="text-[#2C2A29]">{log.procedureName}</strong>
                                        </p>
                                      </div>

                                      <div className="text-right">
                                        <span className="text-sm font-bold text-[#2C2A29] bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#E8E2D9]">
                                          {log.quantity} {log.unit}
                                        </span>
                                        <span className="block text-[10px] text-[#8C857B] mt-1">
                                          {new Date(log.timestamp).toLocaleString('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F0EBE1] text-[11px]">
                                      <div className="flex flex-wrap items-center gap-3 text-[#8C857B]">
                                        {log.lotNumber && (
                                          <span>Šarža / LOT: <strong className="text-[#C5A059] font-mono">{log.lotNumber}</strong></span>
                                        )}
                                        {log.serialNumber && (
                                          <span>SN: <strong className="text-[#2C2A29] font-mono">{log.serialNumber}</strong></span>
                                        )}
                                        {log.performerName && (
                                          <span>Personál: <strong className="text-[#2C2A29]">{log.performerName}</strong></span>
                                        )}
                                      </div>
                                      {log.notes && (
                                        <span className="text-[#8C857B] italic text-[10px]">
                                          {log.notes}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* SUB-OBSAH 1D: GOOGLE DRIVE DOKUMENTY (PREPOJENIE SO ZLOŽKOU KLIENTI SAY) */}
                      {zaznamySubTab === 'drive' && (
                        <div className="space-y-3 pt-1">
                          <PatientDriveFiles patientName={selectedPatient.name} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* ============================================================ */}
                  {/* SEKCIA 2: PLÁNY & STAROSTLIVOSŤ                              */}
                  {/* ============================================================ */}
                  {activeFolder === 'plany' && (
                    <div className="space-y-5">
                      {/* Sub-navigácia pre Plány & Starostlivosť */}
                      <div className="flex flex-wrap items-center gap-1.5 pb-3 border-b border-[#F0EBE1]">
                        <button
                          type="button"
                          onClick={() => setPlanySubTab('roadmap')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            planySubTab === 'roadmap'
                              ? 'bg-[#2C2A29] text-white shadow-2xs'
                              : 'bg-[#FAF8F5] text-[#8C857B] hover:bg-[#E8E2D9] hover:text-[#2C2A29]'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>12-Mesačný AI Liečebný Plán</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${planySubTab === 'roadmap' ? 'bg-[#C5A059] text-white' : 'bg-[#C5A059]/20 text-[#C5A059]'}`}>
                            AI Skincare
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPlanySubTab('protokoly')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            planySubTab === 'protokoly'
                              ? 'bg-[#2C2A29] text-white shadow-2xs'
                              : 'bg-[#FAF8F5] text-[#8C857B] hover:bg-[#E8E2D9] hover:text-[#2C2A29]'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Protokoly starostlivosti & Plány pacienta</span>
                          {(allPatientPlans[selectedPatient.id] || []).length > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${planySubTab === 'protokoly' ? 'bg-[#C5A059] text-white' : 'bg-[#C5A059]/20 text-[#C5A059]'}`}>
                              {(allPatientPlans[selectedPatient.id] || []).length}
                            </span>
                          )}
                        </button>
                      </div>

                      {/* SUB-OBSAH 2A: 12-MESAČNÝ AI LIEČEBNÝ PLÁN */}
                      {planySubTab === 'roadmap' && (
                        <AIHealthRoadmapView
                          patient={selectedPatient}
                          proceduresHistory={patientRecords[selectedPatient.id] || []}
                          aestheticsHistory={(() => {
                            try {
                              const saved = localStorage.getItem('say_clinic_aesthetic_sessions');
                              if (saved) {
                                const parsed = JSON.parse(saved);
                                if (parsed[selectedPatient.id] && parsed[selectedPatient.id].length > 0) {
                                  return parsed[selectedPatient.id];
                                }
                              }
                            } catch (e) {
                              console.error(e);
                            }
                            if (selectedPatient.id === 'P1') {
                              return [
                                {
                                  id: 'aes-p1-1',
                                  patientId: 'P1',
                                  date: '2026-06-15',
                                  formattedDate: '15.06.2026',
                                  title: 'Tvár – Aplikácia Dysport & Restylane Kysse',
                                  doctor: 'MUDr. Ján Mráz',
                                  protocolNumber: 'AES-2026-441',
                                  notes: 'Aplikácia botulotoxínu do glabely a frontalis s cieľom eliminácie dynamických vrások. Decentná hydratácia pier prípravkom Restylane Kysse. Aplikácia bez komplikácií.',
                                  vectors: [
                                    {
                                      id: 'vec-1',
                                      type: 'point',
                                      view: 'front',
                                      color: '#3B82F6',
                                      startPoint: { x: 250, y: 210 },
                                      zoneName: 'Čelo (m. frontalis)',
                                      productName: 'Dysport 300IU (Botulotoxín A)',
                                      lotNumber: 'DYSP-4412B',
                                      details: '20 Speywood U (intramuskulárne)',
                                      createdAt: '11:15'
                                    },
                                    {
                                      id: 'vec-2',
                                      type: 'point',
                                      view: 'front',
                                      color: '#3B82F6',
                                      startPoint: { x: 250, y: 245 },
                                      zoneName: 'Glabela (m. procerus + corrugator)',
                                      productName: 'Dysport 300IU (Botulotoxín A)',
                                      lotNumber: 'DYSP-4412B',
                                      details: '30 Speywood U (intramuskulárne)',
                                      createdAt: '11:20'
                                    },
                                    {
                                      id: 'vec-3',
                                      type: 'fanning',
                                      view: 'front',
                                      color: '#EC4899',
                                      startPoint: { x: 250, y: 395 },
                                      zoneName: 'Pery (vermilion border + stred)',
                                      productName: 'Restylane Kysse 1ml s Lidokaínom',
                                      lotNumber: 'RST-KYS-993A',
                                      details: '0.8 ml (retrográdne kanylou 25G)',
                                      createdAt: '11:35'
                                    }
                                  ],
                                  bodyTreatments: []
                                }
                              ];
                            }
                            if (selectedPatient.id === 'P2') {
                              return [
                                {
                                  id: 'aes-p2-1',
                                  patientId: 'P2',
                                  date: '2026-05-20',
                                  formattedDate: '20.05.2026',
                                  title: 'Tvár – Brotox & Mezoterapia vitamínmi',
                                  doctor: 'MUDr. Ján Mráz',
                                  protocolNumber: 'AES-2026-382',
                                  notes: 'Aplikácia botulotoxínu pre muža do glabely a periokulárnej oblasti. Zohľadnená väčšia svalová hmota. Doplnená mezoterapia s kyselinou hyalurónovou na revitalizáciu kože.',
                                  vectors: [
                                    {
                                      id: 'vec-p2-1',
                                      type: 'point',
                                      view: 'front',
                                      color: '#3B82F6',
                                      startPoint: { x: 250, y: 240 },
                                      zoneName: 'Glabela (m. corrugator supercilii)',
                                      productName: 'Dysport 300IU',
                                      lotNumber: 'DYSP-4412B',
                                      details: '40 Speywood U',
                                      createdAt: '14:20'
                                    }
                                  ],
                                  bodyTreatments: []
                                }
                              ];
                            }
                            return [];
                          })()}
                          onScheduleEvent={(evtData) => {
                            setSchedulingInitialDetails({
                              title: evtData.title,
                              eventType: (evtData.type as string) === 'surgical_followup' ? 'kontrola' : 'osetrenie',
                              notes: evtData.notes
                            });
                            setIsSchedulingEvent(true);
                          }}
                          onNavigateToCalendar={onNavigateToCalendar}
                        />
                      )}

                      {/* SUB-OBSAH 2B: PROTOKOLY STAROSTLIVOSTI & DETAIL VYBRANÉHO PLÁNU */}
                      {planySubTab === 'protokoly' && (
                        <div className="space-y-6">
                          {(() => {
                            const patientPlans = allPatientPlans[selectedPatient.id] || [];
                            const currentActivePlan = patientPlans.find(p => p.id === selectedPlanId) || patientPlans[0];

                            return (
                              <div className="space-y-5">
                                {/* HORNÁ LIŠTA: PREPÍNAČ MEDZI PLÁNMI + VYTVORENIE NOVÉHO */}
                                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D9]">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold uppercase tracking-wider text-[#8C857B] mr-1">
                                      Plány ({patientPlans.length}):
                                    </span>
                                    {patientPlans.map((pl) => {
                                      const isSel = currentActivePlan && currentActivePlan.id === pl.id;
                                      return (
                                        <button
                                          key={pl.id}
                                          onClick={() => setSelectedPlanId(pl.id)}
                                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                            isSel
                                              ? 'bg-[#2C2A29] text-white shadow-xs'
                                              : 'bg-white border border-[#E8E2D9] text-[#6B6357] hover:border-[#C5A059]'
                                          }`}
                                        >
                                          <span>{pl.planType === 'pre_post_op' ? '🏥' : '✨'}</span>
                                          <span className="truncate max-w-[200px]">{pl.title}</span>
                                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                                            isSel ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                                          }`}>
                                            {new Date(pl.createdAt).toLocaleDateString('sk-SK')}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>

                                  <button
                                    onClick={() => setIsCreatingPlan(true)}
                                    className="px-3.5 py-1.5 bg-[#C5A059] hover:bg-[#B38F46] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ml-auto"
                                  >
                                    <span>✨</span>
                                    <span>+ Nový plán pacienta</span>
                                  </button>
                                </div>

                                {/* OBSAH: DETAIL VYBRANÉHO PLÁNU ALEBO PRÁZDNA OBRAZOVKA */}
                                {currentActivePlan ? (
                                  <PatientPlanViewer
                                    plan={currentActivePlan}
                                    patient={selectedPatient}
                                    onUpdatePlan={handleUpdatePlan}
                                    onScheduleTreatment={handleScheduleTreatmentFromPlan}
                                    onOpenInCosmeticsPOS={(items) => onNavigateToCosmetics?.(selectedPatient, items)}
                                  />
                                ) : (
                                  <div className="text-center py-16 px-4 bg-[#FAF8F5]/50 rounded-2xl border border-dashed border-[#E8E2D9] space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-[#C5A059]/15 text-[#C5A059] flex items-center justify-center mx-auto text-2xl">
                                      ✨
                                    </div>
                                    <div className="max-w-md mx-auto">
                                      <h3 className="text-base font-bold text-[#2C2A29]">Žiaden plán pacienta</h3>
                                      <p className="text-xs text-[#8C857B] mt-1">
                                        Vytvorte personalizovaný ročný estetický plán (odporúčaná ranná a večerná kozmetika, procedúry na 12 mesiacov) alebo kompletný plán pred a po operácii.
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                                      <button
                                        onClick={() => setIsCreatingPlan(true)}
                                        className="px-4 py-2.5 bg-[#C5A059] hover:bg-[#B38F46] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                                      >
                                        <span>✨</span>
                                        <span>Vytvoriť plán s AI asistentom</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ============================================================ */}
                  {/* SEKCIA 3: DIAGNOSTIKA & FOTODOKUMENTÁCIA                     */}
                  {/* ============================================================ */}
                  {activeFolder === 'diagnostika' && (
                    <div className="space-y-4">
                      {/* Sub-navigácia pre Diagnostiku & Foto */}
                      <div className="flex flex-wrap items-center gap-1.5 pb-3 border-b border-[#F0EBE1]">
                        <button
                          type="button"
                          onClick={() => setDiagnostikaSubTab('meicet')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            diagnostikaSubTab === 'meicet'
                              ? 'bg-[#2C2A29] text-white shadow-2xs'
                              : 'bg-[#FAF8F5] text-[#8C857B] hover:bg-[#E8E2D9] hover:text-[#2C2A29]'
                          }`}
                        >
                          <Activity className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Meicet Pro-A (3D Spektrálna analýza pleti)</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${diagnostikaSubTab === 'meicet' ? 'bg-[#C5A059] text-white' : 'bg-[#C5A059]/20 text-[#C5A059]'}`}>
                            AI 3D
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setDiagnostikaSubTab('foto'); setActivePhotoCategory(null); }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            diagnostikaSubTab === 'foto'
                              ? 'bg-[#2C2A29] text-white shadow-2xs'
                              : 'bg-[#FAF8F5] text-[#8C857B] hover:bg-[#E8E2D9] hover:text-[#2C2A29]'
                          }`}
                        >
                          <Camera className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Fotodokumentácia etáp</span>
                        </button>
                      </div>

                      {/* SUB-OBSAH 3A: MEICET PRO-A 3D ANALÝZA */}
                      {diagnostikaSubTab === 'meicet' && (
                        <MeicetModule
                          patient={selectedPatient}
                          patientRecords={patientRecords[selectedPatient.id] || []}
                          onSaveToPatientPlans={handleSaveNewPlan}
                          onScheduleTreatment={(evt) => {
                            setSchedulingInitialDetails({
                              title: evt.title,
                              eventType: evt.type || 'osetrenie',
                              notes: evt.notes,
                              targetDate: evt.date,
                              doctor: (evt as any).doctor || evt.doctorName
                            });
                            setIsSchedulingEvent(true);
                          }}
                          onTransferToCosmeticsPOS={(items) => onNavigateToCosmetics?.(selectedPatient, items)}
                        />
                      )}

                      {/* SUB-OBSAH 3B: FOTODOKUMENTÁCIA ETÁP */}
                      {diagnostikaSubTab === 'foto' && (
                        <div>
                          {!activePhotoCategory ? (
                            <>
                              <p className="text-[10px] uppercase text-[#8C857B] font-bold mb-4">Fotografické zložky pacienta podľa klinických etáp</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4">
                                {PHOTO_CATEGORIES.map(cat => {
                                  const key = `${selectedPatient.id}_${cat}`;
                                  const count = patientPhotos[key]?.length || 0;
                                  return (
                                    <div key={cat} onClick={() => setActivePhotoCategory(cat)} className="border border-[#E8E2D9] rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all group bg-white shadow-2xs">
                                      <span className="text-3xl mb-2 grayscale opacity-80 group-hover:grayscale-0 transition-all">📁</span>
                                      <span className="text-xs font-bold text-[#2C2A29] uppercase">{cat}</span>
                                      <span className="text-[10px] text-[#8C857B] mt-1">{count} fotografií</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          ) : (
                            <div className="space-y-4">
                              <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-3">
                                <div className="flex items-center gap-3">
                                  <button onClick={() => setActivePhotoCategory(null)} className="text-[18px] text-[#8C857B] hover:text-[#2C2A29] transition-colors cursor-pointer">←</button>
                                  <h3 className="text-sm font-bold text-[#2C2A29] uppercase">📁 {activePhotoCategory}</h3>
                                </div>
                                <label className="cursor-pointer bg-[#2C2A29] hover:bg-[#C5A059] text-white px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-colors flex items-center gap-1 shadow-sm">
                                  <span>+ Hromadné nahratie fotiek</span>
                                  <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
                                </label>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-8 gap-4">
                                {patientPhotos[`${selectedPatient.id}_${activePhotoCategory}`]?.map((photo, idx) => (
                                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-[#E8E2D9] aspect-square bg-[#FAF8F5]">
                                    <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ============================================================ */}
                  {/* SEKCIA 4: TERMÍNY & KONTROLY                                 */}
                  {/* ============================================================ */}
                  {activeFolder === 'terminy' && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap justify-between items-center gap-3 bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E8E2D9]">
                        <div>
                          <h4 className="text-xs uppercase font-bold text-[#2C2A29] flex items-center gap-1.5">
                            <span>📅</span> Plánované termíny & Pooperačné kontroly pacienta
                          </h4>
                          <p className="text-[11px] text-[#8C857B]">
                            Prehľad všetkých záznamov v klinickom kalendári s informáciami o predchádzajúcej operácii
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {onNavigateToCalendar && (
                            <button
                              onClick={onNavigateToCalendar}
                              className="text-[11px] bg-white border border-[#E8E2D9] text-[#2C2A29] hover:bg-[#FBF9F6] px-3 py-1.5 rounded-lg uppercase font-bold transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <span>🗓️</span> Otvoriť kalendár
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenScheduleModal()}
                            className="text-[11px] bg-sky-700 hover:bg-sky-800 text-white px-3.5 py-1.5 rounded-lg uppercase font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>📅</span> + Naplánovať termín / kontrolu
                          </button>
                        </div>
                      </div>

                      {(() => {
                        const patientEvents = storedEvents.filter(evt => 
                          (evt.patientId && evt.patientId === selectedPatient.id) ||
                          (evt.patientName && selectedPatient.name && (
                            evt.patientName.toLowerCase().includes(selectedPatient.name.toLowerCase()) ||
                            selectedPatient.name.toLowerCase().includes(evt.patientName.toLowerCase())
                          ))
                        );

                        if (patientEvents.length === 0) {
                          return (
                            <div className="text-center py-12 border border-dashed border-[#E8E2D9] rounded-xl space-y-3 bg-[#FAF8F5]">
                              <div className="text-3xl">🗓️</div>
                              <p className="text-xs text-[#8C857B] font-medium">Pacient nemá zatiaľ v kalendári naplánovaný žiadny termín ani pooperačnú kontrolu.</p>
                              <button
                                onClick={() => handleOpenScheduleModal()}
                                className="px-4 py-2 bg-[#2C2A29] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                              >
                                <span>📅</span> Naplánovať termín z karty pacienta
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-3">
                            {patientEvents.map(evt => {
                              const isCheckup = evt.type === 'kontrola' || !!evt.operationTitle;
                              const diff = evt.operationDate ? getPostOpTimeDiff(evt.operationDate, evt.date) : null;
                              return (
                                <div
                                  key={evt.id}
                                  className={`border rounded-xl p-4 transition-all shadow-2xs space-y-2.5 ${
                                    evt.isCancelled 
                                      ? 'bg-gray-50 border-gray-200 opacity-60' 
                                      : isCheckup 
                                      ? 'bg-sky-50/50 border-sky-200 hover:border-sky-300' 
                                      : 'bg-white border-[#E8E2D9] hover:border-[#C5A059]'
                                  }`}
                                >
                                  <div className="flex flex-wrap justify-between items-start gap-2">
                                    <div className="space-y-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                          evt.type === 'operacia' ? 'bg-purple-100 text-purple-900 border border-purple-200' :
                                          evt.type === 'kontrola' ? 'bg-sky-600 text-white' :
                                          evt.type === 'konzultacia' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                                          'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                        }`}>
                                          {evt.type === 'operacia' ? '🏥 Operácia' : evt.type === 'kontrola' ? '🩺 Poop. kontrola' : evt.type === 'konzultacia' ? '💬 Konzultácia' : '✨ Ošetrenie'}
                                        </span>
                                        <h5 className="font-bold text-sm text-[#2C2A29]">{evt.title}</h5>
                                        {evt.isCancelled && (
                                          <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold uppercase">
                                            Zrušené ({evt.cancelReason || 'neuvedené'})
                                          </span>
                                        )}
                                      </div>

                                      <p className="text-xs text-[#8C857B]">
                                        Lekár: <strong className="text-[#2C2A29]">{evt.assignedTo || evt.doctorName}</strong> • Miestnosť: <strong className="text-[#2C2A29]">{evt.roomId === 'sala_say' ? 'Sála SAY' : evt.roomId === 'ambulancia' ? 'Ambulancia' : evt.roomId}</strong>
                                      </p>
                                    </div>

                                    <div className="text-right">
                                      <div className="text-xs font-mono font-bold text-[#2C2A29] bg-black/5 px-2.5 py-1 rounded-lg">
                                        📅 {new Date(evt.date).toLocaleDateString('sk-SK')} • {evt.isAllDay ? 'Celý deň' : `${evt.startTime} – ${evt.endTime}`}
                                      </div>
                                    </div>
                                  </div>

                                  {/* POOPERAČNÉ PODROBNOSTI: PO ČOM A KEDY BOLA OPERÁCIA */}
                                  {(evt.operationTitle || evt.operationDate) && (
                                    <div className="bg-sky-100/70 border border-sky-200 rounded-lg p-2.5 text-xs text-sky-950 space-y-1">
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 font-bold">
                                          <span>🔪 Pooperačná kontrola po:</span>
                                          <strong className="text-sky-900">{evt.operationTitle || 'operačnom zákroku'}</strong>
                                        </div>
                                        {evt.operationDate && diff && (
                                          <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded shadow-2xs">
                                            Operácia: {evt.operationDate} ({diff.displayText})
                                          </span>
                                        )}
                                      </div>
                                      {evt.operationDoctor && (
                                        <p className="text-[11px] text-sky-800">
                                          Operatér: <strong>{evt.operationDoctor}</strong> {evt.controlInterval ? `• Odporúčaná fáza: ${evt.controlInterval}` : ''}
                                        </p>
                                      )}
                                      {evt.operationNotes && (
                                        <p className="text-[10px] text-sky-900 font-mono italic bg-white/70 p-1.5 rounded border border-sky-200/60 mt-1 line-clamp-2">
                                          📝 {evt.operationNotes}
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {evt.notes && !evt.operationNotes && (
                                    <p className="text-xs text-[#6B6357] italic bg-[#FAF8F5] p-2 rounded-lg border border-[#E8E2D9]">
                                      Poznámka: {evt.notes}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                </div>
              </div>

          {/* PRAVÁ ČASŤ: SKLADACÍ BOČNÝ PANEL S ČASOVOU OSOU (STICKY) */}
          {isTimelineOpen && (
            <div className="xl:col-span-4 sticky top-24 space-y-4 min-w-0">
              <PatientTimelineSidebar
                patient={selectedPatient}
                records={patientRecords[selectedPatient.id] || []}
                calendarEvents={storedEvents.filter(evt => 
                  (evt.patientId && evt.patientId === selectedPatient.id) ||
                  (evt.patientName && selectedPatient.name && (
                    evt.patientName.toLowerCase().includes(selectedPatient.name.toLowerCase()) ||
                    selectedPatient.name.toLowerCase().includes(evt.patientName.toLowerCase())
                  ))
                )}
                onClose={() => setIsTimelineOpen(false)}
                onNavigateToRecord={(_recId) => {
                  setActiveFolder('dokumenty');
                }}
              />
            </div>
          )}

        </div>
      </div>
    )}

        {/* Odpis spotreby je dostupný v sekcii Prevádzka */}
        {false && isDispensingMaterial && selectedPatient && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#E8E2D9] space-y-4 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
              {/* Hlavička modalu */}
              <div className="flex justify-between items-start border-b border-[#E8E2D9] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FAF7F2] to-[#F3EAD8] border border-[#C5A059]/40 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                    📦
                  </div>
                  <div>
                    <h3 className="font-brand text-base font-bold text-[#2C2A29] uppercase tracking-wide flex items-center gap-2">
                      <span>Odpis spotreby materiálu</span>
                      <span className="text-[10px] bg-[#C5A059]/15 text-[#C5A059] px-2 py-0.5 rounded-full font-sans font-bold">
                        Evidencia sestry
                      </span>
                    </h3>
                    <p className="text-xs text-[#8C857B]">
                      Klient: <strong className="text-[#2C2A29] font-semibold">{selectedPatient.name}</strong> • RČ: <span className="font-mono text-[#2C2A29]">{selectedPatient.birthNumber}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDispensingMaterial(false)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 text-[#8C857B] hover:text-[#2C2A29] flex items-center justify-center text-lg font-bold cursor-pointer transition-colors"
                  title="Zavrieť"
                >
                  ✕
                </button>
              </div>

              {/* Úspešná hláška / Toast */}
              {dispenseSuccessToast && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{dispenseSuccessToast}</span>
                </div>
              )}

              {/* Prepínač záložiek: Balíček podľa operácie vs. Manuálny odpis */}
              <div className="flex p-1 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9] gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setDispenseModalMode('bundle')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    dispenseModalMode === 'bundle'
                      ? 'bg-[#2C2A29] text-white shadow-xs'
                      : 'text-[#6B6357] hover:text-[#2C2A29]'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Balíček spotreby podľa operácie</span>
                  {detectedProcedureName && (
                    <span className="text-[9px] bg-[#C5A059] text-white px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                      Auto
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setDispenseModalMode('manual')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    dispenseModalMode === 'manual'
                      ? 'bg-[#2C2A29] text-white shadow-xs'
                      : 'text-[#6B6357] hover:text-[#2C2A29]'
                  }`}
                >
                  <span>✍️</span>
                  <span>Manuálny odpis položiek</span>
                </button>
              </div>

              {/* ZÁLOŽKA 1: BALÍČEK SPOTREBY PODĽA OPERÁCIE */}
              {dispenseModalMode === 'bundle' && (
                <form onSubmit={handleApplyBundleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1">
                  {/* Informácia o automatickej detekcii */}
                  {detectedProcedureName ? (
                    <div className="p-3 bg-[#FAF7F2] border border-[#C5A059]/40 rounded-xl text-xs text-[#6B6357] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">💡</span>
                        <div>
                          <p className="font-bold text-[#2C2A29]">
                            Zistená operácia pacienta: <span className="text-[#C5A059]">„{detectedProcedureName}“</span>
                          </p>
                          <p className="text-[10px] text-[#8C857B]">
                            Systém automaticky predvybral odporúčaný balíček šitia, anestézie a materiálu.
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] bg-white border border-[#C5A059]/40 text-[#C5A059] font-bold px-2 py-1 rounded-md uppercase tracking-wider shrink-0">
                        Predvybraté
                      </span>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[11px] text-[#8C857B]">
                      Vyberte operačný alebo ambulantný výkon pre načítanie štandardizovaného balíčka materiálu:
                    </div>
                  )}

                  {/* Výber balíčka */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">
                      Vyberte balíček výkonu:
                    </label>
                    <select
                      value={selectedBundleId}
                      onChange={e => {
                        setSelectedBundleId(e.target.value);
                        setBundleCustomQuantities({});
                        setBundleDisabledItems({});
                      }}
                      className="w-full border border-[#E8E2D9] p-2.5 rounded-xl text-xs bg-white font-bold text-[#2C2A29] focus:border-[#C5A059] outline-none shadow-2xs"
                    >
                      {InventoryService.getBundles().map(bundle => (
                        <option key={bundle.id} value={bundle.id}>
                          {bundle.serviceName} ({bundle.items.length} položiek)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Zoznam položiek v balíčku */}
                  {(() => {
                    const currentBundle = InventoryService.getBundles().find(b => b.id === selectedBundleId);
                    if (!currentBundle) return null;

                    const allItems = currentBundle.items;
                    const activeCount = allItems.filter(item => !bundleDisabledItems[item.itemId]).length;

                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[10px] uppercase font-bold text-[#8C857B]">
                            Rozpis položiek balíčka ({activeCount} / {allItems.length} zvolených):
                          </span>
                          <span className="text-[10px] text-[#8C857B] italic">
                            Upravte množstvá alebo odškrtnite nepoužité položky:
                          </span>
                        </div>

                        <div className="border border-[#E8E2D9] rounded-xl overflow-hidden divide-y divide-[#E8E2D9] bg-white max-h-56 overflow-y-auto">
                          {allItems.map(item => {
                            const matchedStock = allStockItems.find(i => i.id === item.itemId);
                            const itemName = matchedStock?.name || item.name || item.itemId;
                            const isExcluded = !!bundleDisabledItems[item.itemId];
                            const currentQty = bundleCustomQuantities[item.itemId] !== undefined
                              ? bundleCustomQuantities[item.itemId]
                              : item.quantity;

                            return (
                              <div
                                key={item.itemId}
                                className={`p-2.5 flex items-center justify-between gap-3 text-xs transition-colors ${
                                  isExcluded ? 'bg-gray-50 opacity-40' : 'hover:bg-[#FAF8F5]'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <input
                                    type="checkbox"
                                    checked={!isExcluded}
                                    onChange={e => {
                                      setBundleDisabledItems(prev => ({
                                        ...prev,
                                        [item.itemId]: !e.target.checked
                                      }));
                                    }}
                                    className="rounded border-[#E8E2D9] text-[#C5A059] focus:ring-[#C5A059] cursor-pointer"
                                  />
                                  <div className="min-w-0">
                                    <p className={`font-semibold truncate ${isExcluded ? 'line-through text-gray-500' : 'text-[#2C2A29]'}`}>
                                      {itemName}
                                    </p>
                                    <div className="flex items-center gap-2 text-[10px] text-[#8C857B] mt-0.5">
                                      <span className="uppercase font-mono bg-black/5 px-1.5 py-0.2 rounded">
                                        {matchedStock?.category || item.category || 'spotrebny'}
                                      </span>
                                      {matchedStock ? (
                                        <span>Na sklade: <strong className={matchedStock.quantity > 0 ? 'text-emerald-700' : 'text-rose-600'}>{matchedStock.quantity} {matchedStock.unit}</strong></span>
                                      ) : (
                                        <span className="text-[#C5A059]">Klinický balíček</span>
                                      )}
                                      {matchedStock?.lotNumber && (
                                        <span className="font-mono text-[#C5A059]">LOT: {matchedStock.lotNumber}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <input
                                    type="number"
                                    min="1"
                                    max="99"
                                    disabled={isExcluded}
                                    value={currentQty}
                                    onChange={e => {
                                      const val = Math.max(1, parseInt(e.target.value) || 1);
                                      setBundleCustomQuantities(prev => ({
                                        ...prev,
                                        [item.itemId]: val
                                      }));
                                    }}
                                    className="w-14 border border-[#E8E2D9] px-2 py-1 rounded-lg text-center font-bold text-xs bg-white text-[#2C2A29] focus:border-[#C5A059] outline-none"
                                  />
                                  <span className="text-xs text-[#8C857B] font-medium w-8">
                                    {item.unit || matchedStock?.unit || 'ks'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Personál & Poznámka */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">
                        Zodpovedná sestra / personál *
                      </label>
                      <input
                        type="text"
                        value={dispensePerformerName}
                        onChange={e => setDispensePerformerName(e.target.value)}
                        placeholder="napr. Bc. Mária Horváthová (sálová sestra)"
                        required
                        className="w-full border border-[#E8E2D9] p-2 rounded-xl text-xs bg-white text-[#2C2A29]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">
                        Doplňujúca poznámka (voliteľná)
                      </label>
                      <input
                        type="text"
                        value={dispenseNote}
                        onChange={e => setDispenseNote(e.target.value)}
                        placeholder="napr. Šitie dokončené bez komplikácií, drén funkčný"
                        className="w-full border border-[#E8E2D9] p-2 rounded-xl text-xs bg-white text-[#2C2A29]"
                      />
                    </div>
                  </div>

                  {/* Pätička s akciami */}
                  <div className="flex justify-between items-center gap-2 pt-3 border-t border-[#E8E2D9]">
                    <button
                      type="button"
                      onClick={() => setIsDispensingMaterial(false)}
                      className="px-4 py-2 border border-[#E8E2D9] rounded-xl text-xs font-semibold hover:bg-[#FAF8F5] cursor-pointer"
                    >
                      Zrušiť
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#C5A059] hover:bg-[#b08d48] text-white rounded-xl text-xs uppercase font-bold tracking-wider cursor-pointer shadow-md flex items-center gap-2 transition-all hover:scale-[1.01]"
                    >
                      <Check className="w-4 h-4" />
                      <span>✓ Odpísať balíček zo skladu</span>
                    </button>
                  </div>
                </form>
              )}

              {/* ZÁLOŽKA 2: MANUÁLNY ODPIS JEDNOTLIVÝCH POLOŽIEK */}
              {dispenseModalMode === 'manual' && (
                <form onSubmit={handleDispenseSubmit} className="space-y-3 overflow-y-auto flex-1 pr-1">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">
                      Položka materiálu zo skladu *
                    </label>
                    <select
                      value={dispenseItemId}
                      onChange={e => setDispenseItemId(e.target.value)}
                      required
                      className="w-full border border-[#E8E2D9] p-2.5 rounded-xl text-xs bg-white focus:border-[#C5A059] outline-none"
                    >
                      <option value="" disabled>Vyberte materiál, šitie, anestéziu alebo prádlo...</option>
                      {allStockItems.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} (Zásoba: {item.quantity} {item.unit}) [{item.supplier}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Množstvo *</label>
                      <input
                        type="number"
                        min="1"
                        value={dispenseQuantity}
                        onChange={e => setDispenseQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full border border-[#E8E2D9] p-2 rounded-xl text-xs bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Typ výdaja *</label>
                      <select
                        value={dispenseType}
                        onChange={e => setDispenseType(e.target.value as any)}
                        className="w-full border border-[#E8E2D9] p-2 rounded-xl text-xs bg-white"
                      >
                        <option value="operacia">🏥 Operácia / Sála</option>
                        <option value="ambulancia">🩺 Ambulancia / Preväz</option>
                        <option value="pradlo">👙 Výdaj prádla</option>
                        <option value="estetika">💉 Estetika</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Dôvod / Názov výkonu</label>
                    <input
                      type="text"
                      value={dispenseProcedureName}
                      onChange={e => setDispenseProcedureName(e.target.value)}
                      placeholder="napr. Pooperačný preväz a extrakcia stehov"
                      className="w-full border border-[#E8E2D9] p-2 rounded-xl text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Poznámka / Veľkosť (voliteľné)</label>
                    <input
                      type="text"
                      value={dispenseNote}
                      onChange={e => setDispenseNote(e.target.value)}
                      placeholder="napr. Veľkosť M, čierna farba, predané na recepcii"
                      className="w-full border border-[#E8E2D9] p-2 rounded-xl text-xs bg-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E2D9]">
                    <button
                      type="button"
                      onClick={() => setIsDispensingMaterial(false)}
                      className="px-4 py-2 border border-[#E8E2D9] rounded-xl text-xs font-semibold hover:bg-[#FAF8F5] cursor-pointer"
                    >
                      Zrušiť
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#C5A059] hover:bg-[#b08d48] text-white rounded-xl text-xs uppercase font-bold tracking-wider cursor-pointer shadow-xs"
                    >
                      Zaevidovať & Odpísať zo skladu
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* MODAL PRE PLÁNOVANIE TERMÍNU / POOPERAČNEJ KONTROLY Z KARTY PACIENTA */}
        {isSchedulingEvent && selectedPatient && (
          <SchedulePatientEventModal
            isOpen={isSchedulingEvent}
            onClose={() => {
              setIsSchedulingEvent(false);
              setSchedulingSourceRecord(null);
              setSchedulingInitialDetails(undefined);
            }}
            patient={selectedPatient}
            sourceRecord={schedulingSourceRecord}
            allRecords={patientRecords[selectedPatient.id] || []}
            initialEventDetails={schedulingInitialDetails}
            onSaveEvent={handleSaveCalendarEvent}
            onNavigateToCalendar={onNavigateToCalendar}
          />
        )}

        {/* MODAL PRE VYTVORENIE PLÁNU PACIENTA (AI & PRESETY) */}
        {isCreatingPlan && selectedPatient && (
          <CreatePatientPlanModal
            isOpen={isCreatingPlan}
            onClose={() => setIsCreatingPlan(false)}
            patient={selectedPatient}
            onSavePlan={handleSaveNewPlan}
          />
        )}

        {/* MODAL PRE DIAGNOSTIKU A PRIPOJENIE GOOGLE DRIVE */}
        <GoogleDriveModal
          isOpen={showDriveModal}
          onClose={() => setShowDriveModal(false)}
        />
      </div>
    </>
  );
}