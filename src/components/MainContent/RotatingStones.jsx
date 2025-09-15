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
}) {
  const groupRef = useRef(null);

  useFrame((_, dt) => {
    if (groupRef.current) groupRef.current.rotation.y += dt * speed;
  });

  if (!images.length) return null;

  const step = (Math.PI * 2) / images.length;

  return (
    <group ref={groupRef} position={center}>
      {/* subtle ground disk (cheap) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]}>
        <circleGeometry args={[radius + 0.18, 48]} />
        <meshStandardMaterial color="#000" transparent opacity={0.1} depthWrite={false} />
      </mesh>

      {/* stones */}
      {images.map((img, i) => {
        const a = i * step;
        const x = Math.sin(a) * radius;
        const z = Math.cos(a) * radius;

        // Face OUTWARD: use the angle itself
        const rotationY = a;

        return (
          <group key={i} position={[x, 0, z]} rotation={[0, rotationY, 0]}>
            <group scale={img.scale || [1, 1, 1]}>
              <Panel
                thickness={0.08}
                color={panelColor}
                opacity={panelOpacity}
                roughness={0.7}
                metalness={0.05}
              />
              <ImageOverlay url={img.url} />
            </group>
          </group>
        );
      })}
    </group>
  );
}
