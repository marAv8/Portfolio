// src/utils/textureTune.js
import * as THREE from 'three';

// Tune common texture parameters for crisp, performant sampling
export function tuneTexture(tex, gl) {
  if (!tex) return tex;
  try {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    const maxAniso = gl?.capabilities?.getMaxAnisotropy?.() ?? 8;
    tex.anisotropy = Math.min(8, maxAniso);
    tex.needsUpdate = true;
  } catch (_) {
    // noop — be tolerant if env differs
  }
  return tex;
}

