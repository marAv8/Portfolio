import React from "react";
import { Face } from "./_LumenFaces";
import LumenStarfield from "../Effects/LumenStarfield";
import * as THREE from "three";


export default function LumenSpace({ 
  items = [], 
  position=[0,0,0],
 rotation = [0,0,0],
  scale = [1,1,1],
  starfieldPosition=[0,0,0],
  starfieldRotation=[0,0,0],
  starfieldScale=[1,1,1], }) {
    const deg = (d) => THREE.MathUtils.degToRad(d);
  // loose scatter: you can hand-tune later on each item via assetsRight if needed
  return (
    <group name="lumen-space" position={position} rotation={rotation} scale={scale}>
{/* <LumenStarfield
  position={[-5, 0.25, -3]}     // nudge into the gap under the two Space pieces
  innerR={3.2}
  outerR={11.0}
  up={1.5}
  down={3.0}
  sectorCenter={0.0}             // +X (right)
  sectorWidth={Math.PI * 0.46}   // wide ring, no boxiness
  // optional: tweak hotspots to sit directly beneath your two Space images
  hotspots={[
    { center: [0.35, -0.10,  0.00], r: 1.15, rY: 0.45, falloff: 2.2, strength: 1.4 },
    { center: [1.05, -0.05,  0.10], r: 1.10, rY: 0.45, falloff: 2.4, strength: 1.55 },
  ]}
  sizeBase={0.015}
  sizeSparkle={0.021}
  cool="#9fe3ff"
  warm="#ffd1a0"
  opacity={0.98}
/> */}
      {items.map((it, i) => (
        <Face key={it.url || i} item={{ ...it, position: it.position || [ (i%3)-1, 0.9 + (i%2)*0.6, (i%4)*0.3 - 0.6 ] }} />
      ))}
    </group>
  );
}