// src/components/Effects/PenumbraSphere.jsx
import React, { useRef } from "react";
import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend, useFrame } from "@react-three/fiber";

/** Black core + lilac rim, with optional pulse + light sweep */
const PenumbraSphereMaterial = shaderMaterial(
  {
    innerColor: new THREE.Color("#000000"),
    rimColor:   new THREE.Color("#E7DBF1"),
    rimPower:   2.4,
    glow:       0.9,
    alpha:      0.95,
    // sweep uniforms
    time:       0,
    sweepAmp:   0.18,   // brightness of moving band
    sweepSpeed: 0.35,   // rotation speed of the band
    sweepWidth: 0.45,   // how wide/soft the band is (0..1)
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
    uniform float time, sweepAmp, sweepSpeed, sweepWidth;
    varying vec3  vN, vV;

    void main(){
      // classic rim
      float rim = pow(1.0 - max(0.0, dot(vN, vV)), rimPower);

      // gentle rotating band in view-space (no lights required)
      float a = time * sweepSpeed;
      vec3 L = normalize(vec3(cos(a), 0.25, sin(a))); // tilt a bit on Y
      float ndl = max(0.0, dot(vN, L));
      // soft step: near 1.0 we’re brightest; width controls falloff
      float band = smoothstep(1.0 - sweepWidth, 1.0, ndl);

      float mixAmt = clamp(rim * glow + sweepAmp * band, 0.0, 1.0);
      vec3 col = mix(innerColor, rimColor, mixAmt);
      gl_FragColor = vec4(col, alpha);
    }
  `
);
extend({ PenumbraSphereMaterial });

export const SIZES = { lg: 0.34, md: 0.22, sm: 0.14 };

export default function PenumbraSphere({
  position = [0,0,0],
  size = "md",
  radius,
  color = "#E7DBF1",
  alpha = 0.95,
  glow = 0.9,         // base rim brightness (also pulsed if pulse=true)
  rimPower = 2.4,
  pulse = true,       // subtle breathing on top of sweep
  pulseAmp = 0.06,
  pulseSpeed = 0.6,
  sweep = true,       // enable/disable the moving band
  sweepAmp = 0.18,
  sweepSpeed = 0.35,
  sweepWidth = 0.45,
  segments = 32,
  renderOrder = 18,
}) {
  const r = typeof radius === "number" ? radius : (SIZES[size] ?? SIZES.md);
  const matRef = useRef();

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    // advance sweep time
    matRef.current.time = clock.getElapsedTime();

    // pulse the rim glow value a bit
    if (pulse) {
      const t = clock.getElapsedTime() * pulseSpeed;
      matRef.current.glow = glow + pulseAmp * Math.sin(t);
    } else {
      matRef.current.glow = glow;
    }

    // allow toggling / tuning sweep from props
    matRef.current.sweepAmp   = sweep ? sweepAmp   : 0.0;
    matRef.current.sweepSpeed = sweepSpeed;
    matRef.current.sweepWidth = sweepWidth;
  });

  return (
    <mesh position={position} renderOrder={renderOrder} raycast={() => null}>
      <sphereGeometry args={[Math.max(1e-4, r), segments, segments]} />
      <penumbraSphereMaterial
        ref={matRef}
        innerColor={new THREE.Color("#000")}
       rimColor={
  new THREE.Color(
    typeof color === "string" && color.startsWith("#")
      ? color.slice(0, 7) // trim off any alpha digits
      : color || "#1e00ff"
  )
}
        rimPower={rimPower}
        alpha={alpha}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}