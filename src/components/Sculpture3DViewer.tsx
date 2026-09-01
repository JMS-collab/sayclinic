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
  Compass
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
  
  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const bustGroupRef = useRef<THREE.Group | null>(null);

  // Rotation state
  const [rotationY, setRotationY] = useState(0);
  const [rotationX, setRotationX] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Drawing state
  const isDrawingRef = useRef(false);
  const drawStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const currentPathRef = useRef<{ x: number; y: number }[]>([]);
  const [tempVector, setTempVector] = useState<Partial<VectorItem> | null>(null);

  // Create classical sculpture bust in Three.js
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 440;
    const height = mountRef.current.clientHeight || 560;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.set(0, 0.2, 5.2);
    cameraRef.current = camera;

    // 3. Renderer with high aesthetic quality & soft shadows
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting: Luxury warm studio aesthetic lighting
    const ambientLight = new THREE.AmbientLight(0xfcf8f2, 1.2);
    scene.add(ambientLight);

    // Warm Key Light (Front-Right)
    const keyLight = new THREE.DirectionalLight(0xfff6ea, 2.2);
    keyLight.position.set(4, 5, 5);
    scene.add(keyLight);

    // Cool Soft Fill Light (Left)
    const fillLight = new THREE.DirectionalLight(0xdbe6f5, 1.4);
    fillLight.position.set(-5, 2, 4);
    scene.add(fillLight);

    // Gold Luxury Rim Light (Back)
    const rimLight = new THREE.DirectionalLight(0xc5a059, 1.8);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // Soft bottom bounce
    const bounceLight = new THREE.DirectionalLight(0xe8d5c4, 0.8);
    bounceLight.position.set(0, -4, 2);
    scene.add(bounceLight);

    // 5. Build sculpted head & bust group
    const bustGroup = new THREE.Group();
    bustGroupRef.current = bustGroup;
    scene.add(bustGroup);

    // Material: Pure classical Italian warm alabaster marble
    const marbleMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4eee6,
      roughness: 0.32,
      metalness: 0.04,
      flatShading: false,
    });

    const marblePedestalMaterial = new THREE.MeshStandardMaterial({
      color: 0xe5ded3,
      roughness: 0.45,
      metalness: 0.08,
    });

    const goldAccentMaterial = new THREE.MeshStandardMaterial({
      color: 0xc5a059,
      roughness: 0.25,
      metalness: 0.65,
    });

    // --- ANATOMICAL HEAD & FACIAL PLANES ---
    // Cranium / Head base
    const headGeo = new THREE.SphereGeometry(1.05, 64, 64);
    // Deform sphere to create human cranium & jaw proportion
    const pos = headGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      // Narrow cranium laterally
      x *= 0.82;

      // Elongate face downwards
      if (y < 0) {
        y *= 1.18;
      }

      // Taper jaw towards chin
      if (y < -0.1) {
        const factor = Math.max(0.3, 1 + y * 0.55);
        x *= factor;
      }

      // Flatten back of head slightly, protrude nose/front
      if (z > 0.2 && y > -0.4 && y < 0.3) {
        z *= 1.08; // Frontal projection
      }
      if (z < -0.4) {
        z *= 0.95; // Occipital curve
      }

      pos.setXYZ(i, x, y, z);
    }
    headGeo.computeVertexNormals();
    const headMesh = new THREE.Mesh(headGeo, marbleMaterial);
    headMesh.position.y = 0.5;
    bustGroup.add(headMesh);

    // Brow ridge & Forehead volume
    const browGeo = new THREE.CylinderGeometry(0.72, 0.76, 0.28, 32, 1, false, -Math.PI / 2.2, Math.PI * 0.9);
    const browMesh = new THREE.Mesh(browGeo, marbleMaterial);
    browMesh.rotation.z = Math.PI / 2;
    browMesh.position.set(0, 0.72, 0.68);
    bustGroup.add(browMesh);

    // Nose (Anatomical bridge, dorsum & refined tip)
    const noseGeo = new THREE.ConeGeometry(0.19, 0.68, 32);
    const noseMesh = new THREE.Mesh(noseGeo, marbleMaterial);
    noseMesh.position.set(0, 0.44, 1.08);
    noseMesh.rotation.x = 0.22;
    bustGroup.add(noseMesh);

    // Nose tip sphere
    const noseTipGeo = new THREE.SphereGeometry(0.095, 24, 24);
    const noseTipMesh = new THREE.Mesh(noseTipGeo, marbleMaterial);
    noseTipMesh.position.set(0, 0.28, 1.15);
    bustGroup.add(noseTipMesh);

    // Cheekbones (Zygomatic arches Left & Right)
    const cheekGeo = new THREE.SphereGeometry(0.24, 24, 24);
    const cheekLeft = new THREE.Mesh(cheekGeo, marbleMaterial);
    cheekLeft.scale.set(1.1, 0.85, 0.85);
    cheekLeft.position.set(-0.52, 0.36, 0.72);
    bustGroup.add(cheekLeft);

    const cheekRight = new THREE.Mesh(cheekGeo, marbleMaterial);
    cheekRight.scale.set(1.1, 0.85, 0.85);
    cheekRight.position.set(0.52, 0.36, 0.72);
    bustGroup.add(cheekRight);

    // Upper Lip (Cupid's Bow)
    const upperLipGeo = new THREE.TorusGeometry(0.18, 0.055, 16, 32, Math.PI * 0.9);
    const upperLipMesh = new THREE.Mesh(upperLipGeo, marbleMaterial);
    upperLipMesh.position.set(0, 0.06, 0.96);
    upperLipMesh.rotation.x = Math.PI / 1.85;
    upperLipMesh.rotation.z = Math.PI;
    bustGroup.add(upperLipMesh);

    // Lower Lip
    const lowerLipGeo = new THREE.SphereGeometry(0.14, 24, 24);
    const lowerLipMesh = new THREE.Mesh(lowerLipGeo, marbleMaterial);
    lowerLipMesh.scale.set(1.4, 0.55, 0.75);
    lowerLipMesh.position.set(0, -0.06, 0.93);
    bustGroup.add(lowerLipMesh);

    // Chin (Mentalis projection)
    const chinGeo = new THREE.SphereGeometry(0.25, 32, 32);
    const chinMesh = new THREE.Mesh(chinGeo, marbleMaterial);
    chinMesh.scale.set(0.95, 0.85, 1.05);
    chinMesh.position.set(0, -0.38, 0.88);
    bustGroup.add(chinMesh);

    // Jawline & Mandible curve (Left & Right)
    const jawGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.82, 24);
    const jawLeft = new THREE.Mesh(jawGeo, marbleMaterial);
    jawLeft.rotation.z = 0.65;
    jawLeft.rotation.y = -0.4;
    jawLeft.position.set(-0.48, -0.22, 0.35);
    bustGroup.add(jawLeft);

    const jawRight = new THREE.Mesh(jawGeo, marbleMaterial);
    jawRight.rotation.z = -0.65;
    jawRight.rotation.y = 0.4;
    jawRight.position.set(0.48, -0.22, 0.35);
    bustGroup.add(jawRight);

    // Eyes / Orbit aesthetics
    const eyeOrbitGeo = new THREE.SphereGeometry(0.14, 24, 24);
    const eyeLeft = new THREE.Mesh(eyeOrbitGeo, marbleMaterial);
    eyeLeft.scale.set(1.2, 0.6, 0.7);
    eyeLeft.position.set(-0.32, 0.52, 0.82);
    bustGroup.add(eyeLeft);

    const eyeRight = new THREE.Mesh(eyeOrbitGeo, marbleMaterial);
    eyeRight.scale.set(1.2, 0.6, 0.7);
    eyeRight.position.set(0.32, 0.52, 0.82);
    bustGroup.add(eyeRight);

    // Neck & Sternocleidomastoid
    const neckGeo = new THREE.CylinderGeometry(0.42, 0.56, 1.15, 36);
    const neckMesh = new THREE.Mesh(neckGeo, marbleMaterial);
    neckMesh.position.set(0, -0.65, 0.05);
    bustGroup.add(neckMesh);

    // Bust / Shoulders Base
    const shoulderGeo = new THREE.CylinderGeometry(0.65, 1.45, 0.75, 48);
    const shoulderMesh = new THREE.Mesh(shoulderGeo, marbleMaterial);
    shoulderMesh.position.set(0, -1.25, 0);
    bustGroup.add(shoulderMesh);

    // Classical Pedestal Base with Gold Ring
    const pedestalGeo = new THREE.CylinderGeometry(0.85, 0.95, 0.35, 48);
    const pedestalMesh = new THREE.Mesh(pedestalGeo, marblePedestalMaterial);
    pedestalMesh.position.set(0, -1.75, 0);
    bustGroup.add(pedestalMesh);

    const goldRingGeo = new THREE.TorusGeometry(0.88, 0.035, 16, 64);
    const goldRingMesh = new THREE.Mesh(goldRingGeo, goldAccentMaterial);
    goldRingMesh.position.set(0, -1.58, 0);
    goldRingMesh.rotation.x = Math.PI / 2;
    bustGroup.add(goldRingMesh);

    // Render loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (bustGroupRef.current) {
        if (isAutoRotating) {
          bustGroupRef.current.rotation.y += 0.008;
          setRotationY(bustGroupRef.current.rotation.y);
        } else {
          bustGroupRef.current.rotation.y = rotationY;
          bustGroupRef.current.rotation.x = rotationX;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize handling
    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, []);

  // Update rotation when state changes
  useEffect(() => {
    if (bustGroupRef.current && !isAutoRotating) {
      bustGroupRef.current.rotation.y = rotationY;
      bustGroupRef.current.rotation.x = rotationX;
    }
  }, [rotationY, rotationX, isAutoRotating]);

  // Mouse / Touch Interaction on 3D Sculpture & 2D Vector Drawing
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    // Right-click OR rotate tool initiates rotation
    if (e.button === 2 || activeTool === 'rotate') {
      isDraggingRef.current = true;
      setIsAutoRotating(false);
      return;
    }

    // DRAWING MODES (Left-click with drawing tool):
    if (e.button === 0) {
      isDrawingRef.current = true;
      drawStartPosRef.current = { x, y };

      if (activeTool === 'freehand') {
        currentPathRef.current = [{ x, y }];
      } else if (activeTool === 'point') {
        // Create injection point immediately
        const newPt: VectorItem = {
          id: `vec_${Date.now()}`,
          type: 'point',
          color: activeColor,
          startX: x,
          startY: y,
          zoneName: `Bod aplikácie (${Math.round((x / rect.width) * 100)}%, ${Math.round((y / rect.height) * 100)}%)`,
          productName: currentProduct.name,
          lotNumber: currentProduct.lot,
          details: `1 vpich • ${currentProduct.unit}`,
          rotationY
        };
        onVectorsChange([...vectors, newPt]);
        onSelectVector(newPt.id);
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

    // 3D ROTATION DRAG
    if (isDraggingRef.current) {
      const deltaX = e.clientX - lastMousePosRef.current.x;
      const deltaY = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      setRotationY(prev => prev + deltaX * 0.009);
      setRotationX(prev => Math.max(-0.4, Math.min(0.4, prev + deltaY * 0.006)));
      return;
    }

    // VECTOR DRAWING PREVIEW
    if (isDrawingRef.current && drawStartPosRef.current) {
      const startX = drawStartPosRef.current.x;
      const startY = drawStartPosRef.current.y;

      if (activeTool === 'freehand') {
        currentPathRef.current.push({ x, y });
        setTempVector({
          type: 'freehand',
          color: activeColor,
          startX,
          startY,
          points: [...currentPathRef.current],
          rotationY
        });
      } else if (activeTool === 'threads') {
        setTempVector({
          type: 'threads',
          color: activeColor,
          startX,
          startY,
          endX: x,
          endY: y,
          rotationY
        });
      } else if (activeTool === 'fanning') {
        // Compute 5-ray fanning lines
        const angle = Math.atan2(y - startY, x - startX);
        const dist = Math.hypot(x - startX, y - startY);
        const fanSpread = 0.35; // radians spread
        const fanningLines = [-2, -1, 0, 1, 2].map(step => {
          const a = angle + step * (fanSpread / 2);
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
          rotationY
        });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }

    if (!isDrawingRef.current || !drawStartPosRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const startX = drawStartPosRef.current.x;
    const startY = drawStartPosRef.current.y;

    isDrawingRef.current = false;
    setTempVector(null);

    const dist = Math.hypot(x - startX, y - startY);
    if (dist < 8 && activeTool !== 'freehand') return; // Ignore accidental tiny clicks

    if (activeTool === 'threads') {
      const newVec: VectorItem = {
        id: `thread_${Date.now()}`,
        type: 'threads',
        color: activeColor,
        startX,
        startY,
        endX: x,
        endY: y,
        zoneName: `Liftingový vektor nite (Aptos / PDO)`,
        productName: currentProduct.name,
        lotNumber: currentProduct.lot,
        details: `Vektor trakcie • Dĺžka ~${Math.round(dist / 4)}mm`,
        rotationY
      };
      onVectorsChange([...vectors, newVec]);
      onSelectVector(newVec.id);
    } else if (activeTool === 'fanning') {
      const angle = Math.atan2(y - startY, x - startX);
      const fanSpread = 0.35;
      const fanningLines = [-2, -1, 0, 1, 2].map(step => {
        const a = angle + step * (fanSpread / 2);
        return {
          x: startX + Math.cos(a) * dist,
          y: startY + Math.sin(a) * dist
        };
      });

      const newVec: VectorItem = {
        id: `fan_${Date.now()}`,
        type: 'fanning',
        color: activeColor,
        startX,
        startY,
        endX: x,
        endY: y,
        fanningLines,
        zoneName: `Kanylový vejár (Sculptra / Radiesse)`,
        productName: currentProduct.name,
        lotNumber: currentProduct.lot,
        details: `5-lúčový kanylový vejár • Objem ~0.5ml`,
        rotationY
      };
      onVectorsChange([...vectors, newVec]);
      onSelectVector(newVec.id);
    } else if (activeTool === 'freehand' && currentPathRef.current.length > 2) {
      const newVec: VectorItem = {
        id: `draw_${Date.now()}`,
        type: 'freehand',
        color: activeColor,
        startX,
        startY,
        points: [...currentPathRef.current],
        zoneName: `Chirurgické zameranie / Zóna ošetrenia`,
        productName: currentProduct.name,
        lotNumber: currentProduct.lot,
        details: `Voľná anatomická kresba (${currentPathRef.current.length} bodov)`,
        rotationY
      };
      onVectorsChange([...vectors, newVec]);
      onSelectVector(newVec.id);
    }

    currentPathRef.current = [];
    drawStartPosRef.current = null;
  };

  // Redraw 2D Vectors & Threads overlay on canvas
  const drawVectors = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allToDraw = [...vectors];
    if (tempVector) {
      allToDraw.push(tempVector as VectorItem);
    }

    allToDraw.forEach(item => {
      const isSelected = item.id === selectedVectorId;
      ctx.save();

      // THREADS (Liftingová niť s ostňami a smerovou šípkou)
      if (item.type === 'threads' && item.endX !== undefined && item.endY !== undefined) {
        const { startX, startY, endX, endY, color } = item;
        const dist = Math.hypot(endX - startX, endY - startY);
        const angle = Math.atan2(endY - startY, endX - startX);

        // Main thread line
        ctx.strokeStyle = color;
        ctx.lineWidth = isSelected ? 4 : 2.5;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Trocar / Entry Point (Vstupný bod ihly)
        ctx.fillStyle = '#2C2A29';
        ctx.beginPath();
        ctx.arc(startX, startY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(startX, startY, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Barbs / Ostne nite pozdĺž línie
        const numBarbs = Math.floor(dist / 22);
        for (let i = 1; i <= numBarbs; i++) {
          const t = i / (numBarbs + 1);
          const bx = startX + (endX - startX) * t;
          const by = startY + (endY - startY) * t;
          const barbLen = 7;
          const barbAngle = angle + Math.PI - 0.55;

          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + Math.cos(barbAngle) * barbLen, by + Math.sin(barbAngle) * barbLen);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Opposing barb
          const barbAngle2 = angle + Math.PI + 0.55;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + Math.cos(barbAngle2) * barbLen, by + Math.sin(barbAngle2) * barbLen);
          ctx.stroke();
        }

        // Direction Arrow Head at End Point (Kotva)
        const arrowLen = 12;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - Math.cos(angle - 0.45) * arrowLen,
          endY - Math.sin(angle - 0.45) * arrowLen
        );
        ctx.lineTo(
          endX - Math.cos(angle + 0.45) * arrowLen,
          endY - Math.sin(angle + 0.45) * arrowLen
        );
        ctx.closePath();
        ctx.fill();
      }

      // FANNING (Kanylový vejár Sculptra / Radiesse)
      else if (item.type === 'fanning' && item.fanningLines) {
        const { startX, startY, color, fanningLines } = item;

        // Entry Puncture Hole
        ctx.fillStyle = '#2C2A29';
        ctx.beginPath();
        ctx.arc(startX, startY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#C5A059';
        ctx.beginPath();
        ctx.arc(startX, startY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Shaded coverage polygon
        if (fanningLines.length > 0) {
          ctx.fillStyle = `${color}22`; // 15% opacity tint
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          fanningLines.forEach(pt => ctx.lineTo(pt.x, pt.y));
          ctx.closePath();
          ctx.fill();
        }

        // Individual cannula rays
        fanningLines.forEach(pt => {
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(pt.x, pt.y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Ray tip bead
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // POINT (Mikrovpich / Bolus)
      else if (item.type === 'point') {
        const { startX, startY, color } = item;
        ctx.fillStyle = `${color}44`;
        ctx.beginPath();
        ctx.arc(startX, startY, isSelected ? 12 : 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(startX, startY, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // FREEHAND (Voľné kreslenie)
      else if (item.type === 'freehand' && item.points && item.points.length > 1) {
        ctx.strokeStyle = item.color;
        ctx.lineWidth = isSelected ? 4 : 2.5;
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

  // Quick Camera Angle Presets
  const setCameraView = (angleRadY: number, angleRadX = 0) => {
    setIsAutoRotating(false);
    setRotationY(angleRadY);
    setRotationX(angleRadX);
  };

  return (
    <div className="flex flex-col items-center w-full space-y-4">
      {/* 3D SCULPTURE CANVAS CONTAINER */}
      <div className="relative w-full max-w-[440px] aspect-[4/5] rounded-3xl overflow-hidden border border-[#E8E2D9] shadow-2xl bg-gradient-to-b from-[#FAF8F5] via-[#F4EEE6] to-[#E9E1D5] select-none group">
        
        {/* 1. THREE.JS 3D WEBGL BUST MOUNT */}
        <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* 2. 2D INTERACTIVE DRAWING & VECTOR LAYER */}
        <canvas
          ref={canvasRef}
          width={440}
          height={550}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onContextMenu={(e) => e.preventDefault()}
          className={`absolute inset-0 w-full h-full z-20 ${
            activeTool === 'rotate' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
          }`}
        />

        {/* ANATOMICKÁ SMEROVÁ RUŽICA & UHOL POHĽADU */}
        <div className="absolute top-4 left-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/85 backdrop-blur-md border border-white/80 shadow-sm text-[11px] font-bold text-[#2C2A29] pointer-events-none">
          <Compass className="w-3.5 h-3.5 text-[#C5A059] animate-spin-slow" />
          <span>
            {Math.abs(rotationY) < 0.2
              ? 'Čelný pohľad (0°)'
              : rotationY > 0.3 && rotationY < 1.1
              ? 'Pravý poloprofil (+45°)'
              : rotationY >= 1.1
              ? 'Pravý profil (+90°)'
              : rotationY < -0.3 && rotationY > -1.1
              ? 'Ľavý poloprofil (-45°)'
              : 'Ľavý profil (-90°)'}
          </span>
        </div>

        {/* PREPÍNAČE UHLOV KAMERY */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 p-1 rounded-2xl bg-white/90 backdrop-blur-md border border-white/90 shadow-md">
          <button
            type="button"
            onClick={() => setCameraView(-Math.PI / 2)}
            className="px-2.5 py-1 rounded-xl text-[10px] font-bold hover:bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] transition-all"
            title="Ľavý profil (-90°)"
          >
            Ľ. profil
          </button>
          <button
            type="button"
            onClick={() => setCameraView(-Math.PI / 4)}
            className="px-2.5 py-1 rounded-xl text-[10px] font-bold hover:bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] transition-all"
            title="Ľavý poloprofil (-45°)"
          >
            -45°
          </button>
          <button
            type="button"
            onClick={() => setCameraView(0, 0)}
            className="px-3 py-1 rounded-xl text-[10px] font-bold bg-[#2C2A29] text-white shadow-xs"
            title="Čelný pohľad (0°)"
          >
            Čelný (0°)
          </button>
          <button
            type="button"
            onClick={() => setCameraView(Math.PI / 4)}
            className="px-2.5 py-1 rounded-xl text-[10px] font-bold hover:bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] transition-all"
            title="Pravý poloprofil (+45°)"
          >
            +45°
          </button>
          <button
            type="button"
            onClick={() => setCameraView(Math.PI / 2)}
            className="px-2.5 py-1 rounded-xl text-[10px] font-bold hover:bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] transition-all"
            title="Pravý profil (+90°)"
          >
            P. profil
          </button>
          <button
            type="button"
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`p-1.5 rounded-xl transition-all ${
              isAutoRotating ? 'bg-[#C5A059] text-white' : 'text-[#8C857B] hover:text-[#2C2A29]'
            }`}
            title="Prezentácia / Auto-rotácia 3D sochy"
          >
            <RotateCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* NÁSTROJOVÝ PANEL (DRAWING TOOLBAR) */}
      <div className="w-full max-w-[440px] flex flex-col gap-3 p-3.5 rounded-3xl bg-white/90 backdrop-blur-2xl border border-[#E8E2D9] shadow-sm">
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
            <span>Sculptra vejár</span>
          </button>

          {/* NÁSTROJ: MIKROVPICH / BOTOX */}
          <button
            type="button"
            onClick={() => onSelectTool('point')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTool === 'point'
                ? 'bg-[#3B82F6] text-white shadow-md'
                : 'bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] border border-[#E8E2D9]'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-current" />
            <span>Mikrovpich</span>
          </button>

          {/* NÁSTROJ: VOĽNÉ KRESLENIE */}
          <button
            type="button"
            onClick={() => onSelectTool('freehand')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTool === 'freehand'
                ? 'bg-[#2C2A29] text-white shadow-md'
                : 'bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] border border-[#E8E2D9]'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Voľný marker</span>
          </button>
        </div>

        {/* VÝBER FARBY & AKCIE (UNDO, CLEAR) */}
        <div className="flex items-center justify-between pt-2 border-t border-[#E8E2D9]/70">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-[#8C857B]">Farba línie:</span>
            {[
              { color: '#C5A059', name: 'Zlatá (Sculptra / SAY)' },
              { color: '#8B5CF6', name: 'Fialová (Aptos nite)' },
              { color: '#3B82F6', name: 'Modrá (Botox)' },
              { color: '#EC4899', name: 'Ružová (Kys. hyalurónová)' },
              { color: '#10B981', name: 'Zelená (Bioremodelácia)' },
              { color: '#2C2A29', name: 'Čierna (Operačný marker)' },
            ].map(c => (
              <button
                key={c.color}
                type="button"
                onClick={() => onSelectColor(c.color)}
                style={{ backgroundColor: c.color }}
                className={`w-5 h-5 rounded-full transition-transform ${
                  activeColor === c.color ? 'scale-125 ring-2 ring-offset-2 ring-[#C5A059]' : 'hover:scale-110'
                }`}
                title={c.name}
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
              className="p-1.5 rounded-xl hover:bg-gray-100 text-[#8C857B] text-xs flex items-center gap-1"
              title="Krok späť (Undo)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onVectorsChange([])}
              className="p-1.5 rounded-xl hover:bg-red-50 text-red-500 text-xs flex items-center gap-1"
              title="Vymazať všetky kresby a vektory"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
