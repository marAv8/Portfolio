// src/assets/assetsRight.js

export const right = {
  lumen: {
    order: ["earth", "moon", "space"],
    earth: [
      {
        type: "image",
        url: "/media/concepts/RightScreen/Lumen/earth1_512.webp",
        thumb: "/media/concepts/RightScreen/Lumen/earth1_512.webp",
        full: "/media/concepts/RightScreen/Lumen/earth1_1600.webp",
        scale: [4, 4, 1],
        position: [-1.2, 2.1, -2],
      },
      {
        type: "video",
        url: "/media/concepts/RightScreen/Lumen/earth5.mp4",
        scale: [2, 2, 1],
        position: [1.8, 3.1, -1],
      },

      {
        type: "image",
        url: "/media/concepts/RightScreen/Lumen/earth2_512.webp",
        thumb: "/media/concepts/RightScreen/Lumen/earth2_512.webp",
        full: "/media/concepts/RightScreen/Lumen/earth2_1600.webp",
        scale: [1.3, 1.3, 1],
        position: [-2.7, 0.7, -0.5],
      },
      {
        type: "video",
        url: "/media/concepts/RightScreen/Lumen/earth6.mp4",
        scale: [2, 2, 1],
        position: [1.8, 1.1, -1],
      },

      {
        type: "image",
        url: "/media/concepts/RightScreen/Lumen/earth3_512.webp",
        thumb: "/media/concepts/RightScreen/Lumen/earth3_512.webp",
        full: "/media/concepts/RightScreen/Lumen/earth3_1600.webp",
        scale: [1.3, 1.3, 1.3],
        position: [0.3, 0.7, -0.5],
      },
      {
        type: "video",
        url: "/media/concepts/RightScreen/Lumen/earth7.mp4",
        scale: [1.5, 1.5, 1],
        position: [5, 4, -2],
      },
    ],
    moon: [
      {
        type: "image",
        url: "/media/concepts/RightScreen/Lumen/moon4_512.webp",
        thumb: "/media/concepts/RightScreen/Lumen/moon4_512.webp",
        full: "/media/concepts/RightScreen/Lumen/moon4_1600.webp",
        scale: [2, 2, 1],
        position: [0, 1.2, 0],
        hidden: true,
      },
    ],
    space: [
      {
        type: "video",
        url: "/media/concepts/RightScreen/Lumen/Space5.mp4",
        // poster: "/media/concepts/RightScreen/Lumen/earth1_512.webp",
        scale: [3, 3, 0.4],
        position: [0, 2, 0],
      },
    ],
  },

  // HATS — simple list
  hats: [
    { url: '/media/concepts/RightScreen/Hats/33_512.webp', thumb: '/media/concepts/RightScreen/Hats/33_512.webp', full: '/media/concepts/RightScreen/Hats/33_1600.webp' },
    { url: '/media/concepts/RightScreen/Hats/alienHat copy_512.webp', thumb: '/media/concepts/RightScreen/Hats/alienHat copy_512.webp', full: '/media/concepts/RightScreen/Hats/alienHat copy_1600.webp' },
    { url: '/media/concepts/RightScreen/Hats/blueSkyHat copy.png_512.webp', thumb: '/media/concepts/RightScreen/Hats/blueSkyHat copy.png_512.webp', full: '/media/concepts/RightScreen/Hats/blueSkyHat copy.png_1600.webp' },
    { url: '/media/concepts/RightScreen/Hats/hat1_512.webp', thumb: '/media/concepts/RightScreen/Hats/hat1_512.webp', full: '/media/concepts/RightScreen/Hats/hat1_1600.webp' },
    { url: '/media/concepts/RightScreen/Hats/hat2_512.webp', thumb: '/media/concepts/RightScreen/Hats/hat2_512.webp', full: '/media/concepts/RightScreen/Hats/hat2_1600.webp' },
    { url: '/media/concepts/RightScreen/Hats/hat3_512.webp', thumb: '/media/concepts/RightScreen/Hats/hat3_512.webp', full: '/media/concepts/RightScreen/Hats/hat3_1600.webp' },
    { url: '/media/concepts/RightScreen/Hats/hat4_512.webp', thumb: '/media/concepts/RightScreen/Hats/hat4_512.webp', full: '/media/concepts/RightScreen/Hats/hat4_1600.webp' },
    { url: '/media/concepts/RightScreen/Hats/hat5_512.webp', thumb: '/media/concepts/RightScreen/Hats/hat5_512.webp', full: '/media/concepts/RightScreen/Hats/hat5_1600.webp' },
    { url: '/media/concepts/RightScreen/Hats/lavender_512.webp', thumb: '/media/concepts/RightScreen/Hats/lavender_512.webp', full: '/media/concepts/RightScreen/Hats/lavender_1600.webp' },
    { url: '/media/concepts/RightScreen/Hats/liquidHat_512.webp', thumb: '/media/concepts/RightScreen/Hats/liquidHat_512.webp', full: '/media/concepts/RightScreen/Hats/liquidHat_1600.webp' },
    { url: '/media/concepts/RightScreen/Hats/meshPurpleHat copy_512.webp', thumb: '/media/concepts/RightScreen/Hats/meshPurpleHat copy_512.webp', full: '/media/concepts/RightScreen/Hats/meshPurpleHat copy_1600.webp' },
    { url: '/media/concepts/RightScreen/Hats/real copy_512.webp', thumb: '/media/concepts/RightScreen/Hats/real copy_512.webp', full: '/media/concepts/RightScreen/Hats/real copy_1600.webp' },
    { url: '/media/concepts/RightScreen/Hats/veil_512.webp', thumb: '/media/concepts/RightScreen/Hats/veil_512.webp', full: '/media/concepts/RightScreen/Hats/veil_1600.webp' },
  ],
};

// ✅ Named export (mirrors left-side style)
export const hatsAssets = right.hats;

// (Optional helpers you already had)
const _allLumen = right.lumen.order.flatMap(k => right.lumen[k]);
export const getLumenSubset = (key) => right.lumen[key] || [];
export const getLumenAll = () => _allLumen;
