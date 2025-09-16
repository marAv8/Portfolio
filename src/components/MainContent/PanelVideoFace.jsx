// src/components/MainContent/PanelVideoFace.jsx
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useVideoTexture } from '@react-three/drei';

function VideoMaterial({ map, brightness = 1.0 }) {
  // If brightness is 1, just use a basic material (fast path)
  if (!map || Math.abs(brightness - 1.0) < 0.001) {
    return (
      <meshBasicMaterial
        map={map}
        toneMapped={false}
        transparent={false}
        depthWrite
        depthTest
      />
    );
  }

  const uniforms = useMemo(
    () => ({
      uMap: { value: map },
      uGain: { value: brightness },
    }),
    [map, brightness]
  );

  return (
    <shaderMaterial
      uniforms={uniforms}
      vertexShader={/* glsl */`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `}
      fragmentShader={/* glsl */`
        uniform sampler2D uMap;
        uniform float uGain;
        varying vec2 vUv;
        void main() {
          vec4 c = texture2D(uMap, vUv);
          c.rgb *= uGain;       // simple brightness gain
          gl_FragColor = c;
        }
      `}
      transparent={false}
      depthWrite
      depthTest
    />
  );
}

export default function PanelVideoFace({
  url,
  width = 1,
  height = 1,
  z = 0.11,
  brightness = 1.3,   // <-- bump it a bit by default for Abyss
}) {
  const tex = useVideoTexture(url, { loop: true, muted: true, start: true });

  // correct color space for perceived brightness
  useMemo(() => {
    if (!tex) return;
    if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
    if ('encoding' in tex)   tex.encoding   = THREE.sRGBEncoding; // older Three
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
  }, [tex]);

  return (
    <mesh renderOrder={50} position={[0, 0, z]}>
      <planeGeometry args={[width, height]} />
      <VideoMaterial map={tex} brightness={brightness} />
    </mesh>
  );
}
