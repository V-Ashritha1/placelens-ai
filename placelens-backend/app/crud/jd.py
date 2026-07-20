from typing import Optional

from sqlalchemy.orm import Session

from app.models.jd_match import JDMatch


def create_jd_match(
    db: Session,
    owner_id: int,
    resume_id: int,
    role_title: str,
    company: str,
    location: Optional[str],
    jd_text: str,
    match_score: float,
    matched_keywords: list[str],
    missing_keywords: list[str],
) -> JDMatch:
    match = JDMatch(
        owner_id=owner_id,
        resume_id=resume_id,
        role_title=role_title,
        company=company,
        location=location,
        jd_text=jd_text,
        match_score=match_score,
        matched_keywords=",".join(matched_keywords),
        missing_keywords=",".join(missing_keywords),
    )
    db.add(match)
    db.commit()
    db.refresh(match)
    return match


def list_jd_matches(db: Session, owner_id: int) -> list[JDMatch]:
    return (
        db.query(JDMatch)
        .filter(JDMatch.owner_id == owner_id)
        .order_by(JDMatch.created_at.desc())
        .all()
    )


def count_jd_matches(db: Session, owner_id: int) -> int:
    return db.query(JDMatch).filter(JDMatch.owner_id == owner_id).count()
