// src/components/Overlays/LumenOverlay.jsx
import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import ClusterCarousel from "../MainContent/ClusterCarousel";
import ClusterView from "../MainContent/ClusterView";
import PaginationArrows from "../UI/PaginationArrows";
import LumenCluster from "../MainContent/LumenCluster";
import { getLumenAll } from "../../assets/assetsRight";
import { useScreenSize } from "../../contexts/ScreenSizeContext";
import { overlayPaneStyle } from "./overlayStyles";

export default function LumenOverlay({ onClose }) {
  const { isMobile, isTablet } = useScreenSize();
  const diagRef = useRef(null);

  // gather all images once
  const images = useMemo(
    () =>
      getLumenAll()
        .filter((item) => typeof item === "string" || !item?.hidden)
        .map((it) => {
          if (typeof it === "string") return { src: it };
          const url = it.url || it.full || it.thumb;
          return url ? { ...it, url } : null;
        })
        .filter(Boolean),
    []
  );
  const urls = useMemo(
    () => images.map((it) => it.url || it.src).filter(Boolean),
    [images]
  );

  const [index, setIndex] = useState(0);
  const clampIndex = useCallback(
    (value) => {
      if (urls.length === 0) return 0;
      const max = urls.length - 1;
      return Math.min(Math.max(value, 0), max);
    },
    [urls.length]
  );
  const setIndexClamped = useCallback(
    (update) => {
      setIndex((prev) => {
        const next = typeof update === "function" ? update(prev) : update;
        return clampIndex(next);
      });
    },
    [clampIndex]
  );
  const safeIndex = clampIndex(index);

  // body lock (same behavior as PenumbraOverlay)
  useEffect(() => {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.classList.add("overlay-open");
    document.body.style.position = "fixed";
    document.body.style.top = `-${y}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.classList.remove("overlay-open");
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo(0, y);
    };
  }, []);

  // scale per device, matching your Penumbra overlay feel
  const clusterScale = isMobile
    ? [1.08, 1.08, 1.08]
    : isTablet
    ? [1.3, 1.3, 1.3]
    : [1.6, 1.6, 1.6];

  // left panel meta (ClusterView renders title/year in the corner; right pane shows only media)
  const clusterMeta = {
    id: "cluster-lumen",
    title: "Lumen",
    year: "2024",
    subtitle: "Surveillance and astral echoes",
    maskVariant: "lumen",
  };

  if (isMobile) {
    // keep mobile simple: full-screen carousel; no left 3D view
    return (
      <div
        ref={diagRef}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#000",
          zIndex: 100,
          overflow: "hidden",
        }}
      >
        <ClusterCarousel
          images={images}
          index={safeIndex}
          onIndexChange={setIndexClamped}
          onClose={onClose}
          showDotsDesktop={false}
        />
      </div>
    );
  }

  return (
    <div
      ref={diagRef}
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#000",
        display: "flex",
        zIndex: 100,
        overflow: "hidden",
      }}
    >
      <ClusterView
        cluster={clusterMeta}
        scale={clusterScale}
        metaThemeClass="meta-theme-warm"
        maskVariant="lumen"
        camera={{ fov: 54, position: [0, -1, 24] }}
        render3D={() => (
          // Reuse the *same* cluster component; no hit-plane in overlay
          <group position={[0, 6.5, 0]} scale={[1.3, 1.3, 1.3]}>
            <LumenCluster interactive={false} setControlsEnabled={() => {}} controlsRef={null} onActivate={() => {}} />
          </group>
        )}
      />

      {/* RIGHT: media only — no MetaInfo here */}
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
