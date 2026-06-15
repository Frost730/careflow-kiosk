import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { playClick, playPrintChime } from "../utils/audio";

export default function TokenConfirmation({ speak }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(15);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);

  const patient = location.state?.registeredPatient;

  useEffect(() => {
    if (!patient) {
      navigate("/");
      return;
    }
    
    speak(`Registration complete. ${patient.name}, your token number is ${patient.token}. Please take your printed ticket.`);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/");
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [patient, navigate]);

  const handlePrint = () => {
    setIsPrinting(true);
    playPrintChime();
    speak("Printing ticket. Please take it from the slot.");
    
    setTimeout(() => {
      try {
        window.print();
      } catch (e) {
        console.error(e);
      }
      setIsPrinting(false);
      setPrintSuccess(true);
    }, 1000);
  };

  if (!patient) return null;

  const barcodeBars = Array.from({ length: 28 }).map((_, idx) => {
    const width = (idx % 3 === 0) ? "4px" : (idx % 2 === 0) ? "2px" : "1px";
    return <div key={idx} className="barcode-bar" style={{ width }} />;
  });

  return (
    <div className="screen-card glass-panel">
      <div className="screen-header">
        <h2 className="screen-title">Check-In Confirmation</h2>
        <span className="step-indicator">Step 4 of 4</span>
      </div>

      {printSuccess && (
        <div className="toast-msg">
          <span>✔ Token printed successfully! Please proceed to the waiting area.</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
        <div className="ticket-wrapper">
          <div className={`ticket ${isPrinting ? 'print-animation' : ''}`}>
            <div className="ticket-header">
              <div className="ticket-hospital">CareFlow Medical Center</div>
              <div style={{ fontSize: "0.8rem", marginTop: "4px" }}>PATIENT SELF CHECK-IN KIOSK</div>
            </div>
            
            <div className="ticket-body">
              <div className="ticket-field">
                <span className="ticket-label">Patient Name:</span>
                <span className="ticket-val">{patient.name}</span>
              </div>
              <div className="ticket-field">
                <span className="ticket-label">Age / Gender:</span>
                <span className="ticket-val">{patient.age} / {patient.gender}</span>
              </div>
              <div className="ticket-field">
                <span className="ticket-label">Mobile Number:</span>
                <span className="ticket-val">{patient.mobile}</span>
              </div>
              <div className="ticket-field">
                <span className="ticket-label">Department:</span>
                <span className="ticket-val">{patient.department}</span>
              </div>
              
              {/* Doctor Details printed on ticket */}
              <div className="ticket-field">
                <span className="ticket-label">Assigned Doctor:</span>
                <span className="ticket-val" style={{ textDecoration: "underline" }}>{patient.doctor}</span>
              </div>
              
              <div className="ticket-token-container">
                <div className="ticket-label" style={{ marginBottom: "6px" }}>YOUR QUEUE TOKEN</div>
                <div className="ticket-token-num">{patient.token}</div>
                <div className="ticket-barcode">
                  {barcodeBars}
                </div>
              </div>
              
              <div className="ticket-field" style={{ fontSize: "0.8rem" }}>
                <span className="ticket-label">Date/Time:</span>
                <span className="ticket-val">{patient.created_at}</span>
              </div>
            </div>

            <div className="ticket-footer">
              <div>Please keep this ticket.</div>
              <div>We will call your token number shortly.</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", marginTop: "16px" }}>
        <button
          onClick={handlePrint}
          className="btn-primary"
          style={{ width: "100%", maxWidth: "300px", fontSize: "1.25rem" }}
          disabled={isPrinting}
        >
          {isPrinting ? "Printing..." : "🖨 Print Token Ticket"}
        </button>

        <button
          onClick={() => { playClick(); navigate("/"); }}
          className="btn-secondary"
          style={{ width: "100%", maxWidth: "300px" }}
        >
          Finish Check-In
        </button>

        <div className="countdown-notice">
          Automatically returning to welcome screen in <span className="countdown-num">{countdown}</span> seconds.
        </div>
      </div>
    </div>
  );
}
