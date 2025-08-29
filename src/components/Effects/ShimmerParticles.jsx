// ShimmerParticles.jsx
// src/components/Effects/ShimmerParticles.jsx
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';


// ---- soft circular sprite ----
function makeCircleSprite(size = 64) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  g.addColorStop(0.00, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.6)');
  g.addColorStop(1.00, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  return tex;
}

export default function ShimmerParticles({
  center = [0,0,0],
  normal = [0,1,0],

  // scale with disk radius (if provided)
  scaleWith = null,
  innerRatio = 0.75,
  outerRatio = 1.02,

  // absolute fallbacks (used when scaleWith is null)
  innerRadius = 1.05,
  outerRadius = 1.35,

  // motion (portal mode)
  spawnRate = 120,
  life = 3.0,
  liftStart = -0.10,
  sinkDepth = -3.0,        // how far down to aim (along normal)
  fallSpeed = 0.06,        // base downward speed
  attractStrength = 1.2,   // vertical-only pull
  swirl = 0.05,            // subtle randomness

  // band keeper (prevents a cone)
  keepBand = true,
  bandSpring = 2.0,        // how strongly we keep radius ~ initial
  bandDamp = 0.985,

  // budget & look
  maxParticles = 1400,
  color = '#FF2626',
  size = 2.0,
  baseOpacity = 0.6,
  addGlow = true,
  glowSizeMul = 2.2,
  glowOpacityMul = 0.4,
}) {
  // derived ring & offsets
  const rIn   = scaleWith ? innerRatio * scaleWith : innerRadius;
  const rOut  = scaleWith ? outerRatio * scaleWith : outerRadius;
  const lift0 = scaleWith ? liftStart * scaleWith : liftStart;
  const sinkZ = scaleWith ? sinkDepth * scaleWith : sinkDepth;

  // plane basis
  const basis = useMemo(() => {
    const N = new THREE.Vector3(...normal).normalize();
    const helper = Math.abs(N.y) < 0.99 ? new THREE.Vector3(0,1,0) : new THREE.Vector3(1,0,0);
    const U = new THREE.Vector3().crossVectors(N, helper).normalize();
    const V = new THREE.Vector3().crossVectors(N, U).normalize();
    return { U, V, N };
  }, [normal]);

  // buffers
  const OFF = 1e6;
  const positions  = useMemo(() => { const a = new Float32Array(maxParticles*3); a.fill(OFF); return a; }, [maxParticles]);
  const velocities = useMemo(() => new Float32Array(maxParticles*3), [maxParticles]);
  const ages       = useMemo(() => new Float32Array(maxParticles).fill(0), [maxParticles]);
  const rTarget    = useMemo(() => new Float32Array(maxParticles).fill(0), [maxParticles]); // ← band target per particle

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  // two-pass materials (core + halo)
  const sprite = useMemo(() => makeCircleSprite(64), []);
  const coreMat = useMemo(() => new THREE.PointsMaterial({
    map: sprite, color, size:0.06, sizeAttenuation:false,
    transparent:true, opacity:baseOpacity, depthWrite:false, depthTest:false,
    blending:THREE.AdditiveBlending, toneMapped:false,
  }), [sprite, color, size, baseOpacity]);
  
  const haloMat = useMemo(() => new THREE.PointsMaterial({
    map: sprite, color, size: 0.06 * glowSizeMul, sizeAttenuation: true,
    transparent:true, opacity:baseOpacity*glowOpacityMul, depthWrite:false, depthTest:false,
    blending:THREE.AdditiveBlending, toneMapped:false,
  }), [sprite, color, size, baseOpacity, glowSizeMul, glowOpacityMul]);

  const writer = useMemo(() => ({ i:0 }), []);
  const spawnAcc = useRef(0);

  // sample ring (biased to rim)
  const sampleRing = () => {
    const a = Math.random() * Math.PI * 2;
    const t = Math.random();
    const r = rIn + (rOut - rIn) * Math.pow(t, 0.25);
    return { a, r };
  };

  // temps to avoid GC churn
  const C = useMemo(() => new THREE.Vector3(...center), [center]);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    const { U, V, N } = basis;
    C.set(...center); // allow animated center

    // vertical aim point (only along N)
    const sink = tmp.copy(C).addScaledVector(N, sinkZ);

    // continuous spawn
    spawnAcc.current += spawnRate * dt;
    const spawns = Math.floor(spawnAcc.current);
    if (spawns > 0) spawnAcc.current -= spawns;

    for (let s = 0; s < spawns; s++) {
      const i = writer.i % maxParticles; writer.i++;
      const j = i * 3;

      const { a, r } = sampleRing();
      const cos = Math.cos(a), sin = Math.sin(a);

      // start below disk
      const P = tmp.copy(C)
        .addScaledVector(U, cos * r)
        .addScaledVector(V, sin * r)
        .addScaledVector(N, lift0);

      positions[j]   = P.x;
      positions[j+1] = P.y;
      positions[j+2] = P.z;

      // initial vel: downward + tiny swirl
      velocities[j]   = -N.x * fallSpeed + (Math.random()-0.5) * swirl;
      velocities[j+1] = -N.y * fallSpeed + (Math.random()-0.5) * swirl;
      velocities[j+2] = -N.z * fallSpeed + (Math.random()-0.5) * swirl * 0.4;

      ages[i] = life;
      rTarget[i] = r; // remember the ring radius at spawn
    }

    // integrate
    for (let i = 0; i < maxParticles; i++) {
      const j = i * 3;
      if (ages[i] <= 0) { positions[j]=positions[j+1]=positions[j+2]=OFF; continue; }
      ages[i] -= dt;

      const Px = positions[j], Py = positions[j+1], Pz = positions[j+2];

      // relative to center
      const relX = Px - C.x, relY = Py - C.y, relZ = Pz - C.z;

      // decompose into (U,V,N): u = rel·U etc.
      const u = relX*U.x + relY*U.y + relZ*U.z;
      const v = relX*V.x + relY*V.y + relZ*V.z;
      const h = relX*N.x + relY*N.y + relZ*N.z;           // height along normal
      const rNow = Math.hypot(u, v);

      // 2a) vertical-only pull toward sink height
      const dh = (sinkZ) - h; // difference along N
      velocities[j]   += N.x * (dh * attractStrength) * dt;
      velocities[j+1] += N.y * (dh * attractStrength) * dt;
      velocities[j+2] += N.z * (dh * attractStrength) * dt;

      // 2b) keep radius near spawn radius to avoid a cone
      if (keepBand && rNow > 1e-6) {
        const rErr = (rTarget[i]) - rNow; // positive -> push outward
        const inv = 1 / rNow;
        // radial unit direction in world space = U*(u/r) + V*(v/r)
        const radX = U.x * (u*inv) + V.x * (v*inv);
        const radY = U.y * (u*inv) + V.y * (v*inv);
        const radZ = U.z * (u*inv) + V.z * (v*inv);
        velocities[j]   += radX * (rErr * bandSpring) * dt;
        velocities[j+1] += radY * (rErr * bandSpring) * dt;
        velocities[j+2] += radZ * (rErr * bandSpring) * dt;
      }

      // random micro-jitter + mild damping
      velocities[j]   = (velocities[j]   + (Math.random()-0.5)*swirl*0.25*dt) * bandDamp;
      velocities[j+1] = (velocities[j+1] + (Math.random() - 0.5) * swirl * 0.25 * dt) * bandDamp;
      velocities[j+2] = (velocities[j+2] + (Math.random()-0.5)*swirl*0.10*dt) * bandDamp;

      // update positions
      positions[j]   += velocities[j]   * dt;
      positions[j+1] += velocities[j+1] * dt;
      positions[j+2] += velocities[j+2] * dt;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeBoundingSphere?.();
  });

  // render
  return (
    <>
      <points geometry={geometry} material={coreMat} raycast={null} frustumCulled={false} renderOrder={18}/>
      {addGlow && (
        <points geometry={geometry} material={haloMat} raycast={null} frustumCulled={false} renderOrder={17}/>
      )}
    </>
  );
}
