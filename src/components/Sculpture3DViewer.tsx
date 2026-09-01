'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  RotateCw, 
  Undo2, 
  Trash2, 
  Move, 
  PenTool, 
  Sparkles, 
  Compass,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';

export type DrawingToolType = 'threads' | 'fanning' | 'point' | 'freehand' | 'rotate';

export interface VectorItem {
  id: string;
  type: 'threads' | 'fanning' | 'point' | 'freehand';
  color: string;
  startX: number;
  startY: number;
  endX?: number;
  endY?: number;
  points?: { x: number; y: number }[];
  fanningLines?: { x: number; y: number }[];
  zoneName: string;
  productName: string;
  lotNumber: string;
  details: string;
  rotationY: number; // View angle where it was drawn
}

interface Sculpture3DViewerProps {
  vectors: VectorItem[];
  onVectorsChange: (vectors: VectorItem[]) => void;
  activeTool: DrawingToolType;
  onSelectTool: (tool: DrawingToolType) => void;
  activeColor: string;
  onSelectColor: (color: string) => void;
  currentProduct: { name: string; lot: string; type: string; unit: string };
  selectedVectorId: string | null;
  onSelectVector: (id: string | null) => void;
}

export function Sculpture3DViewer({
  vectors,
  onVectorsChange,
  activeTool,
  onSelectTool,
  activeColor,
  onSelectColor,
  currentProduct,
  selectedVectorId,
  onSelectVector
}: Sculpture3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const headGroupRef = useRef<THREE.Group | null>(null);

  // Rotation & Camera physics via refs (avoids React closure bugs)
  const rotationStateRef = useRef({
    currentY: 0,
    targetY: 0,
    currentX: 0,
    targetX: 0,
    isAutoRotating: false,
    zoom: 5.2
  });

  const [displayRotationY, setDisplayRotationY] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [activeZoneHover, setActiveZoneHover] = useState<string | null>(null);

  const isDraggingRef = useRef(false);
  const lastPointerPosRef = useRef({ x: 0, y: 0 });

  // Drawing state
  const isDrawingRef = useRef(false);
  const drawStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const currentPathRef = useRef<{ x: number; y: number }[]>([]);
  const [tempVector, setTempVector] = useState<Partial<VectorItem> | null>(null);

  // Synchronize auto rotation state
  const toggleAutoRotate = () => {
    const nextState = !rotationStateRef.current.isAutoRotating;
    rotationStateRef.current.isAutoRotating = nextState;
    setIsAutoRotating(nextState);
  };

  const setPresetAngle = (targetRadY: number, targetRadX = 0) => {
    rotationStateRef.current.isAutoRotating = false;
    setIsAutoRotating(false);
    rotationStateRef.current.targetY = targetRadY;
    rotationStateRef.current.targetX = targetRadX;
  };

  const handleZoom = (delta: number) => {
    const newZoom = Math.max(3.6, Math.min(6.8, rotationStateRef.current.zoom + delta));
    rotationStateRef.current.zoom = newZoom;
    if (cameraRef.current) {
      cameraRef.current.position.z = newZoom;
    }
  };

  // Helper to construct realistic anatomical face mesh
  const createAnatomicalHeadMesh = (material: THREE.Material): THREE.Group => {
    const group = new THREE.Group();

    // 1. High-resolution deformed Head/Face mesh
    const faceGeo = new THREE.SphereGeometry(1.2, 80, 80);
    const pos = faceGeo.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i);

      const x = vertex.x;
      const y = vertex.y;
      const z = vertex.z;

      // Facial topography sculpting parameters
      let newX = x * 0.84; // Cranial oval narrowness
      let newY = y;
      let newZ = z;

      // Forehead & Cranium smoothing
      if (y > 0.4) {
        newZ += Math.sin((y - 0.4) * 2.5) * 0.08;
      }

      // Eye orbit recession
      if (y > 0.12 && y < 0.42 && Math.abs(x) > 0.18 && Math.abs(x) < 0.65 && z > 0.3) {
        const orbitFactor = 1 - Math.sin((y - 0.12) / 0.3 * Math.PI) * Math.sin((Math.abs(x) - 0.18) / 0.47 * Math.PI) * 0.32;
        newZ *= orbitFactor;
      }

      // Glabella & Supraorbital ridge projection
      if (y > 0.32 && y < 0.52 && Math.abs(x) < 0.55 && z > 0.6) {
        newZ += Math.sin((y - 0.32) / 0.2 * Math.PI) * 0.1;
      }

      // Cheekbones (Zygomatic projection)
      if (y > -0.05 && y < 0.35 && Math.abs(x) > 0.35 && Math.abs(x) < 0.85 && z > 0.2) {
        const cheekBoost = Math.sin((y + 0.05) / 0.4 * Math.PI) * Math.sin((Math.abs(x) - 0.35) / 0.5 * Math.PI) * 0.22;
        newZ += cheekBoost;
        newX *= 1 + cheekBoost * 0.35;
      }

      // Refined Nose dorsum & tip projection
      if (y > -0.15 && y < 0.45 && Math.abs(x) < 0.22 && z > 0.4) {
        const noseYNorm = (y + 0.15) / 0.6;
        const noseRidge = Math.cos(Math.abs(x) / 0.22 * (Math.PI / 2)) * (0.38 - noseYNorm * 0.15);
        newZ += noseRidge;
        // Nose tip bulb
        if (y > -0.12 && y < 0.08 && Math.abs(x) < 0.14) {
          newZ += 0.12;
        }
      }

      // Philtrum & Cupid's bow / Upper lip
      if (y > -0.32 && y < -0.08 && Math.abs(x) < 0.38 && z > 0.5) {
        const lipYNorm = (y + 0.32) / 0.24;
        const lipCurve = Math.sin(lipYNorm * Math.PI) * Math.cos(Math.abs(x) / 0.38 * (Math.PI / 2));
        newZ += lipCurve * 0.18;
      }

      // Lower lip projection
      if (y > -0.44 && y < -0.26 && Math.abs(x) < 0.34 && z > 0.5) {
        const lowerLip = Math.sin((y + 0.44) / 0.18 * Math.PI) * Math.cos(Math.abs(x) / 0.34 * (Math.PI / 2));
        newZ += lowerLip * 0.15;
      }

      // Labiomental crease (indent between lip and chin)
      if (y > -0.55 && y < -0.42 && Math.abs(x) < 0.3 && z > 0.5) {
        newZ -= 0.07;
      }

      // Chin projection (Mentalis prominence)
      if (y > -0.92 && y < -0.48 && Math.abs(x) < 0.45 && z > 0.2) {
        const chinY = (y + 0.92) / 0.44;
        const chinBoost = Math.sin(chinY * Math.PI) * Math.cos(Math.abs(x) / 0.45 * (Math.PI / 2)) * 0.24;
        newZ += chinBoost;
        newY -= 0.06;
      }

      // Mandibular jawline contour & tapering
      if (y < -0.15) {
        const jawTaper = Math.max(0.48, 1 + (y + 0.15) * 0.48);
        newX *= jawTaper;
      }

      // Flatten occipital back of head
      if (z < -0.2) {
        newZ *= 0.92;
      }

      pos.setXYZ(i, newX, newY, newZ);
    }

    faceGeo.computeVertexNormals();
    const faceMesh = new THREE.Mesh(faceGeo, material);
    faceMesh.position.y = 0.55;
    group.add(faceMesh);

    // 2. Anatomical Ears (Left & Right)
    const earGeo = new THREE.TorusGeometry(0.24, 0.08, 16, 32, Math.PI * 1.2);
    const earLeft = new THREE.Mesh(earGeo, material);
    earLeft.position.set(-0.95, 0.45, -0.05);
    earLeft.rotation.y = -Math.PI / 4;
    earLeft.rotation.z = Math.PI / 8;
    group.add(earLeft);

    const earRight = new THREE.Mesh(earGeo, material);
    earRight.position.set(0.95, 0.45, -0.05);
    earRight.rotation.y = Math.PI / 4;
    earRight.rotation.z = -Math.PI / 8;
    group.add(earRight);

    // 3. Anatomical Neck & Sternocleidomastoid muscles
    const neckGeo = new THREE.CylinderGeometry(0.55, 0.76, 1.35, 48);
    const neckMesh = new THREE.Mesh(neckGeo, material);
    neckMesh.position.set(0, -0.65, -0.04);
    group.add(neckMesh);

    // 4. Shoulders & Decollete base
    const shoulderGeo = new THREE.CylinderGeometry(0.85, 1.85, 0.85, 64);
    const shoulderMesh = new THREE.Mesh(shoulderGeo, material);
    shoulderMesh.position.set(0, -1.45, -0.05);
    group.add(shoulderMesh);

    // 5. Classical marble pedestal with brushed gold trim
    const pedestalMaterial = new THREE.MeshStandardMaterial({
      color: 0xE8E1D7,
      roughness: 0.55,
      metalness: 0.08,
    });
    const pedestalGeo = new THREE.CylinderGeometry(1.2, 1.35, 0.4, 64);
    const pedestalMesh = new THREE.Mesh(pedestalGeo, pedestalMaterial);
    pedestalMesh.position.set(0, -2.0, -0.05);
    group.add(pedestalMesh);

    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xC5A059,
      roughness: 0.28,
      metalness: 0.75,
    });
    const goldRingGeo = new THREE.TorusGeometry(1.24, 0.04, 16, 64);
    const goldRingMesh = new THREE.Mesh(goldRingGeo, goldMaterial);
    goldRingMesh.position.set(0, -1.8, -0.05);
    goldRingMesh.rotation.x = Math.PI / 2;
    group.add(goldRingMesh);

    return group;
  };

  // Initialize Three.js WebGL Scene
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 440;
    const height = mountRef.current.clientHeight || 560;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 1000);
    camera.position.set(0, 0.15, rotationStateRef.current.zoom);
    cameraRef.current = camera;

    // 3. High-Quality WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    
    // Clear and attach
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Studio Lighting setup (warm clinical luxury)
    const ambientLight = new THREE.AmbientLight(0xfffaf0, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff5e6, 2.4);
    keyLight.position.set(4, 5, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xd9e8fc, 1.5);
    fillLight.position.set(-5, 2, 4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xc5a059, 2.0);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    const bottomBounce = new THREE.DirectionalLight(0xf5e6d3, 0.9);
    bottomBounce.position.set(0, -4, 2);
    scene.add(bottomBounce);

    // 5. Marble / Skin aesthetic material
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xF7EFE7,
      roughness: 0.38,
      metalness: 0.05,
      wireframe: false,
    });

    const headGroup = createAnatomicalHeadMesh(skinMaterial);
    headGroupRef.current = headGroup;
    scene.add(headGroup);

    // 6. 60 FPS Render loop with smooth interpolation
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const state = rotationStateRef.current;

      if (state.isAutoRotating) {
        state.targetY += 0.5 * delta;
        state.currentY = state.targetY;
      } else {
        // Smooth lerp towards target
        state.currentY += (state.targetY - state.currentY) * 0.18;
        state.currentX += (state.targetX - state.currentX) * 0.18;
      }

      if (headGroupRef.current) {
        headGroupRef.current.rotation.y = state.currentY;
        headGroupRef.current.rotation.x = state.currentX;
      }

      // Update UI angle state throttled
      setDisplayRotationY(state.currentY);

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    // 7. Robust Resize Handling
    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const w = mountRef.current.clientWidth || 440;
      const h = mountRef.current.clientHeight || 560;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);

      // Also adjust 2D drawing canvas internal resolution
      if (canvasRef.current) {
        canvasRef.current.width = w;
        canvasRef.current.height = h;
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mountRef.current);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  // Wireframe toggle effect
  useEffect(() => {
    if (headGroupRef.current) {
      headGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.wireframe = wireframeMode;
        }
      });
    }
  }, [wireframeMode]);

  // Zone detection helper based on coordinates and current face rotation
  const getZoneFromCoords = (normX: number, normY: number): string => {
    if (normY < 0.28) {
      return normX > 0.4 && normX < 0.6 ? 'Čelo - m. frontalis (Stred)' : normX <= 0.4 ? 'Čelo Ľavé / Spánok' : 'Čelo Pravé / Spánok';
    } else if (normY >= 0.28 && normY < 0.38) {
      return normX > 0.42 && normX < 0.58 ? 'Glabela (Vráska hnevu)' : normX <= 0.42 ? 'Periorbitálna zóna Ľ (Vejáriky)' : 'Periorbitálna zóna P (Vejáriky)';
    } else if (normY >= 0.38 && normY < 0.52) {
      if (normX > 0.45 && normX < 0.55) return 'Nos - Chrbát a hrot';
      return normX <= 0.45 ? 'Zygomatická oblasť / Líce Ľ' : 'Zygomatická oblasť / Líce P';
    } else if (normY >= 0.52 && normY < 0.65) {
      if (normX > 0.38 && normX < 0.62) return 'Nasolabiálna ryha & Pery (Vermilion)';
      return normX <= 0.38 ? 'Lícna oblasť Ľ (Vektor)' : 'Lícna oblasť P (Vektor)';
    } else if (normY >= 0.65 && normY < 0.78) {
      if (normX > 0.42 && normX < 0.58) return 'Brada (Mentalis) & Marionety';
      return normX <= 0.42 ? 'Mandibulárna línia Ľ (Sánka)' : 'Mandibulárna línia P (Sánka)';
    } else {
      return 'Submentálna & Krčná zóna (Platysma)';
    }
  };

  // Pointer event handlers for drawing & 3D rotation
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };

    // ROTATION MODE (Right click OR tool is 'rotate')
    if (e.button === 2 || activeTool === 'rotate') {
      isDraggingRef.current = true;
      rotationStateRef.current.isAutoRotating = false;
      setIsAutoRotating(false);
      return;
    }

    // DRAWING MODE (Left click with drawing tool)
    if (e.button === 0) {
      isDrawingRef.current = true;
      drawStartPosRef.current = { x, y };

      const normX = x / rect.width;
      const normY = y / rect.height;
      const zone = getZoneFromCoords(normX, normY);

      if (activeTool === 'freehand') {
        currentPathRef.current = [{ x, y }];
      } else if (activeTool === 'point') {
        // Immediate creation of injection point
        const newPoint: VectorItem = {
          id: `pt_${Date.now()}`,
          type: 'point',
          color: activeColor,
          startX: x,
          startY: y,
          zoneName: zone,
          productName: currentProduct.name,
          lotNumber: currentProduct.lot,
          details: `1 vpich • ${currentProduct.unit}`,
          rotationY: rotationStateRef.current.currentY
        };
        onVectorsChange([...vectors, newPoint]);
        onSelectVector(newPoint.id);
        isDrawingRef.current = false;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = x / rect.width;
    const normY = y / rect.height;
    setActiveZoneHover(getZoneFromCoords(normX, normY));

    // 1. 3D ROTATION DRAG
    if (isDraggingRef.current) {
      const deltaX = e.clientX - lastPointerPosRef.current.x;
      const deltaY = e.clientY - lastPointerPosRef.current.y;
      lastPointerPosRef.current = { x: e.clientX, y: e.clientY };

      rotationStateRef.current.targetY += deltaX * 0.012;
      rotationStateRef.current.targetX = Math.max(-0.45, Math.min(0.45, rotationStateRef.current.targetX + deltaY * 0.008));
      return;
    }

    // 2. VECTOR DRAWING PREVIEWS
    if (isDrawingRef.current && drawStartPosRef.current) {
      const startX = drawStartPosRef.current.x;
      const startY = drawStartPosRef.current.y;
      const currentRotY = rotationStateRef.current.currentY;

      if (activeTool === 'freehand') {
        currentPathRef.current.push({ x, y });
        setTempVector({
          type: 'freehand',
          color: activeColor,
          startX,
          startY,
          points: [...currentPathRef.current],
          rotationY: currentRotY
        });
      } else if (activeTool === 'threads') {
        setTempVector({
          type: 'threads',
          color: activeColor,
          startX,
          startY,
          endX: x,
          endY: y,
          rotationY: currentRotY
        });
      } else if (activeTool === 'fanning') {
        // Calculate 5-ray fan
        const angle = Math.atan2(y - startY, x - startX);
        const dist = Math.hypot(x - startX, y - startY);
        const spread = 0.42;
        const fanningLines = [-2, -1, 0, 1, 2].map(step => {
          const a = angle + step * (spread / 2);
          return {
            x: startX + Math.cos(a) * dist,
            y: startY + Math.sin(a) * dist
          };
        });

        setTempVector({
          type: 'fanning',
          color: activeColor,
          startX,
          startY,
          endX: x,
          endY: y,
          fanningLines,
          rotationY: currentRotY
        });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }

    if (!isDrawingRef.current || !drawStartPosRef.current) {
      isDrawingRef.current = false;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    const startX = drawStartPosRef.current.x;
    const startY = drawStartPosRef.current.y;
    const currentRotY = rotationStateRef.current.currentY;

    const zone = getZoneFromCoords(startX / rect.width, startY / rect.height);

    if (activeTool === 'threads') {
      const dist = Math.hypot(endX - startX, endY - startY);
      if (dist > 15) {
        const newThread: VectorItem = {
          id: `th_${Date.now()}`,
          type: 'threads',
          color: activeColor,
          startX,
          startY,
          endX,
          endY,
          zoneName: `${zone} (Niť)`,
          productName: currentProduct.name,
          lotNumber: currentProduct.lot,
          details: `Dĺžka ${Math.round(dist / 3)}mm • Vektor trakcie`,
          rotationY: currentRotY
        };
        onVectorsChange([...vectors, newThread]);
        onSelectVector(newThread.id);
      }
    } else if (activeTool === 'fanning') {
      const angle = Math.atan2(endY - startY, endX - startX);
      const dist = Math.hypot(endX - startX, endY - startY);
      if (dist > 15) {
        const spread = 0.42;
        const fanningLines = [-2, -1, 0, 1, 2].map(step => {
          const a = angle + step * (spread / 2);
          return {
            x: startX + Math.cos(a) * dist,
            y: startY + Math.sin(a) * dist
          };
        });

        const newFan: VectorItem = {
          id: `fan_${Date.now()}`,
          type: 'fanning',
          color: activeColor,
          startX,
          startY,
          endX,
          endY,
          fanningLines,
          zoneName: `${zone} (Vejár)`,
          productName: currentProduct.name,
          lotNumber: currentProduct.lot,
          details: `Kanyla 25G • 5 lúčov • 2.5ml roztoku`,
          rotationY: currentRotY
        };
        onVectorsChange([...vectors, newFan]);
        onSelectVector(newFan.id);
      }
    } else if (activeTool === 'freehand' && currentPathRef.current.length > 2) {
      const newFreehand: VectorItem = {
        id: `fh_${Date.now()}`,
        type: 'freehand',
        color: activeColor,
        startX,
        startY,
        points: [...currentPathRef.current],
        zoneName: `${zone} (Marker)`,
        productName: currentProduct.name,
        lotNumber: currentProduct.lot,
        details: 'Predoperačné značenie',
        rotationY: currentRotY
      };
      onVectorsChange([...vectors, newFreehand]);
      onSelectVector(newFreehand.id);
    }

    isDrawingRef.current = false;
    drawStartPosRef.current = null;
    currentPathRef.current = [];
    setTempVector(null);
  };

  // Render 2D Vectors on Canvas Layer
  const drawVectors = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allItems = [...vectors, ...(tempVector ? [tempVector as VectorItem] : [])];

    allItems.forEach((item) => {
      const isSelected = item.id === selectedVectorId;
      ctx.save();

      if (item.type === 'threads' && item.endX !== undefined && item.endY !== undefined) {
        // Aptos Thread with dual-directional barbs & traction arrow
        const angle = Math.atan2(item.endY - item.startY, item.endX - item.startX);
        const length = Math.hypot(item.endX - item.startX, item.endY - item.startY);

        ctx.strokeStyle = item.color || '#8B5CF6';
        ctx.lineWidth = isSelected ? 4 : 2.5;
        ctx.shadowColor = item.color;
        ctx.shadowBlur = isSelected ? 8 : 4;

        // Main thread line
        ctx.beginPath();
        ctx.moveTo(item.startX, item.startY);
        ctx.lineTo(item.endX, item.endY);
        ctx.stroke();

        // Insertion point ring
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(item.startX, item.startY, isSelected ? 6 : 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw barbs along thread length
        const numBarbs = Math.max(3, Math.floor(length / 28));
        for (let i = 1; i <= numBarbs; i++) {
          const t = i / (numBarbs + 1);
          const bx = item.startX + (item.endX - item.startX) * t;
          const by = item.startY + (item.endY - item.startY) * t;
          const barbLen = 7;
          const barbAngle = angle + Math.PI * 0.78;

          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + Math.cos(barbAngle) * barbLen, by + Math.sin(barbAngle) * barbLen);
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + Math.cos(barbAngle - Math.PI * 0.56) * barbLen, by + Math.sin(barbAngle - Math.PI * 0.56) * barbLen);
          ctx.stroke();
        }

        // Traction terminal arrowhead
        const arrowHead = 12;
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.moveTo(item.endX, item.endY);
        ctx.lineTo(item.endX - Math.cos(angle - Math.PI / 6) * arrowHead, item.endY - Math.sin(angle - Math.PI / 6) * arrowHead);
        ctx.lineTo(item.endX - Math.cos(angle + Math.PI / 6) * arrowHead, item.endY - Math.sin(angle + Math.PI / 6) * arrowHead);
        ctx.closePath();
        ctx.fill();

      } else if (item.type === 'fanning' && item.fanningLines) {
        // Sculptra / Biostimulator 5-Ray Fan
        ctx.fillStyle = `${item.color || '#C5A059'}28`;
        ctx.beginPath();
        ctx.moveTo(item.startX, item.startY);
        item.fanningLines.forEach(pt => ctx.lineTo(pt.x, pt.y));
        ctx.closePath();
        ctx.fill();

        // Fan rays
        item.fanningLines.forEach(pt => {
          ctx.strokeStyle = item.color || '#C5A059';
          ctx.lineWidth = isSelected ? 3 : 2;
          ctx.beginPath();
          ctx.moveTo(item.startX, item.startY);
          ctx.lineTo(pt.x, pt.y);
          ctx.stroke();

          // Droplet at end of ray
          ctx.fillStyle = item.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
          ctx.fill();
        });

        // Cannula entry point
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(item.startX, item.startY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

      } else if (item.type === 'point') {
        // Botox / Filler micro-injection point
        ctx.fillStyle = item.color || '#3B82F6';
        ctx.shadowColor = item.color;
        ctx.shadowBlur = isSelected ? 10 : 5;

        ctx.beginPath();
        ctx.arc(item.startX, item.startY, isSelected ? 7 : 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

      } else if (item.type === 'freehand' && item.points && item.points.length > 1) {
        // Freehand surgical marking line
        ctx.strokeStyle = item.color || '#EC4899';
        ctx.lineWidth = isSelected ? 3.5 : 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(item.points[0].x, item.points[0].y);
        for (let i = 1; i < item.points.length; i++) {
          ctx.lineTo(item.points[i].x, item.points[i].y);
        }
        ctx.stroke();
      }

      ctx.restore();
    });
  }, [vectors, tempVector, selectedVectorId]);

  useEffect(() => {
    drawVectors();
  }, [drawVectors]);

  return (
    <div className="flex flex-col items-center w-full space-y-4">
      {/* 3D SCULPTURE CANVAS CONTAINER */}
      <div 
        ref={containerRef}
        className="relative w-full max-w-[460px] aspect-[4/5] rounded-3xl overflow-hidden border border-[#E8E2D9] shadow-2xl bg-gradient-to-b from-[#FAF8F5] via-[#F4EEE6] to-[#E9E1D5] select-none group"
      >
        
        {/* 1. THREE.JS 3D WEBGL BUST MOUNT */}
        <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* 2. 2D INTERACTIVE DRAWING & VECTOR LAYER */}
        <canvas
          ref={canvasRef}
          width={460}
          height={575}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onContextMenu={(e) => e.preventDefault()}
          className={`absolute inset-0 w-full h-full z-20 ${
            activeTool === 'rotate' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
          }`}
        />

        {/* ANATOMICKÁ SMEROVÁ RUŽICA & UHOL POHĽADU */}
        <div className="absolute top-4 left-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/90 backdrop-blur-md border border-white/80 shadow-sm text-[11px] font-bold text-[#2C2A29] pointer-events-none">
          <Compass className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>
            {Math.abs(displayRotationY) < 0.25
              ? 'Čelný pohľad (0°)'
              : displayRotationY > 0.25 && displayRotationY < 1.15
              ? 'Pravý poloprofil (+45°)'
              : displayRotationY >= 1.15
              ? 'Pravý profil (+90°)'
              : displayRotationY < -0.25 && displayRotationY > -1.15
              ? 'Ľavý poloprofil (-45°)'
              : 'Ľavý profil (-90°)'}
          </span>
        </div>

        {/* HOVER ANATOMICAL ZONE INDICATOR */}
        {activeZoneHover && (
          <div className="absolute top-4 right-4 z-30 px-3 py-1.5 rounded-2xl bg-black/75 backdrop-blur-md text-[11px] font-medium text-white shadow-sm pointer-events-none transition-all">
            {activeZoneHover}
          </div>
        )}

        {/* ZOOM & CONTROLS OVERLAY (RIGHT) */}
        <div className="absolute right-4 bottom-20 z-30 flex flex-col gap-1.5 p-1 rounded-2xl bg-white/90 backdrop-blur-md border border-white/90 shadow-md">
          <button
            type="button"
            onClick={() => handleZoom(-0.6)}
            className="p-2 rounded-xl text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FAF8F5] transition-all"
            title="Priblížiť 3D model"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(0.6)}
            className="p-2 rounded-xl text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FAF8F5] transition-all"
            title="Oddialiť 3D model"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setWireframeMode(!wireframeMode)}
            className={`p-2 rounded-xl transition-all ${
              wireframeMode ? 'bg-[#C5A059] text-white' : 'text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FAF8F5]'
            }`}
            title="Anatomická 3D sieť (Wireframe)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* PREPÍNAČE UHLOV KAMERY */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 p-1 rounded-2xl bg-white/90 backdrop-blur-md border border-white/90 shadow-md">
          <button
            type="button"
            onClick={() => setPresetAngle(-Math.PI / 2)}
            className="px-2.5 py-1 rounded-xl text-[10px] font-bold hover:bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] transition-all"
            title="Ľavý profil (-90°)"
          >
            Ľ. profil
          </button>
          <button
            type="button"
            onClick={() => setPresetAngle(-Math.PI / 4)}
            className="px-2.5 py-1 rounded-xl text-[10px] font-bold hover:bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] transition-all"
            title="Ľavý poloprofil (-45°)"
          >
            -45°
          </button>
          <button
            type="button"
            onClick={() => setPresetAngle(0, 0)}
            className="px-3 py-1 rounded-xl text-[10px] font-bold bg-[#2C2A29] text-white shadow-xs"
            title="Čelný pohľad (0°)"
          >
            Čelný (0°)
          </button>
          <button
            type="button"
            onClick={() => setPresetAngle(Math.PI / 4)}
            className="px-2.5 py-1 rounded-xl text-[10px] font-bold hover:bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] transition-all"
            title="Pravý poloprofil (+45°)"
          >
            +45°
          </button>
          <button
            type="button"
            onClick={() => setPresetAngle(Math.PI / 2)}
            className="px-2.5 py-1 rounded-xl text-[10px] font-bold hover:bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] transition-all"
            title="Pravý profil (+90°)"
          >
            P. profil
          </button>
          <button
            type="button"
            onClick={toggleAutoRotate}
            className={`p-1.5 rounded-xl transition-all ${
              isAutoRotating ? 'bg-[#C5A059] text-white shadow-xs' : 'text-[#8C857B] hover:text-[#2C2A29]'
            }`}
            title="Prezentácia / Auto-rotácia 3D sochy"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* NÁSTROJOVÝ PANEL (DRAWING TOOLBAR) */}
      <div className="w-full max-w-[460px] flex flex-col gap-3 p-3.5 rounded-3xl bg-white/90 backdrop-blur-2xl border border-[#E8E2D9] shadow-sm">
        <div className="flex items-center justify-between gap-1 flex-wrap">
          
          {/* NÁSTROJ: OTÁČANIE 3D SOCHY */}
          <button
            type="button"
            onClick={() => onSelectTool('rotate')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTool === 'rotate'
                ? 'bg-[#2C2A29] text-white shadow-md'
                : 'bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] border border-[#E8E2D9]'
            }`}
          >
            <Move className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Otočiť 3D</span>
          </button>

          {/* NÁSTROJ: LIFTINGOVÉ NITE (APTOS / PDO) */}
          <button
            type="button"
            onClick={() => onSelectTool('threads')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTool === 'threads'
                ? 'bg-[#8B5CF6] text-white shadow-md'
                : 'bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] border border-[#E8E2D9]'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Nite (Aptos)</span>
          </button>

          {/* NÁSTROJ: VEJÁROVITÁ KANYLA (SCULPTRA / RADIESSE) */}
          <button
            type="button"
            onClick={() => onSelectTool('fanning')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTool === 'fanning'
                ? 'bg-[#C5A059] text-white shadow-md'
                : 'bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] border border-[#E8E2D9]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Vejár (Sculptra)</span>
          </button>

          {/* NÁSTROJ: BODOVÁ APLIKÁCIA (BOTOX / VÝPLŇ) */}
          <button
            type="button"
            onClick={() => onSelectTool('point')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTool === 'point'
                ? 'bg-[#3B82F6] text-white shadow-md'
                : 'bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] border border-[#E8E2D9]'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-current" />
            <span>Bod (Botox)</span>
          </button>

          {/* NÁSTROJ: VOĽNÉ KRESLENIE (MARKER) */}
          <button
            type="button"
            onClick={() => onSelectTool('freehand')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTool === 'freehand'
                ? 'bg-[#EC4899] text-white shadow-md'
                : 'bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] border border-[#E8E2D9]'
            }`}
          >
            <span className="text-sm font-serif">✏</span>
            <span>Marker</span>
          </button>
        </div>

        {/* FAREBNÁ PALETA A AKCIE */}
        <div className="flex items-center justify-between pt-2 border-t border-[#E8E2D9]/60">
          <div className="flex items-center gap-1.5">
            {[
              { color: '#C5A059', label: 'Zlatá / Sculptra' },
              { color: '#8B5CF6', label: 'Fialová / Aptos nite' },
              { color: '#3B82F6', label: 'Modrá / Botox' },
              { color: '#EC4899', label: 'Ružová / Kyselina hyalurónová' },
              { color: '#10B981', label: 'Zelená / Mezoterapia' },
              { color: '#EF4444', label: 'Červená / Chirurgický rez' },
            ].map(({ color, label }) => (
              <button
                key={color}
                type="button"
                onClick={() => onSelectColor(color)}
                className={`w-6 h-6 rounded-full transition-transform ${
                  activeColor === color ? 'scale-125 ring-2 ring-offset-2 ring-[#2C2A29]' : 'hover:scale-110 opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: color }}
                title={label}
              />
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (vectors.length > 0) {
                  onVectorsChange(vectors.slice(0, -1));
                }
              }}
              disabled={vectors.length === 0}
              className="p-1.5 rounded-xl text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FAF8F5] disabled:opacity-30 transition-all"
              title="Krok späť (Undo)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onVectorsChange([])}
              disabled={vectors.length === 0}
              className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 disabled:opacity-30 transition-all"
              title="Zmazať všetky nákresy"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
