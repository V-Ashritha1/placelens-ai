from typing import Optional

from sqlalchemy.orm import Session

from app.models.eligibility import EligibilityCheck, EligibilityRequirement


def create_eligibility_check(
    db: Session,
    owner_id: int,
    resume_id: int,
    role_title: str,
    company: str,
    experience_level: str,
    result: str,
    met_requirements: int,
    total_requirements: int,
    requirements: list[dict],
) -> EligibilityCheck:
    check = EligibilityCheck(
        owner_id=owner_id,
        resume_id=resume_id,
        role_title=role_title,
        company=company,
        experience_level=experience_level,
        result=result,
        met_requirements=met_requirements,
        total_requirements=total_requirements,
    )
    db.add(check)
    db.flush()

    for req in requirements:
        db.add(EligibilityRequirement(check_id=check.id, **req))

    db.commit()
    db.refresh(check)
    return check


def list_eligibility_checks(
    db: Session, owner_id: int, resume_id: Optional[int] = None
) -> list[EligibilityCheck]:
    query = db.query(EligibilityCheck).filter(EligibilityCheck.owner_id == owner_id)
    if resume_id is not None:
        query = query.filter(EligibilityCheck.resume_id == resume_id)
    return query.order_by(EligibilityCheck.created_at.desc()).all()


def count_eligible(db: Session, owner_id: int) -> int:
    return (
        db.query(EligibilityCheck)
        .filter(EligibilityCheck.owner_id == owner_id, EligibilityCheck.result == "eligible")
        .count()
    )