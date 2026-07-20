from datetime import datetime

from pydantic import BaseModel, ConfigDict


class EligibilityRequest(BaseModel):
    role_title: str
    company: str
    experience_level: str
    resume_id: int


class EligibilityRequirementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    label: str
    met: bool


class EligibilityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    resume_id: int
    role_title: str
    company: str
    experience_level: str
    result: str
    met_requirements: int
    total_requirements: int
    requirements: list[EligibilityRequirementOut]
    created_at: datetime