// src/layoutEngine/computeLayout.js

//
// computeLayout(assets, gutter, viewportWidth)
// - assets: [{ src, type }]
// - gutter: spacing between items
// - viewportWidth: pixel width to fit columns into (defaults to window width)
//
// Returns object:
// {
//   layout: [ { id, src, type, width, height, x, y } ],
//   columns,
//   columnWidth,
//   totalWidth,
//   totalHeight,
// }
//

export async function computeLayout(assets, gutter = 8, viewportWidth = window.innerWidth) {
  // Unconventional but effective: preload all dimensions
  async function loadDimensions(asset) {
    return new Promise((resolve) => {
      if (asset.type === "video") {
        // Use <video> to measure
        const vid = document.createElement("video");
        vid.src = asset.src;
        vid.preload = "metadata";

        vid.onloadedmetadata = () => {
          const ratio =
            vid.videoWidth && vid.videoHeight
              ? vid.videoHeight / vid.videoWidth
              : 9 / 16;
          resolve({ ratio });
        };

        vid.onerror = () => {
          resolve({ ratio: 9 / 16 }); // fallback
        };
      } else {
        const img = new Image();
        img.src = asset.src;

        img.onload = () => {
          const ratio =
            img.naturalWidth && img.naturalHeight
              ? img.naturalHeight / img.naturalWidth
              : 1;
          resolve({ ratio });
        };

        img.onerror = () => resolve({ ratio: 1.4 }); // fallback
      }
    });
  }

  // Preload all sizes
  const sized = await Promise.all(
    assets.map(async (asset, i) => {
      const dims = await loadDimensions(asset);
      return {
        id: i,
        src: asset.src,
        type: asset.type,
        ratio: dims.ratio || 1,
      };
    })
  );

  // Determine number of columns based on viewport; aim for column widths that fill the screen
  const safeViewport = Math.max(320, viewportWidth || 0);
  const sidePadding = 32 * 2; // account for page padding/margins
  const availableWidth = Math.max(240, safeViewport - sidePadding);

  const targetColumnWidth =
    safeViewport >= 1600 ? 180 :
    safeViewport >= 1200 ? 170 :
    safeViewport >= 992 ? 160 :
    safeViewport >= 768 ? 150 :
    safeViewport >= 540 ? 140 :
    130;

  let columns = Math.max(
    2,
    Math.floor((availableWidth + gutter) / (targetColumnWidth + gutter))
  );
  columns = Math.min(columns, 14);

  const columnWidth = Math.floor(
    (availableWidth - gutter * (columns - 1)) / columns
  );

  // Build column heights
  const colHeights = new Array(columns).fill(0);

  // Output tiles
  const layout = [];

  for (const tile of sized) {
    const height = Math.max(48, columnWidth * tile.ratio);

    // Find the shortest column
    const shortestIndex = colHeights.indexOf(Math.max(...colHeights)) === 0
      ? colHeights.indexOf(Math.min(...colHeights))
      : colHeights.indexOf(Math.min(...colHeights));

    const x = shortestIndex * (columnWidth + gutter);
    const y = colHeights[shortestIndex];

    layout.push({
      id: tile.id,
      src: tile.src,
      type: tile.type,
      width: columnWidth,
      height,
      x,
      y,
    });

    // Increase that column’s height
    colHeights[shortestIndex] += height + gutter;
  }

  const totalHeight = Math.max(...colHeights, 0);
  const totalWidth = columns * columnWidth + gutter * (columns - 1);

  return {
    layout,
    columns,
    columnWidth,
    totalWidth,
    totalHeight,
  };
}
