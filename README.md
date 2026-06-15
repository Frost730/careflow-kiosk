# CareFlow - Patient Self Check-In Kiosk with Secure Admin Portal

A production-ready Patient Self Check-In Kiosk application designed for healthcare facilities. This application features a highly responsive, touch-friendly UI for incoming patients and a secured administrative dashboard for clinic staff.

## Technology Stack

- **Frontend**: React.js (Vite, React Router Dom, Custom CSS)
- **Backend**: FastAPI (Python 3)
- **Database**: SQLite (SQLAlchemy ORM)

---

## Directory Structure

```text
patient-kiosk/
├── backend/
│   ├── venv/                 # Python Virtual Environment
│   ├── auth.py               # Security helpers (PBKDF2 hashing, secure token generation)
│   ├── database.py           # SQLite connection, Admin/Session schemas and seeding
│   ├── main.py               # FastAPI server endpoints, token logic, auth guards
│   ├── schemas.py            # Pydantic data validation schemas
│   ├── test_api.py           # API integration and security test script
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── VirtualKeyboard.jsx  # Touch virtual keyboard (QWERTY & Numeric)
│   │   ├── App.jsx           # Main React Router pages, login views, and auth guards
│   │   ├── index.css         # Custom CSS style system and accessibility modes
│   │   └── main.jsx          # React app mounter
│   ├── index.html            # App entrypoint (SEO metadata optimized)
│   ├── package.json          # Node dependency definitions
│   └── vite.config.js        # Vite build config
└── README.md                 # Project Documentation (This file)
```

---

## Features & UX Enhancements

1. **Virtual On-Screen Keyboards**: Custom touch keyboards appear dynamically based on input type (`qwerty` for text inputs like Name, Address, Email, and Password, and `numeric` for Age and Mobile).
2. **Secure Admin Portal**:
   - **Default Admin Account**: Seeding happens automatically on startup:
     - **Email**: `admin@careflow.com`
     - **Password**: `admin123`
   - **Session Tracking**: When logging in, a secure session token is generated and stored in a database table (`sessions`).
   - **Security Guards**: Patient listing and search endpoints are protected with Bearer authorization (`Authorization: Bearer <token>`). Unauthenticated requests are rejected with a `401 Unauthorized` response.
   - **Frontend Route Protection**: Unauthenticated dashboard access redirects automatically to `/admin/login`.
3. **Accessibility Panel**:
   - **High Contrast (Monochrome)**: Applies an accessibility theme utilizing deep blacks and whites with bold borders, meeting requirements for high-contrast viewing and monochrome displays.
   - **Large Text**: Increases font sizing by 25% across the kiosk interface.
   - **Read Aloud (TTS)**: Reads instructions and selected choices aloud using the browser's speech synthesis engine.
4. **Receipt Ticket Print Layout**: Optimizes printing via CSS print media (`@media print`) so that triggering "Print Token Ticket" hides all navigation and buttons, isolating only the formatted ticket.

---

## Installation & Setup

### Prerequisites
- Python (v3.8 or higher)
- Node.js (v18 or higher) & npm

### 1. Run the Backend API Server

Open a terminal window and execute:
```bash
cd backend
python -m venv venv
# On Windows PowerShell (Script execution enabled):
.\venv\Scripts\Activate.ps1
# Or run pip directly (Execution-Policy safe):
.\venv\Scripts\pip.exe install -r requirements.txt
.\venv\Scripts\uvicorn.exe main:app --host 127.0.0.1 --port 8000 --reload
```
The FastAPI backend will start on **`http://127.0.0.1:8000`**. You can view the interactive API documentation at `http://127.0.0.1:8000/docs`.

### 2. Run the Frontend Client

Open a second terminal window and execute:
```bash
cd frontend
npm install
npm run dev
```
The React development server will start on **`http://localhost:5173`**.

---

## API Documentation

The backend exposes the following endpoints:

| Endpoint | Method | Authorization | Description |
|---|---|---|---|
| `/api/patients` | `POST` | Public | Register a patient. Validates inputs, generates a token (e.g. `CARD-001`), saves to SQLite, and returns the patient object. |
| `/api/admin/login` | `POST` | Public | Verifies admin email and password. Returns a session token. |
| `/api/patients` | `GET` | Bearer Token | Retrieve registered patients. Supports query parameters `?search={name}` and `?department={dept}`. |
| `/api/patients/{id}` | `GET` | Bearer Token | Get detailed information about a single patient by ID. |
| `/api/admin/logout` | `POST` | Bearer Token | Terminates the active session token, logging the administrator out. |

---

## Validation Requirements

The system enforces validation at both frontend and backend levels:
- **Full Name**: Required, cannot be blank or only whitespace.
- **Age**: Required, must be an integer between `1` and `120`.
- **Gender**: Required, must be `Male`, `Female`, or `Other`.
- **Mobile Number**: Required, must be exactly `10` digits.
- **Department**: Required, must be one of: `General Medicine`, `Cardiology`, `Orthopedics`, `Dermatology`, or `Pediatrics`.
- **Admin Email**: Valid email format containing `@` and a domain name.
- **Password**: Non-empty string.

---

## Running Verification Tests

To run the automated endpoint validation suite, ensure the backend server is running and execute:
```bash
cd backend
.\venv\Scripts\python.exe test_api.py
```
This tests the full lifecycle of check-ins, searching, security blocks, session creation, and logout destruction.
