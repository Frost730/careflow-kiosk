import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { playClick, playSuccess } from "../utils/audio";
import { API_BASE_URL, DOCTORS } from "../utils/constants";

export default function DoctorSelection({ speak }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const patientData = location.state?.patientData;
  const chosenDept = patientData?.department;

  useEffect(() => {
    if (!patientData || !chosenDept) {
      navigate("/departments");
      return;
    }
    speak("Please select one of the available doctors in this department.");
  }, [patientData, chosenDept, navigate]);

  const availableDoctors = DOCTORS[chosenDept] || [];

  const handleSelect = (docName) => {
    playClick();
    setSelectedDoc(docName);
    speak(`${docName} selected.`);
  };

  const handleConfirm = async () => {
    if (!selectedDoc || !patientData) return;

    setLoading(true);
    setErrorMsg("");
    speak("Registering your check in. Please wait...");

    try {
      const response = await fetch(`${API_BASE_URL}/api/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...patientData,
          doctor: selectedDoc
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Server error occurred");
      }

      const registeredPatient = await response.json();
      
      playSuccess();
      speak("Check-in successful! Generating your ticket.");
      
      navigate("/confirmation", {
        state: { registeredPatient }
      });
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to connect to the backend server. Please try again.");
      speak("Failed to register. Please try again or ask for assistance.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen-card glass-panel">
      <div className="screen-header">
        <h2 className="screen-title">Choose Available Physician</h2>
        <span className="step-indicator">Step 3 of 4</span>
      </div>

      {errorMsg && <div className="form-error-msg" style={{ fontSize: "1.1rem", marginBottom: "20px", padding: "10px", backgroundColor: "#fee2e2", border: "1px solid red", borderRadius: "8px" }}>⚠️ {errorMsg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
        <div style={{ fontSize: "1rem", color: "var(--text-muted)" }}>
          Department: <strong style={{ color: "var(--primary)" }}>{chosenDept}</strong>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {availableDoctors.map((doc) => {
            const isSelected = selectedDoc === doc.name;
            return (
              <div
                key={doc.name}
                className={`dept-card ${isSelected ? 'selected' : ''}`}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", textAlign: "left", padding: "20px" }}
                onClick={() => handleSelect(doc.name)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: isSelected ? "var(--primary)" : "var(--primary-light)", color: isSelected ? "white" : "var(--primary)", display: "flex", alignItems: "center", justifyCenter: "center", fontSize: "1.2rem", fontWeight: "bold", justifyContent: "center" }}>
                    👨‍⚕️
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "bold", margin: 0 }}>{doc.name}</h3>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{doc.spec}</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                  <span style={{ fontSize: "0.8rem", padding: "2px 8px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "6px", fontWeight: "600" }}>{doc.room}</span>
                  <span style={{ fontSize: "0.75rem", color: "#10b981", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "6px", height: "6px", backgroundColor: "#10b981", borderRadius: "50%", display: "inline-block" }}></span> Available
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="form-actions" style={{ marginTop: "40px" }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => { playClick(); navigate("/departments", { state: location.state }); }}
          disabled={loading}
        >
          &larr; Back
        </button>

        <button
          type="button"
          className="btn-primary"
          disabled={!selectedDoc || loading}
          onClick={handleConfirm}
        >
          {loading ? (
            <div className="spinner-container">
              <div className="spinner"></div>
              <span>Registering...</span>
            </div>
          ) : (
            "Confirm & Print Token ✔"
          )}
        </button>
      </div>
    </div>
  );
}
