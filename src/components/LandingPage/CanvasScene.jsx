//CanvasScene.jsx

import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { assets } from '../../assets/assetData';
import './CanvasScene.css';
import { ModalContext } from '../../contexts/ModalContext';
import AssetScroller from './AssetScroller';

function SceneOverlay({ visible }) {
  if (!visible) return null;
  return (
    <mesh position={[0, 0, 10]} renderOrder={999}>
      <planeGeometry args={[500, 500]} />
      <meshBasicMaterial color="black" transparent opacity={0.5} depthWrite={false} />
    </mesh>
  );
}

export default function CanvasScene({ modalOpen = false }) {
  const [isMobile, setIsMobile] = useState(false);
  const [fadeOut, setFadeOut] = useState(false); // <--- new

  useEffect(() => {
    const updateSize = () => setIsMobile(window.innerWidth <= 768);
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 100); // Delay makes the fade feel organic
    return () => clearTimeout(timer);
  }, []);
  const horizontalNudge = isMobile ? 0 : 5;

  return (
    <div className="landing-layout">
      <div className="canvas-column">
        <div
          className={`canvas-black-overlay ${fadeOut ? 'fade-out' : ''}`}
          ></div>
        <ModalContext.Provider value={modalOpen}>
        <Canvas
            camera={{
              position: isMobile ? [0, 0, 220] : [0, 0, 150],
              fov: isMobile ? 100 : 90
            }}
            className="landing-canvas"
            style={{ background: 'black' }}
          >

            <OrbitControls target={[0, 0, 0]} />
            <hemisphereLight skyColor={0xffffff} groundColor={0x444444} intensity={0.6} />
            <directionalLight intensity={1.2} position={[0, 0, 1000]} />
            <Environment preset="night" background={false} />
            <SceneOverlay visible={modalOpen} />

            <Suspense fallback={null}>
              <group
                position={[horizontalNudge, 0, 0]}
                scale={isMobile ? [0.75, 0.75, 0.75] : [1, 1, 1]}
              >
                {assets.map((asset, idx) => (
                  <AssetScroller key={idx} {...asset} speed={12} />
                ))}
              </group>
            </Suspense>
          </Canvas>
        </ModalContext.Provider>
      </div>
    </div>
  );
}
