from sqlalchemy.orm import Session

from app.models.resume import Resume
from app.models.ats_report import AtsReport
from app.models.jd_match import JDMatch


def get_dashboard_data(db: Session, owner_id: int) -> dict:
    resumes = (
        db.query(Resume)
        .filter(Resume.owner_id == owner_id)
        .order_by(Resume.uploaded_at.desc())
        .all()
    )
    resume_ids = [r.id for r in resumes]
    resume_lookup = {r.id: r for r in resumes}

    total_resumes = len(resumes)

    ats_reports: list[AtsReport] = []
    if resume_ids:
        ats_reports = (
            db.query(AtsReport)
            .filter(AtsReport.resume_id.in_(resume_ids))
            .order_by(AtsReport.scanned_at.asc())
            .all()
        )

    jd_matches: list[JDMatch] = (
        db.query(JDMatch)
        .filter(JDMatch.owner_id == owner_id)
        .order_by(JDMatch.created_at.desc())
        .all()
    )

    total_analyses = len(ats_reports) + len(jd_matches)

    # Best ATS score across all resumes
    best_ats_score = None
    best_resume_info = None
    if ats_reports:
        best_report = max(ats_reports, key=lambda r: r.overall_score)
        best_ats_score = best_report.overall_score
        best_resume = resume_lookup.get(best_report.resume_id)
        if best_resume:
            best_resume_info = {
                "resume_id": best_resume.id,
                "file_name": best_resume.display_name or best_resume.file_name,
                "best_ats_score": best_report.overall_score,
                "last_analyzed_at": best_report.scanned_at,
            }

    # Best JD match
    best_jd_match_score = None
    best_jd_match_role = None
    if jd_matches:
        best_match = max(jd_matches, key=lambda m: m.match_score)
        best_jd_match_score = best_match.match_score
        best_jd_match_role = best_match.role_title

    # Last analyzed resume (most recent ATS scan)
    last_analyzed_resume = None
    if ats_reports:
        latest_report = max(ats_reports, key=lambda r: r.scanned_at)
        latest_resume = resume_lookup.get(latest_report.resume_id)
        if latest_resume:
            last_analyzed_resume = {
                "resume_id": latest_resume.id,
                "file_name": latest_resume.display_name or latest_resume.file_name,
                "analyzed_at": latest_report.scanned_at,
            }

    # ATS trend, chronological
    ats_trend = [
        {
            "resume_id": report.resume_id,
            "file_name": (
                resume_lookup[report.resume_id].display_name
                or resume_lookup[report.resume_id].file_name
                if report.resume_id in resume_lookup
                else "Unknown resume"
            ),
            "score": report.overall_score,
            "scanned_at": report.scanned_at,
        }
        for report in ats_reports
    ]

    # Recent activities: uploads + ATS scans + JD matches, merged and sorted
    activities: list[dict] = []

    for resume in resumes:
        activities.append(
            {
                "type": "upload",
                "resume_id": resume.id,
                "resume_name": resume.display_name or resume.file_name,
                "description": "Resume uploaded",
                "timestamp": resume.uploaded_at,
            }
        )

    for report in ats_reports:
        resume = resume_lookup.get(report.resume_id)
        activities.append(
            {
                "type": "ats_analyzed",
                "resume_id": report.resume_id,
                "resume_name": (resume.display_name or resume.file_name) if resume else "Unknown resume",
                "description": f"ATS analyzed — {report.overall_score}% score",
                "timestamp": report.scanned_at,
            }
        )

    for match in jd_matches:
        resume = resume_lookup.get(match.resume_id) if match.resume_id else None
        activities.append(
            {
                "type": "jd_matched",
                "resume_id": match.resume_id,
                "resume_name": (resume.display_name or resume.file_name) if resume else "Unknown resume",
                "description": f"Matched {match.role_title} at {match.company} — {match.match_score}%",
                "timestamp": match.created_at,
            }
        )

    activities.sort(key=lambda a: a["timestamp"], reverse=True)
    recent_activities = activities[:10]

    return {
        "best_ats_score": best_ats_score,
        "best_jd_match_score": best_jd_match_score,
        "best_jd_match_role": best_jd_match_role,
        "total_resumes": total_resumes,
        "total_analyses": total_analyses,
        "last_analyzed_resume": last_analyzed_resume,
        "best_resume": best_resume_info,
        "ats_trend": ats_trend,
        "recent_activities": recent_activities,
    }