// src/components/MainContent/ImageOverlay.jsx
import React from 'react';
import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';


export default function ImageOverlay({ url }) {
  const texture = useLoader(TextureLoader, url);

  // Offset slightly forward from panel face
  const imageOffsetZ = 0.05 + 0.001;

  return (
    <mesh position={[0, 0, imageOffsetZ]} renderOrder={1}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        side={2}
        transparent
        toneMapped={false}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
      />
    </mesh>
  );
}
