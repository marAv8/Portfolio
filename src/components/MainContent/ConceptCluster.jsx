// src/components/MainContent/ConceptCluster.jsx
import React, { useRef, useState, useEffect } from 'react';
import { useSpring, a } from '@react-spring/three';
import * as THREE from 'three';
import Panel from './Panel';
import ImageOverlay from './ImageOverlay';
import RadialFadeDisk from '../Effects/RadialFadeDisk';
import RotatingStones from './RotatingStones';
import FloatingCeilingGroup from '../Effects/FloatingCeilingGroup';
import { useCursor } from '@react-three/drei';
import { useScreenSize } from '../../contexts/ScreenSizeContext';
import useAutoHitBounds from '../../hooks/useAutoHitBounds';
import ShimmerParticles from '../Effects/ShimmerParticles';

export default function ConceptCluster({
  id,
  position = [0, -3, 0],
  rotation: rotationProp = [0, 0, 0],
  scale = [1, 1, 1],
  images = [],
  isActive = false,
  onActivate = () => {},
  onReady,
  onShowCarousel = () => {},
  onHoverChange = () => {},
  registerRef,
  setControlsEnabled = () => {},
}) {
  const groupRef = useRef(null);
  const visualsRef = useRef(null);
  const NO_RAYCAST = () => null;

  // ------- drag / orbit -------
  const ROT_Y = 0.005, ROT_X = 0.004, CLAMP_X = 0.6;
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const startRef = useRef([0, 0]);
  const lastRef = useRef([0, 0]);

  // ------- ui state -------
  const [hovered, setHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasIntroPulsed, setHasIntroPulsed] = useState(false);
  const introAnimatingRef = useRef(false);
  const { isMobile, isTablet } = useScreenSize();
  useCursor(hovered);

  // expose cluster ref to parent
  useEffect(() => {
    if (typeof registerRef === 'function') registerRef(id, groupRef.current);
    return () => { if (typeof registerRef === 'function') registerRef(id, null); };
  }, [id, registerRef]);

  // signal ready once mounted (after suspense resolves)
  const readyOnceRef = useRef(false);
  useEffect(() => {
    if (!readyOnceRef.current) {
      readyOnceRef.current = true;
      if (typeof onReady === 'function') onReady(id);
    }
  }, [onReady, id]);

  // spring scale
  const [{ s }, api] = useSpring(() => ({ s: scale, config: { tension: 170, friction: 18 } }));
  useEffect(() => { api.start({ s: scale }); }, [scale, api]);

  // staged mount (avoid measuring during first frame)
  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 150);
    return () => clearTimeout(t);
  }, []);

  // intro pulse (tablet only, once)
  const introDelayMs = 500;
  const hoverScaleMul = 1.08;
  useEffect(() => {
    if (!isVisible || hasIntroPulsed || !isTablet || isActive) return;
    introAnimatingRef.current = true;
    const tm = setTimeout(() => {
      const raf = requestAnimationFrame(() => {
        api.start({
          to: async (next) => {
            await next({ s: scale.map((v) => v * hoverScaleMul) });
            await next({ s: scale });
          },
          onRest: () => {
            introAnimatingRef.current = false;
            setHasIntroPulsed(true);
          },
        });
      });
      return () => cancelAnimationFrame(raf);
    }, introDelayMs);
    return () => clearTimeout(tm);
  }, [isVisible, hasIntroPulsed, isTablet, introDelayMs, api, scale, isActive]);

  // hover scaling (after intro)
  useEffect(() => {
    if (introAnimatingRef.current) return;
    const target = hovered && !isActive ? scale.map((v) => v * hoverScaleMul) : scale;
    api.start({ s: target });
  }, [hovered, isActive, scale, api]);

  // mobile: show carousel when active
  useEffect(() => {
    if (isMobile && isActive) onShowCarousel(id);
  }, [isMobile, isActive, id, onShowCarousel]);

  // measure only the visuals (not the overhead halo/shimmer)
  const hb = useAutoHitBounds(visualsRef, {
    bleed: 1.5,
    minRadius: 1.0,
    deps: [images?.length, ...(Array.isArray(scale) ? scale : [])],
  });
const hitCenter = hb?.center ?? { x: 0, y: 0, z: 0 };

// Inflate the interactive sphere so users can grab the cluster easily
const baseR   = hb?.radius ?? 1.0;
const HIT_PAD = 2.0;   // add ~2 world units around measured bounds
const HIT_SCALE = 1.35; // also scale up a bit
const MIN_R   = 6.0;   // never smaller than this (covers “whole cluster + a few px”)
const hitRadius = Math.max(baseR * HIT_SCALE, baseR + HIT_PAD, MIN_R);
  // make visuals ignore raycasts so hit-sphere gets events
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

  // safety: re-enable controls even if pointerup happens off-mesh
  useEffect(() => {
    const restore = () => {
      if (draggingRef.current) {
        draggingRef.current = false;
        setControlsEnabled(true);
      }
    };
    window.addEventListener('pointerup', restore);
    window.addEventListener('pointercancel', restore);
    return () => {
      window.removeEventListener('pointerup', restore);
      window.removeEventListener('pointercancel', restore);
    };
  }, [setControlsEnabled]);

  if (!isVisible) return null;

  const staticImages = images.filter((img) => !img.isFloating);
  const rotatingImages = images.filter((img) => img.isFloating);

  // overhead halo placement
  const HALO_Y = 5;        // y-offset above cluster
  const HALO_RADIUS = 4.8; // tune 4.6–5.2 to match look

  return (
    <a.group ref={groupRef} position={position} rotation={rotationProp} scale={s}>
      {/* ---- single interactive surface (invisible sphere) ---- */}
      {!isActive && (
        <mesh
          position={[hitCenter.x, hitCenter.y, hitCenter.z]}
          onPointerOver={(e) => {
            e.stopPropagation();
            if (!hovered) { setHovered(true); onHoverChange?.(id, true); }
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            if (hovered) { setHovered(false); onHoverChange?.(id, false); }
            document.body.style.cursor = 'default';
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            draggingRef.current = true;
            movedRef.current = false;
            startRef.current = [e.clientX, e.clientY];
            lastRef.current  = [e.clientX, e.clientY];
            setControlsEnabled(false);
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
            const [sx, sy] = startRef.current;
            const dx = Math.abs(e.clientX - sx);
            const dy = Math.abs(e.clientY - sy);
            if (!movedRef.current && dx <= 4 && dy <= 4) {
              onActivate(id);
            }
          }}
          onPointerLeave={(e) => {
            e.stopPropagation();
            if (draggingRef.current) {
              draggingRef.current = false;
              setControlsEnabled(true);
            }
          }}
        >
          <sphereGeometry args={[hitRadius, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {/* ---- non-interactive visuals (measured for hit-sphere) ---- */}
      <group ref={visualsRef} raycast={NO_RAYCAST}>
        {staticImages.map((img, i) => (
          <group key={i} position={img.position} rotation={img.rotation} scale={img.scale}>
            {img.useCircle ? (
              <mesh castShadow position={[0, 0, 0.001]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.6, 0.6, 0.01, 64]} />
                <meshStandardMaterial color="red" opacity={0.5} transparent />
              </mesh>
            ) : (
              <Panel thickness={0.1} />
            )}
            <ImageOverlay url={img.url} />
          </group>
        ))}

        <RotatingStones images={rotatingImages} center={[0, 0.52, 1.5]} radius={0.5} />
        {/* foundation base */}
        <RadialFadeDisk radius={5} height={0.1} color={[1.0, 0.96, 0.82]} />
      </group>

      {/* ---- overhead disk + shimmer (grouped together, OUTSIDE visualsRef) ---- */}
      <group
        position={[0, HALO_Y, 0]}
        rotation={[0, 0, 0]}
        raycast={NO_RAYCAST}
        userData={{ ignoreBounds: true }}
      >
        {/* the ceiling disk */}
        <FloatingCeilingGroup
          position={[0, 0, 0]}
          glowRadius={HALO_RADIUS}
          glowHeight={0.12}
          color={[1.0, 0.96, 0.82]}
        />

        {/* rotate shimmer so it matches the disk plane */}
        <group
          rotation={[
            THREE.MathUtils.degToRad(-22), // tilt toward camera
            THREE.MathUtils.degToRad(18),  // yaw a touch
            0,
          ]}
          raycast={NO_RAYCAST}
        >
          {/* tight rim shimmer */}
          <ShimmerParticles
            center={[0, 0, 0]}
            normal={[0, 1, 0]}
            scaleWith={HALO_RADIUS}
            innerRatio={0.60}
            outerRatio={0.98}
            liftStart={-0.015}
            sinkDepth={-1.2}
            fallSpeed={0.012}
            life={2.0}
            spawnRate={180}
            maxParticles={900}
            attractStrength={0.65}
            swirl={0.035}
            bandDamp={0.972}
            size={1.8}
            color="#FFF2CC"
            baseOpacity={0.70}
            addGlow
            glowSizeMul={2.0}
            glowOpacityMul={0.35}
          />

          {/* long tails drifting down */}
          <ShimmerParticles
            center={[0, 0, 0]}
            normal={[0, 1, 0]}
            scaleWith={HALO_RADIUS}
            innerRatio={0.55}
            outerRatio={0.95}
            liftStart={-0.03}
            sinkDepth={-8.0}
            fallSpeed={0.032}
            life={5.6}
            spawnRate={60}
            maxParticles={1000}
            attractStrength={0.70}
            swirl={0.04}
            bandDamp={0.972}
            size={1.8}
            color="#FFF2CC"
            baseOpacity={0.45}
            addGlow
            glowSizeMul={2.0}
            glowOpacityMul={0.32}
          />
        </group>
      </group>
    </a.group>
  );
}
