// ConceptCluster.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { a, useSpring } from '@react-spring/three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCursor } from '@react-three/drei';

import Panel from './Panel';
import ImageOverlay from './ImageOverlay';
import RadialFadeDisk from '../Effects/RadialFadeDisk';
import RotatingStones from './RotatingStones';
import FloatingCeilingGroup from '../Effects/FloatingCeilingGroup';
import { useScreenSize } from '../../contexts/ScreenSizeContext';
const deg = (d) => THREE.MathUtils.degToRad(d);
const FALLBACK_STATIC_IMAGES = [
  {
    position: [-2.15, 1.75, -1.25],
    rotation: [0, deg(-18), 0],
    scale: [1.65, 2.4, 1],
    panelColor: '#F4E8D7',
    panelOpacity: 0.92,
  },
  {
    position: [2.05, 1.4, -0.8],
    rotation: [0, deg(16), 0],
    scale: [1.25, 1.95, 1],
    panelColor: '#E4DCF8',
    panelOpacity: 0.9,
  },
  {
    position: [-0.35, 2.35, 1.05],
    rotation: [deg(3), 0, deg(-4)],
    scale: [1.55, 2.2, 1],
    panelColor: '#FFF1D8',
    panelOpacity: 0.88,
  },
  {
    position: [0.65, 1.05, -1.85],
    rotation: [0, deg(6), 0],
    scale: [1.1, 1.45, 1],
    panelColor: '#F0F0F0',
    panelOpacity: 0.9,
  },
];

const FALLBACK_FLOATING_IMAGES = [
  { isFloating: true, panelColor: '#F2E6FF', panelOpacity: 0.9, scale: [1.1, 1.3, 1] },
  { isFloating: true, panelColor: '#FFE8DA', panelOpacity: 0.9, scale: [0.95, 1.15, 1] },
  { isFloating: true, panelColor: '#E6F3FF', panelOpacity: 0.9, scale: [1.05, 1.25, 1] },
  { isFloating: true, panelColor: '#F7F0FF', panelOpacity: 0.88, scale: [0.9, 1.1, 1] },
  { isFloating: true, panelColor: '#F4EFE5', panelOpacity: 0.88, scale: [1.0, 1.2, 1] },
];

const FALLBACK_CONCEPT_IMAGES = [
  ...FALLBACK_STATIC_IMAGES,
  ...FALLBACK_FLOATING_IMAGES,
];

export default function ConceptCluster({
  id = 'cluster-root',
  // IMPORTANT: neutral defaults (match Abyss)
  position = [0, 0, 0],
  rotation: rotationProp = [0, 0, 0],
  scale = [1, 1, 1],
  images = [],
  isActive = false,
  onActivate = () => {},
  onShowCarousel = () => {},
  onHoverChange = () => {},
  registerRef,
  setControlsEnabled = () => {},
  enableStones = true,
  preferThumb = false,
}) {
  // ─────────────────────────────────────────────────────────────
  // Env / refs
  // ─────────────────────────────────────────────────────────────
  const { isMobile, isTablet } = useScreenSize?.() ?? { isMobile:false, isTablet:false };
  const isDesktop = !isMobile && !isTablet;
  const resolveUrl = (img) =>
    preferThumb
      ? img?.thumb || img?.url || img?.full
      : (isMobile ? img?.full || img?.thumb : img?.thumb || img?.full) || img?.url;
// Prefer 1600px on mobile for the Root cluster only
const boostedForMobile = useMemo(() => {
  if (!(isMobile && id === 'cluster-root') || preferThumb) return images;
  return (images || []).map((img) => {
    // if you already enrich with {thumb, full}, this swaps to the 1600
    if (img && (img.full || img.thumb || img.url)) {
      return { ...img, url: img.full || img.url }; // force 1600
    }
    return img;
  });
}, [isMobile, id, images, preferThumb]);


  const groupRef   = useRef(null);
  const visualsRef = useRef(null);
  const planeRef   = useRef(null);
  const haloRef    = useRef(null);
  const NO_RAYCAST = () => null;

  // ─────────────────────────────────────────────────────────────
  // Drag / click (Abyss parity)
  // ─────────────────────────────────────────────────────────────
  const ROT_Y = 0.005, ROT_X = 0.004, CLAMP_X = 0.6;
  const draggingRef    = useRef(false);
  const movedRef       = useRef(false);
  const startRef       = useRef([0, 0]);
  const lastRef        = useRef([0, 0]);
  const scrollStartRef = useRef(0);

  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  // Expose to parent
  useEffect(() => {
    if (registerRef) registerRef(id, groupRef.current);
    return () => registerRef && registerRef(id, null);
  }, [id, registerRef]);

  // ─────────────────────────────────────────────────────────────
  // Hover scale (desktop only)
  // ─────────────────────────────────────────────────────────────
  const BASE = useMemo(() => scale, [scale]);
  const [{ s }, api] = useSpring(() => ({ s: BASE, config: { tension: 170, friction: 18 } }));

  const arraysEqual = (a, b) =>
    Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]);

  const lastTargetRef = useRef(BASE);
  useEffect(() => {
    const mul = (isDesktop && hovered && !isActive && !draggingRef.current) ? 1.06 : 1;
    const target = [BASE[0] * mul, BASE[1] * mul, BASE[2] * mul];
    if (!arraysEqual(target, lastTargetRef.current)) {
      lastTargetRef.current = target;
      api.start({ s: target });
    }
    // intentionally read draggingRef.current (don’t add to deps)
  }, [isDesktop, hovered, isActive, BASE, api]);

  // collapse hover when overlay toggles
  useEffect(() => { setHovered(false); }, [isActive]);

  // show carousel on mobile when active (unchanged)
  useEffect(() => { if (isMobile && isActive) onShowCarousel(id); }, [isMobile, isActive, id, onShowCarousel]);

  // visuals ignore raycasts (same as Abyss)
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

  // Always re-enable orbit controls on pointer end / unmount (Abyss style)
  useEffect(() => {
    setControlsEnabled(true);
    if (!isMobile) {
      const restore = () => setControlsEnabled(true);
      window.addEventListener('pointerup', restore);
      window.addEventListener('pointercancel', restore);
      return () => {
        window.removeEventListener('pointerup', restore);
        window.removeEventListener('pointercancel', restore);
        setControlsEnabled(true);
      };
    }
    return () => setControlsEnabled(true);
  }, [isMobile, setControlsEnabled]);

  // ─────────────────────────────────────────────────────────────
  // Billboard hit plane (for drag / click)
  // ─────────────────────────────────────────────────────────────
const BASE_RADIUS  = 6.2;
const HIT_PAD_X    = 2.4;
const HIT_PAD_Y    = 3.8;
const DEFAULT_PLANE_W      = 2 * (BASE_RADIUS + HIT_PAD_X);
const DEFAULT_PLANE_H      = 2 * (BASE_RADIUS * 0.85 + HIT_PAD_Y);
const PLANE_OFFSET = 1.25;

const tmpWorld = useMemo(() => new THREE.Vector3(), []);
const tmpDir   = useMemo(() => new THREE.Vector3(), []);
const tmpPos   = useMemo(() => new THREE.Vector3(), []);
const tmpBox   = useMemo(() => new THREE.Box3(), []);
const tmpSize  = useMemo(() => new THREE.Vector3(), []);
const tmpScale = useMemo(() => new THREE.Vector3(), []);
const [planeScale, setPlaneScale] = useState([DEFAULT_PLANE_W, DEFAULT_PLANE_H]);
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


  const HALO_Y        = 5;
  const HALO_RADIUS   = 4.8;
  
  

  const [fallDirWorld, setFallDirWorld] = useState([0, -1, 0]);
  const [sinkDepth, setSinkDepth]       = useState(-(HALO_Y + 0.25));
  const fallDirRef = useRef(fallDirWorld);
  const sinkRef    = useRef(sinkDepth);



const resolvedImages = useMemo(() => (
  Array.isArray(boostedForMobile) && boostedForMobile.length
    ? boostedForMobile
    : FALLBACK_CONCEPT_IMAGES
), [boostedForMobile]);


  const usingFallbackImages = resolvedImages === FALLBACK_CONCEPT_IMAGES;
  const staticImages   = resolvedImages.filter((img) => !img.isFloating);
  
  const rotatingImages = resolvedImages.filter((img) =>  img.isFloating);
  const ringAImages = rotatingImages.filter((img) => (img.ring ?? 'A') === 'A');
  const ringBImages = rotatingImages.filter((img) => img.ring === 'B');

  const diskColor = usingFallbackImages ? [0.96, 0.92, 0.88] : [1.0, 0.96, 0.82];
  
const ringPanelColor = usingFallbackImages ? '#F2E5D3' : '#EDE3CF';
const ringPanelOpacity = usingFallbackImages ? 0.9 : 0.95;

// Twin centers (match assetData’s centers)
const ringCenterA = [-0.9, 0.52, 1.5];
const ringCenterB = [ 0.9, 0.52, 1.5];

// Twin radii (match assetData)
const ringRadiusA = 0.62;
const ringRadiusB = 0.62;

  useEffect(() => {
    const visuals = visualsRef.current;
    const group = groupRef.current;
    if (!visuals || !group) return;
    group.updateWorldMatrix(true, true);
    tmpBox.setFromObject(visuals);
    tmpBox.getSize(tmpSize);
    group.getWorldScale(tmpScale);
    const width = (tmpSize.x / (tmpScale.x || 1)) + 2.4;
    const height = (tmpSize.y / (tmpScale.y || 1)) + 2.2;
    const clampedWidth = Math.min(28, Math.max(8, width));
    const clampedHeight = Math.min(24, Math.max(6, height));
    setPlaneScale((prev) => {
      if (Math.abs(prev[0] - clampedWidth) < 0.1 && Math.abs(prev[1] - clampedHeight) < 0.1) return prev;
      return [clampedWidth, clampedHeight];
    });
  }, [resolvedImages, enableStones, isMobile]);

  // Split imagery

  // ─────────────────────────────────────────────────────────────
  // Render (no conditional hooks below)
  // ─────────────────────────────────────────────────────────────
  return (
    <a.group ref={groupRef} position={position} rotation={rotationProp} scale={s}>
      {/* Interactive billboard plane (hidden when active) */}
      {!isActive && (
        <mesh
          ref={planeRef}
          scale={[planeScale[0], planeScale[1], 1]}
          frustumCulled={false}
          renderOrder={9999}
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
            movedRef.current = false;
            startRef.current = [e.clientX, e.clientY];
            lastRef.current  = [e.clientX, e.clientY];

            // record page scroll (mobile guard)
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

            const [sx, sy] = startRef.current;
            const dx = Math.abs((e.clientX ?? 0) - sx);
            const dy = Math.abs((e.clientY ?? 0) - sy);
            if (dx > 6 || dy > 6) return;

            const se = document.scrollingElement || document.documentElement;
            const now = (se?.scrollTop ?? window.scrollY ?? 0);
            const dScroll = Math.abs(now - scrollStartRef.current);
            if (dScroll > 8) return;

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

      {/* VISUALS (no raycast) */}
      <group ref={visualsRef} raycast={() => null}>
        <RadialFadeDisk radius={5} height={0.1} color={diskColor} />

        {staticImages.map((img, i) => (
          <group key={i} position={img.position} rotation={img.rotation} scale={img.scale}>
            {img.useCircle ? (
              <mesh castShadow position={[0, 0, 0.001]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.6, 0.6, 0.01, 64]} />
                <meshStandardMaterial color="red" opacity={0.5} transparent />
              </mesh>
            ) : (
              <Panel
                thickness={img.panelThickness ?? 0.1}
                color={img.panelColor}
                opacity={img.panelOpacity}
                roughness={img.panelRoughness}
                metalness={img.panelMetalness}
              />
            )}
            <ImageOverlay url={resolveUrl(img)} />
          </group>
        ))}

          {enableStones && (
            <>
              {/* Left ring (A) */}
              {ringAImages.length > 0 && (
                <RotatingStones
                  showCenter
                  images={ringAImages}
                  center={ringCenterA}
                  radius={ringRadiusA}
                  panelColor={ringPanelColor}
                  panelOpacity={ringPanelOpacity}
                  speed={0.35}
                />
              )}

              {/* Right ring (B) */}
              {ringBImages.length > 0 && (
                <RotatingStones
                  showCenter
                  images={ringBImages}
                  center={ringCenterB}
                  radius={ringRadiusB}
                  panelColor={ringPanelColor}
                  panelOpacity={ringPanelOpacity}
                  speed={0.35}
                />
              )}
            </>
          )}

      </group>

      {/* OVERHEAD DISK + SHIMMER */}
      <group
        ref={haloRef}
        position={[0, HALO_Y, 0]}
        rotation={[0, 0, 0]}
        raycast={NO_RAYCAST}
        userData={{ ignoreBounds: true }}
      >
        <FloatingCeilingGroup position={[0, 0, 0]} glowRadius={HALO_RADIUS} glowHeight={0.12} color={[1.0, 0.96, 0.82]} />
        <group rotation={[THREE.MathUtils.degToRad(-22), THREE.MathUtils.degToRad(18), 0]} raycast={NO_RAYCAST}>
 
          
        </group>
      </group>
    </a.group>
  );
}
