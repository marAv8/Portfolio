import React from 'react';

export default function HitPlane({
  radius = 6,
  y = 0,
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
      rotation={[-Math.PI / 2, 0, 0]}
      frustumCulled={false}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      {...rest}
    >
      <circleGeometry args={[radius, 64]} />
      {debug ? (
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={2} />
      ) : (
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      )}
    </mesh>
  );
}

