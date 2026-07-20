from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, JSON, Text
from sqlalchemy.orm import relationship

from app.database import Base


class SkillGapAnalysis(Base):
    __tablename__ = "skill_gap_analyses"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)

    target_role = Column(String(150), nullable=False)
    overall_readiness = Column(Float, nullable=False)
    recommendations = Column(JSON, nullable=False, default=list)
    ai_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="skill_gap_analyses")
    resume = relationship("Resume")
    skills = relationship("SkillEntry", back_populates="analysis", cascade="all, delete-orphan")


class SkillEntry(Base):
    __tablename__ = "skill_entries"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("skill_gap_analyses.id", ondelete="CASCADE"), nullable=False)

    category = Column(String(100), nullable=False)
    name = Column(String(100), nullable=False)
    level = Column(Float, nullable=False)
    required = Column(Float, nullable=False)

    analysis = relationship("SkillGapAnalysis", back_populates="skills")