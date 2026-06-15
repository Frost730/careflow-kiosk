import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { playClick } from "../utils/audio";
import { API_BASE_URL } from "../utils/constants";

export default function WelcomeScreen({ speak }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    speak("Welcome to Patient Self Check In. Please tap the button to start.");
    
    const loadStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/public/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (e) {
        console.error("Failed to load queue stats:", e);
      }
    };
    
    loadStats();
    const interval = setInterval(loadStats, 20000);
    return () => clearInterval(interval);
  }, []);

  const totalWaiting = stats 
    ? Object.values(stats).reduce((acc, curr) => acc + curr.waiting, 0)
    : 0;

  return (
    <div className="welcome-screen">
      <div className="kiosk-badge">Healthcare Facility Self-Service</div>
      <h1 className="welcome-title">Welcome to CareFlow</h1>
      <p className="welcome-subtitle">
        Check-in quickly for your appointment and get your queue token in a few simple steps.
      </p>
      
      <div className="action-card glass-panel">
        <button 
          className="start-btn" 
          onClick={() => {
            playClick();
            speak("Let's start check in. Please enter your registration details.");
            navigate("/register");
          }}
        >
          Tap to Start Check-In &rarr;
        </button>
        
        <div className="kiosk-instructions">
          <div className="inst-item">
            <span className="inst-num">1</span>
            <span>Register Details</span>
          </div>
          <div className="inst-item">
            <span className="inst-num">2</span>
            <span>Pick Department</span>
          </div>
          <div className="inst-item">
            <span className="inst-num">3</span>
            <span>Choose Doctor</span>
          </div>
        </div>
      </div>

      {stats && (
        <div className="screen-card glass-panel" style={{ marginTop: "40px", padding: "20px", textAlign: "left" }}>
          <div style={{ display: "flex", justifyBetween: "space-between", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "bold" }}>🕒 Live Waiting Area load</h3>
            <span className="kiosk-badge" style={{ margin: 0, padding: "2px 10px", fontSize: "0.8rem", textTransform: "none" }}>
              Total Waiting: <strong>{totalWaiting}</strong>
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
            {Object.entries(stats).map(([name, data]) => (
              <div key={name} className="stat-widget" style={{ padding: "10px", backgroundColor: "var(--bg-app)", borderRadius: "8px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "4px" }}>
                <strong style={{ fontSize: "0.9rem" }}>{name.split(" ")[0]}</strong>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Patients: {data.waiting}</span>
                <span style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: "600" }}>Wait: {data.est_wait_mins}m</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Portal is hidden from the public welcome screen and accessible via a hidden logo gesture */}
    </div>
  );
}
