import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { playClick } from "../utils/audio";
import { API_BASE_URL, DEPARTMENTS, DOCTORS } from "../utils/constants";

export default function AdminDashboard({ speak, highContrast }) {
  const navigate = useNavigate();
  
  // Table state
  const [patients, setPatients] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Filters & Query state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [docFilter, setDocFilter] = useState(""); // Doctor filter addition
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const adminEmail = localStorage.getItem("adminEmail") || "Admin";

  // Flat array of all doctor names for filter dropdown options
  const flatDoctors = Object.values(DOCTORS).flat().map(d => d.name);

  // Keystroke Debounce (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchPatients = async (search = "", dept = "", doc = "", page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const skip = (page - 1) * pageSize;
      
      let url = `${API_BASE_URL}/api/patients?skip=${skip}&limit=${pageSize}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (dept) url += `&department=${encodeURIComponent(dept)}`;
      if (doc) url += `&doctor=${encodeURIComponent(doc)}`;

      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminEmail");
        speak("Session expired. Please log in again.");
        navigate("/admin/login");
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients);
        setTotalCount(data.total);
      }
    } catch (e) {
      console.error("Failed to fetch patients", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients(debouncedSearchQuery, deptFilter, docFilter, currentPage);
  }, [debouncedSearchQuery, deptFilter, docFilter, currentPage]);

  const handleDeptFilterChange = (val) => {
    setDeptFilter(val);
    setCurrentPage(1);
    speak(val ? `Filtered by ${val}` : "Removed department filter");
  };

  const handleDocFilterChange = (val) => {
    setDocFilter(val);
    setCurrentPage(1);
    speak(val ? `Filtered by ${val}` : "Removed doctor filter");
  };

  const handleLogout = async () => {
    playClick();
    const token = localStorage.getItem("adminToken");
    speak("Signing out...");
    try {
      await fetch(`${API_BASE_URL}/api/admin/logout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminEmail");
      navigate("/");
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="admin-grid">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem" }}>Administration Portal</h1>
          <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Logged in as: <strong>{adminEmail}</strong></span>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn-secondary" onClick={() => { playClick(); navigate("/"); }}>
            Kiosk Screen
          </button>
          <button className="btn-primary" style={{ backgroundColor: "#ef4444" }} onClick={handleLogout}>
            Logout ⏻
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats">
        <div className="stat-card glass-panel">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <span className="stat-val">{totalCount}</span>
            <span className="stat-label">Matching Check-Ins</span>
          </div>
        </div>
        {DEPARTMENTS.slice(0, 4).map(d => (
          <div key={d.name} className="stat-card glass-panel">
            <div className="stat-icon" style={{ fontSize: "1.2rem" }}>+</div>
            <div className="stat-info">
              <span className="stat-label">{d.name}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter Controls */}
      <div className="screen-card glass-panel" style={{ maxWidth: "none", padding: "24px" }}>
        <div className="admin-controls">
          <div className="search-input-wrapper">
            <svg className="search-icon-svg" viewBox="0 0 24 24">
              <path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5Z"/>
            </svg>
            <input
              type="text"
              placeholder="Search patients by name..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <select
              className="filter-select"
              value={deptFilter}
              onChange={(e) => handleDeptFilterChange(e.target.value)}
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map(d => (
                <option key={d.name} value={d.name}>{d.name}</option>
              ))}
            </select>

            {/* Doctor Filter select dropdown */}
            <select
              className="filter-select"
              value={docFilter}
              onChange={(e) => handleDocFilterChange(e.target.value)}
            >
              <option value="">All Doctors</option>
              {flatDoctors.map(doc => (
                <option key={doc} value={doc}>{doc}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Patients Table */}
        <div className="table-wrapper">
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <div className="spinner" style={{ margin: "0 auto 12px auto" }}></div>
              <span>Fetching patient records...</span>
            </div>
          ) : patients.length === 0 ? (
            <div className="no-records">No patients registered matching the search/filter filters.</div>
          ) : (
            <table className="patients-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Patient Name</th>
                  <th>Department</th>
                  <th>Assigned Doctor</th>
                  <th>Registered At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: "bold" }}>{p.token}</td>
                    <td>{p.name}</td>
                    <td>
                      <span className="kiosk-badge" style={{ margin: 0, padding: "2px 8px", fontSize: "0.75rem" }}>
                        {p.department}
                      </span>
                    </td>
                    <td><strong>{p.doctor}</strong></td>
                    <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{p.created_at}</td>
                    <td>
                      <button 
                        className="patient-row-btn" 
                        onClick={() => {
                          playClick();
                          setSelectedPatient(p);
                          speak(`Viewing details for ${p.name}`);
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Table Pagination Controls */}
        {totalPages > 0 && (
          <div className="table-pagination-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", flexWrap: "wrap", gap: "10px" }}>
            <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
              Showing <strong>{startIndex}</strong> to <strong>{endIndex}</strong> of <strong>{totalCount}</strong> patient registrations
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="acc-btn"
                style={{ padding: "6px 12px", border: "1px solid var(--border)", borderRadius: "6px" }}
                disabled={currentPage === 1 || loading}
                onClick={() => { playClick(); setCurrentPage(prev => prev - 1); }}
              >
                &larr; Prev
              </button>
              <span style={{ display: "flex", alignItems: "center", padding: "0 8px", fontSize: "0.9rem", fontWeight: "600" }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="acc-btn"
                style={{ padding: "6px 12px", border: "1px solid var(--border)", borderRadius: "6px" }}
                disabled={currentPage >= totalPages || loading}
                onClick={() => { playClick(); setCurrentPage(prev => prev + 1); }}
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="modal-overlay" onClick={() => { playClick(); setSelectedPatient(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1.25rem", fontWeight: "bold" }}>Patient Details</h3>
              <button className="modal-close-btn" onClick={() => { playClick(); setSelectedPatient(null); }}>&times;</button>
            </div>
            <div className="modal-details">
              <div className={`modal-detail-row ${highContrast ? 'high-contrast' : ''}`}>
                <span className="ticket-label">Queue Token:</span>
                <span className="ticket-val" style={{ color: "var(--primary)" }}>{selectedPatient.token}</span>
              </div>
              <div className={`modal-detail-row ${highContrast ? 'high-contrast' : ''}`}>
                <span className="ticket-label">Full Name:</span>
                <span className="ticket-val">{selectedPatient.name}</span>
              </div>
              <div className={`modal-detail-row ${highContrast ? 'high-contrast' : ''}`}>
                <span className="ticket-label">Age / Gender:</span>
                <span className="ticket-val">{selectedPatient.age} / {selectedPatient.gender}</span>
              </div>
              <div className={`modal-detail-row ${highContrast ? 'high-contrast' : ''}`}>
                <span className="ticket-label">Mobile Number:</span>
                <span className="ticket-val">{selectedPatient.mobile}</span>
              </div>
              <div className={`modal-detail-row ${highContrast ? 'high-contrast' : ''}`}>
                <span className="ticket-label">Department:</span>
                <span className="ticket-val">{selectedPatient.department}</span>
              </div>
              
              {/* Doctor Details in Detail Modal */}
              <div className={`modal-detail-row ${highContrast ? 'high-contrast' : ''}`}>
                <span className="ticket-label">Assigned Doctor:</span>
                <span className="ticket-val" style={{ fontWeight: "bold" }}>{selectedPatient.doctor}</span>
              </div>
              
              <div className={`modal-detail-row ${highContrast ? 'high-contrast' : ''}`}>
                <span className="ticket-label">Physical Address:</span>
                <span className="ticket-val">{selectedPatient.address || "N/A"}</span>
              </div>
              <div className={`modal-detail-row ${highContrast ? 'high-contrast' : ''}`}>
                <span className="ticket-label">Check-In Time:</span>
                <span className="ticket-val">{selectedPatient.created_at}</span>
              </div>
            </div>
            <button
              className="btn-secondary"
              style={{ width: "100%" }}
              onClick={() => { playClick(); setSelectedPatient(null); }}
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
