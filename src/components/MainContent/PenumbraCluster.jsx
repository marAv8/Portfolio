// src/components/MainContent/PenumbraCluster.jsx
import React, { useMemo, useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { a, useSpring } from "@react-spring/three";
import { useCursor, useTexture } from "@react-three/drei";
import ImageOverlay from "./ImageOverlay";
import PanelVideoFace from "./PanelVideoFace";
import RadialFadeDisk from "../Effects/RadialFadeDisk";
import SwirlColumn from "./SwirlColumn";
import PenumbraSphere from "../Effects/PenumbraSphere";
import { useScreenSize } from "../../contexts/ScreenSizeContext";

/* ---------- helpers ---------- */
const GROUP_RANK = { base: 0, seed: 1, latent: 2, muse: 3 };
function sortPenumbraAssets(arr = []) {
  return [...arr].sort((a, b) => {
    const ga = GROUP_RANK[a.group] ?? 99;
    const gb = GROUP_RANK[b.group] ?? 99;
    if (ga !== gb) return ga - gb;
    const oa = (typeof a.order === "number" ? a.order : 1e9);
    const ob = (typeof b.order === "number" ? b.order : 1e9);
    if (oa !== ob) return oa - ob;
    return (a.url || "").localeCompare(b.url || "");
  });
}

export default function PenumbraCluster({
  id = "cluster-penumbra",
  images = [],
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  isActive = false,
    preview = false,
  onActivate = () => {},
  onHoverChange = () => {},
  setControlsEnabled = () => {},
  radius = 7,
  plateThickness = 0.05,

}) {
  const { isMobile, isTablet } = useScreenSize?.() ?? { isMobile: false, isTablet: false };
  const isDesktop = !isMobile && !isTablet;

  /* refs */
  const rootRef    = useRef(null);   // root group (keeps props position/rotation/scale)
  const visualsRef = useRef(null);
  const planeRef   = useRef(null);
  const baseRef    = useRef(null);
  const anchoredRef = useRef(null);  // halo spheres (stay world-oriented)
  const NO_RAYCAST = () => null;
  const [dragging, setDragging] = useState(false);
  // ─────────────────────────────────────────────────────────
  // Abyss-parity toggles: drag/hover/click
  // ─────────────────────────────────────────────────────────
  const ROT_Y = 0.005, ROT_X = 0.004, CLAMP_X = 0.6;
  const draggingRef    = useRef(false);
  const movedRef       = useRef(false);
  const startRef       = useRef([0, 0]);
  const lastRef        = useRef([0, 0]);
  const scrollStartRef = useRef(0);
  const TAP_MOVE_PX    = 6;
  const TAP_SCROLL_PX  = 8;

  // Hover scale (desktop only; never while dragging or active)
  const [hovered, setHovered] = useState(false);
  useCursor(isDesktop && hovered);
  const BASE  = useMemo(() => scale, [scale]);
  const [{ s }, api] = useSpring(() => ({ s: BASE, config: { tension: 170, friction: 18 } }));
  useEffect(() => {
    const mul = (isDesktop && hovered && !isActive && !draggingRef.current) ? 1.06 : 1;
    api.start({ s: BASE.map(v => v * mul) });
  }, [isDesktop, hovered, isActive, BASE, api]);
  useEffect(() => { setHovered(false); }, [isActive]);

  // visuals never intercept pointer (so the billboard plane "owns" events)
  useEffect(() => {
    const root = visualsRef.current;
    if (!root) return;
    const prev = new Map();
    root.traverse((obj) => {
      if (typeof obj.raycast === "function") {
        prev.set(obj, obj.raycast);
        obj.raycast = () => null;
      }
    });
    return () => prev.forEach((ray, obj) => (obj.raycast = ray));
  }, []);

 
  // ─────────────────────────────────────────────────────────
  // Scene content
  // ─────────────────────────────────────────────────────────
  const ordered = useMemo(() => sortPenumbraAssets(images || []), [images]);
  const plateY = plateThickness + 1e-4;

  useEffect(() => {
    if (!Array.isArray(images)) return;
    if (isMobile || isTablet) return;
    const seen = new Set();
    images.forEach((item) => {
      if (!item) return;
      const src = typeof item === "string" ? item : item.url;
      if (typeof src === "string" && !src.toLowerCase().endsWith(".mp4") && !seen.has(src)) {
        seen.add(src);
        try { useTexture.preload(src); } catch (err) { /* ignore preload issues */ }
      }
      const poster = typeof item === "object" ? item.poster : undefined;
      if (typeof poster === "string" && !seen.has(poster)) {
        seen.add(poster);
        try { useTexture.preload(poster); } catch (err) { /* ignore */ }
      }
    });
  }, [images, isMobile, isTablet]);

  // ─────────────────────────────────────────────────────────
  // Billboard hit-plane: sized to the cluster footprint (ellipse)
  // ─────────────────────────────────────────────────────────
  const HIT_PAD_X = 1.2;               
  const HIT_PAD_Y = 2.4;                 
  const R_X = radius + HIT_PAD_X;
  const R_Y = radius * 0.72 + HIT_PAD_Y; 
  const PLANE_W = R_X * 2;
  const PLANE_H = R_Y * 2;


  // Inside-ellipse test in plane local space (ignore extreme corners)
  function isInsideEllipse(e) {
    const p = planeRef.current;
    if (!p) return false;
    const local = p.worldToLocal(e.point.clone()); // planeGeometry is 1x1 before scale
    const x = local.x * PLANE_W;
    const y = local.y * PLANE_H;
    const nx = x / R_X;
    const ny = y / R_Y;
    return (nx * nx + ny * ny) <= 1.0;
  }

  return (
    <a.group ref={rootRef} name="Penumbra" position={position} rotation={rotation} scale={s}>
      {/* Interactive billboard plane — matches Abyss behaviour */}
      {!isActive && (
        <mesh
          ref={planeRef}
          scale={[PLANE_W, PLANE_H, 1]}
          frustumCulled={false}
          renderOrder={9999}
          onPointerOver={(e) => {
            e.stopPropagation();
            if (!hovered) { setHovered(true); onHoverChange?.(id, true); }
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            if (hovered) { setHovered(false); onHoverChange?.(id, false); }
            document.body.style.cursor = "default";
          }}
         onPointerDown={(e) => {
         e.stopPropagation();
         if (!isInsideEllipse(e)) return;
         movedRef.current = false;
         startRef.current = [e.clientX ?? 0, e.clientY ?? 0];
         lastRef.current  = [e.clientX ?? 0, e.clientY ?? 0];
         try { e.target.setPointerCapture?.(e.pointerId); } catch {}

         const se = document.scrollingElement || document.documentElement;
         scrollStartRef.current = (se?.scrollTop ?? window.scrollY ?? 0);

         if (!isMobile) {
           draggingRef.current = true;
           setControlsEnabled(false);
          setDragging(true);                 // ⬅️ start pausing internal motion
         }
         document.body.style.cursor = "grabbing";
       }}
          onPointerMove={(e) => {
            e.stopPropagation();
            if (isMobile || !draggingRef.current || !rootRef.current) return;

            // robust deltas
            let dx = e.nativeEvent?.movementX ?? e.movementX ?? 0;
            let dy = e.nativeEvent?.movementY ?? e.movementY ?? 0;
            if (dx === 0 && dy === 0) {
              const [lx, ly] = lastRef.current;
              dx = (e.clientX ?? 0) - lx;
              dy = (e.clientY ?? 0) - ly;
            }
            if (dx === 0 && dy === 0) {
              const [sx, sy] = startRef.current;
              dx = (e.clientX ?? 0) - sx;
              dy = (e.clientY ?? 0) - sy;
            }

            if (Math.abs(dx) + Math.abs(dy) > 2) movedRef.current = true;

            rootRef.current.rotation.y += dx * ROT_Y;
            const nx = rootRef.current.rotation.x + dy * ROT_X;
            rootRef.current.rotation.x = Math.max(-CLAMP_X, Math.min(CLAMP_X, nx));
            lastRef.current = [e.clientX ?? 0, e.clientY ?? 0];
          }}

         onPointerUp={(e) => {
         e.stopPropagation();
         try { e.target.releasePointerCapture?.(e.pointerId); } catch {}
         if (!isMobile) {
           draggingRef.current = false;
           setControlsEnabled(true);
          setDragging(false);              
           const [sx, sy] = startRef.current;
           const dx = Math.abs((e.clientX ?? 0) - sx);
           const dy = Math.abs((e.clientY ?? 0) - sy);
           if (!movedRef.current && dx <= 4 && dy <= 4 && isInsideEllipse(e)) onActivate(id);
         }
         document.body.style.cursor = "pointer";
       }}
          onPointerLeave={(e) => {
         e.stopPropagation();
         if (!isMobile && draggingRef.current) {
           draggingRef.current = false;
           setControlsEnabled(true);
          setDragging(false);
           document.body.style.cursor = "default";
         }
       }}
          onClick={(e) => {
            // mobile-only: tap opens (with move/scroll guards)
            if (!isMobile) return;
            e.stopPropagation();
            if (!isInsideEllipse(e)) return;

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

      {/* VISUALS (root rotates; anchored spheres counter-rotate) */}
      <group ref={visualsRef} raycast={() => null}>
          {/* Base disk */}
          <group ref={baseRef}>
            <RadialFadeDisk
              raycast={NO_RAYCAST}
              color={[0.91, 0.86, 0.95]}
              radius={radius * 1.02}
              height={plateThickness}
              power={3.2}
              rotation={[0, 0, 0]}
              position={[0, 0, 0]}
              opacity={1}
            />
          </group>

          {/* Penumbra spheres */}
          {ordered.length > 0 && (
            <SwirlColumn
              items={ordered}
              animate={!dragging}  
              baseY={plateThickness + 0.22}
              height={7.2}
              baseRadius={1.3}
              topRadius={radius * 0.88}
              turns={1.85}
              fadePortion={0.22}
              videoScale={1.12}
              anchorSpawnBehind
              panelThickness={0.03}
              spawnAngleOffset={Math.PI * 0.18}          
              orientation={preview ? "fixed" : "yawOnly"} // ← add this
              periodSec={preview ? 90 : 72}   
              renderFace={(item) => {
                const url = item?.url || item?.thumb || "";
                const isVideo = item.type === "video" || /\.mp4$/i.test(url);
                const [w, h] = Array.isArray(item.size) ? item.size : [1, 1];
                return isVideo
                  ? <PanelVideoFace url={url} width={w} height={h} fit="contain" />
                  : <ImageOverlay url={url} />;
              }}
            />
          )}
      </group>

      {/* Anchored spheres remain stationary while root spins */}
      <group ref={anchoredRef} raycast={() => null} renderOrder={18}>
        <PenumbraSphere color="#5A6FAC" size="lg" position={[-4, plateY + 2,  2]}
                        glow={0.55} rimPower={1.7}
                        pulse pulseAmp={0.16} pulseSpeed={0.7}
                        sweep sweepAmp={0.22} sweepSpeed={0.32} sweepWidth={0.50}/>
        <PenumbraSphere color="#5A6FAC" size="lg" position={[ 2, plateY + 1, -1]}
                        glow={0.55} rimPower={1.7}
                        pulse pulseAmp={0.16} pulseSpeed={0.7}
                        sweep sweepAmp={0.22} sweepSpeed={0.32} sweepWidth={0.50}/>
        <PenumbraSphere color="#5A6FAC" size="lg" position={[ 4, plateY + 0.5, 2]}
                        glow={0.55} rimPower={1.7}
                        pulse pulseAmp={0.16} pulseSpeed={0.7}
                        sweep sweepAmp={0.22} sweepSpeed={0.32} sweepWidth={0.50}/>
        <PenumbraSphere color="#5A6FAC" size="lg" position={[-3, plateY + 1, -1.3]}
                        glow={0.55} rimPower={1.7}
                        pulse pulseAmp={0.16} pulseSpeed={0.7}
                        sweep sweepAmp={0.22} sweepSpeed={0.32} sweepWidth={0.50}/>

        <PenumbraSphere color="#CBB4FF" size="md" position={[-1.0, plateY + 2, -1.5]}
                        glow={0.55} rimPower={1.7}
                        pulse pulseAmp={0.16} pulseSpeed={0.7}
                        sweep sweepAmp={0.22} sweepSpeed={0.32} sweepWidth={0.50}/>
        <PenumbraSphere color="#CBB4FF" size="md" position={[ 3.0, plateY + 3,  2.0]}
                        glow={0.55} rimPower={1.7}
                        pulse pulseAmp={0.16} pulseSpeed={0.7}
                        sweep sweepAmp={0.22} sweepSpeed={0.32} sweepWidth={0.50}/>
        <PenumbraSphere color="#CBB4FF" size="md" position={[ 0.0, plateY + 4, -0.2]}
                        glow={0.55} rimPower={1.7}
                        pulse pulseAmp={0.16} pulseSpeed={0.7}
                        sweep sweepAmp={0.22} sweepSpeed={0.32} sweepWidth={0.50}/>

        <PenumbraSphere color="#5A6FAC" size="sm" position={[-0.8, plateY + 2,  0.9]}
                        glow={0.6} rimPower={1.8}
                        pulse pulseAmp={0.14} pulseSpeed={0.8}
                        sweep sweepAmp={0.18} sweepSpeed={0.36} sweepWidth={0.48}/>
        <PenumbraSphere color="#1E00FF" size="sm" position={[ 1.0, plateY + 3, -1.1]}
                        glow={0.6} rimPower={1.8}
                        pulse pulseAmp={0.14} pulseSpeed={0.8}
                        sweep sweepAmp={0.18} sweepSpeed={0.36} sweepWidth={0.48}/>
        <PenumbraSphere color="#B892FF" size="sm" position={[-1.5, plateY + 3,  0.2]}
                        glow={0.6} rimPower={1.8}
                        pulse pulseAmp={0.14} pulseSpeed={0.8}
                        sweep sweepAmp={0.18} sweepSpeed={0.36} sweepWidth={0.48}/>
      </group>
    </a.group>
  );
}
