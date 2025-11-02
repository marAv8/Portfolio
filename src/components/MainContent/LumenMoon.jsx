import React from "react";
import { Face } from "./_LumenFaces";
import RadialFadeDisk from "../Effects/RadialFadeDisk";

export default function LumenMoon({ 
  items = [], 
  position=[0,0,0],  
  rotation = [0,0,0],
  scale = [1,1,1],}) {
  return (
    <group name="lumen-moon" position={position} rotation={rotation} scale={scale}>
      <group position={[0,0,0]}>
        <RadialFadeDisk color={[1,1,1]} radius={2} height={0.18} power={3.4} opacity={1} />
      </group>
      {items.map((it, i) => (
        <Face key={it.url || i} item={{ ...it, position: it.position || [ (i-1)*0.9, 0.55 + (i%2)*0.35, (i%3)*0.22 - 0.3 ] }} />
      ))}
    </group>
  );
}