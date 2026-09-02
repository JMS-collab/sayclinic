'use client';

import React, { useState, useRef, useCallback } from 'react';
import { 
  Undo, 
  Trash2, 
  MousePointer, 
  Move, 
  PenTool, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Check
} from 'lucide-react';

export type SculptureViewType = 'front' | 'profile_left' | 'profile_right' | 'three_quarter_left' | 'three_quarter_right';
export type DrawingToolType = 'threads' | 'fanning' | 'point' | 'freehand' | 'select';

export interface Point2D {
  x: number;
  y: number;
}

export interface Vector2DItem {
  id: string;
  type: 'threads' | 'fanning' | 'point' | 'freehand';
  view: SculptureViewType;
  color: string;
  startPoint?: Point2D;
  endPoint?: Point2D;
  points?: Point2D[]; // For freehand or polygon
  fanningRays?: Point2D[]; // For fanning lines
  zoneName: string;
  productName: string;
  lotNumber: string;
  details: string;
  createdAt: string;
}

interface Sculpture2DViewerProps {
  vectors: Vector2DItem[];
  onVectorsChange: (vectors: Vector2DItem[]) => void;
  activeTool: DrawingToolType;
  onSelectTool: (tool: DrawingToolType) => void;
  activeColor: string;
  onSelectColor: (color: string) => void;
  currentProduct?: { name: string; lot: string; type: string };
  selectedVectorId?: string | null;
  onSelectVector?: (id: string | null) => void;
  activeView?: SculptureViewType;
  onViewChange?: (view: SculptureViewType) => void;
}

export const VIEW_CONFIGS: { id: SculptureViewType; label: string; shortLabel: string; desc: string }[] = [
  { id: 'front', label: 'Čelný pohľad (En face)', shortLabel: 'Čelný', desc: 'Symetrické plánovanie čela, glately, líc, pier a brady' },
  { id: 'profile_left', label: 'Profil Ľavý (90°)', shortLabel: 'Profil Ľ', desc: 'Sánková línia, mandibulárny uhol, spánok a podbradok' },
  { id: 'profile_right', label: 'Profil Pravý (90°)', shortLabel: 'Profil P', desc: 'Sánková línia, mandibulárny uhol, spánok a podbradok' },
  { id: 'three_quarter_left', label: '3/4 Pohľad Ľavý (Oblique)', shortLabel: '3/4 Ľavý', desc: 'Zygomatický oblúk, nasolabiálna ryha a liftingový vektor' },
  { id: 'three_quarter_right', label: '3/4 Pohľad Pravý (Oblique)', shortLabel: '3/4 Pravý', desc: 'Zygomatický oblúk, nasolabiálna ryha a liftingový vektor' },
];

export function Sculpture2DViewer({
  vectors,
  onVectorsChange,
  activeTool,
  onSelectTool,
  activeColor,
  onSelectColor,
  currentProduct = { name: 'Sculptra 10ml (PLLA)', lot: 'SCL-2026-881A', type: 'biostimulator' },
  selectedVectorId = null,
  onSelectVector,
  activeView: externalView,
  onViewChange: externalOnViewChange,
}: Sculpture2DViewerProps) {
  const [internalView, setInternalView] = useState<SculptureViewType>('front');
  const currentView = externalView || internalView;
  const setCurrentView = (view: SculptureViewType) => {
    if (externalOnViewChange) externalOnViewChange(view);
    else setInternalView(view);
  };

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Zoom & Pan state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawStart, setCurrentDrawStart] = useState<Point2D | null>(null);
  const [currentDrawCurrent, setCurrentDrawCurrent] = useState<Point2D | null>(null);
  const [currentFreehandPoints, setCurrentFreehandPoints] = useState<Point2D[]>([]);

  // Hover zone detection state
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  // History for undo
  const [history, setHistory] = useState<Vector2DItem[][]>([]);

  const pushHistory = useCallback((newVectors: Vector2DItem[]) => {
    setHistory(prev => [...prev.slice(-15), vectors]);
    onVectorsChange(newVectors);
  }, [vectors, onVectorsChange]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory(prev => prev.slice(0, prev.length - 1));
    onVectorsChange(previous);
  };

  // Convert client coordinates to SVG coordinate system (0 to 600 x 0 to 750)
  const getSVGCoordinates = (clientX: number, clientY: number): Point2D | null => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 600;
    const y = ((clientY - rect.top) / rect.height) * 750;
    return { 
      x: Math.max(0, Math.min(600, x)), 
      y: Math.max(0, Math.min(750, y)) 
    };
  };

  // Anatomical zone detector for hover/tooltips based on SVG coordinates and current view
  const detectAnatomicalZone = (p: Point2D, view: SculptureViewType): string => {
    const { x, y } = p;
    if (view === 'front') {
      if (y < 210) {
        if (x > 240 && x < 360) return 'Čelo (Centrálna zóna - m. frontalis)';
        return x < 300 ? 'Čelo Ľavé (Temporálna oblasť)' : 'Čelo Pravé (Temporálna oblasť)';
      }
      if (y >= 210 && y < 270) {
        if (x > 260 && x < 340) return 'Glabela (Vráska hnevu - m. procerus / corrugator)';
        return x < 300 ? 'Obočie & Spánok Ľavý' : 'Obočie & Spánok Pravý';
      }
      if (y >= 270 && y < 350) {
        if (x > 265 && x < 335) return 'Nos - Koreň a chrbát nosa (Dorsum nasi)';
        return x < 300 ? 'Periorbitálna zóna Ľ (Vejáriky / Kruhy pod očami)' : 'Periorbitálna zóna P (Vejáriky / Kruhy pod očami)';
      }
      if (y >= 350 && y < 440) {
        if (x > 260 && x < 340) return 'Hrot nosa & Columella';
        return x < 300 ? 'Zygomatická oblasť / Líce Ľ (Vektor)' : 'Zygomatická oblasť / Líce P (Vektor)';
      }
      if (y >= 440 && y < 510) {
        if (x > 240 && x < 360) return 'Nasolabiálna ryha & Pery (Vermilion / Amorov luk)';
        return x < 300 ? 'Bukálna zóna / Líce Ľ' : 'Bukálna zóna / Líce P';
      }
      if (y >= 510 && y < 580) {
        if (x > 250 && x < 350) return 'Brada (m. mentalis) & Marionetové línie';
        return x < 300 ? 'Mandibulárna línia Ľ (Sánka - Jawline)' : 'Mandibulárna línia P (Sánka - Jawline)';
      }
      if (y >= 580 && y < 670) {
        return x > 230 && x < 370 ? 'Submentálna zóna & Podbradok (Platysma)' : x < 300 ? 'Krk Ľavý (m. sternocleidomastoideus)' : 'Krk Pravý (m. sternocleidomastoideus)';
      }
      return 'Dekolt & Klavikulárna zóna (Kľúčne kosti)';
    }

    if (view === 'profile_left' || view === 'profile_right') {
      const isLeft = view === 'profile_left';
      const side = isLeft ? 'Ľavý' : 'Pravý';
      if (y < 230) return `Spánková & Čelová oblasť (${side} profil)`;
      if (y >= 230 && y < 330) return `Zygomatický oblúk & Temporálna fascia (${side})`;
      if (y >= 330 && y < 430) return `Lícna zóna & Profil nosa (${side})`;
      if (y >= 430 && y < 510) return `Nasolabiálny uhol & Kútik úst (${side})`;
      if (y >= 510 && y < 580) return `Mandibulárny uhol (Gonion) & Sánka (${side})`;
      if (y >= 580 && y < 660) return `Cervikomentálny uhol & Platysma (${side})`;
      return `Krk & Klavikula (${side})`;
    }

    // 3/4 views
    const side34 = view === 'three_quarter_left' ? 'Ľavý' : 'Pravý';
    if (y < 230) return `Čelo & Spánok (3/4 ${side34})`;
    if (y >= 230 && y < 350) return `Zygomatická projekcia & Orbitálny okraj (3/4 ${side34})`;
    if (y >= 350 && y < 450) return `Malar fat pad & Nasolabiálna ryha (3/4 ${side34})`;
    if (y >= 450 && y < 540) return `Línia sánky & Marionetová ryha (3/4 ${side34})`;
    if (y >= 540 && y < 640) return `Podbradok & Kontúra krku (3/4 ${side34})`;
    return `Krk a dekolt (3/4 ${side34})`;
  };

  // MOUSE DOWN: Start drawing or panning
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 1 || activeTool === 'select' && e.altKey) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      return;
    }

    if (activeTool === 'select') return;

    const coords = getSVGCoordinates(e.clientX, e.clientY);
    if (!coords) return;

    setIsDrawing(true);
    setCurrentDrawStart(coords);
    setCurrentDrawCurrent(coords);

    if (activeTool === 'freehand') {
      setCurrentFreehandPoints([coords]);
    } else if (activeTool === 'point') {
      // Create single point immediately
      const zone = detectAnatomicalZone(coords, currentView);
      const newVector: Vector2DItem = {
        id: `pt_${Date.now()}`,
        type: 'point',
        view: currentView,
        color: activeColor,
        startPoint: coords,
        zoneName: zone,
        productName: currentProduct.name,
        lotNumber: currentProduct.lot,
        details: currentProduct.type === 'botox' ? '4 IU mikrovpich' : '0.1ml intradermálne',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      pushHistory([...vectors, newVector]);
      setIsDrawing(false);
      setCurrentDrawStart(null);
      setCurrentDrawCurrent(null);
    }
  };

  // MOUSE MOVE: Update current drawing or panning
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const coords = getSVGCoordinates(e.clientX, e.clientY);
    if (coords) {
      setMousePos(coords);
      setHoveredZone(detectAnatomicalZone(coords, currentView));
    }

    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
      return;
    }

    if (!isDrawing || !coords) return;

    setCurrentDrawCurrent(coords);

    if (activeTool === 'freehand') {
      setCurrentFreehandPoints(prev => [...prev, coords]);
    }
  };

  // MOUSE UP: Finish drawing
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!isDrawing || !currentDrawStart || !currentDrawCurrent) {
      setIsDrawing(false);
      setCurrentDrawStart(null);
      setCurrentDrawCurrent(null);
      return;
    }

    const dist = Math.hypot(
      currentDrawCurrent.x - currentDrawStart.x,
      currentDrawCurrent.y - currentDrawStart.y
    );

    // Minimum distance threshold
    if (dist < 10 && activeTool !== 'point' && activeTool !== 'freehand') {
      setIsDrawing(false);
      setCurrentDrawStart(null);
      setCurrentDrawCurrent(null);
      return;
    }

    const zone = detectAnatomicalZone(currentDrawStart, currentView);

    if (activeTool === 'threads') {
      const newThread: Vector2DItem = {
        id: `thr_${Date.now()}`,
        type: 'threads',
        view: currentView,
        color: activeColor,
        startPoint: currentDrawStart,
        endPoint: currentDrawCurrent,
        zoneName: `Aptos niť (${zone})`,
        productName: currentProduct.name,
        lotNumber: currentProduct.lot,
        details: `Dĺžka vektoru ~${Math.round(dist / 12)}cm • Trakcia s kotvením`,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      pushHistory([...vectors, newThread]);
    } else if (activeTool === 'fanning') {
      // Calculate 5 radiant fan rays from start to end with arc spread
      const dx = currentDrawCurrent.x - currentDrawStart.x;
      const dy = currentDrawCurrent.y - currentDrawStart.y;
      const baseAngle = Math.atan2(dy, dx);
      const fanSpread = Math.PI / 5; // 36 degrees spread

      const fanningRays: Point2D[] = [];
      const numRays = 5;
      for (let i = 0; i < numRays; i++) {
        const offsetAngle = baseAngle - fanSpread / 2 + (fanSpread / (numRays - 1)) * i;
        const rayLength = dist * (0.85 + 0.15 * Math.sin((i / (numRays - 1)) * Math.PI));
        fanningRays.push({
          x: currentDrawStart.x + Math.cos(offsetAngle) * rayLength,
          y: currentDrawStart.y + Math.sin(offsetAngle) * rayLength
        });
      }

      const newFanning: Vector2DItem = {
        id: `fan_${Date.now()}`,
        type: 'fanning',
        view: currentView,
        color: activeColor,
        startPoint: currentDrawStart,
        endPoint: currentDrawCurrent,
        fanningRays,
        zoneName: `Vejár / Fanning (${zone})`,
        productName: currentProduct.name,
        lotNumber: currentProduct.lot,
        details: 'Kanyla 25G • 5 lúčov subkutánne • Neokolagenéza',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      pushHistory([...vectors, newFanning]);
    } else if (activeTool === 'freehand' && currentFreehandPoints.length > 2) {
      const newFreehand: Vector2DItem = {
        id: `fh_${Date.now()}`,
        type: 'freehand',
        view: currentView,
        color: activeColor,
        points: currentFreehandPoints,
        zoneName: `Chirurgický nárys (${zone})`,
        productName: currentProduct.name,
        lotNumber: currentProduct.lot,
        details: 'Predoperačné zameranie a vymedzenie kontúry',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      pushHistory([...vectors, newFreehand]);
    }

    setIsDrawing(false);
    setCurrentDrawStart(null);
    setCurrentDrawCurrent(null);
    setCurrentFreehandPoints([]);
  };

  // Filter vectors belonging to current view
  const currentViewVectors = vectors.filter(v => v.view === currentView);

  // Vectors count by view
  const getVectorsCountForView = (vType: SculptureViewType) => {
    return vectors.filter(v => v.view === vType).length;
  };

  return (
    <div className="w-full flex flex-col items-center select-none">
      
      {/* 1. HORNÝ VOLIČ POHĽADOV (TABS & THUMBNAILS) */}
      <div className="w-full flex items-center justify-between gap-2 p-2 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D9] mb-4 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {VIEW_CONFIGS.map((v) => {
            const count = getVectorsCountForView(v.id);
            const isActive = currentView === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setCurrentView(v.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#2C2A29] text-white shadow-md ring-2 ring-[#C5A059]'
                    : 'bg-white hover:bg-[#F3EEE7] text-[#2C2A29] border border-[#E8E2D9]'
                }`}
                title={v.desc}
              >
                <span>{v.label}</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-[#C5A059] text-white' : 'bg-[#E8E2D9] text-[#2C2A29]'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* STATS PRE AKTUÁLNY POHĽAD */}
        <div className="flex items-center gap-2 text-xs text-[#8C857B] px-2 font-medium">
          <span className="text-[#C5A059] font-bold">● {currentViewVectors.length}</span>
          <span className="hidden sm:inline">vektorov v tomto pohľade</span>
        </div>
      </div>

      {/* 2. HLAVNÝ RÁM S 2D VÝTVARNOU SOCHOU A KRESLIACIMI NÁSTROJMI */}
      <div 
        ref={containerRef}
        className="relative w-full aspect-[4/5] max-h-[620px] bg-gradient-to-b from-[#FAF8F5] via-[#F5EFE6] to-[#ECE5DC] rounded-3xl border border-[#E8E2D9] shadow-inner overflow-hidden flex items-center justify-center"
      >
        {/* NÁSTROJOVÁ LIŠTA (FLOATING TOOLBAR) */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 p-2 bg-white/90 backdrop-blur-md rounded-2xl border border-white/80 shadow-lg">
          
          {/* VÝBER / KURZOR */}
          <button
            type="button"
            onClick={() => onSelectTool('select')}
            className={`p-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTool === 'select'
                ? 'bg-[#2C2A29] text-white shadow-xs'
                : 'hover:bg-[#FAF8F5] text-[#2C2A29]'
            }`}
            title="Výber a označenie objektov"
          >
            <MousePointer className="w-4 h-4 text-[#C5A059]" />
            <span className="hidden xl:inline font-bold">Výber</span>
          </button>

          {/* APTOS NITE (THREADS) */}
          <button
            type="button"
            onClick={() => {
              onSelectTool('threads');
              onSelectColor('#8B5CF6');
            }}
            className={`p-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTool === 'threads'
                ? 'bg-[#8B5CF6] text-white shadow-xs'
                : 'hover:bg-purple-50 text-[#2C2A29]'
            }`}
            title="Liftingové nite (Aptos/PDO) s ťahom"
          >
            <Move className="w-4 h-4 text-purple-400" />
            <span className="hidden xl:inline font-bold">Nite (Aptos)</span>
          </button>

          {/* SCULPTRA / RADIESSE VEJÁR (FANNING) */}
          <button
            type="button"
            onClick={() => {
              onSelectTool('fanning');
              onSelectColor('#C5A059');
            }}
            className={`p-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTool === 'fanning'
                ? 'bg-[#C5A059] text-white shadow-xs'
                : 'hover:bg-amber-50 text-[#2C2A29]'
            }`}
            title="Vejárovitá aplikácia kanylou (Sculptra/Radiesse)"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="hidden xl:inline font-bold">Vejár (Kanyla)</span>
          </button>

          {/* BOTOX / VÝPLŇ BOD (POINT) */}
          <button
            type="button"
            onClick={() => {
              onSelectTool('point');
              onSelectColor('#3B82F6');
            }}
            className={`p-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTool === 'point'
                ? 'bg-[#3B82F6] text-white shadow-xs'
                : 'hover:bg-blue-50 text-[#2C2A29]'
            }`}
            title="Bodový mikrovpich (Botox / Výplne)"
          >
            <span className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-[9px] font-bold text-white">●</span>
            <span className="hidden xl:inline font-bold">Bod (Botox)</span>
          </button>

          {/* VOĽNÁ RUKA / MARKER (FREEHAND) */}
          <button
            type="button"
            onClick={() => {
              onSelectTool('freehand');
              onSelectColor('#EC4899');
            }}
            className={`p-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTool === 'freehand'
                ? 'bg-[#EC4899] text-white shadow-xs'
                : 'hover:bg-pink-50 text-[#2C2A29]'
            }`}
            title="Voľná kresba / Chirurgický marker"
          >
            <PenTool className="w-4 h-4 text-pink-400" />
            <span className="hidden xl:inline font-bold">Voľná ruka</span>
          </button>

          <div className="h-px bg-[#E8E2D9] my-1" />

          {/* PALETA FARIEB */}
          <div className="flex items-center gap-1.5 p-1 justify-center">
            {[
              { color: '#8B5CF6', name: 'Fialová (Nite)' },
              { color: '#C5A059', name: 'Zlatá (Sculptra)' },
              { color: '#3B82F6', name: 'Modrá (Botox)' },
              { color: '#EC4899', name: 'Ružová (Výplň)' },
              { color: '#10B981', name: 'Zelená (Mezoterapia)' },
              { color: '#2C2A29', name: 'Tmavá (Marker)' }
            ].map(c => (
              <button
                key={c.color}
                type="button"
                onClick={() => onSelectColor(c.color)}
                style={{ backgroundColor: c.color }}
                className={`w-5 h-5 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                  activeColor === c.color ? 'scale-125 ring-2 ring-[#2C2A29] ring-offset-1' : 'hover:scale-110'
                }`}
                title={c.name}
              >
                {activeColor === c.color && <Check className="w-3 h-3 text-white" />}
              </button>
            ))}
          </div>

          <div className="h-px bg-[#E8E2D9] my-1" />

          {/* UNDO & RESET */}
          <div className="flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0}
              className="p-1.5 rounded-lg text-xs hover:bg-[#FAF8F5] text-[#8C857B] disabled:opacity-30 cursor-pointer"
              title="Krok späť (Undo)"
            >
              <Undo className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm('Naozaj chcete vyčistiť nákresy pre tento pohľad?')) {
                  pushHistory(vectors.filter(v => v.view !== currentView));
                }
              }}
              className="p-1.5 rounded-lg text-xs hover:bg-red-50 text-red-500 cursor-pointer"
              title="Vymazať nákresy aktuálneho pohľadu"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* OVLÁDANIE ZOOMU & RESET (PRAVÝ HORNÝ ROH) */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1.5 bg-white/90 backdrop-blur-md rounded-2xl border border-white/80 shadow-md">
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.25))}
            className="p-1.5 rounded-xl hover:bg-[#FAF8F5] text-[#2C2A29] cursor-pointer"
            title="Priblížiť"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-mono font-bold text-[#8C857B] w-9 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.max(0.75, prev - 0.25))}
            className="p-1.5 rounded-xl hover:bg-[#FAF8F5] text-[#2C2A29] cursor-pointer"
            title="Oddialiť"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoomLevel(1);
              setPanOffset({ x: 0, y: 0 });
            }}
            className="p-1.5 rounded-xl hover:bg-[#FAF8F5] text-[#C5A059] cursor-pointer"
            title="Resetovať mierku a centrovať"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* DETAIL DETEKOVANEJ ZÓNY (DOLNÝ PLÁVAJÚCI BADGE) */}
        {hoveredZone && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-[#2C2A29]/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-medium border border-[#C5A059]/40 shadow-xl pointer-events-none flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse" />
            <span>{hoveredZone}</span>
          </div>
        )}

        {/* 3. SVG KRESLIACE PLÁTNO SO SOCHOU */}
        <div 
          className="w-full h-full flex items-center justify-center transition-transform duration-75"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
            cursor: activeTool === 'select' ? 'default' : 'crosshair'
          }}
        >
          <svg
            ref={svgRef}
            viewBox="0 0 600 750"
            className="w-full h-full max-h-[620px] max-w-[500px] overflow-visible drop-shadow-2xl"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <defs>
              {/* Classical Porcelain Gradients & Lighting */}
              <radialGradient id="sculptureSkinFront" cx="50%" cy="40%" r="55%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="45%" stopColor="#FAF5EE" />
                <stop offset="80%" stopColor="#EFE6DA" />
                <stop offset="100%" stopColor="#DFCDBE" />
              </radialGradient>

              <linearGradient id="sculptureSkinProfile" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="50%" stopColor="#FAF5EE" />
                <stop offset="100%" stopColor="#DFCDBE" />
              </linearGradient>

              <linearGradient id="hairClassic" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#5A4E47" />
                <stop offset="100%" stopColor="#332924" />
              </linearGradient>

              <linearGradient id="pedestalGold" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#C5A059" />
                <stop offset="50%" stopColor="#F5E4B8" />
                <stop offset="100%" stopColor="#B38F46" />
              </linearGradient>

              <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* A. SCULPTURE BACKGROUND & PEDESTAL */}
            {/* Pedestal Base */}
            <g id="pedestal">
              <ellipse cx="300" cy="710" rx="190" ry="32" fill="#D5C7B7" />
              <path d="M 120 710 L 160 670 L 440 670 L 480 710 Z" fill="#EAE1D4" />
              <ellipse cx="300" cy="670" rx="140" ry="18" fill="url(#pedestalGold)" />
            </g>

            {/* B. ANATOMICAL FEMALE SCULPTURE BY VIEW */}
            {currentView === 'front' && (
              <g id="sculpture_front">
                {/* Décolleté & Clavicles & Shoulders */}
                <path
                  d="M 140 670 C 180 620, 230 600, 270 590 C 290 585, 310 585, 330 590 C 370 600, 420 620, 460 670 Z"
                  fill="url(#sculptureSkinFront)"
                  stroke="#D0BEAE"
                  strokeWidth="1.5"
                />

                {/* Clavicle bones */}
                <path d="M 180 635 Q 260 625, 290 610" stroke="#C5B2A1" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7" />
                <path d="M 420 635 Q 340 625, 310 610" stroke="#C5B2A1" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7" />
                <ellipse cx="300" cy="612" rx="12" ry="5" fill="#C5B2A1" opacity="0.4" /> {/* Suprasternal notch */}

                {/* Neck & SCM muscles */}
                <path
                  d="M 245 490 C 240 540, 230 590, 270 610 L 330 610 C 370 590, 360 540, 355 490 Z"
                  fill="url(#sculptureSkinFront)"
                  stroke="#D0BEAE"
                  strokeWidth="1.5"
                />
                {/* SCM muscle lines */}
                <path d="M 255 495 Q 265 550, 288 608" stroke="#D0BEAE" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
                <path d="M 345 495 Q 335 550, 312 608" stroke="#D0BEAE" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />

                {/* Classical Hair (Chignon frame) */}
                <path
                  d="M 170 260 C 145 150, 230 70, 300 70 C 370 70, 455 150, 430 260 C 450 340, 425 400, 410 410 C 395 310, 400 230, 370 160 C 330 110, 270 110, 230 160 C 200 230, 205 310, 190 410 C 175 400, 150 340, 170 260 Z"
                  fill="url(#hairClassic)"
                  opacity="0.95"
                />
                <ellipse cx="300" cy="80" rx="75" ry="35" fill="url(#hairClassic)" />

                {/* Ears */}
                <path d="M 192 310 C 178 320, 178 370, 195 390 C 190 365, 190 335, 192 310 Z" fill="#E8DDD0" stroke="#D0BEAE" strokeWidth="1.2" />
                <path d="M 408 310 C 422 320, 422 370, 405 390 C 410 365, 410 335, 408 310 Z" fill="#E8DDD0" stroke="#D0BEAE" strokeWidth="1.2" />

                {/* Face Contour (Harmonious Oval) */}
                <path
                  d="M 195 250 C 190 170, 235 125, 300 125 C 365 125, 410 170, 405 250 C 405 330, 400 410, 370 480 C 350 525, 325 545, 300 545 C 275 545, 250 525, 230 480 C 200 410, 195 330, 195 250 Z"
                  fill="url(#sculptureSkinFront)"
                  stroke="#C5B2A1"
                  strokeWidth="2"
                />

                {/* Cheekbone Shading (Zygoma) */}
                <path d="M 205 330 Q 240 370, 270 395" stroke="#DFCDBE" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6" />
                <path d="M 395 330 Q 360 370, 330 395" stroke="#DFCDBE" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6" />

                {/* Eyebrows */}
                <path d="M 230 260 Q 255 242, 280 252" stroke="#68584F" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                <path d="M 370 260 Q 345 242, 320 252" stroke="#68584F" strokeWidth="3.5" strokeLinecap="round" fill="none" />

                {/* Almond Eyes & Eyelids */}
                <path d="M 235 285 Q 258 272, 280 285 Q 258 296, 235 285 Z" fill="#FFFFFF" stroke="#68584F" strokeWidth="1.8" />
                <circle cx="258" cy="284" r="6.5" fill="#4B3F38" />
                <circle cx="260" cy="282" r="2" fill="#FFFFFF" />
                <path d="M 232 278 Q 258 268, 282 278" stroke="#D0BEAE" strokeWidth="1.2" fill="none" /> {/* Upper eyelid crease */}

                <path d="M 365 285 Q 342 272, 320 285 Q 342 296, 365 285 Z" fill="#FFFFFF" stroke="#68584F" strokeWidth="1.8" />
                <circle cx="342" cy="284" r="6.5" fill="#4B3F38" />
                <circle cx="340" cy="282" r="2" fill="#FFFFFF" />
                <path d="M 368 278 Q 342 268, 318 278" stroke="#D0BEAE" strokeWidth="1.2" fill="none" />

                {/* Slender Nose & Tip */}
                <path d="M 292 260 L 292 370 Q 284 380, 278 385" stroke="#C5B2A1" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                <path d="M 308 260 L 308 370 Q 316 380, 322 385" stroke="#C5B2A1" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                <path d="M 282 385 Q 300 398, 318 385" stroke="#9C8979" strokeWidth="2.2" strokeLinecap="round" fill="none" /> {/* Tip */}
                <ellipse cx="288" cy="386" rx="4" ry="2" fill="#9C8979" opacity="0.6" /> {/* Left nostril */}
                <ellipse cx="312" cy="386" rx="4" ry="2" fill="#9C8979" opacity="0.6" /> {/* Right nostril */}

                {/* Philtrum */}
                <path d="M 295 400 L 294 425" stroke="#D0BEAE" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                <path d="M 305 400 L 306 425" stroke="#D0BEAE" strokeWidth="1.2" strokeLinecap="round" fill="none" />

                {/* Feminine Lips & Cupid's Bow */}
                {/* Upper Lip */}
                <path
                  d="M 262 438 Q 285 435, 294 428 Q 300 433, 306 428 Q 315 435, 338 438 Q 300 448, 262 438 Z"
                  fill="#D9A89A"
                  stroke="#A87568"
                  strokeWidth="1.5"
                />
                {/* Lower Lip */}
                <path
                  d="M 264 439 Q 300 447, 336 439 Q 300 472, 264 439 Z"
                  fill="#E2B2A4"
                  stroke="#A87568"
                  strokeWidth="1.5"
                />

                {/* Labiomental crease & Chin */}
                <path d="M 285 488 Q 300 493, 315 488" stroke="#C5B2A1" strokeWidth="2" strokeLinecap="round" fill="none" />
                <ellipse cx="300" cy="518" rx="24" ry="14" fill="#FFFFFF" opacity="0.3" /> {/* Chin highlight */}

                {/* Nasolabial Fold Soft Indication */}
                <path d="M 276 390 Q 262 425, 252 460" stroke="#DFCDBE" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
                <path d="M 324 390 Q 338 425, 348 460" stroke="#DFCDBE" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
              </g>
            )}

            {/* C. PROFILE LEFT VIEW (90°) */}
            {currentView === 'profile_left' && (
              <g id="sculpture_profile_left">
                {/* Neck & Shoulder */}
                <path
                  d="M 360 670 C 370 590, 360 520, 350 480 L 290 540 C 280 580, 240 620, 180 670 Z"
                  fill="url(#sculptureSkinProfile)"
                  stroke="#D0BEAE"
                  strokeWidth="1.5"
                />
                <path d="M 240 635 Q 310 610, 350 625" stroke="#C5B2A1" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7" />

                {/* Classical Hair Updo (Chignon in back) */}
                <path
                  d="M 340 180 C 440 160, 480 260, 440 360 C 410 420, 360 440, 350 480 C 370 410, 380 340, 360 270 C 350 220, 320 180, 290 150 Z"
                  fill="url(#hairClassic)"
                />
                <circle cx="430" cy="280" r="55" fill="url(#hairClassic)" />

                {/* Profile Silhouette Contour (Forehead, Nose, Lips, Chin, Jawline) */}
                <path
                  d="M 290 130 C 340 130, 380 180, 380 250 C 380 330, 360 410, 335 480 C 290 530, 240 540, 210 530 C 200 525, 195 510, 205 500 C 220 485, 215 470, 190 460 C 175 450, 185 435, 205 430 C 215 425, 210 410, 180 395 C 160 380, 150 350, 190 320 C 205 305, 205 285, 200 270 C 190 230, 220 160, 290 130 Z"
                  fill="url(#sculptureSkinProfile)"
                  stroke="#C5B2A1"
                  strokeWidth="2"
                />

                {/* Ear in Profile */}
                <g transform="translate(320, 290)">
                  <path d="M 0 0 C 25 -15, 30 35, 10 55 C -5 45, -5 15, 0 0 Z" fill="#E8DDD0" stroke="#C5B2A1" strokeWidth="1.5" />
                  <path d="M 8 10 C 18 5, 20 25, 10 35" stroke="#C5B2A1" strokeWidth="1.2" fill="none" />
                </g>

                {/* Eye in Profile */}
                <path d="M 225 275 L 245 270 L 240 285 Z" fill="#FFFFFF" stroke="#68584F" strokeWidth="1.5" />
                <circle cx="232" cy="277" r="4.5" fill="#4B3F38" />
                <path d="M 215 255 Q 235 245, 255 252" stroke="#68584F" strokeWidth="3.5" strokeLinecap="round" fill="none" />

                {/* Mandibular / Jawline Ridge */}
                <path d="M 210 530 Q 280 520, 335 480" stroke="#C5B2A1" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                {/* Zygomatic Arch Line */}
                <path d="M 235 340 Q 285 330, 325 310" stroke="#DFCDBE" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
              </g>
            )}

            {/* D. PROFILE RIGHT VIEW (90°) */}
            {currentView === 'profile_right' && (
              <g id="sculpture_profile_right" transform="translate(600, 0) scale(-1, 1)">
                {/* Neck & Shoulder */}
                <path
                  d="M 360 670 C 370 590, 360 520, 350 480 L 290 540 C 280 580, 240 620, 180 670 Z"
                  fill="url(#sculptureSkinProfile)"
                  stroke="#D0BEAE"
                  strokeWidth="1.5"
                />
                <path d="M 240 635 Q 310 610, 350 625" stroke="#C5B2A1" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7" />

                {/* Classical Hair Updo */}
                <path
                  d="M 340 180 C 440 160, 480 260, 440 360 C 410 420, 360 440, 350 480 C 370 410, 380 340, 360 270 C 350 220, 320 180, 290 150 Z"
                  fill="url(#hairClassic)"
                />
                <circle cx="430" cy="280" r="55" fill="url(#hairClassic)" />

                {/* Profile Silhouette Contour */}
                <path
                  d="M 290 130 C 340 130, 380 180, 380 250 C 380 330, 360 410, 335 480 C 290 530, 240 540, 210 530 C 200 525, 195 510, 205 500 C 220 485, 215 470, 190 460 C 175 450, 185 435, 205 430 C 215 425, 210 410, 180 395 C 160 380, 150 350, 190 320 C 205 305, 205 285, 200 270 C 190 230, 220 160, 290 130 Z"
                  fill="url(#sculptureSkinProfile)"
                  stroke="#C5B2A1"
                  strokeWidth="2"
                />

                {/* Ear */}
                <g transform="translate(320, 290)">
                  <path d="M 0 0 C 25 -15, 30 35, 10 55 C -5 45, -5 15, 0 0 Z" fill="#E8DDD0" stroke="#C5B2A1" strokeWidth="1.5" />
                  <path d="M 8 10 C 18 5, 20 25, 10 35" stroke="#C5B2A1" strokeWidth="1.2" fill="none" />
                </g>

                {/* Eye */}
                <path d="M 225 275 L 245 270 L 240 285 Z" fill="#FFFFFF" stroke="#68584F" strokeWidth="1.5" />
                <circle cx="232" cy="277" r="4.5" fill="#4B3F38" />
                <path d="M 215 255 Q 235 245, 255 252" stroke="#68584F" strokeWidth="3.5" strokeLinecap="round" fill="none" />

                {/* Mandibular Ridge */}
                <path d="M 210 530 Q 280 520, 335 480" stroke="#C5B2A1" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                {/* Zygomatic Arch Line */}
                <path d="M 235 340 Q 285 330, 325 310" stroke="#DFCDBE" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
              </g>
            )}

            {/* E. 3/4 VIEW LEFT (OBLIQUE) */}
            {currentView === 'three_quarter_left' && (
              <g id="sculpture_34_left">
                {/* Neck & Shoulders */}
                <path
                  d="M 160 670 C 210 610, 280 580, 360 570 C 400 590, 440 630, 460 670 Z"
                  fill="url(#sculptureSkinProfile)"
                  stroke="#D0BEAE"
                  strokeWidth="1.5"
                />
                <path d="M 200 635 Q 290 610, 340 600" stroke="#C5B2A1" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7" />

                {/* Hair Frame */}
                <path
                  d="M 200 240 C 180 140, 270 70, 340 70 C 420 70, 470 170, 440 300 C 410 400, 380 440, 370 480 C 400 370, 400 240, 360 160 C 330 110, 280 120, 240 180 Z"
                  fill="url(#hairClassic)"
                />
                <ellipse cx="400" cy="180" rx="55" ry="40" fill="url(#hairClassic)" />

                {/* 3/4 Face Contour */}
                <path
                  d="M 220 220 C 210 160, 260 120, 330 120 C 390 120, 420 180, 410 260 C 410 330, 395 410, 360 480 C 320 535, 270 540, 240 530 C 225 500, 210 460, 230 435 C 240 425, 230 410, 210 395 C 190 380, 195 345, 225 320 C 235 305, 230 270, 220 220 Z"
                  fill="url(#sculptureSkinProfile)"
                  stroke="#C5B2A1"
                  strokeWidth="2"
                />

                {/* Ear */}
                <path d="M 388 295 C 405 305, 405 345, 390 365 C 385 345, 385 315, 388 295 Z" fill="#E8DDD0" stroke="#D0BEAE" strokeWidth="1.2" />

                {/* Left Eye (Larger) */}
                <path d="M 245 282 Q 268 270, 290 282 Q 268 293, 245 282 Z" fill="#FFFFFF" stroke="#68584F" strokeWidth="1.8" />
                <circle cx="268" cy="281" r="6" fill="#4B3F38" />
                <path d="M 240 258 Q 265 242, 290 252" stroke="#68584F" strokeWidth="3.5" strokeLinecap="round" fill="none" />

                {/* Right Eye (Perspective Oblique) */}
                <path d="M 335 282 Q 352 272, 368 282 Q 352 291, 335 282 Z" fill="#FFFFFF" stroke="#68584F" strokeWidth="1.6" />
                <circle cx="352" cy="281" r="5" fill="#4B3F38" />
                <path d="M 335 258 Q 355 248, 372 258" stroke="#68584F" strokeWidth="3" strokeLinecap="round" fill="none" />

                {/* Nose in 3/4 Projection */}
                <path d="M 296 260 L 290 365 Q 280 375, 268 380" stroke="#C5B2A1" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                <path d="M 272 380 Q 290 392, 305 382" stroke="#9C8979" strokeWidth="2" strokeLinecap="round" fill="none" />

                {/* Lips 3/4 */}
                <path d="M 252 435 Q 275 428, 290 432 Q 312 435, 325 438 Q 290 448, 252 435 Z" fill="#D9A89A" stroke="#A87568" strokeWidth="1.4" />
                <path d="M 255 437 Q 290 446, 320 439 Q 290 468, 255 437 Z" fill="#E2B2A4" stroke="#A87568" strokeWidth="1.4" />

                {/* Zygoma High Cheek Curve */}
                <path d="M 230 330 Q 270 360, 310 380" stroke="#DFCDBE" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.7" />
                {/* Mandibular line */}
                <path d="M 240 530 Q 300 520, 360 480" stroke="#C5B2A1" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              </g>
            )}

            {/* F. 3/4 VIEW RIGHT (OBLIQUE) */}
            {currentView === 'three_quarter_right' && (
              <g id="sculpture_34_right" transform="translate(600, 0) scale(-1, 1)">
                {/* Neck & Shoulders */}
                <path
                  d="M 160 670 C 210 610, 280 580, 360 570 C 400 590, 440 630, 460 670 Z"
                  fill="url(#sculptureSkinProfile)"
                  stroke="#D0BEAE"
                  strokeWidth="1.5"
                />
                <path d="M 200 635 Q 290 610, 340 600" stroke="#C5B2A1" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7" />

                {/* Hair Frame */}
                <path
                  d="M 200 240 C 180 140, 270 70, 340 70 C 420 70, 470 170, 440 300 C 410 400, 380 440, 370 480 C 400 370, 400 240, 360 160 C 330 110, 280 120, 240 180 Z"
                  fill="url(#hairClassic)"
                />
                <ellipse cx="400" cy="180" rx="55" ry="40" fill="url(#hairClassic)" />

                {/* 3/4 Face Contour */}
                <path
                  d="M 220 220 C 210 160, 260 120, 330 120 C 390 120, 420 180, 410 260 C 410 330, 395 410, 360 480 C 320 535, 270 540, 240 530 C 225 500, 210 460, 230 435 C 240 425, 230 410, 210 395 C 190 380, 195 345, 225 320 C 235 305, 230 270, 220 220 Z"
                  fill="url(#sculptureSkinProfile)"
                  stroke="#C5B2A1"
                  strokeWidth="2"
                />

                {/* Ear */}
                <path d="M 388 295 C 405 305, 405 345, 390 365 C 385 345, 385 315, 388 295 Z" fill="#E8DDD0" stroke="#D0BEAE" strokeWidth="1.2" />

                {/* Eye Left */}
                <path d="M 245 282 Q 268 270, 290 282 Q 268 293, 245 282 Z" fill="#FFFFFF" stroke="#68584F" strokeWidth="1.8" />
                <circle cx="268" cy="281" r="6" fill="#4B3F38" />
                <path d="M 240 258 Q 265 242, 290 252" stroke="#68584F" strokeWidth="3.5" strokeLinecap="round" fill="none" />

                {/* Eye Right */}
                <path d="M 335 282 Q 352 272, 368 282 Q 352 291, 335 282 Z" fill="#FFFFFF" stroke="#68584F" strokeWidth="1.6" />
                <circle cx="352" cy="281" r="5" fill="#4B3F38" />
                <path d="M 335 258 Q 355 248, 372 258" stroke="#68584F" strokeWidth="3" strokeLinecap="round" fill="none" />

                {/* Nose in 3/4 Projection */}
                <path d="M 296 260 L 290 365 Q 280 375, 268 380" stroke="#C5B2A1" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                <path d="M 272 380 Q 290 392, 305 382" stroke="#9C8979" strokeWidth="2" strokeLinecap="round" fill="none" />

                {/* Lips 3/4 */}
                <path d="M 252 435 Q 275 428, 290 432 Q 312 435, 325 438 Q 290 448, 252 435 Z" fill="#D9A89A" stroke="#A87568" strokeWidth="1.4" />
                <path d="M 255 437 Q 290 446, 320 439 Q 290 468, 255 437 Z" fill="#E2B2A4" stroke="#A87568" strokeWidth="1.4" />

                {/* Zygoma */}
                <path d="M 230 330 Q 270 360, 310 380" stroke="#DFCDBE" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.7" />
                {/* Mandibular line */}
                <path d="M 240 530 Q 300 520, 360 480" stroke="#C5B2A1" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              </g>
            )}

            {/* G. PERSISTED VECTOR DRAWINGS FOR CURRENT VIEW */}
            {currentViewVectors.map((vec) => {
              const isSelected = vec.id === selectedVectorId;

              if (vec.type === 'threads' && vec.startPoint && vec.endPoint) {
                const sx = vec.startPoint.x;
                const sy = vec.startPoint.y;
                const ex = vec.endPoint.x;
                const ey = vec.endPoint.y;
                const dx = ex - sx;
                const dy = ey - sy;
                const len = Math.hypot(dx, dy);
                const angle = Math.atan2(dy, dx);

                // Barbed chevrons along thread
                const numBarbs = Math.max(3, Math.floor(len / 30));
                const barbs: React.ReactNode[] = [];
                for (let i = 1; i < numBarbs; i++) {
                  const t = i / numBarbs;
                  const bx = sx + dx * t;
                  const by = sy + dy * t;
                  const barbAngle1 = angle + Math.PI * 0.75;
                  const barbAngle2 = angle - Math.PI * 0.75;
                  const bLen = 6;
                  barbs.push(
                    <g key={i}>
                      <line
                        x1={bx}
                        y1={by}
                        x2={bx + Math.cos(barbAngle1) * bLen}
                        y2={by + Math.sin(barbAngle1) * bLen}
                        stroke={vec.color}
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <line
                        x1={bx}
                        y1={by}
                        x2={bx + Math.cos(barbAngle2) * bLen}
                        y2={by + Math.sin(barbAngle2) * bLen}
                        stroke={vec.color}
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </g>
                  );
                }

                return (
                  <g
                    key={vec.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectVector) onSelectVector(vec.id);
                    }}
                    className="cursor-pointer group"
                  >
                    {/* Glow outline if selected */}
                    {isSelected && (
                      <line
                        x1={sx}
                        y1={sy}
                        x2={ex}
                        y2={ey}
                        stroke="#2C2A29"
                        strokeWidth="8"
                        strokeLinecap="round"
                        opacity="0.3"
                      />
                    )}
                    {/* Main thread line */}
                    <line
                      x1={sx}
                      y1={sy}
                      x2={ex}
                      y2={ey}
                      stroke={vec.color}
                      strokeWidth={isSelected ? '4.5' : '3.5'}
                      strokeLinecap="round"
                    />
                    {/* Barbs */}
                    {barbs}
                    {/* Anchor point */}
                    <circle cx={sx} cy={sy} r="6" fill="#2C2A29" stroke={vec.color} strokeWidth="2.5" />
                    {/* Direction arrow */}
                    <circle cx={ex} cy={ey} r="4" fill={vec.color} />
                  </g>
                );
              }

              if (vec.type === 'fanning' && vec.startPoint && vec.fanningRays) {
                const sx = vec.startPoint.x;
                const sy = vec.startPoint.y;

                // Fan polygon shade
                const polyPoints = [
                  `${sx},${sy}`,
                  ...vec.fanningRays.map(r => `${r.x},${r.y}`)
                ].join(' ');

                return (
                  <g
                    key={vec.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectVector) onSelectVector(vec.id);
                    }}
                    className="cursor-pointer"
                  >
                    {/* Semi-transparent fan coverage zone */}
                    <polygon
                      points={polyPoints}
                      fill={vec.color}
                      opacity={isSelected ? '0.35' : '0.22'}
                    />
                    {/* Radiant rays */}
                    {vec.fanningRays.map((r, rIdx) => (
                      <line
                        key={rIdx}
                        x1={sx}
                        y1={sy}
                        x2={r.x}
                        y2={r.y}
                        stroke={vec.color}
                        strokeWidth={isSelected ? '2.5' : '1.8'}
                        strokeLinecap="round"
                        strokeDasharray={rIdx % 2 === 0 ? 'none' : '3 2'}
                      />
                    ))}
                    {/* Insertion Point */}
                    <circle cx={sx} cy={sy} r="6.5" fill="#2C2A29" stroke={vec.color} strokeWidth="2.5" />
                  </g>
                );
              }

              if (vec.type === 'point' && vec.startPoint) {
                return (
                  <g
                    key={vec.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectVector) onSelectVector(vec.id);
                    }}
                    className="cursor-pointer"
                  >
                    {isSelected && (
                      <circle
                        cx={vec.startPoint.x}
                        cy={vec.startPoint.y}
                        r="14"
                        fill={vec.color}
                        opacity="0.3"
                      />
                    )}
                    <circle
                      cx={vec.startPoint.x}
                      cy={vec.startPoint.y}
                      r="7.5"
                      fill={vec.color}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    <circle
                      cx={vec.startPoint.x}
                      cy={vec.startPoint.y}
                      r="2.5"
                      fill="#FFFFFF"
                    />
                  </g>
                );
              }

              if (vec.type === 'freehand' && vec.points && vec.points.length > 1) {
                const pathStr = `M ${vec.points[0].x} ${vec.points[0].y} ` +
                  vec.points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');

                return (
                  <g
                    key={vec.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectVector) onSelectVector(vec.id);
                    }}
                    className="cursor-pointer"
                  >
                    <path
                      d={pathStr}
                      stroke={vec.color}
                      strokeWidth={isSelected ? '4' : '2.5'}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </g>
                );
              }

              return null;
            })}

            {/* H. ACTIVE REALTIME DRAWING PREVIEW */}
            {isDrawing && currentDrawStart && currentDrawCurrent && (
              <g id="active_drawing_preview">
                {activeTool === 'threads' && (
                  <line
                    x1={currentDrawStart.x}
                    y1={currentDrawStart.y}
                    x2={currentDrawCurrent.x}
                    y2={currentDrawCurrent.y}
                    stroke={activeColor}
                    strokeWidth="3.5"
                    strokeDasharray="6 4"
                    strokeLinecap="round"
                  />
                )}

                {activeTool === 'fanning' && (
                  <g>
                    {/* Radiant fan preview */}
                    {(() => {
                      const dx = currentDrawCurrent.x - currentDrawStart.x;
                      const dy = currentDrawCurrent.y - currentDrawStart.y;
                      const baseAngle = Math.atan2(dy, dx);
                      const dist = Math.hypot(dx, dy);
                      const fanSpread = Math.PI / 5;
                      const rays: Point2D[] = [];
                      for (let i = 0; i < 5; i++) {
                        const angle = baseAngle - fanSpread / 2 + (fanSpread / 4) * i;
                        rays.push({
                          x: currentDrawStart.x + Math.cos(angle) * dist,
                          y: currentDrawStart.y + Math.sin(angle) * dist
                        });
                      }
                      const polyPoints = [
                        `${currentDrawStart.x},${currentDrawStart.y}`,
                        ...rays.map(r => `${r.x},${r.y}`)
                      ].join(' ');
                      return (
                        <>
                          <polygon points={polyPoints} fill={activeColor} opacity="0.25" />
                          {rays.map((r, idx) => (
                            <line
                              key={idx}
                              x1={currentDrawStart.x}
                              y1={currentDrawStart.y}
                              x2={r.x}
                              y2={r.y}
                              stroke={activeColor}
                              strokeWidth="2"
                              strokeDasharray="4 2"
                            />
                          ))}
                        </>
                      );
                    })()}
                  </g>
                )}

                {activeTool === 'freehand' && currentFreehandPoints.length > 1 && (
                  <path
                    d={`M ${currentFreehandPoints[0].x} ${currentFreehandPoints[0].y} ` +
                      currentFreehandPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')}
                    stroke={activeColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                  />
                )}

                {/* Drawing start anchor */}
                <circle
                  cx={currentDrawStart.x}
                  cy={currentDrawStart.y}
                  r="6"
                  fill="#2C2A29"
                  stroke={activeColor}
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
