from typing import Optional

from sqlalchemy.orm import Session

from app.models.skill_gap import SkillGapAnalysis, SkillEntry


def create_skill_gap_analysis(
    db: Session,
    owner_id: int,
    resume_id: int,
    target_role: str,
    overall_readiness: float,
    skills: list[dict],
    recommendations: list[dict],
    ai_summary: str = "",
) -> SkillGapAnalysis:
    analysis = SkillGapAnalysis(
        owner_id=owner_id,
        resume_id=resume_id,
        target_role=target_role,
        overall_readiness=overall_readiness,
        recommendations=recommendations,
        ai_summary=ai_summary,
    )
    db.add(analysis)
    db.flush()

    for skill in skills:
        db.add(SkillEntry(analysis_id=analysis.id, **skill))

    db.commit()
    db.refresh(analysis)
    return analysis


def list_skill_gap_analyses(
    db: Session, owner_id: int, resume_id: Optional[int] = None
) -> list[SkillGapAnalysis]:
    query = db.query(SkillGapAnalysis).filter(SkillGapAnalysis.owner_id == owner_id)
    if resume_id is not None:
        query = query.filter(SkillGapAnalysis.resume_id == resume_id)
    return query.order_by(SkillGapAnalysis.created_at.desc()).all()

def get_latest_skill_gap_analysis(
    db: Session, owner_id: int, resume_id: Optional[int] = None
) -> Optional[SkillGapAnalysis]:
    query = db.query(SkillGapAnalysis).filter(SkillGapAnalysis.owner_id == owner_id)
    if resume_id is not None:
        query = query.filter(SkillGapAnalysis.resume_id == resume_id)
    return query.order_by(SkillGapAnalysis.created_at.desc()).first()