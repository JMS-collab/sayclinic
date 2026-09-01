'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  MapPin, 
  ShieldCheck, 
  PackageCheck, 
  Trash2, 
  Layers, 
  Printer, 
  Save, 
  User 
} from 'lucide-react';
import { Patient } from './PatientDatabase';

interface InjectionPoint {
  id: string;
  x: number; // % from left
  y: number; // % from top
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
  { id: 'glabella', name: 'Glabela (vráska hnevu)', x: 50, y: 31, defaultProduct: 'Botox Allergan 50IU', unit: 'IU', defaultQty: 20, type: 'botox' as const },
  { id: 'forehead', name: 'Čelo (horizontálne vrásky)', x: 50, y: 22, defaultProduct: 'Botox Allergan 50IU', unit: 'IU', defaultQty: 12, type: 'botox' as const },
  { id: 'crows_left', name: 'Vrásky okolo očí L', x: 32, y: 38, defaultProduct: 'Botox Allergan 50IU', unit: 'IU', defaultQty: 10, type: 'botox' as const },
  { id: 'crows_right', name: 'Vrásky okolo očí P', x: 68, y: 38, defaultProduct: 'Botox Allergan 50IU', unit: 'IU', defaultQty: 10, type: 'botox' as const },
  { id: 'bunny_lines', name: 'Bunny lines (nos)', x: 50, y: 44, defaultProduct: 'Botox Allergan 50IU', unit: 'IU', defaultQty: 6, type: 'botox' as const },
  { id: 'lips_upper', name: 'Pery - Horná pera', x: 50, y: 64, defaultProduct: 'Juvederm Volbella 1ml', unit: 'ml', defaultQty: 0.5, type: 'filler' as const },
  { id: 'lips_lower', name: 'Pery - Dolná pera', x: 50, y: 70, defaultProduct: 'Juvederm Volbella 1ml', unit: 'ml', defaultQty: 0.5, type: 'filler' as const },
  { id: 'nasolabial_l', name: 'Nasolabiálna ryha L', x: 40, y: 58, defaultProduct: 'Juvederm Volift 1ml', unit: 'ml', defaultQty: 0.5, type: 'filler' as const },
  { id: 'nasolabial_r', name: 'Nasolabiálna ryha P', x: 60, y: 58, defaultProduct: 'Juvederm Volift 1ml', unit: 'ml', defaultQty: 0.5, type: 'filler' as const },
  { id: 'cheeks_left', name: 'Lícne kosti L', x: 30, y: 49, defaultProduct: 'Juvederm Voluma 1ml', unit: 'ml', defaultQty: 1.0, type: 'filler' as const },
  { id: 'cheeks_right', name: 'Lícne kosti P', x: 70, y: 49, defaultProduct: 'Juvederm Voluma 1ml', unit: 'ml', defaultQty: 1.0, type: 'filler' as const },
  { id: 'marionette_l', name: 'Marionety L', x: 42, y: 75, defaultProduct: 'Stylage M 1ml', unit: 'ml', defaultQty: 0.4, type: 'filler' as const },
  { id: 'marionette_r', name: 'Marionety P', x: 58, y: 75, defaultProduct: 'Stylage M 1ml', unit: 'ml', defaultQty: 0.4, type: 'filler' as const },
  { id: 'jawline_l', name: 'Čeľusťová línia L', x: 28, y: 72, defaultProduct: 'Radiesse 1.5ml', unit: 'ml', defaultQty: 0.75, type: 'biostimulator' as const },
  { id: 'jawline_r', name: 'Čeľusťová línia P', x: 72, y: 72, defaultProduct: 'Radiesse 1.5ml', unit: 'ml', defaultQty: 0.75, type: 'biostimulator' as const },
  { id: 'chin', name: 'Brada (projekcia & mentalis)', x: 50, y: 84, defaultProduct: 'Juvederm Volux 1ml', unit: 'ml', defaultQty: 1.0, type: 'filler' as const },
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
  onSelectPatient 
}: { 
  patients?: Patient[]; 
  selectedPatientId?: string | null;
  onSelectPatient?: (id: string) => void;
}) {
  const currentPatient = (patients && patients.length > 0)
    ? (patients.find(p => p.id === selectedPatientId) || patients[0])
    : { id: 'P1', name: 'Mária Kováčová', birthNumber: '885512/6789', phone: '+421 905 123 456', email: 'maria.kovacova@email.sk', address: 'Banská Bystrica', dob: '12.05.1988', insurance: '24 (Dôvera)' };

  // Aktuálne zaznačené body vpichu
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
      y: 22,
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
  const [inputZoneName] = useState('Vlastná zóna');
  const [viewMode, setViewMode] = useState<'map' | 'protocol'>('map');
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [pointSeq, setPointSeq] = useState(5);
  const [protocolRecordNo] = useState('AES-928412');
  const [currentDateStr] = useState('01.09.2026');

  // Výpočet celkových spotrebovaných jednotiek
  const totalBotoxIU = points
    .filter(p => p.productType === 'botox')
    .reduce((sum, p) => sum + p.unitsOrVolume, 0);

  const totalFillerML = points
    .filter(p => p.productType === 'filler' || p.productType === 'biostimulator' || p.productType === 'meso')
    .reduce((sum, p) => sum + p.unitsOrVolume, 0);

  const activePoint = points.find(p => p.id === selectedPointId);

  // Kliknutie do tvárovej mapy pre pridanie bodu
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const material = PRESET_MATERIALS[selectedMaterialIdx];
    const newPt: InjectionPoint = {
      id: `pt_${pointSeq}`,
      x,
      y,
      zone: inputZoneName,
      productType: material.type as any,
      productName: material.name,
      lotNumber: material.lot,
      unitsOrVolume: inputQty,
      unitLabel: material.unit,
      depth: material.type === 'botox' ? 'intramuscular' : 'subcutaneous',
      notes: `Aplikácia ${inputQty} ${material.unit}`
    };

    setPoints([...points, newPt]);
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

    setPoints([...points, newPt]);
    setSelectedPointId(newPt.id);
    setPointSeq(prev => prev + 1);
  };

  const handleDeletePoint = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPoints(points.filter(p => p.id !== id));
    if (selectedPointId === id) {
      setSelectedPointId(points.length > 1 ? points[0].id : null);
    }
  };

  const handleSaveProtocol = () => {
    setIsSavedSuccess(true);
    setTimeout(() => setIsSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* HEADER: LIQUID GLASS AMBIENT CARD */}
      <div className="relative rounded-3xl p-6 backdrop-blur-3xl bg-white/70 border border-white/80 shadow-[0_8px_32px_0_rgba(197,160,89,0.08)] overflow-hidden">
        {/* Glow ambient orbs */}
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
                  Liquid Glass OS
                </span>
              </div>
              <p className="text-xs text-[#8C857B] mt-0.5">
                Presná anatomická navigácia vpichov, sledovanie šarží (LOT) a automatický odpis materiálu
              </p>
            </div>
          </div>

          {/* VOLIČ PACIENTA & AKCIE */}
          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            {patients && patients.length > 0 && (
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-[#E8E2D9] shadow-xs">
                <User className="w-4 h-4 text-[#C5A059]" />
                <select
                  value={currentPatient.id}
                  onChange={(e) => onSelectPatient && onSelectPatient(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-[#2C2A29] focus:outline-hidden cursor-pointer"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.birthNumber || p.dob})</option>
                  ))}
                </select>
              </div>
            )}

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

            <button
              onClick={handleSaveProtocol}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#C5A059] to-[#B38F46] hover:from-[#B38F46] hover:to-[#9E7B35] text-white text-xs font-semibold shadow-md shadow-[#C5A059]/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>{isSavedSuccess ? 'Uložené!' : 'Uložiť záznam'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* HLAVNÁ ČASŤ - MAPA A OVLÁDACÍ PANEL */}
      {viewMode === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ĽAVÝ PANEL: RÝCHLY VÝBER ANATOMICKÝCH ZÓN & MATERIÁLOV (3 COLS) */}
          <div className="lg:col-span-3 space-y-4">
            {/* VÝBER AKTUÁLNEHO PRÍPRAVKU ZO SKLADU */}
            <div className="rounded-3xl p-5 backdrop-blur-2xl bg-white/70 border border-white/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-[#C5A059]" />
                  Aktívny prípravok
                </span>
                <span className="text-[10px] text-[#8C857B] font-mono">LOT Sync</span>
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

              <p className="text-[10px] text-[#8C857B] bg-[#FAF8F5] p-2 rounded-xl border border-[#E8E2D9]/60">
                💡 Kliknite priamo do tvárovej mapy pre umiestnenie bodu s týmto materiálom.
              </p>
            </div>

            {/* ANATOMICKÉ RÝCHLE PREDVOĽBY */}
            <div className="rounded-3xl p-5 backdrop-blur-2xl bg-white/70 border border-white/80 shadow-sm space-y-3">
              <span className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#C5A059]" />
                Rýchle anatomické zóny
              </span>

              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
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

          {/* STREDNÝ PANEL: INTERAKTÍVNA 2D/3D VEKTOROVÁ MAPA TVÁRE (6 COLS) */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full rounded-3xl p-6 backdrop-blur-3xl bg-white/80 border border-white shadow-[0_12px_40px_0_rgba(197,160,89,0.12)] relative flex flex-col items-center">
              {/* HORNÝ ŠTATISTICKÝ SUMÁR */}
              <div className="w-full flex items-center justify-between pb-4 border-b border-[#E8E2D9]/70 mb-4 z-10">
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

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#8C857B]">
                    Počet vpichov: <strong className="text-[#2C2A29]">{points.length}</strong>
                  </span>
                  <button
                    onClick={() => setPoints([])}
                    title="Vymazať všetky body"
                    className="p-1.5 rounded-xl text-[#8C857B] hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* INTERAKTÍVNE PLÁTNO TVÁRE */}
              <div
                onClick={handleMapClick}
                className="relative w-full max-w-[420px] aspect-[1/1.18] rounded-3xl bg-gradient-to-b from-[#F5EFE6]/60 via-[#FDFBF7]/90 to-[#EFE8DC]/80 border border-[#E8E2D9] shadow-inner cursor-crosshair overflow-hidden group select-none"
              >
                {/* Jemná mriežka pre medicínsku presnosť */}
                <div className="absolute inset-0 bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

                {/* VEKTOROVÁ ANATOMICKÁ TVÁR */}
                <svg
                  viewBox="0 0 400 480"
                  className="w-full h-full object-contain pointer-events-none opacity-85"
                >
                  <defs>
                    <linearGradient id="face-skin" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="100%" stopColor="#F5ECE1" />
                    </linearGradient>
                  </defs>

                  {/* Obrys hlavy & krku */}
                  <path
                    d="M130 460 C130 380, 140 360, 150 340 C100 310, 70 240, 70 170 C70 80, 128 30, 200 30 C272 30, 330 80, 330 170 C330 240, 300 310, 250 340 C260 360, 270 380, 270 460"
                    fill="url(#face-skin)"
                    stroke="#D4C9BD"
                    strokeWidth="2.5"
                  />

                  {/* Kľúčne kosti */}
                  <path d="M120 460 Q 200 440 280 460" stroke="#D4C9BD" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />

                  {/* Uši */}
                  <ellipse cx="68" cy="190" rx="12" ry="32" fill="#F5ECE1" stroke="#D4C9BD" strokeWidth="2" />
                  <ellipse cx="332" cy="190" rx="12" ry="32" fill="#F5ECE1" stroke="#D4C9BD" strokeWidth="2" />

                  {/* Obočie */}
                  <path d="M120 140 Q 155 125 180 135" stroke="#8C857B" strokeWidth="3" strokeLinecap="round" fill="none" />
                  <path d="M220 135 Q 245 125 280 140" stroke="#8C857B" strokeWidth="3" strokeLinecap="round" fill="none" />

                  {/* Oči */}
                  <path d="M130 160 Q 155 145 175 160 Q 155 172 130 160 Z" fill="#FFFFFF" stroke="#8C857B" strokeWidth="1.5" />
                  <circle cx="152" cy="159" r="6" fill="#4A4543" />
                  <path d="M225 160 Q 245 145 270 160 Q 245 172 225 160 Z" fill="#FFFFFF" stroke="#8C857B" strokeWidth="1.5" />
                  <circle cx="248" cy="159" r="6" fill="#4A4543" />

                  {/* Nos & nozdry */}
                  <path d="M200 135 L198 215 Q 185 225 200 230 Q 215 225 202 215" stroke="#8C857B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <ellipse cx="192" cy="227" rx="3" ry="1.5" fill="#8C857B" opacity="0.4" />
                  <ellipse cx="208" cy="227" rx="3" ry="1.5" fill="#8C857B" opacity="0.4" />

                  {/* Pery */}
                  <path d="M165 265 Q 185 252 200 257 Q 215 252 235 265 Q 200 280 165 265 Z" fill="#F2D6D3" stroke="#C5A059" strokeWidth="1.5" />
                  <path d="M168 266 Q 200 274 232 266 Q 200 292 168 266 Z" fill="#E8BDBA" stroke="#C5A059" strokeWidth="1.5" />
                </svg>

                {/* VYKRESLENÉ BODY VPICHU (INJECTION PINS) */}
                {points.map((pt) => {
                  const isSelected = pt.id === selectedPointId;
                  const isBotox = pt.productType === 'botox';
                  const isFiller = pt.productType === 'filler';
                  const isBio = pt.productType === 'biostimulator';

                  const badgeColor = isBotox 
                    ? 'from-blue-500 to-indigo-600 border-blue-200 text-white' 
                    : isFiller 
                    ? 'from-pink-500 to-rose-600 border-pink-200 text-white'
                    : isBio 
                    ? 'from-amber-500 to-yellow-600 border-amber-200 text-white'
                    : 'from-emerald-500 to-teal-600 border-emerald-200 text-white';

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
                        <div className="absolute -inset-2 rounded-full bg-[#C5A059]/40 animate-ping" />
                      )}

                      <div className={`relative px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-gradient-to-br ${badgeColor} border shadow-lg flex items-center gap-1`}>
                        <span>{pt.unitsOrVolume}{pt.unitLabel}</span>
                      </div>

                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/pin:flex flex-col items-center pointer-events-none z-40">
                        <div className="bg-[#2C2A29]/95 backdrop-blur-md text-white text-[10px] px-2.5 py-1 rounded-xl shadow-xl whitespace-nowrap border border-white/20">
                          <p className="font-bold text-[#C5A059]">{pt.zone}</p>
                          <p className="text-gray-300">{pt.productName} ({pt.unitsOrVolume} {pt.unitLabel})</p>
                        </div>
                        <div className="w-1.5 h-1.5 bg-[#2C2A29] rotate-45 -mt-0.5" />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="w-full flex items-center justify-between text-[11px] text-[#8C857B] mt-4 pt-3 border-t border-[#E8E2D9]/70">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Botox
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-pink-500" /> Kyselina hyalurónová
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Biostimulátory
                  </span>
                </div>
                <span>SAY CLINIC Anatomical Atlas v2.6</span>
              </div>
            </div>
          </div>

          {/* PRAVÝ PANEL: DETAIL ZVOLENÉHO VPICHU & ZOZNAM (3 COLS) */}
          <div className="lg:col-span-3 space-y-4">
            {activePoint ? (
              <div className="rounded-3xl p-5 backdrop-blur-2xl bg-white/75 border border-white/80 shadow-md space-y-3 relative overflow-hidden">
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
                Kliknite na ktorýkoľvek bod na mape pre úpravu jeho parametrov.
              </div>
            )}

            {/* ZOZNAM VŠETKÝCH APLIKOVANÝCH BODOV */}
            <div className="rounded-3xl p-5 backdrop-blur-2xl bg-white/70 border border-white/80 shadow-sm space-y-3">
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
                        {pt.productName.split(' ')[0]}
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

      {/* POHĽAD: LEKÁRSKY PROTOKOL */}
      {viewMode === 'protocol' && (
        <div className="max-w-4xl mx-auto rounded-3xl p-8 backdrop-blur-3xl bg-white/85 border border-white shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-6">
            <div>
              <div className="text-lg font-serif font-bold tracking-widest text-[#2C2A29]">
                SAY CLINIC
              </div>
              <div className="text-[10px] uppercase tracking-widest text-[#8C857B] font-semibold">
                Protokol o aplikácii estetických liečiv a výplní
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-[#2C2A29]">Dátum: {currentDateStr}</div>
              <div className="text-[10px] text-[#8C857B]">Číslo záznamu: {protocolRecordNo}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] text-xs">
            <div>
              <p className="text-[10px] text-[#8C857B] uppercase font-bold">Pacient:</p>
              <p className="font-bold text-[#2C2A29] text-sm">{currentPatient.name}</p>
              <p className="text-[#8C857B]">Rodné číslo: {currentPatient.birthNumber || currentPatient.dob}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#8C857B] uppercase font-bold">Ošetrujúci lekár:</p>
              <p className="font-bold text-[#2C2A29] text-sm">MUDr. Ján Mráz / MUDr. Zuzana Sroková</p>
              <p className="text-[#8C857B]">SAY CLINIC Bratislava</p>
            </div>
          </div>

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

          <div className="flex items-center justify-between pt-4 border-t border-[#E8E2D9]">
            <div className="text-xs text-[#8C857B]">
              Informovaný súhlas podpísaný elektronicky dňa: {currentDateStr}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-xs font-semibold text-[#2C2A29] shadow-xs"
              >
                <Printer className="w-4 h-4" /> Tlačiť protokol
              </button>
              <button
                type="button"
                onClick={handleSaveProtocol}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2C2A29] text-white text-xs font-semibold shadow-md"
              >
                <Save className="w-4 h-4" /> Uložiť do karty pacienta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
