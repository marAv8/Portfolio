// Nav.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import './Nav.css'

export default function Nav({ onContactClick, isConceptPage = false }) {
  return (
<nav className={`nav-container ${isConceptPage ? 'top-row' : 'side-column'}`}>
      <div className="nav-bg">
        <Link
          to={isConceptPage ? '/' : '/concepts'}
          className="nav-link glow"
          style={{ '--delay': '0.5s' }}
        >
          {isConceptPage ? 'Home' : 'Concepts'}
        </Link>
        <a
          href="https://zora.co/@marav8"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-link glow"
          style={{ '--delay': '1.1s' }}
        >
          Zora
        </a>
        <button
          onClick={onContactClick}
          className="nav-link glow contact-btn"
          style={{ '--delay': '1.7s' }}
        >
          About
        </button>
      </div>
    </nav>
  )
}
