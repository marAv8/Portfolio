// src/components/MainContent/RotatingStones.jsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import ImageOverlay from './ImageOverlay';
import Panel from './Panel';
export default function RotatingStones({
  images = [],
  center = [0, 1, 1.5],
  radius = 0.55,
  speed = 0.35,
  panelColor = '#EDE3CF',   // warm ring-only color
  panelOpacity = 0.95,
  showCenter = true,
  density = 1,
}) {
  const groupRef = useRef(null);

  useFrame((_, dt) => {
    if (groupRef.current) groupRef.current.rotation.y += dt * speed;
  });

  const densityClamped = Math.max(0, Math.min(1, density));
  const visibleCount = densityClamped >= 1
    ? images.length
    : Math.min(
        images.length,
        Math.max(densityClamped > 0 ? 1 : 0, Math.round(images.length * densityClamped))
      );
  const visibleImages = densityClamped >= 1 ? images : images.slice(0, visibleCount);

  if (!visibleImages.length) return null;

  const step = (Math.PI * 2) / visibleImages.length;

  return (
    <group ref={groupRef} position={center}>
      {/* subtle ground disk (cheap) */}
      {showCenter && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]}>
          <circleGeometry args={[radius + 0.18, 48]} />
          <meshStandardMaterial color="#000" transparent opacity={0.1} depthWrite={false} />
        </mesh>
      )}

      {/* stones */}
      {visibleImages.map((img, i) => {
        const a = i * step;
        const x = Math.sin(a) * radius;
        const z = Math.cos(a) * radius;

        // Face OUTWARD: use the angle itself
        const rotationY = a;

        const localPanelColor    = img.panelColor ?? panelColor;
        const localPanelOpacity  = img.panelOpacity ?? panelOpacity;
        const localPanelRough    = img.panelRoughness ?? 0.7;
        const localPanelMetal    = img.panelMetalness ?? 0.05;
        const localPanelThickness = img.panelThickness ?? 0.08;

        return (
          <group key={i} position={[x, 0, z]} rotation={[0, rotationY, 0]}>
            <group scale={img.scale || [1, 1, 1]}>
              <Panel
                thickness={localPanelThickness}
                color={localPanelColor}
                opacity={localPanelOpacity}
                roughness={localPanelRough}
                metalness={localPanelMetal}
              />
              <ImageOverlay url={img.url} />
            </group>
          </group>
        );
      })}
    </group>
  );
}
