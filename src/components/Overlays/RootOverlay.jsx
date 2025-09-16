// src/components/Overlays/RootOverlay.jsx
import * as THREE from 'three';
import React, { useEffect } from 'react';
import ClusterCarousel from "../MainContent/ClusterCarousel";
import { useScreenSize } from "../../contexts/ScreenSizeContext";
import ClusterView from "../MainContent/ClusterView";
import ConceptCluster from '../MainContent/ConceptCluster';
import MetaInfo from "../UI/MetaInfo";
import PaginationArrows from "../UI/PaginationArrows";

export default function RootOverlay({ cluster, onClose }) {
  const { isMobile, isTablet } = useScreenSize();
    // Normalize URLs once for consistent length/total
    const deg = (d) => THREE.MathUtils.degToRad(d);
  const urls = React.useMemo(() => {
    const arr = cluster?.images ?? [];
    return arr
      .map((it) => (typeof it === "string" ? it : it?.url || it?.src || it?.image || it?.path || null))
      .filter(Boolean);
  }, [cluster]);

  // Shared index + wrap for desktop/tablet
  const [index, setIndex] = React.useState(0);
  const wrap = React.useCallback(
    (i) => {
      const len = urls.length || 1;
      return ((i % len) + len) % len;
    },
    [urls.length]
  );
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
    ? [1.35, 1.35, 1.35]
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

        <ClusterCarousel images={cluster.images} onClose={onClose} />
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
              position={[0, -3, 0]}         // <<< explicit position (like Abyss/Early)
              rotation={[deg(0), deg(0), 0]}
              scale={
                Array.isArray(scale)
                  ? [scale[0], scale[0], scale[0]]
                  : [scale, scale, scale]
              }
            />
          )}
        />

      {/* Right: Carousel */}
      <div
        className="media-pane"
        style={{
          position: 'relative',
          flex: '0 0 50vw',
          height: '100%',
          backgroundColor: '#000000',
          color: 'white',
          padding: '2rem',
          overflowY: 'auto',
          zIndex: 101,
        }}
      >
                {/* Controlled on desktop/tablet so arrows & drag stay in sync */}
        <ClusterCarousel
          images={cluster.images}
          index={wrap(index)}
          onIndexChange={setIndex}
          onClose={onClose}
        />

        {/* Desktop arrows (looping) */}
        <PaginationArrows
          className="in-pane"
          index={wrap(index)}
          total={urls.length}
          onPrev={() => setIndex((i) => wrap(i - 1))}
          onNext={() => setIndex((i) => wrap(i + 1))}
          loop
        />
      </div>
    </div>
  );
}
