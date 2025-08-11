import React, { useEffect, useState } from 'react';

export default function PreloadMask({ duration = 3000 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      <div className="preload-dot" />
      <style>{`
        .preload-dot {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(255, 248, 220, 0.95) 0%,
            rgba(255, 236, 179, 0.4) 50%,
            rgba(0, 0, 0, 0) 100%
          );
          animation: flicker 0.05s infinite alternate;
          box-shadow: 0 0 60px rgba(255, 236, 179, 0.4);
        }

        @keyframes flicker {
          from {
            opacity: 0.4;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}
