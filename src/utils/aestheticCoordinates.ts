import * as THREE from 'three';

export interface VectorPoint3D {
  x: number;
  y: number;
  z: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export type SculptureViewType = 'front' | 'profile_left' | 'profile_right';

export function gaus2D(x: number, y: number, cx: number, cy: number, sx: number, sy: number): number {
  const dx = (x - cx) / sx;
  const dy = (y - cy) / sy;
  return Math.exp(-(dx * dx + dy * dy));
}

/**
 * Evaluates the exact 3D surface point on the harmonious female marble bust
 * for any normalized vertical coordinate y (-1.58..1.26) and angle theta (-PI..PI).
 */
export function evaluateBustSurface(y: number, theta: number): VectorPoint3D {
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const absT = Math.abs(theta);

  let rx = 0.50;
  let rz = 0.50;
  let zCenter = 0.0;
  const xCenter = 0.0;
  let deltaZ = 0.0;
  let deltaX = 0.0;
  let deltaY = 0.0;

  // Region A: Décolleté & Shoulders
  if (y < -0.90) {
    const t = (y - (-1.58)) / 0.68;
    const flare = Math.pow(1 - t, 1.35);
    rx = 0.54 + flare * 0.95;
    rz = 0.44 + flare * 0.42;
    zCenter = -0.05 + 0.10 * Math.max(0, cosT) * flare;

    if (y > -1.15 && y < -0.85) {
      const clavY = gaus2D(0, y, 0, -0.95, 1, 0.075);
      if (absT < 0.22) {
        deltaZ -= 0.045 * (1 - absT / 0.22) * clavY;
      } else if (absT < 1.30) {
        const clavAngle = (absT - 0.22) / (1.30 - 0.22);
        const ridge = Math.sin(clavAngle * Math.PI) * 0.048 * clavY;
        deltaZ += ridge;
        deltaY += ridge * 0.22;
      }
    }
  } 
  // Region B: Slender Feminine Neck
  else if (y < -0.15) {
    const t = (y - (-0.90)) / 0.75;
    const waist = Math.sin(t * Math.PI);
    rx = 0.43 - waist * 0.045 + t * 0.02;
    rz = 0.44 - waist * 0.035;
    zCenter = -0.04 + t * 0.08;

    const targetSCMAngle = 0.32 + (1 - t) * 0.1 + t * 1.05;
    const scmElevation = Math.exp(-Math.pow((absT - targetSCMAngle) / 0.22, 2)) * 0.038 * Math.sin(t * Math.PI);
    deltaZ += scmElevation * Math.max(0, cosT);
    deltaX += Math.sign(theta) * scmElevation * 0.02;

    if (y > -0.52 && y < -0.32 && absT < 0.35) {
      deltaZ += 0.022 * gaus2D(theta, y, 0, -0.42, 0.25, 0.06);
    }
  } 
  // Region C: Head & Craniofacial Complex
  else {
    const tHead = (y - (-0.15)) / 1.41;
    rx = 0.76 * Math.sin(Math.min(Math.PI, tHead * 0.88 + 0.25));
    rz = 0.88 * Math.sin(Math.min(Math.PI, tHead * 0.85 + 0.28));
    zCenter = 0.08 + Math.sin(tHead * Math.PI * 0.7) * 0.04;

    // Jawline & Submental
    if (y < 0.25) {
      if (absT > 1.0 && absT < 1.6) {
        const gonion = gaus2D(absT, y, 1.35, 0.18, 0.22, 0.12) * 0.06;
        rx += gonion;
        rz += gonion * 0.5;
      }
      if (absT < 0.9 && y < 0.05) {
        const submental = (1 - (0.05 - y) / 0.20);
        deltaZ += 0.18 * Math.max(0, submental) * Math.cos(absT * 1.5);
      }
    }

    // Feminine Chin (Pogonion)
    if (y > -0.06 && y < 0.12 && absT < 0.45) {
      const chinLift = gaus2D(theta, y, 0, 0.03, 0.24, 0.065) * 0.145;
      deltaZ += chinLift;
      deltaY -= chinLift * 0.15;
    }

    // Labiomental sulcus
    if (y > 0.07 && y < 0.16 && absT < 0.40) {
      const labioIndent = gaus2D(theta, y, 0, 0.115, 0.28, 0.035) * 0.045;
      deltaZ -= labioIndent;
    }

    // Lower Lip
    if (y > 0.13 && y < 0.23 && absT < 0.38) {
      const lipProf = gaus2D(0, y, 0, 0.178, 1, 0.032);
      const lipAng = Math.max(0, Math.cos((theta / 0.32) * (Math.PI / 2)));
      const centerGroove = 1 - 0.18 * Math.exp(-Math.pow(theta / 0.055, 2));
      deltaZ += 0.105 * lipProf * lipAng * centerGroove;
    }

    // Upper Lip & Cupid's Bow
    if (y > 0.21 && y < 0.30 && absT < 0.36) {
      const upProf = gaus2D(0, y, 0, 0.252, 1, 0.030);
      const bowL = Math.exp(-Math.pow((theta - 0.075) / 0.08, 2));
      const bowR = Math.exp(-Math.pow((theta + 0.075) / 0.08, 2));
      const bowVal = (bowL + bowR) * 0.5;
      const centerDip = Math.exp(-Math.pow(theta / 0.04, 2)) * 0.028;
      deltaZ += 0.095 * upProf * bowVal - centerDip * upProf;
    }

    // Philtrum
    if (y > 0.27 && y < 0.36 && absT < 0.22) {
      const philY = gaus2D(0, y, 0, 0.315, 1, 0.035);
      const colL = Math.exp(-Math.pow((theta - 0.055) / 0.025, 2));
      const colR = Math.exp(-Math.pow((theta + 0.055) / 0.025, 2));
      deltaZ += 0.025 * (colL + colR) * philY;
      deltaZ -= 0.020 * Math.exp(-Math.pow(theta / 0.035, 2)) * philY;
    }

    // Oral Commissures
    if (y > 0.19 && y < 0.25 && absT > 0.18 && absT < 0.36) {
      const comm = gaus2D(absT, y, 0.27, 0.218, 0.06, 0.025) * 0.032;
      deltaZ -= comm;
    }

    // Nose (lobule, alar, bridge, nasion)
    if (y > 0.32 && y < 0.72 && absT < 0.42) {
      if (y > 0.34 && y < 0.48 && absT < 0.20) {
        const tip = gaus2D(theta, y, 0, 0.41, 0.11, 0.05) * 0.21;
        deltaZ += tip;
        if (y > 0.43 && y < 0.48 && absT < 0.12) {
          deltaZ -= 0.025 * gaus2D(theta, y, 0, 0.455, 0.09, 0.02);
        }
      }
      if (y > 0.33 && y < 0.44 && absT > 0.06 && absT < 0.26) {
        const alar = gaus2D(absT, y, 0.14, 0.375, 0.065, 0.038) * 0.082;
        deltaZ += alar;
      }
      if (y > 0.46 && y < 0.70 && absT < 0.18) {
        const normY = (y - 0.46) / 0.24;
        const bridgeWidth = 0.085 + (1 - normY) * 0.03;
        if (absT < bridgeWidth) {
          const bridgeH = Math.cos((absT / bridgeWidth) * (Math.PI / 2)) * (0.165 - normY * 0.045);
          deltaZ += bridgeH;
        }
      }
      if (y > 0.66 && y < 0.73 && absT < 0.14) {
        deltaZ -= 0.035 * gaus2D(theta, y, 0, 0.695, 0.10, 0.025);
      }
    }

    // High Cheekbones (Zygoma & Malar)
    if (y > 0.36 && y < 0.66 && absT > 0.35 && absT < 1.15) {
      const cheek = gaus2D(absT, y, 0.68, 0.52, 0.26, 0.11) * 0.115;
      rx += cheek * 0.6;
      deltaZ += cheek * 0.85;
    }

    // Eye sockets & Almond Eyelids
    if (y > 0.58 && y < 0.74 && absT > 0.20 && absT < 0.62) {
      const orbit = gaus2D(absT, y, 0.39, 0.655, 0.16, 0.065) * 0.11;
      deltaZ -= orbit;
      const eyeBall = gaus2D(absT, y, 0.39, 0.655, 0.11, 0.038) * 0.065;
      deltaZ += eyeBall;
      if (y > 0.68 && y < 0.72) {
        const crease = gaus2D(absT, y, 0.39, 0.695, 0.14, 0.015) * 0.018;
        deltaZ += crease;
      }
    }

    // Eyebrows
    if (y > 0.72 && y < 0.84 && absT > 0.12 && absT < 0.72) {
      const brow = gaus2D(absT, y, 0.44, 0.775, 0.22, 0.045) * 0.055;
      deltaZ += brow;
    }

    // Forehead & Temporal hollows
    if (y > 0.80 && y < 1.15) {
      if (absT < 0.60) {
        const foreY = Math.sin(((y - 0.80) / 0.35) * Math.PI);
        deltaZ += 0.045 * foreY * Math.cos(absT * 1.6);
      }
      if (absT > 0.65 && absT < 1.05 && y > 0.82 && y < 1.05) {
        const temp = gaus2D(absT, y, 0.82, 0.92, 0.16, 0.08) * 0.035;
        rx -= temp;
        deltaZ -= temp * 0.5;
      }
    }

    // Cranial Dome
    if (y > 1.12) {
      const crownT = (y - 1.12) / 0.14;
      rx *= Math.cos(crownT * (Math.PI / 2) * 0.95);
      rz *= Math.cos(crownT * (Math.PI / 2) * 0.95);
    }
  }

  const x = (rx * sinT + xCenter + deltaX);
  const z = (rz * cosT + zCenter + deltaZ);
  const finalY = y + deltaY;

  return { x, y: finalY, z };
}

/**
 * Computes the outward surface normal at (y, theta) via finite difference gradients.
 */
export function computeBustNormal(y: number, theta: number): THREE.Vector3 {
  const dy = 0.01;
  const dt = 0.01;
  const p1 = evaluateBustSurface(y - dy, theta);
  const p2 = evaluateBustSurface(y + dy, theta);
  const q1 = evaluateBustSurface(y, theta - dt);
  const q2 = evaluateBustSurface(y, theta + dt);

  const vy = new THREE.Vector3(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z);
  const vt = new THREE.Vector3(q2.x - q1.x, q2.y - q1.y, q2.z - q1.z);
  
  return new THREE.Vector3().crossVectors(vt, vy).normalize();
}

/**
 * Converts a 2D coordinate on the SVG canvas (0..600, 0..800) into 3D bust coordinates.
 */
export function convert2DPointTo3D(pt2D: Point2D, view: SculptureViewType = 'front'): VectorPoint3D {
  let theta = 0;
  // Map SVG Y (100..750) to 3D Y (1.20..-1.00)
  const y3D = 1.35 - (pt2D.y / 730) * 2.30;

  if (view === 'front') {
    theta = ((pt2D.x - 300) / 300) * (Math.PI * 0.48);
  } else if (view === 'profile_left') {
    const normX = Math.max(0, Math.min(1, (pt2D.x - 110) / 250));
    theta = normX * (Math.PI / 2);
  } else {
    // profile_right
    const normX = Math.max(0, Math.min(1, (490 - pt2D.x) / 250));
    theta = -normX * (Math.PI / 2);
  }

  const surface = evaluateBustSurface(y3D, theta);
  const normal = computeBustNormal(y3D, theta);

  // Offset slightly above surface to prevent clipping
  return {
    x: surface.x + normal.x * 0.015,
    y: surface.y + normal.y * 0.015,
    z: surface.z + normal.z * 0.015
  };
}

/**
 * Projects a 3D bust coordinate back into 2D SVG canvas coordinates and identifies the best view.
 */
export function convert3DPointTo2D(p3D: VectorPoint3D): { pt: Point2D; view: SculptureViewType } {
  const theta = Math.atan2(p3D.x, p3D.z || 0.5);
  const y = Math.round(((1.35 - p3D.y) / 2.30) * 730);

  if (Math.abs(theta) < Math.PI / 3) {
    const x = Math.round(300 + (theta / (Math.PI * 0.48)) * 300);
    return { pt: { x, y }, view: 'front' };
  } else if (theta >= Math.PI / 3) {
    const normX = theta / (Math.PI / 2);
    const x = Math.round(110 + normX * 250);
    return { pt: { x, y }, view: 'profile_left' };
  } else {
    const normX = Math.abs(theta) / (Math.PI / 2);
    const x = Math.round(490 - normX * 250);
    return { pt: { x, y }, view: 'profile_right' };
  }
}
