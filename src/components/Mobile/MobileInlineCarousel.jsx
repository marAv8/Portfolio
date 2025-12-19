// latest/src/components/Mobile/MobileCarousel.jsx
import React from "react";
import PaginationDots from "../UI/PaginationDots";
import "./MobileCarousel.css";
import MobileSlidingStrip from "./MobileSlidingStrip";

/** Normalize to {src, poster, isVideo} so posters stay aligned per slide. */
function extractVisibleItems(type, cluster) {
  const raw = !cluster
    ? []
    : type === "early" || type === "hats"
      ? cluster.assets ?? []
      : cluster.images ?? [];

  return (raw || [])
    .filter((item) => typeof item === "string" || !item?.hidden)
    .map((item) => {
      const src =
        typeof item === "string"
          ? item
          : item?.url ||
            item?.full ||
            item?.thumb ||
            item?.src ||
            item?.image ||
            item?.path ||
            null;
      if (!src) return null;

      const poster =
        typeof item === "string"
          ? undefined
          : item?.poster || item?.cover || item?.thumbnail || undefined;

      const isVideo = /\.mp4($|\?)/i.test(src) || /\.webm($|\?)/i.test(src);
      return { src, poster, isVideo };
    })
    .filter(Boolean);
}

export default function MobileInlineCarousel({
  type,
  cluster,
  onOpenOverlay,
  showMeta = true,
  className = "",
}) {
  const items = React.useMemo(() => extractVisibleItems(type, cluster), [type, cluster]);
  const total = items.length || 1;
  const [index, setIndex] = React.useState(0);

  // Clamp index if list changes
  React.useEffect(() => {
    setIndex((i) => (total === 0 ? 0 : Math.min(i, total - 1)));
  }, [total]);

  const titleFallback =
    type === "abyss" ? "Abyss" : type === "early" ? "Protoforms" : "Concepts";
  const title = cluster?.title ?? titleFallback;
  const year = cluster?.year ?? "";
  const subtitle = cluster?.subtitle ?? "";

  const current = items[index] || { src: "", isVideo: false, poster: undefined };
  const { src, isVideo, poster } = current;

  const onClickViewport = () => {
    onOpenOverlay?.(cluster?.id);
  };

  // --- Ghost-frame killer state ---
  const [posterReady, setPosterReady] = React.useState(false);
  const [videoReady, setVideoReady] = React.useState(false);
  const videoRef = React.useRef(null);
  const prevVideoRef = React.useRef(null);
  const posterTokenRef = React.useRef(0);
  const videoTokenRef = React.useRef(0);
  const frameHandleRef = React.useRef(null);
  const frameVideoRef = React.useRef(null);
  const rafHandleRef = React.useRef(null);
  const fallbackTimerRef = React.useRef(null);

  // Reset gates on slide change
  React.useEffect(() => {
    posterTokenRef.current += 1;
    videoTokenRef.current += 1;
    const posterToken = posterTokenRef.current;
    let posterCleanup = null;
    setPosterReady(false);
    setVideoReady(false);
    const prev = prevVideoRef.current;
    if (prev && prev !== videoRef.current) {
      try {
        prev.pause();
        prev.currentTime = 0;
        prev.removeAttribute("src");
        prev.load();
      } catch {}
      prevVideoRef.current = null;
    }

    // Pre-decode the poster so it paints immediately
    if (poster) {
      let cancelled = false;
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        if (cancelled) return;
        if (posterTokenRef.current === posterToken) setPosterReady(true);
      };
      img.onerror = () => {
        if (cancelled) return;
        if (posterTokenRef.current === posterToken) setPosterReady(true);
      };
      img.src = poster;
      // Safari sometimes won't call onload until decode:
      if (typeof img.decode === "function") {
        img
          .decode()
          .then(() => {
            if (cancelled) return;
            if (posterTokenRef.current === posterToken) setPosterReady(true);
          })
          .catch(() => {
            if (cancelled) return;
            if (posterTokenRef.current === posterToken) setPosterReady(true);
          });
      }
      posterCleanup = () => {
        cancelled = true;
        img.onload = null;
        img.onerror = null;
        img.src = "";
      };
    } else {
      // no poster provided; still mark as ready so we keep black bg
      setPosterReady(true);
    }
    return () => {
      posterCleanup?.();
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      if (rafHandleRef.current) {
        cancelAnimationFrame(rafHandleRef.current);
        rafHandleRef.current = null;
      }
      const frameVid = frameVideoRef.current;
      if (frameVid && typeof frameVid.cancelVideoFrameCallback === "function" && frameHandleRef.current != null) {
        try {
          frameVid.cancelVideoFrameCallback(frameHandleRef.current);
        } catch {}
      }
      frameHandleRef.current = null;
      frameVideoRef.current = null;
    };
  }, [src, poster]);

  // Nudge currentTime after metadata so Safari paints a fresh frame,
  // then wait a RAF so the decode has hit the compositor before revealing.
  const onLoadedMetadata = () => {
    try {
      if (videoRef.current) {
        if (videoRef.current.currentTime === 0) {
          videoRef.current.currentTime = 0.01;
        }
      }
    } catch {}
  };
  const onLoadedData = () => {
    const vid = videoRef.current;
    if (!vid) {
      setVideoReady(true);
      return;
    }
    const activeToken = videoTokenRef.current;
    const clearGuards = () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      if (rafHandleRef.current) {
        cancelAnimationFrame(rafHandleRef.current);
        rafHandleRef.current = null;
      }
      if (frameVideoRef.current && typeof frameVideoRef.current.cancelVideoFrameCallback === "function" && frameHandleRef.current != null) {
        try {
          frameVideoRef.current.cancelVideoFrameCallback(frameHandleRef.current);
        } catch {}
      }
      frameHandleRef.current = null;
      frameVideoRef.current = null;
    };
    const finalize = () => {
      if (videoTokenRef.current !== activeToken) return;
      clearGuards();
      setVideoReady(true);
      prevVideoRef.current = vid;
    };
    const ensureFrame = () => {
      if (typeof vid.requestVideoFrameCallback === "function") {
        frameVideoRef.current = vid;
        frameHandleRef.current = vid.requestVideoFrameCallback((_time, metadata) => {
          if (metadata?.mediaTime > 0) {
            finalize();
          } else {
            ensureFrame();
          }
        });
      } else {
        const check = () => {
          if (!videoRef.current || videoTokenRef.current !== activeToken) return;
          if (videoRef.current.currentTime > 0.02 || videoRef.current.readyState >= 2) {
            finalize();
          } else {
            rafHandleRef.current = requestAnimationFrame(check);
          }
        };
        rafHandleRef.current = requestAnimationFrame(check);
      }
    };
    const playPromise = vid.play?.();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise.then(ensureFrame).catch(() => ensureFrame());
    } else {
      ensureFrame();
    }
    fallbackTimerRef.current = setTimeout(() => {
      if (videoTokenRef.current !== activeToken) return;
      finalize();
    }, 450);
  };

  return (
    <div className={`mi-block ${className}`} data-cluster={cluster?.id || type}>
      {showMeta && (
        <div className="mi-meta">
          <div className="mi-title">{title}</div>
          {year && <div className="mi-line">{year}</div>}
          {subtitle && <div className="mi-line">{subtitle}</div>}
        </div>
      )}

      <div
        className="mi-viewport"
        onClick={onClickViewport}
      >
        {items.length ? (
          <MobileSlidingStrip
            items={items}
            index={index}
            onIndexChange={setIndex}
          />
        ) : (
          <div className="mi-empty">No media found</div>
        )}

        {/* Vertical scroll gutters (escape hatches for page scroll) */}
        <div className="mi-gutter mi-gutter--top" />
        <div className="mi-gutter mi-gutter--bottom" />
      </div>

      <div className="mi-dots">
        <PaginationDots index={index} total={total} maxVisible={9} onDotClick={setIndex} />
      </div>
    </div>
  );
}
