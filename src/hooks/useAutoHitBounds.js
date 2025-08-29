import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';

/**
 * Measures the bounds of a visuals group and returns a spherical hit area
 * in the parent's local space so you can position a hit mesh directly.
 *
 * Options:
 *  - bleed: expands radius (default 1.15)
 *  - minRadius: floor radius (default 0.8)
 *  - deps: values to re-measure on change (e.g., images.length, scale components)
 *  - watchResize: re-measure on window resize (default true)
 */
export default function useAutoHitBounds(
  visualsRef,
  { bleed = 1.15, minRadius = 0.8, deps = [], watchResize = true } = {}
) {
  const [bounds, setBounds] = useState(() => ({
    center: new THREE.Vector3(0, 0, 0),
    radius: minRadius,
  }));

  const box = useMemo(() => new THREE.Box3(), []);
  const size = useMemo(() => new THREE.Vector3(), []);
  const worldCenter = useMemo(() => new THREE.Vector3(), []);

  const compute = () => {
    const root = visualsRef?.current;
    if (!root) return;

    box.setFromObject(root);
    if (box.isEmpty()) return;

    box.getSize(size);
    box.getCenter(worldCenter); // world space center

    // Convert to parent local space so the hit mesh can be placed directly
    const parent = root.parent;
    const localCenter = worldCenter.clone();
    if (parent) parent.worldToLocal(localCenter);

    const r = Math.max(size.x, size.y, size.z) * 0.5 * bleed;
    setBounds({
      center: localCenter,
      radius: Math.max(r, minRadius),
    });
  };

  useEffect(() => {
    // defer one frame to let R3F mount children before measuring
    let raf = requestAnimationFrame(compute);
    if (watchResize) {
      const onResize = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(compute);
      };
      window.addEventListener('resize', onResize);
      return () => {
        window.removeEventListener('resize', onResize);
        cancelAnimationFrame(raf);
      };
    }
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visualsRef, bleed, minRadius, watchResize, ...deps]);

  return bounds;
}
