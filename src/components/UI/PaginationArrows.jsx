import React from "react";
import { useScreenSize } from "../../contexts/ScreenSizeContext";
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
  className = "",
  loop = true,
}) {
  const { isMobile, isTablet } = useScreenSize();
  if (isMobile || isTablet || total <= 1) return null;

  const wrappedIndex = total > 0 ? ((index % total) + total) % total : 0;
  const canPrev = wrappedIndex > 0;
  const canNext = wrappedIndex < total - 1;

    const handlePrev = () => {
    if (loop || canPrev) onPrev?.();
  };
  const handleNext = () => {
    if (loop || canNext) onNext?.();
  };

  return (
    <div className={`pagination-arrows ${className}`}>
       <button
        className="nav left"
        aria-label="Previous"
        aria-disabled={!loop && !canPrev}
        onClick={handlePrev}
      >
        {/* left chevron */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div className="status">
        {wrappedIndex + 1} / {total} 
      </div>

      <button
        className="nav right"
        aria-label="Next"
       aria-disabled={!loop && !canNext}
        onClick={handleNext}
      >
        {/* right chevron */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M9 6L15 12L9 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}
