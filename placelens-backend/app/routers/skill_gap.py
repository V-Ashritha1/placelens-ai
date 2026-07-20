from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.crud.resume import get_resume
from app.crud.skill_gap import create_skill_gap_analysis, list_skill_gap_analyses
from app.database import get_db
from app.models.user import User
from app.schemas.skill_gap import SkillGapOut, SkillGapRequest
from app.services.skill_gap_engine import generate_skill_gap

router = APIRouter(prefix="/api/skill-gap", tags=["Skill Gap Analysis"])


@router.post("/analyze", response_model=SkillGapOut)
def analyze_skill_gap(
    payload: SkillGapRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = get_resume(db, payload.resume_id, current_user.id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if not resume.raw_text:
        raise HTTPException(status_code=422, detail="No extractable text found in this resume")

    result = generate_skill_gap(resume.raw_text, payload.target_role)

    analysis = create_skill_gap_analysis(
        db=db,
        owner_id=current_user.id,
        resume_id=payload.resume_id,
        target_role=payload.target_role,
        overall_readiness=result["overall_readiness"],
        skills=result["skills"],
        recommendations=result["recommendations"],
        ai_summary=result.get("ai_summary", ""),
    )

    return SkillGapOut(
        id=analysis.id,
        resume_id=analysis.resume_id,
        target_role=analysis.target_role,
        overall_readiness=analysis.overall_readiness,
        ai_summary=analysis.ai_summary or "",
        skills=analysis.skills,
        recommendations=analysis.recommendations,
        created_at=analysis.created_at,
    )


@router.get("", response_model=list[SkillGapOut])
def get_skill_gap_history(
    resume_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    analyses = list_skill_gap_analyses(db, current_user.id, resume_id=resume_id)
    return [
        SkillGapOut(
            id=a.id,
            resume_id=a.resume_id,
            target_role=a.target_role,
            overall_readiness=a.overall_readiness,
            ai_summary=a.ai_summary or "",
            skills=a.skills,
            recommendations=a.recommendations,
            created_at=a.created_at,
        )
        for a in analyses
    ]