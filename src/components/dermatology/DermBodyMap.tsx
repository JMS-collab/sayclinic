'use client';

import React, { useState, useRef, useEffect } from 'react';
import { BodyMapView, DermLesion, LesionRiskLevel } from './dermatologyTypes';
import { 
  User, 
  Smile, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  MapPin, 
  Info,
  Layers,
  Sparkles,
  Trash2,
  Check,
  Scissors,
  AlertTriangle
} from 'lucide-react';

import sculptureBodyFront from '../../assets/images/sculpture_body_front.jpg';
import sculptureBodyBack from '../../assets/images/sculpture_body_back.jpg';
import sculptureFaceBust from '../../assets/images/sculpture_front_perfect_1788381191502.jpg';

interface DermBodyMapProps {
  lesions: DermLesion[];
  activeView: BodyMapView;
  onViewChange: (view: BodyMapView) => void;
  selectedLesionIndex: number | null;
  onSelectLesion: (index: number) => void;
  onAddLesionAtCoords: (coords: { x: number; y: number; view: BodyMapView; regionName: string; initialRisk?: LesionRiskLevel }) => void;
  onUpdateLesionRisk?: (index: number, risk: LesionRiskLevel) => void;
  onRemoveLesion?: (index: number) => void;
  readOnly?: boolean;
}

interface ContextMenuState {
  clientX: number;
  clientY: number;
  mode: 'existing' | 'empty';
  lesionIndex?: number;
  coords?: { x: number; y: number; view: BodyMapView; regionName: string };
}

export function detectAnatomicalRegion(x: number, y: number, view: BodyMapView): string {
  if (view === 'face') {
    if (y < 32) {
      if (x < 36) return 'Pravý spánok (Temporálna oblasť)';
      if (x > 64) return 'Ľavý spánok (Temporálna oblasť)';
      return 'Čelo (Frontálna oblasť)';
    }
    if (y < 46) {
      if (x < 38) return 'Pravá periorbitálna oblasť';
      if (x > 62) return 'Ľavá periorbitálna oblasť';
      return 'Glabella / Koreň nosa';
    }
    if (y < 62) {
      if (x < 38) return 'Pravé líce (Malárna oblasť vpravo)';
      if (x > 62) return 'Ľavé líce (Malárna oblasť vľavo)';
      return 'Nos (Chrbát & Hrot nosa)';
    }
    if (y < 74) {
      if (x < 36) return 'Pravá mandibulárna oblasť';
      if (x > 64) return 'Ľavá mandibulárna oblasť';
      return 'Periorálna oblasť / Pery';
    }
    if (y < 85) return 'Brada (Mentálna oblasť)';
    return 'Krk & Dekolt';
  }

  if (view === 'front') {
    if (y < 15) return 'Hlava & Tvár';
    if (y < 22) {
      if (x < 38) return 'Pravé rameno (Deltoid vpravo)';
      if (x > 62) return 'Ľavé rameno (Deltoid vľavo)';
      return 'Krk & Fossa jugularis';
    }
    if (y < 36) {
      if (x < 32) return 'Pravá paža (Biceps vpravo)';
      if (x > 68) return 'Ľavá paža (Biceps vľavo)';
      if (x < 50) return 'Hrudník vpravo (Pektorálna oblasť)';
      return 'Hrudník vľavo (Pektorálna oblasť)';
    }
    if (y < 48) {
      if (x < 28) return 'Pravé predlaktie / Ruka';
      if (x > 72) return 'Ľavé predlaktie / Ruka';
      if (x < 50) return 'Brucho vpravo (Mezogastrium)';
      return 'Brucho vľavo (Mezogastrium)';
    }
    if (y < 56) {
      if (x < 24) return 'Pravá dlaň a prsty';
      if (x > 76) return 'Ľavá dlaň a prsty';
      if (x < 50) return 'Pravé slabiny / Hypogastrium';
      return 'Ľavé slabiny / Hypogastrium';
    }
    if (y < 72) {
      if (x < 50) return 'Pravé stehno (Predná strana)';
      return 'Ľavé stehno (Predná strana)';
    }
    if (y < 88) {
      if (x < 50) return 'Pravé koleno & Predkolenie';
      return 'Ľavé koleno & Predkolenie';
    }
    if (x < 50) return 'Pravé chodidlo / Priehlavok';
    return 'Ľavé chodidlo / Priehlavok';
  }

  // view === 'back'
  if (y < 15) return 'Temeno hlavy & Záhlavie';
  if (y < 22) {
    if (x < 38) return 'Pravé rameno dorzálne';
    if (x > 62) return 'Ľavé rameno dorzálne';
    return 'Šija & Krčná chrbtica (C oblasť)';
  }
  if (y < 36) {
    if (x < 32) return 'Pravá paža vzadu (Triceps)';
    if (x > 68) return 'Ľavá paža vzadu (Triceps)';
    if (x < 50) return 'Chrbát medzilopatkovo vpravo (Th oblasť)';
    return 'Chrbát medzilopatkovo vľavo (Th oblasť)';
  }
  if (y < 48) {
    if (x < 28) return 'Pravé predlaktie dorzálne';
    if (x > 72) return 'Ľavé predlaktie dorzálne';
    if (x < 50) return 'Driek paravertebrálne vpravo (L oblasť)';
    return 'Driek paravertebrálne vľavo (L oblasť)';
  }
  if (y < 58) {
    if (x < 24) return 'Chrbát pravej ruky';
    if (x > 76) return 'Chrbát ľavej ruky';
    if (x < 50) return 'Pravý gluteus / Sakrálna oblasť';
    return 'Ľavý gluteus / Sakrálna oblasť';
  }
  if (y < 74) {
    if (x < 50) return 'Pravé stehno vzadu (Hamstringy)';
    return 'Ľavé stehno vzadu (Hamstringy)';
  }
  if (y < 90) {
    if (x < 50) return 'Pravé lýtko & Achillova šľacha';
    return 'Ľavé lýtko & Achillova šľacha';
  }
  if (x < 50) return 'Pravá päta & Ploska';
  return 'Ľavá päta & Ploska';
}

export default function DermBodyMap({
  lesions,
  activeView,
  onViewChange,
  selectedLesionIndex,
  onSelectLesion,
  onAddLesionAtCoords,
  onUpdateLesionRisk,
  onRemoveLesion,
  readOnly = false
}: DermBodyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverRegion, setHoverRegion] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Zatvorenie kontextového menu pri kliknutí mimo
  useEffect(() => {
    const handleCloseMenu = () => setContextMenu(null);
    window.addEventListener('click', handleCloseMenu);
    return () => window.removeEventListener('click', handleCloseMenu);
  }, []);

  // Získanie URL obrázkov mramorovej sochy
  const getImgUrl = (importedImg: any) => {
    if (typeof importedImg === 'string') return importedImg;
    if (importedImg && typeof importedImg === 'object' && 'src' in importedImg) {
      return importedImg.src;
    }
    return '';
  };

  const currentSculptureSrc = 
    activeView === 'front' ? getImgUrl(sculptureBodyFront) :
    activeView === 'back' ? getImgUrl(sculptureBodyBack) :
    getImgUrl(sculptureFaceBust);

  // Filtrované lézie pre aktuálny pohľad
  const visibleLesionsWithIndex = lesions
    .map((lesion, index) => ({ lesion, index }))
    .filter(({ lesion }) => {
      if (!lesion.coords) return false;
      return lesion.coords.view === activeView;
    });

  // Ľavý klik na sochu -> vytvorenie bežného bodu
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly) return;
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.round(Math.max(5, Math.min(95, clickX)) * 10) / 10;
    const clampedY = Math.round(Math.max(5, Math.min(95, clickY)) * 10) / 10;

    const region = detectAnatomicalRegion(clampedX, clampedY, activeView);

    onAddLesionAtCoords({
      x: clampedX,
      y: clampedY,
      view: activeView,
      regionName: region
    });
  };

  // Pravý klik na prázdne miesto sochy -> menu s možnosťou Zelená, Žltá, Červená
  const handleContainerContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.round(Math.max(5, Math.min(95, clickX)) * 10) / 10;
    const clampedY = Math.round(Math.max(5, Math.min(95, clickY)) * 10) / 10;

    const region = detectAnatomicalRegion(clampedX, clampedY, activeView);

    setContextMenu({
      clientX: e.clientX,
      clientY: e.clientY,
      mode: 'empty',
      coords: {
        x: clampedX,
        y: clampedY,
        view: activeView,
        regionName: region
      }
    });
  };

  // Pravý klik na existujúci bod -> zmena farby (Zelená / Žltá / Červená) alebo zmazanie
  const handlePointContextMenu = (e: React.MouseEvent, index: number) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    onSelectLesion(index);

    setContextMenu({
      clientX: e.clientX,
      clientY: e.clientY,
      mode: 'existing',
      lesionIndex: index
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const curX = ((e.clientX - rect.left) / rect.width) * 100;
    const curY = ((e.clientY - rect.top) / rect.height) * 100;
    setHoverRegion(detectAnatomicalRegion(curX, curY, activeView));
  };

  const getPinColor = (risk: LesionRiskLevel | undefined) => {
    if (risk === 'high') {
      return {
        bg: 'bg-rose-600',
        border: 'border-rose-200',
        ring: 'ring-rose-500/50',
        text: 'text-white',
        pulse: 'bg-rose-500/40',
        label: 'Červená (Excízia)'
      };
    }
    if (risk === 'moderate') {
      return {
        bg: 'bg-amber-500',
        border: 'border-amber-200',
        ring: 'ring-amber-500/50',
        text: 'text-white',
        pulse: 'bg-amber-500/40',
        label: 'Žltá (Sledovať)'
      };
    }
    return {
      bg: 'bg-emerald-600',
      border: 'border-emerald-200',
      ring: 'ring-emerald-500/50',
      text: 'text-white',
      pulse: 'bg-emerald-500/40',
      label: 'Zelená (Benígne)'
    };
  };

  return (
    <div className="flex flex-col h-full bg-[#1F1E1D] border border-[#3A3835] rounded-3xl overflow-hidden shadow-xl select-none relative group/map">
      {/* 1. HLAVIČKA A PREPÍNAČ POHĽADOV SOCHY */}
      <div className="p-3 bg-[#2A2826]/90 backdrop-blur-md border-b border-[#3A3835] flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#C5A059]/20 flex items-center justify-center border border-[#C5A059]/40">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
          </div>
          <div>
            <span className="font-brand text-xs uppercase font-bold text-[#EAE2D8] tracking-wider block">
              Mramorová Socha
            </span>
            <span className="text-[9px] text-[#A69E94] font-medium">
              SAY CLINIC Anatomický model
            </span>
          </div>
        </div>

        {/* PREPÍNAČ POHĽADOV: SPREDU / ZOZADU / TVÁR */}
        <div className="flex items-center bg-[#191817] p-1 rounded-xl border border-[#3A3835]">
          <button
            type="button"
            onClick={() => onViewChange('front')}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'front'
                ? 'bg-gradient-to-r from-[#C5A059] to-[#b08d48] text-[#1A1918] shadow-sm font-extrabold'
                : 'text-[#A69E94] hover:text-[#EAE2D8]'
            }`}
          >
            <User className="w-3 h-3" />
            <span>Spredu</span>
          </button>
          <button
            type="button"
            onClick={() => onViewChange('back')}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'back'
                ? 'bg-gradient-to-r from-[#C5A059] to-[#b08d48] text-[#1A1918] shadow-sm font-extrabold'
                : 'text-[#A69E94] hover:text-[#EAE2D8]'
            }`}
          >
            <User className="w-3 h-3 rotate-180" />
            <span>Zozadu</span>
          </button>
          <button
            type="button"
            onClick={() => onViewChange('face')}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'face'
                ? 'bg-gradient-to-r from-[#C5A059] to-[#b08d48] text-[#1A1918] shadow-sm font-extrabold'
                : 'text-[#A69E94] hover:text-[#EAE2D8]'
            }`}
          >
            <Smile className="w-3 h-3" />
            <span>Tvár</span>
          </button>
        </div>
      </div>

      {/* 2. ZÓNA HOVERU (HUD BAR) */}
      <div className="px-3 py-1.5 bg-[#191817]/80 backdrop-blur-xs border-b border-[#3A3835]/60 flex items-center justify-between text-[10px] text-[#A69E94] z-10">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
          <span className="text-[#8C857B] font-medium">Lokalita:</span>
          <span className="font-bold text-[#EAE2D8] truncate">
            {hoverRegion || (activeView === 'front' ? 'Pohľad spredu (Anterior)' : activeView === 'back' ? 'Pohľad zozadu (Posterior)' : 'Detail hlavy a tváre')}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-[#C5A059] shrink-0">
          <Info className="w-3 h-3" />
          <span>Ľavý klik: pridať pin • Pravý klik: farba</span>
        </div>
      </div>

      {/* 3. HLAVNÝ INTERAKTÍVNY CANVAS S MRAMOROVOU SOCHOU */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden flex items-center justify-center p-3 bg-radial from-[#2E2C2A] via-[#1E1D1C] to-[#121110] min-h-[420px]"
      >
        {/* INTERAKTÍVNY WRAPPER SOCHY */}
        <div 
          className="relative transition-transform duration-200 cursor-crosshair rounded-2xl overflow-hidden shadow-2xl border border-[#3A3835]/50"
          style={{ 
            transform: `scale(${zoomLevel})`,
            maxHeight: activeView === 'face' ? '420px' : '460px',
            aspectRatio: activeView === 'face' ? '896/1200' : '9/16'
          }}
          onClick={handleContainerClick}
          onContextMenu={handleContainerContextMenu}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverRegion(null)}
        >
          {/* FOTOREALISTICKÝ OBRAZ MRAMOROVEJ SOCHY */}
          <img
            src={currentSculptureSrc}
            alt="Mramorová socha pacienta"
            className="w-full h-full object-cover object-center pointer-events-none select-none filter contrast-[1.03] brightness-[0.98]"
            draggable={false}
          />

          {/* JEMNÁ VINETA & MÚZEJNÉ TIEŇOVANIE */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

          {/* VYKRESLENIE OČÍSLOVANÝCH PINOV NA SOCHE (MALÉ JEMNÉ BODY) */}
          {visibleLesionsWithIndex.map(({ lesion, index }) => {
            if (!lesion.coords) return null;
            const isSelected = selectedLesionIndex === index;
            const colors = getPinColor(lesion.riskLevel);
            const badgeNumber = index + 1;

            return (
              <div
                key={lesion.id || index}
                style={{
                  left: `${lesion.coords.x}%`,
                  top: `${lesion.coords.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectLesion(index);
                }}
                onContextMenu={(e) => handlePointContextMenu(e, index)}
                className="absolute z-30 cursor-pointer group flex items-center p-1 -m-1"
                title={`#${badgeNumber}: ${lesion.location} (${lesion.sizeMm || 'rozmer neuvedený'})\nZáver: ${lesion.conclusion}\nOdporúčanie: ${lesion.recommendation}\n(Pravý klik pre zmenu farby / zmazanie)`}
              >
                {/* Malý viditeľný bod s bielou kontúrou a žiarou */}
                <div className="relative flex items-center justify-center">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${colors.bg} border-[1.5px] border-white shadow-md transition-transform duration-150 ${
                      isSelected ? 'scale-140 ring-2 ring-[#C5A059] ring-offset-1 ring-offset-black' : 'group-hover:scale-130'
                    }`}
                  />

                  {/* Pulzujúci svetelný kruh pri výbere */}
                  {isSelected && (
                    <span className={`absolute -inset-1 rounded-full ${colors.pulse} animate-ping -z-10`} />
                  )}
                </div>

                {/* Jemné miniatúrne číslo hneď vedľa bodu */}
                <span className={`ml-1 text-[8px] font-mono font-bold leading-none select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] ${
                  isSelected ? 'text-[#C5A059] scale-110 font-extrabold' : 'text-white/80 group-hover:text-white'
                }`}>
                  #{badgeNumber}
                </span>

                {/* Plávajúci popover štítok pri hoveri */}
                <div className="absolute left-1/2 -top-7 -translate-x-1/2 hidden group-hover:flex items-center gap-1.5 bg-[#141312]/95 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[8px] font-mono whitespace-nowrap shadow-xl border border-[#3A3835] pointer-events-none z-40">
                  <span className="font-bold text-[#C5A059]">#{badgeNumber}</span>
                  <span className="truncate max-w-[130px]">{lesion.location}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ZOOM OVLÁDANIE V PRAVOM DOLNOM ROHU */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1 bg-[#242220]/90 backdrop-blur-md p-1 rounded-xl border border-[#3A3835] shadow-lg z-20">
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.15, 1.8))}
            className="p-1.5 hover:bg-[#3A3835] text-[#EAE2D8] rounded-lg transition-colors cursor-pointer"
            title="Priblížiť sochu"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.15, 0.8))}
            className="p-1.5 hover:bg-[#3A3835] text-[#EAE2D8] rounded-lg transition-colors cursor-pointer"
            title="Oddialiť sochu"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            className="p-1.5 hover:bg-[#3A3835] text-[#A69E94] hover:text-[#EAE2D8] rounded-lg transition-colors cursor-pointer"
            title="Resetovať zväčšenie"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. SPODNÁ LEGENDA RIZIKA & ŠTATISTIKA NA SOCHE */}
      <div className="p-3 bg-[#242220] border-t border-[#3A3835] space-y-2 z-10">
        <div className="flex items-center justify-between text-[9px] uppercase font-bold text-[#A69E94]">
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-[#C5A059]" />
            <span>Semafor lézií na soche</span>
          </span>
          <span className="font-mono text-[#C5A059]">
            {visibleLesionsWithIndex.length} na tomto pohľade
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-[9px]">
          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-sm shadow-emerald-500/50" />
            <div className="truncate">
              <span className="font-bold block truncate">Zelená</span>
              <span className="text-[8px] text-emerald-400 font-mono">Benígne</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-200">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 shadow-sm shadow-amber-500/50" />
            <div className="truncate">
              <span className="font-bold block truncate">Žltá</span>
              <span className="text-[8px] text-amber-400 font-mono">Sledovať 3-6m</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-200">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 shadow-sm shadow-rose-500/50" />
            <div className="truncate">
              <span className="font-bold block truncate">Červená</span>
              <span className="text-[8px] text-rose-400 font-mono">Excízia</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. RIGHT-CLICK KONTEXTOVÉ MENU (ZELENÁ, ŽLTÁ, ČERVENÁ) */}
      {contextMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: Math.min(contextMenu.clientX, typeof window !== 'undefined' ? window.innerWidth - 220 : 500),
            top: Math.min(contextMenu.clientY, typeof window !== 'undefined' ? window.innerHeight - 200 : 500),
            zIndex: 100
          }}
          className="bg-[#181716]/95 backdrop-blur-xl border border-[#C5A059]/40 rounded-2xl p-2 shadow-2xl min-w-[210px] space-y-1 text-xs animate-in fade-in zoom-in-95 duration-100"
        >
          {/* HLAVIČKA MENU */}
          <div className="px-2 py-1 border-b border-[#3A3835] text-[10px] text-[#A69E94] flex items-center justify-between">
            <span className="font-bold text-[#EAE2D8] truncate">
              {contextMenu.mode === 'existing'
                ? `Lézia #${(contextMenu.lesionIndex ?? 0) + 1}`
                : `+ Nová: ${contextMenu.coords?.regionName || 'Socha'}`}
            </span>
            <span className="text-[9px] text-[#C5A059] font-mono uppercase">
              {contextMenu.mode === 'existing' ? 'Farba rizika' : 'Pridať bod'}
            </span>
          </div>

          {/* MOŽNOSŤ 1: ZELENÁ */}
          <button
            type="button"
            onClick={() => {
              if (contextMenu.mode === 'existing' && contextMenu.lesionIndex !== undefined) {
                onUpdateLesionRisk?.(contextMenu.lesionIndex, 'low');
              } else if (contextMenu.mode === 'empty' && contextMenu.coords) {
                onAddLesionAtCoords({ ...contextMenu.coords, initialRisk: 'low' });
              }
              setContextMenu(null);
            }}
            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-emerald-950/50 text-left transition-colors cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 border border-white/80 shrink-0" />
              <div>
                <span className="font-bold text-emerald-300 block text-[11px]">Zelená</span>
                <span className="text-[9px] text-emerald-400/80">Benígny névus (Norma)</span>
              </div>
            </div>
            {contextMenu.mode === 'existing' && lesions[contextMenu.lesionIndex!]?.riskLevel === 'low' && (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>

          {/* MOŽNOSŤ 2: ŽLTÁ */}
          <button
            type="button"
            onClick={() => {
              if (contextMenu.mode === 'existing' && contextMenu.lesionIndex !== undefined) {
                onUpdateLesionRisk?.(contextMenu.lesionIndex, 'moderate');
              } else if (contextMenu.mode === 'empty' && contextMenu.coords) {
                onAddLesionAtCoords({ ...contextMenu.coords, initialRisk: 'moderate' });
              }
              setContextMenu(null);
            }}
            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-amber-950/50 text-left transition-colors cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50 border border-white/80 shrink-0" />
              <div>
                <span className="font-bold text-amber-300 block text-[11px]">Žltá</span>
                <span className="text-[9px] text-amber-400/80">Sledovať o 3-6 mes.</span>
              </div>
            </div>
            {contextMenu.mode === 'existing' && lesions[contextMenu.lesionIndex!]?.riskLevel === 'moderate' && (
              <Check className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>

          {/* MOŽNOSŤ 3: ČERVENÁ */}
          <button
            type="button"
            onClick={() => {
              if (contextMenu.mode === 'existing' && contextMenu.lesionIndex !== undefined) {
                onUpdateLesionRisk?.(contextMenu.lesionIndex, 'high');
              } else if (contextMenu.mode === 'empty' && contextMenu.coords) {
                onAddLesionAtCoords({ ...contextMenu.coords, initialRisk: 'high' });
              }
              setContextMenu(null);
            }}
            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-rose-950/50 text-left transition-colors cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-600 shadow-sm shadow-rose-600/50 border border-white/80 shrink-0" />
              <div>
                <span className="font-bold text-rose-300 block text-[11px]">Červená</span>
                <span className="text-[9px] text-rose-400/80">Excízia & Histológia</span>
              </div>
            </div>
            {contextMenu.mode === 'existing' && lesions[contextMenu.lesionIndex!]?.riskLevel === 'high' && (
              <Check className="w-3.5 h-3.5 text-rose-400" />
            )}
          </button>

          {/* AKCIE PRE EXISTUJÚCI BOD: ZMAZAŤ */}
          {contextMenu.mode === 'existing' && contextMenu.lesionIndex !== undefined && onRemoveLesion && (
            <div className="pt-1 border-t border-[#3A3835]">
              <button
                type="button"
                onClick={() => {
                  onRemoveLesion(contextMenu.lesionIndex!);
                  setContextMenu(null);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-rose-950/30 text-left transition-colors cursor-pointer flex items-center gap-2 text-rose-400 hover:text-rose-300"
              >
                <Trash2 className="w-3 h-3" />
                <span className="text-[10px] font-bold">Zmazať tento bod</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
