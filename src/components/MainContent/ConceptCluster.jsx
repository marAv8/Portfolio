// src/components/MainContent/ConceptCluster.jsx
import React, { useRef, useState, useEffect } from 'react';
import { useSpring, a } from '@react-spring/three';
import Panel from './Panel';
import ImageOverlay from './ImageOverlay';
import RadialFadeDisk from '../Effects/RadialFadeDisk';
import RotatingStones from './RotatingStones';
import FloatingCeilingGroup from '../Effects/FloatingCeilingGroup';
import { useCursor } from '@react-three/drei';
import { useScreenSize } from '../../contexts/ScreenSizeContext';

export default function ConceptCluster({
  id,
  position = [0, 0, 0],
  scale = [1, 1, 1],
  images = [],
  isActive = false,
  onActivate = () => {},
  onShowCarousel = () => {},
  onHoverChange = () => {},
}) {
  // ---- config ----
  const introDelayMs = 500; // when to start the one-time pulse on tablet (ms)
  const hoverScaleMul = 1.08;

  // ---- state/refs (hooks must be above any early return) ----
  const [hovered, setHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasIntroPulsed, setHasIntroPulsed] = useState(false);
  const introAnimatingRef = useRef(false);
  const pointerStart = useRef([0, 0]);

  const { isMobile, isTablet } = useScreenSize();
  useCursor(hovered);

  // spring for whole-cluster scale
  const [{ animatedScale }, api] = useSpring(() => ({
    animatedScale: scale,
    config: { tension: 170, friction: 18 },
  }));

  // keep spring in sync if base scale prop changes
  useEffect(() => {
    api.start({ animatedScale: scale });
  }, [scale, api]);

  // mount delay (prevents initial flicker)
  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 150);
    return () => clearTimeout(t);
  }, []);

  // tablet-only, one-time pulse AFTER visible
  useEffect(() => {
    if (!isVisible || hasIntroPulsed || !isTablet || isActive) return;
    
    introAnimatingRef.current = true;
    const tm = setTimeout(() => {
      const raf = requestAnimationFrame(() => {
        api.start({
          to: async (next) => {
            await next({ animatedScale: scale.map((s) => s * hoverScaleMul) }); // up
            await next({ animatedScale: scale });                               // back
          },
          onRest: () => {
            introAnimatingRef.current = false;
            setHasIntroPulsed(true);
          },
        });
      });
      // cleanup rAF if unmounts quickly
      return () => cancelAnimationFrame(raf);
    }, introDelayMs);

    return () => clearTimeout(tm);
  }, [isVisible, hasIntroPulsed, isTablet, introDelayMs, api, scale]);

  // hover reacts only after intro pulse completes
  useEffect(() => {
    if (introAnimatingRef.current) return;
    const target = hovered && !isActive
      ? scale.map((s) => s * hoverScaleMul)
      : scale;
    api.start({ animatedScale: target });
  }, [hovered, isActive, scale, api]);

  // mobile: auto-show carousel when active
  useEffect(() => {
    if (isMobile && isActive) onShowCarousel(id);
  }, [isMobile, isActive, id, onShowCarousel]);

  // ---- guard render until visible ----
  if (!isVisible) return null;

  const staticImages = images.filter((img) => !img.isFloating);
  const rotatingImages = images.filter((img) => img.isFloating);

  const handlePointerDown = (e) => {
    pointerStart.current = [e.clientX, e.clientY];
    // treat touch as hover so it feels alive on tap
    if (typeof window !== 'undefined' && 'ontouchstart' in window) {
      setHovered(true);
      onHoverChange(id, true);
    }
  };

  const handlePointerUp = (e) => {
    const [startX, startY] = pointerStart.current;
    const dx = Math.abs(e.clientX - startX);
    const dy = Math.abs(e.clientY - startY);
    if (dx <= 4 && dy <= 4) {
      e.stopPropagation();
      onActivate(id);
    }
  };

  return (
    <a.group
      position={position}
      scale={animatedScale}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        if (!hovered) { setHovered(true); onHoverChange(id, true); }
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
        if (hovered) { setHovered(false); onHoverChange(id, false); }
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {/* invisible hit area for reliable hover/tap */}
      {!isActive && (
        <mesh
          position={[0, 0.5, 0.8]}
          onPointerOver={() => { if (!hovered) { setHovered(true); onHoverChange(id, true); } }}
          onPointerOut={() => { if (hovered) { setHovered(false); onHoverChange(id, false); } }}
        >
          <planeGeometry args={[12, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} side={2} />
        </mesh>
      )}

      {/* cluster contents */}
      {staticImages.map((img, i) => (
        <group key={i} position={img.position} rotation={img.rotation} scale={img.scale}>
          {img.useCircle ? (
            <mesh castShadow position={[0, 0, 0.001]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.6, 0.6, 0.01, 64]} />
              <meshStandardMaterial color="red" opacity={0.5} transparent />
            </mesh>
          ) : (
            <Panel thickness={0.1} />
          )}
          <ImageOverlay url={img.url} />
        </group>
      ))}

      <RotatingStones images={rotatingImages} center={[0, 0.52, 1.5]} radius={0.5} />
      <FloatingCeilingGroup position={[0, 5, 0]} />
      <RadialFadeDisk radius={5} height={0.1} color={[1.0, 0.96, 0.82]} />
    </a.group>
  );
}
