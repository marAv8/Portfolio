// src/components/MainContent/SatelliteRingCluster.jsx
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { a, useSpring } from '@react-spring/three';
import { useFrame } from '@react-three/fiber';
import { useCursor } from '@react-three/drei';
import * as THREE from 'three';
import Panel from './Panel';
import ImageOverlay from './ImageOverlay';
import HitBillboard from '../common/HitBillboard';
import { useScreenSize } from '../../contexts/ScreenSizeContext';

const TAU = Math.PI * 2;

export default function SatelliteRingCluster({
  id = 'cluster-satellite',
  assets = [],
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  baseScale = 1,
  scaleMul = 1,
  panelSize = [0.46, 0.62],
  panelThickness = 0.08,

  fitByHeight = true,
  gap = 0.01,
  radius: radiusProp,

  spinSpeed = 0.35,

  onActivate = () => {},
  onHoverChange = () => {},
  startAt = 'top',

  isActive = false,
  setControlsEnabled = () => {},
  hoverScaleMul = 1.08,

  particlesPerGap = 30,
  particleSize = 0.15,
  particleColor = '#F3F7FF',
  particleOpacity = 0.85,
  tangentialSpeed = 0.45,
  radialSpeed = 0.35,
  verticalSpeed = 0.25,
}) {
  const { isMobile } = useScreenSize();
  const allowDrag = !isMobile;

  const ringRef    = useRef(null);
  const itemsRef   = useRef([]);
  const visualsRef = useRef(null);
  const phaseRef   = useRef(0);   // current spin angle
  const tiltRef    = useRef(0);   // current tilt (x)
  const phaseTargetRef = useRef(0); // target spin while dragging
  const tiltTargetRef  = useRef(0); // target tilt while dragging

  const planeRef   = useRef(null);

  const pointerIdRef = useRef(null);
  const draggingRef  = useRef(false);
  const movedRef     = useRef(false);
  const startRef     = useRef([0, 0]);
  const lastRef      = useRef([0, 0]);

  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  // tap/scroll guards (mobile)
  const scrollStartRef = useRef(0);
  const TAP_MOVE_PX = 6;
  const TAP_SCROLL_PX = 8;

  const [{ s }, api] = useSpring(() => ({
    s: baseScale * scaleMul,
    config: { tension: 170, friction: 18 },
  }));

  useEffect(() => {
    if (isMobile) return; // desktop/tablet only
    const restore = () => {
      if (draggingRef.current) {
        draggingRef.current = false;
        setControlsEnabled?.(true);
        document.body.style.cursor = 'default';
      }
    };
    window.addEventListener('pointerup', restore);
    window.addEventListener('pointercancel', restore);
    return () => {
      window.removeEventListener('pointerup', restore);
      window.removeEventListener('pointercancel', restore);
    };
  }, [isMobile, setControlsEnabled]);

  useEffect(() => {
    const target = (hovered && !isActive)
      ? baseScale * scaleMul * hoverScaleMul
      : baseScale * scaleMul;
    api.start({ s: target });
  }, [hovered, isActive, baseScale, scaleMul, hoverScaleMul, api]);

  const onOver = (e) => {
    e.stopPropagation();
    if (draggingRef.current) return;
    if (!hovered) { setHovered(true); onHoverChange?.(true); }
  };
  const onOut = (e) => {
    e.stopPropagation();
    if (draggingRef.current) return;
    if (hovered) { setHovered(false); onHoverChange?.(false); }
  };

  // layout
  const [pw, ph] = panelSize;
  const n = Math.max(assets.length, 1);

  const perTileArc     = ph * (1 + gap);
  const computedRadius = (perTileArc * n) / (2 * Math.PI);
  const R = radiusProp ?? (fitByHeight ? computedRadius : 1.1);

  const startOffset =
    startAt === 'top'    ? Math.PI / 2 :
    startAt === 'right'  ? 0 :
    startAt === 'bottom' ? (3 * Math.PI) / 2 :
    /* left */             Math.PI;

  const centerWorld = new THREE.Vector3();
  const worldUp     = new THREE.Vector3(0, 1, 0);
  const tmpP        = new THREE.Vector3();
  const outward     = new THREE.Vector3();
  const right       = new THREE.Vector3();
  const upV         = new THREE.Vector3();
  const rotM        = new THREE.Matrix4();

  const tmpWorld = useMemo(() => new THREE.Vector3(), []);
  const tmpDir   = useMemo(() => new THREE.Vector3(), []);
  const tmpPos   = useMemo(() => new THREE.Vector3(), []);

  // Smooth response factors (frame-rate independent)
  const DRAG_RESPONSE = 12; // higher = snappier
  const TILT_RESPONSE = 12;

  // Drag -> set targets; Frame -> damp current toward targets
  useFrame((_, delta) => {
    if (allowDrag && draggingRef.current) {
      // while dragging: no idle spin; follow targets smoothly
      phaseRef.current = THREE.MathUtils.damp(
        phaseRef.current, phaseTargetRef.current, DRAG_RESPONSE, delta
      );
      tiltRef.current = THREE.MathUtils.damp(
        tiltRef.current, tiltTargetRef.current, TILT_RESPONSE, delta
      );
    } else {
      // not dragging: idle spin + relax tilt back to 0
      phaseRef.current += spinSpeed * delta;
      tiltTargetRef.current = 0;
      tiltRef.current = THREE.MathUtils.damp(
        tiltRef.current, 0, 10, delta
      );
    }

    if (ringRef.current) ringRef.current.rotation.x = tiltRef.current;

    ringRef.current?.getWorldPosition(centerWorld);
    for (let i = 0; i < n; i++) {
      const g = itemsRef.current[i];
      if (!g) continue;

      const theta = startOffset + phaseRef.current + (i / n) * TAU;
      const x = Math.cos(theta) * R;
      const z = Math.sin(theta) * R;
      g.position.set(x, 0, z);

      g.getWorldPosition(tmpP);
      outward.subVectors(tmpP, centerWorld).normalize();
      right.crossVectors(worldUp, outward).normalize();
      upV.crossVectors(outward, right).normalize();
      rotM.makeBasis(right, upV, outward);
      g.quaternion.setFromRotationMatrix(rotM);
    }
  });

  // Billboard look-at plane
  useFrame(({ camera }) => {
    const g = ringRef.current, p = planeRef.current;
    if (!g || !p) return;
    g.updateWorldMatrix(true, false);
    tmpWorld.setFromMatrixPosition(g.matrixWorld);
    tmpDir.copy(camera.position).sub(tmpWorld).normalize();
    const planeWorldPos = tmpPos.copy(tmpWorld).addScaledVector(tmpDir, 1.2);
    const localPlanePos = g.worldToLocal(planeWorldPos.clone());
    p.position.copy(localPlanePos);
    const localCamPos = g.worldToLocal(camera.position.clone());
    p.lookAt(localCamPos);
  });

  // Drag handlers (plane + billboard share these)
  const onDown = (e) => {
    e.stopPropagation();
    movedRef.current = false;
    startRef.current = [e.clientX, e.clientY];
    lastRef.current  = [e.clientX, e.clientY];

    // lock events to this element
    pointerIdRef.current = e.pointerId;
    e.target.setPointerCapture?.(e.pointerId);

    // init targets from current state
    phaseTargetRef.current = phaseRef.current;
    tiltTargetRef.current  = tiltRef.current;

    const se = document.scrollingElement || document.documentElement;
    scrollStartRef.current = (se?.scrollTop ?? window.scrollY ?? 0);

    if (!isMobile) {
      draggingRef.current = true;
      setControlsEnabled?.(false);
    }
    document.body.style.cursor = 'grabbing';
  };

  const onMoveDrag = (e) => {
    e.stopPropagation();
    if (!allowDrag || !draggingRef.current) return;

    const [lx, ly] = lastRef.current;
    const dx = e.clientX - lx;
    const dy = e.clientY - ly;
    if (Math.abs(dx) + Math.abs(dy) > 2) movedRef.current = true;

    // Update targets only; frame loop eases the motion
    const DRAG_PHASE = 0.010; // horizontal sensitivity
    const TILT_SCALE = 0.004; // vertical sensitivity
    const CLAMP_X    = 0.6;

    phaseTargetRef.current += dx * DRAG_PHASE;
    tiltTargetRef.current = Math.max(
      -CLAMP_X, Math.min(CLAMP_X, tiltTargetRef.current + dy * TILT_SCALE)
    );

    lastRef.current = [e.clientX, e.clientY];
  };

  const onUp = (e) => {
    e.stopPropagation();

    if (pointerIdRef.current != null) {
      try { e.target.releasePointerCapture?.(pointerIdRef.current); } catch {}
      pointerIdRef.current = null;
    }

    if (!isMobile) {
      draggingRef.current = false;
      setControlsEnabled?.(true);
    }
    document.body.style.cursor = 'pointer';

    const [sx, sy] = startRef.current;
    const dx = Math.abs(e.clientX - sx);
    const dy = Math.abs(e.clientY - sy);

    if (!isMobile && !movedRef.current && dx <= TAP_MOVE_PX && dy <= TAP_MOVE_PX) {
      onActivate(id);
    }
  };

  // don’t cancel a drag on leave
  const onLeave = (e) => {
    e.stopPropagation();
    if (!draggingRef.current && !isMobile) document.body.style.cursor = 'default';
  };

  const onClickMobile = (e) => {
    e.stopPropagation();
    if (!isMobile) return;
    const [sx, sy] = startRef.current;
    const dx = Math.abs((e.clientX ?? 0) - sx);
    const dy = Math.abs((e.clientY ?? 0) - sy);
    if (dx > TAP_MOVE_PX || dy > TAP_MOVE_PX) return;
    const se = document.scrollingElement || document.documentElement;
    const now = (se?.scrollTop ?? window.scrollY ?? 0);
    const dScroll = Math.abs(now - scrollStartRef.current);
    if (dScroll > TAP_SCROLL_PX) return;
    onActivate(id);
  };
const particleSprite = useMemo(() => {
  if (typeof document === 'undefined') return null;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  // radial alpha gradient (fully transparent at edge)
  const g = ctx.createRadialGradient(size/2, size/2, size*0.05, size/2, size/2, size*0.5);
  g.addColorStop(0.00, 'rgba(255,255,255,1)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.35)');
  g.addColorStop(1.00, 'rgba(255,255,255,0)');
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}, []);

  // particles setup
  const tileArc = TAU / n;
  const halfPanelWidthArc = Math.min(tileArc * 0.45, (ph * 0.5) / R);
  const gapArc = Math.max(0, tileArc - 2 * halfPanelWidthArc);
  const halfCorridorArc = (gapArc * 0.5) * 0.8;

  const halfHeight    = (ph * 0.5)          * 0.9;
  const halfThickness = (panelThickness * 0.5) * 0.9;

  const totalParticles = n * particlesPerGap;
  const geomRef   = useRef(null);
  const posBufRef = useRef(new Float32Array(totalParticles * 3));

  const gapIndex = useRef(new Uint16Array(totalParticles));
  const aLocal   = useRef(new Float32Array(totalParticles));
  const yLocal   = useRef(new Float32Array(totalParticles));
  const rLocal   = useRef(new Float32Array(totalParticles));
  const va       = useRef(new Float32Array(totalParticles));
  const vy       = useRef(new Float32Array(totalParticles));
  const vr       = useRef(new Float32Array(totalParticles));

  useEffect(() => {
    let seed = 20251;
    const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

    posBufRef.current = new Float32Array(totalParticles * 3);
    geomRef.current?.setAttribute('position', new THREE.BufferAttribute(posBufRef.current, 3));

    gapIndex.current = new Uint16Array(totalParticles);
    aLocal.current   = new Float32Array(totalParticles);
    yLocal.current   = new Float32Array(totalParticles);
    rLocal.current   = new Float32Array(totalParticles);
    va.current       = new Float32Array(totalParticles);
    vy.current       = new Float32Array(totalParticles);
    vr.current       = new Float32Array(totalParticles);

    for (let gi = 0; gi < n; gi++) {
      for (let j = 0; j < particlesPerGap; j++) {
        const idx = gi * particlesPerGap + j;
        gapIndex.current[idx] = gi;

        const am = halfCorridorArc * 0.9;
        aLocal.current[idx] = (rand() * 2 - 1) * am;
        yLocal.current[idx] = (rand() * 2 - 1) * (halfHeight * 0.9);
        rLocal.current[idx] = (rand() * 2 - 1) * (halfThickness * 0.9);

        va.current[idx] = (rand() * 2 - 1) * tangentialSpeed * 0.6;
        vy.current[idx] = (rand() * 2 - 1) * verticalSpeed   * 0.6;
        vr.current[idx] = (rand() * 2 - 1) * radialSpeed     * 0.6;
      }
    }
  }, [
    totalParticles, n, particlesPerGap,
    halfCorridorArc, halfHeight, halfThickness,
    tangentialSpeed, verticalSpeed, radialSpeed
  ]);

  useFrame((_, delta) => {
    const dampA = 0.98;
    const dampL = 0.98;

    for (let i = 0; i < totalParticles; i++) {
      let a = aLocal.current[i] + va.current[i] * delta;
      let y = yLocal.current[i] + vy.current[i] * delta;
      let r = rLocal.current[i] + vr.current[i] * delta;

      if (a < -halfCorridorArc) { a = -halfCorridorArc; va.current[i] = -va.current[i] * dampA; }
      if (a >  halfCorridorArc) { a =  halfCorridorArc; va.current[i] = -va.current[i] * dampA; }
      if (y < -halfHeight)      { y = -halfHeight;      vy.current[i] = -vy.current[i] * dampL; }
      if (y >  halfHeight)      { y =  halfHeight;      vy.current[i] = -vy.current[i] * dampL; }
      if (r < -halfThickness)   { r = -halfThickness;   vr.current[i] = -vr.current[i] * dampL; }
      if (r >  halfThickness)   { r =  halfThickness;   vr.current[i] = -vr.current[i] * dampL; }

      aLocal.current[i] = a; yLocal.current[i] = y; rLocal.current[i] = r;

      const gi = gapIndex.current[i];
      const gapCenter = startOffset + phaseRef.current + ((gi + 0.5) / n) * TAU;
      const ang = gapCenter + a;

      const N = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang));
      const T = new THREE.Vector3(-Math.sin(ang), 0, Math.cos(ang));
      const B = new THREE.Vector3(0, 1, 0);

      const Cx = Math.cos(gapCenter) * R;
      const Cz = Math.sin(gapCenter) * R;

      const base = i * 3;
      posBufRef.current[base + 0] = Cx + (R * a) * T.x + y * B.x + r * N.x;
      posBufRef.current[base + 1] = 0  + (R * a) * T.y + y * B.y + r * N.y;
      posBufRef.current[base + 2] = Cz + (R * a) * T.z + y * B.z + r * N.z;
    }

    if (geomRef.current) {
      const pAttr = geomRef.current.getAttribute('position');
      if (pAttr) pAttr.needsUpdate = true;
    }
  });

  const panelColorObj    = useMemo(() => new THREE.Color('#0F141A'), []);
  const panelEmissiveObj = useMemo(() => new THREE.Color('#A8B7C7'), []);

  const HIT_RADIUS = R + Math.max(pw, ph) * 1.25;
  const HIT_HEIGHT = ph * 2.2;

  const BB_WIDTH   = 2 * (R + pw * 1.15);
  const BB_HEIGHT  = ph * 3.0;
  const BB_OFFSET  = 2.4;
  const BB_LIFT_Y  = ph * 0.8;

  return (
    <a.group ref={ringRef} position={position} rotation={rotation} scale={s.to(v => [v, v, v])}>
      {!isActive && (
        <>
          {/* Front billboard plane (primary drag surface) */}
          <mesh
            ref={planeRef}
            scale={[BB_WIDTH, BB_HEIGHT, 1]}
            frustumCulled={false}
            renderOrder={9999}
            onPointerOver={onOver}
            onPointerOut={onOut}
            onPointerDown={onDown}
            onPointerMove={onMoveDrag}
            onPointerUp={onUp}
            onPointerLeave={onLeave}
            onClick={onClickMobile}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} side={THREE.DoubleSide} />
          </mesh>

          {/* Wide cylinder for comfy hover */}
          <mesh onPointerOver={onOver} onPointerOut={onOut}>
            <cylinderGeometry args={[HIT_RADIUS, HIT_RADIUS, HIT_HEIGHT, 48, 1, false]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>

          {/* Backup billboard — same handlers (pointer capture avoids flips) */}
          <HitBillboard
            width={BB_WIDTH}
            height={BB_HEIGHT}
            offset={BB_OFFSET}
            y={BB_LIFT_Y}
            onPointerOver={onOver}
            onPointerOut={onOut}
            onPointerDown={onDown}
            onPointerMove={onMoveDrag}
            onPointerUp={onUp}
            onPointerLeave={onLeave}
          />
        </>
      )}

      <group ref={visualsRef} raycast={() => null}>
        <points>
          <bufferGeometry ref={geomRef} />
          <pointsMaterial
           map={particleSprite}
            size={particleSize}
            sizeAttenuation
            color={particleColor}
            transparent
            opacity={particleOpacity}
            depthWrite={false}
            depthTest
            blending={THREE.AdditiveBlending}
            alphaTest={0.02}
          />
        </points>
{/* --- DENSITY BOOST LAYERS: concept scene only (desktop) --- */}
{!isActive && !isMobile && geomRef.current && (
  <>
    {/* inner boost */}
    <points frustumCulled={false}>
      <primitive object={geomRef.current} attach="geometry" />
      <pointsMaterial
        map={particleSprite}
        size={particleSize * 8}
        sizeAttenuation={false}        // constant pixel size
        color={particleColor}
        transparent
        // opacity={particleOpacity * 0.05}
        depthWrite={false}
        depthTest                        // true
        blending={THREE.AdditiveBlending}
        alphaTest={0.06}
      />
    </points>

    {/* mid boost */}
    <points frustumCulled={false}>
      <primitive object={geomRef.current} attach="geometry" />
      <pointsMaterial
        map={particleSprite}
        size={particleSize * 8}
        sizeAttenuation={false}
        color={particleColor}
        transparent
        // opacity={particleOpacity * 0.05}
        depthWrite={false}
        depthTest={false}               // let a soft layer sit “on top”
        blending={THREE.AdditiveBlending}
        alphaTest={0.06}
      />
    </points>

    {/* outer feather */}
    <points frustumCulled={false}>
      <primitive object={geomRef.current} attach="geometry" />
      <pointsMaterial
        map={particleSprite}
        size={particleSize * 8}
        sizeAttenuation={false}
        color={particleColor}
        transparent
        // opacity={particleOpacity * 0.05}
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        alphaTest={0.06}
      />
    </points>
  </>
)}

        {assets.map((a, i) => (
          <group key={i} ref={el => (itemsRef.current[i] = el)}>
            <Panel
              scale={[pw, ph, 1]}
              thickness={panelThickness}
              color={panelColorObj}
              emissive={panelEmissiveObj}
              emissiveIntensity={0.8}
              roughness={0.35}
              metalness={0.1}
            />
            <ImageOverlay url={a.url} width={pw * 0.98} height={ph * 0.98} z={0.06} />
          </group>
        ))}
      </group>
    </a.group>
  );
}
