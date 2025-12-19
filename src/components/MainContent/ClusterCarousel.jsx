import React, { useMemo, useState, useEffect, useCallback } from "react";
import "./ClusterCarousel.css";
import PaginationDots from "../UI/PaginationDots";
import { useScreenSize } from "../../contexts/ScreenSizeContext";
import MobileSlidingStrip from "../Mobile/MobileSlidingStrip";
import TabletSlidingStrip from "../Mobile/TabletSlidingStrip";
import DesktopSlidingStrip from "../Carousel/DesktopSlidingStrip";

export default function ClusterCarousel({
  images = [],
  startIndex = 0,
  index: controlled,
  onIndexChange,
  onClose,
  showDotsDesktop = false, // dots are shown on mobile by default; desktop/tablet can opt in
}) {
  const { isMobile, isTablet } = useScreenSize();

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
  const clamp = useCallback((i, len) => {
    if (!len) return 0;
    return Math.max(0, Math.min(i, len - 1));
  }, []);

  const isControlled = controlled != null;
  const [internal, setInternal] = useState(() =>
    clamp(startIndex || 0, entries.length)
  );
  const idx = isControlled ? clamp(controlled, entries.length) : internal;

  useEffect(() => {
    if (!isControlled)
      setInternal(clamp(startIndex || 0, entries.length));
  }, [startIndex, entries.length, isControlled, clamp]);

  const setIndex = useCallback(
    (update) => {
      const nextRaw = typeof update === "function" ? update(idx) : update;
      const next = clamp(nextRaw, entries.length);
      if (isControlled) {
        onIndexChange?.(next);
      } else {
        setInternal(next);
        onIndexChange?.(next);
      }
    },
    [idx, clamp, entries.length, isControlled, onIndexChange]
  );

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

    <div className="carousel-image-container">
      {isMobile ? (
        <MobileSlidingStrip
          items={entries}
          index={idx}
          onIndexChange={setIndex}
        />
      ) : isTablet ? (
        <TabletSlidingStrip
          items={entries}
          index={idx}
          onIndexChange={setIndex}
        />
      ) : (
        <DesktopSlidingStrip
          items={entries}
          index={idx}
          onIndexChange={setIndex}
        />
      )}
    </div>


      {(isMobile || showDotsDesktop) && (
        <PaginationDots
          index={idx}
          total={entries.length}
          onDotClick={setIndex}
          maxVisible={9}
        />
      )}
    </div>
  );
}
