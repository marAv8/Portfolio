// src/components/Overlays/AbyssOverlay.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import ClusterCarousel from '../MainContent/ClusterCarousel';
import { useScreenSize } from '../../contexts/ScreenSizeContext';
import ClusterView from '../MainContent/ClusterView';
import MetaInfo from '../UI/MetaInfo';
import AbyssCluster from '../MainContent/AbyssCluster';
import PaginationArrows from "../UI/PaginationArrows";

const deg = (d) => THREE.MathUtils.degToRad(d);

export default function AbyssOverlay({ cluster, onClose }) {
  const { isMobile, isTablet } = useScreenSize();
  const diagRef = React.useRef(null);
  const visibleImages = useMemo(() => {
    const arr = cluster?.images ?? [];
    return arr.filter((item) => {
      if (!item) return false;
      if (typeof item === "string") return true;
      return !item.hidden;
    });
  }, [cluster]);

  // 🔒 Freeze page scroll while overlay is open; restore on close
  useEffect(() => {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.classList.add('overlay-open');
    document.body.style.position = 'fixed';
    document.body.style.top = `-${y}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.classList.remove('overlay-open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, y);
    };
  }, []);

  // fallbacks so UI never shows "Untitled"
  const title = cluster?.title ?? 'Abyss';
  const year  = cluster?.year ?? '';
  const desc  = cluster?.subtitle ?? cluster?.description ?? '';

  // normalize urls ONCE so arrows know the length
  const urls = useMemo(() => {
    return visibleImages
      .map((it) => (typeof it === "string" ? it : it?.url || it?.src || it?.image || it?.path || null))
      .filter(Boolean);
  }, [visibleImages]);

  // shared index (mobile & desktop)
  const [index, setIndex] = useState(0);
  const wrap = React.useCallback(
    (i) => {
      const len = urls.length || 1;
      return ((i % len) + len) % len;
    },
    [urls.length]
  );
  // Dynamic scale per device (for left-side ClusterView)
  const clusterScale = isMobile
    ? [1.1, 1.1, 1.1]
    : isTablet
    ? [1.2, 1.2, 1.2]
    : [1.75, 1.75, 1.75];

  /* ======================== MOBILE ======================== */
  if (isMobile) {
    return (
      <div
        ref={diagRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'black',
          zIndex: 100,
          overflowY: 'hidden',
        }}
      >
        {/* Meta above the carousel on mobile */}
        <div
          style={{
            position: 'relative',
            padding: '0.75rem 1rem 0 1rem',
            ['--meta-left']: '1rem',
            ['--meta-top']: '3.25rem',
          }}
        >
          <MetaInfo
            title={title}
            year={year}
            description={desc}
            className="meta-theme-abyss"
            align="top-left"
          />
        </div>

        <ClusterCarousel
          images={visibleImages}
          startIndex={index}
          onIndexChange={setIndex}
          onClose={onClose}
        />
      </div>
    );
  }

  /* ================== DESKTOP / TABLET =================== */
  return (
    <div
      ref={diagRef}
      style={{
        position: 'absolute',
        inset: 0,
        background: '#000',
        display: 'flex',
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      {/* Left: 3D cluster */}
      <ClusterView
        cluster={{ ...cluster, title, year, subtitle: desc }}
        scale={clusterScale}
        metaThemeClass="meta-theme-abyss"
        maskVariant="abyss"
        camera={{ fov: 58, position: [-14, 20, 52] }}
        render3D={({ cluster, scale }) => (
          <AbyssCluster
            id={cluster?.id || 'cluster-abyss'}
            images={cluster?.images || []}
            isActive={true}
            position={[0, -4, 0]}
            rotation={[deg(-7), deg(-15), 0]}
            baseScale={Array.isArray(scale) ? scale[0] : 1}
            billboard={false}
          />
        )}
      />

      {/* Right: Carousel pane */}
      <div
        className="media-pane"
        style={{
          position: 'relative',
          flex: '0 0 50vw',
          height: '100%',
          backgroundColor: '#000',
          color: 'white',
          padding: '2rem',
          overflowY: 'auto',
          zIndex: 101,
        }}
      >
        {/* >>> Controlled carousel — responds to index <<< */}
        <ClusterCarousel
          images={visibleImages}
           index={wrap(index)}
          onIndexChange={setIndex}
          onClose={onClose}
        />

        {/* Your arrows — now actually drive the same index */}
        <PaginationArrows
          className="in-pane"
          index={wrap(index)}
          total={urls.length}
          onPrev={() => setIndex(i => wrap(i - 1))}
          onNext={() => setIndex(i => wrap(i + 1))}
        />

      </div>
    </div>
  );
}
