// src/components/Effects/OverheadGlow.jsx
import React from 'react';

export default function OverheadGlow({ position = [0, 2, 0], radius = 1, thickness = 0.01, color = '#ffffff' }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}> {/* Flat disk above */}
      <cylinderGeometry args={[radius, radius, thickness, 64]} />
      <meshBasicMaterial color={color} emissive={color} transparent opacity={0.6} />
    </mesh>
  );
}
