import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { ShaderMaterial } from 'three';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';

class RadialFadeMaterial extends ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        uColor: { value: new THREE.Color(1.0, 1.0, 1.0) },
        uOpacity: { value: 1.0 },
        uPower: { value: 2.5 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uPower;

        void main() {
          float dist = distance(vUv, vec2(0.5));
          float fade = pow(1.0 - smoothstep(0.0, 0.9, dist), uPower);
          gl_FragColor = vec4(uColor, fade * uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
    });
  }
}

extend({ RadialFadeMaterial });

export default function RadialFadeDisk({
  radius = 3,
  height = 0.05,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = [1.0, 0.96, 0.82], //changes overhead Radial color
  opacity = 1.0,
  power = 4.5,
  pulseAmp = 0.05,  //  (default = current behavior)
  pulseHz = 0.5,
}) {
  const ref = useRef();

  // Animate opacity pulse
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref.current) {
      ref.current.uniforms.uOpacity.value = opacity + pulseAmp * Math.sin(t * (2 * Math.PI * pulseHz));    }
  });

  // Imperatively update color and power on change
  useEffect(() => {
    if (ref.current) {
      ref.current.uniforms.uColor.value = color;
      ref.current.uniforms.uPower.value = power;
    }
  }, [color, power]);

  return (
    <mesh position={position} rotation={rotation}>
      <cylinderGeometry args={[radius, radius, height, 64]} />
      <radialFadeMaterial   ref={ref}
                            uColor={new THREE.Color(...color)}  // ✅ Convert prop array to THREE.Color
                            uOpacity={opacity}
                            uPower={power}/>
                              </mesh>
          );
}
