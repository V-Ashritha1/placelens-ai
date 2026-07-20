from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)

    role_title = Column(String(120), nullable=True)
    location = Column(String(120), nullable=True)
    plan = Column(String(30), default="Free", nullable=False)

    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_token = Column(String(255), nullable=True, index=True)
    verification_token_expires = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    resumes = relationship("Resume", back_populates="owner", cascade="all, delete-orphan")
    jd_matches = relationship("JDMatch", back_populates="owner", cascade="all, delete-orphan")
    skill_gap_analyses = relationship("SkillGapAnalysis", back_populates="owner", cascade="all, delete-orphan")
    eligibility_checks = relationship("EligibilityCheck", back_populates="owner", cascade="all, delete-orphan")