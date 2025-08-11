import React from 'react';

export default function ContactButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        top: '8rem',
        left: '2rem',
        zIndex: 10000,
        background: 'none',
        border: 'none',
        fontSize: '1rem',
        color: 'white',
        cursor: 'pointer',
        textShadow: '0 0 6px rgba(255, 255, 255, 0.6), 0 0 10px rgba(255, 255, 255, 0.4)',
      }}
    >
      Contact
    </button>
  );
}