from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ResumeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    file_name: str
    display_name: Optional[str] = None
    file_size_kb: int
    content_type: str
    status: str
    is_default: bool
    uploaded_at: datetime


class ResumeListOut(BaseModel):
    total: int
    resumes: list[ResumeOut]


class ResumeRenameRequest(BaseModel):
    name: str