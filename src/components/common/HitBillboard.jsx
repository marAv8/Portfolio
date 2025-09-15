import React, { useMemo, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function HitBillboard({
  width = 10,
  height = 8,
  y = 0,           // lift in parent's local Y
  offset = 1.2,    // push toward camera along the view dir
  debug = false,
  onPointerOver,
  onPointerOut,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
  ...rest
}) {
  const mesh = useRef(null);
  const { camera } = useThree();
  const tmpWorld = useMemo(() => new THREE.Vector3(), []);
  const tmpDir   = useMemo(() => new THREE.Vector3(), []);
  const tmpPos   = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const m = mesh.current;
    const parent = m?.parent;
    if (!m || !parent) return;

    // parent origin in world + local Y lift
    parent.updateWorldMatrix(true, false);
    tmpWorld.setFromMatrixPosition(parent.matrixWorld);
    tmpWorld.y += y;

    // project forward toward camera
    tmpDir.copy(camera.position).sub(tmpWorld).normalize();
    const worldPos = tmpPos.copy(tmpWorld).addScaledVector(tmpDir, offset);

    // convert to local so the plane lives under the cluster
    const localPos = parent.worldToLocal(worldPos);
    m.position.copy(localPos);

    // face the camera
    const localCam = parent.worldToLocal(camera.position.clone());
    m.lookAt(localCam);
  });

  return (
    <mesh
      ref={mesh}
      frustumCulled={false}
      onPointerOver={(e)=>{e.stopPropagation(); onPointerOver?.(e);}}
      onPointerOut={(e)=>{e.stopPropagation(); onPointerOut?.(e);}}
      onPointerDown={(e)=>{e.stopPropagation(); onPointerDown?.(e);}}
      onPointerMove={(e)=>{e.stopPropagation(); onPointerMove?.(e);}}
      onPointerUp={(e)=>{e.stopPropagation(); onPointerUp?.(e);}}
      onPointerLeave={(e)=>{e.stopPropagation(); onPointerLeave?.(e);}}
      {...rest}
    >
      <planeGeometry args={[width, height]} />
      {debug ? (
        <meshBasicMaterial color="hotpink" transparent opacity={0.12} depthWrite={false} />
      ) : (
        <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} />
      )}
    </mesh>
  );
}
