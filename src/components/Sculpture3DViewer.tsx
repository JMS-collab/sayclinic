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
  Maximize2,
  Camera,
  Layers
} from 'lucide-react';

export type DrawingToolType = 'threads' | 'fanning' | 'point' | 'freehand' | 'rotate';

export interface VectorPoint3D {
  x: number;
  y: number;
  z: number;
}

export interface VectorItem {
  id: string;
  type: 'threads' | 'fanning' | 'point' | 'freehand';
  color: string;
  start3D?: VectorPoint3D;
  end3D?: VectorPoint3D;
  points3D?: VectorPoint3D[];
  fanningLines3D?: VectorPoint3D[];
  // Legacy / 2D screen coordinates for fallback
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  zoneName: string;
  productName: string;
  lotNumber: string;
  details: string;
  rotationY?: number;
  createdAt?: string;
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
  onSnapshot?: (dataUrl: string) => void;
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
  onSelectVector,
  onSnapshot
}: Sculpture3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Three.js Core Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const headGroupRef = useRef<THREE.Group | null>(null);
  const faceMeshRef = useRef<THREE.Mesh | null>(null);
  const vectorsGroupRef = useRef<THREE.Group | null>(null);
  const previewGroupRef = useRef<THREE.Group | null>(null);

  // Rotation & Camera physics
  const rotationStateRef = useRef({
    currentY: 0,
    targetY: 0,
    currentX: 0,
    targetX: 0,
    isAutoRotating: false,
    zoom: 5.0
  });

  const [displayRotationY, setDisplayRotationY] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [activeZoneHover, setActiveZoneHover] = useState<string | null>(null);

  // Pointer Interaction state
  const isDraggingRotationRef = useRef(false);
  const isDrawingRef = useRef(false);
  const lastPointerPosRef = useRef({ x: 0, y: 0 });
  const drawStart3DRef = useRef<VectorPoint3D | null>(null);
  const currentPath3DRef = useRef<VectorPoint3D[]>([]);

  // Smooth Gaussian bell helper for anatomical sculpting
  const gaussian = (x: number, y: number, cx: number, cy: number, sx: number, sy: number) => {
    const dx = (x - cx) / sx;
    const dy = (y - cy) / sy;
    return Math.exp(-(dx * dx + dy * dy));
  };

  // Helper to create a harmonious, realistic female face & bust
  const createHarmoniousFemaleBust = (): THREE.Group => {
    const group = new THREE.Group();

    // 1. High-Density Parametric Female Face & Head Mesh
    const faceGeo = new THREE.SphereGeometry(1.2, 100, 100);
    const pos = faceGeo.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i);

      let x = vertex.x;
      let y = vertex.y;
      let z = vertex.z;

      // Base feminine oval ratio (slender, graceful proportions)
      x *= 0.82;
      z *= 0.88;

      // Forehead & Cranium: Soft feminine curve
      if (y > 0.45) {
        z += Math.sin((y - 0.45) * 2.2) * 0.06;
      }

      // Temple softening
      if (y > 0.25 && y < 0.65 && Math.abs(x) > 0.48 && z > 0.1) {
        x *= 0.96;
        z -= 0.04;
      }

      // Supraorbital / Brow arch (delicate feminine arch, not prominent)
      if (y > 0.28 && y < 0.44 && Math.abs(x) < 0.55 && z > 0.45) {
        const browArch = gaussian(Math.abs(x), y, 0.32, 0.36, 0.22, 0.1) * 0.05;
        z += browArch;
      }

      // Feminine Eye Orbits (Almond shape recess)
      if (y > 0.12 && y < 0.36 && Math.abs(x) > 0.18 && Math.abs(x) < 0.62 && z > 0.3) {
        const eyeRecess = gaussian(Math.abs(x), y, 0.38, 0.24, 0.18, 0.12) * 0.22;
        z -= eyeRecess;
      }

      // Feminine High Cheekbones (Zygoma - elegant lift & soft taper)
      if (y > -0.08 && y < 0.32 && Math.abs(x) > 0.32 && Math.abs(x) < 0.82 && z > 0.15) {
        const cheekLift = gaussian(Math.abs(x), y, 0.48, 0.12, 0.22, 0.18) * 0.16;
        z += cheekLift;
        x += Math.sign(x) * cheekLift * 0.18;
      }

      // Refined Feminine Nose (slender bridge, delicate upturned tip)
      if (y > -0.22 && y < 0.38 && Math.abs(x) < 0.26 && z > 0.35) {
        // Slender dorsal aesthetic line
        const noseNorm = (y + 0.22) / 0.6;
        const bridgeWidth = 0.11 + (1 - noseNorm) * 0.05;
        if (Math.abs(x) < bridgeWidth * 2) {
          const bridgeHeight = Math.cos((Math.abs(x) / (bridgeWidth * 2)) * (Math.PI / 2)) * (0.24 - noseNorm * 0.04);
          z += bridgeHeight;
        }

        // Delicate nasal tip definition (supratip break & rotation)
        const tipBulb = gaussian(x, y, 0, -0.04, 0.09, 0.08) * 0.14;
        z += tipBulb;
        if (y > -0.06 && y < 0.02 && Math.abs(x) < 0.08) {
          y += 0.02; // slight feminine nasal tip elevation
        }

        // Alar base (delicate nostrils)
        const alar = gaussian(Math.abs(x), y, 0.12, -0.1, 0.07, 0.06) * 0.06;
        z += alar;
      }

      // Feminine Lips & Cupid's Bow
      if (y > -0.48 && y < -0.12 && Math.abs(x) < 0.38 && z > 0.45) {
        // Upper lip & Philtrum
        if (y > -0.32) {
          const upperLip = gaussian(Math.abs(x), y, 0.14, -0.23, 0.16, 0.08) * 0.12;
          const cupidIndent = gaussian(x, y, 0, -0.21, 0.05, 0.06) * 0.04;
          z += upperLip - cupidIndent;
        }
        // Lower lip (plump, central fullness)
        if (y <= -0.26 && y > -0.44) {
          const lowerLip = gaussian(Math.abs(x), y, 0.1, -0.34, 0.18, 0.09) * 0.13;
          z += lowerLip;
        }
      }

      // Labiomental sulcus (soft crease below lower lip)
      if (y > -0.56 && y < -0.44 && Math.abs(x) < 0.28 && z > 0.45) {
        z -= 0.06;
      }

      // Feminine Chin (delicate, slightly projected, rounded V-line)
      if (y > -0.95 && y < -0.52 && Math.abs(x) < 0.42 && z > 0.15) {
        const chin = gaussian(x, y, 0, -0.72, 0.24, 0.16) * 0.16;
        z += chin;
        y -= 0.04;
      }

      // Jawline Tapering (V-Shape / Slender jaw contour)
      if (y < -0.1) {
        const jawFactor = Math.max(0.55, 1.0 + (y + 0.1) * 0.45);
        x *= jawFactor;
      }

      // Occipital back of head shaping
      if (z < -0.2) {
        z *= 0.94;
      }

      pos.setXYZ(i, x, y, z);
    }

    faceGeo.computeVertexNormals();

    // High-end warm porcelain / skin aesthetic material
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xFDF8F3,
      roughness: 0.32,
      metalness: 0.04,
      wireframe: false,
    });

    const faceMesh = new THREE.Mesh(faceGeo, skinMaterial);
    faceMesh.position.y = 0.55;
    faceMesh.name = 'female_face_mesh';
    faceMeshRef.current = faceMesh;
    group.add(faceMesh);

    // 2. Sculpted Feminine Hair Updo (elegant classical frame)
    const hairGeo = new THREE.SphereGeometry(1.26, 64, 48);
    const hairPos = hairGeo.attributes.position;
    const hVert = new THREE.Vector3();
    for (let i = 0; i < hairPos.count; i++) {
      hVert.fromBufferAttribute(hairPos, i);
      let hx = hVert.x * 0.86;
      let hy = hVert.y * 1.02;
      let hz = hVert.z * 0.92;

      // Hair bun / volume on crown and back
      if (hy > 0.4 || hz < -0.1) {
        hz -= 0.08;
        hy += 0.06;
      }
      // Hair strands waves
      const wave = Math.sin(hy * 12 + hx * 8) * 0.015;
      hx += wave;
      hz += wave;

      hairPos.setXYZ(i, hx, hy, hz);
    }
    hairGeo.computeVertexNormals();

    const hairMaterial = new THREE.MeshStandardMaterial({
      color: 0x4A3E39,
      roughness: 0.72,
      metalness: 0.12,
    });
    const hairMesh = new THREE.Mesh(hairGeo, hairMaterial);
    hairMesh.position.set(0, 0.62, -0.06);
    hairMesh.scale.set(1.02, 1.02, 1.02);
    group.add(hairMesh);

    // 3. Delicate Ears (Left & Right)
    const earGeo = new THREE.TorusGeometry(0.20, 0.06, 16, 32, Math.PI * 1.2);
    const earL = new THREE.Mesh(earGeo, skinMaterial);
    earL.position.set(-0.90, 0.45, -0.08);
    earL.rotation.y = -Math.PI / 4.2;
    earL.rotation.z = Math.PI / 9;
    group.add(earL);

    const earR = new THREE.Mesh(earGeo, skinMaterial);
    earR.position.set(0.90, 0.45, -0.08);
    earR.rotation.y = Math.PI / 4.2;
    earR.rotation.z = -Math.PI / 9;
    group.add(earR);

    // 4. Slender Feminine Neck & Sternocleidomastoid
    const neckGeo = new THREE.CylinderGeometry(0.46, 0.64, 1.35, 48);
    const neckMesh = new THREE.Mesh(neckGeo, skinMaterial);
    neckMesh.position.set(0, -0.65, -0.05);
    group.add(neckMesh);

    // 5. Clavicles & Graceful Décolleté
    const decolleteGeo = new THREE.CylinderGeometry(0.72, 1.65, 0.85, 64);
    const decolleteMesh = new THREE.Mesh(decolleteGeo, skinMaterial);
    decolleteMesh.position.set(0, -1.42, -0.06);
    group.add(decolleteMesh);

    // 6. Classical Pedestal with Rose-Gold Trim
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0xEEE7DF,
      roughness: 0.45,
      metalness: 0.08,
    });
    const pedestalGeo = new THREE.CylinderGeometry(1.15, 1.30, 0.38, 64);
    const pedestalMesh = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestalMesh.position.set(0, -1.95, -0.06);
    group.add(pedestalMesh);

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xC5A059,
      roughness: 0.22,
      metalness: 0.85,
    });
    const goldRingGeo = new THREE.TorusGeometry(1.18, 0.035, 16, 64);
    const goldRingMesh = new THREE.Mesh(goldRingGeo, goldMat);
    goldRingMesh.position.set(0, -1.76, -0.06);
    goldRingMesh.rotation.x = Math.PI / 2;
    group.add(goldRingMesh);

    return group;
  };

  // Convert 3D Point on Face Mesh to Anatomical Zone Name
  const getZoneFrom3DPoint = (p3d: VectorPoint3D): string => {
    const { x, y } = p3d;
    if (y > 0.85) {
      return Math.abs(x) < 0.25 ? 'Čelo - m. frontalis (Stred)' : x < 0 ? 'Čelo Ľavé / Temporálna fassa' : 'Čelo Pravé / Temporálna fassa';
    } else if (y > 0.65 && y <= 0.85) {
      if (Math.abs(x) < 0.18) return 'Glabela (Vráska hnevu - m. procerus / corrugator)';
      return x < 0 ? 'Periorbitálna zóna Ľ (Vejáriky)' : 'Periorbitálna zóna P (Vejáriky)';
    } else if (y > 0.40 && y <= 0.65) {
      if (Math.abs(x) < 0.15) return 'Nos - Chrbát a hrot nosa';
      return x < 0 ? 'Zygomatická oblasť / Líce Ľ (Vektor)' : 'Zygomatická oblasť / Líce P (Vektor)';
    } else if (y > 0.15 && y <= 0.40) {
      if (Math.abs(x) < 0.25) return 'Nasolabiálna ryha & Pery (Vermilion / Kontúra)';
      return x < 0 ? 'Bukálna / Lícna oblasť Ľ' : 'Bukálna / Lícna oblasť P';
    } else if (y > -0.15 && y <= 0.15) {
      if (Math.abs(x) < 0.22) return 'Brada (m. mentalis) & Marionetové vrásky';
      return x < 0 ? 'Mandibulárna línia Ľ (Sánka)' : 'Mandibulárna línia P (Sánka)';
    } else {
      return 'Submentálna & Krčná zóna (Platysma)';
    }
  };

  // Raycast helper to find 3D point on face in local head coordinates
  const getIntersection3D = (clientX: number, clientY: number): { point: VectorPoint3D; normal: THREE.Vector3 } | null => {
    if (!mountRef.current || !cameraRef.current || !faceMeshRef.current || !headGroupRef.current) return null;

    const rect = mountRef.current.getBoundingClientRect();
    const mouseX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

    const intersects = raycaster.intersectObject(faceMeshRef.current, false);
    if (intersects.length > 0) {
      const hit = intersects[0];
      // Convert hit point to headGroup local coordinate space
      const localPoint = headGroupRef.current.worldToLocal(hit.point.clone());
      
      // Calculate local normal
      const normal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 0, 1);
      
      return {
        point: { x: localPoint.x, y: localPoint.y, z: localPoint.z },
        normal
      };
    }
    return null;
  };

  // Re-build all 3D Vector Visualizations in Three.js Scene
  const update3DVectorMeshes = useCallback(() => {
    const vectorsGroup = vectorsGroupRef.current;
    if (!vectorsGroup) return;

    // Clear previous vector meshes
    while (vectorsGroup.children.length > 0) {
      const obj = vectorsGroup.children[0];
      vectorsGroup.remove(obj);
      if (obj instanceof THREE.Mesh) {
        if (obj.geometry) obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else if (obj.material) obj.material.dispose();
      }
    }

    vectors.forEach((item) => {
      const isSelected = item.id === selectedVectorId;
      const itemColor = new THREE.Color(item.color || '#C5A059');
      const highlightColor = isSelected ? new THREE.Color('#FFFFFF') : itemColor;

      // 1. APTOS / PDO LIFTING THREAD (3D Curved Tube with 3D Conical Barbs & Traction Arrow)
      if (item.type === 'threads' && item.start3D && item.end3D) {
        const p1 = new THREE.Vector3(item.start3D.x, item.start3D.y, item.start3D.z);
        const p2 = new THREE.Vector3(item.end3D.x, item.end3D.y, item.end3D.z);
        
        // Midpoint arch slightly outwards to hug 3D skin surface
        const mid = p1.clone().add(p2).multiplyScalar(0.5);
        const normalOffset = new THREE.Vector3(mid.x * 0.12, 0, Math.max(0.04, mid.z * 0.12));
        mid.add(normalOffset);

        const curve = new THREE.CatmullRomCurve3([p1, mid, p2]);
        const tubeGeo = new THREE.TubeGeometry(curve, 24, isSelected ? 0.024 : 0.016, 8, false);
        const tubeMat = new THREE.MeshStandardMaterial({
          color: highlightColor,
          emissive: itemColor,
          emissiveIntensity: isSelected ? 0.6 : 0.3,
          roughness: 0.3,
          metalness: 0.4
        });
        const threadMesh = new THREE.Mesh(tubeGeo, tubeMat);
        vectorsGroup.add(threadMesh);

        // Insertion anchor ring / sphere at start
        const anchorGeo = new THREE.SphereGeometry(isSelected ? 0.045 : 0.035, 16, 16);
        const anchorMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, metalness: 0.8, roughness: 0.2 });
        const anchorMesh = new THREE.Mesh(anchorGeo, anchorMat);
        anchorMesh.position.copy(p1);
        vectorsGroup.add(anchorMesh);

        // 3D Barbs along thread (Bi-directional)
        const numBarbs = Math.max(4, Math.floor(p1.distanceTo(p2) * 12));
        const barbGeo = new THREE.ConeGeometry(0.016, 0.05, 8);
        const barbMat = new THREE.MeshStandardMaterial({ color: itemColor, roughness: 0.3 });

        for (let b = 1; b <= numBarbs; b++) {
          const t = b / (numBarbs + 1);
          const barbPos = curve.getPoint(t);
          const tangent = curve.getTangent(t);

          const barbMesh = new THREE.Mesh(barbGeo, barbMat);
          barbMesh.position.copy(barbPos);
          
          // Rotate cone towards traction
          const rotMatrix = new THREE.Matrix4();
          rotMatrix.lookAt(new THREE.Vector3(), tangent, new THREE.Vector3(0, 1, 0));
          barbMesh.quaternion.setFromRotationMatrix(rotMatrix);
          barbMesh.rotation.z += (b % 2 === 0 ? 0.5 : -0.5);
          vectorsGroup.add(barbMesh);
        }

        // Terminal Traction Arrow Cone
        const arrowGeo = new THREE.ConeGeometry(0.045, 0.10, 12);
        const arrowMat = new THREE.MeshStandardMaterial({ color: itemColor, roughness: 0.2, metalness: 0.5 });
        const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
        arrowMesh.position.copy(p2);
        const endTangent = curve.getTangent(1);
        const rotMatrix = new THREE.Matrix4();
        rotMatrix.lookAt(new THREE.Vector3(), endTangent, new THREE.Vector3(0, 1, 0));
        arrowMesh.quaternion.setFromRotationMatrix(rotMatrix);
        arrowMesh.rotateX(Math.PI / 2);
        vectorsGroup.add(arrowMesh);

      // 2. SCULPTRA / RADIESSE 5-RAY FANNING (3D Translucent Medicine Veil & 3D Cannula Rays)
      } else if (item.type === 'fanning' && item.start3D && item.fanningLines3D && item.fanningLines3D.length > 0) {
        const startP = new THREE.Vector3(item.start3D.x, item.start3D.y, item.start3D.z);

        // Cannula puncture entry sphere
        const entryGeo = new THREE.SphereGeometry(isSelected ? 0.05 : 0.038, 16, 16);
        const entryMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.2, metalness: 0.7 });
        const entryMesh = new THREE.Mesh(entryGeo, entryMat);
        entryMesh.position.copy(startP);
        vectorsGroup.add(entryMesh);

        // 3D Rays
        const fanRayPoints: THREE.Vector3[] = [];
        item.fanningLines3D.forEach((rayP3D) => {
          const rayP = new THREE.Vector3(rayP3D.x, rayP3D.y, rayP3D.z);
          fanRayPoints.push(rayP);

          const midP = startP.clone().add(rayP).multiplyScalar(0.5);
          midP.z += 0.03; // Hug 3D face

          const curve = new THREE.CatmullRomCurve3([startP, midP, rayP]);
          const rayGeo = new THREE.TubeGeometry(curve, 16, isSelected ? 0.018 : 0.012, 8, false);
          const rayMat = new THREE.MeshStandardMaterial({
            color: itemColor,
            emissive: itemColor,
            emissiveIntensity: 0.4,
            roughness: 0.3
          });
          const rayMesh = new THREE.Mesh(rayGeo, rayMat);
          vectorsGroup.add(rayMesh);

          // Ray tip sphere (micro-droplet)
          const dropGeo = new THREE.SphereGeometry(0.026, 12, 12);
          const dropMat = new THREE.MeshStandardMaterial({ color: itemColor, roughness: 0.2 });
          const dropMesh = new THREE.Mesh(dropGeo, dropMat);
          dropMesh.position.copy(rayP);
          vectorsGroup.add(dropMesh);
        });

        // Translucent Fan Polygonal Surface Mesh
        if (fanRayPoints.length >= 2) {
          const fanGeo = new THREE.BufferGeometry();
          const vertices: number[] = [];
          
          for (let f = 0; f < fanRayPoints.length - 1; f++) {
            // Triangle: startP -> ray[f] -> ray[f+1]
            vertices.push(startP.x, startP.y, startP.z + 0.01);
            vertices.push(fanRayPoints[f].x, fanRayPoints[f].y, fanRayPoints[f].z + 0.01);
            vertices.push(fanRayPoints[f + 1].x, fanRayPoints[f + 1].y, fanRayPoints[f + 1].z + 0.01);
          }

          fanGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
          fanGeo.computeVertexNormals();

          const fanMat = new THREE.MeshStandardMaterial({
            color: itemColor,
            transparent: true,
            opacity: isSelected ? 0.45 : 0.25,
            side: THREE.DoubleSide,
            roughness: 0.4
          });
          const fanMesh = new THREE.Mesh(fanGeo, fanMat);
          vectorsGroup.add(fanMesh);
        }

      // 3. BOTOX / FILLER MICRO-INJECTION POINT (3D Glowing Sphere & Concentric Ring)
      } else if (item.type === 'point' && item.start3D) {
        const ptPos = new THREE.Vector3(item.start3D.x, item.start3D.y, item.start3D.z);

        const ptGeo = new THREE.SphereGeometry(isSelected ? 0.05 : 0.038, 16, 16);
        const ptMat = new THREE.MeshStandardMaterial({
          color: highlightColor,
          emissive: itemColor,
          emissiveIntensity: isSelected ? 0.8 : 0.4,
          roughness: 0.2,
          metalness: 0.6
        });
        const ptMesh = new THREE.Mesh(ptGeo, ptMat);
        ptMesh.position.copy(ptPos);
        vectorsGroup.add(ptMesh);

        // Concentric outer aura ring
        const ringGeo = new THREE.TorusGeometry(isSelected ? 0.075 : 0.06, 0.008, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: itemColor, transparent: true, opacity: 0.8 });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.copy(ptPos);
        ringMesh.position.z += 0.01;
        vectorsGroup.add(ringMesh);

      // 4. FREEHAND SURGICAL MARKER LINE (3D Smooth Curve following face surface)
      } else if (item.type === 'freehand' && item.points3D && item.points3D.length > 1) {
        const pts = item.points3D.map(p => new THREE.Vector3(p.x, p.y, p.z + 0.01));
        const curve = new THREE.CatmullRomCurve3(pts);
        const lineGeo = new THREE.TubeGeometry(curve, pts.length * 4, isSelected ? 0.02 : 0.014, 6, false);
        const lineMat = new THREE.MeshStandardMaterial({
          color: highlightColor,
          emissive: itemColor,
          emissiveIntensity: 0.3,
          roughness: 0.5
        });
        const lineMesh = new THREE.Mesh(lineGeo, lineMat);
        vectorsGroup.add(lineMesh);
      }
    });
  }, [vectors, selectedVectorId]);

  // Initialize Three.js WebGL Scene
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 460;
    const height = mountRef.current.clientHeight || 575;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
    camera.position.set(0, 0.12, rotationStateRef.current.zoom);
    cameraRef.current = camera;

    // 3. WebGL Renderer with ACES Tone Mapping
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Studio Clinical Lighting
    const ambientLight = new THREE.AmbientLight(0xFFFBF5, 1.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xFFF6EA, 2.5);
    keyLight.position.set(4, 5, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xDEECFF, 1.6);
    fillLight.position.set(-5, 2, 4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xC5A059, 2.2);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    const bottomSoft = new THREE.DirectionalLight(0xFDF2E7, 1.0);
    bottomSoft.position.set(0, -4, 2);
    scene.add(bottomSoft);

    // 5. Build Female Bust & Add Vector Container Group
    const headGroup = createHarmoniousFemaleBust();
    headGroupRef.current = headGroup;

    const vectorsGroup = new THREE.Group();
    vectorsGroup.name = 'vectors_3d_group';
    vectorsGroupRef.current = vectorsGroup;
    headGroup.add(vectorsGroup);

    const previewGroup = new THREE.Group();
    previewGroup.name = 'preview_3d_group';
    previewGroupRef.current = previewGroup;
    headGroup.add(previewGroup);

    scene.add(headGroup);

    // 6. Smooth 60 FPS Render Loop
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const state = rotationStateRef.current;

      if (state.isAutoRotating) {
        state.targetY += 0.45 * delta;
        state.currentY = state.targetY;
      } else {
        state.currentY += (state.targetY - state.currentY) * 0.18;
        state.currentX += (state.targetX - state.currentX) * 0.18;
      }

      if (headGroupRef.current) {
        headGroupRef.current.rotation.y = state.currentY;
        headGroupRef.current.rotation.x = state.currentX;
      }

      setDisplayRotationY(state.currentY);
      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    // 7. Responsive Resize
    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const w = mountRef.current.clientWidth || 460;
      const h = mountRef.current.clientHeight || 575;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mountRef.current);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  // Update vectors in 3D whenever vector list or selected vector changes
  useEffect(() => {
    update3DVectorMeshes();
  }, [update3DVectorMeshes]);

  // Wireframe toggle effect
  useEffect(() => {
    if (headGroupRef.current) {
      headGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.name === 'female_face_mesh') {
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.wireframe = wireframeMode;
          }
        }
      });
    }
  }, [wireframeMode]);

  // Toggle Auto-Rotation
  const toggleAutoRotate = () => {
    const nextState = !rotationStateRef.current.isAutoRotating;
    rotationStateRef.current.isAutoRotating = nextState;
    setIsAutoRotating(nextState);
  };

  // Preset Angle Buttons
  const setPresetAngle = (targetRadY: number, targetRadX = 0) => {
    rotationStateRef.current.isAutoRotating = false;
    setIsAutoRotating(false);
    rotationStateRef.current.targetY = targetRadY;
    rotationStateRef.current.targetX = targetRadX;
  };

  // Zoom control
  const handleZoom = (delta: number) => {
    const newZoom = Math.max(3.6, Math.min(6.8, rotationStateRef.current.zoom + delta));
    rotationStateRef.current.zoom = newZoom;
    if (cameraRef.current) {
      cameraRef.current.position.z = newZoom;
    }
  };

  // Snapshot generator
  const handleTakeSnapshot = () => {
    if (rendererRef.current && onSnapshot) {
      const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
      onSnapshot(dataUrl);
    }
  };

  // Clear live preview meshes
  const clearPreviewMesh = () => {
    const pGroup = previewGroupRef.current;
    if (!pGroup) return;
    while (pGroup.children.length > 0) {
      const c = pGroup.children[0];
      pGroup.remove(c);
      if (c instanceof THREE.Mesh) {
        if (c.geometry) c.geometry.dispose();
        if (c.material) c.material.dispose();
      }
    }
  };

  // Pointer Down (Mouse / Touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };

    // ROTATE MODE (or Right Mouse Click)
    if (e.button === 2 || activeTool === 'rotate') {
      isDraggingRotationRef.current = true;
      rotationStateRef.current.isAutoRotating = false;
      setIsAutoRotating(false);
      return;
    }

    // DRAWING MODE (Left Click on 3D Face)
    if (e.button === 0) {
      const hit = getIntersection3D(e.clientX, e.clientY);
      if (!hit) return;

      const p3d = hit.point;
      const zone = getZoneFrom3DPoint(p3d);

      if (activeTool === 'point') {
        // Immediate creation of 3D Injection Point
        const newPoint: VectorItem = {
          id: `pt_${Date.now()}`,
          type: 'point',
          color: activeColor,
          start3D: p3d,
          zoneName: zone,
          productName: currentProduct.name,
          lotNumber: currentProduct.lot,
          details: `1 vpich • ${currentProduct.unit}`,
          rotationY: rotationStateRef.current.currentY,
          createdAt: new Date().toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })
        };
        onVectorsChange([...vectors, newPoint]);
        onSelectVector(newPoint.id);
      } else {
        isDrawingRef.current = true;
        drawStart3DRef.current = p3d;
        if (activeTool === 'freehand') {
          currentPath3DRef.current = [p3d];
        }
      }
    }
  };

  // Pointer Move (Mouse / Touch)
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // 1. ROTATION DRAG
    if (isDraggingRotationRef.current) {
      const deltaX = e.clientX - lastPointerPosRef.current.x;
      const deltaY = e.clientY - lastPointerPosRef.current.y;
      lastPointerPosRef.current = { x: e.clientX, y: e.clientY };

      rotationStateRef.current.targetY += deltaX * 0.012;
      rotationStateRef.current.targetX = Math.max(-0.45, Math.min(0.45, rotationStateRef.current.targetX + deltaY * 0.008));
      return;
    }

    const hit = getIntersection3D(e.clientX, e.clientY);
    if (hit) {
      setActiveZoneHover(getZoneFrom3DPoint(hit.point));
    } else {
      setActiveZoneHover(null);
    }

    // 2. LIVE 3D VECTOR PREVIEW
    if (isDrawingRef.current && drawStart3DRef.current && hit) {
      const startP = drawStart3DRef.current;
      const curP = hit.point;
      const pGroup = previewGroupRef.current;
      if (!pGroup) return;

      clearPreviewMesh();

      if (activeTool === 'threads') {
        const p1 = new THREE.Vector3(startP.x, startP.y, startP.z);
        const p2 = new THREE.Vector3(curP.x, curP.y, curP.z);
        const mid = p1.clone().add(p2).multiplyScalar(0.5);
        mid.z += 0.04;

        const curve = new THREE.CatmullRomCurve3([p1, mid, p2]);
        const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.02, 8, false);
        const tubeMat = new THREE.MeshBasicMaterial({ color: activeColor, wireframe: false });
        const mesh = new THREE.Mesh(tubeGeo, tubeMat);
        pGroup.add(mesh);

      } else if (activeTool === 'fanning') {
        const p1 = new THREE.Vector3(startP.x, startP.y, startP.z);
        const p2 = new THREE.Vector3(curP.x, curP.y, curP.z);
        const dist = p1.distanceTo(p2);
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

        [-0.4, -0.2, 0, 0.2, 0.4].forEach((spread) => {
          const a = angle + spread;
          const rayP = new THREE.Vector3(
            p1.x + Math.cos(a) * dist,
            p1.y + Math.sin(a) * dist,
            p1.z + (curP.z - startP.z) * 0.8
          );
          const curve = new THREE.CatmullRomCurve3([p1, rayP]);
          const rayGeo = new THREE.TubeGeometry(curve, 8, 0.014, 6, false);
          const rayMat = new THREE.MeshBasicMaterial({ color: activeColor });
          pGroup.add(new THREE.Mesh(rayGeo, rayMat));
        });

      } else if (activeTool === 'freehand') {
        currentPath3DRef.current.push(curP);
        if (currentPath3DRef.current.length > 1) {
          const pts = currentPath3DRef.current.map(p => new THREE.Vector3(p.x, p.y, p.z + 0.01));
          const curve = new THREE.CatmullRomCurve3(pts);
          const lineGeo = new THREE.TubeGeometry(curve, pts.length * 2, 0.016, 6, false);
          const lineMat = new THREE.MeshBasicMaterial({ color: activeColor });
          pGroup.add(new THREE.Mesh(lineGeo, lineMat));
        }
      }
    }
  };

  // Pointer Up (Mouse / Touch)
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRotationRef.current) {
      isDraggingRotationRef.current = false;
      return;
    }

    if (!isDrawingRef.current || !drawStart3DRef.current) {
      isDrawingRef.current = false;
      clearPreviewMesh();
      return;
    }

    const hit = getIntersection3D(e.clientX, e.clientY);
    const startP = drawStart3DRef.current;
    const endP = hit ? hit.point : startP;
    const zone = getZoneFrom3DPoint(startP);
    const currentRotY = rotationStateRef.current.currentY;

    if (activeTool === 'threads') {
      const p1 = new THREE.Vector3(startP.x, startP.y, startP.z);
      const p2 = new THREE.Vector3(endP.x, endP.y, endP.z);
      const dist = p1.distanceTo(p2);

      if (dist > 0.08) {
        const newThread: VectorItem = {
          id: `th_${Date.now()}`,
          type: 'threads',
          color: activeColor,
          start3D: startP,
          end3D: endP,
          zoneName: `${zone} (Niť Aptos)`,
          productName: currentProduct.name,
          lotNumber: currentProduct.lot,
          details: `Liftingový vektor • Trakcia ku kotevnému bodu`,
          rotationY: currentRotY,
          createdAt: new Date().toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })
        };
        onVectorsChange([...vectors, newThread]);
        onSelectVector(newThread.id);
      }
    } else if (activeTool === 'fanning') {
      const p1 = new THREE.Vector3(startP.x, startP.y, startP.z);
      const p2 = new THREE.Vector3(endP.x, endP.y, endP.z);
      const dist = p1.distanceTo(p2);

      if (dist > 0.08) {
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const fanningLines3D: VectorPoint3D[] = [-0.42, -0.21, 0, 0.21, 0.42].map((spread) => {
          const a = angle + spread;
          return {
            x: p1.x + Math.cos(a) * dist,
            y: p1.y + Math.sin(a) * dist,
            z: p1.z + (endP.z - startP.z) * 0.8
          };
        });

        const newFan: VectorItem = {
          id: `fan_${Date.now()}`,
          type: 'fanning',
          color: activeColor,
          start3D: startP,
          end3D: endP,
          fanningLines3D,
          zoneName: `${zone} (Vejár Sculptra)`,
          productName: currentProduct.name,
          lotNumber: currentProduct.lot,
          details: `Kanyla 25G • 5 lúčov • Biostimulácia kolagénu`,
          rotationY: currentRotY,
          createdAt: new Date().toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })
        };
        onVectorsChange([...vectors, newFan]);
        onSelectVector(newFan.id);
      }
    } else if (activeTool === 'freehand' && currentPath3DRef.current.length > 2) {
      const newFreehand: VectorItem = {
        id: `fh_${Date.now()}`,
        type: 'freehand',
        color: activeColor,
        points3D: [...currentPath3DRef.current],
        zoneName: `${zone} (Marker)`,
        productName: currentProduct.name,
        lotNumber: currentProduct.lot,
        details: 'Predoperačné chirurgické línie',
        rotationY: currentRotY,
        createdAt: new Date().toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })
      };
      onVectorsChange([...vectors, newFreehand]);
      onSelectVector(newFreehand.id);
    }

    isDrawingRef.current = false;
    drawStart3DRef.current = null;
    currentPath3DRef.current = [];
    clearPreviewMesh();
  };

  return (
    <div className="flex flex-col items-center w-full space-y-4">
      {/* 3D SCULPTURE VIEWPORT CONTAINER */}
      <div 
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        className={`relative w-full max-w-[460px] aspect-[4/5] rounded-3xl overflow-hidden border border-[#E8E2D9] shadow-2xl bg-gradient-to-b from-[#FAF8F5] via-[#F4EEE6] to-[#E9E1D5] select-none group touch-none ${
          activeTool === 'rotate' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
        }`}
      >
        {/* 1. THREE.JS 3D WEBGL BUST MOUNT */}
        <div ref={mountRef} className="absolute inset-0 w-full h-full" />

        {/* 2. ANATOMICKÁ SMEROVÁ RUŽICA & UHOL POHĽADU */}
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

        {/* 3. HOVER ANATOMICAL ZONE INDICATOR */}
        {activeZoneHover && (
          <div className="absolute top-4 right-4 z-30 px-3 py-1.5 rounded-2xl bg-[#2C2A29]/85 backdrop-blur-md text-[11px] font-semibold text-white shadow-md pointer-events-none transition-all border border-white/20">
            {activeZoneHover}
          </div>
        )}

        {/* 4. ZOOM & CAMERA CONTROLS OVERLAY (RIGHT) */}
        <div className="absolute right-4 bottom-20 z-30 flex flex-col gap-1.5 p-1 rounded-2xl bg-white/90 backdrop-blur-md border border-white/90 shadow-md">
          <button
            type="button"
            onClick={() => handleZoom(-0.6)}
            className="p-2 rounded-xl text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FAF8F5] transition-all cursor-pointer"
            title="Priblížiť 3D model"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(0.6)}
            className="p-2 rounded-xl text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FAF8F5] transition-all cursor-pointer"
            title="Oddialiť 3D model"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setWireframeMode(!wireframeMode)}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              wireframeMode ? 'bg-[#C5A059] text-white' : 'text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FAF8F5]'
            }`}
            title="Anatomická 3D sieť (Wireframe)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleTakeSnapshot}
            className="p-2 rounded-xl text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FAF8F5] transition-all cursor-pointer"
            title="Snímka 3D modelu do protokolu"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* 5. PREPÍNAČE UHLOV KAMERY */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 p-1 rounded-2xl bg-white/90 backdrop-blur-md border border-white/90 shadow-md">
          <button
            type="button"
            onClick={() => setPresetAngle(-Math.PI / 2)}
            className="px-2.5 py-1 rounded-xl text-[10px] font-bold hover:bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] transition-all cursor-pointer"
            title="Ľavý profil (-90°)"
          >
            Ľ. profil
          </button>
          <button
            type="button"
            onClick={() => setPresetAngle(-Math.PI / 4)}
            className="px-2.5 py-1 rounded-xl text-[10px] font-bold hover:bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] transition-all cursor-pointer"
            title="Ľavý poloprofil (-45°)"
          >
            -45°
          </button>
          <button
            type="button"
            onClick={() => setPresetAngle(0, 0)}
            className="px-3 py-1 rounded-xl text-[10px] font-bold bg-[#2C2A29] text-white shadow-xs cursor-pointer"
            title="Čelný pohľad (0°)"
          >
            Čelný (0°)
          </button>
          <button
            type="button"
            onClick={() => setPresetAngle(Math.PI / 4)}
            className="px-2.5 py-1 rounded-xl text-[10px] font-bold hover:bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] transition-all cursor-pointer"
            title="Pravý poloprofil (+45°)"
          >
            +45°
          </button>
          <button
            type="button"
            onClick={() => setPresetAngle(Math.PI / 2)}
            className="px-2.5 py-1 rounded-xl text-[10px] font-bold hover:bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] transition-all cursor-pointer"
            title="Pravý profil (+90°)"
          >
            P. profil
          </button>
          <button
            type="button"
            onClick={toggleAutoRotate}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
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
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
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
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
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
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
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
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
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
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
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
                className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
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
              className="p-1.5 rounded-xl text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FAF8F5] disabled:opacity-30 transition-all cursor-pointer"
              title="Krok späť (Undo)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onVectorsChange([])}
              disabled={vectors.length === 0}
              className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 disabled:opacity-30 transition-all cursor-pointer"
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
