// src/components/Navigation/Nav.jsx
import React from "react";
import { Link } from "react-router-dom";
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
        <Link
          to={isConceptPage ? "/" : "/concepts"}
          className="nav-link glow"
          style={{ "--delay": "0.5s" }}
        >
          {isConceptPage ? "Home" : "Concepts"}
        </Link>
      </div>

      <div className="nav-pill">
        <button
          onClick={onContactClick}
          className="nav-link glow contact-btn"
          style={{ "--delay": "1.7s" }}
        >
          About
        </button>
      </div>
    </nav>
  );
}
