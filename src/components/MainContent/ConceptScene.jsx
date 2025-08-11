// src/components/MainContent/ConceptScene.jsx
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import ConceptCluster from './ConceptCluster';
import ClusterOverlay from '../Overlays/RootOverlay';
import { useScreenSize } from '../../contexts/ScreenSizeContext';
import { conceptAssets } from '../../assets/assetData';

export default function ConceptScene() {
  // ✅ define state BEFORE using it
  const [activeClusterId, setActiveClusterId] = useState(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const { isTablet } = useScreenSize();

  const activeCluster = conceptAssets.find((c) => c.id === activeClusterId);
  const rootCluster = conceptAssets.find((c) => c.id === 'cluster-root');

  const handleActivate = (id) => {
    setHasInteracted(true);
    setActiveClusterId(id);
  };

  const handleHoverChange = () => {
    if (!hasInteracted) setHasInteracted(true);
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Base Scene: Fullscreen Canvas */}
      <div style={{ width: '100%', height: '100%' }}>
        <Canvas shadows>
          <PerspectiveCamera makeDefault fov={80} position={[0, 1, 20]} />
          <ambientLight intensity={0.5} />
          <directionalLight
            castShadow
            position={[5, 10, 5]}
            intensity={1.5}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <spotLight
            position={[0, 10, 10]}
            angle={0.3}
            penumbra={0.2}
            intensity={2}
            castShadow
          />
          <OrbitControls />

          {/* Browse cluster (inactive so hover/tap plate is active) */}
          <ConceptCluster
            id={rootCluster.id}
            layout={rootCluster.layout}
            images={rootCluster.images}
            position={[0, 0, 0]}
            scale={[1, 1, 1]}
            title={rootCluster.title}
            subtitle={rootCluster.subtitle}
            year={rootCluster.year}
            isActive={false}
            onActivate={handleActivate}
            onHoverChange={handleHoverChange}
            /* 👇 tablet attract breathe until first interaction */
            attractMode={!activeCluster && isTablet && !hasInteracted}
          />
        </Canvas>
      </div>

      {/* Overlay for Active Cluster */}
      {activeCluster && (
        <ClusterOverlay
          cluster={activeCluster}
          onClose={() => setActiveClusterId(null)}
        />
      )}
    </div>
  );
}
