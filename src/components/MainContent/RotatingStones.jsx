// src/components/MainContent/RotatingStones.jsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import ImageOverlay from './ImageOverlay';
import Panel from './Panel';

export default function RotatingStones({ images = [], center = [0, 1, 1.5], radius = 0.5 }) {
  const groupRef = useRef();

  // Continuous rotation like a carousel
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4; // adjust speed here
    }
  });

  const angleStep = (Math.PI * 2) / images.length;

  return (
    <group ref={groupRef} position={center}>
      {/* 🔵 Blue glowing core with light */}
      <pointLight
        position={[0, 0, 0]}
        intensity={5}
        distance={4}
        color="#00ffff"
      />
<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]}>
  <circleGeometry args={[radius + 0.15, 32]} />
  <meshStandardMaterial
    color="black"
    transparent
    opacity={0.1}
    depthWrite={false}
  />
</mesh>


      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshBasicMaterial 
        color="#00ffff"
         />
      </mesh>

      {/* 🌀 Rotating image stones */}
      {images.map((img, i) => {
        const angle = i * angleStep;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        const rotation = [0, angle, 0];

        return (
          <group key={i} position={[x, 0, z]} rotation={rotation}>
            <group scale={img.scale || [1, 1, 1]}>
              {img.useCircle ? (
                <mesh position={[0, 0, 0.001]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.6, 0.6, 0.01, 64]} />
                  <meshBasicMaterial color="#fcfcfc" />
                </mesh>
              ) : (
                <Panel thickness={0.1} />
              )}
              <ImageOverlay url={img.url} />
            </group>
          </group>
        );
      })}
    </group>
  );
}
