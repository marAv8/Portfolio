//ConceptSceneMobile.jsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
  useCallback,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";

import "./MobileCarousel.css";
import PreloadMaskMobile from "./PreloadMaskMobile";
import MobileInlineCarousel from "./MobileInlineCarousel";

import { conceptAssets } from "../../assets/assetData";

// Reuse your desktop clusters for the preview canvases
const ConceptCluster      = React.lazy(() => import("../MainContent/ConceptCluster"));
const AbyssCluster        = React.lazy(() => import("../MainContent/AbyssCluster"));
const EarlyAliensCluster  = React.lazy(() => import("../MainContent/EarlyAliensCluster"));

// --- helper: degrees -> radians (so we can match desktop intent) ---
const deg = (d) => (d * Math.PI) / 180;

/** Render a couple frames, then tell the loader this stage is drawing */
function StageReadySentinel({ onReady }) {
  const frames = useRef(0);
  useFrame(() => { if (frames.current < 3) frames.current += 1; });
  useEffect(() => {
    let raf;
    const tick = () => {
      if (frames.current >= 3) onReady?.();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onReady]);
  return null;
}

/** One vertical “stage”: 3D preview canvas, then inline carousel right below it */
function ClusterStage({ type, cluster, onOpenOverlay, onStageReady }) {
  // Keep the camera simple and unwarped; tilt the *cluster group* where needed
  const camFov = 44;
  const camPos = useMemo(() => {
    // Pull the Abyss camera *back and up* a bit so the floor is visible and perspective is calmer.
    if (type === "abyss") return [0, 5.0, 46];
    if (type === "early") return [0, 1.0, 28];
    return [0, 4.0, 26]; // root
  }, [type]);
  // NEW: preview scale per cluster so everything reads larger
  const previewScale = useMemo(() => {
    if (type === "early") return 1.35;   // NEW
    if (type === "abyss") return 1.28;   // NEW
    // Root cluster: reduce slightly to gain more top headroom in the canvas
    return 1.18;                          // NEW (root)
  }, [type]);
const previewOffsetY = useMemo(() => {
  if (type === "root")  return 0;  // up a bit from -0.60
  if (type === "abyss") return 0;  // keep your current
  if (type === "early") return 0;  // keep your current
  return -0.60;
}, [type]);

  // Tilt ONLY the group for abyss (match desktop feel: pitch -18°, yaw +12°)
  const abyssRot = useMemo(() => [deg(10), deg(0), 0], []);
  const handleOpenOverlay = useCallback(() => onOpenOverlay?.(cluster?.id), [onOpenOverlay, cluster?.id]);

  return (
    <section className="m-stage">
      {/* 3D preview */}
      <div className="m-stage-canvas" data-ready="true" onClick={handleOpenOverlay}>
        <Canvas
          dpr={[1, Math.min(1.75, window.devicePixelRatio || 1)]}
          gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
          shadows={false}
        >
          <PerformanceMonitor />
          <AdaptiveDpr pixelated />
          <PerspectiveCamera makeDefault fov={camFov} position={camPos} near={0.1} far={2000} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 5]} intensity={1.2} />

          <StageReadySentinel onReady={onStageReady} />

          <Suspense fallback={null}>
            <group position={[0, previewOffsetY, 0]} scale={[previewScale, previewScale, previewScale]}>
            {type === "root" && (
              <ConceptCluster
                id={cluster.id}
                images={cluster.images}
                layout={cluster.layout}
                title={cluster.title}
                subtitle={cluster.subtitle}
                year={cluster.year}
                isActive
                mobile
                position={[0, 0, 0]}
                rotation={[0, 0, 0]}
                scale={[1.3, 1.3, 1.3]}
              />
            )}

            {type === "abyss" && (
              // Wrap the cluster in a rotated group so the floor disk reads,
              // and keep the cluster's own rotation neutral.
              <group rotation={abyssRot}>
                <AbyssCluster
                  id="cluster-abyss"
                  images={cluster?.images ?? []}
                  isActive
                  mobile
                  position={[0, 0, 0]}
                  rotation={[0, 0, 0]}
                  baseScale={.8}
                />
              </group>
            )}

            {type === "early" && (
              <EarlyAliensCluster
                id="cluster-early-aliens"
                assets={cluster?.assets ?? []}
                isActive
                mobile
                position={[0, 0, 0]}
                rotation={[0, 0, 0]}
                baseScale={3}
                scaleMul={1}
                particlesPerGap={12}
                densityBoost={0.55}
                screenSpaceOnDesktop={false}
              />
            )}
            </group>
          </Suspense>
        </Canvas>
      </div>

      {/* Inline, dummy-proof carousel for this cluster */}
      <MobileInlineCarousel
        type={type}
        cluster={cluster}
        onOpenOverlay={onOpenOverlay}
      />
    </section>
  );
}

export default function ConceptSceneMobile() {
  // Pull your three clusters from assetData
  const rootCluster     = useMemo(() => conceptAssets.find(c => c?.id === "cluster-root") || null, []);
  const abyssData       = useMemo(() => conceptAssets.find(c => c?.id === "cluster-abyss") || null, []);
  const earlyAliensData = useMemo(() => conceptAssets.find(c => c?.id === "cluster-early-aliens") || null, []);

  const stages = useMemo(() => {
    const items = [];
    if (rootCluster)     items.push({ key: "cluster-root", type: "root",  data: rootCluster });
    if (abyssData)       items.push({ key: "cluster-abyss", type: "abyss", data: abyssData });
    if (earlyAliensData) items.push({ key: "cluster-early-aliens", type: "early", data: earlyAliensData });
    return items;
  }, [rootCluster, abyssData, earlyAliensData]);

  // Fullscreen overlay (unchanged behavior)
  const [activeClusterId, setActiveClusterId] = useState(null);
  const openOverlay  = useCallback((id) => setActiveClusterId(id), []);
  const closeOverlay = useCallback(() => setActiveClusterId(null), []);

  // Minimal loader: wait for all stages to draw a couple frames
  const MIN_LOADER_MS = 600;
  const SAFETY_MS     = 7000;
  const startRef = useRef(performance.now());
  const [readyCount, setReadyCount] = useState(0);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    const safety = setTimeout(() => setShowLoader(false), SAFETY_MS);
    return () => clearTimeout(safety);
  }, []);

  const onStageReady = useCallback(() => {
    setReadyCount((n) => {
      const next = n + 1;
      if (next >= stages.length) {
        const elapsed = performance.now() - startRef.current;
        const remain  = Math.max(0, MIN_LOADER_MS - elapsed);
        if (remain > 0) setTimeout(() => setShowLoader(false), remain);
        else setShowLoader(false);
      }
      return next;
    });
  }, [stages.length]);

  return (
    <div className={`m-wrap${showLoader ? " is-loading" : ""}`} aria-label="Concept clusters (mobile)">
      <div className="m-list">
        {stages.map(({ key, type, data }) => (
          <ClusterStage
            key={key}
            type={type}
            cluster={data}
            onOpenOverlay={openOverlay}
            onStageReady={onStageReady}
          />
        ))}
      </div>

      {/* Fullscreen overlay still works; the inline carousel doesn't replace it */}
      {activeClusterId && (
        <React.Suspense fallback={null}>
          {/* Your existing fullscreen overlay component is opened from elsewhere */}
        </React.Suspense>
      )}

      <PreloadMaskMobile visible={showLoader} />
    </div>
  );
}
