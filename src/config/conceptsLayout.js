// src/config/conceptsLayout.js
import * as THREE from 'three';
const deg = (d) => THREE.MathUtils.degToRad(d);

// ===========================
// NEW: Composition constants
// ===========================
export const COMPOSITION = {
  GUTTER_VW: 0.06,         // 8% of viewport width per side
  GUTTER_MIN_PX: 64,       // minimum 64px per side
  TARGET_BIAS_TO_ROOT: 1,
  // Per-mode safe Z ranges (world units) so we don't zoom absurdly far
  CLAMPS: {
   tablet:  { zMin: 44, zMax: 160 }, // ← allow pullback at 900–1100px
    desktop: { zMin: 36, zMax: 90 },  // a touch more headroom
  }
};

export function getConceptLayout({ isMobile, isTablet }) {
  if (isMobile) return MOBILE;
  if (isTablet) return TABLET;
  return DESKTOP;
}


// === Desktop (wide look) ===
const DESKTOP = {
  camera: {
      fov: 44,                 // wider number = zooms out a bit
    position: [0, 4, 41],    // Z smaller = closer; Z larger = farther
    target:   [0, -6, 0],
  },
  clusters: {
    root:  { position: [0, -6, 0], rotation: [deg(1), 0, 0],             scale: [2.5,2.5,2.5], frameWidth: 20 },
    abyss: { position: [-50, -35, -28], rotation: [deg(-10), deg(12), 0],  baseScale: 1.5, frameWidth: 22  },
    early: { position: [0, -28, -14], rotation: [0, 0, deg(0)],           baseScale: 6, frameWidth: 24 },
  },
};

// === Tablet (same composition, a touch larger frame) ===
const TABLET = {
  camera: {
    fov: 48,
    position: [0, 5, 54],
    target:   [0, -6, 0],
  },
  clusters: {
    root:  { position: [0, -6, 0], rotation: [deg(1), 0, 0], scale: [3.5,3.5,3.5], frameWidth: 20 },
    abyss: { position: [-38, -40, -28], rotation: [deg(-10), deg(12), 0], baseScale: 2, frameWidth: 24  },
    early: { position: [0, -28, -20],  rotation: [0, 0, deg(0)],         baseScale: 6, frameWidth: 24 },
  },
};

// === Mobile (scene geometry only; camera is driven by scroll in ConceptSceneMobile) ===
const MOBILE = {
  camera: {
    // kept for reference; ConceptSceneMobile ignores this section
    fov: 64,
    z: 72,
    yOffset: 3,
    targetYOffset: 0,
    minPolar: deg(50),
    maxPolar: deg(62),
  },
  clusters: {
    root:  { position: [0, 5, 0],   rotation: [deg(3), 0, 0],  baseScale: 1.5,  scale: [2.2, 2.2, 2.2] },
    abyss: { position: [0, -20, 0], rotation: [deg(-10), 0, 0], baseScale: 1.0 },
    early: { position: [0, -60, 0], rotation: [0, 0, 0],        baseScale: 4.0 },
  },
};
