from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.crud.ats import get_ats_report_by_resume, upsert_ats_report
from app.crud.resume import get_resume, mark_analyzed
from app.database import get_db
from app.models.user import User
from app.schemas.ats import AtsReportOut, AtsScoreRequest, AtsSectionScores
from app.services.ats_scoring import generate_ats_report

router = APIRouter(prefix="/api/ats", tags=["ATS Report"])


def _to_report_out(report) -> AtsReportOut:
    issues = [i for i in report.issues if i.kind == "issue"]
    strengths = [i for i in report.issues if i.kind == "strength"]

    return AtsReportOut(
        id=report.id,
        resume_id=report.resume_id,
        overall_score=report.overall_score,
        sections=AtsSectionScores(
            formatting=report.formatting_score,
            keyword=report.keyword_score,
            structure=report.structure_score,
            metadata=report.metadata_score,
            impact=report.impact_score,
        ),
        issues=issues,
        strengths=strengths,
        scanned_at=report.scanned_at,
    )


@router.post("/analyze", response_model=AtsReportOut)
def analyze_resume(
    payload: AtsScoreRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = get_resume(db, payload.resume_id, current_user.id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if not resume.raw_text:
        raise HTTPException(status_code=422, detail="No extractable text found in this resume")

    result = generate_ats_report(resume.raw_text)

    report = upsert_ats_report(
        db=db,
        resume_id=resume.id,
        scores=result["scores"],
        issues=result["issues"],
        strengths=result["strengths"],
    )
    mark_analyzed(db, resume)

    return _to_report_out(report)


@router.get("/{resume_id}", response_model=AtsReportOut)
def get_ats_report(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = get_resume(db, resume_id, current_user.id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    report = get_ats_report_by_resume(db, resume_id)
    if not report:
        raise HTTPException(status_code=404, detail="No ATS report found for this resume. Run /api/ats/analyze first.")

    return _to_report_out(report)
