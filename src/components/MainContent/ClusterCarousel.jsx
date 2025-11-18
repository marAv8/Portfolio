import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import "./ClusterCarousel.css";
import PaginationDots from "../UI/PaginationDots";

export default function ClusterCarousel({
  images = [],
  startIndex = 0,
  index: controlled,
  onIndexChange,
  onClose,
}) {
  const wrapperRef = useRef(null);

  /* ----------------------------
   * Normalize image/video entries
   * ---------------------------- */
  const entries = useMemo(() => {
    const list = Array.isArray(images) ? images : [];
    return list
      .filter(Boolean)
      .map((item) => {
        if (typeof item === "string") {
          return {
            src: item,
            isVideo: /\.(mp4|webm)(\?.*)?$/i.test(item),
            poster: undefined,
          };
        }
        const src =
          item.full || item.url || item.src || item.image || item.path || "";
        const isVideo =
          item.type === "video" ||
          (typeof src === "string" &&
            /\.(mp4|webm)(\?.*)?$/i.test(src));
        return {
          src,
          isVideo,
          poster: item.poster || item.thumb || undefined,
        };
      })
      .filter((e) => Boolean(e.src));
  }, [images]);

  /* ----------------------------
   * Index helpers
   * ---------------------------- */
  const wrap = useCallback((i, len) => {
    if (!len) return 0;
    return ((i % len) + len) % len;
  }, []);

  const isControlled = controlled != null;
  const [internal, setInternal] = useState(() =>
    wrap(startIndex || 0, entries.length)
  );
  const idx = isControlled ? wrap(controlled, entries.length) : internal;

  useEffect(() => {
    if (!isControlled)
      setInternal(wrap(startIndex || 0, entries.length));
  }, [startIndex, entries.length, isControlled, wrap]);

  const setIndex = useCallback(
    (update) => {
      const nextRaw = typeof update === "function" ? update(idx) : update;
      const next = wrap(nextRaw, entries.length);
      if (isControlled) {
        onIndexChange?.(next);
      } else {
        setInternal(next);
        onIndexChange?.(next);
      }
    },
    [idx, wrap, entries.length, isControlled, onIndexChange]
  );

  const next = useCallback(() => setIndex((i) => i + 1), [setIndex]);
  const prev = useCallback(() => setIndex((i) => i - 1), [setIndex]);

  /* ----------------------------
   * Swipe detection
   * ---------------------------- */
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

  /* ----------------------------
   * Current media entry
   * ---------------------------- */
  const current =
    entries[idx] || {
      src: "",
      isVideo: false,
      poster: undefined,
    };

  const { src, isVideo, poster } = current;

  /* ----------------------------
   * Render
   * ---------------------------- */
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
        <div className="image-wrapper" ref={wrapperRef}>
          {entries.length ? (
            isVideo ? (
              <video
                key={src}
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
                key={src}
                className="carousel-image"
                src={src}
                alt=""
                draggable={false}
              />
            )
          ) : (
            <div className="mc-empty">No media found</div>
          )}
        </div>
      </div>

      <PaginationDots
        index={idx}
        total={entries.length}
        onDotClick={setIndex}
        maxVisible={9}
      />
    </div>
  );
}
