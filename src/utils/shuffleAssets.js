// import { assets as scatterAssets, conceptAssets } from "../assets/assetData";
// import { abyssAssets, earlyAliensAssets, penumbraAssets } from "../assets/assetsLeft";
// import { right } from "../assets/assetsRight";

// const isVideoUrl = (url = "") => /\.mp4$/i.test(url);

// function normalizeItem(item = {}, origin = "misc", idx = 0) {
//   const primaryUrl = item.thumb || item.url || item.full;
//   if (!primaryUrl) return null;
//   const src = item.url || item.full || item.thumb;
//   const video = item.type === "video" || item.isVideo || isVideoUrl(src);

//   return {
//     id: `${origin}-${idx}-${primaryUrl}`,
//     src,
//     thumb: item.thumb || primaryUrl,
//     full: item.full || item.url || item.thumb,
//     type: video ? "video" : "image",
//     poster: item.poster || item.thumb || item.full,
//     aspect: item.size,
//     origin,
//   };
// }

// function collectFromArray(list = [], origin = "misc", bucket, dedupe) {
//   list.forEach((raw, idx) => {
//     const normalized = normalizeItem(raw, origin, idx);
//     if (!normalized) return;
//     const key = normalized.src || normalized.thumb;
//     if (dedupe.has(key)) return;
//     dedupe.add(key);
//     bucket.push(normalized);
//   });
// }

// export default function shuffleAssets() {
//   const collected = [];
//   const seen = new Set();

//   collectFromArray(scatterAssets, "scatter", collected, seen);

//   conceptAssets.forEach((concept, idx) => {
//     const imgs = concept.images || concept.assets || [];
//     collectFromArray(imgs, concept.id || `concept-${idx}`, collected, seen);
//   });

//   collectFromArray(abyssAssets, "abyss", collected, seen);
//   collectFromArray(earlyAliensAssets, "early", collected, seen);
//   collectFromArray(penumbraAssets, "penumbra", collected, seen);

//   const lumen = right?.lumen || {};
//   (lumen.order || []).forEach((key) => collectFromArray(lumen[key] || [], `lumen-${key}`, collected, seen));
//   collectFromArray(right?.hats || [], "hats", collected, seen);

//   return [...collected].sort(() => Math.random() - 0.5);
// }
