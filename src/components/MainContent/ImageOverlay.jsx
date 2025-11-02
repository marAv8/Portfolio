// src/components/MainContent/ImageOverlay.jsx
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useTexture, useVideoTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useScreenSize } from '../../contexts/ScreenSizeContext';

/** Image face (writes depth, sits in front of the panel box) */
function ImageFace({ url, width, height, alphaCutoff, z }) {
  const map = useTexture(url);
  const { isMobile } = useScreenSize();
  const gl = useThree((state) => state.gl);
  const maxAnisotropy = useMemo(() => {
    const caps = gl?.capabilities;
    return typeof caps?.getMaxAnisotropy === 'function' ? caps.getMaxAnisotropy() : 1;
  }, [gl]);

  useMemo(() => {
    if (!map) return;
    map.colorSpace = THREE.SRGBColorSpace;
    if (isMobile) {
      map.generateMipmaps = true;
      map.minFilter = THREE.LinearMipmapLinearFilter;
      map.magFilter = THREE.LinearFilter;
      const safeMax = Math.max(1, maxAnisotropy || 1);
      map.anisotropy = Math.min(safeMax, 6);
    } else {
      map.generateMipmaps = true;
      map.minFilter = THREE.LinearMipmapLinearFilter;
      map.magFilter = THREE.LinearFilter;
      if (maxAnisotropy) {
        map.anisotropy = Math.max(1, Math.min(maxAnisotropy, 8));
      }
    }
    map.needsUpdate = true;
  }, [map, isMobile, maxAnisotropy]);

  return (
    <mesh renderOrder={50} position={[0, 0, z]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={map}
        transparent
        premultipliedAlpha
        alphaTest={alphaCutoff}
        depthWrite
        depthTest
        toneMapped={false}
      />
    </mesh>
  );
}

/** Video face using drei’s useVideoTexture (no alpha cutout) */
function VideoFace({ url, width, height, z }) {
  const tex = useVideoTexture(url, { loop: true, muted: true, start: true });
  useMemo(() => {
    if (!tex) return;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
  }, [tex]);

  return (
    <mesh renderOrder={50} position={[0, 0, z]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={tex} transparent={false} depthWrite depthTest toneMapped={false} />
    </mesh>
  );
}

/**
 * Router that decides image vs video. Prevents calling image loader on videos,
 * and avoids "setState during render" by not loading when url is falsy.
 */
export default function ImageOverlay({
  url,
  width = 1,
  height = 1,
  alphaCutoff = 0.03,
  z = 0.11, // safely in front of 0.05–0.10 thick panels
}) {
  if (!url) return null; // ⛔ do not trigger loaders with undefined

  const lower = String(url).toLowerCase();
  const isVideo = lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov');

  return isVideo ? (
    <VideoFace url={url} width={width} height={height} z={z} />
  ) : (
    <ImageFace url={url} width={width} height={height} alphaCutoff={alphaCutoff} z={z} />
  );
}
