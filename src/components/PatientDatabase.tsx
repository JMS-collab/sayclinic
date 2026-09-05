'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { googleSignIn, subscribeWorkspaceAuth } from '@/lib/workspaceAuth';
import { CheckCircle, AlertCircle, Cloud, CloudOff, Lock } from 'lucide-react';
import PatientDriveFiles from './PatientDriveFiles';
import { InventoryService, MaterialUsageLog, InventoryItem } from '../services/inventoryService';
import { CalendarEvent, getPostOpTimeDiff } from '../data/calendarConfig';
import { createGoogleCalendarEvent } from '../services/calendarSyncService';
import SchedulePatientEventModal from './patient/SchedulePatientEventModal';
import { PatientPlan, PRESET_PATIENT_PLANS, ScheduledTreatment } from '../data/patientPlanConfig';
import PatientPlanViewer from './patient/PatientPlanViewer';
import CreatePatientPlanModal from './patient/CreatePatientPlanModal';
import AIHealthRoadmapView from './patient/AIHealthRoadmapView';

const INITIAL_DEMO_PLANS: Record<string, PatientPlan[]> = {
  P1: [
    {
      id: 'plan-demo-1',
      patientId: 'P1',
      patientName: 'Mária Kováčová',
      patientBirthNumber: '885512/6789',
      createdAt: '2026-02-15T10:00:00.000Z',
      updatedAt: '2026-02-15T10:00:00.000Z',
      doctorName: 'MUDr. Ján Mráz',
      ...PRESET_PATIENT_PLANS.breast_surgery_care
    } as PatientPlan,
    {
      id: 'plan-demo-2',
      patientId: 'P1',
      patientName: 'Mária Kováčová',
      patientBirthNumber: '885512/6789',
      createdAt: '2026-01-10T14:30:00.000Z',
      updatedAt: '2026-01-10T14:30:00.000Z',
      doctorName: 'MUDr. Ján Mráz',
      ...PRESET_PATIENT_PLANS.face_annual_rejuvenation
    } as PatientPlan
  ],
  P2: [
    {
      id: 'plan-demo-3',
      patientId: 'P2',
      patientName: 'Ján Novák',
      patientBirthNumber: '750314/1234',
      createdAt: '2026-02-01T09:00:00.000Z',
      updatedAt: '2026-02-01T09:00:00.000Z',
      doctorName: 'MUDr. Ján Mráz',
      ...PRESET_PATIENT_PLANS.blepharoplasty_care
    } as PatientPlan
  ]
};

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
}

const MOCK_PATIENTS: Patient[] = [
  { id: 'P1', name: 'Mária Kováčová', birthNumber: '885512/6789', phone: '+421 905 123 456', email: 'maria.kovacova@email.sk', address: 'Slnečná 15, Banská Bystrica', dob: '12.05.1988', insurance: '24 (Dôvera)' },
  { id: 'P2', name: 'Ján Novák', birthNumber: '750314/1234', phone: '+421 948 987 654', email: 'novak.j@email.sk', address: 'Kvetná 8, Zvolen', dob: '14.03.1975', insurance: '25 (VšZP)' },
];

const PHOTO_CATEGORIES = ['Konzultácia', 'Predoperačné', 'Pooperačné', '1. mesiac', '6. mesiac', '1 rok'];

interface UploadedPhoto {
  name: string;
  url: string;
}

interface PatientDatabaseProps {
  onNavigateToGenerator?: (patient: Patient & { initialDocType?: any }) => void;
  onNavigateToAesthetics?: (patient: Patient) => void;
  onNavigateToCosmetics?: (patient?: Patient, prefillItems?: any[]) => void;
  initialPatient?: Patient | null;
  onPatientsUpdated?: (patients: Patient[]) => void;
  calendarEvents?: CalendarEvent[];
  onAddCalendarEvent?: (event: CalendarEvent) => void;
  onNavigateToCalendar?: () => void;
}

export default function PatientDatabase({ 
  onNavigateToGenerator, 
  onNavigateToAesthetics, 
  onNavigateToCosmetics,
  initialPatient, 
  onPatientsUpdated,
  calendarEvents = [],
  onAddCalendarEvent,
  onNavigateToCalendar
}: PatientDatabaseProps) {
  const { data: session } = useSession();
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(initialPatient || null);
  const [activeFolder, setActiveFolder] = useState<'dokumenty' | 'fotodokumentacia' | 'predoperacne' | 'drive' | 'materialy' | 'terminy' | 'plany' | 'roadmap'>('dokumenty');
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // STAV PRE PLÁNY PACIENTA (ROČNÝ ESTETICKÝ & PRED/POOPERAČNÝ PLÁN)
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [workspaceToken, setWorkspaceToken] = useState<string | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);

  useEffect(() => {
    const unsub = subscribeWorkspaceAuth((user, token) => {
      setWorkspaceToken(token);
    });
    return () => unsub();
  }, []);

  const isDriveConnected = Boolean(workspaceToken || (session as any)?.accessToken);

  const handleConnectGoogleDrive = async (): Promise<string | null> => {
    setDriveError(null);
    setIsConnectingDrive(true);
    try {
      const res = await googleSignIn();
      if (res?.accessToken) {
        setWorkspaceToken(res.accessToken);
        return res.accessToken;
      }
    } catch (err: any) {
      console.error('Chyba prihlásenia do Google Drive:', err);
      setDriveError('Pripojenie ku Google Drive zlyhalo. Uistite sa, že máte povolené vyskakovacie okná (popups) a autorizujte prístup k Disku.');
    } finally {
      setIsConnectingDrive(false);
    }
    return null;
  };

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

    try {
      const gRes = await createGoogleCalendarEvent(newEvent, session);
      if (gRes.success && gRes.googleEventId) {
        const syncedEvent: CalendarEvent = { ...newEvent, googleEventId: gRes.googleEventId, isGoogleSynced: true };
        setStoredEvents(prev => {
          const synced = prev.map(e => e.id === newEvent.id ? syncedEvent : e);
          localStorage.setItem('say_clinic_calendar_events', JSON.stringify(synced));
          return synced;
        });
      }
    } catch (err) {
      console.error('Chyba zápisu do Google Kalendára:', err);
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
    insurance: '24 (Dôvera)',
  });

  // STAV PRE ÚPRAVU PACIENTA
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const [patientRecords, setPatientRecords] = useState<Record<string, MedicalRecord[]>>({
    'P1': [
      { id: 'rec-1', type: 'Operačný protokol', typeColor: 'bg-[#2C2A29]', title: 'Augmentácia prsníkov', doctor: 'MUDr. Ján Mráz', diagnosis: 'Z41.1', date: '2026-08-12', content: 'Zákrok prebehol bez komplikácií v celkovej anestézii.\n\nBoli použité silikónové implantáty Motiva 320ml, vložené pod sval. Rany zašité vstrebateľným stehom.\n\nPacientka stabilizovaná, poučená o pooperačnom režime a nutnosti nosiť kompresné prádlo Lipoelastic PI ideal na 6 týždňov.' },
      { id: 'rec-2', type: 'Vstupné vyšetrenie', typeColor: 'bg-[#C5A059]', title: 'Konzultácia - Augmentácia', doctor: 'MUDr. Ján Mráz', diagnosis: 'Z41.1', date: '2026-07-25', content: 'Vstupné vyšetrenie k plánovanej augmentácii prsníkov.\nAnamnéza: negatívna, bez alergií.\n\nObjektívny nález: Prsníky asymetrické, mierna ptóza, koža elastická.\n\nNavrhnutý postup: Augmentácia silikónovými implantátmi, prístup z podprsníkovej ryhy. Pacientka súhlasí s navrhnutým postupom a bola oboznámená s rizikami.' }
    ],
    'P2': [
      { id: 'rec-p2-1', type: 'Operačný protokol', typeColor: 'bg-[#2C2A29]', title: 'Blefaroplastika horných viečok', doctor: 'MUDr. Ján Mráz', diagnosis: 'H02.8', date: '2026-05-18', content: 'Korekcia dermatochalázy horných viečok v lokálnej anestézii.\n\nExcízia prebytočnej kože 8mm obojstranne, parciálna resekcia mediálneho tukového vankúšika. Hemoctáza bipolárnou koaguláciou. Intrakutánna sutura Prolene 6-0.\n\nStehy odstránené na 6. deň, hojenie per primam bez komplikácií. Odporúčaná lokálna silikónová starostlivosť a striktná UV fotoprotekcia.' },
      { id: 'rec-p2-2', type: 'Vstupné vyšetrenie', typeColor: 'bg-[#C5A059]', title: 'Konzultácia - Solárne lézie & Textúra pleti', doctor: 'MUDr. Ján Mráz', diagnosis: 'L57.0', date: '2026-04-10', content: 'Vstupné dermatologické vyšetrenie.\nAnamnéza: častý pobyt na slnku bez SPF ochrany v minulosti.\n\nObjektívny nález: Solárne lentigá v oblasti líc a nosa, zhrubnutá stratum corneum, hlbšie frontálne vrásky.\n\nNavrhnutý plán: Príprava pleti v jarnom období (antioxidanty, SPF 50+), v jesennom/zimnom období aplikácia vaskulárneho/pigmentového lasera a frakčného resurfacingu.' }
    ]
  });

  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [previewRecord, setPreviewRecord] = useState<MedicalRecord | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const [activePhotoCategory, setActivePhotoCategory] = useState<string | null>(null);
  const [patientPhotos, setPatientPhotos] = useState<Record<string, UploadedPhoto[]>>({
    'P1_Predoperačné': [
      { name: 'pred_zpredu.jpg', url: 'https://images.unsplash.com/photo-1512496015851-a90890f5c246?auto=format&fit=crop&w=300&q=80' },
      { name: 'pred_zboku.jpg', url: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=300&q=80' }
    ]
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialPatient) {
      setSelectedPatient(initialPatient);
    }
  }, [initialPatient]);

  // Načítanie zdravotných záznamov z localStorage
  useEffect(() => {
    const savedRecs = localStorage.getItem('say_clinic_patient_records');
    if (savedRecs) {
      try {
        const parsed = JSON.parse(savedRecs);
        if (parsed && typeof parsed === 'object') {
          setPatientRecords(prev => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        console.error('Chyba pri načítaní záznamov pacientov z localStorage:', e);
      }
    }
  }, []);

  // Uloženie záznamov do localStorage pri zmene
  useEffect(() => {
    try {
      localStorage.setItem('say_clinic_patient_records', JSON.stringify(patientRecords));
    } catch (e) {
      console.error('Chyba pri ukladaní záznamov do localStorage:', e);
    }
  }, [patientRecords]);

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

  // 1. Načítanie kešovaných pacientov z localStorage pri štarte
  useEffect(() => {
    const saved = localStorage.getItem('say_clinic_patients');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPatients(parsed);
          if (onPatientsUpdated) onPatientsUpdated(parsed);
        }
      } catch (e) {
        console.error('Chyba pri načítaní pacientov z localStorage:', e);
      }
    }
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
              const updatedAll = [...uniqueNew, ...prev];
              localStorage.setItem('say_clinic_patients', JSON.stringify(updatedAll));
              if (onPatientsUpdated) onPatientsUpdated(updatedAll);
              return updatedAll;
            });
          }
        })
        .catch(err => console.error('Automatický import z Google Drive zlyhal:', err))
        .finally(() => setIsImporting(false));
    }
  }, [session, workspaceToken]);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.birthNumber.includes(searchTerm) ||
    p.phone.includes(searchTerm)
  );

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveFolder('dokumenty');
    setActivePhotoCategory(null);
  };

  // VYTVORENIE PACIENTA S AUTOMATICKÝM VYTVORENÍM ZLOŽKY NA GOOGLE DRIVE
  const handleAddPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientData.name || !newPatientData.birthNumber) return;

    let effectiveToken = workspaceToken || (session as any)?.accessToken;
    if (!effectiveToken) {
      effectiveToken = await handleConnectGoogleDrive();
    }

    if (!effectiveToken) {
      setDriveError('Vytvorenie pacienta bolo zablokované: Systém nie je synchronizovaný s Google Drive. Prihláste sa cez Google účet, aby sa predišlo strate synchronizácie údajov.');
      return;
    }

    setIsCreatingDriveFolder(true);
    setDriveError(null);

    let driveLink = '';
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

      if (!res.ok || !data.success || !data.webViewLink) {
        throw new Error(data.error || 'Server nevytvoril priečinok na Google Drive.');
      }

      driveLink = data.webViewLink;
    } catch (err: any) {
      console.error('Chyba pri vytváraní zložky na Google Drive:', err);
      setDriveError(`Pacient NEBOL vytvorený. Google Drive vrátil chybu: ${err.message || 'Nepodarilo sa vytvoriť zložky'}. Skontrolujte pripojenie a oprávnenia disku.`);
      setIsCreatingDriveFolder(false);
      return; // STRIKTNE ZASTAVÍME - pacient sa bez Drive zložky neuloží!
    } finally {
      setIsCreatingDriveFolder(false);
    }

    const createdPatient: Patient = {
      ...newPatientData,
      id: `P-${Date.now()}`,
      driveFolderLink: driveLink
    };

    const updatedPatients = [createdPatient, ...patients];
    setPatients(updatedPatients);
    localStorage.setItem('say_clinic_patients', JSON.stringify(updatedPatients));
    if (onPatientsUpdated) onPatientsUpdated(updatedPatients);
    
    setIsAddingPatient(false);
    setNewPatientData({
      name: '',
      birthNumber: '',
      phone: '',
      email: '',
      address: '',
      dob: '',
      insurance: '24 (Dôvera)',
    });

    handlePatientSelect(createdPatient);
  };

  // ULOŽENIE ÚPRAVY PACIENTA
  const handleSavePatientEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;

    const updatedPatients = patients.map(p => p.id === editingPatient.id ? editingPatient : p);
    setPatients(updatedPatients);
    localStorage.setItem('say_clinic_patients', JSON.stringify(updatedPatients));
    if (onPatientsUpdated) onPatientsUpdated(updatedPatients);

    if (selectedPatient && selectedPatient.id === editingPatient.id) {
      setSelectedPatient(editingPatient);
    }

    setEditingPatient(null);
  };

  const handleRunDriveImport = async () => {
    let token = workspaceToken || (session as any)?.accessToken;
    if (!token) {
      try {
        const res = await googleSignIn();
        if (res?.accessToken) {
          token = res.accessToken;
        }
      } catch {
        alert('Pre import z Google Disku musíte byť prihlásený cez Google účet.');
        return;
      }
    }

    if (!token) {
      alert('Pre import z Google Disku musíte byť prihlásený cez Google účet.');
      return;
    }

    setIsImporting(true);

    try {
      const res = await fetch('/api/drive/import', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

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
          const updatedAll = [...uniqueNew, ...prev];
          localStorage.setItem('say_clinic_patients', JSON.stringify(updatedAll));
          if (onPatientsUpdated) onPatientsUpdated(updatedAll);
          return updatedAll;
        });

        alert(`🎉 Úspešne sa načítalo a skontrolovalo ${data.totalImported} kariet klientov z Google Disku!`);
      } else {
        alert(`Chyba importu: ${data.error || 'Nepodarilo sa načítať zložku Klienti SAY'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Chyba pri komunikácii s Google Drive API.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteRecord = (recordId: string) => {
    if (!selectedPatient) return;
    if (confirm('Naozaj chcete natrvalo vymazať tento záznam?')) {
      setPatientRecords(prev => ({
        ...prev,
        [selectedPatient.id]: prev[selectedPatient.id].filter(r => r.id !== recordId)
      }));
    }
  };

  const handleSaveEdit = () => {
    if (!selectedPatient || !editingRecord) return;
    setPatientRecords(prev => ({
      ...prev,
      [selectedPatient.id]: prev[selectedPatient.id].map(r => r.id === editingRecord.id ? editingRecord : r)
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
                <button onClick={() => { setIsAddingPatient(false); setDriveError(null); }} className="text-xs text-[#8C857B] hover:text-[#2C2A29] font-bold">✕</button>
              </div>

              {/* STAV SYNCHRONIZÁCIE GOOGLE DRIVE V MODALE */}
              {isDriveConnected ? (
                <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <strong className="block font-semibold">Google Drive je synchronizovaný</strong>
                    <span className="text-[11px] text-emerald-700">
                      Pre klienta sa automaticky vygeneruje zložka v <strong>Klienti SAY</strong> s podzložkami (Fotodokumentácia, Predoperačné vyšetrenia, Dokumenty).
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mb-4 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl p-3.5 text-xs space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-rose-950">
                    <CloudOff className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Vytvorenie pacienta je zablokované (Drive nie je pripojený)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-rose-800">
                    Aby sa predišlo zaevidovaniu klienta bez zložky na Google Disku, systém vyžaduje aktívne pripojenie ku Google Drive pred uložením údajov.
                  </p>
                  <button
                    type="button"
                    onClick={handleConnectGoogleDrive}
                    disabled={isConnectingDrive}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    <span>{isConnectingDrive ? 'Pripájam k Google...' : 'Pripojiť Google Drive teraz'}</span>
                  </button>
                </div>
              )}

              {driveError && (
                <div className="mb-4 bg-red-100 border border-red-300 text-red-900 rounded-xl p-3 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{driveError}</span>
                </div>
              )}

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
                      <option value="24 (Dôvera)">24 (Dôvera)</option>
                      <option value="25 (VšZP)">25 (VšZP)</option>
                      <option value="27 (Union)">27 (Union)</option>
                      <option value="Samoplatca">Samoplatca</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#E8E2D9] mt-4">
                  <button type="button" onClick={() => { setIsAddingPatient(false); setDriveError(null); }} className="px-4 py-2 text-xs font-bold text-[#8C857B] hover:text-[#2C2A29] cursor-pointer">ZRUŠIŤ</button>
                  <button 
                    type="submit" 
                    disabled={!isDriveConnected || isCreatingDriveFolder} 
                    className={`px-5 py-2 text-xs font-bold rounded-xl uppercase tracking-wider transition-colors shadow-sm flex items-center gap-2 ${
                      !isDriveConnected
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                        : 'bg-[#2C2A29] hover:bg-[#C5A059] text-white cursor-pointer'
                    }`}
                  >
                    {!isDriveConnected && <Lock className="w-3.5 h-3.5" />}
                    {isCreatingDriveFolder ? '⏳ Vytváram zložky na Google Drive...' : '+ Uložiť & Vytvoriť zložky na Disku'}
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

                <div className="flex justify-end gap-2 pt-4 border-t border-[#E8E2D9] mt-4">
                  <button type="button" onClick={() => setEditingPatient(null)} className="px-4 py-2 text-xs font-bold text-[#8C857B] hover:text-[#2C2A29]">ZRUŠIŤ</button>
                  <button type="submit" className="px-5 py-2 bg-[#C5A059] hover:bg-[#b08d4b] text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-colors shadow-sm">ULOŽIŤ ZMENY</button>
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
                <h2 className="font-brand text-2xl font-bold text-[#2C2A29] uppercase">Kartotéka Pacientov</h2>
                <p className="text-[10px] uppercase tracking-widest text-[#8C857B]">
                  Zoznam klientov a ich zdravotná história ({patients.length})
                  {isImporting && <span className="ml-2 text-[#C5A059] font-bold animate-pulse">🔄 Synchronizujem s Google Drive...</span>}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Indikátor synchronizácie Google Drive */}
                {isDriveConnected ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Google Drive pripojený</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnectGoogleDrive}
                    disabled={isConnectingDrive}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
                    title="Kliknite pre pripojenie a synchronizáciu s Google Drive"
                  >
                    <CloudOff className="w-3.5 h-3.5 text-amber-700" />
                    <span>{isConnectingDrive ? 'Pripájam Drive...' : 'Pripojiť Google Drive'}</span>
                  </button>
                )}

                <button 
                  onClick={handleRunDriveImport}
                  disabled={isImporting}
                  className="bg-[#C5A059] hover:bg-[#b08d4b] text-white px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{isImporting ? '⏳' : '⚡'}</span>
                  <span>{isImporting ? 'Synchronizujem...' : 'Obnoviť z Drive'}</span>
                </button>

                <button 
                  onClick={async () => {
                    if (!isDriveConnected) {
                      const token = await handleConnectGoogleDrive();
                      if (token) {
                        setIsAddingPatient(true);
                      }
                    } else {
                      setIsAddingPatient(true);
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isDriveConnected
                      ? 'bg-[#2C2A29] hover:bg-[#C5A059] text-white'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300'
                  }`}
                  title={!isDriveConnected ? 'Pre vytvorenie pacienta sa vyžaduje pripojenie Google Drive' : '+ Nový pacient'}
                >
                  {!isDriveConnected && <Lock className="w-3.5 h-3.5 text-amber-600" />}
                  <span>+ Nový pacient</span>
                </button>
              </div>
            </div>

            <input 
              type="text" 
              placeholder="Vyhľadať pacienta po mene, RČ alebo telefóne..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full border border-[#E8E2D9] p-3 rounded-xl bg-[#FBF9F6] text-xs focus:ring-2 focus:ring-[#C5A059] outline-none" 
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatients.map(patient => (
                <div 
                  key={patient.id} 
                  className="border border-[#E8E2D9] p-4 rounded-xl hover:border-[#C5A059] hover:shadow-md transition-all bg-white group flex flex-col justify-between"
                >
                  <div onClick={() => handlePatientSelect(patient)} className="cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-[#2C2A29] group-hover:text-[#C5A059] transition-colors">{patient.name}</h3>
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
                        className="text-[#8C857B] hover:text-[#C5A059] font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
                      >
                        ✏️ Upraviť
                      </button>

                      {onNavigateToAesthetics && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToAesthetics(patient);
                          }}
                          className="text-[#C5A059] hover:text-[#9C7D2B] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 border-l border-[#E8E2D9] pl-2"
                        >
                          💉 Výplne & Botox
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
              ))}
            </div>
          </div>
        ) : (
          
          /* POHĽAD 2: KARTA PACIENTA */
          <div className="space-y-6 print:hidden">
            <button onClick={() => setSelectedPatient(null)} className="text-[10px] uppercase font-bold text-[#8C857B] hover:text-[#2C2A29] flex items-center gap-1 transition-colors">
              ← Späť na zoznam pacientov
            </button>

            <div className="bg-[#FBF9F6] border border-[#E8E2D9] p-5 rounded-xl flex flex-col md:flex-row justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-brand text-2xl font-bold text-[#2C2A29] uppercase">{selectedPatient.name}</h2>
                  <button 
                    onClick={() => setEditingPatient(selectedPatient)}
                    className="text-xs bg-white border border-[#E8E2D9] px-2.5 py-1 rounded-lg text-[#8C857B] hover:text-[#C5A059] font-bold shadow-sm transition-colors"
                  >
                    ✏️ Upraviť
                  </button>
                  <button
                    onClick={() => handleOpenScheduleModal()}
                    className="text-xs bg-sky-700 hover:bg-sky-800 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Naplánovať termín alebo pooperačnú kontrolu priamo do kalendára"
                  >
                    <span>📅</span> + Naplánovať termín / kontrolu
                  </button>
                  <button
                    onClick={() => {
                      setActiveFolder('roadmap');
                      setActivePhotoCategory(null);
                    }}
                    className="text-xs bg-gradient-to-r from-[#2C2A29] to-[#3D3A38] hover:from-[#C5A059] hover:to-[#B38F46] text-white px-3 py-1.5 rounded-lg font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer border border-[#C5A059]/40"
                    title="12-mesačný personalizovaný plán liečby a ošetrení vygenerovaný modelom Gemini"
                  >
                    <span>✨</span> AI Plán Liečby
                  </button>
                  <button
                    onClick={() => setIsCreatingPlan(true)}
                    className="text-xs bg-[#C5A059] hover:bg-[#b38d45] text-white px-3 py-1.5 rounded-lg font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Vytvoriť ročný estetický alebo pred/pooperačný plán starostlivosti"
                  >
                    <span>📋</span> + Plán starostlivosti
                  </button>
                  {onNavigateToAesthetics && (
                    <button
                      onClick={() => onNavigateToAesthetics(selectedPatient)}
                      className="text-xs bg-gradient-to-r from-[#C5A059] to-[#B38F46] text-white px-3 py-1 rounded-lg font-bold shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5"
                    >
                      💉 Aplikovať výplne / Botox (Face Mapping)
                    </button>
                  )}
                </div>
                <p className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold mt-1">Karta pacienta</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2 text-xs">
                <div><span className="text-[#8C857B] block text-[9px] uppercase">Rodné číslo:</span><span className="font-semibold">{selectedPatient.birthNumber}</span></div>
                <div><span className="text-[#8C857B] block text-[9px] uppercase">Dátum nar.:</span><span className="font-semibold">{selectedPatient.dob}</span></div>
                <div><span className="text-[#8C857B] block text-[9px] uppercase">Poisťovňa:</span><span className="font-semibold">{selectedPatient.insurance}</span></div>
                <div><span className="text-[#8C857B] block text-[9px] uppercase">Telefón:</span><span className="font-semibold">{selectedPatient.phone}</span></div>
                <div><span className="text-[#8C857B] block text-[9px] uppercase">Email:</span><span className="font-semibold">{selectedPatient.email}</span></div>
                <div><span className="text-[#8C857B] block text-[9px] uppercase">Bydlisko:</span><span className="font-semibold">{selectedPatient.address}</span></div>
              </div>
            </div>

            {/* PREPOJENIE SO ZLOŽKOU "KLIENTI SAY" NA GOOGLE DRIVE */}
            <PatientDriveFiles patientName={selectedPatient.name} />

            {(() => {
              const patientEvents = storedEvents.filter(evt => 
                (evt.patientId && evt.patientId === selectedPatient.id) ||
                (evt.patientName && selectedPatient.name && (
                  evt.patientName.toLowerCase().includes(selectedPatient.name.toLowerCase()) ||
                  selectedPatient.name.toLowerCase().includes(evt.patientName.toLowerCase())
                ))
              );
              const currentPatientPlans = allPatientPlans[selectedPatient.id] || [];

              return (
                <div className="flex flex-wrap gap-2 border-b border-[#E8E2D9]">
                  <button onClick={() => { setActiveFolder('dokumenty'); setActivePhotoCategory(null); }} className={`px-4 py-2 text-xs uppercase font-bold tracking-wider rounded-t-lg transition-colors ${ activeFolder === 'dokumenty' ? 'bg-[#2C2A29] text-white' : 'bg-[#FBF9F6] text-[#8C857B] hover:bg-[#E8E2D9]' }`}>📄 Dokumenty & Záznamy</button>
                  <button onClick={() => { setActiveFolder('roadmap'); setActivePhotoCategory(null); }} className={`px-4 py-2 text-xs uppercase font-bold tracking-wider rounded-t-lg transition-colors flex items-center gap-1.5 ${ activeFolder === 'roadmap' ? 'bg-[#2C2A29] text-white shadow-xs' : 'bg-[#FBF9F6] text-[#8C857B] hover:bg-[#E8E2D9]' }`}>
                    <span className="text-[#C5A059]">✨</span>
                    <span>AI Plán Liečby</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${activeFolder === 'roadmap' ? 'bg-[#C5A059] text-white' : 'bg-[#C5A059]/20 text-[#C5A059]'}`}>
                      12M
                    </span>
                  </button>
                  <button onClick={() => { setActiveFolder('plany'); setActivePhotoCategory(null); }} className={`px-4 py-2 text-xs uppercase font-bold tracking-wider rounded-t-lg transition-colors flex items-center gap-1.5 ${ activeFolder === 'plany' ? 'bg-[#2C2A29] text-white' : 'bg-[#FBF9F6] text-[#8C857B] hover:bg-[#E8E2D9]' }`}>
                    <span>📋 Plán pacienta & Starostlivosť</span>
                    {currentPatientPlans.length > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeFolder === 'plany' ? 'bg-[#C5A059] text-white' : 'bg-[#C5A059]/20 text-[#C5A059]'}`}>
                        {currentPatientPlans.length}
                      </span>
                    )}
                  </button>
                  <button onClick={() => { setActiveFolder('terminy'); setActivePhotoCategory(null); }} className={`px-4 py-2 text-xs uppercase font-bold tracking-wider rounded-t-lg transition-colors flex items-center gap-1.5 ${ activeFolder === 'terminy' ? 'bg-[#2C2A29] text-white' : 'bg-[#FBF9F6] text-[#8C857B] hover:bg-[#E8E2D9]' }`}>
                    <span>📅 Termíny & Kontroly</span>
                    {patientEvents.length > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeFolder === 'terminy' ? 'bg-sky-600 text-white' : 'bg-sky-100 text-sky-800'}`}>
                        {patientEvents.length}
                      </span>
                    )}
                  </button>
                  <button onClick={() => setActiveFolder('fotodokumentacia')} className={`px-4 py-2 text-xs uppercase font-bold tracking-wider rounded-t-lg transition-colors ${ activeFolder === 'fotodokumentacia' ? 'bg-[#2C2A29] text-white' : 'bg-[#FBF9F6] text-[#8C857B] hover:bg-[#E8E2D9]' }`}>📸 Fotodokumentácia</button>
                  <button onClick={() => { setActiveFolder('predoperacne'); setActivePhotoCategory(null); }} className={`px-4 py-2 text-xs uppercase font-bold tracking-wider rounded-t-lg transition-colors ${ activeFolder === 'predoperacne' ? 'bg-[#2C2A29] text-white' : 'bg-[#FBF9F6] text-[#8C857B] hover:bg-[#E8E2D9]' }`}>🩸 Výsledky & Vyšetrenia</button>
                  <button onClick={() => { setActiveFolder('materialy'); setActivePhotoCategory(null); }} className={`px-4 py-2 text-xs uppercase font-bold tracking-wider rounded-t-lg transition-colors flex items-center gap-1.5 ${ activeFolder === 'materialy' ? 'bg-[#2C2A29] text-white' : 'bg-[#FBF9F6] text-[#8C857B] hover:bg-[#E8E2D9]' }`}>
                    <span>📦 Minutý materiál & Prádlo</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeFolder === 'materialy' ? 'bg-[#C5A059] text-white' : 'bg-[#E8E2D9] text-[#2C2A29]'}`}>
                      {patientMaterialLogs.length}
                    </span>
                  </button>
                </div>
              );
            })()}

            <div className="min-h-[350px] border border-[#E8E2D9] rounded-b-xl rounded-tr-xl p-5 bg-white">
              
              {/* ZÁLOŽKA DOKUMENTY */}
              {activeFolder === 'dokumenty' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                    <p className="text-[10px] uppercase text-[#8C857B] font-bold">História zdravotných záznamov & Protokolov</p>
                    <div className="flex items-center gap-2">
                      {onNavigateToAesthetics && (
                        <button 
                          onClick={() => onNavigateToAesthetics(selectedPatient)} 
                          className="text-[11px] bg-[#2C2A29] text-white px-3 py-1.5 rounded uppercase font-bold shadow-sm hover:bg-[#C5A059] transition-colors flex items-center gap-1"
                        >
                          💉 + Face Mapping
                        </button>
                      )}
                      <button 
                        onClick={() => onNavigateToGenerator && onNavigateToGenerator({ ...selectedPatient, initialDocType: 'lekarsky_recept' })} 
                        className="text-[11px] bg-[#047857] text-white px-3 py-1.5 rounded uppercase font-bold shadow-sm hover:bg-[#065f46] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        💊 + Vystaviť recept (A6)
                      </button>
                      <button 
                        onClick={() => handleOpenScheduleModal()} 
                        className="text-[11px] bg-sky-700 hover:bg-sky-800 text-white px-3 py-1.5 rounded uppercase font-bold shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                        title="Naplánovať pooperačnú kontrolu alebo termín do kalendára"
                      >
                        <span>📅</span> + Naplánovať kontrolu
                      </button>
                      <button onClick={() => onNavigateToGenerator && onNavigateToGenerator(selectedPatient)} className="text-[11px] bg-[#C5A059] text-white px-3 py-1.5 rounded uppercase font-bold shadow-sm hover:bg-[#b38d45] cursor-pointer">
                        + Vytvoriť nový záznam
                      </button>
                    </div>
                  </div>
                  
                  {patientRecords[selectedPatient.id] && patientRecords[selectedPatient.id].length > 0 ? (
                    patientRecords[selectedPatient.id].map(record => (
                      <div key={record.id} className="border border-[#E8E2D9] rounded-lg p-3 flex justify-between items-center hover:bg-[#FBF9F6] transition-colors">
                        <div>
                          <span className={`text-[9px] text-white px-2 py-0.5 rounded uppercase mr-2 font-bold ${record.typeColor}`}>{record.type}</span>
                          <span className="text-xs font-bold text-[#2C2A29]">{record.title}</span>
                          <p className="text-[10px] text-[#8C857B] mt-1">Lekár: {record.doctor} {record.diagnosis && `| Diagnóza: ${record.diagnosis}`}</p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <p className="text-xs font-mono text-[#8C857B] font-bold">{new Date(record.date).toLocaleDateString('sk-SK')}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            {(record.type?.toLowerCase().includes('opera') || record.type?.toLowerCase().includes('protokol') || record.title?.toLowerCase().includes('augmentác') || record.title?.toLowerCase().includes('lipo')) && (
                              <button 
                                onClick={() => handleOpenScheduleModal(record)} 
                                className="text-[10px] text-sky-900 bg-sky-100 hover:bg-sky-200 border border-sky-300 px-2.5 py-1 rounded uppercase font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Naplánovať pooperačnú kontrolu s automaticky načítanými údajmi z tohto operačného protokolu"
                              >
                                <span>🩺</span> Naplánovať kontrolu
                              </button>
                            )}
                            <button onClick={() => setEditingRecord(record)} className="text-[10px] text-[#8C857B] hover:text-[#C5A059] uppercase font-bold transition-colors">✏️ Upraviť</button>
                            <button onClick={() => handleDeleteRecord(record.id)} className="text-[10px] text-[#8C857B] hover:text-rose-600 uppercase font-bold transition-colors">🗑️ Zmazať</button>
                            <button onClick={() => setPreviewRecord(record)} className="text-[10px] text-[#C5A059] uppercase font-bold transition-colors border-l border-[#E8E2D9] pl-2 ml-1">
                              📄 Náhľad & PDF
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#8C857B] text-center py-6">Tento pacient zatiaľ nemá žiadne lokálne záznamy.</p>
                  )}
                </div>
              )}

              {/* ZÁLOŽKA FOTOGRAFIE */}
              {activeFolder === 'fotodokumentacia' && (
                <div>
                  {!activePhotoCategory ? (
                    <>
                      <p className="text-[10px] uppercase text-[#8C857B] font-bold mb-4">Fotografické zložky pacienta</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {PHOTO_CATEGORIES.map(cat => {
                          const key = `${selectedPatient.id}_${cat}`;
                          const count = patientPhotos[key]?.length || 0;
                          return (
                            <div key={cat} onClick={() => setActivePhotoCategory(cat)} className="border border-[#E8E2D9] rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#C5A059] hover:bg-[#FBF9F6] transition-all group">
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
                          <button onClick={() => setActivePhotoCategory(null)} className="text-[18px] text-[#8C857B] hover:text-[#2C2A29] transition-colors">←</button>
                          <h3 className="text-sm font-bold text-[#2C2A29] uppercase">📁 {activePhotoCategory}</h3>
                        </div>
                        <label className="cursor-pointer bg-[#2C2A29] hover:bg-[#C5A059] text-white px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-colors flex items-center gap-1 shadow-sm">
                          <span>+ Hromadné nahratie fotiek</span>
                          <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
                        </label>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {patientPhotos[`${selectedPatient.id}_${activePhotoCategory}`]?.map((photo, idx) => (
                          <div key={idx} className="relative group rounded-lg overflow-hidden border border-[#E8E2D9] aspect-square bg-[#FBF9F6]">
                            <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ZÁLOŽKA PREDOPERAČNÉ */}
              {activeFolder === 'predoperacne' && (
                <div>
                  <p className="text-[10px] uppercase text-[#8C857B] font-bold mb-4">Výsledky laboratórií a vyšetrení</p>
                  <div className="border border-[#E8E2D9] rounded-lg p-3 flex justify-between items-center hover:bg-[#FBF9F6] transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="bg-rose-100 text-rose-600 p-2 rounded text-xs font-bold">PDF</div>
                      <div><p className="text-xs font-bold text-[#2C2A29]">Predoperačné interné vyšetrenie</p></div>
                    </div>
                    <button className="text-[10px] text-[#C5A059] uppercase font-bold">Stiahnuť</button>
                  </div>
                </div>
              )}

              {/* ZÁLOŽKA MINUTÝ MATERIÁL & PRÁDLO */}
              {activeFolder === 'materialy' && (
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

                    <button
                      type="button"
                      onClick={() => {
                        setIsDispensingMaterial(true);
                        setDispenseItemId(allStockItems[0]?.id || '');
                      }}
                      className="text-xs bg-[#2C2A29] hover:bg-[#C5A059] text-white px-3.5 py-2 rounded-xl uppercase font-bold tracking-wider shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>+ Vystaviť / Odpísať materiál</span>
                    </button>
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
                        Materiál sa automaticky odpisuje zo skladu pri ukladaní operačného protokolu, estetického ošetrenia (Face Mapping), kontrolného vyšetrenia alebo priamom výdaji pooperačnej bielizne.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDispensingMaterial(true);
                          setDispenseItemId(allStockItems[0]?.id || '');
                        }}
                        className="mt-4 text-xs bg-[#C5A059] text-white px-4 py-2 rounded-xl uppercase font-bold hover:bg-[#b08d48] cursor-pointer"
                      >
                        + Zaznamenať výdaj materiálu
                      </button>
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

              {/* ZÁLOŽKA TERMÍNY & POOPERAČNÉ KONTROLY */}
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
                        <div className="text-center py-10 border border-dashed border-[#E8E2D9] rounded-xl space-y-3">
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

              {/* ZÁLOŽKA PLÁN PACIENTA (ROČNÝ ESTETICKÝ & PRED/POOPERAČNÝ PLÁN) */}
              {activeFolder === 'plany' && (
                <div className="space-y-6">
                  {(() => {
                    const patientPlans = allPatientPlans[selectedPatient.id] || [];
                    const currentActivePlan = patientPlans.find(p => p.id === selectedPlanId) || patientPlans[0];

                    return (
                      <div className="space-y-6">
                        {/* HORNÁ LIŠTA: PREPÍNAČ MEDZI PLÁNMI + VYTVORENIE NOVÉHO */}
                        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#FBF9F6] rounded-2xl border border-[#E8E2D9]">
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
                                  <span className="truncate max-w-[220px]">{pl.title}</span>
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
                            onUpdatePlan={handleUpdatePlan}
                            onScheduleTreatment={handleScheduleTreatmentFromPlan}
                            onOpenInCosmeticsPOS={(items, patientId) => {
                              const pat = patients.find(p => p.id === patientId) || selectedPatient || undefined;
                              if (onNavigateToCosmetics) {
                                onNavigateToCosmetics(pat, items.map(it => ({
                                  name: it.productName,
                                  brand: it.brand,
                                  price: it.price,
                                  quantity: 1
                                })));
                              }
                            }}
                          />
                        ) : (
                          <div className="text-center py-16 px-4 bg-[#FBF9F6]/50 rounded-2xl border border-dashed border-[#E8E2D9] space-y-4">
                            <div className="w-16 h-16 rounded-full bg-[#C5A059]/15 text-[#C5A059] flex items-center justify-center mx-auto text-2xl">
                              ✨
                            </div>
                            <div className="max-w-md mx-auto">
                              <h3 className="text-base font-bold text-[#2C2A29]">Žiaden plán pacienta</h3>
                              <p className="text-xs text-[#8C857B] mt-1">
                                Vytvorte personalizovaný ročný estetický plán (odporúčaná ranná a večerná kozmetika, procedúry a biostimulácie na 12 mesiacov) alebo kompletný plán pred a po operácii (príprava, režimové opatrenia, starostlivosť o jazvy, laser a microneedling).
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

              {/* ZÁLOŽKA AI HEALTH ROADMAP (12-MESAČNÝ LIEČEBNÝ A SKINCARE PLÁN) */}
              {activeFolder === 'roadmap' && (
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
            </div>
          </div>
        )}

        {/* MODAL: RÝCHLY VÝDAJ MATERIÁLU NA PACIENTA */}
        {isDispensingMaterial && selectedPatient && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E8E2D9] space-y-4">
              <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-3">
                <div>
                  <h3 className="font-bold text-sm text-[#2C2A29] uppercase tracking-wide">
                    Výdaj / Odpis materiálu zo skladu
                  </h3>
                  <p className="text-xs text-[#8C857B]">Klient: <strong className="text-[#2C2A29]">{selectedPatient.name}</strong> ({selectedPatient.birthNumber})</p>
                </div>
                <button
                  onClick={() => setIsDispensingMaterial(false)}
                  className="text-[#8C857B] hover:text-[#2C2A29] text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleDispenseSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Položka materiálu zo skladu *</label>
                  <select
                    value={dispenseItemId}
                    onChange={e => setDispenseItemId(e.target.value)}
                    required
                    className="w-full border border-[#E8E2D9] p-2.5 rounded-xl text-xs bg-white focus:border-[#C5A059] outline-none"
                  >
                    <option value="" disabled>Vyberte materiál alebo prádlo zo skladu...</option>
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
                      <option value="pradlo">👙 Výdaj prádla</option>
                      <option value="ambulancia">🩺 Ambulancia / Preväz</option>
                      <option value="operacia">🏥 Operácia / Sála</option>
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
                    placeholder="napr. Výdaj pooperačného prádla po augmentácii"
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
      </div>
    </>
  );
}