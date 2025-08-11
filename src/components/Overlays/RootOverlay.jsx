// src/components/Overlays/RootOverlay.jsx
import React, { useEffect } from 'react';
import ClusterCarousel from "../MainContent/ClusterCarousel";
import { useScreenSize } from "../../contexts/ScreenSizeContext";
import ClusterView from "../MainContent/ClusterView";
import MetaInfo from "../UI/MetaInfo";

export default function RootOverlay({ cluster, onClose }) {
  const { isMobile, isTablet } = useScreenSize();

    // hide global nav on mobile while overlay is open
    useEffect(() => {
      document.body.classList.add('overlay-open');
      return () => document.body.classList.remove('overlay-open');
    }, []);
  // Dynamic scale per device (for left-side ClusterView)
  const clusterScale = isMobile
    ? [1.1, 1.1, 1.1]
    : isTablet
    ? [1.35, 1.35, 1.35]
    : [1.75, 1.75, 1.75];

  // MOBILE VIEW (single column)
  if (isMobile) {
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'black',
          zIndex: 100,
          overflowY: 'auto',
        }}
      >
        {/* Meta above the carousel on mobile */}
        <div style={{ position: 'relative', 
        padding: '0.75rem 1rem 0 1rem', 
        ['--meta-left']: '1rem',
        ['--meta-top']:  '3.25rem', 
        }}>
          <MetaInfo
            title={cluster.title}
            year={cluster.year}
            description={cluster.subtitle}
            className="meta-theme-warm"
            align="top-left"
          />
        </div>

        <ClusterCarousel images={cluster.images} onClose={onClose} />
      </div>
    );
  }

  // DESKTOP/TABLET SPLIT VIEW
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000000',
        display: 'flex',
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      {/* Left: ClusterView owns MetaInfo + Canvas + PreloadMask */}
      <ClusterView cluster={cluster} scale={clusterScale} />

      {/* Right: Carousel */}
      <div
        style={{
          flex: '0 0 50vw',
          height: '100%',
          backgroundColor: '#000000',
          color: 'white',
          padding: '2rem',
          overflowY: 'auto',
          zIndex: 101,
        }}
      >
        <ClusterCarousel images={cluster.images} onClose={onClose} />
      </div>
    </div>
  );
}
