// src/components/MainContent/ClusterCarousel.jsx
import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import "./ClusterCarousel.css";
import PaginationDots from "../UI/PaginationDots";
import { useScreenSize } from "../../contexts/ScreenSizeContext";

/**
 * Controlled/uncontrolled carousel:
 * - If `index` prop is provided => controlled. Use `onIndexChange` to update.
 * - Else it manages its own index, seeded by `startIndex`.
 * Supports drag/swipe, infinite loop (forward/back).
 */
export default function ClusterCarousel({
  images = [],           // array of strings or { url/src/image/path }
  startIndex = 0,        // only used when UNcontrolled
  index: controlled,     // controlled index (optional)
  onIndexChange,         // called whenever active index changes (with wrapped idx)
  onClose,               // close handler (optional)
}) {
  // Normalize to plain URLs
  const urls = useMemo(() => {
    return (images || [])
      .map((it) =>
        typeof it === "string" ? it : it?.url || it?.src || it?.image || it?.path || null
      )
      .filter(Boolean);
  }, [images]);

  // Wrap helper for infinite looping
  const wrap = useCallback((i, len) => {
    if (!len) return 0;
    return ((i % len) + len) % len;
  }, []);

  // Controlled/uncontrolled bookkeeping
  const isControlled = controlled != null;
  const [internal, setInternal] = useState(() => wrap(startIndex || 0, urls.length));
  const idx = isControlled ? wrap(controlled, urls.length) : internal;

  // Reset internal index if startIndex or list length changes
  useEffect(() => {
    if (!isControlled) setInternal(wrap(startIndex || 0, urls.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startIndex, urls.length]);

  // Unified setter that wraps and reflects to parent if controlled
  const setIndex = useCallback(
    (updater) => {
      const nextRaw = typeof updater === "function" ? updater(idx) : updater;
      const next = wrap(nextRaw, urls.length);
      if (isControlled) {
        onIndexChange?.(next);
      } else {
        setInternal(next);
        onIndexChange?.(next);
      }
    },
    [idx, wrap, urls.length, isControlled, onIndexChange]
  );

  const next = useCallback(() => setIndex(i => i + 1), [setIndex]);
  const prev = useCallback(() => setIndex(i => i - 1), [setIndex]);

  // Drag / swipe
  const startX = useRef(null);
  const onPointerDown = (e) => {
    startX.current = e.clientX ?? e.touches?.[0]?.clientX ?? null;
  };
  const onPointerUp = (e) => {
    const sx = startX.current;
    const ex = e.clientX ?? e.changedTouches?.[0]?.clientX ?? null;
    startX.current = null;
    if (sx == null || ex == null) return;
    const dx = ex - sx;
    if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
  };

  // Media selection
  const src = urls[idx] || "";
  const isVideo = /\.(mp4|webm)(\?.*)?$/i.test(src);

  return (
    <div className="carousel-wrapper">
      {onClose && (
        <button className="close-btn" onClick={onClose} aria-label="Close">
          ×
        </button>
      )}

      <div
        className="carousel-image-container"
        onMouseDown={onPointerDown}
        onMouseUp={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchEnd={onPointerUp}
      >
        <div className="image-wrapper">
          {urls.length ? (
            isVideo ? (
              <video className="carousel-image" src={src} autoPlay muted loop playsInline />
            ) : (
              <img className="carousel-image" src={src} alt="" draggable={false} />
            )
          ) : (
            <div className="mc-empty">No media found</div>
          )}
        </div>
      </div>

    

      {/* Tablet & Mobile dots — centered under the media pane */}
      <PaginationDots
        index={idx}
        total={urls.length}
        onDotClick={setIndex}
        maxVisible={9}
      />
    </div>
  );
}
