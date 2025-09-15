// src/contexts/ScreenSizeContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';

export const ScreenSizeContext = React.createContext({ isMobile:false, isTablet:false, width:0 });

/** Breakpoints (match your expectations)
 *  mobile:  0–900
 *  tablet:  901–1280
 *  desktop: 1280+
 */
const MOBILE_MAX = 900;
const TABLET_MAX = 1280;




export function ScreenSizeProvider({ children }) {
  const [width, setWidth] = React.useState(() => window.innerWidth);
  React.useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isMobile = width <= MOBILE_MAX;
  const isTablet = width > MOBILE_MAX && width <= TABLET_MAX;
  return (
    <ScreenSizeContext.Provider value={{ isMobile, isTablet, width }}>
      {children}
    </ScreenSizeContext.Provider>
  );
}
export const useScreenSize = () => React.useContext(ScreenSizeContext);
