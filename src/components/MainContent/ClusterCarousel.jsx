// ✅ UPDATED: ClusterCarousel.jsx with direction + mount delay
import React, { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { useScreenSize } from '../../contexts/ScreenSizeContext';
import PaginationDots from '../UI/PaginationDots';
import AnimatedCarouselImage from '../UI/AnimatedCarouselImage';
import './ClusterCarousel.css';

export default function ClusterCarousel({ images = [], onClose }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState('next');
  const [mounted, setMounted] = useState(false);
  const { isMobile, isTablet, isDesktop } = useScreenSize();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const goToPrev = () => {
    setDirection('prev');
    setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setDirection('next');
    setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handlers = useSwipeable({
    onSwipedLeft: goToNext,
    onSwipedRight: goToPrev,
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  const current = images[index];
  if (!current || !mounted) return null;

  return (
    <div className="carousel-wrapper">
      <button className="close-btn" onClick={onClose}>✕</button>

      <div {...handlers} className="carousel-image-container">
        <div className="image-wrapper">
          <AnimatedCarouselImage
            image={current}
            index={index}
            direction={direction}
          />
        </div>
      </div>

      {isDesktop && (
        <div className="carousel-controls">
          <button className="carousel-arrow" onClick={goToPrev}>◀</button>
          <button className="carousel-arrow" onClick={goToNext}>▶</button>
        </div>
      )}

      {(isMobile || isTablet) && (
        <PaginationDots
          index={index}
          total={images.length}
          onDotClick={(newIndex) => {
            setDirection(newIndex > index ? 'next' : 'prev');
            setIndex(newIndex);
          }}
        />
      )}
    </div>
  );
}
