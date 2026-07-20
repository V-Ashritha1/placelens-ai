from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AtsTrendPointOut(BaseModel):
    resume_id: int
    file_name: str
    score: float
    scanned_at: datetime


class BestResumeOut(BaseModel):
    resume_id: int
    file_name: str
    best_ats_score: float
    last_analyzed_at: datetime


class LastAnalyzedResumeOut(BaseModel):
    resume_id: int
    file_name: str
    analyzed_at: datetime


class ActivityOut(BaseModel):
    type: str  # "upload" | "ats_analyzed" | "jd_matched" | "resume_reanalyzed"
    resume_id: Optional[int] = None
    resume_name: str
    description: str
    timestamp: datetime


class DashboardOut(BaseModel):
    best_ats_score: Optional[float] = None
    best_jd_match_score: Optional[float] = None
    best_jd_match_role: Optional[str] = None
    total_resumes: int
    total_analyses: int
    last_analyzed_resume: Optional[LastAnalyzedResumeOut] = None
    best_resume: Optional[BestResumeOut] = None
    ats_trend: list[AtsTrendPointOut]
    recent_activities: list[ActivityOut]