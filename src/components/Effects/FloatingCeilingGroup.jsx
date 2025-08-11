// src/components/Effects/FloatingCeilingGroup.jsx
import React from 'react';
import RadialFadeDisk from './RadialFadeDisk';


export default function FloatingCeilingGroup({
  position = [0, 0, 0],
  glowRadius = 3.5,
  glowHeight = .1,
  color=[1.0, 0.96, 0.82]

}) {
  return (
    <group position={position}>
      <RadialFadeDisk
        radius={glowRadius}
        height={glowHeight}
        rotation={[-.35, 0, 0]} // Face downward like a ceiling disk
      />
    
    </group>
  );
}
