// src/components/MainContent/ConceptScene.jsx
import React, { useEffect, useState, useMemo, useRef, Suspense, useCallback } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  AdaptiveDpr,
  PerformanceMonitor,
  useProgress,
} from '@react-three/drei';

import { useScreenSize } from '../../contexts/ScreenSizeContext';
import { conceptAssets } from '../../assets/assetData';

const ConceptCluster = React.lazy(() => import('./ConceptCluster'));
const AbyssCluster   = React.lazy(() => import('./AbyssCluster'));
const ClusterOverlay = React.lazy(() => import('../Overlays/RootOverlay'));

// Slightly tweaked to accept a `done` flag
function LoadingCover({ done }) {
  const { progress } = useProgress();
  const ok = done && progress > 12; // wait for chunks + a bit of asset progress
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'black',
        opacity: ok ? 0 : 1,
        transition: 'opacity 500ms ease',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}

const deg = (d) => THREE.MathUtils.degToRad(d);

export default function ConceptScene() {
  const [activeClusterId, setActiveClusterId] = useState(null);
  const [hoverFocusId, setHoverFocusId] = useState(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [lite, setLite] = useState(false);

  // isolate view while editing
  const [isolateId, setIsolateId] = useState(null);

  // NEW: preload both lazy chunks and gate render until ready
  const [chunksReady, setChunksReady] = useState(false);
  useEffect(() => {
    let alive = true;
    Promise.all([import('./ConceptCluster'), import('./AbyssCluster')]).then(() => {
      if (alive) setChunksReady(true);
    });
    return () => { alive = false; };
  }, []);

  // NEW: generic visibility set (works for any number of clusters)
  const [visibleIds, setVisibleIds] = useState(new Set());

  const controlsRef   = useRef(null);
  const clusterRefs   = useRef(new Map()); // id -> Object3D
  const hoverTimerRef = useRef(null);

  // target used when clearing focus (matches OrbitControls target below)
  const defaultTarget = useRef(new THREE.Vector3(0, -3.0, 0));

  // Turn OrbitControls on/off from children
  const setControlsEnabled = (enabled) => {
    if (controlsRef.current) controlsRef.current.enabled = enabled;
  };

  // Expose each cluster's Object3D so we can focus it
  const registerClusterRef = useCallback((id, obj3d) => {
    if (!id) return;
    if (!obj3d) clusterRefs.current.delete(id);
    else clusterRefs.current.set(id, obj3d);
  }, []);

  // Focus a cluster by id (keeps current azimuth/elevation, sets a new distance)
  const focusCluster = useCallback(
    (id, { isolate = false, distance = 28, liftY = 0.5 } = {}) => {
      const ctrl = controlsRef.current;
      const cam  = ctrl?.object; // camera used by OrbitControls
      const node = clusterRefs.current.get(id);
      if (!ctrl || !cam || !node) return;

      // get world center of cluster
      node.updateWorldMatrix(true, true);
      const center = new THREE.Vector3().setFromMatrixPosition(node.matrixWorld);
      center.y += liftY;

      // keep current view direction, just change the distance
      const prevTarget = ctrl.target.clone();
      const offset     = cam.position.clone().sub(prevTarget); // vector from target -> camera
      const dir        = offset.normalize();
      const newPos     = center.clone().addScaledVector(dir, distance);

      ctrl.target.copy(center);
      cam.position.copy(newPos);
      ctrl.update();

      if (isolate) setIsolateId(id);
    },
    []
  );

  // Clear focus & isolation (keeps current camera offset)
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

  // DEV: keyboard helpers
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

  // DEV: URL param to auto-focus on load: /concepts?focus=abyss
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get('focus') === 'abyss') {
        setTimeout(() => focusCluster('cluster-abyss', { distance: 26 }), 50);
      }
    } catch {}
  }, [focusCluster]);

  // Parse URL once for generic visibility/isolation
  // ?visible=all | none | id1,id2  and/or  ?isolate=<id>
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
          next = new Set(
            vis.split(',').map(s => s.trim()).filter(Boolean)
          );
        }
      }
      if (iso) setIsolateId(iso); // reuse existing isolation logic
    } catch {}
    setVisibleIds(next);
  }, []);

  // Helper: should a given cluster render?
  const shouldShow = useCallback((id) => {
    if (isolateId && isolateId !== id) return false; // isolation wins
    return visibleIds.has(id);
  }, [isolateId, visibleIds]);

  // Hover changes from clusters: (id, isOver)
  const FOCUS_ON_HOVER = false; // disabled for now
  const handleHoverChange = (id, isOver) => {
    if (!hasInteracted) setHasInteracted(true);
    if (activeClusterId || !FOCUS_ON_HOVER) return;

    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      if (isOver) {
        if (hoverFocusId === id) return;
        setHoverFocusId(id);
        focusCluster(id, { isolate: false, distance: 28 });
      } else if (hoverFocusId === id) {
        setHoverFocusId(null);
        clearFocus();
      }
    }, 120);
  };

  const handleActivate = (id) => {
    setHasInteracted(true);
    // Only Root opens the overlay for now
    if (id !== 'cluster-root') return;
    setActiveClusterId(id);
    if (controlsRef.current) controlsRef.current.enabled = false; // freeze while overlay is open
  };

  const { isTablet } = useScreenSize();

  const rootCluster = useMemo(() => conceptAssets.find((c) => c.id === 'cluster-root'), []);
  const activeCluster = useMemo(
    () => conceptAssets.find((c) => c.id === activeClusterId),
    [activeClusterId]
  );
  const abyssClusterData = useMemo(
    () => conceptAssets.find((c) => c.id === 'cluster-abyss'),
    []
  );

  const preferHiRes = hasInteracted || !!activeCluster;

  // Gate rendering until both chunks are ready, so they appear together
  const reveal = chunksReady;

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <LoadingCover done={reveal} />

      <Canvas
        dpr={[1, Math.min(1.5, window.devicePixelRatio || 1)]}
        gl={{ antialias: !lite, powerPreference: lite ? 'low-power' : 'high-performance', alpha: false }}
        shadows={false}
        style={{ background: 'black' }}
      >
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

        {reveal && shouldShow('cluster-root') && rootCluster && (
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

        {reveal && shouldShow('cluster-abyss') && (
          <Suspense fallback={null}>
            <AbyssCluster
              controlsRef={controlsRef}
              id="cluster-abyss"
              images={abyssClusterData?.images ?? []}
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

      {/* Overlay */}
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
    </div>
  );
}
