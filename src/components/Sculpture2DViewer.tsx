'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Undo, 
  Trash2, 
  MousePointer, 
  Hand, 
  PenTool, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Check,
  Eye,
  EyeOff,
  MoveUpRight,
  CircleDot,
  GripHorizontal,
  Minimize2,
  Maximize,
  Pin,
  PinOff,
  RotateCcw
} from 'lucide-react';

import femaleBustFront from '../assets/images/sculpture_front_perfect_1788381191502.jpg';
import femaleBustProfile from '../assets/images/sculpture_profile_perfect_1788381207260.jpg';
import femaleBustOblique from '../assets/images/sculpture_oblique_perfect_1788381223031.jpg';

export type SculptureViewType = 'front' | 'profile_left' | 'profile_right' | 'three_quarter_left' | 'three_quarter_right';
export type DrawingToolType = 'select' | 'move' | 'vector' | 'fanning' | 'point' | 'freehand' | 'threads';

export interface Point2D {
  x: number;
  y: number;
}

export interface Vector2DItem {
  id: string;
  type: 'vector' | 'threads' | 'fanning' | 'point' | 'freehand';
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
  currentProduct = { name: 'Dysport 300IU', lot: 'DYSP-4412B', type: 'botox' },
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

  // Visual Guides toggle
  const [showAnatomicalGuides, setShowAnatomicalGuides] = useState(false);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawStart, setCurrentDrawStart] = useState<Point2D | null>(null);
  const [currentDrawCurrent, setCurrentDrawCurrent] = useState<Point2D | null>(null);
  const [currentFreehandPoints, setCurrentFreehandPoints] = useState<Point2D[]>([]);

  // Hover zone detection state
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  // History for undo
  const [history, setHistory] = useState<Vector2DItem[][]>([]);

  // Draggable Floating Panels & Docking State
  const [isDocked, setIsDocked] = useState(false);
  const [toolsMinimized, setToolsMinimized] = useState(false);
  const [zoomMinimized, setZoomMinimized] = useState(false);
  const [toolPos, setToolPos] = useState({ x: 16, y: 16 });
  const [zoomPos, setZoomPos] = useState({ x: 370, y: 16 });

  // Drag tracking refs
  const toolDragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);
  const zoomDragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);
  const [isDraggingTools, setIsDraggingTools] = useState(false);
  const [isDraggingZoom, setIsDraggingZoom] = useState(false);

  // Ensure initial zoom position adapts if container width changes
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 200) {
        setZoomPos(prev => ({
          x: Math.max(16, rect.width - 150),
          y: prev.y
        }));
      }
    }
  }, []);

  const handleToolDragStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    toolDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: toolPos.x,
      initY: toolPos.y
    };
    setIsDraggingTools(true);
  };

  const handleToolDragMove = (e: React.PointerEvent) => {
    if (!toolDragRef.current || !containerRef.current) return;
    e.stopPropagation();
    const dx = e.clientX - toolDragRef.current.startX;
    const dy = e.clientY - toolDragRef.current.startY;
    const containerRect = containerRef.current.getBoundingClientRect();
    const maxX = Math.max(0, containerRect.width - 80);
    const maxY = Math.max(0, containerRect.height - 60);

    setToolPos({
      x: Math.max(8, Math.min(maxX, toolDragRef.current.initX + dx)),
      y: Math.max(8, Math.min(maxY, toolDragRef.current.initY + dy))
    });
  };

  const handleToolDragEnd = (e: React.PointerEvent) => {
    if (toolDragRef.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      toolDragRef.current = null;
      setIsDraggingTools(false);
    }
  };

  const handleZoomDragStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    zoomDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: zoomPos.x,
      initY: zoomPos.y
    };
    setIsDraggingZoom(true);
  };

  const handleZoomDragMove = (e: React.PointerEvent) => {
    if (!zoomDragRef.current || !containerRef.current) return;
    e.stopPropagation();
    const dx = e.clientX - zoomDragRef.current.startX;
    const dy = e.clientY - zoomDragRef.current.startY;
    const containerRect = containerRef.current.getBoundingClientRect();
    const maxX = Math.max(0, containerRect.width - 80);
    const maxY = Math.max(0, containerRect.height - 60);

    setZoomPos({
      x: Math.max(8, Math.min(maxX, zoomDragRef.current.initX + dx)),
      y: Math.max(8, Math.min(maxY, zoomDragRef.current.initY + dy))
    });
  };

  const handleZoomDragEnd = (e: React.PointerEvent) => {
    if (zoomDragRef.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      zoomDragRef.current = null;
      setIsDraggingZoom(false);
    }
  };

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

  // Convert client coordinates to SVG coordinate system (0 to 600 x 0 to 800)
  const getSVGCoordinates = (clientX: number, clientY: number): Point2D | null => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 600;
    const y = ((clientY - rect.top) / rect.height) * 800;
    return { 
      x: Math.max(0, Math.min(600, x)), 
      y: Math.max(0, Math.min(800, y)) 
    };
  };

  // Anatomical zone detector for hover/tooltips based on SVG coordinates and current view
  const detectAnatomicalZone = (p: Point2D, view: SculptureViewType): string => {
    const { x, y } = p;
    if (view === 'front') {
      if (y < 260) {
        if (x > 220 && x < 380) return 'Čelo (m. frontalis – Dysport/Alluzience)';
        return x < 300 ? 'Čelo Ľavé (Temporálna oblasť)' : 'Čelo Pravé (Temporálna oblasť)';
      }
      if (y >= 260 && y < 290) {
        if (x > 270 && x < 330) return 'Glabela (m. procerus / corrugator – Dysport/Alluzience)';
        return x < 300 ? 'Obočie Ľavé' : 'Obočie Pravé';
      }
      if (y >= 290 && y < 340) {
        if (x > 275 && x < 325) return 'Koreň a chrbát nosa (Dorsum nasi)';
        if (x <= 220) return 'Periorbitálna zóna Ľ (Očné vejáriky – Dysport/Alluzience)';
        if (x >= 380) return 'Periorbitálna zóna P (Očné vejáriky – Dysport/Alluzience)';
        return x < 300 ? 'Infraorbitálna zóna Ľ (Kruhy pod očami)' : 'Infraorbitálna zóna P (Kruhy pod očami)';
      }
      if (y >= 340 && y < 420) {
        if (x > 275 && x < 325) return 'Hrot nosa & Columella';
        if (x <= 235) return 'Zygoma Ľavá (Lícna kosť / BAP bod 1 / Radiesse / Sculptra)';
        if (x >= 365) return 'Zygoma Pravá (Lícna kosť / BAP bod 1 / Radiesse / Sculptra)';
        if (x < 275 && y > 380) return 'Nosová báza Ľ (Alar base / BAP bod 2)';
        if (x > 325 && y > 380) return 'Nosová báza P (Alar base / BAP bod 2)';
        return x < 300 ? 'Líce Ľ (Malar fat pad / Sculptra / Radiesse)' : 'Líce P (Malar fat pad / Sculptra / Radiesse)';
      }
      if (y >= 420 && y < 480) {
        if (x >= 255 && x <= 345) {
          if (y < 450) return 'Pery – Horná pera & Amorov luk (Restylane Kysse)';
          return 'Pery – Dolná pera & Kútiky (Restylane Kysse)';
        }
        return x < 300 ? 'Nasolabiálna ryha Ľavá' : 'Nasolabiálna ryha Pravá';
      }
      if (y >= 480 && y < 540) {
        if (x > 255 && x < 345) return 'Brada (Mentum / m. mentalis – BAP bod 4 / Restylane)';
        return x < 300 ? 'Sánka Ľavá (Jawline / Radiesse / Gonion)' : 'Sánka Pravá (Jawline / Radiesse / Gonion)';
      }
      if (y >= 540 && y < 660) {
        if (x < 225) return 'Mandibulárny uhol Ľ (Gonion – BAP bod 5 / Radiesse)';
        if (x > 375) return 'Mandibulárny uhol P (Gonion – BAP bod 5 / Radiesse)';
        return 'Submentálna zóna & Krk (Platysma / Profhilo)';
      }
      return 'Krk & Klavikulárna zóna (Kľúčne kosti)';
    }

    if (view === 'profile_left' || view === 'profile_right') {
      const isLeft = view === 'profile_left';
      const side = isLeft ? 'Ľavý' : 'Pravý';
      if (y < 260) return `Čelo a spánok (${side} profil – Dysport)`;
      if (y >= 260 && y < 290) return `Glabela a obočie (${side})`;
      if (y >= 290 && y < 350) return `Orbitálny okraj & Periorbitálne vejáriky (${side})`;
      if (y >= 350 && y < 430) return `Zygoma & Líce (${side} – Radiesse / Sculptra / Profhilo)`;
      if (y >= 430 && y < 495) return `Pery (Restylane Kysse) & Nasolabiál (${side})`;
      if (y >= 495 && y < 565) return `Mandibulárna kontúra & Brada (${side} – Radiesse Jawline)`;
      if (y >= 565 && y < 660) return `Cervikomentálny uhol & Platysma (${side})`;
      return `Krk & Dekolt (${side})`;
    }

    // 3/4 views
    const side34 = view === 'three_quarter_left' ? 'Ľavý' : 'Pravý';
    if (y < 235) return `Čelo & Spánok (3/4 ${side34} – Dysport)`;
    if (y >= 235 && y < 350) return `Zygomatická projekcia & Očný vejár (3/4 ${side34})`;
    if (y >= 350 && y < 450) return `Malar fat pad & Líce (3/4 ${side34} – Radiesse / Sculptra)`;
    if (y >= 450 && y < 540) return `Pery (Restylane Kysse) & Línia sánky (3/4 ${side34})`;
    if (y >= 540 && y < 640) return `Podbradok & Kontúra krku (3/4 ${side34})`;
    return `Krk a dekolt (3/4 ${side34})`;
  };

  // MOUSE DOWN: Start drawing or panning
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    // Left click on 'move' tool, or 'select' tool, or middle button (button 1), or holding Space/Alt/Shift -> PAN
    if (
      activeTool === 'move' || 
      activeTool === 'select' || 
      e.button === 1 || 
      e.altKey || 
      e.shiftKey
    ) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      return;
    }

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
      const isBotox = currentProduct.type === 'botox';
      const isProfhilo = currentProduct.name.toLowerCase().includes('profhilo');
      const isKysse = currentProduct.name.toLowerCase().includes('kysse');
      
      let detailStr = '0.1ml intradermálne';
      if (isBotox) detailStr = '10 Speywood U / 4 IU';
      else if (isProfhilo) detailStr = '0.2ml BAP bolus subkutánne';
      else if (isKysse) detailStr = '0.05-0.1ml výplň pier';

      const newVector: Vector2DItem = {
        id: `pt_${Date.now()}`,
        type: 'point',
        view: currentView,
        color: activeColor,
        startPoint: coords,
        zoneName: zone,
        productName: currentProduct.name,
        lotNumber: currentProduct.lot,
        details: detailStr,
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

  // MOUSE UP: Finish drawing or panning
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

    // Minimum distance threshold for lines/fanning
    if (dist < 10 && activeTool !== 'point' && activeTool !== 'freehand') {
      setIsDrawing(false);
      setCurrentDrawStart(null);
      setCurrentDrawCurrent(null);
      return;
    }

    const zone = detectAnatomicalZone(currentDrawStart, currentView);

    if (activeTool === 'vector' || activeTool === 'threads') {
      const isRadiesse = currentProduct.name.toLowerCase().includes('radiesse');
      const newVec: Vector2DItem = {
        id: `vec_${Date.now()}`,
        type: 'vector',
        view: currentView,
        color: activeColor,
        startPoint: currentDrawStart,
        endPoint: currentDrawCurrent,
        zoneName: `Kanylový vektor (${zone})`,
        productName: currentProduct.name,
        lotNumber: currentProduct.lot,
        details: isRadiesse ? 'Kanyla 25G • 0.25ml retrográdny vektor' : `Lineárna aplikácia kanylou ~${Math.round(dist / 12)}cm`,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      pushHistory([...vectors, newVec]);
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
        details: 'Kanyla 25G • 5 lúčov subkutánne • Biostimulácia',
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

  // Vectors filtered for the current view
  const currentViewVectors = vectors.filter(v => v.view === currentView);

  // Helper for image source
  const getImgSrc = (img: unknown): string => {
    if (typeof img === 'string') return img;
    if (img && typeof img === 'object' && 'src' in img) {
      return (img as { src: string }).src;
    }
    return '';
  };

  return (
    <div className="w-full flex flex-col items-center gap-3 select-none">
      
      {/* 1. PREPÍNAČ POHĽADOV (TABS) & OVLÁDANIE & DOCK TOGGLE */}
      <div className="w-full flex items-center justify-between gap-2 overflow-x-auto pb-1 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D9] shadow-xs">
          {VIEW_CONFIGS.map((v) => {
            const isActive = currentView === v.id;
            const count = vectors.filter(vec => vec.view === v.id).length;
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

        {/* ANATOMICKÁ MRIEŽKA, REŽIM OKIEN (DOCK/FLOAT) & POČET VEKTOROV */}
        <div className="flex items-center gap-2 text-xs text-[#8C857B] px-1 font-medium flex-wrap">
          {/* Prepínač: Ukotvené na boku / Plávajúce okná */}
          <button
            type="button"
            onClick={() => setIsDocked(!isDocked)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-2xs ${
              isDocked
                ? 'bg-[#2C2A29] text-[#C5A059] border border-[#C5A059]/50'
                : 'bg-white text-[#2C2A29] border border-[#E8E2D9] hover:border-[#C5A059]'
            }`}
            title={isDocked ? "Prepnúť na plávajúce okná (možnosť posúvať ťahaním)" : "Ukotviť panely na lištu mimo sochy"}
          >
            {isDocked ? <Pin className="w-3.5 h-3.5 text-[#C5A059]" /> : <PinOff className="w-3.5 h-3.5 text-[#8C857B]" />}
            <span>{isDocked ? 'Panely: Ukotvené' : 'Panely: Plávajúce (Drag & Drop)'}</span>
          </button>

          {!isDocked && (
            <button
              type="button"
              onClick={() => {
                setToolPos({ x: 16, y: 16 });
                setZoomPos({ x: 370, y: 16 });
                setToolsMinimized(false);
                setZoomMinimized(false);
              }}
              className="p-1.5 rounded-xl bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-[#8C857B] hover:text-[#2C2A29] transition-colors cursor-pointer"
              title="Resetovať pozície plávajúcich okien"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAnatomicalGuides(!showAnatomicalGuides)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
              showAnatomicalGuides 
                ? 'bg-[#C5A059] text-white' 
                : 'bg-white text-[#2C2A29] border border-[#E8E2D9] hover:border-[#C5A059]'
            }`}
            title="Zapnúť / vypnúť anatomické vodiace línie a mriežku tváre"
          >
            {showAnatomicalGuides ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Mriežka tretín</span>
          </button>
          <span className="text-[#C5A059] font-bold">● {currentViewVectors.length}</span>
          <span className="hidden sm:inline">vektorov</span>
        </div>
      </div>

      {/* DOCKED TOOLBAR (KEĎ SÚ PANELY UKOTVENÉ MIMO SOCHY) */}
      {isDocked && (
        <div className="w-full p-2.5 bg-white/95 backdrop-blur-md rounded-2xl border border-[#E8E2D9] shadow-sm flex items-center justify-between gap-3 flex-wrap">
          {/* Nástroje kreslenia */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => onSelectTool('move')}
              className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                activeTool === 'move' ? 'bg-[#2C2A29] text-white' : 'hover:bg-[#FAF8F5] text-[#2C2A29] border border-[#E8E2D9]'
              }`}
            >
              <Hand className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Ruka (Posun)</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTool('select')}
              className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                activeTool === 'select' ? 'bg-[#2C2A29] text-white' : 'hover:bg-[#FAF8F5] text-[#2C2A29] border border-[#E8E2D9]'
              }`}
            >
              <MousePointer className="w-3.5 h-3.5 text-[#8C857B]" />
              <span>Výber</span>
            </button>

            <div className="w-px h-6 bg-[#E8E2D9] mx-1" />

            <button
              type="button"
              onClick={() => {
                onSelectTool('point');
                if (currentProduct.type === 'botox') onSelectColor('#3B82F6');
                else if (currentProduct.name.toLowerCase().includes('kysse')) onSelectColor('#EC4899');
                else if (currentProduct.name.toLowerCase().includes('profhilo')) onSelectColor('#10B981');
                else onSelectColor('#3B82F6');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                activeTool === 'point' ? 'bg-[#3B82F6] text-white' : 'hover:bg-blue-50 text-[#2C2A29] border border-[#E8E2D9]'
              }`}
            >
              <CircleDot className="w-3.5 h-3.5 text-blue-400" />
              <span>Bod (Toxín/BAP)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectTool('vector');
                onSelectColor('#D97706');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                activeTool === 'vector' || activeTool === 'threads' ? 'bg-[#D97706] text-white' : 'hover:bg-amber-50 text-[#2C2A29] border border-[#E8E2D9]'
              }`}
            >
              <MoveUpRight className="w-3.5 h-3.5 text-amber-500" />
              <span>Kanyla (Vektor)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectTool('fanning');
                onSelectColor('#C5A059');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                activeTool === 'fanning' ? 'bg-[#C5A059] text-white' : 'hover:bg-amber-50 text-[#2C2A29] border border-[#E8E2D9]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Vejár (Fanning)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectTool('freehand');
                onSelectColor('#EC4899');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                activeTool === 'freehand' ? 'bg-[#EC4899] text-white' : 'hover:bg-pink-50 text-[#2C2A29] border border-[#E8E2D9]'
              }`}
            >
              <PenTool className="w-3.5 h-3.5 text-pink-400" />
              <span>Fixka</span>
            </button>
          </div>

          {/* Farby & Zoom & Akcie */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Farby */}
            <div className="flex items-center gap-1.5 p-1 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9]">
              {[
                { color: '#3B82F6', name: 'Modrá (Dysport)' },
                { color: '#EC4899', name: 'Ružová (Restylane Kysse)' },
                { color: '#10B981', name: 'Zelená (Profhilo)' },
                { color: '#D97706', name: 'Jantárová (Radiesse)' },
                { color: '#C5A059', name: 'Zlatá (Sculptra)' },
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

            <div className="w-px h-6 bg-[#E8E2D9] mx-0.5" />

            {/* Undo & Trash */}
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0}
              className="p-1.5 rounded-xl hover:bg-[#FAF8F5] text-[#8C857B] disabled:opacity-30 border border-[#E8E2D9] cursor-pointer"
              title="Krok späť"
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
              className="p-1.5 rounded-xl hover:bg-red-50 text-red-500 border border-[#E8E2D9] cursor-pointer"
              title="Vymazať nákresy aktuálneho pohľadu"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-[#E8E2D9] mx-0.5" />

            {/* Zoom */}
            <div className="flex items-center gap-1 bg-[#FAF8F5] p-0.5 rounded-xl border border-[#E8E2D9]">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.25))}
                className="p-1.5 rounded-lg hover:bg-white text-[#2C2A29] cursor-pointer"
                title="Priblížiť"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono font-bold text-[#8C857B] w-8 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(0.75, prev - 0.25))}
                className="p-1.5 rounded-lg hover:bg-white text-[#2C2A29] cursor-pointer"
                title="Oddialiť"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoomLevel(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="p-1.5 rounded-lg hover:bg-white text-[#C5A059] cursor-pointer"
                title="Centrovať"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. HLAVNÝ RÁM S 2D REALISTICKOU SOCHOU A KRESLIACIMI NÁSTROJMI */}
      <div 
        ref={containerRef}
        className="relative w-full aspect-[4/5] max-h-[620px] bg-gradient-to-b from-[#FAF8F5] via-[#F4EEE5] to-[#E9E0D4] rounded-3xl border border-[#E8E2D9] shadow-inner overflow-hidden flex items-center justify-center"
      >
        {/* DRAGGABLE FLOATING TOOLS PANEL (KEĎ NIE JE DOCKED) */}
        {!isDocked && (
          <div 
            style={{
              transform: `translate3d(${toolPos.x}px, ${toolPos.y}px, 0)`,
              touchAction: 'none'
            }}
            className={`absolute top-0 left-0 z-30 flex flex-col bg-white/95 backdrop-blur-md rounded-2xl border border-white/90 shadow-xl transition-shadow duration-150 ${
              isDraggingTools ? 'ring-2 ring-[#C5A059] shadow-2xl scale-[1.02]' : 'hover:shadow-2xl'
            }`}
          >
            {/* DRAG HEADER / GRIP HANDLE */}
            <div 
              onPointerDown={handleToolDragStart}
              onPointerMove={handleToolDragMove}
              onPointerUp={handleToolDragEnd}
              onPointerCancel={handleToolDragEnd}
              className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-[#2C2A29] to-[#3D3A38] text-white rounded-t-2xl cursor-grab active:cursor-grabbing select-none"
              title="Podržte a potiahnite pre presun okna kdekoľvek po obrazovke"
            >
              <div className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-[#F5E4B8]">
                <GripHorizontal className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>NÁSTROJE</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setToolsMinimized(!toolsMinimized);
                  }}
                  className="p-0.5 hover:bg-white/20 rounded text-gray-300 hover:text-white cursor-pointer"
                  title={toolsMinimized ? "Rozbaliť panel" : "Minimalizovať"}
                >
                  {toolsMinimized ? <Maximize className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDocked(true);
                  }}
                  className="p-0.5 hover:bg-white/20 rounded text-gray-300 hover:text-white cursor-pointer"
                  title="Ukotviť na lištu hore"
                >
                  <Pin className="w-3 h-3 text-[#C5A059]" />
                </button>
              </div>
            </div>

            {/* BODY PANELA (ROZBALENÝ) */}
            {!toolsMinimized && (
              <div className="p-2 flex flex-col gap-1.5 max-w-[170px]">
                {/* POSUN / RUKA (PAN) */}
                <button
                  type="button"
                  onClick={() => onSelectTool('move')}
                  className={`p-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer ${
                    activeTool === 'move'
                      ? 'bg-[#2C2A29] text-white shadow-xs'
                      : 'hover:bg-[#FAF8F5] text-[#2C2A29]'
                  }`}
                  title="Posun / Potiahnutie obrazu (Kliknite a ťahajte)"
                >
                  <Hand className="w-4 h-4 text-[#C5A059]" />
                  <span className="font-bold">Posun (Ruka)</span>
                </button>

                {/* VÝBER / KURZOR */}
                <button
                  type="button"
                  onClick={() => onSelectTool('select')}
                  className={`p-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer ${
                    activeTool === 'select'
                      ? 'bg-[#2C2A29] text-white shadow-xs'
                      : 'hover:bg-[#FAF8F5] text-[#2C2A29]'
                  }`}
                  title="Výber a označenie objektov / Posun plátna"
                >
                  <MousePointer className="w-4 h-4 text-[#8C857B]" />
                  <span className="font-bold">Výber</span>
                </button>

                <div className="h-px bg-[#E8E2D9] my-0.5" />

                {/* BODOVÝ VPICH / TOXÍN / VÝPLŇ PIER (POINT) */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectTool('point');
                    if (currentProduct.type === 'botox') onSelectColor('#3B82F6');
                    else if (currentProduct.name.toLowerCase().includes('kysse')) onSelectColor('#EC4899');
                    else if (currentProduct.name.toLowerCase().includes('profhilo')) onSelectColor('#10B981');
                    else onSelectColor('#3B82F6');
                  }}
                  className={`p-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer ${
                    activeTool === 'point'
                      ? 'bg-[#3B82F6] text-white shadow-xs'
                      : 'hover:bg-blue-50 text-[#2C2A29]'
                  }`}
                  title="Bodový mikrovpich (Dysport, Alluzience, Profhilo BAP, Restylane Kysse)"
                >
                  <CircleDot className="w-4 h-4 text-blue-400" />
                  <span className="font-bold">Bod (Toxín/BAP)</span>
                </button>

                {/* KANYLOVÝ VEKTOR (RADIESSE / RESTYLANE JAWLINE) */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectTool('vector');
                    onSelectColor('#D97706');
                  }}
                  className={`p-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer ${
                    activeTool === 'vector' || activeTool === 'threads'
                      ? 'bg-[#D97706] text-white shadow-xs'
                      : 'hover:bg-amber-50 text-[#2C2A29]'
                  }`}
                  title="Lineárny vektor / Kanyla (Radiesse, konturácia sánky, výplň)"
                >
                  <MoveUpRight className="w-4 h-4 text-amber-500" />
                  <span className="font-bold">Kanyla (Vektor)</span>
                </button>

                {/* VEJÁR / FANNING (SCULPTRA / RADIESSE) */}
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
                  title="Vejárovitá aplikácia kanylou (Radiesse / Sculptra biostimulácia)"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="font-bold">Vejár (Fanning)</span>
                </button>

                {/* VOĽNÁ RUKA / CHIRURGICKÝ MARKER (FREEHAND) */}
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
                  <span className="font-bold">Fixka (Kresba)</span>
                </button>

                <div className="h-px bg-[#E8E2D9] my-0.5" />

                {/* PALETA FARIEB */}
                <div className="grid grid-cols-6 gap-1 p-1 justify-items-center">
                  {[
                    { color: '#3B82F6', name: 'Modrá (Dysport / Alluzience)' },
                    { color: '#EC4899', name: 'Ružová (Restylane Kysse pery)' },
                    { color: '#10B981', name: 'Zelená (Profhilo BAP)' },
                    { color: '#D97706', name: 'Jantárová (Radiesse CaHA)' },
                    { color: '#C5A059', name: 'Zlatá (Sculptra PLLA)' },
                    { color: '#2C2A29', name: 'Tmavá (Marker)' }
                  ].map(c => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => onSelectColor(c.color)}
                      style={{ backgroundColor: c.color }}
                      className={`w-4.5 h-4.5 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                        activeColor === c.color ? 'scale-125 ring-2 ring-[#2C2A29] ring-offset-1' : 'hover:scale-110'
                      }`}
                      title={c.name}
                    >
                      {activeColor === c.color && <Check className="w-2.5 h-2.5 text-white" />}
                    </button>
                  ))}
                </div>

                <div className="h-px bg-[#E8E2D9] my-0.5" />

                {/* UNDO & RESET */}
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={history.length === 0}
                    className="p-1.5 rounded-lg text-xs hover:bg-[#FAF8F5] text-[#8C857B] disabled:opacity-30 cursor-pointer flex items-center gap-1 font-medium"
                    title="Krok späť (Undo)"
                  >
                    <Undo className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Späť</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Naozaj chcete vyčistiť nákresy pre tento pohľad?')) {
                        pushHistory(vectors.filter(v => v.view !== currentView));
                      }
                    }}
                    className="p-1.5 rounded-lg text-xs hover:bg-red-50 text-red-500 cursor-pointer flex items-center gap-1 font-medium"
                    title="Vymazať nákresy aktuálneho pohľadu"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Vymazať</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DRAGGABLE FLOATING ZOOM & VIEW CONTROLS (KEĎ NIE JE DOCKED) */}
        {!isDocked && (
          <div 
            style={{
              transform: `translate3d(${zoomPos.x}px, ${zoomPos.y}px, 0)`,
              touchAction: 'none'
            }}
            className={`absolute top-0 left-0 z-30 flex flex-col bg-white/95 backdrop-blur-md rounded-2xl border border-white/90 shadow-xl transition-shadow duration-150 ${
              isDraggingZoom ? 'ring-2 ring-[#C5A059] shadow-2xl scale-[1.02]' : 'hover:shadow-2xl'
            }`}
          >
            {/* DRAG HEADER */}
            <div 
              onPointerDown={handleZoomDragStart}
              onPointerMove={handleZoomDragMove}
              onPointerUp={handleZoomDragEnd}
              onPointerCancel={handleZoomDragEnd}
              className="flex items-center justify-between gap-1.5 px-2 py-1 bg-gradient-to-r from-[#2C2A29] to-[#3D3A38] text-white rounded-t-2xl cursor-grab active:cursor-grabbing select-none"
              title="Podržte a potiahnite pre presun"
            >
              <div className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-[#F5E4B8]">
                <GripHorizontal className="w-3 h-3 text-[#C5A059]" />
                <span>ZOOM</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomMinimized(!zoomMinimized);
                }}
                className="p-0.5 hover:bg-white/20 rounded text-gray-300 hover:text-white cursor-pointer"
                title={zoomMinimized ? "Rozbaliť lupu" : "Minimalizovať"}
              >
                {zoomMinimized ? <Maximize className="w-2.5 h-2.5" /> : <Minimize2 className="w-2.5 h-2.5" />}
              </button>
            </div>

            {!zoomMinimized && (
              <div className="p-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.25))}
                  className="p-1 rounded-lg hover:bg-[#FAF8F5] text-[#2C2A29] cursor-pointer"
                  title="Priblížiť"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono font-bold text-[#8C857B] w-8 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(0.75, prev - 0.25))}
                  className="p-1 rounded-lg hover:bg-[#FAF8F5] text-[#2C2A29] cursor-pointer"
                  title="Oddialiť"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoomLevel(1);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className="p-1 rounded-lg hover:bg-[#FAF8F5] text-[#C5A059] cursor-pointer"
                  title="Resetovať mierku a centrovať"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* INŠTRUKCIA K POSUNU */}
        <div className="absolute bottom-3 right-4 z-20 hidden md:flex items-center gap-1.5 bg-white/80 backdrop-blur-sm text-[10px] text-[#8C857B] px-3 py-1 rounded-full border border-white/90 shadow-2xs pointer-events-none">
          <Hand className="w-3 h-3 text-[#C5A059]" />
          <span>Posun obrazu: potiahnutím myšou / Ruka</span>
        </div>

        {/* DETAIL DETEKOVANEJ ZÓNY (DOLNÝ PLÁVAJÚCI BADGE) */}
        {hoveredZone && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-[#2C2A29]/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-medium border border-[#C5A059]/40 shadow-xl pointer-events-none flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse" />
            <span>{hoveredZone}</span>
          </div>
        )}

        {/* 3. SVG KRESLIACE PLÁTNO S REALISTICKOU SOCHOU */}
        <div 
          className="w-full h-full flex items-center justify-center transition-transform duration-75"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
            cursor: isPanning ? 'grabbing' : (activeTool === 'move' || activeTool === 'select') ? 'grab' : 'crosshair'
          }}
        >
          <svg
            ref={svgRef}
            viewBox="0 0 600 800"
            className="w-full h-full max-h-[660px] max-w-[500px] overflow-visible drop-shadow-2xl"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              setIsPanning(false);
              if (isDrawing) {
                setIsDrawing(false);
                setCurrentDrawStart(null);
                setCurrentDrawCurrent(null);
              }
            }}
          >
            <defs>
              {/* Soft Vignette and Marble Gradients */}
              <radialGradient id="bustVignette" cx="50%" cy="45%" r="65%">
                <stop offset="60%" stopColor="#000000" stopOpacity="0" />
                <stop offset="90%" stopColor="#2C2A29" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#2C2A29" stopOpacity="0.25" />
              </radialGradient>

              <linearGradient id="pedestalGold" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#C5A059" />
                <stop offset="50%" stopColor="#F5E4B8" />
                <stop offset="100%" stopColor="#B38F46" />
              </linearGradient>

              {/* Clip path for bust shape */}
              <clipPath id="bustRoundedClip">
                <rect x="15" y="15" width="570" height="770" rx="28" ry="28" />
              </clipPath>
            </defs>

            {/* A. FOTOREALISTICKÁ MRAMOROVÁ SOCHA PODĽA POHĽADU */}
            <g clipPath="url(#bustRoundedClip)">
              {/* 1. ČELNÝ POHĽAD (FRONT VIEW) */}
              {currentView === 'front' && (
                <image
                  href={getImgSrc(femaleBustFront)}
                  x="0"
                  y="0"
                  width="600"
                  height="800"
                  preserveAspectRatio="none"
                  className="pointer-events-none select-none transition-opacity duration-300"
                />
              )}

              {/* 2. PROFIL ĽAVÝ (PROFILE LEFT - 90°) */}
              {currentView === 'profile_left' && (
                <image
                  href={getImgSrc(femaleBustProfile)}
                  x="0"
                  y="0"
                  width="600"
                  height="800"
                  preserveAspectRatio="none"
                  className="pointer-events-none select-none transition-opacity duration-300"
                />
              )}

              {/* 3. PROFIL PRAVÝ (PROFILE RIGHT - FLIPPED) */}
              {currentView === 'profile_right' && (
                <g transform="translate(600, 0) scale(-1, 1)">
                  <image
                    href={getImgSrc(femaleBustProfile)}
                    x="0"
                    y="0"
                    width="600"
                    height="800"
                    preserveAspectRatio="none"
                    className="pointer-events-none select-none transition-opacity duration-300"
                  />
                </g>
              )}

              {/* 4. 3/4 POHĽAD ĽAVÝ (THREE QUARTER LEFT) */}
              {currentView === 'three_quarter_left' && (
                <image
                  href={getImgSrc(femaleBustOblique)}
                  x="0"
                  y="0"
                  width="600"
                  height="800"
                  preserveAspectRatio="none"
                  className="pointer-events-none select-none transition-opacity duration-300"
                />
              )}

              {/* 5. 3/4 POHĽAD PRAVÝ (THREE QUARTER RIGHT - FLIPPED) */}
              {currentView === 'three_quarter_right' && (
                <g transform="translate(600, 0) scale(-1, 1)">
                  <image
                    href={getImgSrc(femaleBustOblique)}
                    x="0"
                    y="0"
                    width="600"
                    height="800"
                    preserveAspectRatio="none"
                    className="pointer-events-none select-none transition-opacity duration-300"
                  />
                </g>
              )}

              {/* Marble Atmosphere & Subtle Vignette */}
              <rect x="0" y="0" width="600" height="800" fill="url(#bustVignette)" className="pointer-events-none" />
            </g>

            {/* B. ANATOMICKÁ MRIEŽKA & VODIACE LÍNIE (OVERLAY) */}
            {showAnatomicalGuides && (
              <g id="anatomical_guidelines" opacity="0.65" strokeDasharray="3 3" className="pointer-events-none">
                {/* Horizontal facial thirds aligned with neoclassical proportions */}
                <line x1="80" y1="210" x2="520" y2="210" stroke="#C5A059" strokeWidth="1" />
                <line x1="80" y1="280" x2="520" y2="280" stroke="#C5A059" strokeWidth="1" />
                <line x1="80" y1="440" x2="520" y2="440" stroke="#C5A059" strokeWidth="1" />
                <line x1="80" y1="465" x2="520" y2="465" stroke="#EC4899" strokeWidth="1" />
                <line x1="80" y1="515" x2="520" y2="515" stroke="#C5A059" strokeWidth="1" />

                {/* Central Symmetry Line (For front view) */}
                {currentView === 'front' && (
                  <line x1="300" y1="80" x2="300" y2="720" stroke="#3B82F6" strokeWidth="1.2" strokeDasharray="4 2" />
                )}

                {/* Aesthetic annotations */}
                <text x="35" y="206" fill="#8C857B" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Horná tretina (Čelo)</text>
                <text x="35" y="276" fill="#8C857B" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Glabela / Obočie</text>
                <text x="35" y="436" fill="#8C857B" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Báza nosa & Pery</text>
                <text x="35" y="461" fill="#EC4899" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Pery (Vermilion)</text>
                <text x="35" y="511" fill="#8C857B" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Dolná tretina (Brada / Mentum)</text>
              </g>
            )}

            {/* C. PERSISTED VECTOR DRAWINGS FOR CURRENT VIEW */}
            {currentViewVectors.map((vec, vecIndex) => {
              const isSelected = vec.id === selectedVectorId;

              // 1. Kanylový lineárny vektor (alebo staršie threads)
              if ((vec.type === 'vector' || vec.type === 'threads') && vec.startPoint && vec.endPoint) {
                const sx = vec.startPoint.x;
                const sy = vec.startPoint.y;
                const ex = vec.endPoint.x;
                const ey = vec.endPoint.y;
                const dx = ex - sx;
                const dy = ey - sy;
                const len = Math.hypot(dx, dy);
                const angle = Math.atan2(dy, dx);

                // Small directional notches along the cannula vector
                const numNotches = Math.max(2, Math.floor(len / 35));
                const notches: React.ReactNode[] = [];
                for (let i = 1; i < numNotches; i++) {
                  const t = i / numNotches;
                  const bx = sx + dx * t;
                  const by = sy + dy * t;
                  const notchAngle1 = angle + Math.PI * 0.5;
                  const notchAngle2 = angle - Math.PI * 0.5;
                  const nLen = 4;
                  notches.push(
                    <line
                      key={i}
                      x1={bx + Math.cos(notchAngle1) * nLen}
                      y1={by + Math.sin(notchAngle1) * nLen}
                      x2={bx + Math.cos(notchAngle2) * nLen}
                      y2={by + Math.sin(notchAngle2) * nLen}
                      stroke={vec.color}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
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
                    {/* Main cannula vector line */}
                    <line
                      x1={sx}
                      y1={sy}
                      x2={ex}
                      y2={ey}
                      stroke={vec.color}
                      strokeWidth={isSelected ? '4' : '3'}
                      strokeLinecap="round"
                    />
                    {/* Directional calibration notches */}
                    {notches}
                    {/* Cannula puncture hub (entry point) */}
                    <circle cx={sx} cy={sy} r="6" fill="#2C2A29" stroke={vec.color} strokeWidth="2" />
                    <circle cx={sx} cy={sy} r="2" fill="#FFFFFF" />
                    {/* Terminal tip */}
                    <circle cx={ex} cy={ey} r="4" fill={vec.color} stroke="#FFFFFF" strokeWidth="1.5" />
                  </g>
                );
              }

              // 2. Vejárovitá aplikácia (Fanning)
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
                    <circle cx={sx} cy={sy} r="2" fill="#FFFFFF" />
                  </g>
                );
              }

              // 3. Bodový mikrovpich (Dysport, Alluzience, Profhilo BAP, Restylane Kysse)
              if (vec.type === 'point' && vec.startPoint) {
                return (
                  <g
                    key={vec.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectVector) onSelectVector(vec.id);
                    }}
                    className="cursor-pointer group"
                  >
                    {/* Selection halo */}
                    {isSelected && (
                      <circle
                        cx={vec.startPoint.x}
                        cy={vec.startPoint.y}
                        r="14"
                        fill={vec.color}
                        opacity="0.35"
                      />
                    )}
                    {/* Outer ring */}
                    <circle
                      cx={vec.startPoint.x}
                      cy={vec.startPoint.y}
                      r="7.5"
                      fill={vec.color}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    {/* Center nucleus */}
                    <circle
                      cx={vec.startPoint.x}
                      cy={vec.startPoint.y}
                      r="2.5"
                      fill="#FFFFFF"
                    />
                    {/* Subtle point number badge on hover/selection */}
                    {isSelected && (
                      <text
                        x={vec.startPoint.x + 9}
                        y={vec.startPoint.y - 7}
                        fill="#2C2A29"
                        fontSize="9"
                        fontWeight="bold"
                        className="pointer-events-none"
                      >
                        #{vecIndex + 1}
                      </text>
                    )}
                  </g>
                );
              }

              // 4. Voľná ruka / Chirurgická fixka
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

            {/* D. ACTIVE REALTIME DRAWING PREVIEW */}
            {isDrawing && currentDrawStart && currentDrawCurrent && (
              <g id="active_drawing_preview">
                {(activeTool === 'vector' || activeTool === 'threads') && (
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

                      const previewPoly = [
                        `${currentDrawStart.x},${currentDrawStart.y}`,
                        ...rays.map(r => `${r.x},${r.y}`)
                      ].join(' ');

                      return (
                        <>
                          <polygon points={previewPoly} fill={activeColor} opacity="0.25" />
                          {rays.map((r, idx) => (
                            <line
                              key={idx}
                              x1={currentDrawStart.x}
                              y1={currentDrawStart.y}
                              x2={r.x}
                              y2={r.y}
                              stroke={activeColor}
                              strokeWidth="1.5"
                              strokeDasharray="4 2"
                            />
                          ))}
                        </>
                      );
                    })()}
                    <circle cx={currentDrawStart.x} cy={currentDrawStart.y} r="5" fill={activeColor} />
                  </g>
                )}

                {activeTool === 'freehand' && currentFreehandPoints.length > 1 && (
                  <path
                    d={`M ${currentFreehandPoints[0].x} ${currentFreehandPoints[0].y} ` +
                      currentFreehandPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')}
                    stroke={activeColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                )}
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
