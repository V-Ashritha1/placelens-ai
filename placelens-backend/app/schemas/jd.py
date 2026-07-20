from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class JDMatchRequest(BaseModel):
    resume_id: int
    role_title: str
    company: str
    location: Optional[str] = None
    jd_text: str = Field(min_length=20)


class JDMatchOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role_title: str
    company: str
    location: Optional[str] = None
    match_score: float
    matched_keywords: list[str]
    missing_keywords: list[str]
    created_at: datetime
