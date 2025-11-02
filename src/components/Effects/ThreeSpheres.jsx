// ThreeSpheres.jsx — penumbra spheres with per-sphere tweaks & manual adds
import React, { useRef } from "react";
import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend, useFrame } from "@react-three/fiber";

/* ---------- cheap penumbra rim shader ---------- */
const PenumbraSphereMaterial = shaderMaterial(
  {
    innerColor: new THREE.Color("#000000"),
    rimColor:   new THREE.Color("#E7DBF1"),
    rimPower:   2.4,
    glow:       0.9,
    alpha:      0.95,
  },
  /* vert */`
    varying vec3 vN, vV;
    void main(){
      vec4 w = modelMatrix * vec4(position,1.0);
      vN = normalize(normalMatrix * normal);
      vV = normalize(cameraPosition - w.xyz);
      gl_Position = projectionMatrix * viewMatrix * w;
    }
  `,
  /* frag */`
    uniform vec3  innerColor, rimColor;
    uniform float rimPower, glow, alpha;
    varying vec3  vN, vV;
    void main(){
      float rim = pow(1.0 - max(0.0, dot(vN, vV)), rimPower);
      vec3 col = mix(innerColor, rimColor, clamp(rim * glow, 0.0, 1.0));
      gl_FragColor = vec4(col, alpha);
    }
  `
);
extend({ PenumbraSphereMaterial });

/* ---------- helpers ---------- */
function as3(a, fallback) {
  if (Array.isArray(a)) return [a[0] ?? fallback, a[1] ?? fallback, a[2] ?? fallback];
  return [a ?? fallback, a ?? fallback, a ?? fallback];
}

/**
 * Props:
 *  - baseY, gap, radii, color, renderOrder, center
 *  - sidePairs [l0,l1,l2], sideDistance [l0,l1,l2], sideSizeMul [l0,l1,l2], sideAngleDeg
 *  - tweaks: { id -> { offset?:[dx,dy,dz], position?:[x,y,z], radius?, color?, alpha?, glow? } }
 *      IDs: center0|center1|center2,  L{level}-P{pairIndex}-{left|right}
 *  - manual: [{ position:[x,y,z], radius, color?, alpha?, glow? }]
 *  - pulse (subtle glow), pulseAmp, pulseSpeed
 */
export default function ThreeSpheres({
  baseY = 0.1,
  gap = 0.42,
  radii = [0.34, 0.22, 0.14],  // bottom → top
  color = "#E7DBF1",
  renderOrder = 18,

  center = true,

  sidePairs = [1, 1, 1],
  sideDistance = [0.6, 0.75, 0.9],
  sideSizeMul  = [0.8, 0.7, 0.6],
  sideAngleDeg = 22,

  tweaks = {},
  manual = [],

  pulse = false,
  pulseAmp = 0.06,
  pulseSpeed = 0.7,
}) {
  const mats = useRef([]);

  const r    = as3(radii, radii[0] || 0.3);
  const pairs= as3(sidePairs, 0);
  const dist = as3(sideDistance, 0.7);
  const mul  = as3(sideSizeMul, 0.75);

  const y0 = baseY;
  const y1 = baseY + gap;
  const y2 = baseY + gap * 2.0;

  // Optional super-subtle glow pulse (stationary spheres)
  useFrame(() => {
    if (!pulse) return;
    const t = performance.now() * 0.001 * pulseSpeed;
    for (let i = 0; i < mats.current.length; i++) {
      const m = mats.current[i];
      if (!m) continue;
      m.glow = 0.9 + pulseAmp * Math.sin(t + i * 0.37);
    }
  });

  // Build a descriptor list → apply tweaks → render
  const desc = [];

  // Center stack
  if (center) {
    desc.push({ id: "center0", position: [0, y0, 0], radius: r[0], color });
    desc.push({ id: "center1", position: [0, y1, 0], radius: r[1], color });
    desc.push({ id: "center2", position: [0, y2, 0], radius: r[2], color });
  }

  // Side pairs per level
  const angleStep = THREE.MathUtils.degToRad(Math.max(1, sideAngleDeg));
  const levels = [
    { i:0, y:y0, rad:r[0], d:dist[0], m:mul[0], p:Math.max(0, pairs[0]) },
    { i:1, y:y1, rad:r[1], d:dist[1], m:mul[1], p:Math.max(0, pairs[1]) },
    { i:2, y:y2, rad:r[2], d:dist[2], m:mul[2], p:Math.max(0, pairs[2]) },
  ];

  for (const lvl of levels) {
    const size = lvl.rad * lvl.m;
    for (let k = 0; k < lvl.p; k++) {
      const a = (k + 1) * angleStep;
      const ax = Math.cos(a) * lvl.d;
      const az = Math.sin(a) * lvl.d;

      desc.push({
        id: `L${lvl.i}-P${k}-left`,
        position: [ ax, lvl.y,  az],
        radius: size,
        color,
      });
      desc.push({
        id: `L${lvl.i}-P${k}-right`,
        position: [-ax, lvl.y, -az],
        radius: size,
        color,
      });
    }
  }

  // Apply tweaks (offset / position / radius / color / alpha / glow)
  function applyTweak(d) {
    const t = tweaks?.[d.id];
    if (!t) return d;
    const out = { ...d };
    if (Array.isArray(t.offset)) {
      out.position = [
        out.position[0] + (t.offset[0] || 0),
        out.position[1] + (t.offset[1] || 0),
        out.position[2] + (t.offset[2] || 0),
      ];
    }
    if (Array.isArray(t.position)) {
      out.position = [t.position[0] || 0, t.position[1] || 0, t.position[2] || 0];
    }
    if (typeof t.radius === "number") out.radius = t.radius;
    if (t.color) out.color = t.color;
    if (typeof t.alpha === "number") out.alpha = t.alpha;
    if (typeof t.glow  === "number") out.glow  = t.glow;
    return out;
  }

  const finalDesc = desc.map(applyTweak);

  // Manual spheres appended
  for (let i = 0; i < manual.length; i++) {
    const m = manual[i] || {};
    if (!Array.isArray(m.position)) continue;
    finalDesc.push({
      id: `manual-${i}`,
      position: [m.position[0] || 0, m.position[1] || 0, m.position[2] || 0],
      radius: m.radius ?? 0.1,
      color:  m.color  || color,
      alpha:  m.alpha  ?? 0.95,
      glow:   m.glow   ?? 0.9,
    });
  }

  // Render
  let matIndex = 0;
  return (
    <group renderOrder={renderOrder}>
      {finalDesc.map((d) => (
        <mesh key={d.id} position={d.position}>
          <sphereGeometry args={[Math.max(1e-4, d.radius), 32, 32]} />
          <penumbraSphereMaterial
            ref={(el) => (mats.current[matIndex++] = el)}
            innerColor={new THREE.Color("#000")}
            rimColor={new THREE.Color(d.color || color)}
            rimPower={2.4}
            glow={d.glow ?? 0.9}
            alpha={d.alpha ?? 0.95}
          />
        </mesh>
      ))}
    </group>
  );
}