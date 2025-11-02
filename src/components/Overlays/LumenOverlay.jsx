// src/components/Overlays/LumenOverlay.jsx
import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import ClusterCarousel from "../MainContent/ClusterCarousel";
import ClusterView from "../MainContent/ClusterView";
import PaginationArrows from "../UI/PaginationArrows";
import LumenCluster from "../MainContent/LumenCluster";
import { getLumenAll } from "../../assets/assetsRight";
import { useScreenSize } from "../../contexts/ScreenSizeContext";

export default function LumenOverlay({ onClose }) {
  const { isMobile, isTablet } = useScreenSize();
  const diagRef = useRef(null);

  // gather all images once
  const images = useMemo(
    () => getLumenAll().filter((item) => typeof item === "string" || !item?.hidden),
    []
  );
  const urls = useMemo(() => images.map((it) => it.url).filter(Boolean), [images]);

  const [index, setIndex] = useState(0);
  const wrap = useCallback((i) => {
    const len = urls.length || 1;
    return ((i % len) + len) % len;
  }, [urls.length]);

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
    subtitle: "Surveillance, and astral echoes.",
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
        <ClusterCarousel images={images} index={wrap(index)} onIndexChange={setIndex} onClose={onClose} />
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
        maskVariant="early"
        camera={{ fov: 54, position: [0, 2, 24] }}
        render3D={() => (
          // Reuse the *same* cluster component; no hit-plane in overlay
          <group position={[0, 3.5, 0]} scale={[1, 1, 1]}>
            <LumenCluster interactive={false} setControlsEnabled={() => {}} controlsRef={null} onActivate={() => {}} />
          </group>
        )}
      />

      {/* RIGHT: media only — no MetaInfo here */}
      <div
        className="media-pane"
        style={{
          position: "relative",
          flex: "0 0 50vw",
          height: "100%",
          backgroundColor: "#000",
          color: "white",
          padding: "2rem",
          overflowY: "auto",
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
