import React from "react";
import { useScreenSize } from "../../contexts/ScreenSizeContext";
import PaginationDots from "./PaginationDots";
import "./PaginationArrows.css";

/**
 * Desktop-only pagination arrows.
 * - Hides itself on mobile/tablet.
 * - Disabled state at ends.
 */
export default function PaginationArrows({
  index = 0,
  total = 0,
  onPrev,
  onNext,
  onDotClick,
  className = "",
  loop = false,
}) {
  const { isMobile, isTablet } = useScreenSize();
  if (isMobile || total <= 1) return null;

  const maxIndex = Math.max(total - 1, 0);
  const displayIndex =
    loop && total > 0
      ? ((index % total) + total) % total
      : Math.min(Math.max(index, 0), maxIndex);
  const canPrev = loop ? total > 1 : displayIndex > 0;
  const canNext = loop ? total > 1 : displayIndex < maxIndex;

  const handlePrev = () => {
    if (!loop && !canPrev) return;
    onPrev?.();
  };
  const handleNext = () => {
    if (!loop && !canNext) return;
    onNext?.();
  };

  return (
    <div className={`pagination-arrows ${className}`}>
      <button
        className="nav left"
        aria-label="Previous"
        aria-disabled={!loop && !canPrev}
        onClick={handlePrev}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <PaginationDots
        index={displayIndex}
        total={total}
        onDotClick={(i) => {
          if (typeof onDotClick === "function") {
            onDotClick(i);
          }
        }}
        maxVisible={9}
        forceShow
      />

      <button
        className="nav right"
        aria-label="Next"
        aria-disabled={!loop && !canNext}
        onClick={handleNext}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M9 6L15 12L9 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
