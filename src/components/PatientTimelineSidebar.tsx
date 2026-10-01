'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Eye, 
  Filter,
  User,
  PanelRightClose
} from 'lucide-react';
import { Patient, MedicalRecord } from './PatientDatabase';
import { RealtimeSyncService } from '../services/realtimeSyncService';

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
  onClose: () => void;
  onNavigateToRecord?: (recordId: string) => void;
}

export default function PatientTimelineSidebar({
  patient,
  records,
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

  const currentProfile = profiles[patient.id] || {
    allergies: [],
    risks: [],
    notes: []
  };

  // Filter kategórií na časovej osi
  const [activeFilter, setActiveFilter] = useState<'all' | 'procedures' | 'allergies' | 'notes'>('all');

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

  // Pridanie novej poznámky
  const handleSaveNote = (e: React.FormEvent) => {
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

    saveProfiles({
      ...profiles,
      [patient.id]: updatedProfile
    });

    setNoteContent('');
    setNoteUrgent(false);
    setIsAddingNote(false);
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
  };

  // Zostavenie zjednotených udalostí na časovú os
  const unifiedTimeline = useMemo(() => {
    const list: Array<{
      id: string;
      category: 'procedure' | 'aesthetic' | 'note' | 'allergy';
      date: string;
      title: string;
      subtitle?: string;
      content?: string;
      author?: string;
      badge: string;
      badgeClass: string;
      nodeColor: string;
      icon: any;
      urgent?: boolean;
    }> = [];

    // 1. Zdravotné záznamy & Chirurgické výkony
    records.forEach(rec => {
      const isSurgery = rec.type.toLowerCase().includes('oper') || rec.type.toLowerCase().includes('protokol');
      list.push({
        id: `rec-${rec.id}`,
        category: 'procedure',
        date: rec.date || '2026-08-01',
        title: rec.title,
        subtitle: `${rec.type} ${rec.diagnosis ? `(Dg. ${rec.diagnosis})` : ''}`,
        content: rec.content,
        author: rec.doctor,
        badge: isSurgery ? 'Operácia' : 'Vyšetrenie',
        badgeClass: isSurgery ? 'bg-[#2C2A29] text-white' : 'bg-[#FAF4E9] text-[#8A6827] border border-[#E6D4B2]',
        nodeColor: isSurgery ? '#2C2A29' : '#C5A059',
        icon: isSurgery ? Stethoscope : FileText
      });
    });

    // 2. Estetické zákroky (Botox & Výplne)
    aestheticSessions.forEach(sess => {
      list.push({
        id: `aes-${sess.id}`,
        category: 'procedure',
        date: sess.date || '2026-07-01',
        title: `Aplikácia estetiky (${sess.productType || 'Botox / Výplň'})`,
        subtitle: `Spotrebované: ${sess.totalUnits || 0} jednotiek`,
        content: sess.notes || 'Aplikácia v plnom rozsahu bez komplikácií.',
        author: sess.doctorName || 'MUDr. Ján Mráz',
        badge: 'Botox / Výplne',
        badgeClass: 'bg-[#C5A059]/15 text-[#9C7D2B] border border-[#C5A059]/40',
        nodeColor: '#C5A059',
        icon: Syringe
      });
    });

    // 3. Klinické poznámky
    (currentProfile.notes || []).forEach(nt => {
      list.push({
        id: `nt-${nt.id}`,
        category: 'note',
        date: nt.date,
        title: nt.urgent ? 'Dôležitá klinická poznámka' : 'Poznámka ošetrujúceho',
        content: nt.content,
        author: nt.author,
        badge: nt.urgent ? 'Urgentné' : 'Poznámka',
        badgeClass: nt.urgent ? 'bg-rose-100 text-rose-800 border border-rose-300 font-bold' : 'bg-emerald-50 text-emerald-800 border border-emerald-200',
        nodeColor: nt.urgent ? '#E11D48' : '#059669',
        icon: nt.urgent ? AlertTriangle : Sparkles,
        urgent: nt.urgent
      });
    });

    // Zoradenie od najnovších po najstaršie
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  }, [records, aestheticSessions, currentProfile.notes]);

  // Filtrovanie časovej osi
  const filteredTimeline = useMemo(() => {
    if (activeFilter === 'procedures') {
      return unifiedTimeline.filter(item => item.category === 'procedure');
    }
    if (activeFilter === 'notes') {
      return unifiedTimeline.filter(item => item.category === 'note');
    }
    return unifiedTimeline;
  }, [unifiedTimeline, activeFilter]);

  const allergiesCount = currentProfile.allergies?.length || 0;
  const risksCount = currentProfile.risks?.length || 0;

  return (
    <aside className="bg-white border border-[#E8E2D9] rounded-2xl shadow-sm flex flex-col overflow-hidden text-[#2C2A29]">
      
      {/* 1. HLAVIČKA PANELU S AKCIOU SKRYTIA */}
      <div className="p-4 bg-gradient-to-r from-[#FAF8F5] to-white border-b border-[#E8E2D9] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#2C2A29] text-[#C5A059] flex items-center justify-center font-bold shadow-2xs">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-brand text-sm font-bold uppercase tracking-wider text-[#2C2A29]">
              Časová Os & Riziká
            </h3>
            <p className="text-[10px] text-[#8C857B] font-mono tabular-nums">
              {unifiedTimeline.length} záznamov · {allergiesCount + risksCount} varovaní
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#8C857B] hover:text-[#2C2A29] hover:bg-gray-100 transition-colors flex items-center gap-1 cursor-pointer"
          title="Skryť bočný panel časovej osi"
        >
          <PanelRightClose className="w-4 h-4" />
          <span className="text-[11px] font-bold uppercase hidden sm:inline">Skryť</span>
        </button>
      </div>

      {/* 2. KRITICKÉ ALERGIE & RIZIKÁ (PRIČAPENÉ HORE) */}
      <div className="p-4 bg-rose-50/50 border-b border-rose-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span className="uppercase tracking-wider text-[11px]">Alergie & Kontraindikácie</span>
            {allergiesCount > 0 && (
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
          {currentProfile.allergies && currentProfile.allergies.length > 0 ? (
            currentProfile.allergies.map(allergy => (
              <div 
                key={allergy.id}
                className="bg-white/90 border border-rose-200 rounded-lg px-2.5 py-1.5 flex items-start justify-between gap-2 shadow-2xs text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0"></span>
                    <strong className="text-rose-950 font-bold">{allergy.name}</strong>
                  </div>
                  {allergy.reaction && (
                    <p className="text-[11px] text-rose-700 ml-3 truncate">
                      Reakcia: {allergy.reaction}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteAllergy(allergy.id)}
                  className="text-rose-300 hover:text-rose-700 transition-colors p-0.5"
                  title="Odstrániť alergiu"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-[11px] text-emerald-800 bg-emerald-50/80 border border-emerald-200 rounded-lg p-2 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bez evidovaných liekových alergií (negatívna)</span>
            </p>
          )}

          {/* RIZIKOVÉ VAROVANIA */}
          {currentProfile.risks && currentProfile.risks.length > 0 && (
            <div className="pt-1.5 border-t border-rose-200/50 space-y-1">
              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                Klinické riziká & Anamnéza:
              </span>
              {currentProfile.risks.map(risk => (
                <div 
                  key={risk.id}
                  className="bg-amber-50/80 border border-amber-200 rounded-lg px-2.5 py-1 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                    <span className="text-amber-950 font-medium truncate">{risk.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteRisk(risk.id)}
                    className="text-amber-400 hover:text-amber-800 transition-colors p-0.5"
                    title="Odstrániť riziko"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* INLINE FORMULÁR PRE PRIDANIE ALERGIE / RIZIKA */}
        {isAddingAllergy && (
          <form onSubmit={handleSaveAllergyOrRisk} className="bg-white p-3 rounded-xl border border-rose-200 shadow-sm space-y-2 mt-2 animate-in fade-in duration-150">
            <div className="flex gap-2 text-[10px] font-bold uppercase">
              <button
                type="button"
                onClick={() => setItemType('allergy')}
                className={`flex-1 py-1 rounded border text-center transition-all ${
                  itemType === 'allergy'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}
              >
                Alergia
              </button>
              <button
                type="button"
                onClick={() => setItemType('risk')}
                className={`flex-1 py-1 rounded border text-center transition-all ${
                  itemType === 'risk'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}
              >
                Klinické riziko
              </button>
            </div>

            <input
              type="text"
              placeholder={itemType === 'allergy' ? "Napr. Penicilín, Ibuprofen..." : "Napr. Keloidné jazvy, Antikoagulanciá..."}
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-gray-300 focus:border-[#C5A059] focus:outline-none"
              autoFocus
            />

            <input
              type="text"
              placeholder={itemType === 'allergy' ? "Reakcia (napr. vyrážka, opuch)" : "Kategória (napr. Hojenie rán)"}
              value={itemDetail}
              onChange={(e) => setItemDetail(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-gray-300 focus:border-[#C5A059] focus:outline-none"
            />

            <div className="flex justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingAllergy(false)}
                className="px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Zrušiť
              </button>
              <button
                type="submit"
                disabled={!itemName.trim()}
                className="px-3 py-1 text-xs bg-[#2C2A29] text-white font-bold rounded-lg hover:bg-[#C5A059] transition-colors disabled:opacity-50"
              >
                Uložiť
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 3. OVLÁDACIA LIŠTA: FILTRE & TLAČIDLO PRE RÝCHLU POZNÁMKU */}
      <div className="p-3 border-b border-[#E8E2D9] space-y-2 bg-[#FAF8F5]/60">
        
        {/* TLAČIDLO + FORMULÁR PRE RÝCHLU KLINICKÚ POZNÁMKU */}
        <button
          type="button"
          onClick={() => setIsAddingNote(prev => !prev)}
          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#2C2A29] to-[#3E3B3A] text-white hover:from-[#C5A059] hover:to-[#9C7D2B] transition-all flex items-center justify-between text-xs font-bold uppercase tracking-wider shadow-xs cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Zapísať poznámku z vyšetrenia</span>
          </span>
          <span className="text-[10px] text-gray-300 font-normal">1-klik</span>
        </button>

        {isAddingNote && (
          <form onSubmit={handleSaveNote} className="bg-white p-3 rounded-xl border border-[#C5A059] shadow-sm space-y-2 animate-in fade-in duration-150">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-[#8C857B]">
              <span>Nová klinická poznámka</span>
              <label className="flex items-center gap-1 text-rose-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noteUrgent}
                  onChange={(e) => setNoteUrgent(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-0"
                />
                <span>Urgentné</span>
              </label>
            </div>

            <textarea
              rows={3}
              placeholder="Zadajte postrehy z vyšetrenia, odporúčania pre pacienta, reakcie na medikáciu..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:border-[#C5A059] focus:outline-none resize-none"
              autoFocus
            />

            <div className="flex items-center justify-between gap-2">
              <select
                value={noteAuthor}
                onChange={(e) => setNoteAuthor(e.target.value)}
                className="text-[11px] p-1.5 rounded-md border border-gray-200 bg-gray-50 focus:outline-none"
              >
                <option value="MUDr. Ján Mráz">MUDr. Ján Mráz</option>
                <option value="MUDr. Sroková">MUDr. Sroková</option>
                <option value="MUDr. Tran">MUDr. Tran</option>
                <option value="Sestra">Sestra ambulancie</option>
              </select>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAddingNote(false)}
                  className="px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  disabled={!noteContent.trim()}
                  className="px-3 py-1 text-xs bg-[#C5A059] text-white font-bold rounded-lg hover:bg-[#9C7D2B] transition-colors disabled:opacity-50"
                >
                  Uložiť
                </button>
              </div>
            </div>
          </form>
        )}

        {/* SEGMENTOVÝ FILTER UDALOSTÍ */}
        <div className="flex items-center gap-1 p-0.5 bg-[#E8E2D9]/50 rounded-xl text-[10px] font-bold uppercase tracking-wider text-[#8C857B]">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`flex-1 py-1 rounded-lg transition-all text-center cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-white text-[#2C2A29] shadow-xs'
                : 'hover:text-[#2C2A29]'
            }`}
          >
            Všetko ({unifiedTimeline.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('procedures')}
            className={`flex-1 py-1 rounded-lg transition-all text-center cursor-pointer ${
              activeFilter === 'procedures'
                ? 'bg-white text-[#2C2A29] shadow-xs'
                : 'hover:text-[#2C2A29]'
            }`}
          >
            Zákroky ({unifiedTimeline.filter(t => t.category === 'procedure').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('notes')}
            className={`flex-1 py-1 rounded-lg transition-all text-center cursor-pointer ${
              activeFilter === 'notes'
                ? 'bg-white text-[#2C2A29] shadow-xs'
                : 'hover:text-[#2C2A29]'
            }`}
          >
            Poznámky ({unifiedTimeline.filter(t => t.category === 'note').length})
          </button>
        </div>
      </div>

      {/* 4. SAMOTNÁ VERTIKÁLNA ČASOVÁ OS (SCROLLABLE TIMELINE TRACK) */}
      <div className="p-4 overflow-y-auto max-h-[580px] space-y-4">
        {filteredTimeline.length === 0 ? (
          <div className="text-center py-8 text-[#8C857B]">
            <Clock className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            <p className="text-xs font-bold uppercase">Žiadne záznamy v tomto filtri</p>
            <p className="text-[11px] text-gray-500 mt-1">Pridajte novú poznámku alebo zvoľte iný filter.</p>
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-[#E8E2D9] space-y-5 ml-2">
            {filteredTimeline.map((item) => {
              const isExpanded = expandedItems[item.id];
              const IconComponent = item.icon;

              return (
                <div key={item.id} className="relative group">
                  
                  {/* UZLOVÝ BOD NA ČASOVEJ OSI */}
                  <div 
                    className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center shadow-xs transition-transform group-hover:scale-110"
                    style={{ borderColor: item.nodeColor }}
                  >
                    <IconComponent className="w-3 h-3" style={{ color: item.nodeColor }} />
                  </div>

                  {/* KARTA UDALOSTI */}
                  <div className={`p-3 rounded-xl border transition-all ${
                    item.urgent 
                      ? 'bg-rose-50/60 border-rose-200' 
                      : 'bg-[#FAF8F5]/80 hover:bg-white border-[#E8E2D9] hover:border-[#C5A059]/60 hover:shadow-xs'
                  }`}>
                    {/* HORNÝ RIADOK: DÁTUM A ODZNAK */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-[10px] text-[#8C857B] font-bold tabular-nums">
                        {item.date}
                      </span>
                      <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${item.badgeClass}`}>
                        {item.badge}
                      </span>
                    </div>

                    {/* NÁZOV UDALOSTI */}
                    <h4 className="text-xs font-bold text-[#2C2A29] leading-snug">
                      {item.title}
                    </h4>

                    {item.subtitle && (
                      <p className="text-[11px] text-[#8C857B] font-medium mt-0.5">
                        {item.subtitle}
                      </p>
                    )}

                    {/* TEXTOVÝ OBSAH (S MOŽNOSŤOU ROZBALENIA) */}
                    {item.content && (
                      <div className="mt-1.5">
                        <p className={`text-[11px] text-[#5F5953] leading-relaxed ${!isExpanded && item.content.length > 120 ? 'line-clamp-2' : ''}`}>
                          {item.content}
                        </p>
                        {item.content.length > 120 && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(item.id)}
                            className="text-[10px] text-[#C5A059] font-bold uppercase mt-1 hover:underline cursor-pointer"
                          >
                            {isExpanded ? 'Zbaliť detail ▲' : 'Zobraziť celý záznam ▼'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* PÄTIČKA: LEKÁR & AKCIE */}
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-black/5 text-[10px] text-[#8C857B]">
                      <span className="flex items-center gap-1">
                        <User className="w-2.5 h-2.5 text-[#C5A059]" />
                        <span>{item.author}</span>
                      </span>

                      {item.id.startsWith('nt-') && (
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(item.id.replace('nt-', ''))}
                          className="text-gray-400 hover:text-rose-600 transition-colors p-0.5"
                          title="Zmazať poznámku"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}

                      {item.id.startsWith('rec-') && onNavigateToRecord && (
                        <button
                          type="button"
                          onClick={() => onNavigateToRecord(item.id.replace('rec-', ''))}
                          className="text-[#C5A059] hover:underline font-bold"
                        >
                          Otvoriť dekurz →
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. SPODNÁ PÄTIČKA */}
      <div className="p-3 bg-[#FAF8F5] border-t border-[#E8E2D9] text-[10px] text-[#8C857B] flex items-center justify-between">
        <span>SAY CLINIC · EMR Timeline</span>
        <span className="font-mono">{patient.birthNumber}</span>
      </div>

    </aside>
  );
}
