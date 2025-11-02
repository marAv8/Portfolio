// src/components/MainContent/StoneImageFace.jsx
import * as THREE from 'three';
import React, { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';

/**
 * props:
 *  - item: { thumb, full, url, scale:[x,y,z] ... }
 *  - preferRetina: boolean | 'auto'
 */
export default function StoneImageFace({ item, preferRetina = 'auto', width = 1, height = 1 }) {
  const { gl, size, camera } = useThree();
  const maxAniso = gl.capabilities.getMaxAnisotropy?.() ?? 4;

  // Decide which variant to use. On mobile preview we want the crisp one for *visible* stones.
  const pickFull = useMemo(() => {
    if (preferRetina === true) return true;
    if (preferRetina === false) return false;

    // 'auto': rough heuristic based on screen width & DPR cap.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75); // matches your mobile cap
    const approxCssWidth = Math.min(size.width * 0.38, 420);  // ~mobile preview panel size on screen
    const needed = approxCssWidth * dpr;                      // pixels we want
    return needed > 700; // threshold where thumb (512) will blur
  }, [preferRetina, size.width]);

  const src = (pickFull && item.full) ? item.full : (item.thumb || item.url);

  const map = useTexture(src);
  // Push texture sampling toward crispness
  if ('colorSpace' in map && 'SRGBColorSpace' in THREE) {
    map.colorSpace = THREE.SRGBColorSpace;
  }
  map.anisotropy = Math.min(8, maxAniso);
  map.generateMipmaps = true;
  map.minFilter = THREE.LinearMipmapLinearFilter;
  map.magFilter = THREE.LinearFilter;
  map.needsUpdate = true;

  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={map}
        transparent={true}
        toneMapped={false}
        premultipliedAlpha={false}
      />
    </mesh>
  );
}
