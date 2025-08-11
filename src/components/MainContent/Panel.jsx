// src/components/MainContent/Panel.jsx
import React from 'react';

export default function Panel({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  color = '#e6e6e6',
  opacity = 0.9,
  roughness = 0.4,
  metalness = 0.3,
  thickness = 0.05,
}) {
  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <boxGeometry args={[1, 1, thickness]} />
      <meshPhysicalMaterial
        color={color}
        transparent
        opacity={opacity}
        roughness={roughness}
        metalness={metalness}
        reflectivity={0.3}
        clearcoat={0.5}
        clearcoatRoughness={0.05}
      />
    </mesh>
  );
}