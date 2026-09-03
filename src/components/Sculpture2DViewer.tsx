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
  Syringe,
  X,
  Package,
  Palette,
  Layers
} from 'lucide-react';

import femaleBustFront from '../assets/images/sculpture_front_perfect_1788381191502.jpg';
import femaleBustProfile from '../assets/images/sculpture_profile_perfect_1788381207260.jpg';

export type SculptureViewType = 'front' | 'profile_left' | 'profile_right';
export type DrawingToolType = 'select' | 'move' | 'vector' | 'fanning' | 'point' | 'freehand' | 'threads';

export interface AestheticProductDef {
  name: string;
  shortName: string;
  type: string;
  lot: string;
  color: string;
  defaultUnit: string;
  defaultUnits: number;
}

export const AESTHETIC_PRODUCTS: AestheticProductDef[] = [
  {
    name: 'Radiesse (+) 1.5ml (CaHA Vektoring & Lifting)',
    shortName: 'Radiesse (+) 1.5ml',
    type: 'biostimulator',
    lot: 'RAD-150-332',
    color: '#D97706',
    defaultUnit: 'ml',
    defaultUnits: 0.3
  },
  {
    name: 'Sculptra 10ml (PLLA Neokolagenéza)',
    shortName: 'Sculptra 10ml',
    type: 'biostimulator',
    lot: 'SCL-2026-881A',
    color: '#C5A059',
    defaultUnit: 'ml',
    defaultUnits: 0.5
  },
  {
    name: 'Restylane Kysse 1ml (Pery & Periorál)',
    shortName: 'Restylane Kysse 1ml',
    type: 'filler',
    lot: 'RST-KYS-993A',
    color: '#EC4899',
    defaultUnit: 'ml',
    defaultUnits: 0.1
  },
  {
    name: 'Juvederm Voluma 1ml (Zygoma & Brada)',
    shortName: 'Juvederm Voluma 1ml',
    type: 'filler',
    lot: 'JUV-VOL-8812',
    color: '#EC4899',
    defaultUnit: 'ml',
    defaultUnits: 0.2
  },
  {
    name: 'Juvederm Volift 1ml (Nasolabiál & Vrásky)',
    shortName: 'Juvederm Volift 1ml',
    type: 'filler',
    lot: 'JUV-VFT-1102',
    color: '#EC4899',
    defaultUnit: 'ml',
    defaultUnits: 0.2
  },
  {
    name: 'Profhilo H+L 2ml (Bioremodelácia BAP)',
    shortName: 'Profhilo H+L 2ml',
    type: 'meso',
    lot: 'PRO-2ML-881',
    color: '#10B981',
    defaultUnit: 'ml',
    defaultUnits: 0.2
  },
  {
    name: 'Dysport 300IU (Botulotoxín A)',
    shortName: 'Dysport 300IU',
    type: 'botox',
    lot: 'DYSP-4412B',
    color: '#3B82F6',
    defaultUnit: 'Speywood',
    defaultUnits: 10
  },
  {
    name: 'Alluzience 200U (Ready-to-use neurotoxín)',
    shortName: 'Alluzience 200U',
    type: 'botox',
    lot: 'ALL-2026-771',
    color: '#3B82F6',
    defaultUnit: 'Speywood',
    defaultUnits: 10
  },
  {
    name: 'Botox / Vistabel 50-100U',
    shortName: 'Botox / Vistabel',
    type: 'botox',
    lot: 'BTX-2026-091',
    color: '#3B82F6',
    defaultUnit: 'IU',
    defaultUnits: 4
  },
  {
    name: 'Aptos / Nite (Liftingové mezonite)',
    shortName: 'Aptos / Nite',
    type: 'threads',
    lot: 'APT-2026-551',
    color: '#8B5CF6',
    defaultUnit: 'nití',
    defaultUnits: 2
  },
  {
    name: 'Chirurgický marker / Voľný nákres',
    shortName: 'Marker',
    type: 'freehand',
    lot: 'CH-MARK-01',
    color: '#2C2A29',
    defaultUnit: 'ml',
    defaultUnits: 0.1
  }
];

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
  units?: number;
  unitsUnit?: string;
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

  // DRAGGING EXISTING POINTS / VECTORS
  interface DraggedPointState {
    vectorId: string;
    handle: 'point' | 'start' | 'end';
    startClientX: number;
    startClientY: number;
    initPos: Point2D;
    hasMoved: boolean;
  }
  const [draggedPoint, setDraggedPoint] = useState<DraggedPointState | null>(null);
  const draggedPointRef = useRef<DraggedPointState | null>(null);

  // QUICK UNITS & PRODUCT CONTEXT MENU (RIGHT CLICK)
  interface UnitsPopoverState {
    vectorId: string;
    x: number;
    y: number;
    units: number;
    unitType: string;
    productName: string;
    lotNumber: string;
    color: string;
    note: string;
  }
  const [unitsPopover, setUnitsPopover] = useState<UnitsPopoverState | null>(null);

  // MOUSE WHEEL ZOOM (PRI PRECHODE MYŠOU NAD OBRAZOM SOCHY)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Zabránenie posunu stránky prehliadača pri rolovaní myšou nad plátnom sochy
      e.preventDefault();

      // Zjemnené, plynulé krokovanie kolieskom myši
      // Normalizácia deltaMode (riadky vs pixely) a jemný koeficient zoomu pre komfortné prehliadanie detailov tváre
      const rawDelta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      const clampedDelta = Math.max(-60, Math.min(60, rawDelta));
      const zoomFactor = 1 - (clampedDelta * 0.0006);

      setZoomLevel(prev => {
        const next = Math.max(0.65, Math.min(3.2, Math.round(prev * zoomFactor * 1000) / 1000));
        return next;
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // TOAST FEEDBACK
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // KEYBOARD DELETE / BACKSPACE HANDLER
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedVectorId) {
          e.preventDefault();
          const target = vectors.find(v => v.id === selectedVectorId);
          const updated = vectors.filter(v => v.id !== selectedVectorId);
          pushHistory(updated);
          if (onSelectVector) onSelectVector(null);
          setUnitsPopover(null);
          setToastMsg(`Bod "${target?.zoneName || 'Bod'}" bol vymazaný [Delete]`);
          setTimeout(() => setToastMsg(null), 2500);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedVectorId, vectors, pushHistory, onSelectVector]);

  // Global mouse release for dragged points (even if cursor leaves SVG)
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (draggedPointRef.current) {
        if (draggedPointRef.current.hasMoved) {
          pushHistory(vectors);
          setToastMsg('Bod bol presunutý');
          setTimeout(() => setToastMsg(null), 2000);
        }
        draggedPointRef.current = null;
        setDraggedPoint(null);
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [vectors, pushHistory]);

  // Drag start for existing point or cannula handle
  const handlePointMouseDown = (
    e: React.MouseEvent,
    vectorId: string,
    handle: 'point' | 'start' | 'end'
  ) => {
    if (e.button === 0) { // Left click
      e.stopPropagation();
      if (onSelectVector) onSelectVector(vectorId);

      const vec = vectors.find(v => v.id === vectorId);
      if (!vec) return;
      const targetPoint = handle === 'end' ? vec.endPoint : vec.startPoint;
      if (!targetPoint) return;

      const dragInfo: DraggedPointState = {
        vectorId,
        handle,
        startClientX: e.clientX,
        startClientY: e.clientY,
        initPos: { ...targetPoint },
        hasMoved: false
      };
      draggedPointRef.current = dragInfo;
      setDraggedPoint(dragInfo);
    }
  };

  // Right click context menu on point, cannula vector, or fanning
  const handlePointContextMenu = (e: React.MouseEvent, vec: Vector2DItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSelectVector) onSelectVector(vec.id);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const popWidth = 320;
      const popHeight = 460;
      const posX = Math.max(8, Math.min(rect.width - popWidth - 8, clickX - 160));
      const posY = Math.max(8, Math.min(rect.height - popHeight - 8, clickY - 20));

      let initialUnits = vec.units;
      let initialUnitType = vec.unitsUnit;

      if (initialUnits === undefined || initialUnits === null) {
        const match = vec.details?.match(/([0-9]+(?:\.[0-9]+)?)\s*(Speywood|IU|U|ml|nití)/i);
        if (match) {
          initialUnits = parseFloat(match[1]);
          initialUnitType = match[2];
        } else {
          const isDysport = vec.productName.toLowerCase().includes('dysport');
          const isBotox = vec.productName.toLowerCase().includes('botox') || vec.productName.toLowerCase().includes('alluzience');
          const isThreads = vec.type === 'threads' || vec.productName.toLowerCase().includes('nite') || vec.productName.toLowerCase().includes('aptos');
          const isFanning = vec.type === 'fanning';
          
          if (isDysport) {
            initialUnits = 10;
            initialUnitType = 'Speywood';
          } else if (isBotox) {
            initialUnits = 4;
            initialUnitType = 'IU';
          } else if (isThreads) {
            initialUnits = 2;
            initialUnitType = 'nití';
          } else if (isFanning) {
            initialUnits = 0.5;
            initialUnitType = 'ml';
          } else {
            initialUnits = vec.type === 'vector' ? 0.3 : 0.1;
            initialUnitType = 'ml';
          }
        }
      }

      if (!initialUnitType) {
        initialUnitType = (vec.type === 'point' && vec.productName.toLowerCase().includes('dysport')) ? 'Speywood' : 'ml';
      }

      setUnitsPopover({
        vectorId: vec.id,
        x: posX,
        y: posY,
        units: initialUnits,
        unitType: initialUnitType,
        productName: vec.productName || currentProduct.name,
        lotNumber: vec.lotNumber || currentProduct.lot,
        color: vec.color,
        note: vec.details || ''
      });
    }
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

    return 'Estetická zóna';
  };

  // MOUSE DOWN: Start drawing or panning
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    // Close units popover if clicking anywhere on canvas
    if (unitsPopover) {
      setUnitsPopover(null);
    }

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
      // Create single point immediately with smart default units
      const zone = detectAnatomicalZone(coords, currentView);
      const isBotox = currentProduct.type === 'botox';
      const isProfhilo = currentProduct.name.toLowerCase().includes('profhilo');
      const isKysse = currentProduct.name.toLowerCase().includes('kysse');
      
      let detailStr = '0.1ml intradermálne';
      let defaultUnits = 4;
      let defaultUnitsUnit = 'U';

      if (isBotox) {
        if (currentProduct.name.toLowerCase().includes('dysport')) {
          detailStr = '10 Speywood U (intramuskulárne)';
          defaultUnits = 10;
          defaultUnitsUnit = 'Speywood';
        } else {
          detailStr = '4 IU (intramuskulárne)';
          defaultUnits = 4;
          defaultUnitsUnit = 'IU';
        }
      } else if (isProfhilo) {
        detailStr = '0.2ml BAP bolus subkutánne';
        defaultUnits = 0.2;
        defaultUnitsUnit = 'ml';
      } else if (isKysse) {
        detailStr = '0.05ml výplň pier';
        defaultUnits = 0.05;
        defaultUnitsUnit = 'ml';
      } else {
        defaultUnits = 0.1;
        defaultUnitsUnit = 'ml';
      }

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
        units: defaultUnits,
        unitsUnit: defaultUnitsUnit,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      pushHistory([...vectors, newVector]);
      setIsDrawing(false);
      setCurrentDrawStart(null);
      setCurrentDrawCurrent(null);
      if (onSelectVector) onSelectVector(newVector.id);
    }
  };

  // MOUSE MOVE: Update current drawing or panning or point dragging
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const coords = getSVGCoordinates(e.clientX, e.clientY);
    if (coords) {
      setHoveredZone(detectAnatomicalZone(coords, currentView));
    }

    // 0. Dragging an existing point or vector handle
    if (draggedPointRef.current && coords) {
      const { vectorId, handle, startClientX, startClientY } = draggedPointRef.current;
      const dragDist = Math.hypot(e.clientX - startClientX, e.clientY - startClientY);

      if (dragDist > 2) {
        draggedPointRef.current.hasMoved = true;
        setDraggedPoint(prev => prev ? { ...prev, hasMoved: true } : null);

        const updatedVectors = vectors.map(v => {
          if (v.id !== vectorId) return v;

          if (handle === 'point') {
            const newZone = detectAnatomicalZone(coords, currentView);
            return {
              ...v,
              startPoint: coords,
              zoneName: v.type === 'point' ? newZone : v.zoneName
            };
          }

          if (handle === 'start') {
            if (v.type === 'fanning' && v.endPoint) {
              const dx = v.endPoint.x - coords.x;
              const dy = v.endPoint.y - coords.y;
              const baseAngle = Math.atan2(dy, dx);
              const dist = Math.hypot(dx, dy);
              const fanSpread = Math.PI / 5;
              const fanningRays: Point2D[] = [];
              for (let i = 0; i < 5; i++) {
                const offsetAngle = baseAngle - fanSpread / 2 + (fanSpread / 4) * i;
                const rayLength = dist * (0.85 + 0.15 * Math.sin((i / 4) * Math.PI));
                fanningRays.push({
                  x: coords.x + Math.cos(offsetAngle) * rayLength,
                  y: coords.y + Math.sin(offsetAngle) * rayLength
                });
              }
              return { ...v, startPoint: coords, fanningRays };
            }
            return { ...v, startPoint: coords };
          }

          if (handle === 'end') {
            if (v.type === 'fanning' && v.startPoint) {
              const dx = coords.x - v.startPoint.x;
              const dy = coords.y - v.startPoint.y;
              const baseAngle = Math.atan2(dy, dx);
              const dist = Math.hypot(dx, dy);
              const fanSpread = Math.PI / 5;
              const fanningRays: Point2D[] = [];
              for (let i = 0; i < 5; i++) {
                const offsetAngle = baseAngle - fanSpread / 2 + (fanSpread / 4) * i;
                const rayLength = dist * (0.85 + 0.15 * Math.sin((i / 4) * Math.PI));
                fanningRays.push({
                  x: v.startPoint.x + Math.cos(offsetAngle) * rayLength,
                  y: v.startPoint.y + Math.sin(offsetAngle) * rayLength
                });
              }
              return { ...v, endPoint: coords, fanningRays };
            }
            return { ...v, endPoint: coords };
          }

          return v;
        });

        onVectorsChange(updatedVectors);
      }
      return;
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

  // MOUSE UP: Finish drawing or panning or point dragging
  const handleMouseUp = () => {
    if (draggedPointRef.current) {
      if (draggedPointRef.current.hasMoved) {
        pushHistory(vectors);
        setToastMsg('Bod bol presunutý');
        setTimeout(() => setToastMsg(null), 2000);
      }
      draggedPointRef.current = null;
      setDraggedPoint(null);
      return;
    }

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

        {/* ANATOMICKÁ MRIEŽKA & POČET VEKTOROV */}
        <div className="flex items-center gap-2 text-xs text-[#8C857B] px-1 font-medium flex-wrap">
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

      {/* UKOTVENÝ PANEL NÁSTROJOV (PEVNE NAD SOCHOU) */}
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

      {/* 2. HLAVNÝ RÁM S 2D REALISTICKOU SOCHOU A KRESLIACIMI NÁSTROJMI */}
      <div 
        ref={containerRef}
        className="relative w-full aspect-[4/5] max-h-[620px] bg-gradient-to-b from-[#FAF8F5] via-[#F4EEE5] to-[#E9E0D4] rounded-3xl border border-[#E8E2D9] shadow-inner overflow-hidden flex items-center justify-center"
      >
        {/* INŠTRUKCIA K OVLÁDANIU BODOV A VEKTOROV */}
        <div className="absolute bottom-3 right-4 z-20 hidden md:flex items-center gap-2.5 bg-white/90 backdrop-blur-md text-[11px] text-[#2C2A29] px-3.5 py-1.5 rounded-full border border-[#E8E2D9] shadow-xs pointer-events-none">
          <span className="flex items-center gap-1 font-semibold text-[#2C2A29]">
            <MousePointer className="w-3.5 h-3.5 text-[#C5A059]" /> Ťahanie bodu: <span className="font-normal text-[#8C857B]">posun</span>
          </span>
          <span className="text-[#D8D2C9]">•</span>
          <span className="flex items-center gap-1 font-semibold text-[#2C2A29]">
            <Syringe className="w-3.5 h-3.5 text-[#3B82F6]" /> Pravý klik: <span className="font-normal text-[#8C857B]">jednotky / dávka</span>
          </span>
          <span className="text-[#D8D2C9]">•</span>
          <span className="flex items-center gap-1 font-semibold text-[#2C2A29]">
            <Trash2 className="w-3.5 h-3.5 text-red-500" /> Kláves Delete: <span className="font-normal text-[#8C857B]">vymazať</span>
          </span>
        </div>

        {/* TOAST NOTIFIKÁCIA (POTVRDENIE AKCIE) */}
        {toastMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#2C2A29] text-white px-4 py-2 rounded-2xl text-xs font-semibold shadow-2xl border border-[#C5A059]/40 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
            <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* QUICK UNITS, PRODUCT & DÁVKOVANIE POPUP (PRAVÝ KLIK NA BOD, VEKTOR ALEBO VEJÁR) */}
        {unitsPopover && (() => {
          const popoverVector = vectors.find(v => v.id === unitsPopover.vectorId);
          if (!popoverVector) return null;

          const isVector = popoverVector.type === 'vector';
          const isFanning = popoverVector.type === 'fanning';
          const isThreads = popoverVector.type === 'threads';

          const typeTitle = isVector 
            ? 'Kanylový vektor' 
            : isFanning 
            ? 'Vejárovitá aplikácia (Fanning)' 
            : isThreads 
            ? 'Liftingové mezonite' 
            : 'Aplikačný bod (Mikrovpich)';

          // Paleta farieb pre rýchlu zmenu farby vektora/bodu
          const paletteColors = [
            { color: '#D97706', name: 'Jantár (Radiesse)' },
            { color: '#C5A059', name: 'Zlato (Sculptra)' },
            { color: '#EC4899', name: 'Ružová (Restylane / Kysse)' },
            { color: '#10B981', name: 'Zelená (Profhilo)' },
            { color: '#3B82F6', name: 'Modrá (Dysport / Botox)' },
            { color: '#8B5CF6', name: 'Fialová (Mezonite)' },
            { color: '#2C2A29', name: 'Marker (Čierna)' }
          ];

          return (
            <div
              style={{ left: unitsPopover.x, top: unitsPopover.y }}
              className="absolute z-50 w-80 max-h-[90%] overflow-y-auto bg-white/95 backdrop-blur-2xl rounded-3xl border border-[#C5A059]/40 shadow-2xl p-4 space-y-3 animate-in zoom-in-95 duration-150 text-[#2C2A29]"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onContextMenu={(e) => e.preventDefault()}
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-2.5 border-b border-[#E8E2D9]">
                <div className="flex items-center gap-2">
                  <div 
                    className="p-1.5 rounded-xl border flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: unitsPopover.color || popoverVector.color }}
                  >
                    {isVector ? (
                      <MoveUpRight className="w-4 h-4" />
                    ) : isFanning ? (
                      <Sparkles className="w-4 h-4" />
                    ) : isThreads ? (
                      <Layers className="w-4 h-4" />
                    ) : (
                      <Syringe className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#2C2A29] leading-tight flex items-center gap-1.5">
                      <span>{typeTitle}</span>
                    </h4>
                    <p className="text-[11px] font-semibold text-[#C5A059] line-clamp-1 max-w-[190px]">
                      {popoverVector.zoneName || 'Anatomická oblasť'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUnitsPopover(null)}
                  className="p-1 rounded-lg text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FAF8F5] cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 1. VÝBER PRODUKTU (PRESET ALEBO VLASTNÝ) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-[#8C857B] uppercase tracking-wider flex items-center gap-1">
                    <Package className="w-3 h-3 text-[#C5A059]" />
                    <span>Produkt:</span>
                  </label>
                  {unitsPopover.lotNumber && (
                    <span className="text-[9.5px] font-mono text-[#8C857B] bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E8E2D9]">
                      LOT: {unitsPopover.lotNumber}
                    </span>
                  )}
                </div>

                <select
                  value={unitsPopover.productName}
                  onChange={(e) => {
                    const selName = e.target.value;
                    const matched = AESTHETIC_PRODUCTS.find(p => p.name === selName || p.shortName === selName);
                    if (matched) {
                      setUnitsPopover(prev => prev ? {
                        ...prev,
                        productName: matched.name,
                        lotNumber: matched.lot,
                        unitType: matched.defaultUnit,
                        units: matched.defaultUnits,
                        color: matched.color
                      } : null);
                    } else {
                      setUnitsPopover(prev => prev ? { ...prev, productName: selName } : null);
                    }
                  }}
                  className="w-full py-1.5 px-2.5 rounded-xl border border-[#E8E2D9] bg-white text-xs font-semibold text-[#2C2A29] focus:outline-hidden focus:border-[#C5A059] cursor-pointer shadow-2xs"
                >
                  {AESTHETIC_PRODUCTS.map((prod) => (
                    <option key={prod.name} value={prod.name}>
                      {prod.name}
                    </option>
                  ))}
                </select>

                {/* Rýchle čipy najčastejších produktov */}
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {AESTHETIC_PRODUCTS.slice(0, 6).map((p) => {
                    const isSelectedProd = unitsPopover.productName.includes(p.shortName) || unitsPopover.productName === p.name;
                    return (
                      <button
                        key={p.shortName}
                        type="button"
                        onClick={() => {
                          setUnitsPopover(prev => prev ? {
                            ...prev,
                            productName: p.name,
                            lotNumber: p.lot,
                            unitType: p.defaultUnit,
                            units: p.defaultUnits,
                            color: p.color
                          } : null);
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                          isSelectedProd
                            ? 'bg-[#2C2A29] text-white border-[#2C2A29] shadow-xs'
                            : 'bg-[#FAF8F5] text-[#8C857B] border-[#E8E2D9] hover:border-[#C5A059] hover:text-[#2C2A29]'
                        }`}
                      >
                        {p.shortName.split(' ')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. OBJEM & DÁVKA */}
              <div className="space-y-1.5 pt-1 border-t border-[#E8E2D9]">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-[#8C857B] uppercase tracking-wider flex items-center gap-1">
                    <Syringe className="w-3 h-3 text-[#3B82F6]" />
                    <span>Objem / Dávka:</span>
                  </label>
                  <span className="text-[10px] text-[#C5A059] font-bold">
                    {unitsPopover.units} {unitsPopover.unitType}
                  </span>
                </div>

                {/* Rýchle predvoľby dávky podľa jednotky */}
                {unitsPopover.unitType === 'ml' ? (
                  <div className="grid grid-cols-4 gap-1">
                    {[0.05, 0.1, 0.2, 0.25, 0.3, 0.5, 0.75, 1.0].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setUnitsPopover(prev => prev ? { ...prev, units: val } : null)}
                        className={`py-1 px-1 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                          unitsPopover.units === val
                            ? 'bg-[#C5A059] text-white border-[#C5A059] shadow-xs'
                            : 'bg-[#FAF8F5] text-[#2C2A29] border-[#E8E2D9] hover:border-[#C5A059]'
                        }`}
                      >
                        {val} ml
                      </button>
                    ))}
                  </div>
                ) : unitsPopover.unitType === 'Speywood' ? (
                  <div className="grid grid-cols-4 gap-1">
                    {[5, 10, 15, 20, 25, 30, 40, 50].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setUnitsPopover(prev => prev ? { ...prev, units: val } : null)}
                        className={`py-1 px-1 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                          unitsPopover.units === val
                            ? 'bg-[#C5A059] text-white border-[#C5A059] shadow-xs'
                            : 'bg-[#FAF8F5] text-[#2C2A29] border-[#E8E2D9] hover:border-[#C5A059]'
                        }`}
                      >
                        {val} Sp
                      </button>
                    ))}
                  </div>
                ) : unitsPopover.unitType === 'nití' ? (
                  <div className="grid grid-cols-4 gap-1">
                    {[1, 2, 3, 4, 6, 8, 10, 12].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setUnitsPopover(prev => prev ? { ...prev, units: val } : null)}
                        className={`py-1 px-1 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                          unitsPopover.units === val
                            ? 'bg-[#C5A059] text-white border-[#C5A059] shadow-xs'
                            : 'bg-[#FAF8F5] text-[#2C2A29] border-[#E8E2D9] hover:border-[#C5A059]'
                        }`}
                      >
                        {val} nití
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-1">
                    {[1, 2, 3, 4, 5, 8, 10, 15].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setUnitsPopover(prev => prev ? { ...prev, units: val } : null)}
                        className={`py-1 px-1 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                          unitsPopover.units === val
                            ? 'bg-[#C5A059] text-white border-[#C5A059] shadow-xs'
                            : 'bg-[#FAF8F5] text-[#2C2A29] border-[#E8E2D9] hover:border-[#C5A059]'
                        }`}
                      >
                        {val} U
                      </button>
                    ))}
                  </div>
                )}

                {/* Krokovanie hodnoty a výber jednotky */}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const step = unitsPopover.unitType === 'ml' ? 0.05 : 1;
                      const nextVal = Math.max(0, Math.round((unitsPopover.units - step) * 100) / 100);
                      setUnitsPopover(prev => prev ? { ...prev, units: nextVal } : null);
                    }}
                    className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] hover:border-[#C5A059] flex items-center justify-center font-bold text-sm text-[#2C2A29] cursor-pointer"
                    title="Znížiť dávku"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step={unitsPopover.unitType === 'ml' ? '0.01' : '1'}
                    min="0"
                    value={unitsPopover.units}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setUnitsPopover(prev => prev ? { ...prev, units: val } : null);
                    }}
                    className="flex-1 text-center font-bold text-sm py-1 rounded-xl border border-[#E8E2D9] bg-white text-[#2C2A29] focus:outline-hidden focus:border-[#C5A059]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const step = unitsPopover.unitType === 'ml' ? 0.05 : 1;
                      const nextVal = Math.round((unitsPopover.units + step) * 100) / 100;
                      setUnitsPopover(prev => prev ? { ...prev, units: nextVal } : null);
                    }}
                    className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] hover:border-[#C5A059] flex items-center justify-center font-bold text-sm text-[#2C2A29] cursor-pointer"
                    title="Zvýšiť dávku"
                  >
                    +
                  </button>
                  <select
                    value={unitsPopover.unitType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setUnitsPopover(prev => {
                        if (!prev) return null;
                        let adj = prev.units;
                        if (newType === 'ml' && prev.units > 5) adj = 0.2;
                        if (newType === 'Speywood' && prev.units < 1) adj = 10;
                        if ((newType === 'IU' || newType === 'U') && prev.units < 1) adj = 4;
                        if (newType === 'nití' && prev.units < 1) adj = 2;
                        return { ...prev, unitType: newType, units: adj };
                      });
                    }}
                    className="py-1 px-2 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] text-xs font-bold text-[#2C2A29] focus:outline-hidden cursor-pointer"
                  >
                    <option value="ml">ml (objem)</option>
                    <option value="Speywood">Speywood (Sp)</option>
                    <option value="IU">IU (Botox)</option>
                    <option value="U">U (jednotky)</option>
                    <option value="nití">nití</option>
                  </select>
                </div>
              </div>

              {/* 3. FARBA ZNAČENIA */}
              <div className="space-y-1 pt-1 border-t border-[#E8E2D9]">
                <label className="text-[10px] font-bold text-[#8C857B] uppercase tracking-wider flex items-center gap-1">
                  <Palette className="w-3 h-3 text-[#C5A059]" />
                  <span>Farba nákresu:</span>
                </label>
                <div className="flex items-center gap-2 pt-0.5">
                  {paletteColors.map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setUnitsPopover(prev => prev ? { ...prev, color: c.color } : null)}
                      style={{ backgroundColor: c.color }}
                      className={`w-5 h-5 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                        unitsPopover.color === c.color ? 'scale-125 ring-2 ring-[#2C2A29] ring-offset-1' : 'hover:scale-110'
                      }`}
                      title={c.name}
                    >
                      {unitsPopover.color === c.color && <Check className="w-3 h-3 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Tlačidlá akcie: Zmazať & Uložiť */}
              <div className="flex items-center justify-between pt-2 border-t border-[#E8E2D9] gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const updated = vectors.filter(v => v.id !== popoverVector.id);
                    pushHistory(updated);
                    if (onSelectVector) onSelectVector(null);
                    setUnitsPopover(null);
                    setToastMsg(`"${popoverVector.zoneName || typeTitle}" bol vymazaný`);
                    setTimeout(() => setToastMsg(null), 2500);
                  }}
                  className="py-1.5 px-2.5 rounded-xl text-[11px] font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Vymazať tento prvok (Delete)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vymazať</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const u = unitsPopover.units;
                    const ut = unitsPopover.unitType;
                    const prodName = unitsPopover.productName;
                    const lot = unitsPopover.lotNumber;
                    const clr = unitsPopover.color;

                    const updated = vectors.map(v => {
                      if (v.id === popoverVector.id) {
                        return {
                          ...v,
                          units: u,
                          unitsUnit: ut,
                          productName: prodName,
                          lotNumber: lot,
                          color: clr,
                          details: `${u} ${ut} • ${prodName} (${v.zoneName})`
                        };
                      }
                      return v;
                    });
                    pushHistory(updated);
                    setUnitsPopover(null);
                    setToastMsg(`Uložené: ${prodName} (${u} ${ut})`);
                    setTimeout(() => setToastMsg(null), 2500);
                  }}
                  className="py-1.5 px-3.5 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-[11px] font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Uložiť zmeny</span>
                </button>
              </div>
            </div>
          );
        })()}

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
                    onContextMenu={(e) => handlePointContextMenu(e, vec)}
                    className="cursor-pointer group"
                  >
                    {/* Wide transparent hit target so user can easily click or right-click anywhere along the vector */}
                    <line
                      x1={sx}
                      y1={sy}
                      x2={ex}
                      y2={ey}
                      stroke="transparent"
                      strokeWidth="20"
                      strokeLinecap="round"
                    />

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

                    {/* Cannula puncture hub (entry point - draggable) */}
                    <circle cx={sx} cy={sy} r="6" fill="#2C2A29" stroke={vec.color} strokeWidth="2" />
                    <circle cx={sx} cy={sy} r="2" fill="#FFFFFF" />
                    <circle
                      cx={sx}
                      cy={sy}
                      r="14"
                      fill="transparent"
                      className="cursor-move"
                      onMouseDown={(e) => handlePointMouseDown(e, vec.id, 'start')}
                    />

                    {/* Terminal tip (draggable) */}
                    <circle cx={ex} cy={ey} r="4" fill={vec.color} stroke="#FFFFFF" strokeWidth="1.5" />
                    <circle
                      cx={ex}
                      cy={ey}
                      r="14"
                      fill="transparent"
                      className="cursor-move"
                      onMouseDown={(e) => handlePointMouseDown(e, vec.id, 'end')}
                    />

                    {/* Dávkovanie / Jednotky badge */}
                    {vec.units !== undefined && vec.units !== null && (
                      <g
                        transform={`translate(${(sx + ex) / 2}, ${(sy + ey) / 2 - 8})`}
                        className="pointer-events-none select-none"
                      >
                        <rect
                          x={String(vec.units).length > 2 ? -22 : -16}
                          y="-9"
                          width={String(vec.units).length > 2 ? 44 : 32}
                          height="14"
                          rx="5"
                          fill="#2C2A29"
                          stroke={vec.color}
                          strokeWidth="1.2"
                        />
                        <text
                          x="0"
                          y="1"
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="8.5"
                          fontWeight="bold"
                          fontFamily="sans-serif"
                        >
                          {vec.units}{vec.unitsUnit === 'ml' ? 'ml' : vec.unitsUnit === 'Speywood' ? 'Sp' : vec.unitsUnit === 'nití' ? 'n' : 'U'}
                        </text>
                      </g>
                    )}
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
                    onContextMenu={(e) => handlePointContextMenu(e, vec)}
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
                    {/* Insertion Point (draggable) */}
                    <circle cx={sx} cy={sy} r="6.5" fill="#2C2A29" stroke={vec.color} strokeWidth="2.5" />
                    <circle cx={sx} cy={sy} r="2" fill="#FFFFFF" />
                    <circle
                      cx={sx}
                      cy={sy}
                      r="14"
                      fill="transparent"
                      className="cursor-move"
                      onMouseDown={(e) => handlePointMouseDown(e, vec.id, 'start')}
                    />

                    {/* Dávkovanie / Jednotky badge */}
                    {vec.units !== undefined && vec.units !== null && (
                      <g
                        transform={`translate(${sx + 10}, ${sy - 8})`}
                        className="pointer-events-none select-none"
                      >
                        <rect
                          x="-2"
                          y="-9"
                          width={String(vec.units).length > 2 ? 36 : 28}
                          height="14"
                          rx="5"
                          fill="#2C2A29"
                          stroke={vec.color}
                          strokeWidth="1.2"
                        />
                        <text
                          x={String(vec.units).length > 2 ? 16 : 12}
                          y="1"
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="8.5"
                          fontWeight="bold"
                          fontFamily="sans-serif"
                        >
                          {vec.units}{vec.unitsUnit === 'ml' ? 'ml' : vec.unitsUnit === 'Speywood' ? 'Sp' : vec.unitsUnit === 'nití' ? 'n' : 'U'}
                        </text>
                      </g>
                    )}
                  </g>
                );
              }

              // 3. Bodový mikrovpich (Dysport, Alluzience, Profhilo BAP, Restylane Kysse)
              if (vec.type === 'point' && vec.startPoint) {
                const isDraggingThis = draggedPoint?.vectorId === vec.id;

                return (
                  <g
                    key={vec.id}
                    onMouseDown={(e) => handlePointMouseDown(e, vec.id, 'point')}
                    onContextMenu={(e) => handlePointContextMenu(e, vec)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectVector) onSelectVector(vec.id);
                    }}
                    className="cursor-move group"
                  >
                    {/* Invisible larger hit target for effortless drag & drop */}
                    <circle
                      cx={vec.startPoint.x}
                      cy={vec.startPoint.y}
                      r="18"
                      fill="transparent"
                      className="cursor-move"
                    />

                    {/* Active Dragging highlight or Selection halo */}
                    {(isSelected || isDraggingThis) && (
                      <circle
                        cx={vec.startPoint.x}
                        cy={vec.startPoint.y}
                        r={isDraggingThis ? "18" : "14"}
                        fill={vec.color}
                        opacity={isDraggingThis ? "0.5" : "0.35"}
                        stroke={isDraggingThis ? "#2C2A29" : "none"}
                        strokeWidth="1.5"
                        strokeDasharray={isDraggingThis ? "3 3" : "none"}
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

                    {/* DÁVKOVANIE / POČET JEDNOTIEK BADGE */}
                    {vec.units !== undefined && vec.units !== null ? (
                      <g
                        transform={`translate(${vec.startPoint.x + 8}, ${vec.startPoint.y - 8})`}
                        className="pointer-events-none select-none"
                      >
                        <rect
                          x="-2"
                          y="-10"
                          width={String(vec.units).length > 2 ? 36 : 28}
                          height="14"
                          rx="5"
                          fill="#2C2A29"
                          stroke={vec.color}
                          strokeWidth="1.2"
                        />
                        <text
                          x={String(vec.units).length > 2 ? 16 : 12}
                          y="0.5"
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="8.5"
                          fontWeight="bold"
                          fontFamily="sans-serif"
                        >
                          {vec.units}{vec.unitsUnit === 'ml' ? 'ml' : vec.unitsUnit === 'Speywood' ? 'Sp' : vec.unitsUnit === 'nití' ? 'n' : 'U'}
                        </text>
                      </g>
                    ) : (
                      /* Ak jednotky nie sú zadané a bod je vybraný, ukáž index */
                      isSelected && (
                        <text
                          x={vec.startPoint.x + 9}
                          y={vec.startPoint.y - 7}
                          fill="#2C2A29"
                          fontSize="9"
                          fontWeight="bold"
                          className="pointer-events-none select-none"
                        >
                          #{vecIndex + 1}
                        </text>
                      )
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
                    onContextMenu={(e) => handlePointContextMenu(e, vec)}
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
