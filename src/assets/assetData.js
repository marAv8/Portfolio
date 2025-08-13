// src/assets/assetData.js

// Turn "/media/foo.png" => "/media/foo_512.webp" and "/media/foo_1600.webp"
const toVariantUrls = (url) => {
  if (typeof url !== 'string') return { thumb: url, full: url };
  const dot = url.lastIndexOf('.');
  if (dot < 0) return { thumb: url, full: url };
  const base = url.slice(0, dot);
  return {
    thumb: `${base}_512.webp`,
    full:  `${base}_1600.webp`,
  };
};

const rawAssets = [
  { url: '/media/CeremonyStriation.png', size: [40, 40] },
  { url: '/media/Post.mp4', size: [150, 100], manualPosition: [-300, -600, -300], isVideo: true },
  { url: '/media/72.png', size: [50, 70] },
  { url: '/media/73.png', size: [50, 50] },
  { url: '/media/74.png', size: [50, 50] },
  { url: '/media/Beauty.png', size: [40, 90] },
  { url: '/media/EarlyAlien.png', size: [50, 50] },
  { url: '/media/Anna.png', size: [70, 80], manualPosition: [-100, 180, -100] },
  { url: '/media/McQueenBlue.png', size: [60, 95] },
  { url: '/media/OrientalCastle.png', size: [100, 40], manualPosition: [200, -180, -200] },
  { url: '/media/freak.JPEG', size: [50, 50] },
  { url: '/media/BougMuse.png', size: [120, 120] },
  { url: '/media/THREE.png', size: [40, 40] },
  { url: '/media/CaucP.jpg', size: [60, 60] },
  { url: '/media/3Trans.png', size: [50, 50] },
  { url: '/media/CeremonyNefertiti.png', size: [70, 70] },
  { url: '/media/Doll.png', size: [40, 40] },
  { url: '/media/NetMask.jpg', size: [50, 50] },
  { url: '/media/BrutDigital.png', size: [40, 40] },
  { url: '/media/THREE4.png', size: [40, 40] },
  { url: '/media/ArtBelow.png', size: [40, 40] },
  { url: '/media/Survalance.png', size: [70, 70], manualPosition: [0, 50, -100] },
  { url: '/media/ayaInverse.png', size: [50, 70], manualPosition: [200, -50, -250] },
  { url: '/media/aya3.png', size: [60, 84] },
  { url: '/media/moon.png', size: [55, 45], manualPosition: [0, -100, -200] },
  { url: '/media/bougHeadP.png', size: [50, 90] },
  { url: '/media/orchidPearl.png', size: [50, 50] },
  { url: '/media/OrientalTropicCastle.png', size: [20, 20], manualPosition: [-150, -100, -300] },
  { url: '/media/decimA.png', size: [40, 40] },
  { url: '/media/MuseHalo.jpg', size: [50, 50] },
  { url: '/media/pom.mp4', size: [50, 50], isVideo: true },
  { url: '/media/portal.mp4', size: [50, 50], isVideo: true },
  { url: '/media/Castle.mp4', size: [50, 80], isVideo: true },
  { url: '/media/Praying.mp4', size: [50, 50], manualPosition: [0, -200, -300], isVideo: true },
  { url: '/media/Clouds.mp4', size: [60, 60], manualPosition: [0, -300, -300], isVideo: true },
  { url: '/media/taksim.mp4', size: [140, 50], isVideo: true },
];

const CAMERA_Z = 150;
const BASE_Z = -200;
const baseDist = Math.abs(BASE_Z - CAMERA_Z);

function sizeMultiplierFor(z) {
  return baseDist / Math.abs(z - CAMERA_Z);
}

const DEPTH_LAYERS = [
  { z: -100, size: sizeMultiplierFor(-100), speed: 10 },
  { z: -250, size: sizeMultiplierFor(-200), speed: 8 },
  { z: -350, size: sizeMultiplierFor(-350), speed: 6 },
];

const SPREAD_RADIUS = 450;
const Y_STRETCH = 1.5;
const JITTER = 60;

const STACK_COUNT = 1; // how many vertical stacks to make
const STACK_SPACING = 600; // vertical spacing between stacks

export const assets = [];

for (let s = 0; s < STACK_COUNT; s++) {
  rawAssets.forEach((asset, i) => {
    const layer = DEPTH_LAYERS[i % DEPTH_LAYERS.length];
    const [rawW, rawH] = asset.size;

    let position;

    if (asset.manualPosition) {
      position = [
        asset.manualPosition[0],
        asset.manualPosition[1] + s * STACK_SPACING,
        asset.manualPosition[2],
      ];
    } else {
      const angle = (i / rawAssets.length) * Math.PI * 2;
      let x = Math.cos(angle) * SPREAD_RADIUS;
      let y = Math.sin(angle) * SPREAD_RADIUS * Y_STRETCH + s * STACK_SPACING;
      let z = layer.z;

      x += ((Math.sin(i * 12.9898) * 43758.5453) % 1 - 0.5) * JITTER;
      y += ((Math.cos(i * 78.233) * 12345.6789) % 1 - 0.5) * JITTER;
      z += ((Math.sin(i * 999) * 12345) % 1 - 0.5) * 100;

      position = [x, y, z];
    }

    const size = [rawW * layer.size, rawH * layer.size];
    const speed = 10;

    // Use small thumbs for images in the scatter; leave videos untouched
    const isImg = !asset.isVideo;
    const v = isImg ? toVariantUrls(asset.url) : {};
    const displayUrl = isImg ? v.thumb : asset.url;

    assets.push({
      url: displayUrl,                    
      full: isImg ? v.full : undefined,
      originalUrl: asset.url,  
      isVideo: asset.isVideo || false,
      size,
      position,
      speed,
    });
  });
}

// Root Cluster Digital Stones (kept as-is)
const center = [0, 1, 1.5];
const radius = 0.5;
const count = 6;
const angleStep = (Math.PI * 2) / count;

const digitalStones = Array.from({ length: count }).map((_, i) => {
  const angle = i * angleStep;
  const x = center[0] + Math.sin(angle) * radius;
  const z = center[2] + Math.cos(angle) * radius;
  const position = [x, center[1], z];
  const rotation = [0, angle, 0];

  return {
    url: `/media/concepts/Root/PDigital${i + 1}.png`,
    position,
    rotation,
    scale: [0.5, 0.8, 1],
    isFloating: true,
  };
});

// Enrich cluster images with {thumb, full} automatically
const enrichClusterImages = (images = []) =>
  images.map((img) => {
    if (!img?.url) return img;
    const { thumb, full } = toVariantUrls(img.url);
    return { ...img, thumb, full };
  });

export const conceptAssets = [
  {
    id: 'cluster-root',
    layout: 'default',
    position: [0, 0, 0],
    title: 'Root Sketches',
    subtitle: 'Celestial Bodies',
    year: '2022',
    images: enrichClusterImages([
      {
        url: '/media/concepts/Root/RootAya.png',
        position: [0, 1.4, -2],
        scale: [2.4, 2.8, 1],
        rotation: [0, 0, 0],
        title: 'Root Sketches, 2022'
      },
      {
        url: '/media/concepts/Root/Root3.png',
        position: [1.5, 0.9, -0.5],
        scale: [1.4, 1.7, 1],
        rotation: [0, 0, 0],
      },
      {
        url: '/media/concepts/Root/RootPray.png',
        position: [2.5, 0.6, 0],
        scale: [0.9, 1.2, 1],
        rotation: [0, 0, 0],
      },
      {
        url: '/media/concepts/Root/RootProblem.png',
        position: [-1.5, 0.9, -0.5],
        scale: [1.2, 1.7, 1],
        rotation: [0, 0, 0],
      },
      {
        url: '/media/concepts/Root/RootProblemInverse.png',
        position: [-2.5, 0.65, 0],
        scale: [1, 1.3, 1],
        rotation: [0, 0, 0],
      },
      // ✨ Clean circularly-oriented digital stones
      ...digitalStones,
    ]),
  },
];
