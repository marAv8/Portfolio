import React from "react";
import { Face } from "./_LumenFaces";
import RadialFadeDisk from "../Effects/RadialFadeDisk";

export default function LumenEarth({ 
  items = [], 
  position=[0,0,0],
  rotation = [0,0,0],
  scale = [1,1,1], }) {
  // turquoise reference (second screenshot vibe)
  const aqua = [0.19, 0.92, 0.92]; // ~#30EBEB in linear-ish
  return (
    <group name="lumen-earth" position={position} rotation={rotation} scale={scale}>
      <group position={[0,0,0]}>
        <RadialFadeDisk color={aqua} radius={6} height={0.22} power={3.4} opacity={1} />
      </group>
      {items.map((it, i) => (
        <Face key={it.url || i} item={{ ...it, position: it.position || [ (i-2)*0.9, 0.45 + (i%2)*0.3, (i%4)*0.22 - 0.4 ] }} />
      ))}
    </group>
  );
}