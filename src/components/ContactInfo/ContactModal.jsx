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
        My work begins where I used to end — at the idea that rootedness was a cage.

          For a long time I rejected form, pattern, and place, believing they dulled perception. But when I finally let myself root — not into identity, but into quiet clarity — a language of vision opened.

          The sketches are transmissions from that rooted place: soft, symbolic, not meant to explain but to echo. The AI work is a field of play, a blending of memory, myth, and visual instinct.

          This is not a narrative. It’s a reconstruction of sight — where ideas arrive as images, and images are kept whole.
                    </ul>

      </div>



        <p className="resume-note">Resume & project details available upon request.</p>

        <button className="modal-close-text-btn" onClick={onClose}>Close</button>
      </div>
    </div>,
    document.getElementById('modal-root')
  );
}
