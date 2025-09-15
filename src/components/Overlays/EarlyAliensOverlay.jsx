// src/components/Overlays/EarlyAliensOverlay.jsx
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';

import ClusterCarousel from '../MainContent/ClusterCarousel';
import { useScreenSize } from '../../contexts/ScreenSizeContext';
import ClusterView from '../MainContent/ClusterView';
import MetaInfo from '../UI/MetaInfo';
import EarlyAliensCluster from '../MainContent/EarlyAliensCluster';
import PreloadMask from '../Effects/PreloadMask';
import PaginationArrows from "../UI/PaginationArrows";


const deg = (d) => THREE.MathUtils.degToRad(d);

export default function EarlyAliensOverlay({ cluster, onClose }) {
  const { isMobile, isTablet } = useScreenSize();
  const diagRef = React.useRef(null); // DIAG
  React.useEffect(() => { /** [DIAG4] */
    try {
      const html = document.documentElement; const body = document.body; /** [DIAG4] */
      const dump = (el, name) => el && console.log('[DIAG4][overlay-css][Early mount]', name, getComputedStyle(el).cssText); /** [DIAG4] */
      dump(html, 'html'); dump(body, 'body'); /** [DIAG4] */
    } catch {}
  }, []); /** [DIAG4] */

  // normalize props (avoid “Untitled”)
  const title = cluster?.title ?? 'Early Aliens';
  const year  = cluster?.year ?? '';
  const desc  = cluster?.subtitle ?? cluster?.description ?? '';

  // the source data uses `assets` (array of {url})
  // ClusterCarousel expects `images: [{url}]`
  const images = React.useMemo(
    () => (cluster?.assets ?? []).map(a => ({ url: a.url })),
    [cluster?.assets]
  );
  // Normalize URLs for totals
  const urls = React.useMemo(() => {
    return (images ?? [])
      .map((it) => it?.url || it?.src || it?.image || it?.path || null)
      .filter(Boolean);
  }, [images]);

  // Shared index + wrap for desktop/tablet
  const [index, setIndex] = React.useState(0);
  const wrap = React.useCallback(
    (i) => {
      const len = urls.length || 1;
      return ((i % len) + len) % len;
    },
    [urls.length]
  );
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

  // Dynamic scale per device for the left 3D view
  const clusterScale = isMobile
    ? [1.25, 1.25, 1.25]
    : isTablet
    ? [2.2, 2.2, 2.2]
    : [3.1, 3.1, 3.1];

  // ----------------- MOBILE: single column -----------------
  if (isMobile) {
    return (
      <div
        ref={diagRef}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#000',
          zIndex: 200,
          overflowY: 'hidden',
        }}
      >
        {(() => { React.useEffect(() => { /** [DIAG4] */
          try {
            if (diagRef.current) console.log('[DIAG4][overlay-css][Early mobile]', getComputedStyle(diagRef.current).cssText);
            const el = diagRef.current; const se = document.scrollingElement; /** [DIAG4] */
            const onScroll = () => console.log('[DIAG4][overlay-scroll][Early mobile]', { self: el?.scrollTop, se: se?.scrollTop }); /** [DIAG4] */
            el?.addEventListener('scroll', onScroll, { passive: true }); se?.addEventListener('scroll', onScroll, { passive: true }); /** [DIAG4] */
            return () => { console.log('[DIAG4][overlay-unmount][Early mobile]'); el?.removeEventListener('scroll', onScroll); se?.removeEventListener('scroll', onScroll); }; /** [DIAG4] */
          } catch {}
        }, []); return null; })()}
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
            className="meta-theme-early"
            align="top-left"
          />
        </div>

        <ClusterCarousel images={images} onClose={onClose} />
      </div>
    );
  }

  // --------------- DESKTOP/TABLET: split view (match Abyss) ----------------
  return (
    <div
      ref={diagRef}
      style={{
        position: 'absolute',
        inset: 0,
        background: '#000',
        display: 'flex',          // <-- same as Abyss
        zIndex: 200,
        overflow: 'hidden',
      }}
    >
      {/* Left: 3D cluster (unchanged props) */}
      <ClusterView
        cluster={{ ...cluster, title, year, subtitle: desc }}
        scale={clusterScale}
        metaThemeClass="meta-theme-early"
        maskVariant="early"
        camera={{ fov: 58, position: [-4, 2.2, 14] }}
        render3D={({ scale }) => (
          <EarlyAliensCluster
            id="cluster-early-aliens"
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

      {/* Right: Carousel pane (identical to Abyss) */}
      <div
        className="media-pane"
        style={{
          position: 'relative',
          flex: '0 0 50vw',        // <-- fixed half width like Abyss
          height: '100%',
          backgroundColor: '#000',
          color: 'white',
          padding: '2rem',
          overflowY: 'auto',
          zIndex: 101,
        }}
      >
        <ClusterCarousel
          images={images}
          index={wrap(index)}
          onIndexChange={setIndex}
          onClose={onClose}
        />
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
