// src/components/LandingPage/AssetScroller.jsx

import React, { useRef, useContext, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture, useVideoTexture } from '@react-three/drei';
import * as THREE from 'three';
import { ModalContext } from '../../contexts/ModalContext';

export default function AssetScroller({ isVideo, url, size, position, rotation = [0, 0, 0], speed = 10 }) {
  const meshRef = useRef();
  const { camera } = useThree();
  const modalOpen = useContext(ModalContext);
  const [visible, setVisible] = useState(false);

  const texture = !isVideo ? useTexture(url) : null;
  const videoTexture = isVideo ? useVideoTexture(url) : null;

  const [x0, y0, z0] = position;

  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    mesh.position.set(x0, y0, z0);
    mesh.rotation.set(...rotation);
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useFrame((state) => {
    if (!meshRef.current || modalOpen || !visible) return;
  
    const mesh = meshRef.current;
    const elapsed = state.clock.getElapsedTime(); // absolute time in seconds
  
    const depth = Math.abs(z0 - camera.position.z);
    const frustumHalfHeight = depth * Math.tan((camera.fov * Math.PI) / 360);
    const frustumHeight = frustumHalfHeight * 2;
  
    const top = camera.position.y + frustumHalfHeight;
    const bottom = camera.position.y - frustumHalfHeight;
  
    const totalTravel = top - bottom ; // full scroll height including asset
  
    // Deterministic Y based on time — ensures seamless loop
    mesh.position.y = ((y0 + elapsed * speed - bottom) % totalTravel) + bottom - size[1];
  });
  

  return (
    <mesh ref={meshRef} visible={visible}>
      <planeGeometry args={size} />
      {isVideo ? (
        <meshBasicMaterial
          map={videoTexture}
          side={THREE.DoubleSide}
          transparent
          depthWrite={false}
        />
      ) : (
        <meshLambertMaterial
          map={texture}
          side={THREE.DoubleSide}
          transparent
          depthWrite={false}
        />
      )}
    </mesh>
  );
}
