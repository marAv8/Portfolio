// src/components/LandingPage/LandingTunnel.jsx
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { assets, conceptAssets } from '../../assets/assetData';

const pseudoRandom = (seed) => {
  const x = Math.sin(seed * 9993.123) * 43758.5453;
  return x - Math.floor(x);
};

const collectImageUrls = () => {
  const urls = new Set();

  const normalize = (entry) => entry?.thumb || entry?.url || entry?.full || entry?.originalUrl;

  assets.forEach((asset) => {
    if (asset?.isVideo) return;
    const src = normalize(asset);
    if (src && !/\.(mp4|webm)$/i.test(src)) urls.add(src);
  });

  conceptAssets.forEach((cluster) => {
    const list = cluster.images || cluster.assets || [];
    list.forEach((entry) => {
      const src = normalize(entry);
      if (src && !/\.(mp4|webm)$/i.test(src)) urls.add(src);
    });
  });

  return Array.from(urls);
};

const IMAGE_POOL = collectImageUrls();

function useImageTextureMap(urls) {
  const textures = useTexture(urls);
  return useMemo(() => {
    const map = new Map();
    urls.forEach((url, idx) => {
      const tex = textures[idx];
      if (tex) {
        tex.colorSpace = THREE.SRGBColorSpace;
        map.set(url, tex);
      }
    });
    return map;
  }, [urls, textures]);
}

function ImageRing({ radius, images, textureMap, startAngle = 0 }) {
  if (!images.length || !textureMap.size) return null;

  const angleStep = (Math.PI * 2) / images.length;

  return (
    <group>
      {images.map((url, idx) => {
        const tex = textureMap.get(url);
        if (!tex) return null;
        const angle = startAngle + idx * angleStep;

        return (
          <group key={`${url}-${idx}`} rotation={[0, 0, angle]}>
            <mesh position={[radius, 0, 0]} rotation={[0, Math.PI / 2, -Math.PI / 2]}>
              <planeGeometry args={[30, 30]} />
              <meshBasicMaterial map={tex} toneMapped={false} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export default function LandingTunnel({
  rings = 10,
  ringSpacing = 42,
  scrollSpeed = 40,
  baseRadius = 85,
  animateCamera = true,
}) {
  const textureMap = useImageTextureMap(IMAGE_POOL);

  const ringConfigs = useMemo(() => {
    if (!IMAGE_POOL.length) return [];
    const total = IMAGE_POOL.length;
    return Array.from({ length: rings }).map((_, i) => {
      const seed = i + 1;
      const count = 6 + Math.floor(pseudoRandom(seed + 25) * 3); // 6-8
      const start = Math.floor(pseudoRandom(seed + 60) * total);
      const images = [];
      for (let j = 0; j < count; j += 1) {
        images.push(IMAGE_POOL[(start + j) % total]);
      }
      const radius =
        baseRadius +
        4 * i +
        (pseudoRandom(seed + 100) - 0.5) * 18;
      const startAngle = pseudoRandom(seed + 150) * Math.PI * 2;
      const speedFactor =
        i % 2 === 0
          ? 1.3 + pseudoRandom(seed + 200) * 0.3
          : 0.85 + pseudoRandom(seed + 220) * 0.25;
      return { images, radius: Math.max(90, radius), startAngle, speedFactor };
    });
  }, [rings, baseRadius]);

  const ringRefs = useRef([]);

  if (!ringConfigs.length) return null;

  return (
    <group>
      {ringConfigs.map((cfg, i) => (
        <group
          key={`ring-${i}`}
          ref={(el) => (ringRefs.current[i] = el)}
          position={[0, 0, -i * ringSpacing]}
        >
          <ImageRing
            radius={cfg.radius}
            images={cfg.images}
            textureMap={textureMap}
            startAngle={cfg.startAngle}
          />
        </group>
      ))}

      <TunnelMotion
        ringRefs={ringRefs}
        ringConfigs={ringConfigs}
        ringSpacing={ringSpacing}
        speed={scrollSpeed}
        animateCamera={animateCamera}
      />
    </group>
  );
}

function TunnelMotion({ ringRefs, ringConfigs, ringSpacing, speed, animateCamera }) {
  useFrame((state, delta) => {
    const cam = state.camera;
    const baseStep = speed * delta;

    if (animateCamera) {
      cam.position.z -= baseStep;
    }
    cam.lookAt(0, 0, cam.position.z - 200);

    const depth = ringConfigs.length * ringSpacing;
    const frontBound = animateCamera ? cam.position.z + ringSpacing : cam.position.z - 30;
    const backBound = frontBound - depth;

    ringRefs.current.forEach((group, idx) => {
      if (!group) return;

      const factor = ringConfigs[idx]?.speedFactor ?? 1;
      const displacement = factor * baseStep;

      if (animateCamera) {
        group.position.z += (factor - 1) * baseStep;
        if (group.position.z > frontBound) {
          group.position.z -= depth;
        }
      } else {
        group.position.z += displacement;
        if (group.position.z > frontBound) {
          group.position.z -= depth;
        }
      }
    });
  });

  return null;
}
