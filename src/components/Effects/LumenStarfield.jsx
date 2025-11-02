// src/components/Effects/LumenStarfield.jsx
import * as THREE from "three";
import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

// ─────────────────────────────────────────────────────────────
// Tiny deterministic PRNG
// ─────────────────────────────────────────────────────────────
function mulberry32(seed) {
  let t = (seed >>> 0) || 1;
  return function () {
    t += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─────────────────────────────────────────────────────────────
// Soft radial "fog" sprite texture (additive)
// ─────────────────────────────────────────────────────────────
function makeFogTexture({ size = 512 } = {}) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");

// Soft ring: no bright core → no white blob
const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size*0.5);
g.addColorStop(0.00, "rgba(255,255,255,0)");      // hollow center
g.addColorStop(0.25, "rgba(255,255,255,0.18)");
g.addColorStop(0.60, "rgba(255,255,255,0.06)");
g.addColorStop(1.00, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/**
 * Starfield: back / front / giants layers + soft additive fog sprites.
 * Additive blending, warm–cool mix, clustered near anchor, framerate-independent yaw.
 */
export default function LumenStarfield({
  // density/volume
  count = 1400,
  innerR = 3.6,
  outerR = 11.5,
  height = 2.2,

  // cluster focus (local space coords near your "space" images)
  anchor = [0.8, 0.15, 0.0],
  focusRadius = 1.2,
  focusBoost = 0.55,

  // look
  size = 0.014,
  opacity = 0.85,
  warm = "#f6c27a",
  cool = "#8bb8ff",

  // layering
  frontFraction = 0.18,
  frontSizeMul = 0.95,
  frontOpacityMul = 0.7,
  giantsFraction = 0.0,
  giantsSizeMul = 3.0,

  // twinkle
  twinkleAmplitude = 0.22,
  twinkleSpeed = 1.6,

  // rotation (yaw, rad/sec)
  yawSpeedBack = 0.12,
  yawSpeedFront = 0.16,
  yawSpeedGiants = 0.16,

  // soft fog (replaces nebula)
  fogEnabled = true,
  fogOpacity = 0.36,
  fogColor = "#bfe6ff",
  fogLayers = 6,               // number of sprites
  fogScale = [10, 10],         // base sprite size in local units (XZ)
  fogSpread = [1.8, 1.2, 1.0], // [x,z,y] spread around anchor
  fogDrift = 0.065,            // left→right drift to match star motion

  // misc
  seed = 12,

  // transform
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
}) {
  const warmColor = useMemo(
    () => (warm instanceof THREE.Color ? warm : new THREE.Color(warm)),
    [warm]
  );
  const coolColor = useMemo(
    () => (cool instanceof THREE.Color ? cool : new THREE.Color(cool)),
    [cool]
  );

  const backRef   = useRef();
  const frontRef  = useRef();
  const giantsRef = useRef();

  // ─────────────────────────────────────────────────────────────
  // Build star layers
  // ─────────────────────────────────────────────────────────────
  const { back, front, giants } = useMemo(() => {
    const rng = mulberry32(Number(seed));
    const total = Math.max(1, count | 0);

    const giantsCount = Math.max(0, Math.floor(total * giantsFraction));
    const remaining   = total - giantsCount;

    const frontCount  = Math.max(0, Math.floor(remaining * frontFraction));
    const backCount   = Math.max(0, remaining - frontCount);

    const A  = new THREE.Vector3().fromArray(anchor);
    const A1 = A.clone().add(new THREE.Vector3( 0.6,  0.15, -0.3));
    const A2 = A.clone().add(new THREE.Vector3(-0.5, -0.10,  0.4));

    function samplePos() {
      const t = rng();               // radius bias
      const u = rng() * Math.PI * 2; // angle
      const r = THREE.MathUtils.lerp(innerR, outerR, t * t);
      const x = Math.cos(u) * r;
      const z = Math.sin(u) * r;
      const y = (rng() - 0.35) * height;
      return new THREE.Vector3(x, y, z);
    }

    function pushStar(i, posArr, colArr, rangeWarmCool, anchorBias = 1.0) {
      let v = samplePos();
      const pick = rng();
      const target = pick < 0.70 ? A : (pick < 0.85 ? A1 : A2);
      const d    = v.distanceTo(target);
      const fall = THREE.MathUtils.smoothstep(d, focusRadius * 2.2, outerR);
      v = v.lerp(target, focusBoost * anchorBias * (1.0 - fall));

      const k = i * 3;
      posArr[k + 0] = v.x;
      posArr[k + 1] = v.y;
      posArr[k + 2] = v.z;

      const mix = THREE.MathUtils.lerp(rangeWarmCool[0], rangeWarmCool[1], rng());
      const c   = warmColor.clone().lerp(coolColor, mix);
      colArr[k + 0] = c.r;
      colArr[k + 1] = c.g;
      colArr[k + 2] = c.b;
    }

    function makeLayer(n, rangeWarmCool = [0.35, 0.8], anchorBias = 1.0) {
      const pos = new Float32Array(n * 3);
      const col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) pushStar(i, pos, col, rangeWarmCool, anchorBias);
      return { positions: pos, colors: col };
    }

    const back   = makeLayer(backCount,   [0.25, 0.75], 1.0);
    const front  = makeLayer(frontCount,  [0.15, 0.55], 1.15);
    const giants = makeLayer(giantsCount, [0.10, 0.45], 1.25);

    return { back, front, giants };
  }, [
    count, innerR, outerR, height,
    anchor, focusRadius, focusBoost,
    frontFraction, giantsFraction,
    warmColor, coolColor, seed
  ]);

  // ─────────────────────────────────────────────────────────────
  // Fog sprites (simple additive billboards)
  // ─────────────────────────────────────────────────────────────
  const fogTex  = useMemo(() => (fogEnabled ? makeFogTexture({ size: 512 }) : null), [fogEnabled]);
  const fogMat  = useMemo(() => {
    if (!fogEnabled || !fogTex) return null;
    return new THREE.SpriteMaterial({
      map: fogTex,
      color: new THREE.Color(fogColor),
      transparent: true,
      opacity: fogOpacity,
      depthTest: false,         // draw over MP4/panels
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [fogEnabled, fogTex, fogColor, fogOpacity]);

  const fogRefs = useRef([]);

  // ─────────────────────────────────────────────────────────────
  // Animate: twinkle + yaw + fog drift
  // ─────────────────────────────────────────────────────────────
  useFrame((_, delta) => {
    const now = performance.now() * 0.001;

    if (backRef.current) {
      const m = backRef.current.material;
      m.opacity = opacity * (0.92 + Math.sin(now * twinkleSpeed * 0.7) * 0.08);
      m.size    = size * (1 + Math.sin(now * twinkleSpeed) * (twinkleAmplitude * 0.25));
      backRef.current.rotation.y += delta * yawSpeedBack;
    }
    if (frontRef.current) {
      const m = frontRef.current.material;
      m.opacity = (opacity * frontOpacityMul) *
                  (0.90 + Math.sin(now * twinkleSpeed * 0.9 + 1.1) * 0.10);
      m.size    = (size * frontSizeMul) *
                  (1 + Math.sin(now * twinkleSpeed * 1.15 + 0.6) * (twinkleAmplitude * 0.28));
      frontRef.current.rotation.y += delta * yawSpeedFront;
    }
    if (giantsRef.current) {
      const m = giantsRef.current.material;
      m.opacity = 1.0 * (0.92 + Math.sin(now * twinkleSpeed * 0.6 + 0.3) * 0.06);
      m.size    = (size * giantsSizeMul) *
                  (1 + Math.sin(now * twinkleSpeed * 0.85 + 0.9) * (twinkleAmplitude * 0.12));
      giantsRef.current.rotation.y += delta * yawSpeedGiants;
    }

    // Fog: gentle left→right drift + tiny shimmer in size
    if (fogEnabled && fogRefs.current.length) {
      for (const s of fogRefs.current) {
        if (!s) continue;
        s.position.x += fogDrift * delta;                      // same direction as starfield
        const base = s.userData.baseScale;
        const phase = s.userData.phase || 0;
        const wobble = 1 + Math.sin(now + phase) * 0.02;       // subtle size shimmer
        s.scale.set(base[0] * wobble, base[1] * wobble, 1);
      }
    }
  });

  // Helper: build a Points mesh from buffers
  const buildPoints = (buffers, opts) => (
    <points
      ref={opts.ref}
      position={position}
      rotation={rotation}
      scale={scale}
      renderOrder={opts.renderOrder}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={buffers.positions}
          count={buffers.positions.length / 3}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          array={buffers.colors}
          count={buffers.colors.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={opts.size}
        transparent
        depthWrite={false}
        depthTest={opts.depthTest}
        vertexColors
        blending={THREE.AdditiveBlending}
        opacity={opts.opacity}
        sizeAttenuation
      />
    </points>
  );

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* Back layer (depthTest ON) */}
      {back.positions.length > 0 &&
        buildPoints(back, { ref: backRef, size, opacity, depthTest: true, renderOrder: 0 })}

      {/* Giants (depthTest ON) */}
      {giants.positions.length > 0 &&
        buildPoints(giants, { ref: giantsRef, size: size * giantsSizeMul, opacity: 1.0, depthTest: true, renderOrder: 5 })}

      {/* Front layer (depthTest OFF) */}
      {front.positions.length > 0 &&
        buildPoints(front, { ref: frontRef, size: size * frontSizeMul, opacity: opacity * frontOpacityMul, depthTest: false, renderOrder: 10 })}

      {/* Soft fog sprites (depthTest OFF, render after stars) */}
      {fogEnabled && fogMat && (() => {
        const [SX, SY] = fogScale;
const N = Math.max(1, fogLayers|0);
fogRefs.current = new Array(N);

const sprites = [];
const anchorV = new THREE.Vector3().fromArray(anchor);
const rand = mulberry32(seed + 999);

// keep a clean hole in the middle so additive can’t nuke the scene
const rMin = 1.0;      // ← push fog off the exact center
const rMax = 2.2;

for (let i = 0; i < N; i++) {
  const t = i / Math.max(1, N - 1);
  const ang = rand() * Math.PI * 2;
  const rad = rMin + (rMax - rMin) * (0.45 + t * 0.5); // larger outward
  const px = anchorV.x + Math.cos(ang) * rad;
  const pz = anchorV.z + Math.sin(ang) * rad;
  const py = anchorV.y + (t - 0.5) * (fogSpread?.[2] ?? 1.0);

  const sMul  = 0.9 + t * 0.6;
  const sx    = SX * sMul;
  const sy    = SY * sMul;
  const phase = i * 0.8;

  sprites.push(
    <sprite
      key={`fog-${i}`}
      ref={el => (fogRefs.current[i] = el)}
      position={[px, py, pz]}
      scale={[sx, sy, 1]}
      renderOrder={40 + i}
      userData={{ phase, baseScale: [sx, sy] }}
    >
      <primitive object={fogMat} attach="material" />
    </sprite>
  );
}
return <group position={position} rotation={rotation} scale={scale}>{sprites}</group>;
      })()}
    </>
  );
}