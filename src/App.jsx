// src/App.jsx
import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ScreenSizeProvider } from './contexts/ScreenSizeContext';
import { ModalContext } from './contexts/ModalContext';

import Nav from './components/Navigation/Nav';
import ContactModal from './components/ContactInfo/ContactModal';

// EAGER: keep landing scene as a normal import
import CanvasScene from './components/LandingPage/CanvasScene';

// LAZY: split the heavy concepts scene
const ConceptScene = React.lazy(() =>
  import('./components/MainContent/ConceptScene')
    .then(m => ({ default: m.default ?? m.ConceptScene }))
);

import './App.css';

function AppContent() {
  const location = useLocation();
  const [showContact, setShowContact] = useState(false);
  const [startAssetAnimation, setStartAssetAnimation] = useState(false);

  const isConceptPage = location.pathname === '/concepts';

  useEffect(() => {
    const t = setTimeout(() => setStartAssetAnimation(true), 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <ModalContext.Provider value={showContact}>
      <Nav
        onContactClick={() => setShowContact(true)}
        isConceptPage={isConceptPage}
      />
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}

      <Routes>
        <Route
          path="/"
          element={<CanvasScene startAssetAnimation={startAssetAnimation} />}
        />
        <Route
          path="/concepts"
          element={
            <Suspense fallback={<div style={{ color:'#aaa', padding:16 }}>Loading scene…</div>}>
              <ConceptScene />
            </Suspense>
          }
        />
      </Routes>
    </ModalContext.Provider>
  );
}

export default function App() {
  return (
    <ScreenSizeProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ScreenSizeProvider>
  );
}
