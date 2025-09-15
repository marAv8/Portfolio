import React, { useEffect } from "react";

/**
 * Full-screen, centered orb preloader for MOBILE.
 * Opaque matte, clear "Loading…" label, and body scroll lock while visible.
 */
export default function PreloadMaskMobile({ visible, label = "Loading…" }) {
  useEffect(() => {
    if (visible) document.body.classList.add("overlay-open");
    else document.body.classList.remove("overlay-open");
    return () => document.body.classList.remove("overlay-open");
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="pmobile-root"
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: "#000", // opaque: no show-through
        zIndex: 9000,       // if you want nav above loader, give nav a higher z-index
        pointerEvents: "none",
      }}
    >
      <div style={{ textAlign: "center", pointerEvents: "none" }}>
        <div
          style={{
            width: 30,
            height: 30,
            margin: "0 auto",
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 50% 50%, rgba(255,246,188,0.96), rgba(230,217,170,0.78) 62%, rgba(0,0,0,0) 74%)",
            boxShadow:
              "0 0 14px 5px rgba(255,246,188,0.35), 0 0 28px 10px rgba(230,217,170,0.22)",
            animation: "pmobile-flicker 10ms infinite alternate",
          }}
        />
        <div
          style={{
            marginTop: 12,
            fontSize: 15,
            letterSpacing: 0.3,
            color: "rgba(255,255,255,0.9)",
          }}
        >
          {label}
        </div>
      </div>

      <style>{`
        @keyframes pmobile-flicker {
          from { transform: scale(0.92); filter: drop-shadow(0 0 3px rgba(255,246,188,.45)); opacity: .9; }
          to   { transform: scale(1.0);  filter: drop-shadow(0 0 6px rgba(255,246,188,.65)); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
