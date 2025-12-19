// src/components/Mobile/MobileSlidingStrip.jsx
import React from "react";
import SlidingStripBase from "../Carousel/SlidingStripBase";
import "./MobileSlidingStrip.css";

export default function MobileSlidingStrip(props) {
  return (
    <SlidingStripBase
      {...props}
      viewportClassName="mi-strip-viewport"
      trackClassName="mi-strip-track"
      slideClassName="mi-slide"
      mediaClassName="mi-media"
      bindInteractions={({ onStart, onMove, onEnd }) => ({
        onTouchStart: onStart,
        onTouchMove: onMove,
        onTouchEnd: onEnd,
        onTouchCancel: onEnd,
      })}
    />
  );
}
