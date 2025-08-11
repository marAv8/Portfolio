// src/components/MainContent/ClusterView.jsx
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';

import ConceptCluster from './ConceptCluster';
import MetaInfo from '../UI/MetaInfo';
import PreloadMask from '../Effects/PreloadMask';
import { useScreenSize } from '../../contexts/ScreenSizeContext';

export default function ClusterView({ cluster, scale }) {
  const { isTablet } = useScreenSize();

  return (
        <div
          style={{
            position: 'relative',
            flex: 1,
            height: '100%',
            minWidth: isTablet ? '50vw' : '0',
            padding: '0 1rem 0 1.25rem',
            /* optional one-off nudge (overrides CSS) */
            ['--meta-left']: '2rem',
            ['--meta-top']:  '1.75rem',
          }}
        >

      {/* MetaInfo lives WITH the cluster view (absolute DOM overlay) */}
      <MetaInfo
        title={cluster.title}
        year={cluster.year}
        description={cluster.subtitle}
        className="meta-theme-warm"
        align="top-left"
      />

      <Canvas shadows key={`canvas-${cluster.id}`}>
        <PerspectiveCamera makeDefault fov={70} position={[-10, 3, 22]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
        <OrbitControls />
        <ConceptCluster
          key={`expanded-${cluster.id}`}
          id={cluster.id}
          layout={cluster.layout}
          images={cluster.images}
          position={[0, -3, 0]}
          scale={scale}
          isActive={true}
          onActivate={() => {}}
        />
      </Canvas>

      {/* Keep buffer flicker centered over left panel */}
      <PreloadMask duration={1000} />
    </div>
  );
}
