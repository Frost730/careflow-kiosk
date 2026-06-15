import React, { useState, useEffect, useRef } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Link
} from "react-router-dom";
import { playClick } from "./utils/audio";
import ProtectedRoute from "./components/ProtectedRoute";

// Page Views
import WelcomeScreen from "./pages/WelcomeScreen";
import RegistrationForm from "./pages/RegistrationForm";
import DepartmentSelection from "./pages/DepartmentSelection";
import DoctorSelection from "./pages/DoctorSelection";
import TokenConfirmation from "./pages/TokenConfirmation";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [readAloud, setReadAloud] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("kioskTheme") === "dark");
  const secretClicksRef = useRef(0);
  const lastSecretClickRef = useRef(0);

  const speakText = (text) => {
    if (!readAloud) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Speech synthesis failed", e);
    }
  };

  const handleLogoClick = (e) => {
    playClick();
    speakText("Welcome to Patient Self Check In");
    const now = Date.now();
    if (now - lastSecretClickRef.current < 2000) {
      secretClicksRef.current += 1;
      if (secretClicksRef.current >= 5) {
        e.preventDefault();
        secretClicksRef.current = 0; // reset click count
        speakText("Accessing admin portal");
        window.location.hash = "#/admin";
      }
    } else {
      secretClicksRef.current = 1;
    }
    lastSecretClickRef.current = now;
  };

  useEffect(() => {
    if (highContrast) {
      document.body.classList.add("high-contrast");
    } else {
      document.body.classList.remove("high-contrast");
    }
  }, [highContrast]);

  useEffect(() => {
    if (largeText) {
      document.body.classList.add("large-text");
    } else {
      document.body.classList.remove("large-text");
    }
  }, [largeText]);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("kioskTheme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("kioskTheme", "light");
    }
  }, [darkMode]);

  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <Link to="/" className="logo-container" onClick={handleLogoClick}>
            <div className="logo-icon">+</div>
            <span>CareFlow Kiosk</span>
          </Link>
          
          <div className="accessibility-bar">
            <button 
              className={`acc-btn ${darkMode ? 'active' : ''}`}
              onClick={() => {
                playClick();
                const state = !darkMode;
                setDarkMode(state);
                speakText(state ? "Dark mode enabled" : "Dark mode disabled");
              }}
            >
              🌙 {darkMode ? "Light" : "Dark"}
            </button>
            <button 
              className={`acc-btn ${highContrast ? 'active' : ''}`}
              onClick={() => {
                playClick();
                const state = !highContrast;
                setHighContrast(state);
                speakText(state ? "Monochrome mode enabled" : "Monochrome mode disabled");
              }}
            >
              👁 High Contrast
            </button>
            <button 
              className={`acc-btn ${largeText ? 'active' : ''}`}
              onClick={() => {
                playClick();
                const state = !largeText;
                setLargeText(state);
                speakText(state ? "Large text mode enabled" : "Large text mode disabled");
              }}
            >
              🔍 Large Text
            </button>
            <button 
              className={`acc-btn ${readAloud ? 'active' : ''}`}
              onClick={() => {
                playClick();
                const state = !readAloud;
                setReadAloud(state);
                if (state) {
                  setTimeout(() => {
                    try {
                      speakText("Voice assistance activated.");
                    } catch (e) {}
                  }, 100);
                } else {
                  try {
                    window.speechSynthesis.cancel();
                  } catch (e) {}
                }
              }}
            >
              🔊 {readAloud ? "Mute Voice" : "Read Aloud"}
            </button>
          </div>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<WelcomeScreen speak={speakText} />} />
            <Route path="/register" element={<RegistrationForm speak={speakText} />} />
            <Route path="/departments" element={<DepartmentSelection speak={speakText} />} />
            <Route path="/doctors" element={<DoctorSelection speak={speakText} />} />
            <Route path="/confirmation" element={<TokenConfirmation speak={speakText} />} />
            <Route path="/admin/login" element={<AdminLogin speak={speakText} />} />
            
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminDashboard speak={speakText} highContrast={highContrast} />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
