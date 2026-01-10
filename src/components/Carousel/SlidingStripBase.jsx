// src/components/Carousel/SlidingStripBase.jsx
import React, { useEffect, useRef } from "react";

/**
 * Core sliding-strip behavior shared by mobile/tablet/desktop wrappers.
 * Wrappers provide event bindings via bindInteractions so the base can
 * stay agnostic of touch vs mouse handling.
 */
export default function SlidingStripBase({
  items,
  index,
  onIndexChange,
  viewportClassName = "",
  trackClassName = "",
  slideClassName = "",
  mediaClassName = "",
  bindInteractions,
  renderEmpty = null,
  isInteractive = true,
}) {
  const trackRef = useRef(null);
  const widthRef = useRef(0);
  const safeItems = Array.isArray(items) ? items : [];
  const total = safeItems.length;

  const clampIndex = (value) =>
    total > 0 ? Math.max(0, Math.min(value, total - 1)) : 0;

  const activeIndexRef = useRef(clampIndex(index));
  const pendingIndexRef = useRef(null);
  const animationTimerRef = useRef(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const lastX = useRef(0);
  const startY = useRef(0);
  const lastY = useRef(0);
  const axisLock = useRef(null);
  const velocity = useRef(0);
  const dragStartOffset = useRef(0);

  const THRESH_SWIPE = 70;
  const VELOCITY_CUTOFF = 0.35;
  const AXIS_LOCK_THRESHOLD = 8;
  const TRANSITION_MS = 760;
  const TRANSITION_EASE = "cubic-bezier(0.18, 0.85, 0.32, 1)";

  const getClientX = (event) => {
    if (!event) return 0;
    if (event.touches?.[0]) return event.touches[0].clientX;
    if (event.changedTouches?.[0]) return event.changedTouches[0].clientX;
    return event.clientX ?? 0;
  };

  const getClientY = (event) => {
    if (!event) return 0;
    if (event.touches?.[0]) return event.touches[0].clientY;
    if (event.changedTouches?.[0]) return event.changedTouches[0].clientY;
    return event.clientY ?? 0;
  };

  const applyTransform = (track, offset) => {
    if (!track) return;
    track.style.transform = `translate3d(${offset}px, 0, 0)`;
  };

  const stopAnimation = () => {
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }
    if (pendingIndexRef.current != null) {
      activeIndexRef.current = pendingIndexRef.current;
      pendingIndexRef.current = null;
    }
  };

  const jumpToIndex = (target) => {
    const track = trackRef.current;
    const vp = track?.parentNode;
    if (!track || !vp) return;
    const width = vp.clientWidth || widthRef.current || 0;
    widthRef.current = width;
    const offset = -target * width;

    stopAnimation();
    track.style.transition = "none";
    applyTransform(track, offset);
    activeIndexRef.current = target;
    pendingIndexRef.current = null;
  };

  const readOffset = (track) => {
    if (!track) return 0;
    const style = window.getComputedStyle(track);
    try {
      if (typeof WebKitCSSMatrix !== "undefined") {
        return new WebKitCSSMatrix(style.transform).m41;
      }
      if (typeof DOMMatrix !== "undefined") {
        return new DOMMatrix(style.transform).m41;
      }
    } catch {}
    return 0;
  };

  const animateToIndex = (target, { fromOffset } = {}) => {
    const track = trackRef.current;
    const vp = track?.parentNode;
    if (!track || !vp) {
      activeIndexRef.current = target;
      pendingIndexRef.current = null;
      return;
    }

    const width = vp.clientWidth || widthRef.current || 0;
    widthRef.current = width;
    const finalOffset = -target * width;
    const startOffset =
      typeof fromOffset === "number" ? fromOffset : readOffset(track);

    stopAnimation();
    pendingIndexRef.current = target;

    track.style.transition = "none";
    applyTransform(track, startOffset);
    void track.offsetWidth;

    track.style.transition = `transform ${TRANSITION_MS}ms ${TRANSITION_EASE}`;
    applyTransform(track, finalOffset);

    animationTimerRef.current = window.setTimeout(() => {
      track.style.transition = "none";
      animationTimerRef.current = null;
      activeIndexRef.current = target;
      pendingIndexRef.current = null;
    }, TRANSITION_MS + 40);
  };

  // Measure viewport width once and keep slides aligned on resize
  useEffect(() => {
    const handleResize = () => {
      const track = trackRef.current;
      const vp = track?.parentNode;
      if (!track || !vp) return;
      widthRef.current = vp.clientWidth || 0;
      if (!dragging.current) jumpToIndex(activeIndexRef.current);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Animate when external index changes (dots/arrows/etc.)
  useEffect(() => {
    const clamped = clampIndex(index);
    if (dragging.current) return;
    if (pendingIndexRef.current != null && pendingIndexRef.current === clamped) {
      return;
    }
    if (clamped === activeIndexRef.current) return;
    animateToIndex(clamped);
  }, [index, total]);

  // Re-clamp when items length changes drastically
  useEffect(() => {
    activeIndexRef.current = clampIndex(activeIndexRef.current);
    pendingIndexRef.current = null;
    jumpToIndex(activeIndexRef.current);
  }, [total]);

  useEffect(
    () => () => {
      stopAnimation();
    },
    []
  );

  const onStart = (event) => {
    if (!isInteractive || total === 0) return;
    const x = getClientX(event);
    if (Number.isNaN(x)) return;
    const y = getClientY(event);
    if (Number.isNaN(y)) return;

    stopAnimation();
    dragging.current = true;
    startX.current = x;
    lastX.current = x;
    startY.current = y;
    lastY.current = y;
    axisLock.current = null;
    velocity.current = 0;

    const track = trackRef.current;
    if (!track) return;
    track.style.transition = "none";

    const offset = readOffset(track);
    dragStartOffset.current = Number.isFinite(offset)
      ? offset
      : -activeIndexRef.current * (widthRef.current || 0);
  };

  const onMove = (event) => {
    if (!dragging.current || !isInteractive) return;
    const x = getClientX(event);
    if (Number.isNaN(x)) return;
    const y = getClientY(event);
    if (Number.isNaN(y)) return;

    const dx = x - startX.current;
    const dy = y - startY.current;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (!axisLock.current && (absX > AXIS_LOCK_THRESHOLD || absY > AXIS_LOCK_THRESHOLD)) {
      axisLock.current = absX > absY ? "x" : "y";
      if (axisLock.current === "y") {
        dragging.current = false;
        return;
      }
    }

    if (axisLock.current !== "x") {
      lastX.current = x;
      lastY.current = y;
      return;
    }

    velocity.current = x - lastX.current;
    lastX.current = x;
    lastY.current = y;

    const track = trackRef.current;
    if (!track) return;
    const offset = dragStartOffset.current + dx;
    applyTransform(track, offset);

    if (event.cancelable) event.preventDefault();
  };

  const onEnd = (event) => {
    if (!dragging.current || !isInteractive) return;
    dragging.current = false;
    axisLock.current = null;

    const dx = lastX.current - startX.current;
    const v = velocity.current;

    let dir = 0;
    if (Math.abs(dx) > THRESH_SWIPE) {
      dir = dx < 0 ? +1 : -1;
    } else if (Math.abs(v) > VELOCITY_CUTOFF) {
      dir = v < 0 ? +1 : -1;
    }

    const currentIndex = activeIndexRef.current;
    if (
      (currentIndex === 0 && dir === -1) ||
      (currentIndex === total - 1 && dir === +1)
    ) {
      dir = 0;
    }

    const track = trackRef.current;
    if (!track) {
      velocity.current = 0;
      return;
    }

    const releaseOffset = readOffset(track);

    if (dir !== 0) {
      const target = clampIndex(currentIndex + dir);
      if (target !== currentIndex) {
        onIndexChange?.(target);
        animateToIndex(target, { fromOffset: releaseOffset });
      } else {
        animateToIndex(currentIndex, { fromOffset: releaseOffset });
      }
    } else {
      animateToIndex(currentIndex, { fromOffset: releaseOffset });
    }

    velocity.current = 0;

    if (Math.abs(dx) > 6 && event?.cancelable) {
      event.preventDefault();
    }
  };

  const interactionProps =
    isInteractive && typeof bindInteractions === "function"
      ? bindInteractions({
          onStart,
          onMove,
          onEnd,
        }) || {}
      : {};

  const renderSlides = () => {
    if (safeItems.length === 0) {
      return renderEmpty ? renderEmpty() : null;
    }
    return safeItems.map((item, i) => {
      const key = `${item?.src || "slide"}-${i}`;
      const isVideo = Boolean(item?.isVideo);
      const mediaClass = mediaClassName || undefined;
      return (
        <div key={key} className={slideClassName || undefined}>
          {isVideo ? (
            <video
              className={mediaClass}
              src={item?.src}
              autoPlay
              muted
              loop
              playsInline
              poster={item?.poster}
            />
          ) : (
            <img
              className={mediaClass}
              src={item?.src}
              alt=""
              draggable={false}
            />
          )}
        </div>
      );
    });
  };

  return (
    <div className={viewportClassName || undefined} {...interactionProps}>
      <div className={trackClassName || undefined} ref={trackRef}>
        {renderSlides()}
      </div>
    </div>
  );
}
