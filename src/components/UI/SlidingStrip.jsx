// src/components/UI/SlidingStrip.jsx
import React, {
  useRef,
  useLayoutEffect,
  useState,
  useCallback,
} from "react";

export default function SlidingStrip({ entries = [], index = 0 }) {
  const stripRef = useRef(null);
  const [viewportWidth, setViewportWidth] = useState(0);

    // --- DRAG STATE ---
    // FAST drag flag (no re-render)
    const isDragging = useRef(false);
    // FAST transition toggle
    const disableTransition = useRef(false);
    const draggingRef = useRef(false);  
    const startX = useRef(0);
    const startOffset = useRef(0);
    const currentOffset = useRef(0);

  // Measure viewport width once and on resize
  useLayoutEffect(() => {
    const node = stripRef.current?.parentElement;
    if (!node) return;

    const measure = () => {
      const w = node.getBoundingClientRect().width || 0;
      setViewportWidth(w);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const safeTotal = Array.isArray(entries) ? entries.length : 0;
  const clampedIndex =
    safeTotal > 0 ? Math.max(0, Math.min(index, safeTotal - 1)) : 0;

  // Base position controlled by index
  const targetOffset = -clampedIndex * viewportWidth;

  // We track the "displayed" offset—while dragging, we override transform
  const [displayOffset, setDisplayOffset] = useState(targetOffset);
useLayoutEffect(() => {
  if (draggingRef.current) return;

  // avoid snap jitter: only snap if > 2px off
  const delta = Math.abs(displayOffset - targetOffset);
  if (delta > 2) {
    setDisplayOffset(targetOffset);
  }
}, [targetOffset]);


  // POINTER START -----------------------------------------------------------
const onPointerDown = useCallback((e) => {
  const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;

  isDragging.current = true;
  disableTransition.current = true;   // disable transition immediately

  startX.current = x;
  startOffset.current = displayOffset;
}, [displayOffset]);



  // POINTER MOVE ------------------------------------------------------------
const onPointerMove = useCallback((e) => {
  if (!isDragging.current) return;

  const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
  const dx = x - startX.current;

  const newOffset = startOffset.current + dx;
  currentOffset.current = newOffset;

  setDisplayOffset(newOffset);
}, []);


  // POINTER END -------------------------------------------------------------
 const onPointerUp = useCallback(() => {
  isDragging.current = false;

  disableTransition.current = false;  // re-enable transitions

  setDisplayOffset(targetOffset);
}, [targetOffset]);


  return (
    <div
      className="carousel-strip-viewport"
      onMouseDown={onPointerDown}
      onMouseMove={onPointerMove}
      onMouseUp={onPointerUp}
      onMouseLeave={onPointerUp}
      onTouchStart={onPointerDown}
      onTouchMove={onPointerMove}
      onTouchEnd={onPointerUp}
    >
      <div
        className="carousel-strip"
        ref={stripRef}
      style={{
        transform: `translate3d(${displayOffset}px, 0, 0)`,
        transition: disableTransition.current
            ? "none"
            : "transform 0.35s ease",
        }}
      >
        {safeTotal === 0 ? (
          <div className="carousel-slide single">
            <div className="mc-empty">No media found</div>
          </div>
        ) : (
          entries.map((entry, i) => {
            const { src, isVideo, poster } = entry || {};
            const key = `${src || "slide"}-${i}`;
            return (
              <div className="carousel-slide" key={key}>
                {isVideo ? (
                  <video
                    className="carousel-image"
                    src={src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster={poster}
                  />
                ) : (
                  <img
                    className="carousel-image"
                    src={src}
                    alt=""
                    draggable={false}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
