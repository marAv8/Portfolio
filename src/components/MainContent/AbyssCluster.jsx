//AbyssCluster.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { a, useSpring } from '@react-spring/three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCursor } from '@react-three/drei';
import { useAutoTiltToCamera, useOrbitFocus } from "../../hooks/useCameraHelpers";
import Panel from './Panel';
import ImageOverlay from './ImageOverlay';
import PanelVideoFace from './PanelVideoFace';
import RadialFadeDisk from '../Effects/RadialFadeDisk';
import RimCrownArc from '../Effects/RimCrownArc';
import { useScreenSize } from '../../contexts/ScreenSizeContext';

export default function AbyssCluster({
  id = 'cluster-abyss',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  images = [],
  onActivate = () => {},
  onHoverChange = () => {},
  isActive = false,
  registerRef,
  baseScale = 1,
  debugAxes = false,
  setControlsEnabled = () => {},
  controlsRef,
}) {
  const { isMobile } = useScreenSize();
  const groupRef   = useRef(null);
  const visualsRef = useRef(null);
  const planeRef   = useRef(null);
  const baseRef    = useRef(null);
  const NO_RAYCAST = () => null;

  const AUTO_TILT = false;
  useAutoTiltToCamera(baseRef, { factor: 0.88, enabled: AUTO_TILT });

  const { startFocus } = useOrbitFocus(controlsRef, { defaultDistance: 28 });

  // add with other refs at top of component
const scrollStartRef = useRef(0);
const TAP_MOVE_PX = 6;     // movement guard
const TAP_SCROLL_PX = 8;   // page scroll guard


  // drag vars
  const ROT_Y = 0.005, ROT_X = 0.004, CLAMP_X = 0.6;
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const startRef = useRef([0, 0]);
  const lastRef  = useRef([0, 0]);

  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  useEffect(() => {
    if (registerRef) registerRef(id, groupRef.current);
    return () => registerRef && registerRef(id, null);
  }, [id, registerRef]);

  const BASE  = useMemo(() => [baseScale, baseScale, baseScale], [baseScale]);
  const HOVER = 1.06;
  const [{ s }, api] = useSpring(() => ({ s: BASE, config: { tension: 170, friction: 18 } }));
  useEffect(() => {
    const mul = hovered && !isActive && !draggingRef.current ? HOVER : 1;
    api.start({ s: BASE.map(v => v * mul) });
  }, [hovered, isActive, BASE, api]);

  // visuals never raycast
  useEffect(() => {
    const root = visualsRef.current;
    if (!root) return;
    const prev = new Map();
    root.traverse((obj) => {
      if (typeof obj.raycast === 'function') {
        prev.set(obj, obj.raycast);
        obj.raycast = () => null;
      }
    });
    return () => prev.forEach((raycast, obj) => { obj.raycast = raycast; });
  }, []);
// Always re-enable orbit controls on pointer end/unmount.
// (Hooks must be before the return)
useEffect(() => {
  // in case we arrive here after a previous drag, force enable on mount
  setControlsEnabled(true);

  // desktop/tablet: add global listeners so a lost pointerup still restores controls
  if (!isMobile) {
    const restore = () => setControlsEnabled(true);
    window.addEventListener('pointerup', restore);
    window.addEventListener('pointercancel', restore);
    return () => {
      window.removeEventListener('pointerup', restore);
      window.removeEventListener('pointercancel', restore);
      setControlsEnabled(true); // also enable on unmount
    };
  }

  // mobile: we never disable controls; just ensure enabled on mount/unmount
  return () => setControlsEnabled(true);
}, [isMobile, setControlsEnabled]);

  // billboard plane always faces camera & sits slightly forward
  const BASE_RADIUS = 12;
  const HIT_PAD     = 3.5;
  const PLANE_W     = 2 * (BASE_RADIUS + HIT_PAD);
  const PLANE_H     = PLANE_W * 0.72;
  const PLANE_OFFSET = 1.25;

  const tmpWorld = useMemo(() => new THREE.Vector3(), []);
  const tmpDir   = useMemo(() => new THREE.Vector3(), []);
  const tmpPos   = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    const g = groupRef.current, p = planeRef.current;
    if (!g || !p) return;
    g.updateWorldMatrix(true, false);
    tmpWorld.setFromMatrixPosition(g.matrixWorld);
    tmpDir.copy(camera.position).sub(tmpWorld).normalize();
    const planeWorldPos = tmpPos.copy(tmpWorld).addScaledVector(tmpDir, PLANE_OFFSET);
    const localPlanePos = g.worldToLocal(planeWorldPos.clone());
    p.position.copy(localPlanePos);
    const localCamPos = g.worldToLocal(camera.position.clone());
    p.lookAt(localCamPos);
  });

  // layout
  const DISK_RADIUS = 9.0;
  const PANEL_Y     = 0.55;

  const hero = useMemo(() => {
    const explicit = images.find((it) => it.isHero);
    if (explicit) return explicit;
    return { url: '/media/concepts/LeftScreen/72Video.mp4', type: 'video', isHero: true };
  }, [images]);

  const heroScale    = hero.scale    ?? [6.0, 7.5, 1];
  const heroPosition = hero.position ?? [0, 2.2, 0];

  const rest = useMemo(() => images.filter((it) => it !== hero), [images, hero]);

  const rand01 = (seed) => {
    const s = Math.sin(seed * 127.1) * 43758.5453123;
    return s - Math.floor(s);
  };

  const laidOut = useMemo(() => {
    const rows = 4;
    const cols = 12;
    const xSpan = [-8.0, 8.0];
    const zSpan = [-3.5, 3.5];
    const jitterX = 0.35, jitterZ = 0.25;

    const cells = [];
    for (let r = 0; r < rows; r++) {
      const tZ = rows === 1 ? 0.5 : r / (rows - 1);
      const z = THREE.MathUtils.lerp(zSpan[0], zSpan[1], tZ);
      for (let c = 0; c < cols; c++) {
        const tX = cols === 1 ? 0.5 : c / (cols - 1);
        const x = THREE.MathUtils.lerp(xSpan[0], xSpan[1], tX);
        if (x * x + z * z <= (DISK_RADIUS - 0.6) * (DISK_RADIUS - 0.6)) {
          cells.push([x, z]);
        }
      }
    }

    const out = [];
    const count = Math.min(rest.length, cells.length);
    for (let i = 0; i < count; i++) {
      const item = rest[i];
      const [cx, cz] = cells[i];

      const jx = (rand01(i + 1) - 0.5) * 2 * jitterX;
      const jz = (rand01(i + 777) - 0.5) * 2 * jitterZ;

      const sRnd = 0.88 + rand01(i + 333) * 0.28;
      const baseS = item.scale ? item.scale[0] : 1.0;
      const scale = [baseS * sRnd, baseS * sRnd, 1];

      out.push({
        ...item,
        position: item.position ?? [cx + jx, PANEL_Y, cz + jz],
        scale,
      });
    }

    const leftover = rest.slice(count);
    if (leftover.length) {
      const ringR = DISK_RADIUS - 1.2;
      const startAngle = Math.PI * 0.25, endAngle = Math.PI * 0.75;
      leftover.forEach((item, k) => {
        const t = leftover.length === 1 ? 0.5 : k / (leftover.length - 1);
        const a = THREE.MathUtils.lerp(startAngle, endAngle, t);
        const x = Math.cos(a) * ringR;
        const z = Math.sin(a) * ringR;
        const sRnd = 0.86 + rand01(900 + k) * 0.22;
        const baseS = item.scale ? item.scale[0] : 0.95;
        out.push({
          ...item,
          position: item.position ?? [x, PANEL_Y, z],
          scale: [baseS * sRnd, baseS * sRnd, 1],
        });
      });
    }

    return out;
  }, [rest]);

  const renderPanelContent = (item) => {
    const url = item?.url ?? '';
    const isVideo = item.type === 'video' || url.toLowerCase().endsWith('.mp4');
    const [w, h] = Array.isArray(item.size) ? item.size : [1, 1];
    if (isVideo) return <PanelVideoFace url={url} width={w} height={h} fit="contain" />;
    return <ImageOverlay url={url} />;
  };

  return (
    <a.group ref={groupRef} position={position} rotation={rotation} scale={s}>
      {debugAxes && <axesHelper args={[1.25]} />}

      {/* Interactive billboard plane */}
{!isActive && (
  <mesh
    ref={planeRef}
    scale={[PLANE_W, PLANE_H, 1]}
    frustumCulled={false}
    renderOrder={9999}
    onPointerOver={(e) => {
      e.stopPropagation();
      if (!hovered) { setHovered(true); onHoverChange?.(id, true); }
      document.body.style.cursor = 'pointer';
      try { console.log('[DIAG][AbyssPlane]', id, 'over'); } catch {}
    }}
    onPointerOut={(e) => {
      e.stopPropagation();
      if (hovered) { setHovered(false); onHoverChange?.(id, false); }
      document.body.style.cursor = 'default';
    }}
    onPointerDown={(e) => {
      e.stopPropagation();
      movedRef.current = false;
      startRef.current = [e.clientX, e.clientY];
      lastRef.current  = [e.clientX, e.clientY];

      // record page scroll to detect real scroll vs tap (mobile)
      const se = document.scrollingElement || document.documentElement;
      scrollStartRef.current = (se?.scrollTop ?? window.scrollY ?? 0);

      if (!isMobile) {
        draggingRef.current = true;
        setControlsEnabled(false);
      }
      document.body.style.cursor = 'grabbing';
    }}
    onPointerMove={(e) => {
      e.stopPropagation();
      if (isMobile || !draggingRef.current || !groupRef.current) return;

      const [lx, ly] = lastRef.current;
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      if (Math.abs(dx) + Math.abs(dy) > 2) movedRef.current = true;

      try { console.log('[DIAG][AbyssPlane]', id, 'move', { dx, dy, moved: movedRef.current }); } catch {}

      groupRef.current.rotation.y += dx * ROT_Y;
      const nextX = groupRef.current.rotation.x + dy * ROT_X;
      groupRef.current.rotation.x = Math.max(-CLAMP_X, Math.min(CLAMP_X, nextX));

      lastRef.current = [e.clientX, e.clientY];
    }}
    onPointerUp={(e) => {
      e.stopPropagation();

      if (!isMobile) {
        draggingRef.current = false;
        setControlsEnabled(true);

        const [sx, sy] = startRef.current;
        const dx = Math.abs(e.clientX - sx);
        const dy = Math.abs(e.clientY - sy);
        try { console.log('[DIAG][AbyssPlane]', id, 'up', { dx, dy, moved: movedRef.current }); } catch {}

        // desktop/tablet: activate only on true click
        if (!movedRef.current && dx <= 4 && dy <= 4) onActivate(id);
      }

      document.body.style.cursor = 'pointer';
    }}
    onPointerLeave={(e) => {
      e.stopPropagation();
      if (!isMobile && draggingRef.current) {
        draggingRef.current = false;
        setControlsEnabled(true);
        document.body.style.cursor = 'default';
      }
    }}
    onClick={(e) => {
      // mobile-only: activate on tap (no drag, no page scroll)
      if (!isMobile) return;
      e.stopPropagation();
      try { console.log('[DIAG][AbyssPlane]', id, 'click-mobile'); } catch {}

      const [sx, sy] = startRef.current;
      const dx = Math.abs((e.clientX ?? 0) - sx);
      const dy = Math.abs((e.clientY ?? 0) - sy);
      if (dx > TAP_MOVE_PX || dy > TAP_MOVE_PX) return;

      const se = document.scrollingElement || document.documentElement;
      const now = (se?.scrollTop ?? window.scrollY ?? 0);
      const dScroll = Math.abs(now - scrollStartRef.current);
      if (dScroll > TAP_SCROLL_PX) return;

      onActivate(id);
    }}
  >
    <planeGeometry args={[1, 1]} />
    <meshBasicMaterial
      transparent
      opacity={0}
      depthWrite={false}
      depthTest={false}
      side={THREE.DoubleSide}
    />
  </mesh>
)}

      {/* VISUALS */}
      <group ref={visualsRef} raycast={() => null}>
        <group ref={baseRef}>
          <RadialFadeDisk
            raycast={NO_RAYCAST}
            color={[1, 0, 0]}
            radius={12}
            height={0.22}
            power={3.4}
            rotation={[0, 0, 0]}
            position={[0, 0, 0]}
            opacity={1}
          />
          <RimCrownArc
            baseRadius={12}
            inset={0.9}
            samples={13}
            thetaStartDeg={135}
            thetaEndDeg={45}
            yEdge={0.10}
            amp={3.6}
            curve={1.45}
            radEdge={1.25}
            radCenter={0.80}
            heightEdge={0.34}
            heightCenter={0.22}
            opacityEdge={0.85}
            opacityCenter={0.55}
            pushBack={-0.15}
            edgeSelfInsetMul={0.65}
            edgeInset={0.22}
            edgeLift={0.08}
            glowStrength={1.25}
            glowRadiusMul={1.45}
            glowOpacityEdge={0.65}
          />
        </group>

        {/* HERO */}
        <group position={heroPosition} scale={heroScale}>
          <Panel thickness={0.05} />
          <PanelVideoFace url={hero.url} width={1} height={1} fit="contain" />
        </group>

        {/* GRID / RING ITEMS */}
        {laidOut.map((item, i) => {
          const [w, h] = Array.isArray(item.size) ? item.size : [1, 1];
          const panelScale = item.size ? [w, h, 1] : (item.scale ?? [1, 1, 1]);
          return (
            <group key={i} position={item.position} scale={panelScale}>
              <Panel thickness={0.05} />
              {renderPanelContent(item)}
            </group>
          );
        })}
      </group>
    </a.group>
  );
}
