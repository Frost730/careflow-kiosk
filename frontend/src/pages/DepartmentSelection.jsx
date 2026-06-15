import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { playClick } from "../utils/audio";
import { API_BASE_URL, DEPARTMENTS } from "../utils/constants";

export default function DepartmentSelection({ speak }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedDept, setSelectedDept] = useState(null);
  const [stats, setStats] = useState(null);

  const patientData = location.state?.patientData;

  useEffect(() => {
    if (!patientData) {
      navigate("/register");
      return;
    }
    speak("Please choose the department you wish to visit.");

    const loadStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/public/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadStats();
  }, [patientData, navigate]);

  const handleSelect = (deptName) => {
    playClick();
    setSelectedDept(deptName);
    speak(`${deptName} selected.`);
  };

  const handleConfirm = () => {
    if (!selectedDept || !patientData) return;
    
    speak("Department selected. Now choose your doctor.");
    // Route to doctor selection step
    navigate("/doctors", {
      state: {
        patientData: {
          ...patientData,
          department: selectedDept
        }
      }
    });
  };

  return (
    <div className="screen-card glass-panel">
      <div className="screen-header">
        <h2 className="screen-title">Select Hospital Department</h2>
        <span className="step-indicator">Step 2 of 4</span>
      </div>

      <div className="dept-grid">
        {DEPARTMENTS.map((dept) => {
          const Icon = dept.icon;
          const isSelected = selectedDept === dept.name;
          const deptStat = stats ? stats[dept.name] : null;

          return (
            <div
              key={dept.name}
              className={`dept-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleSelect(dept.name)}
            >
              <div className="dept-icon">
                <Icon />
              </div>
              <div className="dept-name">{dept.name}</div>
              <div className="dept-desc">{dept.desc}</div>
              
              {deptStat && (
                <div style={{ marginTop: "10px", fontSize: "0.8rem", padding: "4px 8px", backgroundColor: isSelected ? "var(--primary)" : "var(--bg-app)", color: isSelected ? "white" : "var(--text-muted)", borderRadius: "100px", fontWeight: "600", width: "100%" }}>
                  Queue: {deptStat.waiting} wait | ~{deptStat.est_wait_mins} mins
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => { playClick(); navigate("/register", { state: location.state }); }}
        >
          &larr; Back
        </button>

        <button
          type="button"
          className="btn-primary"
          disabled={!selectedDept}
          onClick={handleConfirm}
        >
          Next: Choose Doctor &rarr;
        </button>
      </div>
    </div>
  );
}
