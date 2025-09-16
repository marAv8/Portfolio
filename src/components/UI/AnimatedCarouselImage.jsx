//AnimatedCarouselImage.jsx

import React from 'react';
import { useTransition, animated } from '@react-spring/web';

export default function AnimatedCarouselImage({ image, index, direction = 'next' }) {
  const transitions = useTransition(image, {
    key: image?.url || image?.full,
    from: { transform: direction === 'next' ? 'translateX(100%)' : 'translateX(-100%)', opacity: 1 },
    enter:{ transform: 'translateX(0%)', opacity: 1 },
    leave:{ transform: direction === 'next' ? 'translateX(-100%)' : 'translateX(100%)', opacity: 1 },
    config: { tension: 170, friction: 22 },
    exitBeforeEnter: true,
  });

  return transitions((style, item) => {
    if (!item) return null;
    const src = item.full || item.url || '';
    const lower = src.toLowerCase();
    const isVideo = lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov');

    const common = {
      style: { ...style, position:'absolute', top:0, left:0, width:'100%', height:'100%', objectFit:'contain' },
      className: 'carousel-image',
      draggable: false,
    };

    return isVideo ? (
      <animated.video
        {...common}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        controls={false}
      />
    ) : (
      <animated.img
        {...common}
        src={src}
        alt={item.title || item.alt || 'Cluster image'}
        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = item.url || e.currentTarget.src; }}
        loading="lazy"
        decoding="async"
      />
    );
  });
}
