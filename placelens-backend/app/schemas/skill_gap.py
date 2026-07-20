from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SkillGapRequest(BaseModel):
    resume_id: int
    target_role: str


class SkillEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    category: str
    name: str
    level: float
    required: float


class LearningResourcesOut(BaseModel):
    docs_label: str = ""
    docs_url: str = ""
    youtube_label: str = ""
    youtube_url: str = ""
    github_label: str = ""
    github_url: str = ""
    roadmap: list[str] = []


class RecommendationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    title: str
    why_it_matters: str
    explanation: str
    recommended_project: str
    difficulty: str
    learning_time: str
    ats_impact: str
    interview_benefit: str = ""
    resume_impact: str = ""
    ats_before: float = 0.0
    ats_after: float = 0.0
    resources: LearningResourcesOut = LearningResourcesOut()


class SkillGapOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    resume_id: int
    target_role: str
    overall_readiness: float
    ai_summary: str = ""
    skills: list[SkillEntryOut]
    recommendations: list[RecommendationOut]
    created_at: datetime