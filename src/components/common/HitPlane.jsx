// src/components/common/HitPlane.jsx
import React from 'react';

export default function HitPlane({
  radius = 30,
  y = -3,
  onClick,
  onPointerOver,
  onPointerOut,
  ...rest
}) {
  return (
    <mesh
      position={[0, y, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      {...rest}
    >
      <circleGeometry args={[radius, 64]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

