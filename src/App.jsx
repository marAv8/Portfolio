// src/App.jsx
import React, { useState, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ScreenSizeProvider } from './contexts/ScreenSizeContext';
import { ModalContext } from './contexts/ModalContext';
import Nav from './components/Navigation/Nav';
import ContactModal from './components/ContactInfo/ContactModal';
import CanvasScene from './components/LandingPage/CanvasScene';
import './App.css';

// LAZY: split the heavy concepts scene
const ConceptScene = React.lazy(() =>
  import('./components/MainContent/ConceptScene')
    .then(m => ({ default: m.default ?? m.ConceptScene }))
);


function AppContent() {
  const location = useLocation();
  const [showContact, setShowContact] = useState(false);
  const isConceptPage = location.pathname === '/concepts';
  const isLanding = location.pathname === '/';

  return (
    <ModalContext.Provider value={showContact}>
      {!isLanding && (
        <>
          <Nav
            onContactClick={() => setShowContact(true)}
            isConceptPage={isConceptPage}
          />
          {showContact && <ContactModal onClose={() => setShowContact(false)} />}
        </>
      )}

      <Routes>
        <Route
          path="/"
          element={<CanvasScene />}
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
