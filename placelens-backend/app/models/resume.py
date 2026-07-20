from datetime import datetime

from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    file_name = Column(String(255), nullable=False)
    display_name = Column(String(255), nullable=True)
    file_path = Column(String(500), nullable=False)
    file_size_kb = Column(Integer, nullable=False)
    content_type = Column(String(100), nullable=False)

    raw_text = Column(Text, nullable=True)
    status = Column(String(30), default="Uploaded", nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)

    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="resumes")
    ats_report = relationship("AtsReport", back_populates="resume", uselist=False, cascade="all, delete-orphan")