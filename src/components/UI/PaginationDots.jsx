//PaginationDots.jsx
import React, { useMemo } from "react";
import { useScreenSize } from "../../contexts/ScreenSizeContext";
import "./PaginationDots.css";

/**
 * Mobile/Tablet only. Shows a small "window" of dots around the active index.
 * - maxVisible: how many dots to show at once (odd number looks best)
 * - Dots away from the active shrink & fade a bit (like Instagram)
 */
export default function PaginationDots({
  index,
  total,
  onDotClick,
  maxVisible = 9,           // feel free to try 7 or 9
}) {
  const { isMobile, isTablet } = useScreenSize();
  if (!isMobile && !isTablet) return null;

  const { start, end, visible } = useMemo(() => {
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const window = Math.max(3, maxVisible); // safety
    const half = Math.floor(window / 2);

    // keep the active index centered when possible
    let s = clamp(index - half, 0, Math.max(0, total - window));
    let e = Math.min(total, s + window);
    const arr = [];
    for (let i = s; i < e; i++) arr.push(i);
    return { start: s, end: e, visible: arr };
  }, [index, total, maxVisible]);

  const isEdgeClampedLeft  = start > 0;
  const isEdgeClampedRight = end < total;

  return (
    <div
      className={`pagination-dots-container ${isMobile ? "mobile" : "tablet"}`}
      aria-label="Pagination"
      role="tablist"
    >
      {/* Left fade when we truncated the head */}
      {isEdgeClampedLeft && <div className="dots-fade left" />}

      <div className="dots-viewport">
        {visible.map((i) => {
          const dist = Math.abs(i - index);        // 0 at active, grows outward
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

      {/* Right fade when we truncated the tail */}
      {isEdgeClampedRight && <div className="dots-fade right" />}
    </div>
  );
}
