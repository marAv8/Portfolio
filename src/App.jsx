// src/App.jsx
import React, { useState, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ScreenSizeProvider } from './contexts/ScreenSizeContext';
import { ModalContext } from './contexts/ModalContext';
import Nav from './components/Navigation/Nav';
import ContactModal from './components/ContactInfo/ContactModal';
import './App.css';

// LAZY: split the heavy concepts scene
const ConceptScene = React.lazy(() =>
  import('./components/MainContent/ConceptScene')
    .then(m => ({ default: m.default ?? m.ConceptScene }))
);


function AppContent() {
  const location = useLocation();
  const [showContact, setShowContact] = useState(false);

  return (
    <ModalContext.Provider value={showContact}>
      <Nav
        onContactClick={() => setShowContact(true)}
        isConceptPage
      />
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}

      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={<div style={{ color:'#aaa', padding:16 }}>Loading scene…</div>}>
              <ConceptScene />
            </Suspense>
          }
        />
        <Route
          path="/clusters"
          element={<Navigate to={{ pathname: '/', search: location.search, hash: location.hash }} replace />}
        />
        <Route
          path="/concepts"
          element={<Navigate to={{ pathname: '/', search: location.search, hash: location.hash }} replace />}
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
