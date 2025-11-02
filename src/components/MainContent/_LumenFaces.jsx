import React from "react";
import Panel from "./Panel";
import ImageOverlay from "./ImageOverlay";
import PanelVideoFace from "./PanelVideoFace";

export function Face({ item, scale = [1, 1, 1] }) {
  const isVideo = item.type === "video" || /\.mp4$/i.test(item.url);
  const [w, h] = Array.isArray(item.size) ? item.size : [1, 1];
  const s = item.scale || scale;

  return (
    <group position={item.position || [0, 0, 0]} rotation={item.rotation || [0, 0, 0]} scale={s}>
      <Panel thickness={0.05} />
      {isVideo ? (
        <PanelVideoFace url={item.url} width={w} height={h} fit="contain" poster={item.poster} />
      ) : (
        <ImageOverlay url={item.url} />
      )}
    </group>
  );
}