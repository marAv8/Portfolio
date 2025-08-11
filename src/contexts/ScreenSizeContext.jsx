//ScreenSizeContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';

const ScreenSizeContext = createContext();

export function ScreenSizeProvider({ children }) {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const value = {
    isMobile: width <= 768,
    isTablet: width > 768 && width <= 1024,
    isDesktop: width > 1024,
  };

  return (
    <ScreenSizeContext.Provider value={value}>
      {children}
    </ScreenSizeContext.Provider>
  );
}

export function useScreenSize() {
  return useContext(ScreenSizeContext);
}
