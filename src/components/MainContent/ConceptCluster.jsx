//ConceptCluster.jsx
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
import ShimmerParticles from '../Effects/ShimmerParticles';
import HitPlane from '../common/HitPlane';
import HitBillboard from '../common/HitBillboard';

export default function ConceptCluster({
  id,
  position = [0, -3, 0],
  rotation: rotationProp = [0, 0, 0],
  scale = [1, 1, 1],
  images = [],
  isActive = false,
  onActivate = () => {},
  onShowCarousel = () => {},
  onHoverChange = () => {},
  registerRef,
  setControlsEnabled = () => {},
  mobile = false,   // <- defined if you ever want it
  lite = false,
}) {
  const groupRef = useRef(null);
  const visualsRef = useRef(null);
  const NO_RAYCAST = () => null;

  // add with other refs at top of component
const scrollStartRef = useRef(0);
const TAP_MOVE_PX = 6;     // movement guard
const TAP_SCROLL_PX = 8;   // page scroll guard


  // ------- drag / orbit -------
  const ROT_Y = 0.005, ROT_X = 0.004, CLAMP_X = 0.6;
  const draggingRef = useRef(false);
  const [dragging, setDragging] = useState(false);  const movedRef = useRef(false);
  const startRef = useRef([0, 0]);
  const lastRef = useRef([0, 0]);

  // ------- ui state -------
  const [hovered, setHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasIntroPulsed, setHasIntroPulsed] = useState(false);
  const introAnimatingRef = useRef(false);
  const { isMobile, isTablet } = useScreenSize();
  const allowDrag = !isMobile; // mobile: no drag (keeps page scroll)
  useCursor(hovered);
  // const isMobileMode = !!props.mobile;

  // expose cluster ref to parent
  useEffect(() => {
    if (typeof registerRef === 'function') registerRef(id, groupRef.current);
    return () => { if (typeof registerRef === 'function') registerRef(id, null); };
  }, [id, registerRef]);

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
   const target =
   hovered && !isActive && !dragging
     ? scale.map((v) => v * hoverScaleMul)
     : scale;    api.start({ s: target });
  }, [hovered, isActive, dragging, scale, api]);

  // mobile: show carousel when active
  useEffect(() => {
    if (isMobile && isActive) onShowCarousel(id);
  }, [isMobile, isActive, id, onShowCarousel]);

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

  // safety: re-enable controls even if pointerup happens off-mesh (desktop/tablet only)
  useEffect(() => {
    if (!allowDrag) return;
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
  }, [allowDrag, setControlsEnabled]);

  if (!isVisible) return null;

  const staticImages = images.filter((img) => !img.isFloating);
  const rotatingImages = images.filter((img) => img.isFloating);

  // overhead halo placement
  const HALO_Y = 5;
  const HALO_RADIUS = 4.8;
  // Concept-only density bump (overlay/look when active stays identical)
  const IN_CONCEPT = !isActive;
  const DENSITY_MUL  = IN_CONCEPT ? 1.9 : 1;  // spawn & max multiplier
  const SIZE_BUMP    = IN_CONCEPT ? 0.6 : 0;  // add to size (world units)
  const OPACITY_BUMP = IN_CONCEPT ? 0.18 : 0; // add to baseOpacity
  

  return (
    <a.group ref={groupRef} position={position} rotation={rotationProp} scale={s}>
      {/* HIT AREAS */}
      {!isActive && (
        <>
          {/* 1) Ground disk */}
          <HitPlane
            radius={6.2}
            y={0.0}
          onPointerOver={(e) => {
          e.stopPropagation();
          if (draggingRef.current) return;         // ← don’t flip hover while dragging
          if (!hovered) { setHovered(true); onHoverChange?.(id, true); }
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e)  => {
          e.stopPropagation();
          if (draggingRef.current) return;         // ← keep hover stable during drag
          if (hovered)  { setHovered(false); onHoverChange?.(id, false); }
          document.body.style.cursor = 'default';
        }}
                  onPointerDown={(e) => {
              e.stopPropagation();
              try { console.log('[DIAG][ConceptPlane]', id, 'down', { isMobile, x: e.clientX, y: e.clientY }); } catch {}

              // record page scroll start for tap-vs-scroll on mobile
              const se = document.scrollingElement || document.documentElement;
              scrollStartRef.current = (se?.scrollTop ?? window.scrollY ?? 0);

              // mobile: don't start a drag; just remember the tap
              if (!allowDrag) {
                movedRef.current = false;
                startRef.current = [e.clientX, e.clientY];
                lastRef.current  = [e.clientX, e.clientY];
                return;
              }

              // desktop/tablet: begin drag
              draggingRef.current = true;
              movedRef.current    = false;
              startRef.current    = [e.clientX, e.clientY];
              lastRef.current     = [e.clientX, e.clientY];
              setControlsEnabled(false);
              document.body.style.cursor = 'grabbing';
            }}

            onPointerMove={(e) => {
              e.stopPropagation();
              if (!allowDrag || !draggingRef.current || !groupRef.current) return;
              const [lx, ly] = lastRef.current;
              const dx = e.clientX - lx;
              const dy = e.clientY - ly;
              if (Math.abs(dx) + Math.abs(dy) > 2) movedRef.current = true;
              try { console.log('[DIAG][ConceptPlane]', id, 'move', { dx, dy, moved: movedRef.current }); } catch {}
              groupRef.current.rotation.y += dx * ROT_Y;
              const nextX = groupRef.current.rotation.x + dy * ROT_X;
              groupRef.current.rotation.x = Math.max(-CLAMP_X, Math.min(CLAMP_X, nextX));
              lastRef.current = [e.clientX, e.clientY];
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              if (!allowDrag) return;
              draggingRef.current = false;
              setControlsEnabled(true);
              const [sx, sy] = startRef.current;
              const dx = Math.abs(e.clientX - sx);
              const dy = Math.abs(e.clientY - sy);
              try { console.log('[DIAG][ConceptPlane]', id, 'up', { dx, dy, moved: movedRef.current }); } catch {}
              if (!movedRef.current && dx <= 4 && dy <= 4) onActivate(id);
            }}
            onPointerLeave={(e) => {
              e.stopPropagation();
                if (!allowDrag) return;
            // don’t touch hover when leaving during a drag — just end the drag
              if (draggingRef.current) { draggingRef.current = false; setControlsEnabled(true); }
            }}
           onClick={(e) => {
              if (!isMobile) return;
              e.stopPropagation();
              // guard tap vs finger move AND page scroll
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
          />

        {/* 2) Billboard */}
<HitBillboard
  width={12}
  height={10}
  offset={1.2}
  y={1.2}
 onPointerOver={(e) => {
   e.stopPropagation();
   if (draggingRef.current) return;         // ← prevent hover flips mid-drag
   if (!hovered) { setHovered(true); onHoverChange?.(id, true); }
   document.body.style.cursor = 'pointer';
 }}
 onPointerOut={(e) => {
   e.stopPropagation();
   if (draggingRef.current) return;         // ← keep scale target steady
   if (hovered) { setHovered(false); onHoverChange?.(id, false); }
   document.body.style.cursor = 'default';
 }}
  onPointerDown={(e) => {
    e.stopPropagation();
    try { console.log('[DIAG][ConceptBillboard]', id, 'down', { isMobile, x: e.clientX, y: e.clientY }); } catch {}

    // record page scroll start for tap-vs-scroll on mobile
    const se = document.scrollingElement || document.documentElement;
    scrollStartRef.current = (se?.scrollTop ?? window.scrollY ?? 0);

    // remember pointer start for both mobile & desktop
    movedRef.current = false;
    startRef.current = [e.clientX, e.clientY];
    lastRef.current  = [e.clientX, e.clientY];

    // desktop/tablet: begin drag
    if (!isMobile) {
      draggingRef.current = true;
      setControlsEnabled(false);
    }
    document.body.style.cursor = 'grabbing';
  }}
  onPointerMove={(e) => {
    e.stopPropagation();
    if (!allowDrag || !draggingRef.current || !groupRef.current) return;

    const [lx, ly] = lastRef.current;
    const dx = e.clientX - lx;
    const dy = e.clientY - ly;
    if (Math.abs(dx) + Math.abs(dy) > 2) movedRef.current = true;
    try { console.log('[DIAG][ConceptBillboard]', id, 'move', { dx, dy, moved: movedRef.current }); } catch {}

    groupRef.current.rotation.y += dx * ROT_Y;
    const nextX = groupRef.current.rotation.x + dy * ROT_X;
    groupRef.current.rotation.x = Math.max(-CLAMP_X, Math.min(CLAMP_X, nextX));

    lastRef.current = [e.clientX, e.clientY];
  }}
  onPointerUp={(e) => {
    e.stopPropagation();

    // desktop/tablet only — end drag & maybe activate on true click
    if (allowDrag) {
      draggingRef.current = false;
      setControlsEnabled(true);

      const [sx, sy] = startRef.current;
      const dx = Math.abs(e.clientX - sx);
      const dy = Math.abs(e.clientY - sy);
      try { console.log('[DIAG][ConceptBillboard]', id, 'up', { dx, dy, moved: movedRef.current }); } catch {}

      if (!movedRef.current && dx <= 4 && dy <= 4) onActivate(id);
    }

    document.body.style.cursor = 'pointer';
  }}
  onPointerLeave={(e) => {
    e.stopPropagation();
    if (!allowDrag) return;
      // end drag, but don’t toggle hover here
   if (draggingRef.current) { draggingRef.current = false; setControlsEnabled(true); }
    
  }}
  onClick={(e) => {
    // mobile-only activation with movement & page-scroll guards
    if (!isMobile) return;
    e.stopPropagation();
    try { console.log('[DIAG][ConceptBillboard]', id, 'click-mobile'); } catch {}

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
/>

        </>
      )}

      {/* VISUALS (no raycast) */}
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

        <RotatingStones   
          showCenter={true}
          density={1.0}
          images={rotatingImages} 
          center={[0, 0.52, 1.5]} 
          radius={0.5} />
        <RadialFadeDisk radius={5} height={0.1} color={[1.0, 0.96, 0.82]} />
      </group>

      {/* OVERHEAD DISK + SHIMMER */}
      <group position={[0, HALO_Y, 0]} rotation={[0, 0, 0]} raycast={NO_RAYCAST} userData={{ ignoreBounds: true }}>
        <FloatingCeilingGroup position={[0, 0, 0]} glowRadius={HALO_RADIUS} glowHeight={0.12} color={[1.0, 0.96, 0.82]} />
        <group
          rotation={[THREE.MathUtils.degToRad(-22), THREE.MathUtils.degToRad(18), 0]}
          raycast={NO_RAYCAST}
        >
          <ShimmerParticles
            center={[0, 0, 0]}
            normal={[0, 1, 0]}
            scaleWith={HALO_RADIUS}
            innerRatio={0.64}
            outerRatio={0.85} 
            liftStart={-0.015}
            sinkDepth={-0.8}
            fallSpeed={0.012}
            life={5.0}
            spawnRate={Math.round(360 * DENSITY_MUL)}
            maxParticles={Math.round(2800 * DENSITY_MUL)}
            attractStrength={0.65}
            swirl={0.035}
            bandDamp={0.972}
            size={3.6 + SIZE_BUMP} 
            color="#FFF2CC"
            baseOpacity={0.62 + OPACITY_BUMP}
            addGlow
            glowSizeMul={1.8}
            glowOpacityMul={0.25}
          />
          <ShimmerParticles
            center={[0, 0, 0]}
            normal={[0, 1, 0]}
            scaleWith={HALO_RADIUS}
            innerRatio={0.58}
            outerRatio={0.82}
            liftStart={-0.03}
            sinkDepth={-1.2} 
            fallSpeed={0.032}
            life={8.0}
            spawnRate={150}
            maxParticles={2000}
            attractStrength={0.70}
            swirl={0.032}
            bandDamp={0.972}
            size={4}
            color="#FFF2CC"
            baseOpacity={0.38}
            addGlow
            glowSizeMul={1.7}
            glowOpacityMul={0.6}
          />
        </group>
      </group>
    </a.group>
  );
}
