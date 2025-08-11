//AnimatedCarouselImage.jsx

import React from 'react';
import { useTransition, animated } from '@react-spring/web';

export default function AnimatedCarouselImage({ image, index, direction = 'next' }) {
  const transitions = useTransition(image, {
    key: image?.url,
    from: {
      transform: direction === 'next' ? 'translateX(100%)' : 'translateX(-100%)',
      opacity: 1,
    },
    enter: {
      transform: 'translateX(0%)',
      opacity: 1,
    },
    leave: {
      transform: direction === 'next' ? 'translateX(-100%)' : 'translateX(100%)',
      opacity: 1,
    },
    config: { tension: 170, friction: 22 },
    exitBeforeEnter: true,
  });

  return transitions((style, item) =>
    item ? (
      <animated.img
        src={item.url}
        alt={`Cluster image ${index + 1}`}
        className="carousel-image"
        style={{
          ...style,
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
    ) : null
  );
}

