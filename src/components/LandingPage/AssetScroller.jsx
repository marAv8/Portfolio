// src/components/LandingPage/AssetScroller.jsx
import React, { useRef, useContext, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture, useVideoTexture } from '@react-three/drei';
import * as THREE from 'three';
import { ModalContext } from '../../contexts/ModalContext';

export default function AssetScroller({
  isVideo,
  url,            // this is the thumb (_512.webp) for images
  originalUrl,    // <-- ADD: original PNG/JPG for fallback
  size,
  position,
  rotation = [0, 0, 0],
  speed = 10,
}) {
  const meshRef = useRef();
  const { camera } = useThree();
  const modalOpen = useContext(ModalContext);
  const [visible, setVisible] = useState(false);

  // Resolve URL: try thumb first; if missing, fall back to original
  const [resolvedUrl, setResolvedUrl] = useState(url);
  useEffect(() => {
    let alive = true;
    if (isVideo) { setResolvedUrl(url); return; }
    // HEAD is cheap and enough to see if the file exists
    fetch(url, { method: 'HEAD' })
      .then(r => { if (alive) setResolvedUrl(r.ok ? url : (originalUrl || url)); })
      .catch(() => { if (alive) setResolvedUrl(originalUrl || url); });
    return () => { alive = false; };
  }, [url, originalUrl, isVideo]);

  // Load texture with the resolved URL
  const texture = !isVideo ? useTexture(resolvedUrl) : null;
  const videoTexture = isVideo ? useVideoTexture(url) : null;

  // Small GPU-friendly defaults for old machines
  useEffect(() => {
    if (!texture) return;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 2;
    // If your images look washed out, consider:
    // texture.colorSpace = THREE.SRGBColorSpace;
  }, [texture]);

  const [x0, y0, z0] = position;

  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    mesh.position.set(x0, y0, z0);
    mesh.rotation.set(...rotation);
    requestAnimationFrame(() => setVisible(true));
  }, [x0, y0, z0, rotation]);

  useFrame((state) => {
    if (!meshRef.current || modalOpen || !visible) return;
    const mesh = meshRef.current;
    const elapsed = state.clock.getElapsedTime();

    const depth = Math.abs(z0 - camera.position.z);
    const frustumHalfHeight = depth * Math.tan((camera.fov * Math.PI) / 360);

    const top = camera.position.y + frustumHalfHeight;
    const bottom = camera.position.y - frustumHalfHeight;
    const totalTravel = top - bottom;

    mesh.position.y = ((y0 + elapsed * speed - bottom) % totalTravel) + bottom - size[1];
  });

  return (
    <mesh ref={meshRef} visible={visible}>
      <planeGeometry args={size} />
      {isVideo ? (
        <meshBasicMaterial
          map={videoTexture}
          side={THREE.DoubleSide}
          transparent
          depthWrite={false}
        />
      ) : (
        <meshLambertMaterial
          key={resolvedUrl}               // force material/texture refresh when URL changes
          map={texture}
          side={THREE.DoubleSide}
          transparent
          depthWrite={false}
        />
      )}
    </mesh>
  );
}
