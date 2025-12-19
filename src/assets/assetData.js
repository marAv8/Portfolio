// src/assets/conceptAssets.js

import { abyssAssets, earlyAliensAssets, penumbraAssets } from './assetsLeft';
import { hatsAssets, getLumenAll } from './assetsRight';

/* -------------------------------------------------
   Variant helper (EXPLICIT, no guessing)
-------------------------------------------------- */

const CLUSTERS_WITH_MID = new Set(['Root']);

const makeImage = ({ cluster, name }) => {
  const base = {
    thumb: `/media/concepts/${cluster}/thumbnails/${name}_512.webp`,
    full:  `/media/concepts/${cluster}/full/${name}_1600.webp`,
  };

  if (CLUSTERS_WITH_MID.has(cluster)) {
    base.mid = `/media/concepts/${cluster}/mid/${name}_1024.webp`;
  }

  return base;
};

/* -------------------------------------------------
   ROOT — static cluster images (1024 is intentional)
-------------------------------------------------- */

const ROOT_STATIC_IMAGES = [
  {
    id: 'RootAya',
    ...makeImage({ cluster: 'Root', name: 'RootAya' }),
    position: [0, 1.4, -2],
    scale: [2.4, 2.8, 1],
    rotation: [0, 0, 0],
    title: 'Root Sketches, 2022',
  },
  {
    id: 'Root3',
    ...makeImage({ cluster: 'Root', name: 'Root3' }),
    position: [1.5, 0.9, -0.5],
    scale: [1.4, 1.7, 1],
    hidden: true,
  },
  {
    id: 'RootPray',
    ...makeImage({ cluster: 'Root', name: 'RootPray' }),
    position: [2.5, 0.6, 0],
    scale: [0.9, 1.2, 1],
    hidden: true,
  },
  {
    id: 'RootProblem',
    ...makeImage({ cluster: 'Root', name: 'RootProblem' }),
    position: [-1.5, 0.9, -0.5],
    scale: [1.2, 1.7, 1],
    hidden: true,
  },
  {
    id: 'RootProblemInverse',
    ...makeImage({ cluster: 'Root', name: 'RootProblemInverse' }),
    position: [-2.5, 0.65, 0],
    scale: [1, 1.3, 1],
    hidden: true,
  },
];

/* -------------------------------------------------
   ROOT — rotating digital stones (Ring A)
-------------------------------------------------- */

const centerA = [-0.9, 0.52, 1.5];
const radiusA = 0.52;
const countA  = 6;
const angleStepA = (Math.PI * 2) / countA;

const digitalStones = Array.from({ length: countA }).map((_, i) => {
  const id = i + 1;
  const angle = i * angleStepA;

  const x = centerA[0] + Math.sin(angle) * radiusA;
  const z = centerA[2] + Math.cos(angle) * radiusA;

  return {
    id: `PDigital${id}`,
    ...makeImage({ cluster: 'Root', name: `PDigital${id}` }),
    hidden: id !== 6,
    position: [x, centerA[1], z],
    rotation: [0, angle, 0],
    scale: [0.6, 0.8, 1],
    isFloating: true,
    ring: 'A',
  };
});

/* -------------------------------------------------
   ROOT — rotating stones (Ring B)
-------------------------------------------------- */

const ringBNames = [
  'boug2',
  'boug3',
  'BougMuse3',
  'BougMuse4',
  'niji',
  'TriptychTwin',
];

const centerB = [0.9, 0.52, 1.5];
const radiusB = 0.52;
const angleStepB = (Math.PI * 2) / ringBNames.length;

const digitalStonesB = ringBNames.map((name, i) => {
  const angle = i * angleStepB;
  const x = centerB[0] + Math.sin(angle) * radiusB;
  const z = centerB[2] + Math.cos(angle) * radiusB;

  return {
    id: name,
    ...makeImage({ cluster: 'Root', name }),
    hidden: name !== 'boug2',
    position: [x, centerB[1], z],
    rotation: [0, angle, 0],
    scale: [0.6, 0.8, 1],
    isFloating: true,
    ring: 'B',
    panelColor: '#F5EFE6',
    panelOpacity: 0.9,
  };
});

/* -------------------------------------------------
   CONCEPT CLUSTERS (no layout changes)
-------------------------------------------------- */

export const conceptAssets = [
  {
    id: 'cluster-root',
    title: 'Root Sketches',
    subtitle: 'Celestial Bodies',
    year: '2022',
    layout: 'default',
    flickerColor: '#fff2cc',
    position: [0, 0, 0],
    images: [
      ...ROOT_STATIC_IMAGES,
      ...digitalStones,
      ...digitalStonesB,
    ],
  },

  {
    id: 'cluster-lumen',
    title: 'Lumen',
    subtitle: 'Surveillance and astral echoes',
    year: '2024',
    label: 'Lumen',
    maskVariant: 'lumen',
    images: getLumenAll(),
  },

  {
    id: 'cluster-penumbra',
    title: 'Penumbra',
    subtitle: 'Iridescent portraits suspended between light and shadow',
    year: '2023',
    label: 'Penumbra',
    layout: 'penumbra',
    maskVariant: 'penumbra',
    flickerColor: '#c6baff',
    images: penumbraAssets,
    defaultStartKey: '/media/concepts/Penumbra/thumbnails/muse_512.webp',
  },

  {
    id: 'cluster-abyss',
    title: 'Abyss',
    subtitle: 'Study in red light and mirrored forms',
    year: '2023',
    label: 'Abyss',
    flickerColor: '#d32f2f',
    position: [-3, -1, -2],
    scale: [1, 1, 1],
    images: abyssAssets,
  },

  {
    id: 'cluster-hats',
    title: 'Headpieces & Hats',
    subtitle: 'Variations of hats / coverings',
    year: '2023',
    label: 'Hats',
    assets: hatsAssets,
  },

  {
    id: 'cluster-early-aliens',
    title: 'Protoforms',
    subtitle: 'MJ v3 portrait artifacts',
    year: '2022',
    label: 'Protoforms',
    assets: earlyAliensAssets,
  },
];

/* -------------------------------------------------
   PENUMBRA GEOMETRY DATA (unchanged)
-------------------------------------------------- */

export const penumbraData = {
  id: 'penumbra',
  colors: {
    bgStart: '#E7DBF1',
    bgMid:   '#D6D1D2',
    bgEnd:   '#595556',
    tint:    '#9C9690',
    accent:  '#F1E7FF',
  },
  radius: 5,
  height: 2.8,
  baseRadius: 0.08,
  tipRadius: 0.16,
  tipGap: 0.22,
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  baseScale: 2.6,
};
