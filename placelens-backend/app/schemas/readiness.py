from typing import Optional

from pydantic import BaseModel


class ReadinessOut(BaseModel):
    overall_readiness: float
    resumes_analyzed: int
    avg_ats_score: float
    jd_matches_run: int
    eligible_roles_found: int
    top_growth_area: Optional[str] = None
