// src/components/MainContent/ConceptScene.jsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
  useCallback,
} from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";

import { useScreenSize } from "../../contexts/ScreenSizeContext";
import { getConceptLayout, COMPOSITION } from "../../config/conceptsLayout";
import { conceptAssets } from "../../assets/assetData";
import PreloadMask from "../Effects/PreloadMask";
import './ConceptScene.css';

// ✅ Your new mobile scene (separate, simpler code path)
 import ConceptSceneMobile from "../Mobile/ConceptSceneMobile";

// Lazy desktop clusters + overlays
const ConceptCluster      = React.lazy(() => import("./ConceptCluster"));
const AbyssCluster        = React.lazy(() => import("./AbyssCluster"));
const EarlyAliensCluster  = React.lazy(() => import("./EarlyAliensCluster"));
const RootOverlay         = React.lazy(() => import("../Overlays/RootOverlay"));
const AbyssOverlay        = React.lazy(() => import("../Overlays/AbyssOverlay"));
const EarlyAliensOverlay  = React.lazy(() => import("../Overlays/EarlyAliensOverlay"));

/**
 * Desktop/Tablet scene ONLY.
 * Mobile phones are handled by ../Mobile/ConceptSceneMobile.jsx
 */
function DesktopConceptScene({ isTablet }) {
  const isMobile = false;
  const layout = getConceptLayout({ isMobile, isTablet });

  // Assets
  const rootCluster     = useMemo(() => conceptAssets.find(c => c.id === "cluster-root"), []);
  const abyssData       = useMemo(() => conceptAssets.find(c => c.id === "cluster-abyss"), []);
  const earlyAliensData = useMemo(() => conceptAssets.find(c => c.id === "cluster-early-aliens"), []);

  // UI state
  const [activeClusterId, setActiveClusterId] = useState(null);
  const [lite, setLite] = useState(false);

  // Desktop-only preload mask (kept simple)
  const [maskVisible, setMaskVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setMaskVisible(false), 900);
    return () => clearTimeout(t);
  }, []);

  // Controls toggle (clusters call this while dragging)
  const controlsRef = useRef(null);
  const setControlsEnabled = useCallback((enabled) => {
    if (controlsRef.current) controlsRef.current.enabled = !!enabled;
  }, []);

  // Overlay openers
  const handleActivate = useCallback((id) => {
    if (!id) return;
    setActiveClusterId(id);
    if (controlsRef.current) controlsRef.current.enabled = false;
  }, []);

  const closeOverlay = useCallback(() => {
    setActiveClusterId(null);
    if (controlsRef.current) controlsRef.current.enabled = true;
  }, []);
  // =========================================
// Rule-based framing (targetX + cameraZ)
// =========================================
const [framing, setFraming] = useState(() => ({
  targetX: layout.camera?.target?.[0] ?? 0,
  camPos:  layout.camera?.position ?? [0, 4, 41],
}));

const recomputeFraming = useCallback(() => {
  // 0) viewport + aspect
  const vw = window.innerWidth || 1280;
  const vh = window.innerHeight || 800;
  const aspect = Math.max(0.5, vw / Math.max(1, vh));

  // 1) gutters
  const gutterPx    = Math.max(COMPOSITION.GUTTER_VW * vw, COMPOSITION.GUTTER_MIN_PX);
  const contentFrac = Math.max(0.4, (vw - 2 * gutterPx) / vw);

  // 2) spans
  const cs    = layout.clusters || {};
  const items = [cs.root, cs.abyss, cs.early].filter(Boolean);
  const spans = items.map(c => {
    const x = (c.position?.[0] ?? 0);
    const w = (c.frameWidth ?? 22);
    return { left: x - w * 0.5, right: x + w * 0.5 };
  });
  const leftX   = Math.min(...spans.map(s => s.left));
  const rightX  = Math.max(...spans.map(s => s.right));
  const centerX = (leftX + rightX) * 0.5;

  // 3) root-centric target
  const rootX   = (cs.root?.position?.[0] ?? 0);
  const bias    = (COMPOSITION.TARGET_BIAS_TO_ROOT ?? 0.75);
  const targetX = centerX * (1 - bias) + rootX * bias;

  // 4) FOV + asymmetric fit
  const vFov = (layout.camera?.fov ?? 44) * Math.PI / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  const leftDist  = Math.max(0, targetX - leftX);
  const rightDist = Math.max(0, rightX - targetX);
  const maxHalf   = Math.max(leftDist, rightDist);
  const denom     = Math.tan(hFov / 2) * contentFrac;
  const requiredZ = maxHalf / Math.max(denom, 1e-3);

  // 5) clamp + commit
  const clamp = isTablet ? COMPOSITION.CLAMPS.tablet : COMPOSITION.CLAMPS.desktop;
  const z     = Math.min(clamp.zMax, Math.max(clamp.zMin, requiredZ));
  const baseY = layout.camera?.position?.[1] ?? 4;

  setFraming({ targetX, camPos: [targetX, baseY, z] });

  // ✅ Debug AFTER everything exists
  console.log("[compose]", { vw, gutterPx, leftX, rightX, centerX, rootX, targetX, requiredZ, z });
}, [layout, isTablet]);


  useEffect(() => {
    recomputeFraming();
    const onResize = () => recomputeFraming();
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, [recomputeFraming]);

  // =========================================
// NEW: viewport scale multiplier
// - keeps apparent cluster size stable as camera Z changes
// =========================================
const baseZ    = layout.camera?.position?.[2] ?? 41;           // 41 desktop, 54 tablet in your layout
const currentZ = framing.camPos?.[2] ?? baseZ;
const rawMul   = baseZ / Math.max(1e-3, currentZ);
const scaleMul = Math.min(1.6, Math.max(0.8, rawMul));         // clamp for sanity
// NEW: tiny width-based “fill” so size varies even when Z doesn’t
const w = typeof window !== 'undefined' ? window.innerWidth : 1280;
const widthMul = Math.min(1.25, Math.max(0.9, w / 1280));
const scaleMulFinal = scaleMul * widthMul;
// (optional) console to confirm
console.log('[early][mul]', { scaleMul, widthMul, scaleMulFinal, camZ: currentZ });

  return (
    <section style={{ width: "100%", height: "100vh", background: "black", position: "relative", overflow: "hidden" }}>
      <Canvas
        dpr={[1, Math.min(1.75, window.devicePixelRatio || 1)]}
        gl={{ antialias: !lite, powerPreference: lite ? "low-power" : "high-performance", alpha: false }}
        shadows={false}
        style={{ width: "100%", height: "100%", background: "black" }}
      >
        <PerformanceMonitor onDecline={() => setLite(true)} />
        <AdaptiveDpr pixelated />

        {/* SIMPLE camera: fov, position; OrbitControls target aims the view */}
        <PerspectiveCamera
          makeDefault
          fov={layout.camera?.fov ?? 44}
          position={framing.camPos}
          near={0.1}
          far={2000}
        />

        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} />

        <OrbitControls
          ref={controlsRef}
          makeDefault
       // 👇 Rule-based target: X is root-biased; Y/Z as before
          target={[framing.targetX, (layout.camera?.target?.[1] ?? -6), (layout.camera?.target?.[2] ?? 0)]}
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.65}
        />

        {/* CLUSTERS (desktop/tablet) */}
        {rootCluster && (
          <Suspense fallback={null}>
            <ConceptCluster
              id={rootCluster.id}
              images={rootCluster.images}
              layout={rootCluster.layout}
              title={rootCluster.title}
              subtitle={rootCluster.subtitle}
              year={rootCluster.year}
              isActive={false}
              preferHiRes={!!activeClusterId}
              setControlsEnabled={setControlsEnabled}
              controlsRef={controlsRef}
              position={layout.clusters.root.position}
              rotation={layout.clusters.root.rotation}
              scale={layout.clusters.root.scale || [1, 1, 1]}
              onActivate={handleActivate}
            />
          </Suspense>
        )}

        <Suspense fallback={null}>
          <AbyssCluster
            id="cluster-abyss"
            images={abyssData?.images ?? []}
            isActive={activeClusterId === "cluster-abyss"}
            position={layout.clusters.abyss.position}
            rotation={layout.clusters.abyss.rotation}
            baseScale={layout.clusters.abyss.baseScale || 1}
            setControlsEnabled={setControlsEnabled}
            controlsRef={controlsRef}
            onActivate={handleActivate}
          />
        </Suspense>

        <Suspense fallback={null}>
          <EarlyAliensCluster
            id="cluster-early-aliens"
            assets={earlyAliensData?.assets ?? []}
            isActive={activeClusterId === "cluster-early-aliens"}
            position={layout.clusters.early.position}
            rotation={layout.clusters.early.rotation}
            baseScale={layout.clusters.early.baseScale || 3}
            scaleMul={scaleMulFinal}
            setControlsEnabled={setControlsEnabled}
            controlsRef={controlsRef}
            onActivate={handleActivate}
            particlesPerGap={14} 
            densityBoost={0.65}
            screenSpaceOnDesktop
          />
        </Suspense>
      </Canvas>

      {/* Desktop/Tablet overlays */}
      {activeClusterId && (
        <Suspense fallback={null}>
          {activeClusterId === "cluster-abyss" ? (
            <AbyssOverlay cluster={abyssData} onClose={closeOverlay} />
          ) : activeClusterId === "cluster-early-aliens" ? (
            <EarlyAliensOverlay cluster={earlyAliensData} onClose={closeOverlay} />
          ) : (
            <RootOverlay cluster={rootCluster} onClose={closeOverlay} />
          )}
        </Suspense>
      )}

      {/* Preload mask (desktop/tablet only) */}
      {maskVisible && (
        <div style={{ position: "absolute", inset: 0, zIndex: 20, pointerEvents: "none" }}>
          <PreloadMask />
        </div>
      )}
    </section>
  );
}

/**
 * Router: phones → mobile scene; everything else → desktop/tablet scene
 */
export default function ConceptScene() {
  const { isMobile, isTablet } = useScreenSize();
  if (isMobile) return <ConceptSceneMobile />; // ✅ phones live here
  return <DesktopConceptScene isTablet={isTablet} />;
}
