// src/components/Carousel/DesktopSlidingStrip.jsx
import React, { useCallback, useEffect, useRef } from "react";
import SlidingStripBase from "./SlidingStripBase";

export default function DesktopSlidingStrip(props) {
  const moveListenerRef = useRef(null);
  const upListenerRef = useRef(null);

  const bindInteractions = useCallback(({ onStart, onMove, onEnd }) => {
    const handleMouseDown = (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      onStart(event);
      const move = (ev) => onMove(ev);
      const up = (ev) => {
        window.removeEventListener("mousemove", moveListenerRef.current);
        window.removeEventListener("mouseup", upListenerRef.current);
        moveListenerRef.current = null;
        upListenerRef.current = null;
        onEnd(ev);
      };
      moveListenerRef.current = move;
      upListenerRef.current = up;
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up, { once: false });
    };

    const handleMouseLeave = (event) => {
      if (moveListenerRef.current && event.buttons === 0) {
        onEnd(event);
        window.removeEventListener("mousemove", moveListenerRef.current);
        window.removeEventListener("mouseup", upListenerRef.current);
        moveListenerRef.current = null;
        upListenerRef.current = null;
      }
    };

    return {
      onMouseDown: handleMouseDown,
      onMouseLeave: handleMouseLeave,
      onTouchStart: onStart,
      onTouchMove: onMove,
      onTouchEnd: onEnd,
      onTouchCancel: onEnd,
    };
  }, []);

  useEffect(
    () => () => {
      if (moveListenerRef.current) {
        window.removeEventListener("mousemove", moveListenerRef.current);
        moveListenerRef.current = null;
      }
      if (upListenerRef.current) {
        window.removeEventListener("mouseup", upListenerRef.current);
        upListenerRef.current = null;
      }
    },
    []
  );

  return (
    <SlidingStripBase
      {...props}
      viewportClassName="carousel-strip-viewport"
      trackClassName="carousel-strip"
      slideClassName="carousel-slide"
      mediaClassName="carousel-image"
      bindInteractions={bindInteractions}
      renderEmpty={() => (
        <div className="carousel-slide single">
          <div className="mc-empty">No media found</div>
        </div>
      )}
    />
  );
}
