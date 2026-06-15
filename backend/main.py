import datetime
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Query, Header, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import init_db, get_db, Patient, Admin, Session as DBSession
from schemas import PatientCreate, PatientResponse, PatientListResponse, AdminLogin, TokenResponse
from auth import verify_password, generate_session_token

# Department prefix mapping for unique token generation
DEPT_PREFIX = {
    "General Medicine": "GEN",
    "Cardiology": "CARD",
    "Orthopedics": "ORTH",
    "Dermatology": "DERM",
    "Pediatrics": "PED"
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables and seed default admin if empty
    init_db()
    yield

app = FastAPI(
    title="Patient Self Check-In Kiosk API",
    description="Backend API for patient check-in, doctor assignment, token generation, and secured administration",
    version="1.4.0",
    lifespan=lifespan
)

# Enable CORS for frontend API consumption
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_current_admin(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> DBSession:
    """
    Dependency to verify the Bearer session token passed in the Authorization header.
    Returns the active DBSession object if valid, otherwise raises 401 Unauthorized.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is missing"
        )
        
    try:
        parts = authorization.split(" ")
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise ValueError("Token must be in 'Bearer <token>' format")
            
        token_str = parts[1]
        session_record = db.query(DBSession).filter(DBSession.token == token_str).first()
        
        if not session_record:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired session token"
            )
            
        return session_record
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )

def generate_unique_token(db: Session, department: str) -> str:
    """
    Generates a unique department-specific token (e.g., CARD-001, CARD-002, etc.).
    Queries the database for the last generated token in this department to increment it.
    """
    prefix = DEPT_PREFIX.get(department, "TK")
    
    last_patient = (
        db.query(Patient)
        .filter(Patient.department == department)
        .order_by(Patient.id.desc())
        .first()
    )
    
    next_num = 1
    if last_patient and last_patient.token:
        try:
            parts = last_patient.token.split("-")
            if len(parts) == 2:
                last_num = int(parts[1])
                next_num = last_num + 1
        except (ValueError, IndexError):
            pass
            
    return f"{prefix}-{next_num:03d}"

# --- PUBLIC ENDPOINTS ---

@app.post("/api/patients", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def register_patient(patient_in: PatientCreate, db: Session = Depends(get_db)):
    """
    Registers a new patient (public access for self-service kiosk).
    Maps doctor assignment, generates their unique token, and stores details in SQLite.
    """
    try:
        token = generate_unique_token(db, patient_in.department)
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        db_patient = Patient(
            name=patient_in.name,
            age=patient_in.age,
            gender=patient_in.gender,
            mobile=patient_in.mobile,
            address=patient_in.address,
            department=patient_in.department,
            doctor=patient_in.doctor,
            token=token,
            created_at=timestamp
        )
        
        db.add(db_patient)
        db.commit()
        db.refresh(db_patient)
        return db_patient
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register patient: {str(e)}"
        )

@app.get("/api/public/stats")
def get_public_stats(db: Session = Depends(get_db)):
    """
    Retrieves aggregated queue statistics and estimated wait times (in minutes) for each department today.
    Does not require admin authorization.
    """
    try:
        today_str = datetime.date.today().strftime("%Y-%m-%d")
        today_patients = db.query(Patient).filter(Patient.created_at.like(f"{today_str}%")).all()
        
        stats = {}
        for dept in DEPT_PREFIX.keys():
            waiting = len([p for p in today_patients if p.department == dept])
            est_wait_mins = waiting * 10
            
            stats[dept] = {
                "waiting": waiting,
                "est_wait_mins": est_wait_mins
            }
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load queue statistics: {str(e)}"
        )

# --- ADMINISTRATIVE AUTH ENDPOINTS ---

@app.post("/api/admin/login", response_model=TokenResponse)
def admin_login(login_in: AdminLogin, db: Session = Depends(get_db)):
    """
    Verifies admin email and password, creates a database session, and returns a bearer token.
    """
    admin = db.query(Admin).filter(Admin.email == login_in.email).first()
    if not admin or not verify_password(admin.hashed_password, login_in.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    token = generate_session_token()
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    session_record = DBSession(
        token=token,
        admin_id=admin.id,
        created_at=timestamp
    )
    
    db.add(session_record)
    db.commit()
    
    return {
        "token": token,
        "email": admin.email,
        "admin_id": admin.id
    }

@app.post("/api/admin/logout")
def admin_logout(current_session: DBSession = Depends(get_current_admin), db: Session = Depends(get_db)):
    """
    Terminates the active session token, logging the administrator out.
    """
    try:
        db.delete(current_session)
        db.commit()
        return {"detail": "Successfully logged out"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to destroy session: {str(e)}"
        )

# --- SECURED PATIENT ENDPOINTS (Requires valid token) ---

@app.get("/api/patients", response_model=PatientListResponse)
def list_patients(
    search: Optional[str] = Query(None, description="Search patients by name (case-insensitive)"),
    department: Optional[str] = Query(None, description="Filter patients by department name"),
    doctor: Optional[str] = Query(None, description="Filter patients by assigned doctor name"),
    skip: int = Query(0, ge=0, description="Offset skips for pagination"),
    limit: int = Query(10, ge=1, le=100, description="Page size limit"),
    current_session: DBSession = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Retrieves all patients using skip/limit pagination with optional search and filters.
    Requires admin session token. Returns matching counts and paginated rows.
    """
    query = db.query(Patient)
    
    if search:
        query = query.filter(Patient.name.like(f"%{search}%"))
        
    if department:
        query = query.filter(Patient.department == department)
        
    if doctor:
        query = query.filter(Patient.doctor == doctor)
        
    total = query.count()
    patients = query.order_by(Patient.id.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "patients": patients
    }

@app.get("/api/patients/{id}", response_model=PatientResponse)
def get_patient(
    id: int, 
    current_session: DBSession = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Retrieves a single patient record by ID. Requires admin session token.
    """
    patient = db.query(Patient).filter(Patient.id == id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {id} not found"
        )
    return patient
