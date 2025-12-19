import React from "react";
import Panel from "./Panel";
import ImageOverlay from "./ImageOverlay";
import PanelVideoFace from "./PanelVideoFace";

export function Face({ item, scale = [1, 1, 1] }) {
  const url = item.url || item.full || item.thumb;
  const isVideo = item.type === "video" || /\.mp4$/i.test(url || "");
  const [w, h] = Array.isArray(item.size) ? item.size : [1, 1];
  const s = item.scale || scale;
  const needsMoonOrientationFix = typeof url === "string" && url.includes("moon4_512.webp");
  const rotation = needsMoonOrientationFix ? [0, 0, 0] : (item.rotation || [0, 0, 0]);

  return (
    <group position={item.position || [0, 0, 0]} rotation={rotation} scale={s}>
      <Panel thickness={0.05} />
      {isVideo ? (
        <PanelVideoFace url={url} width={w} height={h} fit="contain" poster={item.poster} />
      ) : (
        <ImageOverlay url={url} />
      )}
    </group>
  );
}
