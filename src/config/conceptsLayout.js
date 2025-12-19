// src/config/conceptsLayout.js
import * as THREE from "three";
const deg = (d) => THREE.MathUtils.degToRad(d);

/**
 * This file is now the single source of truth for:
 * - Desktop / Tablet composition (big scene)
 * - Mobile composition AND mobile preview-card directives
 *
 * For MOBILE we add, per-cluster:
 *   preview: {
 *     centerFromLayout: boolean,  // if true, we negate `position` so the preview looks centered
 *     rotation: [x,y,z],          // rotation to apply in the preview card
 *     scale: number,              // uniform scale inside preview card
 *     biasY: number               // tiny vertical nudge inside the card (world units)
 *   }
 */

export const COMPOSITION = {
  GUTTER_VW: 0.06,
  GUTTER_MIN_PX: 64,
  TARGET_BIAS_TO_ROOT: 1,
  CLAMPS: {
    tablet:  { zMin: 44, zMax: 160 },
    desktop: { zMin: 36, zMax: 90 },
  },
};

export function getConceptLayout({ isMobile, isTablet }) {
  if (isMobile) return MOBILE;
  if (isTablet) return TABLET;
  return DESKTOP;
}

/* =========================
   DESKTOP (wide composition)
   ========================= */
const DESKTOP = {
  camera: {
    fov: 44,
    position: [0, 4, 90],
    target: [0, -6, 0],
  },
  clusters: {
    root:     { position: [  38,  6, -10],rotation: [deg(7), deg(-20), 0],  scale: [3, 3, 3], frameWidth: 20 },
    penumbra: { position: [-38,   6, -10],rotation: [deg(5), deg(0), 0],  scale: [2.3,2.3,2.3], frameWidth: 18 },
    lumen:    { position: [ 37, -8,  -10], rotation: [deg(-12), -.4, 0], scale: [2.6, 2.6, 2.6], frameWidth: 18 },
    abyss:    { position: [-38, -28, -10], rotation: [deg(-12), .25, 0],  baseScale: 1.5,        frameWidth: 22 },
    hats:     { position: [   0,   6, -14], baseScale: 7.4,        frameWidth: 20 },
    early:    { position: [  0, -22, -14],  baseScale: 7.4,        frameWidth: 24 },
  },
};

/* ======================
   TABLET (mid composition)
   ====================== */
const TABLET = {
  camera: {
    fov: 48,
    position: [0, 5, 68],
    target: [0, -6, 0],
  },
  clusters: {
    root:     { position: [  30,  4,   -10],rotation: [deg(7), deg(-20), 0],    scale: [2.5, 2.5, 2.5], frameWidth: 20 },
    penumbra: { position: [-30,  4,  -10],rotation: [deg(5), deg(0), 0],     scale:[1.95,1.95, 1.95], frameWidth: 18 },
    lumen:    { position: [ 30, -8, -10],rotation: [deg(-12), -.4, 0],  scale: [2.4, 2.4, 2.4], frameWidth: 18 },
    abyss:    { position: [-30, -28, -10], rotation: [deg(-15), .25, 0],    baseScale: 1.3,         frameWidth: 24 },
    hats:     { position: [  0,  4, -14],      baseScale: 6,      frameWidth: 20 },
    early:    { position: [  0, -20, -14],     baseScale: 6,         frameWidth: 24 },
  },
};

/* ======================================================
   MOBILE (small composition + PREVIEW directives per cluster)
   ====================================================== */
const MOBILE = {
  camera: {
    // kept for reference only; the mobile preview cards use their own camera
    fov: 64,
    z: 72,
    yOffset: 3,
    targetYOffset: 0,
    minPolar: deg(50),
    maxPolar: deg(62),
  },
  clusters: {
    /* Root / Concept */
    root: {
      position: [0, 5, 0],
      rotation: [deg(0), deg(-10), 0],
      baseScale: 1,
      // How the root should look in the PREVIEW card
      preview: {
        centerFromLayout: false,
        rotation: [deg(1), 0, 0],
        scale: 1,
        biasY: -1,                       
      },
    },

    /* Penumbra */
    penumbra: {
      position: [0, -18, 0],
      rotation: [deg(5), deg(4) , 0],
      baseScale: 1.35,
      preview: {
        centerFromLayout: false,        
        rotation: [deg(3), 0, 0],
        scale: 0.72,
        biasY: -0.1,
      },
    },

    /* Lumen (added to mobile) */
    lumen: {
      position: [0, -20, 0],
      rotation: [deg(-8), 0, 0],
      baseScale: 1.0,
      preview: {
        centerFromLayout: false,
        rotation: [deg(-8), 0, 0],        
        scale: 1.2,
        biasY: 6,
        cameraZ: 26,
        translate: [0, -0.1, 0],
      },
    },

    /* Abyss */
    abyss: {
      position: [0, -40, 0],
      rotation: [deg(-5), 0, 0],
      baseScale: 1.0,
      preview: {
        centerFromLayout: false,
        rotation: [deg(5), 0, 0], 
        scale: 0.65,
        biasY: -0.05,
        cameraZ: 26,
      },
    },
    hats: {
      position: [0, -60, 0],
      rotation: [0, 0, 0],
      baseScale: 4.8,
      preview: {
        centerFromLayout: false,
        rotation: [deg(0), 0, 0],
        scale: .7,
        biasY: 1,
      },
    },
    /* Early Aliens / Protoforms */
    early: {
      position: [0, -80, 0],
      rotation: [0, 0, 0],
      baseScale: 4.0,
      preview: {
        centerFromLayout: false,
        rotation: [0, 0, 0],
        scale: .8,
        biasY: 1,
      },
    },
  },
};
