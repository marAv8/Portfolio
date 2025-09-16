// src/components/common/HitRing.jsx
import React from 'react';
import * as THREE from 'three';

export default function HitRing({
  majorR,          // ring radius (same R you use to place panels)
  tubeR,           // cross-section radius (≈ half panel height, see usage below)
  y = 0,           // local Y lift
  debug = false,
  onPointerOver,
  onPointerOut,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
  ...rest
}) {
  return (
    <mesh
      position={[0, y, 0]}
      // Torus axis defaults to Z; rotate so its axis is Y => ring lies in XZ plane (like your wheel)
      rotation={[Math.PI / 2, 0, 0]}
      frustumCulled={false}
      onPointerOver={(e)=>{e.stopPropagation(); onPointerOver?.(e);}}
      onPointerOut={(e)=>{e.stopPropagation(); onPointerOut?.(e);}}
      onPointerDown={(e)=>{e.stopPropagation(); onPointerDown?.(e);}}
      onPointerMove={(e)=>{e.stopPropagation(); onPointerMove?.(e);}}
      onPointerUp={(e)=>{e.stopPropagation(); onPointerUp?.(e);}}
      onPointerLeave={(e)=>{e.stopPropagation(); onPointerLeave?.(e);}}
      {...rest}
    >
      {/* segments: enough for smooth ray hits without being heavy */}
      <torusGeometry args={[majorR, tubeR, 22, 96]} />
      {debug ? (
        <meshBasicMaterial color="lime" transparent opacity={0.12} depthWrite={false} />
      ) : (
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      )}
    </mesh>
  );
}
