import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import VirtualKeyboard from "../components/VirtualKeyboard";
import { playClick } from "../utils/audio";

export default function RegistrationForm({ speak }) {
  const navigate = useNavigate();
  
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState({});
  const [activeField, setActiveField] = useState(null);
  const [keyboardType, setKeyboardType] = useState("qwerty");

  const nameRef = useRef(null);
  const ageRef = useRef(null);
  const mobileRef = useRef(null);
  const addressRef = useRef(null);

  useEffect(() => {
    speak("Please fill in your details. All fields except address are required.");
  }, []);

  const validateField = (fieldName, value) => {
    let error = "";
    if (fieldName === "name") {
      if (!value.trim()) {
        error = "Full Name is strictly required.";
      }
    } else if (fieldName === "age") {
      const parsedAge = parseInt(value, 10);
      if (!value) {
        error = "Age is strictly required.";
      } else if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
        error = "Age must be an integer between 1 and 120.";
      }
    } else if (fieldName === "gender") {
      if (!value) {
        error = "Gender selection is required.";
      }
    } else if (fieldName === "mobile") {
      if (!value) {
        error = "Mobile number is strictly required.";
      } else if (!/^\d{10}$/.test(value)) {
        error = "Mobile number must be exactly 10 digits.";
      }
    }
    
    setErrors(prev => {
      const updated = { ...prev };
      if (error) {
        updated[fieldName] = error;
      } else {
        delete updated[fieldName];
      }
      return updated;
    });
  };

  const handleFocus = (fieldName, type, ref) => {
    playClick();
    setActiveField(fieldName);
    setKeyboardType(type);
    
    if (ref && ref.current) {
      setTimeout(() => {
        ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  };

  const handleVirtualKeyPress = (key) => {
    playClick();
    let currentVal = "";
    let setter = null;
    let maxLen = 999;
    
    if (activeField === "name") {
      currentVal = name;
      setter = setName;
    } else if (activeField === "age") {
      currentVal = age;
      setter = setAge;
      maxLen = 3;
    } else if (activeField === "mobile") {
      currentVal = mobile;
      setter = setMobile;
      maxLen = 10;
    } else if (activeField === "address") {
      currentVal = address;
      setter = setAddress;
    }

    if (!setter) return;

    let newVal = currentVal;
    if (key === "Backspace") {
      newVal = currentVal.slice(0, -1);
    } else if (key === "Space") {
      newVal = currentVal + " ";
    } else if (key === "Clear") {
      newVal = "";
    } else {
      if (currentVal.length < maxLen) {
        newVal = currentVal + key;
      }
    }

    setter(newVal);
    validateField(activeField, newVal);
  };

  const handleGenderChange = (val) => {
    playClick();
    setGender(val);
    validateField("gender", val);
    speak(`Gender selected: ${val}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    playClick();
    
    validateField("name", name);
    validateField("age", age);
    validateField("gender", gender);
    validateField("mobile", mobile);

    const hasErrors = !name.trim() || 
                      !age || 
                      parseInt(age, 10) < 1 || 
                      parseInt(age, 10) > 120 || 
                      !gender || 
                      !/^\d{10}$/.test(mobile);

    if (hasErrors) {
      speak("Please correct the errors in the form before proceeding.");
      return;
    }

    speak("Details submitted. Now please select a department.");
    navigate("/departments", {
      state: {
        patientData: {
          name: name.trim(),
          age: parseInt(age, 10),
          gender,
          mobile,
          address: address.trim() || null
        }
      }
    });
  };

  return (
    <div className={`screen-card glass-panel ${activeField ? 'keyboard-active-padding' : ''}`}>
      <div className="screen-header">
        <h2 className="screen-title">Register Patient Details</h2>
        <span className="step-indicator">Step 1 of 4</span>
      </div>

      <form onSubmit={handleSubmit} className="form-grid two-cols">
        <div className="form-group form-span-2">
          <label className="form-label" htmlFor="patient-name">Full Name *</label>
          <input
            id="patient-name"
            ref={nameRef}
            type="text"
            className={`form-input ${errors.name ? 'error' : ''}`}
            placeholder="Enter full name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              validateField("name", e.target.value);
            }}
            onFocus={() => handleFocus("name", "qwerty", nameRef)}
            inputMode="none"
            required
          />
          {errors.name && <span className="form-error-msg">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="patient-age">Age (1-120) *</label>
          <input
            id="patient-age"
            ref={ageRef}
            type="text"
            className={`form-input ${errors.age ? 'error' : ''}`}
            placeholder="Enter age"
            value={age}
            onChange={(e) => {
              setAge(e.target.value);
              validateField("age", e.target.value);
            }}
            onFocus={() => handleFocus("age", "numeric", ageRef)}
            inputMode="none"
            required
          />
          {errors.age && <span className="form-error-msg">{errors.age}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Gender *</label>
          <div className="gender-options">
            {["Male", "Female", "Other"].map((g) => (
              <label key={g} className="gender-option">
                <input
                  type="radio"
                  name="gender"
                  checked={gender === g}
                  onChange={() => handleGenderChange(g)}
                  onFocus={() => setActiveField(null)}
                />
                <span className="gender-label">{g}</span>
              </label>
            ))}
          </div>
          {errors.gender && <span className="form-error-msg">{errors.gender}</span>}
        </div>

        <div className="form-group form-span-2">
          <label className="form-label" htmlFor="patient-mobile">Mobile Number (10 digits) *</label>
          <input
            id="patient-mobile"
            ref={mobileRef}
            type="text"
            className={`form-input ${errors.mobile ? 'error' : ''}`}
            placeholder="e.g. 9876543210"
            value={mobile}
            onChange={(e) => {
              setMobile(e.target.value);
              validateField("mobile", e.target.value);
            }}
            onFocus={() => handleFocus("mobile", "numeric", mobileRef)}
            inputMode="none"
            required
          />
          {errors.mobile && <span className="form-error-msg">{errors.mobile}</span>}
        </div>

        <div className="form-group form-span-2">
          <label className="form-label" htmlFor="patient-address">Address (Optional)</label>
          <input
            id="patient-address"
            ref={addressRef}
            type="text"
            className="form-input"
            placeholder="Enter physical address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onFocus={() => handleFocus("address", "qwerty", addressRef)}
            inputMode="none"
          />
        </div>

        <div className="form-actions form-span-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => { playClick(); navigate("/"); }}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="btn-primary"
            disabled={
              Object.keys(errors).length > 0 || !name || !age || !gender || !mobile
            }
          >
            Next: Select Department &rarr;
          </button>
        </div>
      </form>

      {activeField && (
        <VirtualKeyboard
          type={keyboardType}
          onKey={handleVirtualKeyPress}
          onClose={() => { playClick(); setActiveField(null); }}
        />
      )}
    </div>
  );
}
