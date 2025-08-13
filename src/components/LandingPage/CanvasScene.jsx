//CanvasScene.jsx

// src/components/LandingPage/CanvasScene.jsx
import React, { Suspense, useEffect, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
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
  const [fadeOut, setFadeOut] = useState(false);
  const [lite, setLite] = useState(false); // auto "lite" mode if perf drops

  useEffect(() => {
    const updateSize = () => setIsMobile(window.innerWidth <= 768);
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const horizontalNudge = isMobile ? 0 : 5;

  // When lite mode triggers, render ~half the tiles (big win on older GPUs)
  const visibleAssets = useMemo(
    () => (lite ? assets.filter((_, i) => i % 2 === 0) : assets),
    [lite]
  );

  return (
    <div className="landing-layout">
      <div className="canvas-column">
        <div className={`canvas-black-overlay ${fadeOut ? 'fade-out' : ''}`}></div>

        <ModalContext.Provider value={modalOpen}>
          <Canvas
            // ✅ keep your camera exactly as-is
            camera={{
              position: isMobile ? [0, 0, 220] : [0, 0, 150],
              fov: isMobile ? 100 : 90
            }}
            // ✅ add gentle perf knobs (don’t change visuals on new machines)
            dpr={[1, Math.min(1.5, window.devicePixelRatio || 1)]}
            gl={{ antialias: !lite, powerPreference: lite ? 'low-power' : 'high-performance', alpha: false }}
            shadows={false}
            className="landing-canvas"
            style={{ background: 'black' }}
          >
            {/* Auto-detect slow devices: lower DPR and flip lite=true when FPS dips */}
            <PerformanceMonitor onDecline={() => setLite(true)} />
            <AdaptiveDpr pixelated />

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
                {visibleAssets.map((a) => (
                  <AssetScroller
                    key={`${a.originalUrl || a.url}-${a.position?.join(',')}`}
                    isVideo={a.isVideo}
                    url={a.url}                 // thumb (_512.webp) for images
                    originalUrl={a.originalUrl} // fallback to original PNG/JPG
                    size={a.size}
                    position={a.position}
                    rotation={a.rotation || [0, 0, 0]}
                    speed={12}
                  />
                ))}
              </group>
            </Suspense>
          </Canvas>
        </ModalContext.Provider>
      </div>
    </div>
  );
}
