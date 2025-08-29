// src/components/hooks/useCameraHelpers.js
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Auto-tilt a horizontal disk so it reads flatter at your current camera pitch.
 * factor: 0..1 – how much of the camera pitch to cancel (0.9 ≈ 90%)
 */
export function useAutoTiltToCamera(ref, { factor = 0.9, enabled = true } = {}) {
  const { camera } = useThree();
  const dir = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!enabled || !ref.current) return;

    camera.getWorldDirection(dir.current);      // forward
    // pitch is the vertical component of camera forward
    const pitch = Math.asin(THREE.MathUtils.clamp(dir.current.y, -1, 1));
    // when camera looks down (negative y), pitch is negative.
    // rotate the disk toward the camera to cancel most of that pitch
    const targetX = -pitch * factor;

    // keep existing yaw/roll; smooth a bit
    const cur = ref.current.rotation.x;
    ref.current.rotation.x = THREE.MathUtils.lerp(cur, targetX, 0.15);
  });
}

/**
 * Smoothly retarget OrbitControls to a cluster center and micro‑pitch the view
 * so the base reads perfectly flat (for overlay/focused state).
 *
 * call: startFocus({ target: new THREE.Vector3(...), distance: 28, pitchDeg: 57 })
 * call: clearFocus() to lerp back to previous framing (optional).
 */
export function useOrbitFocus(controlsRef, {
  defaultDistance = 36,
  lerpSpeed = 0.12
} = {}) {
  const { camera } = useThree();
  const active = useRef(null);     // { target, distance, pitchRad }
  const prev = useRef(null);       // previous target/pos to restore if needed
  const tmpTarget = useRef(new THREE.Vector3());
  const tmpPos = useRef(new THREE.Vector3());

  // per‑frame lerp toward active target
  useFrame(() => {
    const controls = controlsRef?.current;
    if (!controls) return;

    // if focusing
    if (active.current) {
      const { target, distance, pitchRad } = active.current;

      // desired target
      tmpTarget.current.lerp(target, lerpSpeed);
      controls.target.copy(tmpTarget.current);

      // compute desired camera position from spherical (keep current azimuth)
      const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
      const sph = new THREE.Spherical().setFromVector3(offset);
      // lock distance and pitch
      sph.radius = THREE.MathUtils.lerp(sph.radius, distance, lerpSpeed);
      sph.phi    = THREE.MathUtils.lerp(sph.phi, pitchRad, lerpSpeed); // polar angle

      // rebuild camera position
      const newOffset = new THREE.Vector3().setFromSpherical(sph);
      tmpPos.current.copy(controls.target).add(newOffset);
      camera.position.lerp(tmpPos.current, lerpSpeed);

      camera.updateProjectionMatrix?.();
      controls.update();
    }
  });

  function startFocus({ target, distance = defaultDistance, pitchDeg = 57 }) {
    const controls = controlsRef?.current;
    if (!controls) return;
    // keep a snapshot (optional)
    prev.current = {
      target: controls.target.clone(),
      pos: camera.position.clone(),
    };
    tmpTarget.current.copy(controls.target);
    tmpPos.current.copy(camera.position);

    active.current = {
      target: target.clone ? target.clone() : new THREE.Vector3(...target),
      distance,
      pitchRad: THREE.MathUtils.degToRad(pitchDeg),
    };
  }

  function clearFocus() {
    const controls = controlsRef?.current;
    if (!controls || !prev.current) {
      active.current = null;
      return;
    }
    active.current = {
      target: prev.current.target.clone(),
      distance: prev.current.pos.distanceTo(prev.current.target),
      // infer pitch from previous pos/target
      pitchRad: (() => {
        const off = new THREE.Vector3().subVectors(prev.current.pos, prev.current.target);
        const sph = new THREE.Spherical().setFromVector3(off);
        return sph.phi;
      })(),
    };
    // after a short lerp back, drop active
    setTimeout(() => (active.current = null), 350);
  }

  return { startFocus, clearFocus };
}
