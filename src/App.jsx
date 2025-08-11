//App.jsx file
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';
import { ScreenSizeProvider } from './contexts/ScreenSizeContext';

import Nav from './components/Navigation/Nav';
import ContactModal from './components/ContactInfo/ContactModal';
import CanvasScene from './components/LandingPage/CanvasScene';
import ConceptScene from './components/MainContent/ConceptScene';
import { ModalContext } from './contexts/ModalContext'; // <— make sure this is imported
import './App.css'            // ⬅️ make sure this line exists


function AppContent() {
  const location = useLocation();
  const [showContact, setShowContact] = useState(false);
  const [startAssetAnimation, setStartAssetAnimation] = useState(false);

  const isConceptPage = location.pathname === '/concepts';

  useEffect(() => {
    const timer = setTimeout(() => {
      setStartAssetAnimation(true);
    }, 2500);
    return () => clearTimeout(timer);
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
          element={
            <CanvasScene
              startAssetAnimation={startAssetAnimation}
              // 🛑 REMOVE modalOpen from here!
            />
          }
        />
        <Route path="/concepts" element={<ConceptScene />} />
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
