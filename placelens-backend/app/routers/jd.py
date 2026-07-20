from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.crud.jd import create_jd_match, list_jd_matches
from app.crud.resume import get_resume
from app.database import get_db
from app.models.user import User
from app.schemas.jd import JDMatchOut, JDMatchRequest
from app.services.jd_matching import compute_match

router = APIRouter(prefix="/api/jd", tags=["JD Matcher"])


def _to_match_out(match) -> JDMatchOut:
    return JDMatchOut(
        id=match.id,
        role_title=match.role_title,
        company=match.company,
        location=match.location,
        match_score=match.match_score,
        matched_keywords=match.matched_keywords.split(",") if match.matched_keywords else [],
        missing_keywords=match.missing_keywords.split(",") if match.missing_keywords else [],
        created_at=match.created_at,
    )


@router.post("/analyze", response_model=JDMatchOut)
def analyze_jd(
    payload: JDMatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = get_resume(db, payload.resume_id, current_user.id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if not resume.raw_text:
        raise HTTPException(status_code=422, detail="No extractable text found in this resume")

    result = compute_match(resume.raw_text, payload.jd_text)

    match = create_jd_match(
        db=db,
        owner_id=current_user.id,
        resume_id=resume.id,
        role_title=payload.role_title,
        company=payload.company,
        location=payload.location,
        jd_text=payload.jd_text,
        match_score=result["match_score"],
        matched_keywords=result["matched_keywords"],
        missing_keywords=result["missing_keywords"],
    )
    return _to_match_out(match)


@router.get("", response_model=list[JDMatchOut])
def get_jd_matches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    matches = list_jd_matches(db, current_user.id)
    return [_to_match_out(m) for m in matches]
