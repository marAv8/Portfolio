// src/components/LandingPage/CanvasScene.jsx
import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
import { Link } from 'react-router-dom';
import './CanvasScene.css';
import { ModalContext } from '../../contexts/ModalContext';
import LandingTunnel from './LandingTunnel';

function SceneOverlay({ visible }) {
  if (!visible) return null;
  return (
    <mesh position={[0, 0, 10]} renderOrder={999}>
      <planeGeometry args={[500, 500]} />
      <meshBasicMaterial color="white" transparent opacity={0.5} depthWrite={false} />
    </mesh>
  );
}

export default function CanvasScene({ modalOpen = false }) {
  const [isMobile, setIsMobile] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [lite, setLite] = useState(false);
  const [posterVisible, setPosterVisible] = useState(true);

  useEffect(() => {
    const updateSize = () => setIsMobile(window.innerWidth <= 768);
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (!canvasReady) return;
    const timer = window.setTimeout(() => setPosterVisible(false), 850);
    return () => window.clearTimeout(timer);
  }, [canvasReady]);

  return (
    <div className="landing-layout">

      {/* 1 — LCP HERO: full-screen gradient for Lighthouse */}
      <div className={`lcp-hero ${posterVisible ? 'show' : 'hide'}`} />

      {/* 2 — Loading dot above everything */}
      <div className={`loading-dot-global ${posterVisible ? 'show' : 'hide'}`} />

      <div className="canvas-column">
        <ModalContext.Provider value={modalOpen}>
          <div className="landing-cta-overlay">
            <Link to="/clusters" className="nav-pill landing-cta-pill">
              <span className="nav-link glow">Clusters</span>
            </Link>
          </div>
          <Canvas
            camera={{
              position: [0, 0, 100],
              fov: 78,
            }}
            dpr={[1, Math.min(1.2, window.devicePixelRatio || 1)]}
            gl={{
              antialias: !lite,
              powerPreference: lite ? 'low-power' : 'high-performance',
              alpha: true,
            }}
            shadows={false}
            className="landing-canvas"
            onCreated={() => setCanvasReady(true)}
          >
            <PerformanceMonitor onDecline={() => setLite(true)} />
            <AdaptiveDpr pixelated />

            <OrbitControls
              target={[0, 0, 0]}
              enablePan={false}
              enableZoom={false}
              enableRotate
              rotateSpeed={0.2}
              dampingFactor={0.15}
            />

            <ambientLight intensity={0.35} color="#ffffff" />
            <directionalLight intensity={1.2} position={[0, 0, 800]} />
            <SceneOverlay visible={modalOpen} />

            {canvasReady && (
              <Suspense fallback={null}>
                <group
                  position={[isMobile ? 0 : 0, 0, 0]}
                  scale={isMobile ? [0.75, 0.75, 0.75] : [1, 1, 1]}
                >
                  <LandingTunnel
                    animateCamera={!isMobile}
                    scrollSpeed={isMobile ? 28 : 40}
                    baseRadius={isMobile ? 120 : 95}
                  />
                </group>
              </Suspense>
            )}
          </Canvas>
        </ModalContext.Provider>
      </div>

    </div>
  );
}
