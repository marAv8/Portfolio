import React from "react";
import PaginationDots from "../UI/PaginationDots";

/** mirror of your overlay’s media grabbing, per cluster type */
function extractMediaUrls(type, cluster) {
  let arr = [];
  if (!cluster) return [];
  if (type === "early") arr = cluster.assets ?? [];
  else arr = cluster.images ?? [];
  return (arr || [])
    .map((it) => (typeof it === "string" ? it : it?.src || it?.url || it?.image || it?.path || null))
    .filter(Boolean);
}

export default function MobileInlineCarousel({ type, cluster, onOpenOverlay }) {
  const urls = React.useMemo(() => extractMediaUrls(type, cluster), [type, cluster]);
  const total = urls.length || 1;
  const [index, setIndex] = React.useState(0);

  const title    = cluster?.title || (type === "abyss" ? "Abyss" : type === "early" ? "Protoforms" : "Concepts");
  const year     = cluster?.year || "";
  const subtitle = cluster?.subtitle || "";

  const src = urls[index] || "";
  const isVideo = /\.mp4($|\?)/i.test(src) || /\.webm($|\?)/i.test(src);

  // Swipe with axis lock + page scroll suppression
  const startX = React.useRef(null);
  const startY = React.useRef(null);
  const locked = React.useRef(null);     // 'x' or 'y'
  const swiped = React.useRef(false);    // guard against click-after-swipe
  const THRESH_LOCK  = 8;                // px to decide axis
  const THRESH_SWIPE = 40;               // px to commit slide

  const onTouchStart = (e) => {
    const t = e.touches?.[0];
    startX.current = t?.clientX ?? null;
    startY.current = t?.clientY ?? null;
    locked.current = null;
    swiped.current = false;
  };

  const onTouchMove = (e) => {
    const t = e.touches?.[0];
    if (!t || startX.current == null || startY.current == null) return;

    const dx = t.clientX - startX.current;
    const dy = t.clientY - startY.current;

    if (!locked.current) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > THRESH_LOCK) locked.current = "x";
      else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > THRESH_LOCK) locked.current = "y";
    }

    if (locked.current === "x") {
      e.preventDefault(); // stop vertical page scroll while swiping horizontally
    }
  };

  const onTouchEnd = (e) => {
    const t = e.changedTouches?.[0];
    if (!t || startX.current == null) return;

    const dx = t.clientX - startX.current;

    if (locked.current === "x" && Math.abs(dx) > THRESH_SWIPE) {
      swiped.current = true;
      const dir = dx < 0 ? +1 : -1; // left = next, right = prev
      setIndex((i) => {
        const next = (i + dir) % total;      // wrap around
        return next < 0 ? next + total : next;
      });
    }

    startX.current = null;
    startY.current = null;
    locked.current = null;
  };

  const onClickViewport = () => {
    if (swiped.current) { swiped.current = false; return; } // ignore click triggered by swipe
    onOpenOverlay?.(cluster?.id);
  };

  return (
    <div className="mi-block">
      <div className="mi-meta">
        <div className="mi-title">{title}</div>
        {year && <div className="mi-line">{year}</div>}
        {subtitle && <div className="mi-line">{subtitle}</div>}
      </div>

      <div
        className="mi-viewport"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={onClickViewport}
      >
        {urls.length ? (
          isVideo ? (
            <video className="mi-media" src={src} autoPlay muted loop playsInline />
          ) : (
            <img className="mi-media" src={src} alt="" draggable={false} />
          )
        ) : (
          <div className="mi-empty">No media found</div>
        )}
      </div>

      <div className="mi-dots">
        <PaginationDots index={index} total={total} maxVisible={9} onDotClick={setIndex} />
      </div>
    </div>
  );
}
