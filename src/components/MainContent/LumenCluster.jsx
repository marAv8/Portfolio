import React, { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import { a, useSpring } from "@react-spring/three";

import LumenSpace from "./LumenSpace";
import LumenMoon from "./LumenMoon";
import LumenEarth from "./LumenEarth";
import LumenStarfield from "../Effects/LumenStarfield";
import { getLumenSubset } from "../../assets/assetsRight";
import { useScreenSize } from "../../contexts/ScreenSizeContext";

export default function LumenCluster({
  id = "cluster-lumen",
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  setControlsEnabled = () => {},
  controlsRef,                // kept for parity with Abyss signature
  onActivate = () => {},
  visibleSub = "all",         // "earth" | "moon" | "space" | "all"
  onHoverChange = () => {},
  interactive = false,        // enable Abyss-style main hit plane
  hoverable = true,           // allow hover scale even when interactions are off
  subHitplanes = false,       // optional tiny per-sub hit planes (off by default)
}) {
  const screenCtx = useScreenSize?.();
  const isMobile = screenCtx?.isMobile ?? false;
  const isTablet = screenCtx?.isTablet ?? false;
  const isDesktop = !isMobile && !isTablet;

  const rootRef   = useRef(null);  // whole cluster wrapper
  const breathRef = useRef(null);  // breathing/hover scaling group
  const visualsRef = useRef(null); // visuals subtree (never raycasts)
  const planeRef  = useRef(null);  // main billboard plane

  const spaceRef = useRef(null);
  const moonRef  = useRef(null);
  const earthRef = useRef(null);

  const [hovered, setHovered] = useState(false);
  useCursor(interactive && hovered);
  useEffect(() => {
    onHoverChange?.(id, hovered);
  }, [hovered, id, onHoverChange]);

  const space = useMemo(() => getLumenSubset("space"), []);
  const moon  = useMemo(() => getLumenSubset("moon"),  []);
  const earth = useMemo(() => getLumenSubset("earth"), []);
  const deg = (d) => (d * Math.PI) / 180;

  // ─────────────────────────────────────────────────────────────
  // VISUALS never raycast (Abyss parity)
  // ─────────────────────────────────────────────────────────────
  const NO_RAYCAST = () => null;
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
    return () => prev.forEach((raycast, obj) => { obj.raycast = raycast; });
  }, []);

  // ─────────────────────────────────────────────────────────────
  // BREATHING hover scale (Abyss parity)
  // ─────────────────────────────────────────────────────────────
  const BASE  = useMemo(() => [1, 1, 1], []);
  const HOVER = 1.06;
  const [{ s }, api] = useSpring(() => ({
    s: BASE,
    config: { tension: 170, friction: 18 }
  }));

  // expand only when we’re actually hovered and not dragging
  const draggingRefForBreath = useRef(false);
  useEffect(() => {
    const mul = isDesktop && hovered && !draggingRefForBreath.current ? HOVER : 1;
    api.start({ s: BASE.map((v) => v * mul) });
  }, [hovered, api, BASE, isDesktop]);

  // ─────────────────────────────────────────────────────────────
  // MAIN billboard hit-plane (Abyss parity)
  // ─────────────────────────────────────────────────────────────
  const TAP_MOVE_PX   = 6;
  const TAP_SCROLL_PX = 8;

  const ROT_Y = 0.005, ROT_X = 0.004, CLAMP_X = 0.6;
  const draggingRef    = useRef(false);
  const movedRef       = useRef(false);
  const startRef       = useRef([0, 0]);
  const lastRef        = useRef([0, 0]);
  const scrollStartRef = useRef(0);

  // keep orbit controls sane on end/unmount
  useEffect(() => {
    setControlsEnabled(true);
    if (!isMobile) {
      const restore = () => setControlsEnabled(true);
      window.addEventListener("pointerup", restore);
      window.addEventListener("pointercancel", restore);
      return () => {
        window.removeEventListener("pointerup", restore);
        window.removeEventListener("pointercancel", restore);
        setControlsEnabled(true);
      };
    }
    return () => setControlsEnabled(true);
  }, [isMobile, setControlsEnabled]);

  // main plane: billboard & offset toward camera (mirrors Abyss behaviour)
  const BASE_RADIUS  = 12;
  const HIT_PAD      = 3.5;
  const PLANE_W      = 2 * (BASE_RADIUS + HIT_PAD);
  const PLANE_H      = PLANE_W * 0.72;
  const PLANE_OFFSET = 1.25;

  const tmpWorld = useMemo(() => new THREE.Vector3(), []);
  const tmpDir   = useMemo(() => new THREE.Vector3(), []);
  const tmpPos   = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    if (!hoverable) return; // still billboard the hover plane even when drag/click is disabled
    const g = rootRef.current, p = planeRef.current;
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

  // optional tiny per-sub hit planes (your previous helper kept intact)
  function SubHitPlane({
    groupRef,
    size = [14, 5.5],
    offset = 1.1,
    rotateTarget = "self",
    onOpen,
  }) {
    const planeRef = useRef();
    const draggingRef = useRef(false);
    const movedRef = useRef(false);
    const startRef = useRef([0, 0]);
    const lastRef  = useRef([0, 0]);
    const scrollStartRef = useRef(0);

    const ROT_Y = 0.006, ROT_X = 0.004, CLAMP_X = 0.55;

    const tmpWorld = useMemo(() => new THREE.Vector3(), []);
    const tmpDir   = useMemo(() => new THREE.Vector3(), []);
    const tmpPos   = useMemo(() => new THREE.Vector3(), []);
    useFrame(({ camera }) => {
      const g = groupRef.current, p = planeRef.current, r = rootRef.current;
      if (!g || !p || !r) return;
      r.updateWorldMatrix(true, false);
      g.updateWorldMatrix(true, false);

      tmpWorld.setFromMatrixPosition(g.matrixWorld);
      tmpDir.copy(camera.position).sub(tmpWorld).normalize();

      const planeWorld = tmpPos.copy(tmpWorld).addScaledVector(tmpDir, offset);
      p.position.copy(g.worldToLocal(planeWorld.clone()));

      const camInSub = g.worldToLocal(camera.position.clone());
      p.lookAt(camInSub);
    });

    return (
      <mesh
        ref={planeRef}
        scale={[size[0], size[1], 1]}
        frustumCulled={false}
        renderOrder={9999}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={(e)  => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "default"; }}
        onPointerDown={(e) => {
          e.stopPropagation();
          movedRef.current = false;
          startRef.current = [e.clientX, e.clientY];
          lastRef.current  = [e.clientX, e.clientY];
          const se = document.scrollingElement || document.documentElement;
          scrollStartRef.current = (se?.scrollTop ?? window.scrollY ?? 0);
          try { e.target.setPointerCapture(e.pointerId); } catch {}
          draggingRef.current = true;
          setControlsEnabled(false);
          document.body.style.cursor = "grabbing";
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
          if (!draggingRef.current) return;
          const [lx, ly] = lastRef.current;
          const dx = e.clientX - lx;
          const dy = e.clientY - ly;
          if (Math.abs(dx) + Math.abs(dy) > 2) movedRef.current = true;

          const target = rotateTarget === "root" ? rootRef.current : groupRef.current;
          if (target) {
            target.rotation.y += dx * ROT_Y;
            const nx = target.rotation.x + dy * ROT_X;
            target.rotation.x = Math.max(-CLAMP_X, Math.min(CLAMP_X, nx));
          }
          lastRef.current = [e.clientX, e.clientY];
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          try { e.target.releasePointerCapture(e.pointerId); } catch {}
          draggingRef.current = false;
          setControlsEnabled(true);
          document.body.style.cursor = "pointer";

          const [sx, sy] = startRef.current;
          const dx = Math.abs(e.clientX - sx);
          const dy = Math.abs(e.clientY - sy);
          const se = document.scrollingElement || document.documentElement;
          const now = (se?.scrollTop ?? window.scrollY ?? 0);
          const dScroll = Math.abs(now - scrollStartRef.current);

          if (!movedRef.current && dx <= TAP_MOVE_PX && dy <= TAP_MOVE_PX && dScroll <= TAP_SCROLL_PX) {
            onOpen?.();
          }
        }}
        onPointerLeave={(e) => { e.stopPropagation(); }}
        onClick={(e) => e.stopPropagation()}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} side={THREE.DoubleSide} />
      </mesh>
    );
  }

  return (
    <group ref={rootRef} name="Lumen" position={position} rotation={rotation} scale={scale}>
      {/* MAIN INTERACTIVE BILLBOARD (Abyss-style) */}
      {hoverable && (
        <mesh
          ref={planeRef}
          scale={[PLANE_W, PLANE_H, 1]}
          frustumCulled={false}
          renderOrder={9999}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            if (interactive) document.body.style.cursor = "pointer";
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setHovered(false);
            if (interactive) document.body.style.cursor = "default";
          }}
          onPointerDown={(e) => {
            if (!interactive) return;
            e.stopPropagation();
            movedRef.current = false;
            startRef.current = [e.clientX, e.clientY];
            lastRef.current  = [e.clientX, e.clientY];

            const se = document.scrollingElement || document.documentElement;
            scrollStartRef.current = (se?.scrollTop ?? window.scrollY ?? 0);

            if (!isMobile) {
              draggingRef.current = true;
              draggingRefForBreath.current = true;
              setControlsEnabled(false);
            }
            document.body.style.cursor = "grabbing";
          }}
          onPointerMove={(e) => {
            // some embedded browsers (e.g., social in-app) can skip pointerover; keep hover alive on move
            if (!hovered) setHovered(true);
            if (!interactive) return;
            e.stopPropagation();
            if (isMobile || !draggingRef.current || !rootRef.current) return;
            const [lx, ly] = lastRef.current;
            const dx = e.clientX - lx;
            const dy = e.clientY - ly;
            if (Math.abs(dx) + Math.abs(dy) > 2) movedRef.current = true;

            rootRef.current.rotation.y += dx * ROT_Y;
            const nextX = rootRef.current.rotation.x + dy * ROT_X;
            rootRef.current.rotation.x = Math.max(-CLAMP_X, Math.min(CLAMP_X, nextX));

            lastRef.current = [e.clientX, e.clientY];
          }}
          onPointerUp={(e) => {
            if (!interactive) return;
            e.stopPropagation();
            if (!isMobile) {
              draggingRef.current = false;
              draggingRefForBreath.current = false;
              setControlsEnabled(true);
              const [sx, sy] = startRef.current;
              const dx = Math.abs(e.clientX - sx);
              const dy = Math.abs(e.clientY - sy);
              if (!movedRef.current && dx <= 4 && dy <= 4) onActivate(id);
            }
            document.body.style.cursor = "pointer";
          }}
          onPointerLeave={(e) => {
            e.stopPropagation();
            if (!interactive) { setHovered(false); return; }
            if (!isMobile && draggingRef.current) {
              draggingRef.current = false;
              draggingRefForBreath.current = false;
              setControlsEnabled(true);
              document.body.style.cursor = "default";
            }
          }}
          onClick={(e) => {
            if (!isMobile) return; // desktop handled in pointerUp
            e.stopPropagation();
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
          <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* ===== VISUALS (inside breathing group) ===== */}
      <a.group ref={breathRef} scale={s}>
        <group ref={visualsRef} raycast={NO_RAYCAST}>
          {/* EARTH */}
          {(visibleSub === "earth" || visibleSub === "all") && (
            <group
              ref={earthRef}
              raycast={NO_RAYCAST}
              position={[0, -8, -0.6]}
              rotation={[0, 0, 0]}
            >
              <LumenEarth items={earth} />
              {subHitplanes && (
                <SubHitPlane
                  groupRef={earthRef}
                  size={[13, 8]}
                  offset={1.0}
                  rotateTarget="self"
                  onOpen={() => onActivate("cluster-lumen")}
                />
              )}
            </group>
          )}

          {/* MOON */}
          {(visibleSub === "moon" || visibleSub === "all") && (
            <group
              ref={moonRef}
              raycast={NO_RAYCAST}
              position={[-2, -2.5, -0.25]}
              >
              <LumenMoon items={moon} />
              {subHitplanes && (
                <SubHitPlane
                  groupRef={moonRef}
                  size={[5.5, 4.2]}
                  offset={1.0}
                  rotateTarget="self"
                  onOpen={() => onActivate("cluster-lumen")}
                />
              )}
            </group>
          )}

          {/* SPACE (dome rotates with space group) */}
          {(visibleSub === "space" || visibleSub === "all") && (
            <group
              ref={spaceRef}
              raycast={NO_RAYCAST}
              position={[1, -6, -5]}
              rotation={[0, deg(5), 0]}
            >
              {/* <group raycast={NO_RAYCAST}>
              <LumenStarfield
                // placement
                position={[-1, 4, 4]}
                rotation={[0, 0, 0]}

                // starfield volume
                innerR={3.6}
                outerR={11.5}
                height={2.4}

                // clustering / color
                anchor={[0.9, 0.25, 0.0]}
                focusRadius={1.45}
                focusBoost={0.82}
                warm="#f6c27a"
                cool="#8bb8ff"

                // density / look (thicker!)
                count={3600}
                size={0.022}
                opacity={0.96}
                frontFraction={0.42}
                frontSizeMul={1.22}
                frontOpacityMul={0.66}
                giantsFraction={0.06}
                giantsSizeMul={3.4}

                // motion
                twinkleAmplitude={0.30}
                twinkleSpeed={1.0}
                yawSpeedBack={0.14}
                yawSpeedFront={0.22}
                yawSpeedGiants={0.22}

                // fog (NEW, replaces nebula)
                fogEnabled = {false}
                fogOpacity={0.36}
                fogColor="#bfe6ff"
                fogLayers={6}
                fogScale={[10, 10]}
                fogSpread={[1.8, 1.2, 1.0]}
                fogDrift={0.065}
              />
              </group> */}
              <LumenSpace items={space} />
              {subHitplanes && (
                <SubHitPlane
                  groupRef={spaceRef}
                  size={[14.0, 6.8]}
                  offset={1.4}
                  rotateTarget="self"
                  onOpen={() => onActivate("cluster-lumen")}
                />
              )}
            </group>
          )}
        </group>
      </a.group>
    </group>
  );
}
