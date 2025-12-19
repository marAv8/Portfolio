//ContactModal.jsx
import React from 'react';
import ReactDOM from 'react-dom';
import './ContactModal.css';

export default function ContactModal({ onClose }) {
  return ReactDOM.createPortal(
    <div className="contact-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="contact-modal-card"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="contact-modal-close" aria-label="Close" onClick={onClose}>
          <span aria-hidden="true">×</span>
        </button>

        <div className="contact-modal-content">
          <div className="contact-modal-header">
            <a href="mailto:mara.vetis8@gmail.com" className="contact-modal-email">
              maravetis0@gmail.com
            </a>
            {/* <p className="contact-modal-location">Los Angeles, CA</p> */}
          </div>

          <p className="contact-modal-description">
            Constructed with React Three Fiber (Three.js). Each cluster is its own world born from sketches
            and reimagined through MidJourney.
          </p>

          <p className="contact-modal-footer">Resume &amp; detailed project notes available upon request.</p>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root')
  );
}
