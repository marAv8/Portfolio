// src/components/Overlays/HatsOverlay.jsx
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import ClusterCarousel from '../MainContent/ClusterCarousel';
import { useScreenSize } from '../../contexts/ScreenSizeContext';
import ClusterView from '../MainContent/ClusterView';
import MetaInfo from '../UI/MetaInfo';
import HatsCluster from '../MainContent/HatsCluster';
import PreloadMask from '../Effects/PreloadMask';
import PaginationArrows from "../UI/PaginationArrows";
import { overlayPaneStyle } from "./overlayStyles";

const deg = (d) => THREE.MathUtils.degToRad(d);

export default function HatsOverlay({ cluster, onClose }) {
  const { isMobile, isTablet } = useScreenSize();

  // normalize props
  const title = cluster?.title ?? 'Hats';
  const year  = cluster?.year ?? '2023';
  const desc  = cluster?.subtitle ?? 'hat blends, and evolutions';

const images = useMemo(
  () =>
    (cluster?.assets ?? [])
      .map(a => ({
        url: a.full || a.mid || a.thumb || null,
      }))
      .filter(a => a.url),
  [cluster?.assets]
);

  const urls = useMemo(
    () => (images ?? []).map(it => it?.url || it?.src || it?.image || it?.path || null).filter(Boolean),
    [images]
  );

  const [index, setIndex] = React.useState(0);
  const clampIndex = React.useCallback(
    (value) => {
      if (urls.length === 0) return 0;
      const max = urls.length - 1;
      return Math.min(Math.max(value, 0), max);
    },
    [urls.length]
  );
  const setIndexClamped = React.useCallback(
    (update) => {
      setIndex((prev) => {
        const next = typeof update === "function" ? update(prev) : update;
        return clampIndex(next);
      });
    },
    [clampIndex]
  );
  const safeIndex = clampIndex(index);

  // Freeze page scroll while overlay open
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

  const clusterScale = isMobile
    ? [1.25, 1.25, 1.25]
    : isTablet
    ? [3,3,3]
    : [3.1, 3.1, 3.1];

  // --------- MOBILE ----------
  if (isMobile) {
    return (
      <div
        style={{ position: 'absolute', inset: 0, backgroundColor: '#000', zIndex: 200, overflowY: 'hidden' }}
      >
        <div style={{ position: 'relative', padding: '0.75rem 1rem 0 1rem', ['--meta-left']: '1rem', ['--meta-top']: '3.25rem' }}>
          <MetaInfo title={title} year={year} description={desc} className="meta-theme-hats" align="top-left" />
        </div>

        <ClusterCarousel
          images={images}
          startIndex={safeIndex}
          onIndexChange={setIndexClamped}
          onClose={onClose}
        />
      </div>
    );
  }

  // --------- DESKTOP/TABLET ----------
  return (
    <div
      style={{ position: 'absolute', inset: 0, background: '#000', display: 'flex', zIndex: 200, overflow: 'hidden' }}
    >
      {/* Left: 3D cluster */}
      <ClusterView
        cluster={{ ...cluster, title, year, subtitle: desc }}
        scale={clusterScale}
        metaThemeClass="meta-theme-hats"
        maskVariant="hats"
        camera={{ fov: 58, position: [-4, 2.2, 14] }}
        render3D={({ scale }) => (
          <HatsCluster
            id="cluster-hats"
            assets={images}
            isActive={true}
            position={[0, 0, 0]}
            rotation={[deg(-8), deg(-10), 0]}
            baseScale={Array.isArray(scale) ? scale[0] : 3.1}
            panelSize={[0.46, 0.62]}
            gap={0.02}
            startAt="top"
            spinSpeed={0.35}
          />
        )}
      />

      {/* Right: Carousel pane */}
      <div className="media-pane" style={overlayPaneStyle}>
        <ClusterCarousel
          images={images}
          index={safeIndex}
          onIndexChange={setIndexClamped}
          onClose={onClose}
          showDotsDesktop={false}
        />
        <PaginationArrows
          className="in-pane"
          index={safeIndex}
          total={urls.length}
          onPrev={() => setIndexClamped((i) => i - 1)}
          onNext={() => setIndexClamped((i) => i + 1)}
          onDotClick={setIndexClamped}
        />
      </div>
    </div>
  );
}
