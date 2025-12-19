/* =================================================
   ABYSS
================================================= */

export const abyssAssets = [
  // --- IMAGES ---
  {
    id: 'CeremonyNefertiti',
    thumb: '/media/concepts/Abyss/thumbnails/CeremonyNefertiti_512.webp',
    full:  '/media/concepts/Abyss/full/CeremonyNefertiti_1600.webp',
    position: [-7, 1.2, -5],
    size: [2.4, 2.4, 1],
  },
  {
    id: '71',
    thumb: '/media/concepts/Abyss/thumbnails/71_512.webp',
    full:  '/media/concepts/Abyss/full/71_1600.webp',
    position: [-5.8, 1.5, -6],
    size: [2.8, 2.8, 1],
  },
  {
    id: '73',
    thumb: '/media/concepts/Abyss/thumbnails/73_512.webp',
    full:  '/media/concepts/Abyss/full/73_1600.webp',
    position: [6, 1.5, -7],
    size: [2.5, 2.5, 1],
  },
  {
    id: 'CeremonyStriation',
    thumb: '/media/concepts/Abyss/thumbnails/CeremonyStriation_512.webp',
    full:  '/media/concepts/Abyss/full/CeremonyStriation_1600.webp',
    position: [7, 1.3, -5],
    size: [2.6, 2.6, 1],
  },
  {
    id: 'CeremonyTransparentHat',
    thumb: '/media/concepts/Abyss/thumbnails/CeremonyTransparentHat_512.webp',
    full:  '/media/concepts/Abyss/full/CeremonyTransparentHat_1600.webp',
    position: [7.5, 1, -4],
    size: [2.2, 2.2, 1],
    hidden: true,
  },
  {
    id: 'Abyss1',
    thumb: '/media/concepts/Abyss/thumbnails/Abyss1_512.webp',
    full:  '/media/concepts/Abyss/full/Abyss1_1600.webp',
    position: [7.5, 0.8, -2],
    size: [2, 2, 1],
  },
  {
    id: 'Abyss3',
    thumb: '/media/concepts/Abyss/thumbnails/Abyss3_512.webp',
    full:  '/media/concepts/Abyss/full/Abyss3_1600.webp',
    position: [-8.5, 1, -3],
    size: [2.3, 2.3, 1],
  },
  {
    id: 'OldAlien',
    thumb: '/media/concepts/Abyss/thumbnails/OldAlien_512.webp',
    full:  '/media/concepts/Abyss/full/OldAlien_1600.webp',
    position: [-7.7, 0.8, -1],
    size: [1.7, 1.7, 1],
  },

  // --- VIDEOS ---
  {
    id: 'AbyssHero',
    url: '/media/concepts/Abyss/video/72Video.mp4',
    type: 'video',
    isHero: true,
    position: [0, 4, -6],
    scale: [6.2, 7.8, 1],
  },
  {
    id: 'Ego',
    url: '/media/concepts/Abyss/video/Ego.mp4',
    type: 'video',
    position: [-4, 2, -8.5],
    size: [1.9, 1.9, 1],
  },
  {
    id: 'Pom',
    url: '/media/concepts/Abyss/video/pom.mp4',
    type: 'video',
    position: [4, 2, -8.5],
    size: [1.9, 1.9, 1],
  },
];

/* =================================================
   EARLY ALIENS
================================================= */

export const earlyAliensAssets = [
  1,3,4,5,6,7,8,9,10,11,12,13,14
].map((n) => ({
  id: `EA${n}`,
  thumb: `/media/concepts/EarlyAliens/thumbnails/EA${n}_512.webp`,
  full:  `/media/concepts/EarlyAliens/full/EA${n}_1600.webp`,
}));

/* =================================================
   PENUMBRA
   Order matters: apex → mid → foundation
================================================= */

export const penumbraAssets = [
  // --- APEX ---
  {
    id: 'fade5',
    thumb: '/media/concepts/Penumbra/thumbnails/fade5_512.webp',
    full:  '/media/concepts/Penumbra/full/fade5_1600.webp',
  },
  {
    id: 'muse',
    thumb: '/media/concepts/Penumbra/thumbnails/muse_512.webp',
    full:  '/media/concepts/Penumbra/full/muse_1600.webp',
  },

  // --- MID ---
  {
    id: 'MuseHalo',
    thumb: '/media/concepts/Penumbra/thumbnails/MuseHalo_512.webp',
    full:  '/media/concepts/Penumbra/full/MuseHalo_1600.webp',
    hidden: true,
  },
  {
    id: 'MusePray',
    thumb: '/media/concepts/Penumbra/thumbnails/MusePray_512.webp',
    full:  '/media/concepts/Penumbra/full/MusePray_1600.webp',
  },
  {
    id: 'MuseOld',
    thumb: '/media/concepts/Penumbra/thumbnails/MuseOld_512.webp',
    full:  '/media/concepts/Penumbra/full/MuseOld_1600.webp',
  },
  {
    id: 'MoonNiji',
    thumb: '/media/concepts/Penumbra/thumbnails/MoonNiji_512.webp',
    full:  '/media/concepts/Penumbra/full/MoonNiji_1600.webp',
    hidden: true,
  },
  {
    id:'postSketch1',
    thumb: '/media/concepts/Penumbra/thumbnails/postSketch1_512.webp',
    full:  '/media/concepts/Penumbra/full/postSketch1_1600.webp',
       hidden: true,
  },
  {
    id: 'postSketch2',
    thumb: '/media/concepts/Penumbra/thumbnails/postSketch2_512.webp',
    full:  '/media/concepts/Penumbra/full/postSketch2_1600.webp',
  
  },
  {
    id: 'postSketch3',
    thumb: '/media/concepts/Penumbra/thumbnails/postSketch3_512.webp',
    full:  '/media/concepts/Penumbra/full/postSketch3_1600.webp',
       hidden: true,
  },
  {
    id: 'ps1',
    thumb: '/media/concepts/Penumbra/thumbnails/ps1_512.webp',
    full:  '/media/concepts/Penumbra/full/ps1_1600.webp',
       hidden: true,
  },
  {
    id: 'ps2',
    thumb: '/media/concepts/Penumbra/thumbnails/ps2_512.webp',
    full:  '/media/concepts/Penumbra/full/ps2_1600.webp',
       hidden: true,
  },
  {
    id: 'ps3',
    thumb: '/media/concepts/Penumbra/thumbnails/ps3_512.webp',
    full:  '/media/concepts/Penumbra/full/ps3_1600.webp',
       hidden: true,
  },
  {
    id: 'ps4',
    thumb: '/media/concepts/Penumbra/thumbnails/ps4_512.webp',
    full:  '/media/concepts/Penumbra/full/ps4_1600.webp',
    
  },
  {
    id: 'polaris',
    thumb: '/media/concepts/Penumbra/thumbnails/polaris_512.webp',
    full:  '/media/concepts/Penumbra/full/polaris_1600.webp',
  },
  {
    id: 'polaris2',
    thumb: '/media/concepts/Penumbra/thumbnails/polaris2_512.webp',
    full:  '/media/concepts/Penumbra/full/polaris2_1600.webp',
  },
  {
    id: 'uncanny',
    thumb: '/media/concepts/Penumbra/thumbnails/uncanny_512.webp',
    full:  '/media/concepts/Penumbra/full/uncanny_1600.webp',
  },
  {
    id: 'museLiquidChat',
    thumb: '/media/concepts/Penumbra/thumbnails/museLiquidChat_512.webp',
    full:  '/media/concepts/Penumbra/full/museLiquidChat_1600.webp',
  },

  // --- VIDEOS ---
  {
    id: 'postSketchVideo',
    url: '/media/concepts/Penumbra/video/postSketch.mp4',
    type: 'video',
    hidden: true,
  },
  {
    id: 'museVideo',
    url: '/media/concepts/Penumbra/video/muse.mp4',
    type: 'video',
  },

  // --- FOUNDATION ---
  {
    id: 'three1',
    thumb: '/media/concepts/Penumbra/thumbnails/three1_512.webp',
    full:  '/media/concepts/Penumbra/full/three1_1600.webp',
    
  },
  {
    id: 'THREE2',
    thumb: '/media/concepts/Penumbra/thumbnails/THREE2_512.webp',
    full:  '/media/concepts/Penumbra/full/THREE2_1600.webp',
       hidden: true,
  },
  {
    id: 'THREE4',
    thumb: '/media/concepts/Penumbra/thumbnails/THREE4_512.webp',
    full:  '/media/concepts/Penumbra/full/THREE4_1600.webp',
  },
];
