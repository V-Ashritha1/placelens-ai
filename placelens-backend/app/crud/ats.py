from typing import Optional
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.ats_report import AtsReport, AtsIssue


def upsert_ats_report(
    db: Session,
    resume_id: int,
    scores: dict,
    issues: list[dict],
    strengths: list[dict],
) -> AtsReport:
    report = db.query(AtsReport).filter(AtsReport.resume_id == resume_id).first()

    if report:
        db.query(AtsIssue).filter(AtsIssue.report_id == report.id).delete()
        report.overall_score = scores["overall_score"]
        report.formatting_score = scores["formatting_score"]
        report.keyword_score = scores["keyword_score"]
        report.structure_score = scores["structure_score"]
        report.metadata_score = scores["metadata_score"]
        report.impact_score = scores["impact_score"]
        report.scanned_at = datetime.now(timezone.utc)
    else:
        report = AtsReport(resume_id=resume_id, **scores)
        db.add(report)
        db.flush()

    for issue in issues:
        db.add(AtsIssue(report_id=report.id, kind="issue", **issue))
    for strength in strengths:
        db.add(AtsIssue(report_id=report.id, kind="strength", severity=None, **strength))

    db.commit()
    db.refresh(report)
    return report


def get_ats_report_by_resume(db: Session, resume_id: int) -> Optional[AtsReport]:
    return db.query(AtsReport).filter(AtsReport.resume_id == resume_id).first()
