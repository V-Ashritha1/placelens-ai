from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship

from app.database import Base


class AtsReport(Base):
    __tablename__ = "ats_reports"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), unique=True, nullable=False)

    overall_score = Column(Float, nullable=False)
    formatting_score = Column(Float, nullable=False)
    keyword_score = Column(Float, nullable=False)
    structure_score = Column(Float, nullable=False)
    metadata_score = Column(Float, nullable=False)
    impact_score = Column(Float, nullable=False)

    scanned_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    resume = relationship("Resume", back_populates="ats_report")
    issues = relationship("AtsIssue", back_populates="report", cascade="all, delete-orphan")


class AtsIssue(Base):
    __tablename__ = "ats_issues"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("ats_reports.id", ondelete="CASCADE"), nullable=False)

    kind = Column(String(20), nullable=False)
    severity = Column(String(10), nullable=True)
    title = Column(String(255), nullable=False)
    detail = Column(Text, nullable=False)

    report = relationship("AtsReport", back_populates="issues")
