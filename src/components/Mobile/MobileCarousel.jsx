import React from "react";
import PaginationDots from "../UI/PaginationDots";
import "./MobileCarousel.css";

function extractMediaUrls(clusterId, rootCluster, abyssData, earlyAliensData) {
  let arr = [];
  if (clusterId === "cluster-root") arr = rootCluster?.images ?? [];
  else if (clusterId === "cluster-abyss") arr = abyssData?.images ?? [];
  else if (clusterId === "cluster-early-aliens") arr = earlyAliensData?.assets ?? [];
  return (arr || [])
    .map((it) => (typeof it === "string" ? it : it?.src || it?.url || it?.image || it?.path || null))
    .filter(Boolean);
}

export default function MobileCarousel({ clusterId, rootCluster, abyssData, earlyAliensData, onClose }) {
  const [index, setIndex] = React.useState(0);
  const urls = React.useMemo(
    () => extractMediaUrls(clusterId, rootCluster, abyssData, earlyAliensData),
    [clusterId, rootCluster, abyssData, earlyAliensData]
  );

  const meta =
    clusterId === "cluster-root"  ? rootCluster :
    clusterId === "cluster-abyss" ? abyssData :
    clusterId === "cluster-early-aliens" ? earlyAliensData : null;

  React.useEffect(() => {
    document.body.classList.add("overlay-open");
    return () => document.body.classList.remove("overlay-open");
  }, []);

  // swipe
  const startX = React.useRef(null);
  const onTouchStart = (e) => { startX.current = e.touches?.[0]?.clientX ?? null; };
  const onTouchEnd = (e) => {
    const sx = startX.current, ex = e.changedTouches?.[0]?.clientX ?? null;
    startX.current = null;
    if (sx == null || ex == null) return;
    const dx = ex - sx;
    if (Math.abs(dx) > 40)
      setIndex((i) => Math.min(Math.max(i + (dx < 0 ? 1 : -1), 0), Math.max(0, urls.length - 1)));
  };

  const title = meta?.title || (clusterId === "cluster-abyss" ? "Abyss" : clusterId === "cluster-early-aliens" ? "Protoforms" : "Concepts");
  const year  = meta?.year || "";
  const sub   = meta?.subtitle || "";

  const src = urls[index] || "";
  const isVideo = /\.mp4($|\?)/i.test(src) || /\.webm($|\?)/i.test(src);

  return (
    <div className="mc-root" role="dialog" aria-modal="true">
      <div className="mc-top">
        <div className="mc-title">
          <div className="mc-title-line">{title}</div>
          {year ? <div className="mc-subline">{year}</div> : null}
          {sub  ? <div className="mc-subline">{sub}</div>  : null}
        </div>
        <button className="mc-close" aria-label="Close" onClick={onClose}>×</button>
      </div>

      <div className="mc-media" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <button className="mc-zone mc-left"  onClick={() => setIndex((i) => Math.max(i - 1, 0))} aria-label="Previous" />
        <button className="mc-zone mc-right" onClick={() => setIndex((i) => Math.min(i + 1, urls.length - 1))} aria-label="Next" />
        {urls.length ? (
          isVideo ? (
            <video className="mc-img" src={src} autoPlay muted loop playsInline />
          ) : (
            <img className="mc-img" src={src} alt="" draggable={false} />
          )
        ) : (
          <div className="mc-empty">No media found</div>
        )}
      </div>

      <div className="mc-dots">
        <PaginationDots index={index} total={urls.length} maxVisible={9} onDotClick={setIndex} />
      </div>
    </div>
  );
}
