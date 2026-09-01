'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  PackageCheck, 
  Trash2, 
  Layers, 
  Printer, 
  Save, 
  User,
  History,
  CheckCircle2,
  ExternalLink,
  Box
} from 'lucide-react';
import { Patient, MedicalRecord } from './PatientDatabase';
import { Sculpture3DViewer, VectorItem, DrawingToolType } from './Sculpture3DViewer';

export interface InjectionPoint {
  id: string;
  x: number; // % from left (0 - 100)
  y: number; // % from top (0 - 100)
  zone: string;
  productType: 'botox' | 'filler' | 'threads' | 'biostimulator' | 'meso';
  productName: string;
  lotNumber: string;
  unitsOrVolume: number; // IU or ml or ks
  unitLabel: string;
  depth: 'intradermal' | 'subcutaneous' | 'supraperiosteal' | 'intramuscular';
  notes?: string;
}

const PRESET_MATERIALS = [
  { name: 'Sculptra 10ml (PLLA Biostimulátor)', type: 'biostimulator', lot: 'SCL-2026-881A', expiry: '09/2028', unit: 'ml', pricePerUnit: 480 },
  { name: 'Aptos Excellence Visage (Niťový lifting)', type: 'threads', lot: 'APT-EXC-091', expiry: '03/2028', unit: 'ks', pricePerUnit: 750 },
  { name: 'Radiesse (+) 1.5ml (CaHA Vektoring)', type: 'biostimulator', lot: 'RAD-150-332', expiry: '01/2028', unit: 'ml', pricePerUnit: 420 },
  { name: 'Botox Allergan 100IU', type: 'botox', lot: 'BTX-2026-991A', expiry: '02/2028', unit: 'IU', pricePerUnit: 6 },
  { name: 'Dysport 300IU', type: 'botox', lot: 'DYSP-4412B', expiry: '05/2027', unit: 'IU', pricePerUnit: 3 },
  { name: 'Juvederm Voluma with Lidocaine 1ml', type: 'filler', lot: 'JUV-VOL-8812', expiry: '08/2027', unit: 'ml', pricePerUnit: 340 },
  { name: 'Juvederm Volift 1ml', type: 'filler', lot: 'JUV-VFT-1102', expiry: '11/2027', unit: 'ml', pricePerUnit: 320 },
  { name: 'Juvederm Volbella 1ml (Pery)', type: 'filler', lot: 'JUV-VBL-7740', expiry: '04/2028', unit: 'ml', pricePerUnit: 310 },
  { name: 'Profhilo H+L 2ml (Bioremodelácia)', type: 'meso', lot: 'PRO-2ML-881', expiry: '06/2027', unit: 'ml', pricePerUnit: 290 },
];

const PRESET_PROCEDURES = [
  {
    id: 'sculptra_midface',
    title: 'Sculptra Fanning (Líca & Spánky)',
    productName: 'Sculptra 10ml (PLLA Biostimulátor)',
    lot: 'SCL-2026-881A',
    type: 'fanning' as const,
    color: '#C5A059',
    description: 'Vejárovitá aplikácia kanylou 25G/50mm do subkutánnej vrstvy líca a temporálnej fassy',
    vectors: [
      {
        id: 'scl_l',
        type: 'fanning' as const,
        color: '#C5A059',
        startX: 170,
        startY: 250,
        endX: 130,
        endY: 340,
        fanningLines: [
          { x: 105, y: 310 },
          { x: 120, y: 335 },
          { x: 140, y: 350 },
          { x: 165, y: 355 },
          { x: 190, y: 345 }
        ],
        zoneName: 'Sculptra - Líce Ľ (Vejár)',
        productName: 'Sculptra 10ml (PLLA Biostimulátor)',
        lotNumber: 'SCL-2026-881A',
        details: 'Kanyla 25G • 5 lúčov • 2.5ml roztoku',
        rotationY: 0
      },
      {
        id: 'scl_r',
        type: 'fanning' as const,
        color: '#C5A059',
        startX: 270,
        startY: 250,
        endX: 310,
        endY: 340,
        fanningLines: [
          { x: 250, y: 345 },
          { x: 275, y: 355 },
          { x: 300, y: 350 },
          { x: 320, y: 335 },
          { x: 335, y: 310 }
        ],
        zoneName: 'Sculptra - Líce P (Vejár)',
        productName: 'Sculptra 10ml (PLLA Biostimulátor)',
        lotNumber: 'SCL-2026-881A',
        details: 'Kanyla 25G • 5 lúčov • 2.5ml roztoku',
        rotationY: 0
      }
    ]
  },
  {
    id: 'aptos_lifting',
    title: 'Aptos Visage (Niťový lifting 4+4)',
    productName: 'Aptos Excellence Visage (Niťový lifting)',
    lot: 'APT-EXC-091',
    type: 'threads' as const,
    color: '#8B5CF6',
    description: 'Obojsmerné ostnaté nite s kotvením v temporálnej fascii a trakciou nasolabiálnych a marioneťových línií',
    vectors: [
      {
        id: 'apt_1',
        type: 'threads' as const,
        color: '#8B5CF6',
        startX: 140,
        startY: 190,
        endX: 195,
        endY: 305,
        zoneName: 'Aptos niť 1 - Nasolabiálna línia Ľ',
        productName: 'Aptos Excellence Visage',
        lotNumber: 'APT-EXC-091',
        details: 'Liftingový vektor 15cm • Trakcia k fascia temporalis',
        rotationY: 0
      },
      {
        id: 'apt_2',
        type: 'threads' as const,
        color: '#8B5CF6',
        startX: 135,
        startY: 215,
        endX: 190,
        endY: 355,
        zoneName: 'Aptos niť 2 - Marionetová ryha Ľ',
        productName: 'Aptos Excellence Visage',
        lotNumber: 'APT-EXC-091',
        details: 'Liftingový vektor 15cm • Trakcia čeľuste',
        rotationY: 0
      },
      {
        id: 'apt_3',
        type: 'threads' as const,
        color: '#8B5CF6',
        startX: 300,
        startY: 190,
        endX: 245,
        endY: 305,
        zoneName: 'Aptos niť 3 - Nasolabiálna línia P',
        productName: 'Aptos Excellence Visage',
        lotNumber: 'APT-EXC-091',
        details: 'Liftingový vektor 15cm • Trakcia k fascia temporalis',
        rotationY: 0
      },
      {
        id: 'apt_4',
        type: 'threads' as const,
        color: '#8B5CF6',
        startX: 305,
        startY: 215,
        endX: 250,
        endY: 355,
        zoneName: 'Aptos niť 4 - Marionetová ryha P',
        productName: 'Aptos Excellence Visage',
        lotNumber: 'APT-EXC-091',
        details: 'Liftingový vektor 15cm • Trakcia čeľuste',
        rotationY: 0
      }
    ]
  },
  {
    id: 'botox_full_upper',
    title: 'Botox Kompletná Horná Tretina (32 IU)',
    productName: 'Botox Allergan 100IU',
    lot: 'BTX-2026-991A',
    type: 'point' as const,
    color: '#3B82F6',
    description: 'Glabela (vráska hnevu), frontalis (čelo) a periorbitálne vejáriky',
    vectors: [
      {
        id: 'btx_g1',
        type: 'point' as const,
        color: '#3B82F6',
        startX: 220,
        startY: 180,
        zoneName: 'Glabela - m. procerus',
        productName: 'Botox Allergan 100IU',
        lotNumber: 'BTX-2026-991A',
        details: '4 IU intramuskulárne',
        rotationY: 0
      },
      {
        id: 'btx_g2',
        type: 'point' as const,
        color: '#3B82F6',
        startX: 200,
        startY: 175,
        zoneName: 'Glabela - m. corrugator Ľ',
        productName: 'Botox Allergan 100IU',
        lotNumber: 'BTX-2026-991A',
        details: '4 IU intramuskulárne',
        rotationY: 0
      },
      {
        id: 'btx_g3',
        type: 'point' as const,
        color: '#3B82F6',
        startX: 240,
        startY: 175,
        zoneName: 'Glabela - m. corrugator P',
        productName: 'Botox Allergan 100IU',
        lotNumber: 'BTX-2026-991A',
        details: '4 IU intramuskulárne',
        rotationY: 0
      }
    ]
  }
];

export function AestheticsModule({ 
  patients = [], 
  selectedPatientId,
  onSelectPatient,
  onOpenPatientFolder
}: { 
  patients?: Patient[]; 
  selectedPatientId?: string | null;
  onSelectPatient?: (id: string) => void;
  onOpenPatientFolder?: (patient: Patient) => void;
}) {
  // Synchronizácia pacientov
  const [localPatients, setLocalPatients] = useState<Patient[]>(patients);

  useEffect(() => {
    if (patients && patients.length > 0) {
      setLocalPatients(patients);
    } else {
      const saved = localStorage.getItem('say_clinic_patients');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLocalPatients(parsed);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [patients]);

  const activePatientId = selectedPatientId || (localPatients.length > 0 ? localPatients[0].id : 'P1');
  const currentPatient: Patient = localPatients.find(p => p.id === activePatientId) || localPatients[0] || {
    id: 'P1',
    name: 'Mária Kováčová',
    birthNumber: '885512/6789',
    phone: '+421 905 123 456',
    email: 'maria.kovacova@email.sk',
    address: 'Slnečná 15, Banská Bystrica',
    dob: '12.05.1988',
    insurance: '24 (Dôvera)'
  };

  // 3D VECTORS & DRAWINGS
  const [vectors, setVectors] = useState<VectorItem[]>([
    ...PRESET_PROCEDURES[0].vectors // Default Sculptra Fanning
  ]);
  const [activeTool, setActiveTool] = useState<DrawingToolType>('rotate');
  const [activeColor, setActiveColor] = useState<string>('#C5A059');
  const [selectedVectorId, setSelectedVectorId] = useState<string | null>(null);

  const [selectedMaterialIdx, setSelectedMaterialIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'3d' | 'protocol'>('3d');
  const [savedStatusMsg, setSavedStatusMsg] = useState<string | null>(null);
  const [protocolRecordNo] = useState('AES-928412');
  const [patientHistoryRecords, setPatientHistoryRecords] = useState<MedicalRecord[]>([]);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  // Načítanie histórie pacienta
  useEffect(() => {
    if (!currentPatient?.id) return;
    const savedRecs = localStorage.getItem('say_clinic_patient_records');
    if (savedRecs) {
      try {
        const parsed = JSON.parse(savedRecs);
        if (parsed && parsed[currentPatient.id]) {
          setPatientHistoryRecords(parsed[currentPatient.id]);
        } else {
          setPatientHistoryRecords([]);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [currentPatient?.id]);

  const currentMaterial = PRESET_MATERIALS[selectedMaterialIdx];

  // Počítadlá výkonov
  const countThreads = vectors.filter(v => v.type === 'threads').length;
  const countFanning = vectors.filter(v => v.type === 'fanning').length;
  const countPoints = vectors.filter(v => v.type === 'point').length;
  const countDrawings = vectors.filter(v => v.type === 'freehand').length;

  const activeVector = vectors.find(v => v.id === selectedVectorId);

  // Rýchle aplikovanie predlohy procedúry
  const handleApplyPreset = (preset: typeof PRESET_PROCEDURES[0]) => {
    setVectors(prev => [...prev, ...preset.vectors]);
    setActiveColor(preset.color);
    if (preset.type === 'threads') setActiveTool('threads');
    else if (preset.type === 'fanning') setActiveTool('fanning');
    else setActiveTool('point');
  };

  // Uloženie do zložky pacienta v Kartotéke
  const handleSaveProtocolToPatientFolder = () => {
    if (!currentPatient) return;

    const todayDate = new Date().toISOString().split('T')[0];
    const formattedDateStr = new Date().toLocaleDateString('sk-SK');

    const vectorsList = vectors.map((v, idx) => 
      `${idx + 1}. [${v.type.toUpperCase()}] ${v.zoneName}
   • Prípravok: ${v.productName}
   • Šarža (LOT): ${v.lotNumber}
   • Špecifikácia: ${v.details}
   • Uhol modelu: ${Math.round((v.rotationY * 180) / Math.PI)}°`
    ).join('\n\n');

    const fullContent = `PROTOKOL O APLIKÁCII ESTETICKÝCH LIEČIV, BIOMATERIÁLOV A LIFTINGOVÝCH NITÍ (3D SCULPTURE MAPPING)
Dátum výkonu: ${formattedDateStr}
Číslo protokolu: ${protocolRecordNo}
Ošetrujúci lekár: MUDr. Ján Mráz (SAY CLINIC)

SÚHRNNÝ PREHĽAD VÝKONU:
• Počet aplikovaných liftingových nití (Aptos/PDO): ${countThreads} ks
• Počet vejárovitých kanylových aplikácií (Sculptra/Radiesse): ${countFanning} zón
• Počet bodových mikroinjekcií (Botox/Výplne): ${countPoints}
• Počet zameriavacích chirurgických rezov/kresieb: ${countDrawings}

DETAILNÝ SÚPIS APLIKOVANÝCH VEKTOROV A ŠARŽÍ (LOT TRACKING):
${vectorsList || 'Neboli zaznamenané žiadne vektory.'}

POUČENIE PACIENTA & POOPERAČNÝ REŽIM:
Pacient bol riadne poučený o poaplikačnom a pooperačnom režime. V prípade niťového liftingu a biostimulácie dodržiavať pokojový režim, obmedziť mimiku a masáže ošetrených oblastí počas 14 dní. Chladenie suchým chladom pri opuchoch. Kontrola o 14 dní na klinike.`;

    const newRecord: MedicalRecord = {
      id: `rec-aes-${Date.now()}`,
      type: 'Estetický protokol',
      typeColor: 'bg-[#C5A059]',
      title: `3D Face & Vector Mapping (${vectors.length} vektorov / nití)`,
      doctor: 'MUDr. Ján Mráz',
      diagnosis: 'Z41.1 (Esteticko-rekonštrukčný výkon)',
      date: todayDate,
      content: fullContent
    };

    try {
      const existingRaw = localStorage.getItem('say_clinic_patient_records') || '{}';
      const existing = JSON.parse(existingRaw);
      const patientList = existing[currentPatient.id] || [];
      const updatedList = [newRecord, ...patientList];
      existing[currentPatient.id] = updatedList;

      localStorage.setItem('say_clinic_patient_records', JSON.stringify(existing));
      setPatientHistoryRecords(updatedList);

      setSavedStatusMsg(`✅ 3D Protokol bol úspešne uložený do zložky pacienta: ${currentPatient.name}`);
      setTimeout(() => setSavedStatusMsg(null), 5000);
    } catch (e) {
      console.error('Chyba ukladania protokolu:', e);
      setSavedStatusMsg('❌ Chyba pri ukladaní protokolu.');
    }
  };

  return (
    <div className="space-y-6">
      {/* OZNÁMENIE O ÚSPEŠNOM ULOŽENÍ */}
      {savedStatusMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#2C2A29] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-[#C5A059] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 print:hidden">
          <CheckCircle2 className="w-5 h-5 text-[#C5A059]" />
          <div className="text-xs">
            <p className="font-bold">{savedStatusMsg}</p>
            <p className="text-[10px] text-gray-300">Záznam je ihneď dostupný v Kartotéke Pacientov → Dokumenty.</p>
          </div>
          {onOpenPatientFolder && (
            <button
              type="button"
              onClick={() => onOpenPatientFolder(currentPatient)}
              className="ml-3 px-3 py-1 bg-[#C5A059] hover:bg-[#B38F46] text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Zobraziť v karte</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* HEADER: AMBIENT GLASS S VÝBEROM PACIENTA */}
      <div className="relative rounded-3xl p-6 backdrop-blur-3xl bg-white/70 border border-white/80 shadow-[0_8px_32px_0_rgba(197,160,89,0.08)] overflow-hidden print:hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-gradient-to-br from-[#C5A059]/20 to-[#EAD8CA]/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-20 w-44 h-44 rounded-full bg-gradient-to-tr from-[#E8E2D9]/40 to-white/60 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2C2A29] to-[#433E3C] text-[#C5A059] flex items-center justify-center shadow-md">
              <Box className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-serif font-bold text-[#2C2A29] tracking-wide">
                  3D Face Mapping & Kreslenie na Sochu
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#C5A059]/15 text-[#9C7D2B] border border-[#C5A059]/30">
                  3D Interactive & Vectoring
                </span>
              </div>
              <p className="text-xs text-[#8C857B] mt-0.5">
                Otočná 3D anatomická socha, kreslenie vektorov pre nite (Aptos), kanylové vejáre (Sculptra) a mikrovpichy
              </p>
            </div>
          </div>

          {/* VOLIČ PACIENTA & POHĽADY */}
          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            {/* VOLIČ PACIENTA */}
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-[#C5A059]/40 shadow-xs">
              <User className="w-4 h-4 text-[#C5A059]" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-[#8C857B] leading-none">Klient z kartotéky:</span>
                <select
                  value={currentPatient.id}
                  onChange={(e) => onSelectPatient && onSelectPatient(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#2C2A29] focus:outline-hidden cursor-pointer"
                >
                  {localPatients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.birthNumber || p.dob})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* HISTÓRIA */}
            <button
              type="button"
              onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-xs font-medium text-[#2C2A29] transition-all shadow-xs cursor-pointer"
              title="História aplikácií pacienta"
            >
              <History className="w-4 h-4 text-[#C5A059]" />
              <span className="hidden sm:inline">História</span>
              <span className="w-5 h-5 rounded-full bg-[#FAF8F5] border border-[#E8E2D9] text-[10px] font-bold flex items-center justify-center">
                {patientHistoryRecords.length}
              </span>
            </button>

            {/* PREPÍNAČ REŽIMOV: 3D MODEL VS PROTOKOL */}
            <div className="flex items-center bg-[#FAF8F5]/80 p-1 rounded-2xl border border-[#E8E2D9]">
              <button
                type="button"
                onClick={() => setViewMode('3d')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  viewMode === '3d' ? 'bg-[#2C2A29] text-white shadow-xs' : 'text-[#8C857B] hover:text-[#2C2A29]'
                }`}
              >
                3D Socha & Kreslenie
              </button>
              <button
                type="button"
                onClick={() => setViewMode('protocol')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'protocol' ? 'bg-[#2C2A29] text-white shadow-xs' : 'text-[#8C857B] hover:text-[#2C2A29]'
                }`}
              >
                Lekársky protokol (A4)
              </button>
            </div>

            {/* ULOŽIŤ DO ZLOŽKY */}
            <button
              type="button"
              onClick={handleSaveProtocolToPatientFolder}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#C5A059] to-[#B38F46] hover:from-[#B38F46] hover:to-[#9E7B35] text-white text-xs font-semibold shadow-md shadow-[#C5A059]/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Uložiť do zložky</span>
            </button>
          </div>
        </div>
      </div>

      {/* HISTÓRIA PACIENTA */}
      {showHistoryDrawer && (
        <div className="rounded-3xl p-5 bg-[#FAF8F5] border border-[#E8E2D9] shadow-inner space-y-3 print:hidden animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#C5A059]" />
              <h3 className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider">
                Predchádzajúce estetické ošetrenia: {currentPatient.name}
              </h3>
            </div>
            <button 
              type="button"
              onClick={() => setShowHistoryDrawer(false)}
              className="text-xs text-[#8C857B] hover:text-[#2C2A29] font-bold cursor-pointer"
            >
              ✕ Zavrieť
            </button>
          </div>

          {patientHistoryRecords.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {patientHistoryRecords.map(rec => (
                <div key={rec.id} className="bg-white p-3.5 rounded-2xl border border-[#E8E2D9] shadow-2xs space-y-1.5">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold text-white bg-[#C5A059]">
                      {rec.type}
                    </span>
                    <span className="text-[10px] font-mono text-[#8C857B]">{rec.date}</span>
                  </div>
                  <p className="text-xs font-bold text-[#2C2A29]">{rec.title}</p>
                  <p className="text-[10px] text-[#8C857B] line-clamp-3 whitespace-pre-line">{rec.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#8C857B] text-center py-4 bg-white/60 rounded-xl border border-dashed border-[#E8E2D9]">
              Pre tohto pacienta zatiaľ nie sú zaznamenané žiadne predchádzajúce ošetrenia.
            </p>
          )}
        </div>
      )}

      {/* 3D SCULPTURE & DRAWING VIEW */}
      {viewMode === '3d' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
          
          {/* ĽAVÝ PANEL: VÝBER PRÍPRAVKU A PREDVOĽBY PROCEDÚR (3 COLS) */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* PRÍPRAVOK A ŠARŽA (LOT) */}
            <div className="rounded-3xl p-5 backdrop-blur-2xl bg-white/80 border border-white/90 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-[#C5A059]" />
                  Aktívny prípravok
                </span>
                <span className="text-[10px] text-[#8C857B] font-mono">LOT Tracking</span>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-medium text-[#8C857B]">Prípravok zo skladu:</label>
                <select
                  value={selectedMaterialIdx}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    setSelectedMaterialIdx(idx);
                    const mat = PRESET_MATERIALS[idx];
                    if (mat.type === 'threads') {
                      setActiveTool('threads');
                      setActiveColor('#8B5CF6');
                    } else if (mat.type === 'biostimulator') {
                      setActiveTool('fanning');
                      setActiveColor('#C5A059');
                    } else if (mat.type === 'botox') {
                      setActiveTool('point');
                      setActiveColor('#3B82F6');
                    } else {
                      setActiveTool('point');
                      setActiveColor('#EC4899');
                    }
                  }}
                  className="w-full text-xs font-medium p-2.5 rounded-xl bg-white border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden focus:border-[#C5A059] shadow-inner cursor-pointer"
                >
                  {PRESET_MATERIALS.map((mat, idx) => (
                    <option key={idx} value={idx}>
                      {mat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8C857B]">Šarža (LOT):</span>
                  <span className="font-mono font-bold text-[#2C2A29]">{currentMaterial.lot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8C857B]">Expirácia:</span>
                  <span className="font-mono text-[#8C857B]">{currentMaterial.expiry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8C857B]">Typ aplikácie:</span>
                  <span className="font-bold text-[#C5A059] capitalize">{currentMaterial.type}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-[#E8E2D9]/80 text-[11px] text-[#8C857B] space-y-1">
                <p className="font-bold text-[#2C2A29]">💡 Ako pracovať s 3D sochou:</p>
                <p>1. Zvoľte <strong className="text-[#2C2A29]">Otočiť 3D</strong> a ťahaním myšou/prstom otočte sochu do požadovaného uhla.</p>
                <p>2. Prepnite na <strong className="text-[#8B5CF6]">Nite</strong> alebo <strong className="text-[#C5A059]">Sculptra vejár</strong> a kliknutím a ťahaním nakreslite aplikačný vektor priamo na sochu!</p>
              </div>
            </div>

            {/* RÝCHLE ŠABLÓNY PROCEDÚR */}
            <div className="rounded-3xl p-5 backdrop-blur-2xl bg-white/80 border border-white/90 shadow-sm space-y-3">
              <span className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                Rýchle šablóny procedúr
              </span>

              <div className="space-y-2">
                {PRESET_PROCEDURES.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="w-full text-left p-3 rounded-2xl bg-white hover:bg-[#FAF8F5] border border-[#E8E2D9] hover:border-[#C5A059] transition-all group shadow-2xs cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#2C2A29] group-hover:text-[#C5A059] transition-colors">
                        {preset.title}
                      </span>
                      <span
                        style={{ backgroundColor: `${preset.color}20`, color: preset.color }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                      >
                        +{preset.vectors.length}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8C857B] mt-1 line-clamp-2">
                      {preset.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* STREDNÝ PANEL: 3D OTOČNÁ SOCHA & INTERAKTÍVNE PLÁTNO NA KRESLENIE (6 COLS) */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full rounded-3xl p-6 backdrop-blur-3xl bg-white/85 border border-white shadow-[0_12px_40px_0_rgba(197,160,89,0.12)] relative flex flex-col items-center">
              
              {/* HORNÝ ŠTATISTICKÝ SUMÁR */}
              <div className="w-full flex items-center justify-between pb-4 border-b border-[#E8E2D9]/70 mb-4 gap-2">
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                    <span className="text-[11px] font-bold text-[#2C2A29]">{countThreads} nití Aptos</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C5A059]" />
                    <span className="text-[11px] font-bold text-[#2C2A29]">{countFanning} Sculptra vejárov</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
                    <span className="text-[11px] font-bold text-[#2C2A29]">{countPoints} mikrovpichov</span>
                  </div>
                </div>

                <span className="text-[10px] uppercase font-bold text-[#C5A059] bg-[#C5A059]/10 px-2.5 py-1 rounded-xl">
                  3D Studio Live
                </span>
              </div>

              {/* THREE.JS 3D SCULPTURE VIEWER & DRAWING CANVAS */}
              <Sculpture3DViewer
                vectors={vectors}
                onVectorsChange={setVectors}
                activeTool={activeTool}
                onSelectTool={setActiveTool}
                activeColor={activeColor}
                onSelectColor={setActiveColor}
                currentProduct={currentMaterial}
                selectedVectorId={selectedVectorId}
                onSelectVector={setSelectedVectorId}
              />

              {/* LEGENDA POD SOCHOU */}
              <div className="w-full flex items-center justify-between text-[11px] text-[#8C857B] mt-4 pt-3 border-t border-[#E8E2D9]/70">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" /> Nite Aptos/PDO
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#C5A059]" /> Sculptra / Radiesse
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#3B82F6]" /> Botox
                  </span>
                </div>
                <span className="font-serif italic text-xs">SAY CLINIC 3D Sculpture Suite</span>
              </div>
            </div>
          </div>

          {/* PRAVÝ PANEL: DETAIL ZVOLENÉHO VEKTORU & ZOZNAM VŠETKÝCH NÁKRESOV (3 COLS) */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* DETAIL ZVOLENÉHO VEKTORU */}
            {activeVector ? (
              <div className="rounded-3xl p-5 backdrop-blur-2xl bg-white/80 border border-white/90 shadow-md space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider">
                    Detail vektoru / nite
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setVectors(vectors.filter(v => v.id !== activeVector.id));
                      setSelectedVectorId(null);
                    }}
                    className="p-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Zmazať
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-[#8C857B]">Názov zóny / vektoru:</label>
                    <input
                      type="text"
                      value={activeVector.zoneName}
                      onChange={(e) => {
                        const updated = vectors.map(v => v.id === activeVector.id ? { ...v, zoneName: e.target.value } : v);
                        setVectors(updated);
                      }}
                      className="w-full text-xs font-semibold p-2 rounded-xl bg-white border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8C857B]">Použitý materiál:</label>
                    <input
                      type="text"
                      value={activeVector.productName}
                      onChange={(e) => {
                        const updated = vectors.map(v => v.id === activeVector.id ? { ...v, productName: e.target.value } : v);
                        setVectors(updated);
                      }}
                      className="w-full text-xs p-2 rounded-xl bg-white border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8C857B]">Špecifikácia / Dĺžka nite / Objem:</label>
                    <textarea
                      rows={2}
                      value={activeVector.details}
                      onChange={(e) => {
                        const updated = vectors.map(v => v.id === activeVector.id ? { ...v, details: e.target.value } : v);
                        setVectors(updated);
                      }}
                      className="w-full text-xs p-2 rounded-xl bg-white border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden resize-none"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[10px] font-mono space-y-1">
                    <p><span className="text-[#8C857B]">Šarža:</span> {activeVector.lotNumber}</p>
                    <p><span className="text-[#8C857B]">Typ:</span> {activeVector.type}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl p-6 backdrop-blur-2xl bg-white/50 border border-white/60 text-center text-xs text-[#8C857B]">
                Kliknite na ktorýkoľvek vektor alebo niť v zozname pre zobrazenie a úpravu podrobností.
              </div>
            )}

            {/* ZOZNAM VŠETKÝCH NAKRESLENÝCH VEKTOROV */}
            <div className="rounded-3xl p-5 backdrop-blur-2xl bg-white/80 border border-white/90 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#C5A059]" />
                  Zoznam vektorov ({vectors.length})
                </span>
                <button
                  type="button"
                  onClick={() => setVectors([])}
                  className="text-[10px] text-red-500 hover:underline cursor-pointer"
                >
                  Vymazať všetko
                </button>
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {vectors.map((vec) => (
                  <div
                    key={vec.id}
                    onClick={() => setSelectedVectorId(vec.id)}
                    className={`p-2.5 rounded-2xl text-xs flex items-center justify-between cursor-pointer transition-all ${
                      vec.id === selectedVectorId
                        ? 'bg-[#2C2A29] text-white shadow-md'
                        : 'bg-white/80 hover:bg-white text-[#2C2A29] border border-[#E8E2D9]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span 
                        style={{ backgroundColor: vec.color }} 
                        className="w-3 h-3 rounded-full shrink-0 shadow-xs" 
                      />
                      <div className="truncate">
                        <p className="font-semibold truncate">{vec.zoneName}</p>
                        <p className={`text-[10px] truncate ${vec.id === selectedVectorId ? 'text-gray-300' : 'text-[#8C857B]'}`}>
                          {vec.productName}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-lg shrink-0 ${
                      vec.id === selectedVectorId ? 'bg-white/20 text-white' : 'bg-[#FAF8F5] text-[#8C857B]'
                    }`}>
                      {vec.type}
                    </span>
                  </div>
                ))}

                {vectors.length === 0 && (
                  <p className="text-xs text-[#8C857B] text-center py-6">
                    Zatiaľ neboli nakreslené žiadne vektory ani nite.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LEKÁRSKY PROTOKOL (PRE TLAČ NA A4) */}
      {viewMode === 'protocol' && (
        <div className="max-w-4xl mx-auto rounded-3xl p-8 backdrop-blur-3xl bg-white/90 border border-white shadow-xl space-y-6 print:p-0 print:border-none print:shadow-none print:bg-white">
          
          <div id="printable-a4" className="printable-document bg-white p-8 sm:p-10 border border-[#E8E2D9] rounded-2xl shadow-sm text-xs leading-relaxed space-y-6 print:border-none print:shadow-none print:p-0">
            {/* HLAVIČKA */}
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-6">
              <div>
                <div className="text-2xl font-serif font-bold tracking-widest text-[#2C2A29]">
                  SAY CLINIC
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A059] font-bold mt-0.5">
                  PLASTICKÁ CHIRURGIA & DERMATOLÓGIA
                </div>
                <p className="text-[10px] text-[#8C857B] mt-1">Lazovná 43, 974 01 Banská Bystrica • www.sayclinic.sk</p>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-[#2C2A29]">Dátum: {new Date().toLocaleDateString('sk-SK')}</div>
                <div className="text-[10px] text-[#8C857B] font-mono">Číslo záznamu: {protocolRecordNo}</div>
              </div>
            </div>

            {/* PACIENT & LEKÁR */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] text-xs">
              <div>
                <p className="text-[10px] text-[#8C857B] uppercase font-bold">Pacient / Klient:</p>
                <p className="font-bold text-[#2C2A29] text-sm">{currentPatient.name}</p>
                <p className="text-[#8C857B]">Rodné číslo: {currentPatient.birthNumber || currentPatient.dob}</p>
                <p className="text-[#8C857B]">Poisťovňa: {currentPatient.insurance}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#8C857B] uppercase font-bold">Ošetrujúci lekár & pracovisko:</p>
                <p className="font-bold text-[#2C2A29] text-sm">MUDr. Ján Mráz</p>
                <p className="text-[#8C857B]">SAY CLINIC Banská Bystrica</p>
                <p className="text-[#8C857B]">Výkon: 3D Face Mapping, Niťový lifting & Biostimulátory</p>
              </div>
            </div>

            {/* SÚHRN */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] text-center">
                <span className="text-[10px] text-[#8C857B] uppercase font-bold">Liftingové nite:</span>
                <p className="text-sm font-bold font-mono text-[#8B5CF6]">{countThreads} ks</p>
              </div>
              <div className="p-3 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] text-center">
                <span className="text-[10px] text-[#8C857B] uppercase font-bold">Sculptra / Vejáre:</span>
                <p className="text-sm font-bold font-mono text-[#C5A059]">{countFanning} zón</p>
              </div>
              <div className="p-3 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] text-center">
                <span className="text-[10px] text-[#8C857B] uppercase font-bold">Injekčné body & rezy:</span>
                <p className="text-sm font-bold font-mono text-[#2C2A29]">{countPoints + countDrawings} bodov</p>
              </div>
            </div>

            {/* TABUĽKA ŠARŽÍ & VEKTOROV */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2A29] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                Zoznam aplikovaných vektorov a evidencia šarží (LOT Tracking):
              </h3>
              <div className="border border-[#E8E2D9] rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#FAF8F5] text-[#8C857B] font-bold border-b border-[#E8E2D9]">
                    <tr>
                      <th className="p-3">Typ & Zóna</th>
                      <th className="p-3">Použitý materiál</th>
                      <th className="p-3">Šarža (LOT)</th>
                      <th className="p-3">Špecifikácia / Dĺžka</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D9]/60">
                    {vectors.map((vec, idx) => (
                      <tr key={idx} className="hover:bg-white/60">
                        <td className="p-3 font-semibold text-[#2C2A29]">
                          <span className="uppercase text-[9px] font-bold text-[#8C857B] block">{vec.type}</span>
                          {vec.zoneName}
                        </td>
                        <td className="p-3 text-[#2C2A29]">{vec.productName}</td>
                        <td className="p-3 font-mono font-medium text-[#C5A059]">{vec.lotNumber}</td>
                        <td className="p-3 text-[#8C857B]">{vec.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PODPIS */}
            <div className="mt-12 pt-8 border-t border-[#E8E2D9] flex justify-between items-end text-[10px] text-[#8C857B]">
              <div>
                <p className="font-bold text-[#C5A059] mb-0.5">SAY CLINIC 3D Protocol</p>
                <p>Vygenerované z 3D Sculpture systému SAY CLINIC</p>
              </div>
              <div className="text-center">
                <div className="w-44 border-b border-[#2C2A29] mb-2" />
                <span className="font-bold text-[#2C2A29]">MUDr. Ján Mráz</span><br />
                Pečiatka a podpis lekára
              </div>
            </div>
          </div>

          {/* OVLÁDACIA LIŠTA PROTOKOLU */}
          <div className="flex items-center justify-between pt-2 border-t border-[#E8E2D9] print:hidden">
            <button
              type="button"
              onClick={() => setViewMode('3d')}
              className="text-xs text-[#8C857B] hover:text-[#2C2A29] font-medium cursor-pointer"
            >
              ← Späť na 3D sochu & kreslenie
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-xs font-semibold text-[#2C2A29] shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Tlačiť protokol (A4)
              </button>
              <button
                type="button"
                onClick={handleSaveProtocolToPatientFolder}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" /> Uložiť do zložky pacienta
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

