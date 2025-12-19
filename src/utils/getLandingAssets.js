// src/utils/getLandingAssets.js
//
// Auto-collect all media inside public/media/ and subfolders.
// - Filters for 512px thumbnails only (preferred thumbnail size)
// - Removes duplicates by base name
// - Includes videos (.mp4)
// - Returns clean normalized array for Masonry

export async function getLandingAssets() {
  // ROOT where assets live
  const mediaRoot = "/media/";

  // Extensions we care about
  const imageExt = [".webp", ".png", ".jpg", ".jpeg"];
  const videoExt = [".mp4"];

  // Fetch asset URLs from the concept folders under public/media
  const importMeta = import.meta.glob(
    "../../public/media/concepts/{Abyss,Penumbra,EarlyAliens,Hats,Lumen,Root,Other}/**/*",
    {
      query: "?url",
      import: "default",
      eager: true,
    }
  );

  // Convert import.meta.glob result → array of file paths
  const allFiles = Object.values(importMeta).map((path) =>
    path.replace(/^.*\/public/, "")
  );

  // Normalize filenames to dedupe variants (e.g., _512, _1600, copy (1))
  const normalizeKey = (file) => {
    const basename = (file.split("/").pop() || "").toLowerCase();
    return basename
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/_?(512|1600)$/i, "")
      .replace(/[-_ ]copy\d*$/i, "")
      .replace(/[-_ ]?\(\d+\)$/i, "")
      .replace(/[-_ ]\d+$/i, "");
  };

  // Map: { baseName → bestFile }
  const deduped = new Map();

  for (const file of allFiles) {
    const lower = file.toLowerCase();

    const isImage = imageExt.some((ext) => lower.endsWith(ext));
    const isVideo = videoExt.some((ext) => lower.endsWith(ext));

    if (!isImage && !isVideo) continue;

    // Normalized base name (no _512, _1600, extension, "copy" suffixes, trailing numbers)
    const nameWithoutExt = normalizeKey(file);

    // If we already have an entry but new one is not better → skip
    if (deduped.has(nameWithoutExt)) {
      const existing = deduped.get(nameWithoutExt);

      // Prefer 512.webp → best thumbnail for landing page
      const preferNew =
        file.includes("_512") ||
        (!existing.includes("_512") && lower.endsWith(".webp"));

      if (!preferNew) continue;
    }

    // Save the better thumbnail candidate
    deduped.set(nameWithoutExt, file);
  }

  // Final clean array
  const result = Array.from(deduped.values()).map((file) => ({
    src: file,
    type: videoExt.some((ext) => file.toLowerCase().endsWith(ext))
      ? "video"
      : "image",
  }));

  return result;
}
