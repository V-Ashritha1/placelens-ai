from sqlalchemy.orm import Session

from app.crud.ats import get_ats_report_by_resume
from app.crud.eligibility import count_eligible
from app.crud.jd import count_jd_matches
from app.crud.resume import list_resumes
from app.crud.skill_gap import get_latest_skill_gap_analysis


def compute_readiness(db: Session, owner_id: int) -> dict:
    resumes = list_resumes(db, owner_id)
    resumes_analyzed = len(resumes)

    ats_scores = []
    for r in resumes:
        report = get_ats_report_by_resume(db, r.id)
        if report:
            ats_scores.append(report.overall_score)

    avg_ats_score = round(sum(ats_scores) / len(ats_scores), 1) if ats_scores else 0.0
    jd_matches_run = count_jd_matches(db, owner_id)
    eligible_roles_found = count_eligible(db, owner_id)

    latest_skill_gap = get_latest_skill_gap_analysis(db, owner_id)
    top_growth_area = None
    if latest_skill_gap and latest_skill_gap.skills:
        weakest = min(latest_skill_gap.skills, key=lambda s: s.level - s.required)
        top_growth_area = weakest.name

    skill_readiness = latest_skill_gap.overall_readiness if latest_skill_gap else 0.0
    components = [c for c in [avg_ats_score, skill_readiness] if c > 0]
    overall_readiness = round(sum(components) / len(components), 1) if components else 0.0

    return {
        "overall_readiness": overall_readiness,
        "resumes_analyzed": resumes_analyzed,
        "avg_ats_score": avg_ats_score,
        "jd_matches_run": jd_matches_run,
        "eligible_roles_found": eligible_roles_found,
        "top_growth_area": top_growth_area,
    }
