/* =================================================
   LUMEN (Right side)
   Structured by semantic groups
================================================= */

export const right = {
  lumen: {
    order: ['earth', 'moon', 'space'],

    earth: [
      {
        id: 'earth1',
        type: 'image',
        thumb: '/media/concepts/Lumen/thumbnails/earth1_512.webp',
        full:  '/media/concepts/Lumen/full/earth1_1600.webp',
        scale: [4, 4, 1],
        position: [-1.2, 2.1, 0],
      },
      {
        id: 'earth5-video',
        type: 'video',
        url: '/media/concepts/Lumen/video/earth5.mp4',
        scale: [2, 2, 1],
        position: [1.8, 3.1, 0.3],
      },
      {
        id: 'earth2',
        type: 'image',
        thumb: '/media/concepts/Lumen/thumbnails/earth2_512.webp',
        full:  '/media/concepts/Lumen/full/earth2_1600.webp',
        scale: [1.5, 1.35, 1],
        position: [-2.4, 0.8, 0.2],
      },
      {
        id: 'earth6-video',
        type: 'video',
        url: '/media/concepts/Lumen/video/earth6.mp4',
        scale: [2, 2, 1],
        position: [1.8, 1.1, 0.3],
      },
      {
        id: 'earth3',
        type: 'image',
        thumb: '/media/concepts/Lumen/thumbnails/earth3_512.webp',
        full:  '/media/concepts/Lumen/full/earth3_1600.webp',
        scale: [1.5, 1.35, 1],
        position: [0.3, 0.8, 0.2],
      },
      {
        id: 'earth7-video',
        type: 'video',
        url: '/media/concepts/Lumen/video/earth7.mp4',
        scale: [1.3, 1.3, 1],
        position: [-1.1, 0.8, 0.3],
      },
    ],

    moon: [
      {
        id: 'moon4',
        type: 'image',
        thumb: '/media/concepts/Lumen/thumbnails/moon4_512.webp',
        full:  '/media/concepts/Lumen/full/moon4_1600.webp',
        scale: [1.8, 1.8, 1],
        position: [1.95, 1.5, -1.9],
        hidden: true,
      },
    ],

    space: [
      {
        id: 'space5-video',
        type: 'video',
        url: '/media/concepts/Lumen/video/Space5.mp4',
        scale: [2.5, 2.5, 0.4],
        position: [0.6, 3, 3.7],
      },
    ],
  },

  /* =================================================
     HATS (Right side — flat list)
  ================================================= */

  hats: [
    {
      id: '33',
      thumb: '/media/concepts/Hats/thumbnails/33_512.webp',
      full:  '/media/concepts/Hats/full/33_1600.webp',
    },
    {
      id: 'alienHat',
      thumb: '/media/concepts/Hats/thumbnails/alienHat copy_512.webp',
      full:  '/media/concepts/Hats/full/alienHat copy_1600.webp',
    },
    {
      id: 'blueSkyHat',
      thumb: '/media/concepts/Hats/thumbnails/blueSkyHat copy.png_512.webp',
      full:  '/media/concepts/Hats/full/blueSkyHat copy.png_1600.webp',
    },
    {
      id: 'hat1',
      thumb: '/media/concepts/Hats/thumbnails/hat1_512.webp',
      full:  '/media/concepts/Hats/full/hat1_1600 2.webp',
    },
    {
      id: 'hat2',
      thumb: '/media/concepts/Hats/thumbnails/hat2_512 2.webp',
      full:  '/media/concepts/Hats/full/hat2_1600 2.webp',
    },
    {
      id: 'hat3',
      thumb: '/media/concepts/Hats/thumbnails/hat3_512 2.webp',
      full:  '/media/concepts/Hats/full/hat3_1600.webp',
    },
    {
      id: 'hat4',
      thumb: '/media/concepts/Hats/thumbnails/hat4_512.webp',
      full:  '/media/concepts/Hats/full/hat4_1600 2.webp',
    },
    {
      id: 'hat5',
      thumb: '/media/concepts/Hats/thumbnails/hat5_512 2.webp',
      full:  '/media/concepts/Hats/full/hat5_1600.webp',
    },
    {
      id: 'lavender',
      thumb: '/media/concepts/Hats/thumbnails/lavender_512 2.webp',
      full:  '/media/concepts/Hats/full/lavender_1600 2.webp',
    },
    {
      id: 'liquidHat',
      thumb: '/media/concepts/Hats/thumbnails/liquidHat_512.webp',
      full:  '/media/concepts/Hats/full/liquidHat_1600 2.webp',
    },
    {
      id: 'meshPurpleHat',
      thumb: '/media/concepts/Hats/thumbnails/meshPurpleHat copy_512.webp',
      full:  '/media/concepts/Hats/full/meshPurpleHat copy_1600 2.webp',
    },
    {
      id: 'real',
      thumb: '/media/concepts/Hats/thumbnails/real copy_512.webp',
      full:  '/media/concepts/Hats/full/real copy_1600.webp',
    },
    {
      id: 'veil',
      thumb: '/media/concepts/Hats/thumbnails/veil_512 2.webp',
      full:  '/media/concepts/Hats/full/veil_1600.webp',
    },
  ],
};

/* =================================================
   EXPORTS (unchanged API)
================================================= */

export const hatsAssets = right.hats;

const _allLumen = right.lumen.order.flatMap(
  (key) => right.lumen[key]
);

export const getLumenSubset = (key) => right.lumen[key] || [];
export const getLumenAll = () => _allLumen;
