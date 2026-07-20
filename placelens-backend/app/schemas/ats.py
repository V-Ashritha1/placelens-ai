from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AtsIssueOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    kind: str
    severity: Optional[str] = None
    title: str
    detail: str


class AtsSectionScores(BaseModel):
    formatting: float
    keyword: float
    structure: float
    metadata: float
    impact: float


class AtsReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    resume_id: int
    overall_score: float
    sections: AtsSectionScores
    issues: list[AtsIssueOut]
    strengths: list[AtsIssueOut]
    scanned_at: datetime


class AtsScoreRequest(BaseModel):
    resume_id: int
