// src/components/PaginationDots.jsx
import React from "react";
import { useScreenSize } from "../../contexts/ScreenSizeContext";
import "./PaginationDots.css";

export default function PaginationDots({ index, total, onDotClick }) {
  const { isMobile, isTablet } = useScreenSize();

  // ✅ Only render on mobile or tablet
  if (!isMobile && !isTablet) return null;

  return (
    <div
      className={`pagination-dots-container ${isMobile ? "mobile" : "tablet"}`}
    >
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`pagination-dot ${index === i ? "active" : ""}`}
          onClick={() => onDotClick(i)}
        />
      ))}
    </div>
  );
}
