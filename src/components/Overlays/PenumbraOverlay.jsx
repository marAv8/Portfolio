// src/components/Overlays/PenumbraOverlay.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";

import ClusterCarousel from "../MainContent/ClusterCarousel";
import ClusterView from "../MainContent/ClusterView";
import PenumbraCluster from "../MainContent/PenumbraCluster";
import MetaInfo from "../UI/MetaInfo";
import PaginationArrows from "../UI/PaginationArrows";
import { useScreenSize } from "../../contexts/ScreenSizeContext";
import { overlayPaneStyle } from "./overlayStyles";

export default function PenumbraOverlay({ cluster, onClose }) {
  const { isMobile, isTablet } = useScreenSize();
  const diagRef = useRef(null);
  const visibleImages = useMemo(() => {
    return (cluster?.images ?? [])
      .filter((a) => a && !a.hidden && !a.type) // exclude hidden + videos
      .map((a) => {
        const url = a.url || a.full || a.thumb;
        return url ? { ...a, url } : null;
      })
      .filter(Boolean);
  }, [cluster]);
  const total = visibleImages.length;

  const [index, setIndex] = useState(0);
    const clampIndex = useCallback(
      (value) => {
        if (total === 0) return 0;
        return Math.min(Math.max(value, 0), total - 1);
      },
      [total]
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

  const clusterScale = isMobile
    ? [1.08, 1.08, 1.08]
    : isTablet
    ? [1.3, 1.3, 1.3]
    : [1.68, 1.68, 1.68];

  if (isMobile) {
    return (
      <div
        ref={diagRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "black",
          zIndex: 100,
          overflowY: "hidden",
        }}
      >
        <div
          style={{
            position: "relative",
            padding: "0.75rem 1rem 0 1rem",
            ["--meta-left"]: "1rem",
            ["--meta-top"]: "3.25rem",
          }}
        >
          <MetaInfo
            title={cluster?.title}
            year={cluster?.year}
            description={cluster?.subtitle}
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

  return (
    <div
      ref={diagRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000000",
        display: "flex",
        zIndex: 100,
        overflow: "hidden",
      }}
    >
      <ClusterView
        cluster={cluster}
        scale={clusterScale}
        metaThemeClass="meta-theme-penumbra"
        maskVariant="penumbra"
        camera={{ fov: 56, position: [0, 4, 27] }}
        render3D={({ cluster: data }) => (
          <PenumbraCluster
            id={data?.id || "cluster-penumbra"}
            images={data?.images || []}
            layout={data?.layout}
            title={data?.title}
            subtitle={data?.subtitle}
            year={data?.year}
            palette={data?.palette}
            extrusion={data?.extrusion}
            isActive
            preferHiRes
            position={[0, -4, 0]}
            rotation={[0, 0, 0]}
            scale={[1.45, 1.45, 1.45]}
          />
        )}
      />

      <div className="media-pane" style={overlayPaneStyle}>
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
          total={total}
          onPrev={() => setIndexClamped((i) => i - 1)}
          onNext={() => setIndexClamped((i) => i + 1)}
          onDotClick={setIndexClamped}
        />
      </div>
    </div>
  );
}
