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
  Camera 
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

  // Helper to create an anatomically proportioned, graceful female bust (Face, Neck, Clavicles, Décolleté)
  const createHarmoniousFemaleBust = (): THREE.Group => {
    const group = new THREE.Group();

    // 1. UNIFIED CONTINUOUS PARAMETRIC BUST GEOMETRY
    // Slices: Ny = 160 vertical rings (from y = -1.58 at decollete to y = 1.28 at crown), Ntheta = 128 circumferential steps
    const Ny = 160;
    const Ntheta = 128;
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    const gaus2D = (x: number, y: number, cx: number, cy: number, sx: number, sy: number) => {
      const dx = (x - cx) / sx;
      const dy = (y - cy) / sy;
      return Math.exp(-(dx * dx + dy * dy));
    };

    for (let iy = 0; iy <= Ny; iy++) {
      const v = iy / Ny; // 0 (bottom) to 1 (top)
      // Map v to y from -1.58 to 1.26
      const y = -1.58 + v * 2.84;

      for (let it = 0; it <= Ntheta; it++) {
        const u = it / Ntheta; // 0 to 1
        const theta = u * Math.PI * 2 - Math.PI; // -PI (back) -> 0 (front) -> +PI (back)
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);
        const absT = Math.abs(theta);

        // BASE ELLIPSOIDAL RADII & OFFSETS
        let rx = 0.50;
        let rz = 0.50;
        let zCenter = 0.0;
        const xCenter = 0.0;
        let deltaZ = 0.0;
        let deltaX = 0.0;
        let deltaY = 0.0;

        // --- REGION A: DÉCOLLETÉ & SHOULDERS (y: -1.58 -> -0.90) ---
        if (y < -0.90) {
          const t = (y - (-1.58)) / 0.68; // 0 (bottom) -> 1 (neck base)
          const flare = Math.pow(1 - t, 1.35);
          rx = 0.54 + flare * 0.95;
          rz = 0.44 + flare * 0.42;
          zCenter = -0.05 + 0.10 * Math.max(0, cosT) * flare;

          // Clavicles (Collarbone ridges) near y = -0.96
          if (y > -1.15 && y < -0.85) {
            const clavY = gaus2D(0, y, 0, -0.95, 1, 0.075);
            // Suprasternal notch in center
            if (absT < 0.22) {
              deltaZ -= 0.045 * (1 - absT / 0.22) * clavY;
            } else if (absT < 1.30) {
              // S-curve clavicle bone ridge
              const clavAngle = (absT - 0.22) / (1.30 - 0.22);
              const ridge = Math.sin(clavAngle * Math.PI) * 0.048 * clavY;
              deltaZ += ridge;
              deltaY += ridge * 0.22;
            }
          }
        }
        // --- REGION B: SLENDER FEMININE NECK (y: -0.90 -> -0.15) ---
        else if (y < -0.15) {
          const t = (y - (-0.90)) / 0.75; // 0 -> 1
          // Graceful waist in mid-neck
          const waist = Math.sin(t * Math.PI);
          rx = 0.43 - waist * 0.045 + t * 0.02;
          rz = 0.44 - waist * 0.035;
          zCenter = -0.04 + t * 0.08; // Natural cervical lordosis

          // Sternocleidomastoid (SCM) paired muscles running from mastoid to medial clavicle
          const targetSCMAngle = 0.32 + (1 - t) * 0.1 + t * 1.05;
          const scmElevation = Math.exp(-Math.pow((absT - targetSCMAngle) / 0.22, 2)) * 0.038 * Math.sin(t * Math.PI);
          deltaZ += scmElevation * Math.max(0, cosT);
          deltaX += Math.sign(theta) * scmElevation * 0.02;

          // Soft feminine thyroid prominence (gentle throat contour)
          if (y > -0.52 && y < -0.32 && absT < 0.35) {
            deltaZ += 0.022 * gaus2D(theta, y, 0, -0.42, 0.25, 0.06);
          }
        }
        // --- REGION C: HEAD & CRANIOFACIAL COMPLEX (y: -0.15 -> 1.26) ---
        else {
          const tHead = (y - (-0.15)) / 1.41; // 0 (chin/jaw base) -> 1 (vertex)

          // Base craniofacial egg/oval
          rx = 0.76 * Math.sin(Math.min(Math.PI, tHead * 0.88 + 0.25));
          rz = 0.88 * Math.sin(Math.min(Math.PI, tHead * 0.85 + 0.28));
          zCenter = 0.08 + Math.sin(tHead * Math.PI * 0.7) * 0.04;

          // 1. SUBMENTAL & MANDIBULAR V-LINE CONTOUR (y: -0.15 -> 0.25)
          if (y < 0.25) {
            // Jawline angle (Gonion) at sides (absT ~ 1.35)
            if (absT > 1.0 && absT < 1.6) {
              const gonion = gaus2D(absT, y, 1.35, 0.18, 0.22, 0.12) * 0.06;
              rx += gonion;
              rz += gonion * 0.5;
            }
            // Under-chin submental transition
            if (absT < 0.9 && y < 0.05) {
              const submental = (1 - (0.05 - y) / 0.20);
              deltaZ += 0.18 * Math.max(0, submental) * Math.cos(absT * 1.5);
            }
          }

          // 2. FEMININE CHIN (Pogonion / Menton) (y: -0.05 -> 0.12)
          if (y > -0.06 && y < 0.12 && absT < 0.45) {
            const chinLift = gaus2D(theta, y, 0, 0.03, 0.24, 0.065) * 0.145;
            deltaZ += chinLift;
            deltaY -= chinLift * 0.15;
          }

          // 3. LABIOMENTAL SULCUS (Crease above chin) (y: 0.08 -> 0.16)
          if (y > 0.07 && y < 0.16 && absT < 0.40) {
            const labioIndent = gaus2D(theta, y, 0, 0.115, 0.28, 0.035) * 0.045;
            deltaZ -= labioIndent;
          }

          // 4. LOWER LIP (Full, soft central division) (y: 0.14 -> 0.23)
          if (y > 0.13 && y < 0.23 && absT < 0.38) {
            const lipProf = gaus2D(0, y, 0, 0.178, 1, 0.032);
            const lipAng = Math.max(0, Math.cos((theta / 0.32) * (Math.PI / 2)));
            // Soft central groove division for natural lip anatomy
            const centerGroove = 1 - 0.18 * Math.exp(-Math.pow(theta / 0.055, 2));
            deltaZ += 0.105 * lipProf * lipAng * centerGroove;
          }

          // 5. UPPER LIP & CUPID'S BOW (y: 0.21 -> 0.30)
          if (y > 0.21 && y < 0.30 && absT < 0.36) {
            const upProf = gaus2D(0, y, 0, 0.252, 1, 0.030);
            // Twin peaks of Cupid's bow at theta = +-0.075
            const bowL = Math.exp(-Math.pow((theta - 0.075) / 0.08, 2));
            const bowR = Math.exp(-Math.pow((theta + 0.075) / 0.08, 2));
            const bowVal = (bowL + bowR) * 0.5;
            const centerDip = Math.exp(-Math.pow(theta / 0.04, 2)) * 0.028;
            deltaZ += 0.095 * upProf * bowVal - centerDip * upProf;
          }

          // 6. PHILTRUM & COLUMNS (y: 0.27 -> 0.36)
          if (y > 0.27 && y < 0.36 && absT < 0.22) {
            const philY = gaus2D(0, y, 0, 0.315, 1, 0.035);
            // Philtral columns
            const colL = Math.exp(-Math.pow((theta - 0.055) / 0.025, 2));
            const colR = Math.exp(-Math.pow((theta + 0.055) / 0.025, 2));
            deltaZ += 0.025 * (colL + colR) * philY;
            // Central philtral trough
            deltaZ -= 0.020 * Math.exp(-Math.pow(theta / 0.035, 2)) * philY;
          }

          // 7. ORAL COMMISSURES (Corners of the mouth) (y: 0.19 -> 0.25)
          if (y > 0.19 && y < 0.25 && absT > 0.18 && absT < 0.36) {
            const comm = gaus2D(absT, y, 0.27, 0.218, 0.06, 0.025) * 0.032;
            deltaZ -= comm;
          }

          // 8. FEMININE NOSE (Lobule, alar wings, supratip break, slender bridge) (y: 0.32 -> 0.72)
          if (y > 0.32 && y < 0.72 && absT < 0.42) {
            // A. Nasal Tip Lobule (y ~ 0.41, theta = 0)
            if (y > 0.34 && y < 0.48 && absT < 0.20) {
              const tip = gaus2D(theta, y, 0, 0.41, 0.11, 0.05) * 0.21;
              deltaZ += tip;
              // slight feminine rotation / supratip break
              if (y > 0.43 && y < 0.48 && absT < 0.12) {
                deltaZ -= 0.025 * gaus2D(theta, y, 0, 0.455, 0.09, 0.02);
              }
            }
            // B. Alar Lobules (Nostril wings) (y ~ 0.37, theta ~ +-0.14)
            if (y > 0.33 && y < 0.44 && absT > 0.06 && absT < 0.26) {
              const alar = gaus2D(absT, y, 0.14, 0.375, 0.065, 0.038) * 0.082;
              deltaZ += alar;
            }
            // C. Nasal Dorsum / Bridge (y ~ 0.46 -> 0.70)
            if (y > 0.46 && y < 0.70 && absT < 0.18) {
              const normY = (y - 0.46) / 0.24; // 0 (supratip) to 1 (nasion)
              const bridgeWidth = 0.085 + (1 - normY) * 0.03;
              if (absT < bridgeWidth) {
                const bridgeH = Math.cos((absT / bridgeWidth) * (Math.PI / 2)) * (0.165 - normY * 0.045);
                deltaZ += bridgeH;
              }
            }
            // D. Nasion depression (y ~ 0.69)
            if (y > 0.66 && y < 0.73 && absT < 0.14) {
              deltaZ -= 0.035 * gaus2D(theta, y, 0, 0.695, 0.10, 0.025);
            }
          }

          // 9. HIGH FEMININE CHEEKBONES (Zygoma & Malar Fat Pad) (y: 0.36 -> 0.66)
          if (y > 0.36 && y < 0.66 && absT > 0.35 && absT < 1.15) {
            const cheek = gaus2D(absT, y, 0.68, 0.52, 0.26, 0.11) * 0.115;
            rx += cheek * 0.6;
            deltaZ += cheek * 0.85;
          }

          // 10. EYE SOCKETS & ALMOND EYELIDS (y: 0.58 -> 0.74)
          if (y > 0.58 && y < 0.74 && absT > 0.20 && absT < 0.62) {
            // Orbital socket recess
            const orbit = gaus2D(absT, y, 0.39, 0.655, 0.16, 0.065) * 0.11;
            deltaZ -= orbit;
            // Almond eyeball & eyelid curvature
            const eyeBall = gaus2D(absT, y, 0.39, 0.655, 0.11, 0.038) * 0.065;
            deltaZ += eyeBall;
            // Upper eyelid crease (supratarsal fold)
            if (y > 0.68 && y < 0.72) {
              const crease = gaus2D(absT, y, 0.39, 0.695, 0.14, 0.015) * 0.018;
              deltaZ += crease;
            }
          }

          // 11. BROW RIDGES (Arcus Superciliaris) (y: 0.72 -> 0.84)
          if (y > 0.72 && y < 0.84 && absT > 0.12 && absT < 0.72) {
            // Feminine arched eyebrow (highest laterally at theta ~ 0.44)
            const brow = gaus2D(absT, y, 0.44, 0.775, 0.22, 0.045) * 0.055;
            deltaZ += brow;
          }

          // 12. FOREHEAD & TEMPORAL CONTOUR (y: 0.80 -> 1.15)
          if (y > 0.80 && y < 1.15) {
            // Soft convex forehead curve forward
            if (absT < 0.60) {
              const foreY = Math.sin(((y - 0.80) / 0.35) * Math.PI);
              deltaZ += 0.045 * foreY * Math.cos(absT * 1.6);
            }
            // Temporal hollows
            if (absT > 0.65 && absT < 1.05 && y > 0.82 && y < 1.05) {
              const temp = gaus2D(absT, y, 0.82, 0.92, 0.16, 0.08) * 0.035;
              rx -= temp;
              deltaZ -= temp * 0.5;
            }
          }

          // 13. CRANIAL DOME (y: 1.12 -> 1.26)
          if (y > 1.12) {
            const crownT = (y - 1.12) / 0.14;
            rx *= Math.cos(crownT * (Math.PI / 2) * 0.95);
            rz *= Math.cos(crownT * (Math.PI / 2) * 0.95);
          }
        }

        // COMPUTE FINAL 3D VERTEX POSITION
        const x = (rx * sinT + xCenter + deltaX);
        const z = (rz * cosT + zCenter + deltaZ);
        const finalY = y + deltaY;

        vertices.push(x, finalY, z);
        uvs.push(u, v);
      }
    }

    // GENERATE TRIANGLE INDICES
    for (let iy = 0; iy < Ny; iy++) {
      for (let it = 0; it < Ntheta; it++) {
        const a = iy * (Ntheta + 1) + it;
        const b = (iy + 1) * (Ntheta + 1) + it;
        const c = (iy + 1) * (Ntheta + 1) + (it + 1);
        const d = iy * (Ntheta + 1) + (it + 1);

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    const bustGeo = new THREE.BufferGeometry();
    bustGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    bustGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    bustGeo.setIndex(indices);
    bustGeo.computeVertexNormals();

    // High-End Alabaster Skin Material (Pearlescent Aesthetic Clinical Finish)
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xFAF5EF,
      roughness: 0.34,
      metalness: 0.03,
      wireframe: false,
    });

    const bustMesh = new THREE.Mesh(bustGeo, skinMaterial);
    bustMesh.name = 'female_face_mesh';
    faceMeshRef.current = bustMesh;
    group.add(bustMesh);

    // 2. Sculpted Classical Hair Frame & Updo Chignon
    const hairGeo = new THREE.SphereGeometry(0.85, 48, 36);
    const hairPos = hairGeo.attributes.position;
    const hVert = new THREE.Vector3();
    for (let i = 0; i < hairPos.count; i++) {
      hVert.fromBufferAttribute(hairPos, i);
      let hx = hVert.x * 0.94;
      let hy = hVert.y * 0.95;
      let hz = hVert.z * 1.05;

      // Chignon / Hair volume at the posterior crown
      if (hz < -0.1) {
        hz *= 1.15;
        hy += 0.05;
      }
      // Hair wave flow lines
      const wave = Math.sin(hy * 14 + hx * 8) * 0.012;
      hx += wave;
      hz += wave;

      hairPos.setXYZ(i, hx, hy, hz);
    }
    hairGeo.computeVertexNormals();

    const hairMaterial = new THREE.MeshStandardMaterial({
      color: 0x3D322B,
      roughness: 0.68,
      metalness: 0.10,
    });
    const hairMesh = new THREE.Mesh(hairGeo, hairMaterial);
    hairMesh.position.set(0, 0.98, -0.18);
    hairMesh.scale.set(0.96, 0.96, 0.96);
    group.add(hairMesh);

    // Secondary Chignon Bun
    const bunGeo = new THREE.SphereGeometry(0.38, 32, 24);
    const bunMesh = new THREE.Mesh(bunGeo, hairMaterial);
    bunMesh.position.set(0, 0.78, -0.82);
    bunMesh.scale.set(1.15, 0.88, 0.75);
    group.add(bunMesh);

    // 3. Delicate Sculpted Ears (Left & Right)
    const createEarMesh = (isLeft: boolean) => {
      const earGroup = new THREE.Group();
      // Outer Helix rim
      const helixGeo = new THREE.TorusGeometry(0.16, 0.032, 16, 24, Math.PI * 1.35);
      const helixMesh = new THREE.Mesh(helixGeo, skinMaterial);
      earGroup.add(helixMesh);

      // Conchal bowl & Lobule
      const lobeGeo = new THREE.SphereGeometry(0.065, 16, 12);
      const lobeMesh = new THREE.Mesh(lobeGeo, skinMaterial);
      lobeMesh.position.set(0.02, -0.16, 0);
      lobeMesh.scale.set(1, 1.3, 0.6);
      earGroup.add(lobeMesh);

      const sign = isLeft ? -1 : 1;
      earGroup.position.set(sign * 0.74, 0.54, -0.04);
      earGroup.rotation.y = sign * (Math.PI / 4.5);
      earGroup.rotation.z = sign * (Math.PI / 16);
      return earGroup;
    };

    group.add(createEarMesh(true));
    group.add(createEarMesh(false));

    // 4. Classical Pedestal Plinth with Champagne Gold Trim Ring
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0xECE5DC,
      roughness: 0.42,
      metalness: 0.06,
    });
    const pedestalGeo = new THREE.CylinderGeometry(0.85, 1.12, 0.32, 64);
    const pedestalMesh = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestalMesh.position.set(0, -1.72, -0.05);
    group.add(pedestalMesh);

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xC5A059,
      roughness: 0.20,
      metalness: 0.88,
    });
    const goldRingGeo = new THREE.TorusGeometry(0.88, 0.025, 16, 64);
    const goldRingMesh = new THREE.Mesh(goldRingGeo, goldMat);
    goldRingMesh.position.set(0, -1.56, -0.05);
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
    } else if (y > 0.38 && y <= 0.65) {
      if (Math.abs(x) < 0.18) return 'Nos - Chrbát a hrot nosa';
      return x < 0 ? 'Zygomatická oblasť / Líce Ľ (Vektor)' : 'Zygomatická oblasť / Líce P (Vektor)';
    } else if (y > 0.14 && y <= 0.38) {
      if (Math.abs(x) < 0.25) return 'Nasolabiálna ryha & Pery (Vermilion / Kontúra)';
      return x < 0 ? 'Bukálna / Lícna oblasť Ľ' : 'Bukálna / Lícna oblasť P';
    } else if (y > -0.12 && y <= 0.14) {
      if (Math.abs(x) < 0.22) return 'Brada (m. mentalis) & Marionetové vrásky';
      return x < 0 ? 'Mandibulárna línia Ľ (Sánka)' : 'Mandibulárna línia P (Sánka)';
    } else if (y > -0.85 && y <= -0.12) {
      return Math.abs(x) < 0.25 ? 'Submentálna & Krčná zóna (Platysma)' : x < 0 ? 'Krk Ľavý (m. sternocleidomastoideus)' : 'Krk Pravý (m. sternocleidomastoideus)';
    } else {
      return 'Dekolt & Klavikulárna zóna';
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
