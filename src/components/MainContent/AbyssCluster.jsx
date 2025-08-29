// src/components/MainContent/AbyssCluster.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { a, useSpring } from '@react-spring/three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCursor } from '@react-three/drei';
import { useAutoTiltToCamera, useOrbitFocus } from "../../hooks/useCameraHelpers"; // keep import
import Panel from './Panel';
import ImageOverlay from './ImageOverlay';
import PanelVideoFace from './PanelVideoFace';
import RadialFadeDisk from '../Effects/RadialFadeDisk';
import RimCrownArc from '../Effects/RimCrownArc';



function YawBillboard({ children, ...props }) {
  const ref = React.useRef();
  const tmp = React.useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    if (!ref.current) return;
    ref.current.getWorldPosition(tmp);
    const dx = camera.position.x - tmp.x;
    const dz = camera.position.z - tmp.z;
    const yaw = Math.atan2(dx, dz);
    ref.current.rotation.set(0, yaw, 0);
  });
  return <group ref={ref} {...props}>{children}</group>;
}

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
  const groupRef   = useRef(null);
  const visualsRef = useRef(null);
  const planeRef   = useRef(null);
  const baseRef    = useRef(null);
  const NO_RAYCAST = () => null;

  // 🔕 turn OFF auto-tilt (root cause of the “fake” look)
  const AUTO_TILT = false;
  useAutoTiltToCamera(baseRef, { factor: 0.88, enabled: AUTO_TILT });

  // ✅ keep focus helper (this was good)
  const { startFocus /*, clearFocus */ } = useOrbitFocus(controlsRef, { defaultDistance: 28 });

  // --- drag + hover (unchanged) ---
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

// billboard hit plane (bigger & still just in front of the cluster)
const BASE_RADIUS = 12;                  // matches your big base disk
const HIT_PAD     = 3.5;                 // extra margin beyond visuals
const PLANE_W     = 2 * (BASE_RADIUS + HIT_PAD);  // ≈31
const PLANE_H     = PLANE_W * 0.72;               // keep aspect friendly
const PLANE_OFFSET = 1.25;               // slight push toward camera along view dir

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


  // ---------- layout ----------
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
    if (isVideo) {
      // ⬇️ no more stretching
      return <PanelVideoFace url={url} width={w} height={h} fit="contain" />;
    }
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
          onPointerOver={(e) => { e.stopPropagation(); if (!hovered) { setHovered(true); onHoverChange?.(id, true); } document.body.style.cursor = 'pointer'; }}
          onPointerOut={(e) => { e.stopPropagation(); if (hovered) { setHovered(false); onHoverChange?.(id, false); } document.body.style.cursor = 'default'; }}
          onPointerDown={(e) => {
            e.stopPropagation();
            draggingRef.current = true;
            movedRef.current = false;
            startRef.current = [e.clientX, e.clientY];
            lastRef.current  = [e.clientX, e.clientY];
            setControlsEnabled(false);
            document.body.style.cursor = 'grabbing';
          }}
          onPointerMove={(e) => {
            e.stopPropagation();
            if (!draggingRef.current || !groupRef.current) return;
            const [lx, ly] = lastRef.current;
            const dx = e.clientX - lx;
            const dy = e.clientY - ly;
            if (Math.abs(dx) + Math.abs(dy) > 2) movedRef.current = true;
            groupRef.current.rotation.y += dx * ROT_Y;
            const nextX = groupRef.current.rotation.x + dy * ROT_X;
            groupRef.current.rotation.x = Math.max(-CLAMP_X, Math.min(CLAMP_X, nextX));
            lastRef.current = [e.clientX, e.clientY];
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            draggingRef.current = false;
            setControlsEnabled(true);
            document.body.style.cursor = 'pointer';
            const [sx, sy] = startRef.current;
            const dx = Math.abs(e.clientX - sx);
            const dy = Math.abs(e.clientY - sy);
            if (!movedRef.current && dx <= 4 && dy <= 4) {
              let target = new THREE.Vector3();
              if (groupRef.current) {
                groupRef.current.updateWorldMatrix(true, false);
                target.setFromMatrixPosition(groupRef.current.matrixWorld);
                target.y += 0.5;
              } else {
                target.set(position?.[0] ?? 0, (position?.[1] ?? 0) + 0.5, position?.[2] ?? 0);
              }
              startFocus({ target, distance: 28, pitchDeg: 56 });
              onActivate(id);
            }
          }}
          onPointerLeave={(e) => {
            e.stopPropagation();
            if (draggingRef.current) {
              draggingRef.current = false;
              setControlsEnabled(true);
              document.body.style.cursor = 'default';
            }
          }}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} side={2} />
        </mesh>
      )}

      {/* VISUALS (no raycast) */}
      <group ref={visualsRef} raycast={NO_RAYCAST}>
        {/* Base disk (static again) */}
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

{/* ∩ crown of small disks running along the rim, via the back (behind the hero) */}
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
  // NEW (optional fine-tune)
  edgeSelfInsetMul={0.65}
  edgeInset={0.22}
  edgeLift={0.08}
  glowStrength={1.25}          // overall gain
  glowRadiusMul={1.45}         // a touch larger halo
  glowOpacityEdge={0.65}
/>
        </group>

        {/* HERO */}
        <YawBillboard position={heroPosition} scale={heroScale}>
          <Panel thickness={0.05} />
          <PanelVideoFace url={hero.url} width={1} height={1} fit="contain" />
        </YawBillboard>

        {laidOut.map((item, i) => {
          const [w, h] = Array.isArray(item.size) ? item.size : [1, 1];
          const panelScale = item.size ? [w, h, 1] : (item.scale ?? [1, 1, 1]);
          return (
            <YawBillboard key={i} position={item.position}>
              <group scale={panelScale}>
                <Panel thickness={0.05} />
                {renderPanelContent(item)}
              </group>
            </YawBillboard>
          );
        })}
      </group>
    </a.group>
  );
}
