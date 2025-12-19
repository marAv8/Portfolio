// src/components/MainContent/ConceptScene.jsx
import * as THREE from "three";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
  useCallback,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";

import { useScreenSize } from "../../contexts/ScreenSizeContext";
import { getConceptLayout, COMPOSITION } from "../../config/conceptsLayout";
import { conceptAssets } from "../../assets/assetData";
import PreloadMask from "../Effects/PreloadMask";
import './ConceptScene.css';

//Mobile scene
import ConceptSceneMobile from "../Mobile/ConceptSceneMobile";

// Lazy desktop clusters + overlays
const ConceptCluster     = React.lazy(() => import("./ConceptCluster"));
const PenumbraCluster    = React.lazy(() => import("./PenumbraCluster"));
const LumenCluster       = React.lazy(() => import("./LumenCluster"));
const AbyssCluster       = React.lazy(() => import("./AbyssCluster"));
const EarlyAliensCluster = React.lazy(() => import("./EarlyAliensCluster"));
const HatsCluster        = React.lazy(() => import("./HatsCluster"));

const RootOverlay        = React.lazy(() => import("../Overlays/RootOverlay"));
const PenumbraOverlay    = React.lazy(() => import("../Overlays/PenumbraOverlay"));
const LumenOverlay       = React.lazy(() => import("../Overlays/LumenOverlay"));
const AbyssOverlay       = React.lazy(() => import("../Overlays/AbyssOverlay"));
const EarlyAliensOverlay = React.lazy(() => import("../Overlays/EarlyAliensOverlay"));
const HatsOverlay        = React.lazy(() => import("../Overlays/HatsOverlay"));

const METADATA_PER_CLUSTER = {
  default: { dx: -8, dy: 12, dz: 0 },
  "cluster-root": { dx: -8, dy: 12, dz: 0 },
  "cluster-penumbra": { dx: -8, dy: 12, dz: 0 },
  "cluster-lumen": { dx: -8, dy: -2, dz: 0 },
  "cluster-abyss": { dx: -8, dy: 18, dz: 0 },
  "cluster-early-aliens": { dx: -8, dy: 12, dz: 0 },
  "cluster-hats": { dx: -8, dy: 12, dz: 0 },
};
const METADATA_OFFSET = [-8, 12, 0];
const SCREEN_ANCHORS = {
  "cluster-root": { x: -140, y: -50 },
  "cluster-penumbra": { x: -140, y: -50 },
  "cluster-lumen": { x: -140, y: -50 },
  "cluster-abyss": { x: -140, y: -50 },
  "cluster-hats": { x: -140, y: -50 },
  "cluster-early-aliens": { x: -140, y: -50 },
};

const addVec = (a = [0, 0, 0], b = [0, 0, 0]) => [
  (a[0] ?? 0) + (b[0] ?? 0),
  (a[1] ?? 0) + (b[1] ?? 0),
  (a[2] ?? 0) + (b[2] ?? 0),
];

function MetadataProjector({ entries = [], enabled, onUpdate }) {
  const entriesRef = useRef(entries);
  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  const temp = useRef(new THREE.Vector3());
  const lastRef = useRef(null);

  useFrame(({ camera, size }) => {
    if (!enabled) return;
    const list = entriesRef.current;
    if (!list || list.length === 0) return;
    const next = {};
    list.forEach((entry) => {
      if (!entry?.position) return;
      temp.current.set(...entry.position).project(camera);
      const x = (temp.current.x * 0.5 + 0.5) * size.width;
      const y = (-temp.current.y * 0.5 + 0.5) * size.height;
      next[entry.id] = { x, y };
    });
    const last = lastRef.current;
    let changed = !last;
    if (!changed) {
      const keys = Object.keys(next);
      const lastKeys = Object.keys(last);
      if (keys.length !== lastKeys.length) {
        changed = true;
      } else {
        for (const key of keys) {
          const prev = last[key];
          const cur = next[key];
          if (!prev || Math.abs(prev.x - cur.x) > 0.5 || Math.abs(prev.y - cur.y) > 0.5) {
            changed = true;
            break;
          }
        }
      }
    }
    if (changed) {
      lastRef.current = next;
      onUpdate(next);
    }
  });

  return null;
}

// --- Focus camera on a group by name ---------------------------------
function frameDistanceForBox({ box, camera, fovDeg = camera.fov, fit = 1.2 }) {
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = (fovDeg * Math.PI) / 180;
  // choose the larger of vertical/horizontal fov constraints
  const aspect = (typeof window !== "undefined") ? Math.max(1, window.innerWidth / Math.max(1, window.innerHeight)) : 16/9;
  const vDist = (maxDim * fit) / (2 * Math.tan(fov / 2));
  const hFov = 2 * Math.atan(Math.tan(fov / 2) * aspect);
  const hDist = (maxDim * fit) / (2 * Math.tan(hFov / 2));
  return Math.max(vDist, hDist);
}

function tweenVec3(v, to, t) {
  v.set(
    v.x + (to.x - v.x) * t,
    v.y + (to.y - v.y) * t,
    v.z + (to.z - v.z) * t
  );
}


/**
 * Desktop/Tablet scene ONLY.
 * Mobile phones are handled by ../Mobile/ConceptSceneMobile.jsx
 */
function DesktopConceptScene({ isTablet }) {
  const isMobile = false;
  const layout = getConceptLayout({ isMobile, isTablet });

  // Assets
  const rootCluster       = useMemo(() => conceptAssets.find(c => c.id === "cluster-root"), []);
    const penumbraCluster = useMemo(() => conceptAssets.find(c => c.id === "cluster-penumbra"), []);
    const lumenData       = useMemo(() => conceptAssets.find(c => c.id === "cluster-lumen"), []);
    const abyssData       = useMemo(() => conceptAssets.find(c => c.id === "cluster-abyss"), []);
    const earlyAliensData = useMemo(() => conceptAssets.find(c => c.id === "cluster-early-aliens"), []);
    const hatsData        = useMemo(() => conceptAssets.find(c => c.id === "cluster-hats"), []);

  const clusterHints = useMemo(() => {
    const entries = [];
    const pushEntry = (key, info) => {
      if (!info) return;
      const layoutNode = layout?.clusters?.[key];
      if (!layoutNode?.position) return;

      const cfg = METADATA_PER_CLUSTER[info.id] || METADATA_PER_CLUSTER.default || { dx: -8, dy: 12, dz: 0 };
      const offset = [cfg.dx, cfg.dy, cfg.dz];

      entries.push({
        id: info.id,
        title: info.title || info.id,
        subtitle: info.subtitle,
        year: info.year,
        position: addVec(layoutNode.position, offset),
      });
    };

    pushEntry("root", rootCluster);
    pushEntry("penumbra", penumbraCluster);
    pushEntry("lumen", lumenData);
    pushEntry("abyss", abyssData);
    pushEntry("hats", hatsData);
    pushEntry("early", earlyAliensData);
    return entries;
  }, [layout, rootCluster, penumbraCluster, lumenData, abyssData, hatsData, earlyAliensData]);

  // UI state
  const [activeClusterId, setActiveClusterId] = useState(null);
  const [lite, setLite] = useState(false);
  const [hoveredClusterId, setHoveredClusterId] = useState(null);
  const [metadataScreens, setMetadataScreens] = useState({});

  useEffect(() => {
    if (!hoveredClusterId) return;
    if (!clusterHints.some((entry) => entry.id === hoveredClusterId)) {
      setHoveredClusterId(null);
    }
  }, [hoveredClusterId, clusterHints]);

  useEffect(() => {
    if (activeClusterId) setHoveredClusterId(null);
  }, [activeClusterId]);

  useEffect(() => {
    if (isTablet) setMetadataScreens({});
  }, [isTablet]);

  // Desktop-only preload mask (kept simple)
  const [maskVisible, setMaskVisible] = useState(true);
  const [isPointerDown, setIsPointerDown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMaskVisible(false), 900);
    return () => clearTimeout(t);
  }, []);

  // Controls toggle (clusters call this while dragging)
  const controlsRef = useRef(null);
  const setControlsEnabled = useCallback((enabled) => {
    if (controlsRef.current) controlsRef.current.enabled = !!enabled;
  }, []);

  const updateHover = useCallback((clusterId, hovering) => {
    if (!clusterId) return;
    setHoveredClusterId((prev) => {
      if (hovering) return clusterId;
      return prev === clusterId ? null : prev;
    });
  }, []);

  const createHoverHandler = useCallback(
    (clusterId) => {
      if (!clusterId) return undefined;
      return (arg1, arg2) => {
        const resolvedId =
          typeof arg1 === "string" && typeof arg2 === "boolean" ? arg1 : clusterId;
        const hovering =
          typeof arg2 === "boolean"
            ? arg2
            : typeof arg1 === "boolean"
            ? arg1
            : !!arg1;
        updateHover(resolvedId, hovering);
      };
    },
    [updateHover]
  );

  const rootHoverHandler = useMemo(
    () => (rootCluster ? createHoverHandler(rootCluster.id) : undefined),
    [rootCluster, createHoverHandler]
  );
  const penumbraHoverHandler = useMemo(
    () => (penumbraCluster ? createHoverHandler(penumbraCluster.id) : undefined),
    [penumbraCluster, createHoverHandler]
  );
  const lumenHoverHandler = useMemo(
    () => (lumenData ? createHoverHandler(lumenData.id) : undefined),
    [lumenData, createHoverHandler]
  );
  const abyssHoverHandler = useMemo(
    () => (abyssData ? createHoverHandler(abyssData.id) : undefined),
    [abyssData, createHoverHandler]
  );
  const hatsHoverHandler = useMemo(
    () => (hatsData ? createHoverHandler(hatsData.id) : undefined),
    [hatsData, createHoverHandler]
  );
  const earlyHoverHandler = useMemo(
    () => (earlyAliensData ? createHoverHandler(earlyAliensData.id) : undefined),
    [earlyAliensData, createHoverHandler]
  );



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


 // Absolute camera: use exactly what conceptsLayout.js describes
 const computeFraming = useCallback(() => {
   const baseTarget = layout.camera?.target ?? [0, -6, 0];
   const basePos = layout.camera?.position ?? [0, 4, 41];
   const baseFov = layout.camera?.fov ?? 44;

   // Visual composition fix: slightly widen framing on narrower desktop viewports (no CSS/layout changes).
   const aspect =
     typeof window !== "undefined" && window.innerHeight > 0
       ? window.innerWidth / window.innerHeight
       : 16 / 9;

   if (!isTablet && aspect < 1.45) {
     // Push camera back a bit; keep everything else unchanged.
     return {
       target: baseTarget,
       camPos: [basePos[0], basePos[1], basePos[2] + 3.5],
       fov: baseFov,
     };
   }

   return { target: baseTarget, camPos: basePos, fov: baseFov };
 }, [isTablet, layout.camera]);

 const [framing, setFraming] = useState(() => computeFraming());

 useEffect(() => {
   setFraming(computeFraming());
 }, [computeFraming]);

  const hoveredHint = !activeClusterId && hoveredClusterId
    ? clusterHints.find((entry) => entry.id === hoveredClusterId)
    : null;
  const activeHint = !isPointerDown ? hoveredHint : null;

  // =========================================
// NEW: viewport scale multiplier
// - keeps apparent cluster size stable as camera Z changes
// =========================================
const scaleMulFinal = 1; // keep cluster authoring literal
// (optional) console to confirm
// Focus helper: center + frame a named group (e.g., "Penumbra")
const focusCluster = useCallback((name, { duration = 450, fit = 1.25 } = {}) => {
  const scene = controlsRef.current?.object?.parent; // OrbitControls' object is the camera
  const camera = controlsRef.current?.object;
  if (!scene || !camera) return;

  const group = scene.getObjectByName(name);
  if (!group) {
    console.warn(`[focusCluster] Group "${name}" not found`);
    return;
  }

  // Compute world-space bounding box
  const box = new THREE.Box3().setFromObject(group);
  const center = new THREE.Vector3();
  box.getCenter(center);

  // Distance needed to frame the box
  const dist = frameDistanceForBox({ box, camera, fovDeg: camera.fov, fit });

  // Aim direction: keep current polar angle, move along camera->target ray
  const startPos = camera.position.clone();
  const startTarget = controlsRef.current.target.clone();

  const dir = new THREE.Vector3().subVectors(startPos, startTarget).normalize();
  // new camera position so that camera-target distance == dist
  const endTarget = center;
  const endPos = new THREE.Vector3().copy(endTarget).add(dir.multiplyScalar(dist));

  // Animate
  const t0 = performance.now();
  const d = Math.max(1, duration);
  function step(now) {
    const u = Math.min(1, (now - t0) / d);
    // ease (smoothstep-ish)
    const t = u * u * (3 - 2 * u);
    const curPos = startPos.clone();
    const curTgt = startTarget.clone();
    tweenVec3(curPos, endPos, t);
    tweenVec3(curTgt, endTarget, t);
    camera.position.copy(curPos);
    controlsRef.current.target.copy(curTgt);
    camera.updateProjectionMatrix();
    controlsRef.current.update();
    if (u < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}, [controlsRef]);

  // Console helper: window.focusCluster("Penumbra")
useEffect(() => {
  window.focusCluster = (name, opts) => focusCluster(name, opts);
  return () => { try { delete window.focusCluster; } catch {} };
}, [focusCluster]);

useEffect(() => {
  const handlePointerUp = () => setIsPointerDown(false);
  window.addEventListener('pointerup', handlePointerUp);
  window.addEventListener('pointercancel', handlePointerUp);
  return () => {
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('pointercancel', handlePointerUp);
  };
}, []);

const lumenLayout = layout?.clusters?.lumen;
return (
<section 
  className="concept-page"
>
        <Canvas
        dpr={[1, Math.min(1.75, window.devicePixelRatio || 1)]}
        gl={{ antialias: !lite, powerPreference: lite ? "low-power" : "high-performance", alpha: false }}
        shadows={false}
        style={{ width: "100%", height: "100%", background: "black" }}
        onPointerDown={() => setIsPointerDown(true)}
      >
        <PerformanceMonitor onDecline={() => setLite(true)} />
        <AdaptiveDpr pixelated />

        {/* SIMPLE camera: fov, position; OrbitControls target aims the view */}
        <PerspectiveCamera
          makeDefault
          fov={framing.fov}
          position={framing.camPos}
          near={0.1}
          far={2000}
        />

        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} />

        <OrbitControls
          ref={controlsRef}
          makeDefault
          target={framing.target}
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
              onHoverChange={rootHoverHandler}
            />
          </Suspense>
        )}
        
           {penumbraCluster && (
          <Suspense fallback={null}>
            <PenumbraCluster
              id={penumbraCluster.id}
              images={penumbraCluster.images}
              layout={penumbraCluster.layout}
              title={penumbraCluster.title}
              subtitle={penumbraCluster.subtitle}
              year={penumbraCluster.year}
              palette={penumbraCluster.palette}
              extrusion={penumbraCluster.extrusion}
              isActive={activeClusterId === penumbraCluster.id}
              setControlsEnabled={setControlsEnabled}
              controlsRef={controlsRef}
              position={layout.clusters.penumbra.position}
              rotation={layout.clusters.penumbra.rotation}
              scale={layout.clusters.penumbra.scale || [1, 1, 1]}
              onActivate={handleActivate}
                showShadow={false}
                showFogPad={false}
              onHoverChange={penumbraHoverHandler}
            />
          </Suspense>
        )}
          {lumenLayout && (
            <Suspense fallback={null}>
              <LumenCluster
                id="cluster-lumen"
                position={lumenLayout.position}
                rotation={lumenLayout.rotation}
                scale={lumenLayout.scale || [1,1,1]}
                setControlsEnabled={setControlsEnabled}
                controlsRef={controlsRef}
                onActivate={handleActivate}   // LumenCluster will call onActivate("cluster-lumen")
                visibleSub="all"
                interactive                   // ← mounts the billboard plane (hover/drag/click)
                onHoverChange={lumenHoverHandler}
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
            onHoverChange={abyssHoverHandler}
          />
        </Suspense>
        {hatsData && (
          <Suspense fallback={null}>
            <HatsCluster
              id="cluster-hats"
              assets={hatsData.assets ?? []}
              isActive={activeClusterId === "cluster-hats"}
              position={layout.clusters.hats.position}
              rotation={layout.clusters.hats.rotation}
              baseScale={layout.clusters.hats.baseScale || 3}
              scaleMul={scaleMulFinal}
              setControlsEnabled={setControlsEnabled}
              controlsRef={controlsRef}
              onActivate={handleActivate}
              particlesPerGap={14}
              densityBoost={0.65}
              screenSpaceOnDesktop
              onHoverChange={hatsHoverHandler}
            />
          </Suspense>
        )}
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
            onHoverChange={earlyHoverHandler}
          />
        </Suspense>

        {!isTablet && (
          <MetadataProjector
            entries={clusterHints}
            enabled={!isTablet}
            onUpdate={setMetadataScreens}
          />
        )}
      </Canvas>

      <div className="concept-ui-overlay" aria-hidden="true">
        {!isTablet && activeHint && metadataScreens[activeHint.id] && (() => {
          const anchor = SCREEN_ANCHORS[activeHint.id] || { x: 0, y: 0 };
          const coords = metadataScreens[activeHint.id];
          return (
            <div
              className="cluster-metadata-card"
              style={{
                left: `${coords.x + anchor.x}px`,
                top: `${coords.y + anchor.y}px`,
              }}
            >
              <div className="cluster-metadata-title">{activeHint.title}</div>
              {activeHint.year ? (
                <div className="cluster-metadata-year">{activeHint.year}</div>
              ) : null}
              {activeHint.subtitle ? (
                <div className="cluster-metadata-desc">{activeHint.subtitle}</div>
              ) : null}
            </div>
          );
        })()}

        {!isTablet && activeHint && (
          <div className="cluster-protip">
            <span>click &amp; drag to view</span>
            <span>click to open</span>
          </div>
        )}

        {isTablet && (
          <div className="cluster-protip cluster-protip--tablet">
            Tap a cluster to open
          </div>
        )}
      </div>

      {/* Desktop/Tablet overlays */}
        {activeClusterId && (
          <Suspense fallback={null}>
            {
              activeClusterId === "cluster-lumen" ? (
                <LumenOverlay onClose={closeOverlay} />
              ) : activeClusterId === "cluster-abyss" ? (
                <AbyssOverlay cluster={abyssData} onClose={closeOverlay} />
              ) : activeClusterId === "cluster-early-aliens" ? (
                <EarlyAliensOverlay cluster={earlyAliensData} onClose={closeOverlay} />
              ) : activeClusterId === "cluster-hats" ? (
                <HatsOverlay cluster={hatsData} onClose={closeOverlay} />
              ) : activeClusterId === "cluster-penumbra" ? (
                <PenumbraOverlay cluster={penumbraCluster} onClose={closeOverlay} />
              ) : (
                <RootOverlay cluster={rootCluster} onClose={closeOverlay} />
              )
            }
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
