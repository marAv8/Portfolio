// src/components/MainContent/PanelVideoFace.jsx
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useVideoTexture } from '@react-three/drei';

export default function PanelVideoFace({
  url,
  width = 1,          // desired plane width
  height = 1,         // desired plane height
  fit = 'stretch',    // 'stretch' | 'cover' | 'contain'
  doubleSided = true, // render both faces non-mirrored
  muted = true,
  loop = true,
  autoplay = true,
}) {
  const texture = useVideoTexture(url, {
    crossOrigin: 'anonymous',
    muted,
    loop,
    start: autoplay,
  });

  // compute aspect-aware dims if you ever want cover/contain (optional)
  const dims = useMemo(() => {
    if (!texture?.image?.videoWidth || !texture?.image?.videoHeight || fit === 'stretch') {
      return [width, height];
    }
    const vidW = texture.image.videoWidth;
    const vidH = texture.image.videoHeight;
    const vidA = vidW / vidH;
    const boxA = width / height;

    if (fit === 'cover') {
      return vidA > boxA ? [height * vidA, height] : [width, width / vidA];
    } else { // 'contain'
      return vidA > boxA ? [width, width / vidA] : [height * vidA, height];
    }
  }, [texture?.image?.videoWidth, texture?.image?.videoHeight, width, height, fit]);

  const [W, H] = dims;

  return (
    <group>
      {/* front face */}
      <mesh position={[0, 0, 0.051]}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial map={texture} side={THREE.FrontSide} transparent={false} toneMapped={false} />
      </mesh>

      {/* back face (non-mirrored) */}
      {doubleSided && (
        <mesh rotation={[0, Math.PI, 0]} position={[0, 0, -0.051]}>
          <planeGeometry args={[W, H]} />
          <meshBasicMaterial map={texture} side={THREE.FrontSide} transparent={false} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
