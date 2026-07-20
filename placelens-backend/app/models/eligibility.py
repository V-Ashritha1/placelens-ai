from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.database import Base


class EligibilityCheck(Base):
    __tablename__ = "eligibility_checks"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)

    role_title = Column(String(150), nullable=False)
    company = Column(String(150), nullable=False)
    experience_level = Column(String(30), nullable=False)

    result = Column(String(20), nullable=False)
    met_requirements = Column(Integer, nullable=False)
    total_requirements = Column(Integer, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="eligibility_checks")
    resume = relationship("Resume")
    requirements = relationship("EligibilityRequirement", back_populates="check", cascade="all, delete-orphan")


class EligibilityRequirement(Base):
    __tablename__ = "eligibility_requirements"

    id = Column(Integer, primary_key=True, index=True)
    check_id = Column(Integer, ForeignKey("eligibility_checks.id", ondelete="CASCADE"), nullable=False)

    label = Column(String(255), nullable=False)
    met = Column(Boolean, nullable=False)

    check = relationship("EligibilityCheck", back_populates="requirements")