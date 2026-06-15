import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import VirtualKeyboard from "../components/VirtualKeyboard";
import { playClick, playSuccess } from "../utils/audio";
import { API_BASE_URL } from "../utils/constants";

export default function AdminLogin({ speak }) {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const [activeField, setActiveField] = useState(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  useEffect(() => {
    if (localStorage.getItem("adminToken")) {
      navigate("/admin");
      return;
    }
    speak("Admin Portal login page. Please enter your email and password.");
  }, [navigate]);

  const validate = () => {
    const errs = {};
    if (!email) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Enter a valid email address";
    }
    if (!password) {
      errs.password = "Password is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFocus = (field, ref) => {
    playClick();
    setActiveField(field);
    if (ref && ref.current) {
      setTimeout(() => {
        ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  };

  const handleVirtualKeyPress = (key) => {
    playClick();
    let currentVal = activeField === "email" ? email : password;
    let setter = activeField === "email" ? setEmail : setPassword;
    
    let newVal = currentVal;
    if (key === "Backspace") {
      newVal = currentVal.slice(0, -1);
    } else if (key === "Space") {
      newVal = currentVal + " ";
    } else if (key === "Clear") {
      newVal = "";
    } else {
      newVal = currentVal + key;
    }
    setter(newVal);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    playClick();
    setApiError("");
    
    if (!validate()) return;

    setLoading(true);
    speak("Authenticating. Please wait...");

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Authentication failed");
      }

      const data = await response.json();
      playSuccess();
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminEmail", data.email);
      speak("Login successful! Welcome to the Admin Dashboard.");
      navigate("/admin");
    } catch (err) {
      console.error(err);
      setApiError(err.message || "Server connection error");
      speak("Login failed. " + (err.message || "Please check credentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`screen-card glass-panel ${activeField ? 'keyboard-active-padding' : ''}`} style={{ maxWidth: "450px" }}>
      <div className="screen-header">
        <h2 className="screen-title">Admin Login</h2>
      </div>

      {apiError && <div className="form-error-msg" style={{ fontSize: "1rem", marginBottom: "16px", padding: "10px", backgroundColor: "#fee2e2", border: "1px solid red", borderRadius: "8px" }}>⚠️ {apiError}</div>}

      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-group">
          <label className="form-label" htmlFor="admin-email">Admin Email</label>
          <input
            id="admin-email"
            ref={emailRef}
            type="text"
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder="e.g. admin@careflow.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => handleFocus("email", emailRef)}
            inputMode="none"
            required
          />
          {errors.email && <span className="form-error-msg">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            ref={passwordRef}
            type="password"
            className={`form-input ${errors.password ? 'error' : ''}`}
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => handleFocus("password", passwordRef)}
            inputMode="none"
            required
          />
          {errors.password && <span className="form-error-msg">{errors.password}</span>}
        </div>

        <div className="form-actions" style={{ flexDirection: "column", gap: "12px", marginTop: "24px" }}>
          <button
            type="submit"
            className="btn-primary"
            style={{ width: "100%" }}
            disabled={loading}
          >
            {loading ? (
              <div className="spinner-container">
                <div className="spinner"></div>
                <span>Signing in...</span>
              </div>
            ) : (
              "Sign In ✔"
            )}
          </button>
          
          <button
            type="button"
            className="btn-secondary"
            style={{ width: "100%" }}
            onClick={() => { playClick(); navigate("/"); }}
            disabled={loading}
          >
            Back to Check-In
          </button>
        </div>
      </form>

      {activeField && (
        <VirtualKeyboard
          type="qwerty"
          onKey={handleVirtualKeyPress}
          onClose={() => { playClick(); setActiveField(null); }}
        />
      )}
    </div>
  );
}
