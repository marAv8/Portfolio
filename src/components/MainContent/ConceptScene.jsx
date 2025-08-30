// src/components/MainContent/ConceptScene.jsx
import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  Suspense,
  useCallback,
} from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  AdaptiveDpr,
  PerformanceMonitor,
  useProgress, // for ProgressReporter
} from '@react-three/drei';

import { useScreenSize } from '../../contexts/ScreenSizeContext';
import { conceptAssets } from '../../assets/assetData';
import PreloadMask from '../Effects/PreloadMask'; // ✅ single global mask

const ConceptCluster = React.lazy(() => import('./ConceptCluster'));
const AbyssCluster   = React.lazy(() => import('./AbyssCluster'));
const ClusterOverlay = React.lazy(() => import('../Overlays/RootOverlay'));

const deg = (d) => THREE.MathUtils.degToRad(d);

/** Reads drei's loading progress from inside <Canvas> and reports it up */
function ProgressReporter({ onChange }) {
  const { progress, active, loaded, total, item } = useProgress();
  useEffect(() => {
    onChange?.({ progress, active, loaded, total, item });
  }, [progress, active, loaded, total, item, onChange]);
  return null;
}

export default function ConceptScene() {
  const [activeClusterId, setActiveClusterId] = useState(null);
  const [hoverFocusId, setHoverFocusId]       = useState(null);
  const [lite, setLite]                       = useState(false);

  // isolate view while editing
  const [isolateId, setIsolateId] = useState(null);

  // Preload both lazy chunks so they appear together
  const [chunksReady, setChunksReady] = useState(false);
  useEffect(() => {
    let alive = true;
    Promise.all([
      import('./ConceptCluster'),
      import('./AbyssCluster'),
    ]).then(() => {
      if (alive) setChunksReady(true);
    });
    return () => { alive = false; };
  }, []);

  // Track asset progress from inside Canvas
  const [loadProgress, setLoadProgress] = useState(0);

  // Show/hide the global mask with a tiny settle delay (prevents pop)
  const sceneReady = chunksReady && loadProgress >= 99;
  const [maskVisible, setMaskVisible] = useState(true);
  useEffect(() => {
    if (sceneReady) {
      const t = setTimeout(() => setMaskVisible(false), 150);
      return () => clearTimeout(t);
    } else {
      setMaskVisible(true);
    }
  }, [sceneReady]);

  // Visibility for now & future clusters (via URL params)
  const [visibleIds, setVisibleIds] = useState(new Set());
  useEffect(() => {
    const allIds = new Set(conceptAssets.map(c => c.id));
    let next = new Set(allIds); // default: show all
    try {
      const qs  = new URLSearchParams(window.location.search);
      const vis = qs.get('visible'); // 'all' | 'none' | csv
      const iso = qs.get('isolate'); // one id
      if (vis) {
        if (vis === 'none') next = new Set();
        else if (vis !== 'all') {
          next = new Set(vis.split(',').map(s => s.trim()).filter(Boolean));
        }
      }
      if (iso) setIsolateId(iso);
    } catch {}
    setVisibleIds(next);
  }, []);

  const shouldShow = useCallback((id) => {
    if (isolateId && isolateId !== id) return false;
    return visibleIds.has(id);
  }, [isolateId, visibleIds]);

  const controlsRef   = useRef(null);
  const clusterRefs   = useRef(new Map()); // id -> Object3D
  const hoverTimerRef = useRef(null);

  const defaultTarget = useRef(new THREE.Vector3(0, -3.0, 0));

  // Enable/disable orbit controls (children call this)
  const setControlsEnabled = (enabled) => {
    if (controlsRef.current) controlsRef.current.enabled = enabled;
  };

  // Parent receives each cluster's Object3D so we can focus it
  const registerClusterRef = useCallback((id, obj3d) => {
    if (!id) return;
    if (!obj3d) clusterRefs.current.delete(id);
    else clusterRefs.current.set(id, obj3d);
  }, []);

  // Focus a cluster by id (keep azimuth/elevation, adjust distance)
  const focusCluster = useCallback(
    (id, { isolate = false, distance = 28, liftY = 0.5 } = {}) => {
      const ctrl = controlsRef.current;
      const cam  = ctrl?.object;
      const node = clusterRefs.current.get(id);
      if (!ctrl || !cam || !node) return;

      node.updateWorldMatrix(true, true);
      const center = new THREE.Vector3().setFromMatrixPosition(node.matrixWorld);
      center.y += liftY;

      const prevTarget = ctrl.target.clone();
      const offset     = cam.position.clone().sub(prevTarget);
      const dir        = offset.normalize();
      const newPos     = center.clone().addScaledVector(dir, distance);

      ctrl.target.copy(center);
      cam.position.copy(newPos);
      ctrl.update();

      if (isolate) setIsolateId(id);
    },
    []
  );

  const clearFocus = useCallback(() => {
    const ctrl = controlsRef.current;
    const cam  = ctrl?.object;
    if (!ctrl || !cam) return;
    const prevTarget = ctrl.target.clone();
    const offset     = cam.position.clone().sub(prevTarget);
    ctrl.target.copy(defaultTarget.current);
    cam.position.copy(defaultTarget.current.clone().add(offset));
    ctrl.update();
    setIsolateId(null);
  }, []);

  // DEV helpers
  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (k === '2') {
        focusCluster('cluster-abyss', { isolate: true, distance: 26, liftY: 0.5 });
      } else if (k === '1') {
        setIsolateId(null);
        focusCluster('cluster-root', { isolate: false, distance: 30, liftY: 0.4 });
      } else if (k === 'f') {
        focusCluster('cluster-abyss', { isolate: false, distance: 26, liftY: 0.5 });
      } else if (k === '0' || k === 'escape') {
        clearFocus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusCluster, clearFocus]);

  // Optional: /concepts?focus=abyss auto-focus
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get('focus') === 'abyss') {
        setTimeout(() => focusCluster('cluster-abyss', { distance: 26 }), 50);
      }
    } catch {}
  }, [focusCluster]);

  // Hover handler (kept simple)
  const [hasInteracted, setHasInteracted] = useState(false);
  const handleHoverChange = () => {
    if (!hasInteracted) setHasInteracted(true);
  };

  const handleActivate = (id) => {
    setHasInteracted(true);
    if (id !== 'cluster-root') return; // Only Root opens overlay for now
    setActiveClusterId(id);
    if (controlsRef.current) controlsRef.current.enabled = false;
  };

  const { isTablet } = useScreenSize();

  // Data lookups
  const rootCluster = useMemo(() => conceptAssets.find((c) => c.id === 'cluster-root'), []);
  const abyssData   = useMemo(() => conceptAssets.find((c) => c.id === 'cluster-abyss'), []);
  const activeCluster = useMemo(
    () => conceptAssets.find((c) => c.id === activeClusterId),
    [activeClusterId]
  );

  const preferHiRes = hasInteracted || !!activeCluster;

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Canvas
        dpr={[1, Math.min(1.5, window.devicePixelRatio || 1)]}
        gl={{ antialias: !lite, powerPreference: lite ? 'low-power' : 'high-performance', alpha: false }}
        shadows={false}
        style={{ background: 'black' }}
      >
        {/* Report loading progress for EVERYTHING inside the Canvas */}
        <ProgressReporter onChange={({ progress }) => setLoadProgress(progress)} />

        <PerformanceMonitor onDecline={() => setLite(true)} />
        <AdaptiveDpr pixelated />

        <PerspectiveCamera makeDefault fov={40} position={[0, 3.6, 41]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} />

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minPolarAngle={THREE.MathUtils.degToRad(51)}
          maxPolarAngle={THREE.MathUtils.degToRad(60)}
          minDistance={24}
          maxDistance={44}
          enableDamping
          dampingFactor={0.08}
          target={[0, -3.0, 0]}
        />

        {/* Clusters render inside Suspense with null fallbacks (no DOM in Canvas) */}
        {shouldShow('cluster-root') && rootCluster && (
          <Suspense fallback={null}>
            <ConceptCluster
              id={rootCluster.id}
              images={rootCluster.images}
              layout={rootCluster.layout}
              title={rootCluster.title}
              subtitle={rootCluster.subtitle}
              year={rootCluster.year}
              preferHiRes={preferHiRes}
              isActive={false}
              registerRef={registerClusterRef}
              onActivate={handleActivate}
              onHoverChange={handleHoverChange}
              attractMode={!activeCluster && isTablet && !hasInteracted}
              setControlsEnabled={setControlsEnabled}
              controlsRef={controlsRef}
              position={[0, -3, 0]}
              rotation={[deg(-18), deg(0), 0]}
              scale={[1, 1, 1]}
            />
          </Suspense>
        )}

        {shouldShow('cluster-abyss') && (
          <Suspense fallback={null}>
            <AbyssCluster
              controlsRef={controlsRef}
              id="cluster-abyss"
              images={abyssData?.images ?? []}
              isActive={activeClusterId === 'cluster-abyss'}
              onActivate={handleActivate}
              onHoverChange={handleHoverChange}
              registerRef={registerClusterRef}
              position={[-32, -40, -28]}
              rotation={[deg(-25), deg(-15), 0]}
              baseScale={1}
              setControlsEnabled={setControlsEnabled}
            />
          </Suspense>
        )}
      </Canvas>

      {/* Overlay (kept Suspenseable, but no DOM inside Canvas) */}
      {activeCluster && (
        <Suspense fallback={null}>
          <ClusterOverlay
            cluster={activeCluster}
            onClose={() => {
              setActiveClusterId(null);
              setHoverFocusId(null);
              clearFocus();
              if (controlsRef.current) controlsRef.current.enabled = true;
            }}
          />
        </Suspense>
      )}

      {/* Single global flicker ABOVE the Canvas until everything is ready */}
      {maskVisible && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none' }}>
          <PreloadMask />
        </div>
      )}
    </div>
  );
}
