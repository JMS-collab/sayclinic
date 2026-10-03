'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Plus, 
  X, 
  Check, 
  Clock, 
  Calendar, 
  FileText, 
  Sparkles, 
  Syringe, 
  Stethoscope, 
  ChevronRight, 
  ChevronDown, 
  Trash2, 
  Filter,
  PanelRightClose,
  RefreshCw,
  Pill,
  HardDrive,
  Lightbulb,
  ExternalLink,
  Info
} from 'lucide-react';
import { Patient, MedicalRecord } from './PatientDatabase';
import { RealtimeSyncService } from '../services/realtimeSyncService';
import { AIPatientSummary } from '../app/api/ai/patient-summary/route';
import { getAccessToken, subscribeWorkspaceAuth } from '@/lib/workspaceAuth';

export interface ClinicalAllergy {
  id: string;
  name: string;
  reaction?: string;
  severity: 'critical' | 'warning';
  addedAt: string;
}

export interface ClinicalRisk {
  id: string;
  name: string;
  category?: string;
  addedAt: string;
}

export interface ClinicalNote {
  id: string;
  date: string;
  author: string;
  content: string;
  urgent?: boolean;
}

export interface PatientClinicalProfile {
  allergies: ClinicalAllergy[];
  risks: ClinicalRisk[];
  notes: ClinicalNote[];
}

const DEFAULT_PATIENT_PROFILES: Record<string, PatientClinicalProfile> = {
  P1: {
    allergies: [
      { id: 'al-1', name: 'Penicilín', reaction: 'kožný exantém, dýchavičnosť', severity: 'critical', addedAt: '2026-01-10' },
      { id: 'al-2', name: 'Mesocain', reaction: 'anafylaktoidná kožná reakcia', severity: 'critical', addedAt: '2026-03-15' }
    ],
    risks: [
      { id: 'rk-1', name: 'Sklon ku keloidným jazvám (anamnéza po appendektómii)', category: 'Hojenie rán', addedAt: '2026-01-10' },
      { id: 'rk-2', name: 'Hormonálna antikoncepcia (vysadiť pred CA)', category: 'Tromboembolické riziko', addedAt: '2026-07-20' }
    ],
    notes: [
      { id: 'nt-1', date: '2026-08-14', author: 'MUDr. Ján Mráz', content: 'Pooperačná kontrola 48h: Drenáž odstránená, rany bez hematómu. Kompresná podprsenka sedí optimálne. Hojenie per primam.', urgent: false },
      { id: 'nt-2', date: '2026-07-28', author: 'MUDr. Sroková', content: 'Predoperačné výsledky: KO, koagulácie a EKG v norme. Interné predoperačné vyšetrenie: schopná výkonu v CA.', urgent: false }
    ]
  },
  P2: {
    allergies: [
      { id: 'al-3', name: 'Jódové kontrastné látky', reaction: 'erytém, pruritus', severity: 'critical', addedAt: '2025-11-04' }
    ],
    risks: [
      { id: 'rk-3', name: 'Artériová hypertenzia (kompenzovaná Prestarium 5mg)', category: 'Kardiovaskulárne', addedAt: '2026-02-12' },
      { id: 'rk-4', name: 'Bývalý fajčiar (abstinencia 3 roky)', category: 'Anestézia', addedAt: '2026-02-12' }
    ],
    notes: [
      { id: 'nt-3', date: '2026-07-10', author: 'MUDr. Ján Mráz', content: 'Konzultácia: plánovaná blefaroplastika horných viečok v lokálnej anestézii. Pacient poučený o pooperačnom chladení.', urgent: false }
    ]
  },
  P3: {
    allergies: [
      { id: 'al-4', name: 'Bez známych liekových alergií (negatívna)', reaction: '', severity: 'warning', addedAt: '2026-01-05' }
    ],
    risks: [
      { id: 'rk-5', name: 'Sezónna peľová rinitída (jar/leto)', category: 'Imunológia', addedAt: '2026-01-05' }
    ],
    notes: [
      { id: 'nt-4', date: '2026-06-15', author: 'MUDr. Ján Mráz', content: 'Preventívna dermatoskopia materských znamienok – všetky sledované lézie bez atypií. Kontrola o rok.', urgent: false }
    ]
  }
};

interface PatientTimelineSidebarProps {
  patient: Patient;
  records: MedicalRecord[];
  calendarEvents?: any[];
  onClose: () => void;
  onNavigateToRecord?: (recordId: string) => void;
}

export default function PatientTimelineSidebar({
  patient,
  records,
  calendarEvents = [],
  onClose,
  onNavigateToRecord
}: PatientTimelineSidebarProps) {
  // Stavy profilu pacienta
  const [profiles, setProfiles] = useState<Record<string, PatientClinicalProfile>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('say_clinic_patient_clinical_timeline_v1');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Chyba načítania klinického profilu:', e);
      }
    }
    return DEFAULT_PATIENT_PROFILES;
  });

  // Estetické sedenia z modulu estetiky
  const [aestheticSessions, setAestheticSessions] = useState<any[]>([]);
  // Vystavené lekárske recepty
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  // Google Drive súbory
  const [driveFiles, setDriveFiles] = useState<any[]>([]);

  // AI Súhrn z Gemini 3.8 Flash
  const [aiSummary, setAiSummary] = useState<AIPatientSummary | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Filter kategórií na časovej osi
  const [activeFilter, setActiveFilter] = useState<'all' | 'surgery' | 'aesthetic' | 'prescription' | 'notes'>('all');

  // Formulár pre novú poznámku
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteAuthor, setNoteAuthor] = useState('MUDr. Ján Mráz');
  const [noteUrgent, setNoteUrgent] = useState(false);

  // Formulár pre novú alergiu / riziko
  const [isAddingAllergy, setIsAddingAllergy] = useState(false);
  const [itemType, setItemType] = useState<'allergy' | 'risk'>('allergy');
  const [itemName, setItemName] = useState('');
  const [itemDetail, setItemDetail] = useState('');

  // Rozbalené položky pre čítanie detailu
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Načítanie estetických sedení
  useEffect(() => {
    if (typeof window !== 'undefined' && patient.id) {
      try {
        const saved = localStorage.getItem('say_clinic_aesthetic_sessions');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed[patient.id]) {
            setAestheticSessions(parsed[patient.id]);
          } else {
            setAestheticSessions([]);
          }
        }
      } catch (e) {
        console.error('Chyba načítania estetických sedení:', e);
      }
    }
  }, [patient.id]);

  // Načítanie receptov
  useEffect(() => {
    if (typeof window !== 'undefined' && patient.id) {
      try {
        const saved = localStorage.getItem('say_clinic_prescriptions');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const patientRxs = parsed.filter((rx: any) => 
              rx.patientId === patient.id || 
              (rx.patientName && patient.name && rx.patientName.toLowerCase() === patient.name.toLowerCase())
            );
            setPrescriptions(patientRxs);
          }
        }
      } catch (e) {
        console.error('Chyba načítania receptov:', e);
      }
    }
  }, [patient.id, patient.name]);

  // Načítanie súborov z Google Drive pre pacienta
  useEffect(() => {
    let isMounted = true;
    const loadDriveFiles = async () => {
      if (!patient.name) return;
      try {
        const headers: Record<string, string> = {};
        const token = await getAccessToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`/api/drive?patientName=${encodeURIComponent(patient.name)}`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.files && Array.isArray(data.files)) {
            setDriveFiles(data.files);
          }
        }
      } catch (err) {
        // Tichý fallback, ak Drive nie je pripojený
      }
    };
    loadDriveFiles();
    return () => { isMounted = false; };
  }, [patient.name]);

  // Načítanie existujúceho AI súhrnu z cache
  useEffect(() => {
    if (typeof window !== 'undefined' && patient.id) {
      try {
        const cached = localStorage.getItem(`say_clinic_ai_summary_${patient.id}`);
        if (cached) {
          setAiSummary(JSON.parse(cached));
        } else {
          setAiSummary(null);
        }
      } catch (e) {
        console.error('Chyba načítania AI súhrnu z cache:', e);
      }
    }
  }, [patient.id]);

  // Real-time počúvanie zmien klinických profilov z iných staníc (lekár + sestra)
  useEffect(() => {
    const unsub = RealtimeSyncService.subscribe('clinical_timeline_profiles', (updated) => {
      if (updated && typeof updated === 'object') {
        setProfiles(prev => ({ ...prev, ...updated }));
      }
    });
    return () => unsub();
  }, []);

  const currentProfile = profiles[patient.id] || {
    allergies: [],
    risks: [],
    notes: []
  };

  // Synchronizácia do localStorage a siete
  const saveProfiles = (newProfiles: Record<string, PatientClinicalProfile>) => {
    setProfiles(newProfiles);
    try {
      localStorage.setItem('say_clinic_patient_clinical_timeline_v1', JSON.stringify(newProfiles));
      RealtimeSyncService.publish('clinical_timeline_profiles', newProfiles);
    } catch (e) {
      console.error('Chyba uloženia profilu:', e);
    }
  };

  // Funkcia pre volanie Gemini AI súhrnu
  const handleGenerateAISummary = useCallback(async (isFresh = false) => {
    if (!patient.id) return;
    setIsGeneratingAI(true);
    setAiError(null);

    try {
      const payload = {
        patient,
        records,
        aestheticSessions,
        prescriptions,
        calendarEvents,
        driveFiles: driveFiles.map(f => ({ name: f.name, mimeType: f.mimeType })),
        existingClinicalProfile: currentProfile
      };

      const res = await fetch('/api/ai/patient-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Chyba pri volaní AI: ${res.statusText}`);
      }

      const summary: AIPatientSummary = await res.json();
      setAiSummary(summary);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`say_clinic_ai_summary_${patient.id}`, JSON.stringify(summary));
      }
    } catch (err: any) {
      console.error('Chyba generovania AI súhrnu:', err);
      setAiError('Nepodarilo sa obnoviť AI súhrn. Zobrazuje sa lokálny stav.');
    } finally {
      setIsGeneratingAI(false);
    }
  }, [patient, records, aestheticSessions, prescriptions, calendarEvents, driveFiles, currentProfile]);

  // Automatické vygenerovanie AI súhrnu pri prvom otvorení karty, ak ešte neexistuje
  useEffect(() => {
    if (!aiSummary && !isGeneratingAI && patient.id) {
      handleGenerateAISummary();
    }
  }, [patient.id, aiSummary, isGeneratingAI, handleGenerateAISummary]);

  // Pridanie novej poznámky
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    const newNote: ClinicalNote = {
      id: `nt-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      author: noteAuthor,
      content: noteContent.trim(),
      urgent: noteUrgent
    };

    const updatedProfile: PatientClinicalProfile = {
      ...currentProfile,
      notes: [newNote, ...(currentProfile.notes || [])]
    };

    const newProfiles = {
      ...profiles,
      [patient.id]: updatedProfile
    };

    saveProfiles(newProfiles);
    setNoteContent('');
    setNoteUrgent(false);
    setIsAddingNote(false);

    // Automatický čerstvý prepočet AI súhrnu
    handleGenerateAISummary(true);
  };

  // Pridanie alergie / rizika
  const handleSaveAllergyOrRisk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    const today = new Date().toISOString().split('T')[0];

    if (itemType === 'allergy') {
      const newAllergy: ClinicalAllergy = {
        id: `al-${Date.now()}`,
        name: itemName.trim(),
        reaction: itemDetail.trim() || undefined,
        severity: 'critical',
        addedAt: today
      };
      saveProfiles({
        ...profiles,
        [patient.id]: {
          ...currentProfile,
          allergies: [...(currentProfile.allergies || []), newAllergy]
        }
      });
    } else {
      const newRisk: ClinicalRisk = {
        id: `rk-${Date.now()}`,
        name: itemName.trim(),
        category: itemDetail.trim() || 'Všeobecné riziko',
        addedAt: today
      };
      saveProfiles({
        ...profiles,
        [patient.id]: {
          ...currentProfile,
          risks: [...(currentProfile.risks || []), newRisk]
        }
      });
    }

    setItemName('');
    setItemDetail('');
    setIsAddingAllergy(false);

    // Automatický čerstvý prepočet AI súhrnu
    handleGenerateAISummary(true);
  };

  // Vymazanie alergie
  const handleDeleteAllergy = (id: string) => {
    if (!confirm('Naozaj si prajete odstrániť túto alergiu z karty pacienta?')) return;
    saveProfiles({
      ...profiles,
      [patient.id]: {
        ...currentProfile,
        allergies: currentProfile.allergies.filter(a => a.id !== id)
      }
    });
    handleGenerateAISummary(true);
  };

  // Vymazanie rizika
  const handleDeleteRisk = (id: string) => {
    if (!confirm('Naozaj si prajete odstrániť toto klinické riziko?')) return;
    saveProfiles({
      ...profiles,
      [patient.id]: {
        ...currentProfile,
        risks: currentProfile.risks.filter(r => r.id !== id)
      }
    });
    handleGenerateAISummary(true);
  };

  // Vymazanie poznámky
  const handleDeleteNote = (id: string) => {
    if (!confirm('Naozaj si prajete odstrániť túto klinickú poznámku?')) return;
    saveProfiles({
      ...profiles,
      [patient.id]: {
        ...currentProfile,
        notes: currentProfile.notes.filter(n => n.id !== id)
      }
    });
    handleGenerateAISummary(true);
  };

  // Zostavenie zjednotených udalostí na časovú os
  const unifiedTimeline = useMemo(() => {
    // Ak máme míľniky z AI, použijeme ich ako primárne
    if (aiSummary?.timelineMilestones && aiSummary.timelineMilestones.length > 0) {
      return aiSummary.timelineMilestones.map(m => {
        let icon = FileText;
        let badge = 'Záznam';
        let badgeClass = 'bg-[#FAF4E9] text-[#8A6827] border border-[#E6D4B2]';
        let nodeColor = '#C5A059';

        if (m.category === 'surgery') {
          icon = Stethoscope;
          badge = 'Operácia';
          badgeClass = 'bg-[#2C2A29] text-white';
          nodeColor = '#2C2A29';
        } else if (m.category === 'aesthetic') {
          icon = Syringe;
          badge = 'Botox / Výplne';
          badgeClass = 'bg-[#C5A059]/15 text-[#9C7D2B] border border-[#C5A059]/40';
          nodeColor = '#C5A059';
        } else if (m.category === 'prescription') {
          icon = Pill;
          badge = 'Recept Rp.';
          badgeClass = 'bg-emerald-50 text-emerald-800 border border-emerald-200';
          nodeColor = '#059669';
        } else if (m.category === 'external_drive') {
          icon = HardDrive;
          badge = 'Google Drive';
          badgeClass = 'bg-sky-50 text-sky-800 border border-sky-200';
          nodeColor = '#0284C7';
        } else if (m.category === 'consultation') {
          icon = Calendar;
          badge = 'Termín';
          badgeClass = 'bg-indigo-50 text-indigo-800 border border-indigo-200';
          nodeColor = '#4F46E5';
        }

        return {
          id: m.id,
          category: m.category,
          date: m.date,
          title: m.title,
          summary: m.summary,
          doctorOrSource: m.doctorOrSource,
          badge,
          badgeClass,
          nodeColor,
          icon,
          urgency: m.urgency
        };
      });
    }

    // Fallback: ručné poskladanie
    const list: any[] = [];
    records.forEach(rec => {
      const isSurgery = rec.type?.toLowerCase().includes('oper') || rec.type?.toLowerCase().includes('protokol');
      list.push({
        id: `rec-${rec.id}`,
        category: isSurgery ? 'surgery' : 'document',
        date: rec.date || '2026-08-01',
        title: rec.title,
        summary: rec.diagnosis ? `Diagnóza: ${rec.diagnosis}. ${rec.content || ''}` : rec.content,
        doctorOrSource: rec.doctor,
        badge: isSurgery ? 'Operácia' : 'Vyšetrenie',
        badgeClass: isSurgery ? 'bg-[#2C2A29] text-white' : 'bg-[#FAF4E9] text-[#8A6827] border border-[#E6D4B2]',
        nodeColor: isSurgery ? '#2C2A29' : '#C5A059',
        icon: isSurgery ? Stethoscope : FileText
      });
    });

    aestheticSessions.forEach(sess => {
      list.push({
        id: `aes-${sess.id}`,
        category: 'aesthetic',
        date: sess.date || '2026-07-01',
        title: `Estetika: ${sess.productType || 'Botox / Výplň'}`,
        summary: sess.notes || (sess.treatments ? `Aplikácia: ${sess.treatments.map((t: any) => t.productName).join(', ')}` : 'Aplikácia bez komplikácií.'),
        doctorOrSource: sess.doctorName || 'MUDr. Ján Mráz',
        badge: 'Botox / Výplne',
        badgeClass: 'bg-[#C5A059]/15 text-[#9C7D2B] border border-[#C5A059]/40',
        nodeColor: '#C5A059',
        icon: Syringe
      });
    });

    prescriptions.forEach(rx => {
      list.push({
        id: `rx-${rx.id}`,
        category: 'prescription',
        date: rx.date || rx.issuedAt || '2026-08-01',
        title: `Liek: ${rx.medicationName || rx.drugName}`,
        summary: `Dávkovanie: ${rx.dosage || '1x denne'}. Predpis ŠEVT 14 282 2s.`,
        doctorOrSource: rx.doctorName || 'MUDr. Ján Mráz',
        badge: 'Recept Rp.',
        badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
        nodeColor: '#059669',
        icon: Pill
      });
    });

    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  }, [aiSummary, records, aestheticSessions, prescriptions]);

  // Filtrovanie časovej osi
  const filteredTimeline = useMemo(() => {
    if (activeFilter === 'surgery') {
      return unifiedTimeline.filter(item => item.category === 'surgery');
    }
    if (activeFilter === 'aesthetic') {
      return unifiedTimeline.filter(item => item.category === 'aesthetic');
    }
    if (activeFilter === 'prescription') {
      return unifiedTimeline.filter(item => item.category === 'prescription');
    }
    if (activeFilter === 'notes') {
      return (currentProfile.notes || []).map(nt => ({
        id: `nt-${nt.id}`,
        category: 'notes',
        date: nt.date,
        title: nt.urgent ? '🚨 Dôležitá klinická poznámka' : 'Klinická poznámka tímu',
        summary: nt.content,
        doctorOrSource: nt.author,
        badge: nt.urgent ? 'Urgentné' : 'Poznámka',
        badgeClass: nt.urgent ? 'bg-rose-100 text-rose-800 border border-rose-300 font-bold' : 'bg-emerald-50 text-emerald-800 border border-emerald-200',
        nodeColor: nt.urgent ? '#E11D48' : '#059669',
        icon: nt.urgent ? AlertTriangle : Sparkles
      }));
    }
    return unifiedTimeline;
  }, [unifiedTimeline, activeFilter, currentProfile.notes]);

  // Zoznam alergií z AI alebo z profilu
  const displayedAllergies = useMemo(() => {
    if (aiSummary?.criticalAlerts?.allergies && aiSummary.criticalAlerts.allergies.length > 0) {
      return aiSummary.criticalAlerts.allergies;
    }
    return currentProfile.allergies.map(a => ({
      substance: a.name,
      reaction: a.reaction || 'Precitlivenosť',
      severity: a.severity
    }));
  }, [aiSummary, currentProfile.allergies]);

  // Zoznam kontraindikácií a chirurgických rizík
  const displayedRisks = useMemo(() => {
    const list: string[] = [];
    if (aiSummary?.criticalAlerts?.contraindications) {
      list.push(...aiSummary.criticalAlerts.contraindications);
    }
    if (aiSummary?.criticalAlerts?.surgicalRisks) {
      list.push(...aiSummary.criticalAlerts.surgicalRisks);
    }
    if (list.length === 0 && currentProfile.risks?.length) {
      currentProfile.risks.forEach(r => list.push(`${r.name} (${r.category})`));
    }
    return list;
  }, [aiSummary, currentProfile.risks]);

  return (
    <aside className="bg-white border border-[#E8E2D9] rounded-2xl shadow-sm flex flex-col overflow-hidden text-[#2C2A29]">
      
      {/* 1. HLAVIČKA PANELU: AI KLINICKÝ SÚHRN & AKCIE */}
      <div className="p-4 bg-gradient-to-r from-[#FAF8F5] via-white to-[#FAF8F5] border-b border-[#E8E2D9] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#2C2A29] text-[#C5A059] flex items-center justify-center font-bold shadow-2xs shrink-0">
            <Sparkles className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-brand text-xs font-bold uppercase tracking-wider text-[#2C2A29] truncate">
                AI Klinický Súhrn & Časová Os
              </h3>
            </div>
            <p className="text-[10px] text-[#8C857B] font-mono tabular-nums flex items-center gap-1 truncate">
              <span>{aiSummary?.generatedAt ? `Aktualizované ${new Date(aiSummary.generatedAt).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}` : 'Pripravené na analýzu'}</span>
              <span>·</span>
              <span>{unifiedTimeline.length} míľnikov</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleGenerateAISummary(true)}
            disabled={isGeneratingAI}
            className="p-1.5 rounded-lg border border-[#E8E2D9] bg-white hover:bg-[#FAF8F5] hover:border-[#C5A059] text-[#2C2A29] text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Okamžite nanovo vygenerovať AI súhrn z celej anamnézy a disku"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C5A059] ${isGeneratingAI ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">AI Obnoviť</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8C857B] hover:text-[#2C2A29] hover:bg-gray-100 transition-colors flex items-center cursor-pointer"
            title="Skryť bočný panel časovej osi"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* INDIKÁTOR PREBIEHAJÚCEHO AI PREPOČTU */}
      {isGeneratingAI && (
        <div className="bg-[#FAF8F5] border-b border-[#E8E2D9] px-4 py-2 flex items-center gap-2 text-xs text-[#8C857B] animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-[#C5A059] animate-spin" />
          <span>Gemini AI syntetizuje anamnézu, operácie, botox a Google Drive súbory...</span>
        </div>
      )}

      {/* CHYBOVÝ OZNAM */}
      {aiError && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-[11px] text-amber-800 flex items-center justify-between">
          <span>{aiError}</span>
          <button onClick={() => setAiError(null)} className="text-amber-600 hover:text-amber-900 font-bold ml-2">✕</button>
        </div>
      )}

      {/* HLAVNÝ STAV PACIENTA (GENERAL STATUS ZO SÚHRNU) */}
      {aiSummary?.generalStatus && (
        <div className="px-4 py-3 bg-[#FAF8F5]/80 border-b border-[#E8E2D9] text-xs text-[#2C2A29] flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-[#C5A059] shrink-0 mt-0.5" />
          <p className="leading-relaxed font-medium">
            {aiSummary.generalStatus}
          </p>
        </div>
      )}

      {/* 2. KRITICKÉ ALERGIE & KONTRAINDIKÁCIE (ŠTRUKTÚROVANÝ BLOK NA VRCHU) */}
      <div className="p-4 bg-rose-50/50 border-b border-rose-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span className="uppercase tracking-wider text-[11px]">Kritické Riziká & Alergie</span>
            {displayedAllergies.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsAddingAllergy(prev => !prev)}
            className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-white border border-rose-200 text-rose-700 hover:bg-rose-100 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
          >
            <Plus className="w-3 h-3" />
            <span>Pridať</span>
          </button>
        </div>

        {/* ZOZNAM ALERGIÍ */}
        <div className="space-y-1.5">
          {displayedAllergies && displayedAllergies.length > 0 ? (
            displayedAllergies.map((allergy, idx) => (
              <div 
                key={idx}
                className="bg-white/95 border border-rose-200 rounded-lg px-2.5 py-1.5 flex items-start justify-between gap-2 shadow-2xs text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0"></span>
                    <strong className="text-rose-950 font-bold">{allergy.substance}</strong>
                    <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-rose-100 text-rose-800 font-bold">
                      {allergy.severity === 'critical' ? 'Kritická' : 'Upozornenie'}
                    </span>
                  </div>
                  {allergy.reaction && (
                    <p className="text-[11px] text-rose-700 ml-3 truncate">
                      Reakcia: {allergy.reaction}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-[11px] text-emerald-800 bg-emerald-50/80 border border-emerald-200 rounded-lg p-2 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bez evidovaných liekových alergií (negatívna)</span>
            </p>
          )}
        </div>

        {/* CHIRURGICKÉ A INTERNÉ RIZIKÁ */}
        {displayedRisks.length > 0 && (
          <div className="pt-2 border-t border-rose-200/60 space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-900 block">
              ⚠️ Kontraindikácie & Operačné riziká:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {displayedRisks.map((risk, idx) => (
                <div 
                  key={idx}
                  className="bg-amber-100/70 border border-amber-300 text-amber-950 text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs"
                >
                  <span>{risk}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FORMULÁR PRE PRIDANIE NOVEJ ALERGIE / RIZIKA */}
        {isAddingAllergy && (
          <form onSubmit={handleSaveAllergyOrRisk} className="bg-white p-3 rounded-xl border border-rose-200 space-y-2.5 mt-2 animate-in fade-in duration-150">
            <div className="flex gap-2 text-xs font-bold">
              <label className="flex items-center gap-1 cursor-pointer">
                <input 
                  type="radio" 
                  name="itemType" 
                  checked={itemType === 'allergy'} 
                  onChange={() => setItemType('allergy')} 
                />
                <span className="text-rose-800">Lieková alergia</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input 
                  type="radio" 
                  name="itemType" 
                  checked={itemType === 'risk'} 
                  onChange={() => setItemType('risk')} 
                />
                <span className="text-amber-800">Klinické riziko</span>
              </label>
            </div>

            <input
              type="text"
              required
              placeholder={itemType === 'allergy' ? "Napr. Penicilín, Ibuprofén..." : "Napr. Sklon ku keloidom, Fajčenie..."}
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-[#E8E2D9] focus:border-rose-500 outline-none"
            />

            <input
              type="text"
              placeholder={itemType === 'allergy' ? "Prejavy (anafylaxia, vyrážka)..." : "Kategória (Hojenie rán, Anestézia)..."}
              value={itemDetail}
              onChange={e => setItemDetail(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-[#E8E2D9] focus:border-rose-500 outline-none"
            />

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingAllergy(false)}
                className="px-2.5 py-1 text-xs text-[#8C857B] hover:text-[#2C2A29]"
              >
                Zrušiť
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold shadow-2xs"
              >
                Uložiť do karty
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 3. KLINICKÉ ODPORÚČANIA PRE VYŠETRENIE (AI RECOMMENDATIONS) */}
      {aiSummary?.clinicalRecommendations && aiSummary.clinicalRecommendations.length > 0 && (
        <div className="p-4 bg-amber-50/40 border-b border-[#E8E2D9] space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#8A6827]">
            <Lightbulb className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="uppercase tracking-wider text-[11px]">Odporúčania pre ošetrujúceho lekára</span>
          </div>
          <ul className="space-y-1.5 text-xs text-[#2C2A29]">
            {aiSummary.clinicalRecommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-white/80 p-2 rounded-lg border border-[#E8E2D9]/80 shadow-2xs leading-relaxed">
                <span className="text-[#C5A059] font-bold mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 4. LIŠTA S FILTRAMI ČASOVEJ OSI & TLAČIDLOM NA PRIDANIE POZNÁMKY */}
      <div className="p-3 bg-[#FAF8F5] border-b border-[#E8E2D9] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-bold uppercase py-0.5">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-[#2C2A29] text-white shadow-2xs'
                : 'text-[#8C857B] hover:text-[#2C2A29] hover:bg-white'
            }`}
          >
            Všetko
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('surgery')}
            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
              activeFilter === 'surgery'
                ? 'bg-[#2C2A29] text-white shadow-2xs'
                : 'text-[#8C857B] hover:text-[#2C2A29] hover:bg-white'
            }`}
          >
            Operácie
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('aesthetic')}
            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
              activeFilter === 'aesthetic'
                ? 'bg-[#2C2A29] text-white shadow-2xs'
                : 'text-[#8C857B] hover:text-[#2C2A29] hover:bg-white'
            }`}
          >
            Botox/Výplne
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('prescription')}
            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
              activeFilter === 'prescription'
                ? 'bg-[#2C2A29] text-white shadow-2xs'
                : 'text-[#8C857B] hover:text-[#2C2A29] hover:bg-white'
            }`}
          >
            Recepty
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('notes')}
            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
              activeFilter === 'notes'
                ? 'bg-[#2C2A29] text-white shadow-2xs'
                : 'text-[#8C857B] hover:text-[#2C2A29] hover:bg-white'
            }`}
          >
            Poznámky ({currentProfile.notes?.length || 0})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingNote(prev => !prev)}
          className="text-[10px] font-bold uppercase px-2 py-1 rounded-lg bg-[#2C2A29] text-[#C5A059] hover:bg-[#C5A059] hover:text-white transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
          title="Pridať novú klinickú poznámku k vyšetreniu na 1 klik"
        >
          <Plus className="w-3 h-3" />
          <span>Poznámka</span>
        </button>
      </div>

      {/* FORMULÁR PRE PRIDANIE NOVEJ POZNÁMKY NA 1 KLIK */}
      {isAddingNote && (
        <form onSubmit={handleSaveNote} className="p-4 bg-[#FAF8F5] border-b border-[#E8E2D9] space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#2C2A29] uppercase text-[10px]">
              Nová klinická poznámka (1-Klik)
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-rose-700">
              <input 
                type="checkbox"
                checked={noteUrgent}
                onChange={e => setNoteUrgent(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span>Označiť ako urgentné</span>
            </label>
          </div>

          <textarea
            required
            rows={3}
            placeholder="Zapíšte poznámku z vyšetrenia, odporúčania po zákroku alebo pokyny pre tím..."
            value={noteContent}
            onChange={e => setNoteContent(e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl border border-[#E8E2D9] focus:border-[#C5A059] outline-none bg-white resize-none shadow-2xs"
          />

          <div className="flex items-center justify-between">
            <input
              type="text"
              value={noteAuthor}
              onChange={e => setNoteAuthor(e.target.value)}
              placeholder="Meno lekára / sestry"
              className="text-[11px] p-1.5 rounded-lg border border-[#E8E2D9] bg-white w-40"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsAddingNote(false)}
                className="px-3 py-1.5 text-xs text-[#8C857B] hover:text-[#2C2A29]"
              >
                Zrušiť
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-[#2C2A29] hover:bg-[#C5A059] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Uložiť & Obnoviť AI
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 5. VERTIKÁLNA ČASOVÁ OS (TIMELINE MILESTONES) */}
      <div className="p-4 overflow-y-auto max-h-[580px] space-y-4">
        {filteredTimeline.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#8C857B] italic">
            Žiadne záznamy pre zvolený filter.
          </div>
        ) : (
          <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E8E2D9]">
            {filteredTimeline.map((item, index) => {
              const IconComponent = item.icon || FileText;
              const isExpanded = expandedItems[item.id] || false;

              return (
                <div key={item.id || index} className="relative group text-xs">
                  {/* UZOL ČASOVEJ OSI */}
                  <div 
                    className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 flex items-center justify-center shadow-2xs transition-transform group-hover:scale-110"
                    style={{ borderColor: item.nodeColor }}
                  >
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.nodeColor }}
                    />
                  </div>

                  {/* KARTA UDALOSTI */}
                  <div className="bg-[#FBF9F6] border border-[#E8E2D9] hover:border-[#C5A059] rounded-xl p-3 shadow-2xs hover:bg-white transition-all">
                    
                    {/* HORNÝ RIADOK: DÁTUM & KATEGÓRIA */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-[10px] text-[#8C857B] font-bold">
                        {item.date ? new Date(item.date).toLocaleDateString('sk-SK', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Nedávno'}
                      </span>
                      <span className={`text-[9px] uppercase px-2 py-0.5 rounded font-bold ${item.badgeClass}`}>
                        {item.badge}
                      </span>
                    </div>

                    {/* NÁZOV VÝKONU / DOKUMENTU */}
                    <h4 className="font-bold text-[#2C2A29] text-xs leading-snug">
                      {item.title}
                    </h4>

                    {/* SÚHRN UDALOSTI */}
                    {item.summary && (
                      <div className="mt-1 text-[11px] text-[#4A4744] leading-relaxed">
                        <p className={!isExpanded && item.summary.length > 140 ? 'line-clamp-2' : ''}>
                          {item.summary}
                        </p>
                        {item.summary.length > 140 && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(item.id)}
                            className="text-[#C5A059] hover:underline font-bold text-[10px] mt-0.5 inline-block cursor-pointer"
                          >
                            {isExpanded ? 'Menej...' : 'Zobraziť viac...'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* SPODNÝ RIADOK: LEKÁR ALEBO ZDROJ */}
                    {item.doctorOrSource && (
                      <div className="mt-2 pt-2 border-t border-[#E8E2D9]/70 flex items-center justify-between text-[10px] text-[#8C857B]">
                        <span>{item.doctorOrSource}</span>
                        {item.category === 'notes' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(item.id.replace('nt-', ''))}
                            className="text-rose-500 hover:text-rose-800 font-bold"
                            title="Zmazať poznámku"
                          >
                            Zmazať
                          </button>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. PÄTIČKA PANELU */}
      <div className="p-3 bg-[#FAF8F5] border-t border-[#E8E2D9] text-[10px] text-[#8C857B] flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#C5A059]" />
          <span>SAY CLINIC AI Medical Assistant</span>
        </span>
        <span className="font-mono">Gemini 3.8 Flash</span>
      </div>

    </aside>
  );
}
