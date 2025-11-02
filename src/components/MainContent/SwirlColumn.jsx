// SwirlColumn.jsx — calm, reversed-taper helix; spawn-from-back; videos slightly larger
import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import Panel from "./Panel";
import ImageOverlay from "./ImageOverlay";
import PanelVideoFace from "./PanelVideoFace";

function Face({ item }) {
  const url = item?.url ?? "";
  const isVideo = item.type === "video" || /\.mp4$/i.test(url);
  const [w, h] = Array.isArray(item.size) ? item.size : [1, 1];
  return isVideo
    ? <PanelVideoFace url={url} width={w} height={h} fit="contain" />
    : <ImageOverlay url={item.thumb || url} />;
}

export default function SwirlColumn({
  items = [],
  animate = true,
  baseY = 0.18,
  height = 8,             // helix height
  baseRadius = 1.0,         // smaller radius at top
  topRadius = 4.4,          // larger radius near base
  turns = 1.75,
  periodSec = 90,           // bigger = slower
  fadePortion = 0.2,
  panelThickness = 0.03,
  tint = "#bdaee6",
  roughness = 0.35,
  videoScale = 1.32,        // videos a little larger
  anchorSpawnBehind = true, // fade-in happens at back relative to camera
  spawnAngleOffset = 0,     // tweak spawn angle relative to anchor direction
  orientation = "yawOnly",  // "yawOnly" | "fixed" | "camera"
  renderOrder = 25,
}) {
  const groupRef = useRef();
  const refs = useRef([]);
  refs.current = [];
  const pauseStartRef = useRef(null);
  const timeOffsetRef = useRef(0);
  const phaseRef = useRef(0);

  const TWO_PI_TURNS = useMemo(() => Math.PI * 2 * turns, [turns]);
  const H = Math.max(1e-4, height);

  // constant slight forward tilt (used by yawOnly + fixed)
  const tiltX = THREE.MathUtils.degToRad(-2);
  const fixedQuat = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromEuler(new THREE.Euler(tiltX, 0, 0, "YXZ"));
    return q;
  }, [tiltX]);

  useFrame(({ clock, camera }) => {
    const elapsed = clock.getElapsedTime ? clock.getElapsedTime() : clock.elapsedTime;
    const g = groupRef.current;
    if (!g || items.length === 0) return;

    let adjusted = elapsed - timeOffsetRef.current;
    if (!animate) {
      if (pauseStartRef.current === null) pauseStartRef.current = elapsed;
      adjusted = (pauseStartRef.current ?? elapsed) - timeOffsetRef.current;
    } else if (pauseStartRef.current !== null) {
      timeOffsetRef.current += elapsed - pauseStartRef.current;
      pauseStartRef.current = null;
      adjusted = elapsed - timeOffsetRef.current;
    }

    const cyc = periodSec > 0 ? (adjusted / periodSec) % 1 : 0; // 0..1
    if (animate) phaseRef.current = cyc;
    const activePhase = animate ? cyc : phaseRef.current;

    // camera in GROUP-LOCAL space, and rear angle for spawn
    const camLocal = g.worldToLocal(camera.position.clone());
    const onXZ = camLocal.clone().setY(0);
    const camDir = onXZ.lengthSq() > 1e-6 ? onXZ.clone().normalize() : new THREE.Vector3(0,0,1);
    const rearAngle = Math.atan2(-camDir.z, -camDir.x); // angle pointing to "behind"

    for (let i = 0; i < refs.current.length; i++) {
      const node = refs.current[i];
      if (!node) continue;

      const uBase = i / items.length;        // 0..1
      const u = (uBase + activePhase) % 1;   // advance + wrap

      // helix position
      const phi0 = anchorSpawnBehind ? rearAngle + spawnAngleOffset : spawnAngleOffset;
      const ang  = phi0 + u * TWO_PI_TURNS;

      const y = baseY + u * H;
      // reversed taper: big near base → small at top
      const r = THREE.MathUtils.lerp(topRadius, baseRadius, u);

      node.position.set(Math.cos(ang) * r, y, Math.sin(ang) * r);

      // -------- orientation (no self-spin) ----------
      if (orientation === "camera") {
        // original full billboarding (kept for completeness)
        node.lookAt(camLocal);
        node.rotation.x += tiltX;
      } else if (orientation === "yawOnly") {
        // only yaw to face camera, fixed tilt, zero roll
        const toCam = camLocal.clone().sub(node.position).setY(0);
        const yaw = Math.atan2(toCam.x, toCam.z); // Y rotation toward camera
        node.rotation.set(tiltX, yaw, 0, "YXZ");
      } else {
        // "fixed" — keep constant orientation (slight forward tilt)
        node.quaternion.copy(fixedQuat);
      }

      // fade near bottom & top (no popping)
      const aIn  = THREE.MathUtils.smoothstep(u, 0.0, fadePortion);
      const aOut = 1.0 - THREE.MathUtils.smoothstep(u, 1.0 - fadePortion, 1.0);
      
      const a = Math.min(aIn, aOut);

      // apply opacity to the small subtree
      node.traverse((o) => {
        const m = o.material;
        if (!m) return;
        const apply = (mat) => {
          if (!mat) return;
          mat.transparent = true;
          mat.opacity = a;
          if (mat.uniforms?.uOpacity) {
            mat.uniforms.uOpacity.value = a;
            mat.uniformsNeedUpdate = true;
          }
          if (a < 1 && mat.depthWrite) mat.depthWrite = false;
        };
        if (Array.isArray(m)) m.forEach(apply);
        else apply(m);
      });
    }
  });

  return (
    <group ref={groupRef} renderOrder={renderOrder}>
      {items.map((item, i) => {
        const url = item?.url ?? "";
        const isVideo = item.type === "video" || /\.mp4$/i.test(url);
        const [w, h]   = Array.isArray(item.size) ? item.size : [1, 1];
        const scaleMul = isVideo ? videoScale : 1.0;
        const scale = [w * scaleMul, h * scaleMul, 1];
        return (
          <group key={i} ref={(el) => (refs.current[i] = el)} scale={scale}>
            <Panel thickness={panelThickness} tint={tint} roughness={roughness} />
            <Face item={item} />
          </group>
        );
      })}
    </group>
  );
}
