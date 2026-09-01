'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  MapPin, 
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
  Sliders
} from 'lucide-react';
import { Patient, MedicalRecord } from './PatientDatabase';

export interface InjectionPoint {
  id: string;
  x: number; // % from left (0 - 100)
  y: number; // % from top (0 - 100)
  zone: string;
  productType: 'botox' | 'filler' | 'threads' | 'biostimulator' | 'meso';
  productName: string;
  lotNumber: string;
  unitsOrVolume: number; // IU or ml
  unitLabel: string;
  depth: 'intradermal' | 'subcutaneous' | 'supraperiosteal' | 'intramuscular';
  notes?: string;
}

const PRESET_ZONES = [
  { id: 'glabella', name: 'Glabela (vráska hnevu)', x: 50, y: 31, defaultProduct: 'Botox Allergan 100IU', unit: 'IU', defaultQty: 20, type: 'botox' as const },
  { id: 'forehead', name: 'Čelo (frontalis)', x: 50, y: 19, defaultProduct: 'Botox Allergan 100IU', unit: 'IU', defaultQty: 12, type: 'botox' as const },
  { id: 'crows_left', name: 'Vrásky okolo očí Ľ', x: 33, y: 36, defaultProduct: 'Botox Allergan 100IU', unit: 'IU', defaultQty: 10, type: 'botox' as const },
  { id: 'crows_right', name: 'Vrásky okolo očí P', x: 67, y: 36, defaultProduct: 'Botox Allergan 100IU', unit: 'IU', defaultQty: 10, type: 'botox' as const },
  { id: 'bunny_lines', name: 'Bunny lines (nos)', x: 50, y: 44, defaultProduct: 'Botox Allergan 100IU', unit: 'IU', defaultQty: 6, type: 'botox' as const },
  { id: 'lips_upper', name: 'Pery - Horná pera', x: 50, y: 64, defaultProduct: 'Juvederm Volbella 1ml (Pery)', unit: 'ml', defaultQty: 0.5, type: 'filler' as const },
  { id: 'lips_lower', name: 'Pery - Dolná pera', x: 50, y: 70, defaultProduct: 'Juvederm Volbella 1ml (Pery)', unit: 'ml', defaultQty: 0.5, type: 'filler' as const },
  { id: 'nasolabial_l', name: 'Nasolabiálna ryha Ľ', x: 41, y: 57, defaultProduct: 'Juvederm Volift 1ml', unit: 'ml', defaultQty: 0.5, type: 'filler' as const },
  { id: 'nasolabial_r', name: 'Nasolabiálna ryha P', x: 59, y: 57, defaultProduct: 'Juvederm Volift 1ml', unit: 'ml', defaultQty: 0.5, type: 'filler' as const },
  { id: 'cheeks_left', name: 'Lícna kosť & Malar Ľ', x: 31, y: 48, defaultProduct: 'Juvederm Voluma 1ml', unit: 'ml', defaultQty: 1.0, type: 'filler' as const },
  { id: 'cheeks_right', name: 'Lícna kosť & Malar P', x: 69, y: 48, defaultProduct: 'Juvederm Voluma 1ml', unit: 'ml', defaultQty: 1.0, type: 'filler' as const },
  { id: 'marionette_l', name: 'Marionety Ľ', x: 42, y: 76, defaultProduct: 'Stylage M 1ml', unit: 'ml', defaultQty: 0.4, type: 'filler' as const },
  { id: 'marionette_r', name: 'Marionety P', x: 58, y: 76, defaultProduct: 'Stylage M 1ml', unit: 'ml', defaultQty: 0.4, type: 'filler' as const },
  { id: 'jawline_l', name: 'Čeľusťová línia Ľ', x: 27, y: 74, defaultProduct: 'Radiesse (+) 1.5ml', unit: 'ml', defaultQty: 0.75, type: 'biostimulator' as const },
  { id: 'jawline_r', name: 'Čeľusťová línia P', x: 73, y: 74, defaultProduct: 'Radiesse (+) 1.5ml', unit: 'ml', defaultQty: 0.75, type: 'biostimulator' as const },
  { id: 'chin', name: 'Brada (mentalis & projekcia)', x: 50, y: 85, defaultProduct: 'Juvederm Volux 1ml', unit: 'ml', defaultQty: 1.0, type: 'filler' as const },
];

const PRESET_MATERIALS = [
  { name: 'Botox Allergan 100IU', type: 'botox', lot: 'BTX-2026-991A', expiry: '02/2028', unit: 'IU', pricePerUnit: 6 },
  { name: 'Dysport 300IU', type: 'botox', lot: 'DYSP-4412B', expiry: '05/2027', unit: 'IU', pricePerUnit: 3 },
  { name: 'Juvederm Voluma with Lidocaine 1ml', type: 'filler', lot: 'JUV-VOL-8812', expiry: '08/2027', unit: 'ml', pricePerUnit: 340 },
  { name: 'Juvederm Volift 1ml', type: 'filler', lot: 'JUV-VFT-1102', expiry: '11/2027', unit: 'ml', pricePerUnit: 320 },
  { name: 'Juvederm Volbella 1ml (Pery)', type: 'filler', lot: 'JUV-VBL-7740', expiry: '04/2028', unit: 'ml', pricePerUnit: 310 },
  { name: 'Juvederm Volux 1ml (Čeľusť/Brada)', type: 'filler', lot: 'JUV-VLX-9311', expiry: '09/2027', unit: 'ml', pricePerUnit: 360 },
  { name: 'Stylage M with Mepivacaine 1ml', type: 'filler', lot: 'STY-M-5521', expiry: '12/2026', unit: 'ml', pricePerUnit: 280 },
  { name: 'Radiesse (+) 1.5ml (Biostimulátor)', type: 'biostimulator', lot: 'RAD-150-332', expiry: '01/2028', unit: 'ml', pricePerUnit: 420 },
  { name: 'Profhilo H+L 2ml (Bioremodelácia)', type: 'meso', lot: 'PRO-2ML-881', expiry: '06/2027', unit: 'ml', pricePerUnit: 290 },
  { name: 'Aptos Excellence Visage (Niťový lifting)', type: 'threads', lot: 'APT-EXC-091', expiry: '03/2028', unit: 'ks', pricePerUnit: 750 },
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
  // Synchronizácia lokálneho zoznamu pacientov
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

  // Body vpichu
  const [points, setPoints] = useState<InjectionPoint[]>([
    {
      id: 'pt1',
      x: 50,
      y: 31,
      zone: 'Glabela (vráska hnevu)',
      productType: 'botox',
      productName: 'Botox Allergan 100IU',
      lotNumber: 'BTX-2026-991A',
      unitsOrVolume: 20,
      unitLabel: 'IU',
      depth: 'intramuscular',
      notes: '3 body aplikácie do m. corrugator a m. procerus'
    },
    {
      id: 'pt2',
      x: 50,
      y: 19,
      zone: 'Čelo (horizontálne vrásky)',
      productType: 'botox',
      productName: 'Botox Allergan 100IU',
      lotNumber: 'BTX-2026-991A',
      unitsOrVolume: 12,
      unitLabel: 'IU',
      depth: 'intramuscular',
      notes: '4 mikrovpichy 2cm nad obočím'
    },
    {
      id: 'pt3',
      x: 50,
      y: 64,
      zone: 'Pery - Horná pera',
      productType: 'filler',
      productName: 'Juvederm Volbella 1ml (Pery)',
      lotNumber: 'JUV-VBL-7740',
      unitsOrVolume: 0.4,
      unitLabel: 'ml',
      depth: 'subcutaneous',
      notes: 'Zvýraznenie kontúry a mierny objem'
    },
    {
      id: 'pt4',
      x: 50,
      y: 70,
      zone: 'Pery - Dolná pera',
      productType: 'filler',
      productName: 'Juvederm Volbella 1ml (Pery)',
      lotNumber: 'JUV-VBL-7740',
      unitsOrVolume: 0.6,
      unitLabel: 'ml',
      depth: 'subcutaneous',
      notes: 'Podpora dolného vankúšika pier'
    }
  ]);

  const [selectedPointId, setSelectedPointId] = useState<string | null>('pt1');
  const [selectedMaterialIdx, setSelectedMaterialIdx] = useState(0);
  const [inputQty, setInputQty] = useState<number>(10);
  const [inputZoneName, setInputZoneName] = useState('Vlastná anatomická zóna');
  const [viewMode, setViewMode] = useState<'map' | 'protocol'>('map');
  const [savedStatusMsg, setSavedStatusMsg] = useState<string | null>(null);
  const [pointSeq, setPointSeq] = useState(5);
  const [protocolRecordNo] = useState('AES-928412');
  const [showGrid, setShowGrid] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'botox' | 'filler' | 'biostimulator'>('all');
  const [patientHistoryRecords, setPatientHistoryRecords] = useState<MedicalRecord[]>([]);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  // Načítanie existujúcich záznamov pacienta z localStorage
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

  // Výpočet celkových spotrebovaných jednotiek
  const totalBotoxIU = points
    .filter(p => p.productType === 'botox')
    .reduce((sum, p) => sum + p.unitsOrVolume, 0);

  const totalFillerML = points
    .filter(p => p.productType === 'filler' || p.productType === 'biostimulator' || p.productType === 'meso')
    .reduce((sum, p) => sum + p.unitsOrVolume, 0);

  const activePoint = points.find(p => p.id === selectedPointId);

  // Filtrované body podľa aktívneho filtra
  const filteredPoints = points.filter(p => {
    if (filterType === 'all') return true;
    if (filterType === 'botox') return p.productType === 'botox';
    if (filterType === 'filler') return p.productType === 'filler' || p.productType === 'meso';
    if (filterType === 'biostimulator') return p.productType === 'biostimulator' || p.productType === 'threads';
    return true;
  });

  // Kliknutie do tvárovej sochy pre umiestnenie bodu
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const material = PRESET_MATERIALS[selectedMaterialIdx];
    const newPt: InjectionPoint = {
      id: `pt_${pointSeq}`,
      x,
      y,
      zone: inputZoneName || 'Aplikačný bod',
      productType: material.type as any,
      productName: material.name,
      lotNumber: material.lot,
      unitsOrVolume: inputQty,
      unitLabel: material.unit,
      depth: material.type === 'botox' ? 'intramuscular' : 'subcutaneous',
      notes: `Aplikácia ${inputQty} ${material.unit}`
    };

    setPoints(prev => [...prev, newPt]);
    setSelectedPointId(newPt.id);
    setPointSeq(prev => prev + 1);
  };

  const handleQuickAddZone = (zone: typeof PRESET_ZONES[0]) => {
    const matchingMat = PRESET_MATERIALS.find(m => m.type === zone.type) || PRESET_MATERIALS[0];
    const newPt: InjectionPoint = {
      id: `pt_${pointSeq}`,
      x: zone.x,
      y: zone.y,
      zone: zone.name,
      productType: zone.type,
      productName: matchingMat.name,
      lotNumber: matchingMat.lot,
      unitsOrVolume: zone.defaultQty,
      unitLabel: zone.unit,
      depth: zone.type === 'botox' ? 'intramuscular' : 'subcutaneous',
      notes: `Štandardná anatomická zóna: ${zone.name}`
    };

    setPoints(prev => [...prev, newPt]);
    setSelectedPointId(newPt.id);
    setPointSeq(prev => prev + 1);
  };

  const handleDeletePoint = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPoints(prev => prev.filter(p => p.id !== id));
    if (selectedPointId === id) {
      setSelectedPointId(points.length > 1 ? points.filter(p => p.id !== id)[0]?.id || null : null);
    }
  };

  // ULOŽENIE ZÁZNAMU PRIAMO DO ZLOŽKY PACIENTA V KARTOTÉKE
  const handleSaveProtocolToPatientFolder = () => {
    if (!currentPatient) return;

    const todayDate = new Date().toISOString().split('T')[0];
    const formattedDateStr = new Date().toLocaleDateString('sk-SK');

    // Vytvorenie detailného štruktúrovaného textu protokolu
    const zonesSummary = points.map((p, idx) => 
      `${idx + 1}. ${p.zone}
   • Prípravok: ${p.productName}
   • Šarža (LOT): ${p.lotNumber}
   • Dávka: ${p.unitsOrVolume} ${p.unitLabel} (${p.depth})
   ${p.notes ? `• Poznámka: ${p.notes}` : ''}`
    ).join('\n\n');

    const fullContent = `PROTOKOL O APLIKÁCII ESTETICKÝCH LIEČIV A VÝPLNÍ (FACE MAPPING)
Dátum výkonu: ${formattedDateStr}
Číslo protokolu: ${protocolRecordNo}
Ošetrujúci lekár: MUDr. Ján Mráz (SAY CLINIC)

SÚHRNNÝ PREHĽAD:
• Celková dávka Botulotoxínu: ${totalBotoxIU} IU
• Celkový objem výplní & biostimulátorov: ${totalFillerML.toFixed(1)} ml
• Celkový počet aplikačných bodov: ${points.length}

DETAILNÝ SÚPIS APLIKÁCIÍ A ŠARŽÍ (LOT TRACKING):
${zonesSummary}

POUČENIE PACIENTA & POOPERAČNÝ REŽIM:
Pacient bol riadne poučený o poaplikačnom režime (neľahať si 4 hodiny po aplikácii botulotoxínu, vyhnúť sa zvýšenej fyzickej námahe, saune a soláriu na 48 hodín). V prípade opuchu chladiť cez čistú textíliu. Kontrola o 14 dní.`;

    const newRecord: MedicalRecord = {
      id: `rec-aes-${Date.now()}`,
      type: 'Estetický protokol',
      typeColor: 'bg-[#C5A059]',
      title: `Face Mapping & Aplikácia (${points.length} vpichov)`,
      doctor: 'MUDr. Ján Mráz',
      diagnosis: 'Z41.1 (Estetický výkon)',
      date: todayDate,
      content: fullContent
    };

    // Načítanie a zápis do localStorage pre kartotéku
    try {
      const existingRaw = localStorage.getItem('say_clinic_patient_records') || '{}';
      const existing = JSON.parse(existingRaw);
      const patientList = existing[currentPatient.id] || [];
      const updatedList = [newRecord, ...patientList];
      existing[currentPatient.id] = updatedList;

      localStorage.setItem('say_clinic_patient_records', JSON.stringify(existing));
      setPatientHistoryRecords(updatedList);

      setSavedStatusMsg(`✅ Protokol bol úspešne uložený do zložky pacienta: ${currentPatient.name}`);
      setTimeout(() => setSavedStatusMsg(null), 5000);
    } catch (e) {
      console.error('Chyba ukladania záznamu do zložky pacienta:', e);
      setSavedStatusMsg('❌ Chyba pri ukladaní protokolu.');
    }
  };

  return (
    <div className="space-y-6">
      {/* OZNÁMENIE O ÚSPEŠNOM ULOŽENÍ DO ZLOŽKY PACIENTA */}
      {savedStatusMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#2C2A29] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-[#C5A059] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 print:hidden">
          <CheckCircle2 className="w-5 h-5 text-[#C5A059]" />
          <div className="text-xs">
            <p className="font-bold">{savedStatusMsg}</p>
            <p className="text-[10px] text-gray-300">Záznam je ihneď prístupný v sekcii Kartotéka Pacientov → Dokumenty.</p>
          </div>
          {onOpenPatientFolder && (
            <button
              onClick={() => onOpenPatientFolder(currentPatient)}
              className="ml-3 px-3 py-1 bg-[#C5A059] hover:bg-[#B38F46] text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
            >
              <span>Zobraziť v karte</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* HEADER: LIQUID GLASS AMBIENT KARTA */}
      <div className="relative rounded-3xl p-6 backdrop-blur-3xl bg-white/70 border border-white/80 shadow-[0_8px_32px_0_rgba(197,160,89,0.08)] overflow-hidden print:hidden">
        {/* Ambient svetelné efekty */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-gradient-to-br from-[#C5A059]/20 to-[#EAD8CA]/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-20 w-44 h-44 rounded-full bg-gradient-to-tr from-[#E8E2D9]/40 to-white/60 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2C2A29] to-[#433E3C] text-[#C5A059] flex items-center justify-center shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-serif font-bold text-[#2C2A29] tracking-wide">
                  Estetická medicína & Face Mapping
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#C5A059]/15 text-[#9C7D2B] border border-[#C5A059]/30">
                  Sculpture Edition
                </span>
              </div>
              <p className="text-xs text-[#8C857B] mt-0.5">
                Klasická sochárska busta tváre, presná anatomická navigácia vpichov a trvalé ukladanie do karty pacienta
              </p>
            </div>
          </div>

          {/* VOLIČ PACIENTA Z KARTOTÉKY & AKCIE */}
          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            {/* VOLIČ PACIENTA S MENOM A RČ */}
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

            {/* PREPÍNAČ HISTÓRIE OŠETRENÍ */}
            <button
              onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-xs font-medium text-[#2C2A29] transition-all shadow-xs"
              title="História aplikácií tohto pacienta"
            >
              <History className="w-4 h-4 text-[#C5A059]" />
              <span className="hidden sm:inline">História pacienta</span>
              <span className="w-5 h-5 rounded-full bg-[#FAF8F5] border border-[#E8E2D9] text-[10px] font-bold flex items-center justify-center">
                {patientHistoryRecords.length}
              </span>
            </button>

            {/* PREPÍNAČ POHĽADOV */}
            <div className="flex items-center bg-[#FAF8F5]/80 p-1 rounded-2xl border border-[#E8E2D9]">
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  viewMode === 'map' ? 'bg-[#2C2A29] text-white shadow-xs' : 'text-[#8C857B] hover:text-[#2C2A29]'
                }`}
              >
                Mapa tváre
              </button>
              <button
                onClick={() => setViewMode('protocol')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  viewMode === 'protocol' ? 'bg-[#2C2A29] text-white shadow-xs' : 'text-[#8C857B] hover:text-[#2C2A29]'
                }`}
              >
                Lekársky protokol
              </button>
            </div>

            {/* TLAČIDLO ULOŽIŤ DO KARTY PACIENTA */}
            <button
              onClick={handleSaveProtocolToPatientFolder}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#C5A059] to-[#B38F46] hover:from-[#B38F46] hover:to-[#9E7B35] text-white text-xs font-semibold shadow-md shadow-[#C5A059]/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>Uložiť do zložky pacienta</span>
            </button>
          </div>
        </div>
      </div>

      {/* DRAWER / HISTÓRIA PACIENTA */}
      {showHistoryDrawer && (
        <div className="rounded-3xl p-5 bg-[#FAF8F5] border border-[#E8E2D9] shadow-inner space-y-3 print:hidden animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#C5A059]" />
              <h3 className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider">
                Predchádzajúce estetické ošetrenia & dekurzy klienta: {currentPatient.name}
              </h3>
            </div>
            <button 
              onClick={() => setShowHistoryDrawer(false)}
              className="text-xs text-[#8C857B] hover:text-[#2C2A29] font-bold"
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

      {/* HLAVNÁ ČASŤ - MAPA A OVLÁDACÍ PANEL */}
      {viewMode === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
          {/* ĽAVÝ PANEL: VÝBER PRÍPRAVKU ZO SKLADU & ANATOMICKÉ ZÓNY (3 COLS) */}
          <div className="lg:col-span-3 space-y-4">
            {/* VÝBER AKTUÁLNEHO PRÍPRAVKU ZO SKLADU */}
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
                  onChange={(e) => setSelectedMaterialIdx(Number(e.target.value))}
                  className="w-full text-xs font-medium p-2.5 rounded-xl bg-white border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden focus:border-[#C5A059] shadow-inner"
                >
                  {PRESET_MATERIALS.map((mat, idx) => (
                    <option key={idx} value={idx}>
                      {mat.name} ({mat.lot})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[10px] text-[#8C857B]">Dávka na vpich:</label>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      step={PRESET_MATERIALS[selectedMaterialIdx].unit === 'IU' ? '1' : '0.1'}
                      value={inputQty}
                      onChange={(e) => setInputQty(Number(e.target.value))}
                      className="w-full text-xs font-bold p-2 rounded-xl bg-white border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden focus:border-[#C5A059]"
                    />
                    <span className="text-xs font-semibold text-[#8C857B]">
                      {PRESET_MATERIALS[selectedMaterialIdx].unit}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-[#8C857B]">Šarža / LOT:</label>
                  <div className="mt-1 p-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[11px] font-mono font-medium text-[#2C2A29] truncate">
                    {PRESET_MATERIALS[selectedMaterialIdx].lot}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#8C857B]">Popis zóny pri manuálnom kliknutí:</label>
                <input
                  type="text"
                  value={inputZoneName}
                  onChange={(e) => setInputZoneName(e.target.value)}
                  placeholder="napr. Lícna oblasť vpravo"
                  className="w-full text-xs p-2 mt-1 rounded-xl bg-white border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden focus:border-[#C5A059]"
                />
              </div>

              <p className="text-[10px] text-[#8C857B] bg-[#FAF8F5] p-2 rounded-xl border border-[#E8E2D9]/60">
                💡 Kliknite priamo do mramorovej sochy tváre pre umiestnenie bodu.
              </p>
            </div>

            {/* ANATOMICKÉ RÝCHLE PREDVOĽBY */}
            <div className="rounded-3xl p-5 backdrop-blur-2xl bg-white/80 border border-white/90 shadow-sm space-y-3">
              <span className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#C5A059]" />
                Rýchle anatomické zóny
              </span>

              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {PRESET_ZONES.map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => handleQuickAddZone(zone)}
                    type="button"
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-white/80 hover:bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-left transition-all group shadow-2xs"
                  >
                    <div>
                      <div className="text-xs font-medium text-[#2C2A29] group-hover:text-[#C5A059] transition-colors">
                        {zone.name}
                      </div>
                      <div className="text-[10px] text-[#8C857B]">
                        Typ: {zone.type === 'botox' ? 'Botulotoxín' : 'Kyselina hyalurónová'}
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-[#2C2A29] bg-[#FAF8F5] px-2 py-0.5 rounded-lg border border-[#E8E2D9]">
                      +{zone.defaultQty} {zone.unit}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* STREDNÝ PANEL: KLASICKÁ SOCHA TVÁRE - FACE MAPPING BUSTA (6 COLS) */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full rounded-3xl p-6 backdrop-blur-3xl bg-white/85 border border-white shadow-[0_12px_40px_0_rgba(197,160,89,0.12)] relative flex flex-col items-center">
              
              {/* HORNÝ ŠTATISTICKÝ SUMÁR & FILTRE */}
              <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#E8E2D9]/70 mb-4 gap-3 z-10">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8C857B]">Botulotoxín:</span>
                    <div className="text-sm font-bold text-[#2C2A29] font-mono flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
                      {totalBotoxIU} IU
                    </div>
                  </div>
                  <div className="border-l border-[#E8E2D9] pl-4">
                    <span className="text-[10px] uppercase font-bold text-[#8C857B]">Výplne & Bio:</span>
                    <div className="text-sm font-bold text-[#2C2A29] font-mono flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899]" />
                      {totalFillerML.toFixed(1)} ml
                    </div>
                  </div>
                </div>

                {/* FILTRE TYPU LÁTOK & MRÍŽKA */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowGrid(!showGrid)}
                    className={`p-1.5 rounded-xl border text-xs flex items-center gap-1 transition-colors ${
                      showGrid ? 'bg-[#2C2A29] text-white border-[#2C2A29]' : 'bg-white text-[#8C857B] border-[#E8E2D9]'
                    }`}
                    title="Prepnúť anatomickú mriežku"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex bg-[#FAF8F5] p-0.5 rounded-xl border border-[#E8E2D9] text-[10px] font-semibold">
                    <button
                      onClick={() => setFilterType('all')}
                      className={`px-2 py-1 rounded-lg ${filterType === 'all' ? 'bg-[#2C2A29] text-white' : 'text-[#8C857B]'}`}
                    >
                      Všetko
                    </button>
                    <button
                      onClick={() => setFilterType('botox')}
                      className={`px-2 py-1 rounded-lg ${filterType === 'botox' ? 'bg-blue-600 text-white' : 'text-[#8C857B]'}`}
                    >
                      Botox
                    </button>
                    <button
                      onClick={() => setFilterType('filler')}
                      className={`px-2 py-1 rounded-lg ${filterType === 'filler' ? 'bg-pink-600 text-white' : 'text-[#8C857B]'}`}
                    >
                      Výplne
                    </button>
                  </div>

                  <button
                    onClick={() => setPoints([])}
                    title="Vymazať všetky body"
                    className="p-1.5 rounded-xl text-[#8C857B] hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* INTERAKTÍVNE PLÁTNO: KLASICKÁ SOCHÁRSKA BUSTA TVÁRE */}
              <div
                onClick={handleMapClick}
                className="relative w-full max-w-[430px] aspect-[3/4] rounded-3xl overflow-hidden border border-[#E8E2D9] shadow-xl cursor-crosshair select-none group bg-gradient-to-b from-[#FAF8F5] to-[#EFEAE2]"
              >
                {/* 1. ESTETICKÁ MRAMOROVÁ SOCHA TVÁRE AKO BUSTA */}
                <img
                  src="/face_bust.jpg?v=1"
                  alt="Anatomická socha tváre pre Face Mapping"
                  className="w-full h-full object-cover pointer-events-none filter contrast-[1.02] brightness-[0.98]"
                />

                {/* Jemná anatomická radiálna mriežka pre dokonalé polohovanie */}
                {showGrid && (
                  <div className="absolute inset-0 bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:18px_18px] opacity-25 pointer-events-none" />
                )}

                {/* Jemné symetrické osi tváre */}
                {showGrid && (
                  <div className="absolute inset-0 pointer-events-none opacity-30 flex items-center justify-center">
                    <div className="w-full h-px border-t border-dashed border-[#C5A059]" />
                    <div className="h-full w-px border-l border-dashed border-[#C5A059] absolute" />
                  </div>
                )}

                {/* 2. INTERAKTÍVNE ZOBRAZENÉ BODY VPICHU (INJECTION PINS) */}
                {filteredPoints.map((pt) => {
                  const isSelected = pt.id === selectedPointId;
                  const isBotox = pt.productType === 'botox';
                  const isFiller = pt.productType === 'filler';
                  const isBio = pt.productType === 'biostimulator';

                  const badgeColor = isBotox 
                    ? 'from-blue-600 to-indigo-700 border-blue-200 text-white shadow-blue-500/30' 
                    : isFiller 
                    ? 'from-pink-500 to-rose-600 border-pink-200 text-white shadow-pink-500/30'
                    : isBio 
                    ? 'from-amber-500 to-yellow-600 border-amber-200 text-white shadow-amber-500/30'
                    : 'from-emerald-500 to-teal-600 border-emerald-200 text-white shadow-emerald-500/30';

                  return (
                    <div
                      key={pt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPointId(pt.id);
                      }}
                      style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all z-20 group/pin ${
                        isSelected ? 'scale-125 z-30' : 'hover:scale-115'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute -inset-2 rounded-full bg-[#C5A059]/50 animate-ping" />
                      )}

                      <div className={`relative px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-gradient-to-br ${badgeColor} border shadow-lg flex items-center gap-1`}>
                        <span>{pt.unitsOrVolume}{pt.unitLabel}</span>
                      </div>

                      {/* Tooltip pri prejdení myšou */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/pin:flex flex-col items-center pointer-events-none z-40">
                        <div className="bg-[#2C2A29]/95 backdrop-blur-md text-white text-[10px] px-2.5 py-1.5 rounded-xl shadow-xl whitespace-nowrap border border-white/20">
                          <p className="font-bold text-[#C5A059]">{pt.zone}</p>
                          <p className="text-gray-300">{pt.productName} ({pt.unitsOrVolume} {pt.unitLabel})</p>
                          <p className="text-[9px] text-gray-400 font-mono">LOT: {pt.lotNumber}</p>
                        </div>
                        <div className="w-1.5 h-1.5 bg-[#2C2A29] rotate-45 -mt-0.5" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* LEGENDA POD SOCHOU */}
              <div className="w-full flex items-center justify-between text-[11px] text-[#8C857B] mt-4 pt-3 border-t border-[#E8E2D9]/70">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Botox
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500" /> Kys. hyalurónová
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Biostimulátory
                  </span>
                </div>
                <span className="font-serif italic text-xs">SAY CLINIC Aesthetic Sculpture Map</span>
              </div>
            </div>
          </div>

          {/* PRAVÝ PANEL: DETAIL ZVOLENÉHO VPICHU & ZOZNAM (3 COLS) */}
          <div className="lg:col-span-3 space-y-4">
            {activePoint ? (
              <div className="rounded-3xl p-5 backdrop-blur-2xl bg-white/80 border border-white/90 shadow-md space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider">
                    Detail vpichu
                  </span>
                  <button
                    onClick={() => handleDeletePoint(activePoint.id)}
                    className="p-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Zmazať
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-[#8C857B]">Názov zóny:</label>
                    <input
                      type="text"
                      value={activePoint.zone}
                      onChange={(e) => {
                        const updated = points.map(p => p.id === activePoint.id ? { ...p, zone: e.target.value } : p);
                        setPoints(updated);
                      }}
                      className="w-full text-xs font-semibold p-2 rounded-xl bg-white border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[#8C857B]">Množstvo:</label>
                      <input
                        type="number"
                        step={activePoint.unitLabel === 'IU' ? '1' : '0.1'}
                        value={activePoint.unitsOrVolume}
                        onChange={(e) => {
                          const updated = points.map(p => p.id === activePoint.id ? { ...p, unitsOrVolume: Number(e.target.value) } : p);
                          setPoints(updated);
                        }}
                        className="w-full text-xs font-bold p-2 rounded-xl bg-white border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#8C857B]">Jednotka:</label>
                      <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-xs font-semibold text-[#8C857B]">
                        {activePoint.unitLabel}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8C857B]">Hĺbka aplikácie:</label>
                    <select
                      value={activePoint.depth}
                      onChange={(e) => {
                        const updated = points.map(p => p.id === activePoint.id ? { ...p, depth: e.target.value as any } : p);
                        setPoints(updated);
                      }}
                      className="w-full text-xs font-medium p-2 rounded-xl bg-white border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden"
                    >
                      <option value="intramuscular">Intramuskulárne (sval)</option>
                      <option value="subcutaneous">Subkutánne (podkožie)</option>
                      <option value="intradermal">Intradermálne (koža)</option>
                      <option value="supraperiosteal">Supraperiostálne (na kosť)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8C857B]">Poznámka operatéra:</label>
                    <textarea
                      rows={2}
                      value={activePoint.notes || ''}
                      onChange={(e) => {
                        const updated = points.map(p => p.id === activePoint.id ? { ...p, notes: e.target.value } : p);
                        setPoints(updated);
                      }}
                      placeholder="Technika vpichu..."
                      className="w-full text-xs p-2 rounded-xl bg-white border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden resize-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl p-6 backdrop-blur-2xl bg-white/50 border border-white/60 text-center text-xs text-[#8C857B]">
                Kliknite na ktorýkoľvek bod na soche tváre pre úpravu jeho parametrov.
              </div>
            )}

            {/* ZOZNAM VŠETKÝCH APLIKOVANÝCH BODOV */}
            <div className="rounded-3xl p-5 backdrop-blur-2xl bg-white/80 border border-white/90 shadow-sm space-y-3">
              <span className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#C5A059]" />
                Zoznam aplikácií ({points.length})
              </span>

              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {points.map((pt) => (
                  <div
                    key={pt.id}
                    onClick={() => setSelectedPointId(pt.id)}
                    className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-all ${
                      pt.id === selectedPointId
                        ? 'bg-[#2C2A29] text-white shadow-xs'
                        : 'bg-white/80 hover:bg-white text-[#2C2A29] border border-[#E8E2D9]'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <p className="font-semibold truncate">{pt.zone}</p>
                      <p className={`text-[10px] truncate ${pt.id === selectedPointId ? 'text-gray-300' : 'text-[#8C857B]'}`}>
                        {pt.productName.split(' ')[0]} ({pt.lotNumber})
                      </p>
                    </div>
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg ${
                      pt.id === selectedPointId ? 'bg-white/20 text-white' : 'bg-[#FAF8F5] text-[#2C2A29]'
                    }`}>
                      {pt.unitsOrVolume} {pt.unitLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POHĽAD: LEKÁRSKY PROTOKOL (PRE NÁHĽAD & OFICIÁLNU TLAČ A4) */}
      {viewMode === 'protocol' && (
        <div className="max-w-4xl mx-auto rounded-3xl p-8 backdrop-blur-3xl bg-white/90 border border-white shadow-xl space-y-6 print:p-0 print:border-none print:shadow-none print:bg-white">
          
          <div id="printable-a4" className="printable-document bg-white p-8 sm:p-10 border border-[#E8E2D9] rounded-2xl shadow-sm text-xs leading-relaxed space-y-6 print:border-none print:shadow-none print:p-0">
            {/* HLAVIČKA PROTOKOLU */}
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

            {/* INFORMÁCIE O PACIENTOVI & LEKÁROVI */}
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
                <p className="text-[#8C857B]">Výkon: Aplikácia estetických liečiv a výplní</p>
              </div>
            </div>

            {/* SÚHRNNÉ DÁVKOVANIE */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] text-center">
                <span className="text-[10px] text-[#8C857B] uppercase font-bold">Botulotoxín:</span>
                <p className="text-sm font-bold font-mono text-blue-600">{totalBotoxIU} IU</p>
              </div>
              <div className="p-3 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] text-center">
                <span className="text-[10px] text-[#8C857B] uppercase font-bold">Výplne / Kys. hyalurónová:</span>
                <p className="text-sm font-bold font-mono text-pink-600">{totalFillerML.toFixed(1)} ml</p>
              </div>
              <div className="p-3 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] text-center">
                <span className="text-[10px] text-[#8C857B] uppercase font-bold">Počet vpichov:</span>
                <p className="text-sm font-bold font-mono text-[#2C2A29]">{points.length} bodov</p>
              </div>
            </div>

            {/* TABUĽKA ŠARŽÍ & APLIKOVANÝCH BODOV */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2A29] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                Evidencia použitých šarží a liečiv (LOT Tracking):
              </h3>
              <div className="border border-[#E8E2D9] rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#FAF8F5] text-[#8C857B] font-bold border-b border-[#E8E2D9]">
                    <tr>
                      <th className="p-3">Zóna vpichu</th>
                      <th className="p-3">Použitý prípravok</th>
                      <th className="p-3">Šarža (LOT)</th>
                      <th className="p-3">Hĺbka</th>
                      <th className="p-3 text-right">Dávka</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D9]/60">
                    {points.map((pt, idx) => (
                      <tr key={idx} className="hover:bg-white/60">
                        <td className="p-3 font-semibold text-[#2C2A29]">{pt.zone}</td>
                        <td className="p-3 text-[#2C2A29]">{pt.productName}</td>
                        <td className="p-3 font-mono font-medium text-[#C5A059]">{pt.lotNumber}</td>
                        <td className="p-3 text-[#8C857B]">{pt.depth}</td>
                        <td className="p-3 text-right font-mono font-bold text-[#2C2A29]">
                          {pt.unitsOrVolume} {pt.unitLabel}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PODPISOVÁ ČASŤ & POUČENIE */}
            <div className="mt-12 pt-8 border-t border-[#E8E2D9] flex justify-between items-end text-[10px] text-[#8C857B]">
              <div>
                <p className="font-bold text-[#C5A059] mb-0.5">SAY CLINIC Medical Record</p>
                <p>Protokol vygenerovaný elektronickým systémom SAY CLINIC</p>
              </div>
              <div className="text-center">
                <div className="w-44 border-b border-[#2C2A29] mb-2" />
                <span className="font-bold text-[#2C2A29]">MUDr. Ján Mráz</span><br />
                Pečiatka a podpis lekára
              </div>
            </div>
          </div>

          {/* OVLÁDACIA LIŠTA PRE PROTOKOL */}
          <div className="flex items-center justify-between pt-2 border-t border-[#E8E2D9] print:hidden">
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className="text-xs text-[#8C857B] hover:text-[#2C2A29] font-medium"
            >
              ← Späť na mapu tváre
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-xs font-semibold text-[#2C2A29] shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Tlačiť čistý protokol (A4)
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
