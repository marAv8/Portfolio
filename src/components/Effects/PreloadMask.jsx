import React, { useEffect, useState } from 'react';

const VARIANTS = {
  // warm (root)
  warm: {
    core: 'rgba(255,248,220,1)',
    mid:  'rgba(255,236,179,0.70)',
    glow: 'rgba(255,236,179,0.55)',
  },

  // abyss — brighter core, stronger glow, visible rim
  abyss: {
    core: 'rgba(215,46,60,1)',      // brighter than 179,18,30
    mid:  'rgba(215,46,60,0.72)',
    glow: 'rgba(215,46,60,0.62)',
  },

  // early aliens (aqua/teal)
  early: {
    core: 'rgba(56,225,255,1)',
    mid:  'rgba(0,194,255,0.72)',
    glow: 'rgba(0,214,255,0.68)',
  },
};

export default function PreloadMask({ duration = 3000, variant = 'warm', size = 46 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(t);
  }, [duration]);

  if (!visible) return null;

  const { core, mid, glow, rim } = VARIANTS[variant] ?? VARIANTS.warm;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'black',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        pointerEvents: 'none',
      }}
    >
      <div className="preload-dot" />
      <style>{`
        .preload-dot {
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          /* bright rim like the Early Aliens screenshot */
          border: 2px solid ${rim};

          /* soft core → halo gradient */
          background:
            radial-gradient(55% 55% at 50% 50%,
              ${core} 0%,
              ${mid} 42%,
              rgba(0,0,0,0) 100%);

          /* punchy glow */
          box-shadow:
            0 0 28px ${glow},
            0 0 90px ${glow},
            0 0 160px ${glow};

          mix-blend-mode: screen;
          filter: saturate(115%);
          animation: flicker 0.05s infinite alternate;
        }
        @keyframes flicker {
          from { opacity: 0.45; transform: scale(0.94); }
          to   { opacity: 1;    transform: scale(1.10); }
        }
      `}</style>
    </div>
  );
}
