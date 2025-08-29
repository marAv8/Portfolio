// src/components/Effects/RimCrownArc.jsx
import React, { useMemo } from 'react';
import * as THREE from 'three';
import RadialFadeDisk from './RadialFadeDisk';

const mix = (a, b, t) => a + (b - a) * t;
const mix3 = (A, B, t) => [mix(A[0], B[0], t), mix(A[1], B[1], t), mix(A[2], B[2], t)];

// travel the LONG way (via the back)
function lerpAngleLong(a0, a1, t) {
  let da = a1 - a0;
  if (Math.abs(da) < Math.PI) da = da + (da > 0 ? -2 * Math.PI : 2 * Math.PI);
  return a0 + da * t;
}

// Deep / base / bright reds (0..1)
const DEFAULT_REDS = [
  [0.55, 0.00, 0.00],
  [0.85, 0.05, 0.05],
  [1.00, 0.12, 0.12],
];

export default function RimCrownArc({
  // path geometry
  baseRadius = 12,
  inset = 0.9,
  thetaStartDeg = 135,
  thetaEndDeg   = 45,
  samples = 13,

  // vertical arch (∩)
  yEdge = 0.10,
  amp = 3.4,
  curve = 1.45,

  // look along the arc (ends thicker/larger)
  radEdge = 1.20,
  radCenter = 0.78,
  heightEdge = 0.34,
  heightCenter = 0.22,
  opacityEdge = 0.85,
  opacityCenter = 0.55,

  // color ramp deep → bright → deep
  palette = DEFAULT_REDS,

  // subtle Z push
  pushBack = -0.15,

  // ✅ end-overlap control (keeps last disks off the base rim)
  edgeSelfInsetMul = 0.60,
  edgeInset = 0.18,
  edgeLift = 0.06,
  edgeFeatherExp = 1.4,

  // ✨ GLOW controls (new)
  addGlow = true,
  glowRadiusMul = 1.35,        // a bit larger than core disk
  glowHeightMul = 1.00,        // same thickness; we rely on power+opacity to soften
  glowPower = 1.2,             // lower power → broader/softer falloff
  glowColor = [1.0, 0.20, 0.20],// slightly brighter red
  glowOpacityEdge = 0.55,      // stronger at the ends
  glowOpacityCenter = 0.18,    // calmer near apex so hero stays dominant
  glowStrength = 1.0,          // master gain (set 0.7–1.3 if you want quick tuning)

  // (optional) a second, very faint outer aura
  doubleGlow = true,
  glow2RadiusMul = 1.6,
  glow2OpacityEdge = 0.18,
  glow2OpacityCenter = 0.06,
  glow2Power = 1.1,

  // pass-through
  raycast = null,
  ...groupProps
}) {
  const items = useMemo(() => {
    const out = [];
    const rNominal = baseRadius - inset;
    const a0 = THREE.MathUtils.degToRad(thetaStartDeg);
    const a1 = THREE.MathUtils.degToRad(thetaEndDeg);

    for (let i = 0; i < samples; i++) {
      const s = samples === 1 ? 0 : i / (samples - 1);

      // angle along long path (apex behind hero)
      const ang = lerpAngleLong(a0, a1, s);

      // arch shape (0 at ends, 1 at center)
      const arch = Math.pow(Math.sin(Math.PI * s), curve);

      // end weight (1 at ends, 0 at center)
      const tEnd = Math.pow(Math.abs(2 * s - 1), edgeFeatherExp);

      // size/opacity along arc
      const radius  = mix(radCenter,  radEdge,  tEnd);
      const height  = mix(heightCenter, heightEdge, tEnd);
      const opacity = mix(opacityCenter, opacityEdge, tEnd);

      // end-aware inward inset to avoid rim overlap
      const selfInset  = edgeSelfInsetMul * radius * tEnd;
      const extraInset = edgeInset * tEnd;
      const rPath = rNominal - selfInset - extraInset;

      // base position
      const x = Math.cos(ang) * rPath;
      const z = Math.sin(ang) * rPath + pushBack;
      const y = yEdge + amp * arch + edgeLift * tEnd;

      // color deep → bright → deep
      const deep = palette[0] ?? DEFAULT_REDS[0];
      const bright = palette[2] ?? DEFAULT_REDS[2];
      const col = s < 0.5 ? mix3(deep, bright, s * 2) : mix3(bright, deep, (s - 0.5) * 2);

      // --- core disk ---
      out.push(
        <RadialFadeDisk
          key={`core-${i}`}
          raycast={raycast}
          color={col}
          radius={radius}
          height={height}
          power={2.3}
          rotation={[0, 0, 0]}
          position={[x, y, z]}
          opacity={opacity}
        />
      );

      if (addGlow) {
        // Opacity taper for glow (stronger at ends so edges read clearly)
        const gOpacity = glowStrength * mix(glowOpacityCenter, glowOpacityEdge, tEnd);

        out.push(
          <RadialFadeDisk
            key={`glow1-${i}`}
            raycast={raycast}
            color={glowColor}
            radius={radius * glowRadiusMul}
            height={height * glowHeightMul}
            power={glowPower}
            rotation={[0, 0, 0]}
            position={[x, y + 0.01, z]} // micro lift to avoid z-fighting shimmer
            opacity={gOpacity}
          />
        );

        if (doubleGlow) {
          const g2Opacity = glowStrength * mix(glow2OpacityCenter, glow2OpacityEdge, tEnd);
          out.push(
            <RadialFadeDisk
              key={`glow2-${i}`}
              raycast={raycast}
              color={glowColor}
              radius={radius * glow2RadiusMul}
              height={height}
              power={glow2Power}
              rotation={[0, 0, 0]}
              position={[x, y + 0.015, z]}
              opacity={g2Opacity}
            />
          );
        }
      }
    }
    return out;
  }, [
    baseRadius, inset, thetaStartDeg, thetaEndDeg, samples,
    yEdge, amp, curve,
    radEdge, radCenter, heightEdge, heightCenter, opacityEdge, opacityCenter,
    palette, pushBack,
    edgeSelfInsetMul, edgeInset, edgeLift, edgeFeatherExp,
    addGlow, glowRadiusMul, glowHeightMul, glowPower, glowColor,
    glowOpacityEdge, glowOpacityCenter, glowStrength,
    doubleGlow, glow2RadiusMul, glow2OpacityEdge, glow2OpacityCenter, glow2Power,
    raycast,
  ]);

  return <group raycast={raycast} {...groupProps}>{items}</group>;
}
