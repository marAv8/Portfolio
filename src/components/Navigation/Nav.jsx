// src/components/Navigation/Nav.jsx
import React from "react";
import "./Nav.css";
import { useScreenSize } from "../../contexts/ScreenSizeContext";

export default function Nav({ onContactClick, isConceptPage = false }) {
  const { isMobile } = useScreenSize(); // you already have this context

  // Decide which layout class to use
  const layoutClass = isConceptPage
    ? "top-row"
    : isMobile
    ? "mobile-column"
    : "side-column";

  return (
    <nav className={`nav-container ${layoutClass}`}>
      <div className="nav-pill">
        <a
          href="https://signal-desk-marina.vercel.app/prototypes.html"
          className="nav-link glow"
          style={{ "--delay": "1.3s" }}
        >
          Prototypes
        </a>
      </div>
      <div className="nav-pill">
        <button
          onClick={onContactClick}
          className="nav-link glow contact-btn"
          style={{ "--delay": "1.7s" }}
        >
          Contact
        </button>
      </div>
    </nav>
  );
}
