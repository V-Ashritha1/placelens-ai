from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship

from app.database import Base


class JDMatch(Base):
    __tablename__ = "jd_matches"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)

    role_title = Column(String(150), nullable=False)
    company = Column(String(150), nullable=False)
    location = Column(String(150), nullable=True)
    jd_text = Column(Text, nullable=False)

    match_score = Column(Float, nullable=False)
    matched_keywords = Column(Text, nullable=False)
    missing_keywords = Column(Text, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="jd_matches")
