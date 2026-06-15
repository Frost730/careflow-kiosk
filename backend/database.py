import os
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./patients.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    mobile = Column(String, nullable=False)
    address = Column(String, nullable=True)
    department = Column(String, index=True, nullable=False)
    doctor = Column(String, index=True, nullable=False)
    token = Column(String, nullable=False)
    created_at = Column(String, index=True, nullable=False)

class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True, nullable=False)
    admin_id = Column(Integer, ForeignKey("admins.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(String, nullable=False)

def init_db():
    Base.metadata.create_all(bind=engine)
    
    # Seed default admin if none exists
    db = SessionLocal()
    try:
        admin_count = db.query(Admin).count()
        if admin_count == 0:
            from auth import hash_password
            default_admin = Admin(
                email="admin@careflow.com",
                hashed_password=hash_password("admin123")
            )
            db.add(default_admin)
            db.commit()
            print("Default admin account successfully seeded.")
    except Exception as e:
        print(f"Failed to seed default admin: {e}")
    finally:
        db.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
