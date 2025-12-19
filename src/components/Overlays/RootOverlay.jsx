// src/components/Overlays/RootOverlay.jsx
import * as THREE from 'three';
import React, { useEffect } from 'react';
import ClusterCarousel from "../MainContent/ClusterCarousel";
import { useScreenSize } from "../../contexts/ScreenSizeContext";
import ClusterView from "../MainContent/ClusterView";
import ConceptCluster from '../MainContent/ConceptCluster';
import MetaInfo from "../UI/MetaInfo";
import PaginationArrows from "../UI/PaginationArrows";
import { overlayPaneStyle } from "./overlayStyles";

export default function RootOverlay({ cluster, onClose }) {
  const { isMobile, isTablet } = useScreenSize();
    // Normalize URLs once for consistent length/total
    const deg = (d) => THREE.MathUtils.degToRad(d);
  const visibleImages = React.useMemo(() => {
    const arr = cluster?.images ?? [];
    return arr
      .filter((item) => {
        if (!item) return false;
        if (typeof item === "string") return true;
        return !item.hidden;
      })
      .map((it) => {
        if (typeof it === "string") return it;
        const url = it.url || it.full || it.thumb || it.src || it.image || it.path;
        return url ? { ...it, url } : null;
      })
      .filter(Boolean);
  }, [cluster]);
  const urls = React.useMemo(() => {
    return visibleImages
      .map((it) => (typeof it === "string" ? it : it?.url))
      .filter(Boolean);
  }, [visibleImages]);

  // Shared index + wrap for desktop/tablet
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
  // DIAG
  const diagRef = React.useRef(null);
  React.useEffect(() => { /** [DIAG4] */
    try {
      const html = document.documentElement; const body = document.body; /** [DIAG4] */
      const dump = (el, name) => el && console.log('[DIAG4][overlay-css][Root mount]', name, getComputedStyle(el).cssText); /** [DIAG4] */
      dump(html, 'html'); dump(body, 'body'); /** [DIAG4] */
    } catch {}
  }, []); /** [DIAG4] */

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

  // Dynamic scale per device (for left-side ClusterView)
  const clusterScale = isMobile
    ? [1.1, 1.1, 1.1]
    : isTablet
    ? [1.8, 1.8, 1.8]
    : [1.75, 1.75, 1.75];

  // MOBILE VIEW (single column)
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
        {(() => { React.useEffect(() => { /** [DIAG4] */
          try {
            if (diagRef.current) console.log('[DIAG4][overlay-css][Root mobile]', getComputedStyle(diagRef.current).cssText);
            const el = diagRef.current; const se = document.scrollingElement; /** [DIAG4] */
            const onScroll = () => console.log('[DIAG4][overlay-scroll][Root mobile]', { self: el?.scrollTop, se: se?.scrollTop }); /** [DIAG4] */
            el?.addEventListener('scroll', onScroll, { passive: true }); se?.addEventListener('scroll', onScroll, { passive: true }); /** [DIAG4] */
            return () => { console.log('[DIAG4][overlay-unmount][Root mobile]'); el?.removeEventListener('scroll', onScroll); se?.removeEventListener('scroll', onScroll); }; /** [DIAG4] */
          } catch {}
        }, []); return null; })()}
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

        <ClusterCarousel
          images={visibleImages}
          startIndex={safeIndex}
          onIndexChange={setIndexClamped}
          onClose={onClose}
        />
      </div>
    );
  }

  // DESKTOP/TABLET SPLIT VIEW
  return (
    <div
      ref={diagRef}
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
      {(() => { React.useEffect(() => { /** [DIAG4] */
        try {
          if (diagRef.current) console.log('[DIAG4][overlay-css][Root desktop]', getComputedStyle(diagRef.current).cssText);
          const el = diagRef.current; const se = document.scrollingElement; /** [DIAG4] */
          const onScroll = () => console.log('[DIAG4][overlay-scroll][Root desktop]', { self: el?.scrollTop, se: se?.scrollTop }); /** [DIAG4] */
          el?.addEventListener('scroll', onScroll, { passive: true }); se?.addEventListener('scroll', onScroll, { passive: true }); /** [DIAG4] */
          return () => { console.log('[DIAG4][overlay-unmount][Root desktop]'); el?.removeEventListener('scroll', onScroll); se?.removeEventListener('scroll', onScroll); }; /** [DIAG4] */
        } catch {}
      }, []); return null; })()}
     {/* Left: match Abyss/Early — explicit camera + render3D with position */}
        <ClusterView
          cluster={cluster}
          scale={clusterScale}
          metaThemeClass="meta-theme-warm"
          maskVariant="root"
          camera={{ fov: 58, position: [0, 4, 25] }}
          render3D={({ cluster, scale }) => (
            <ConceptCluster
              id={cluster?.id || 'cluster-root'}
              images={cluster?.images || []}
              layout={cluster?.layout}
              title={cluster?.title}
              subtitle={cluster?.subtitle}
              year={cluster?.year}
              isActive={true}                 // disable hit areas inside overlay
              preferHiRes={true}
              position={[0, -5, 0]}         // <<< explicit position (like Abyss/Early)
              rotation={[deg(-5), deg(0), 0]}
              scale={
                Array.isArray(scale)
                  ? [scale[0], scale[0], scale[0]]
                  : [scale, scale, scale]
              }
            />
          )}
        />

      {/* Right: Carousel */}
      <div className="media-pane" style={overlayPaneStyle}>
                {/* Controlled on desktop/tablet so arrows & drag stay in sync */}
        <ClusterCarousel
          images={visibleImages}
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
