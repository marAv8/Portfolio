//ContactModal.jsx
import React from 'react';
import ReactDOM from 'react-dom';
import './ContactModal.css';

export default function ContactModal({ onClose }) {
  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
      <div className="contact-info-top">
          <a
            href="mailto:mara.vetis8@gmail.com"
            className="email-link-glow"
          >
           maravetis0@gmail.com
          </a>
          <p className="location">Los Angeles</p>
      </div>

      <div className="resume-content-centered">
        <ul className="artist-statement">
        Constructed with React, Three.js and WebGl. Each cluster is its own world born from sketches and reimagined through MidJourney.
                    </ul>

      </div>



        <p className="resume-note">Resume & project details available upon request.</p>

        <button className="modal-close-text-btn" onClick={onClose}>Close</button>
      </div>
    </div>,
    document.getElementById('modal-root')
  );
}
