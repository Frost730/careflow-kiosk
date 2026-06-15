from typing import Optional, List, Literal
from pydantic import BaseModel, Field, field_validator

DEPARTMENTS = [
    "General Medicine",
    "Cardiology",
    "Orthopedics",
    "Dermatology",
    "Pediatrics"
]

GENDERS = ["Male", "Female", "Other"]

class PatientCreate(BaseModel):
    name: str = Field(..., description="Full Name of the patient")
    age: int = Field(..., ge=1, le=120, description="Age must be between 1 and 120")
    gender: str = Field(..., description="Gender (Male, Female, Other)")
    mobile: str = Field(..., pattern=r"^\d{10}$", description="Mobile number must be exactly 10 digits")
    address: Optional[str] = Field(None, description="Optional patient address")
    department: Literal[
        "General Medicine",
        "Cardiology",
        "Orthopedics",
        "Dermatology",
        "Pediatrics"
    ] = Field(..., description="Target department for check-in")
    doctor: str = Field(..., description="Assigned doctor's name")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Name cannot be empty or blank")
        return stripped

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v: str) -> str:
        stripped = v.strip()
        if stripped not in GENDERS:
            raise ValueError(f"Gender must be one of {', '.join(GENDERS)}")
        return stripped

    @field_validator("doctor")
    @classmethod
    def validate_doctor(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Doctor name cannot be empty")
        return stripped

class PatientResponse(BaseModel):
    id: int
    name: str
    age: int
    gender: str
    mobile: str
    address: Optional[str]
    department: str
    doctor: str
    token: str
    created_at: str

    class Config:
        from_attributes = True

class PatientListResponse(BaseModel):
    total: int
    patients: List[PatientResponse]

class AdminLogin(BaseModel):
    email: str = Field(..., pattern=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", description="Valid administrator email address")
    password: str = Field(..., description="Administrator password")

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not v:
            raise ValueError("Password cannot be empty")
        return v

class TokenResponse(BaseModel):
    token: str
    email: str
    admin_id: int

    class Config:
        from_attributes = True
