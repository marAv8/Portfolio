// PaginationDots.jsx
import React, { useMemo } from "react";
import { useScreenSize } from "../../contexts/ScreenSizeContext";
import "./PaginationDots.css";

/**
 * Mobile/Tablet only. Shows a small "window" of dots around the active index.
 * - maxVisible: how many dots to show at once (odd number looks best)
 * - Dots away from the active shrink & fade a bit (like Instagram)
 */
export default function PaginationDots({
  index = 0,
  total = 0,
  onDotClick,
  maxVisible = 9,
}) {
  const { isMobile, isTablet } = useScreenSize();

  // ✅ Always call hooks — compute window even if we won't render
  const { start, end, visible } = useMemo(() => {
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const t = Math.max(0, Number(total) || 0);
    const i = clamp(Number(index) || 0, 0, Math.max(0, t - 1));
    const windowSize = Math.max(3, Number(maxVisible) || 3);
    const half = Math.floor(windowSize / 2);

    let s = clamp(i - half, 0, Math.max(0, t - windowSize));
    let e = Math.min(t, s + windowSize);

    const arr = [];
    for (let k = s; k < e; k++) arr.push(k);

    return { start: s, end: e, visible: arr, i, t };
  }, [index, total, maxVisible]);

  const isEdgeClampedLeft  = start > 0;
  const isEdgeClampedRight = end < total;

  // ❌ No hooks after this return
  if (!isMobile && !isTablet) return null;

  return (
    <div
      className={`pagination-dots-container ${isMobile ? "mobile" : "tablet"}`}
      aria-label="Pagination"
      role="tablist"
    >
      {isEdgeClampedLeft && <div className="dots-fade left" />}

      <div className="dots-viewport">
        {visible.map((i) => {
          const dist = Math.abs(i - index);
          const scale = i === index ? 1 : Math.max(0.6, 0.9 - dist * 0.08);
          const opacity = i === index ? 1 : Math.max(0.35, 0.85 - dist * 0.12);
          return (
            <button
              key={i}
              className={`pagination-dot ${i === index ? "active" : ""}`}
              style={{ transform: `scale(${scale})`, opacity }}
              onClick={() => onDotClick?.(i)}
              aria-selected={i === index}
              role="tab"
            />
          );
        })}
      </div>

      {isEdgeClampedRight && <div className="dots-fade right" />}
    </div>
  );
}