// src/components/Effects/FloatingCeilingGroup.jsx
import React from 'react';
import * as THREE from 'three';
import RadialFadeDisk from './RadialFadeDisk';

export default function FloatingCeilingGroup({
  position = [0, 0, 0],
  glowRadius = 3.5,
  glowHeight = 0.1,
  color = [1.0, 0.96, 0.82],
  // control the plane orientation of the halo + its children
  tiltDeg = -22, // X tilt (≈ -0.38 rad), feel free to tune
  yawDeg = 18,   // Yaw
  // pass NO_RAYCAST from parent so the whole unit never steals events
  raycast = undefined,
  children,
}) {
  const tiltX = THREE.MathUtils.degToRad(tiltDeg);
  const yawY  = THREE.MathUtils.degToRad(yawDeg);

  // Inject default props (like scaleWith) into children if they’re ShimmerParticles
  const injected = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    const isShimmer = child.type?.name === 'ShimmerParticles';
    return isShimmer
      ? React.cloneElement(child, {
          normal: child.props.normal ?? [0, 1, 0],
          scaleWith: child.props.scaleWith ?? glowRadius,
        })
      : child;
  });

  return (
    <group position={position} raycast={raycast}>
      {/* The actual overhead disk/halo */}
      <RadialFadeDisk
        radius={glowRadius}
        height={glowHeight}
        rotation={[tiltX, yawY, 0]} // face downward like a ceiling disk
        color={color}
      />

      {/* Anything you nest (e.g., ShimmerParticles) is aligned to the same plane */}
      <group rotation={[tiltX, yawY, 0]} raycast={raycast}>
        {injected}
      </group>
    </group>
  );
}
