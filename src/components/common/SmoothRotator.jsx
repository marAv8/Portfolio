// src/components/common/SmoothRotator.jsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export default function SmoothRotator({ axis = 'y', speed = 0.25, children, ...rest }) {
  const groupRef = useRef();
  const angleRef = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    angleRef.current += dt * speed;
    if (groupRef.current && groupRef.current.rotation && axis in groupRef.current.rotation) {
      groupRef.current.rotation[axis] = angleRef.current;
    }
  });

  return (
    <group ref={groupRef} {...rest}>
      {children}
    </group>
  );
}

