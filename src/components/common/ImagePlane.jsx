// src/components/common/ImagePlane.jsx
import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { tuneTexture } from '../../utils/textureTune';

export default function ImagePlane({ src, width = 1, height = 1, ...meshProps }) {
  const { gl } = useThree();
  const map = useTexture(src);

  useEffect(() => {
    if (map && gl) tuneTexture(map, gl);
  }, [map, gl]);

  return (
    <mesh {...meshProps}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={map}
        transparent
        premultipliedAlpha
        alphaTest={0.02}
        depthWrite={false}
      />
    </mesh>
  );
}

