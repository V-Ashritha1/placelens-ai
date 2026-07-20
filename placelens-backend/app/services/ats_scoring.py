import re

TARGET_KEYWORDS = [
    "react", "typescript", "javascript", "next.js", "node.js", "python",
    "sql", "ci/cd", "testing", "design systems", "graphql", "rest api",
    "accessibility", "performance", "aws", "docker",
]

ACTION_VERBS = [
    "led", "built", "shipped", "architected", "designed", "improved",
    "reduced", "launched", "optimized", "mentored", "delivered",
]

METRIC_PATTERN = re.compile(r"(\d+%|\$\d+|\d+x|\d+\s*(hours|days|weeks|months|users|ms))", re.IGNORECASE)


def _clamp(value: float, low: float = 0, high: float = 100) -> float:
    return max(low, min(high, value))


def score_formatting(raw_text: str) -> float:
    lines = [l for l in raw_text.splitlines() if l.strip()]
    if not lines:
        return 50.0
    bullet_lines = sum(1 for l in lines if l.strip().startswith(("-", "•", "*")))
    ratio = bullet_lines / max(len(lines), 1)
    score = 60 + ratio * 40
    return round(_clamp(score), 1)


def score_keywords(raw_text: str) -> tuple[float, list[str], list[str]]:
    text = raw_text.lower()
    matched = [kw for kw in TARGET_KEYWORDS if kw in text]
    missing = [kw for kw in TARGET_KEYWORDS if kw not in text]
    score = (len(matched) / len(TARGET_KEYWORDS)) * 100
    return round(_clamp(score), 1), matched, missing


def score_structure(raw_text: str) -> float:
    text = raw_text.lower()
    expected_sections = ["experience", "education", "skills", "summary"]
    present = sum(1 for s in expected_sections if s in text)
    score = (present / len(expected_sections)) * 100
    return round(_clamp(score), 1)


def score_metadata(raw_text: str) -> float:
    has_email = bool(re.search(r"[\w.+-]+@[\w-]+\.[a-z]{2,}", raw_text, re.IGNORECASE))
    has_phone = bool(re.search(r"(\+?\d[\d\s-]{7,}\d)", raw_text))
    score = (int(has_email) + int(has_phone)) / 2 * 100
    return round(_clamp(score if (has_email or has_phone) else 40.0), 1)


def score_impact(raw_text: str) -> float:
    text = raw_text.lower()
    verb_hits = sum(1 for v in ACTION_VERBS if v in text)
    metric_hits = len(METRIC_PATTERN.findall(raw_text))
    score = 40 + min(verb_hits, 6) * 5 + min(metric_hits, 6) * 5
    return round(_clamp(score), 1)


def build_issues_and_strengths(scores: dict, matched_kw: list[str], missing_kw: list[str]) -> tuple[list[dict], list[dict]]:
    issues: list[dict] = []
    strengths: list[dict] = []

    if scores["impact_score"] < 70:
        issues.append({
            "severity": "high",
            "title": "Missing quantifiable metrics",
            "detail": "Several bullet points lack measurable outcomes (%, $, time saved). Add numbers wherever possible.",
        })
    else:
        strengths.append({"title": "Strong quantified impact", "detail": "Bullet points consistently include measurable results."})

    if scores["structure_score"] < 100:
        issues.append({
            "severity": "medium",
            "title": "Incomplete section structure",
            "detail": "One or more standard sections (Experience, Education, Skills, Summary) could not be detected.",
        })
    else:
        strengths.append({"title": "Well-structured sections", "detail": "All standard resume sections are present and clearly labeled."})

    if missing_kw:
        issues.append({
            "severity": "medium",
            "title": "Missing keywords",
            "detail": f"These common role keywords were not found: {', '.join(missing_kw[:5])}.",
        })

    if scores["formatting_score"] >= 80:
        strengths.append({"title": "Clean, parseable formatting", "detail": "Consistent bullet usage should parse reliably in most ATS systems."})
    else:
        issues.append({
            "severity": "low",
            "title": "Inconsistent formatting",
            "detail": "Bullet point usage is inconsistent, which can cause ATS parsers to misread content.",
        })

    if scores["metadata_score"] < 100:
        issues.append({
            "severity": "low",
            "title": "Incomplete contact metadata",
            "detail": "Make sure both an email address and phone number are clearly present near the top of the resume.",
        })

    if matched_kw:
        strengths.append({"title": "Relevant keyword coverage", "detail": f"Resume includes in-demand terms such as {', '.join(matched_kw[:5])}."})

    return issues, strengths


def generate_ats_report(raw_text: str) -> dict:
    formatting = score_formatting(raw_text)
    keyword, matched_kw, missing_kw = score_keywords(raw_text)
    structure = score_structure(raw_text)
    metadata = score_metadata(raw_text)
    impact = score_impact(raw_text)

    overall = round(
        formatting * 0.2 + keyword * 0.3 + structure * 0.2 + metadata * 0.1 + impact * 0.2, 1
    )

    scores = {
        "overall_score": overall,
        "formatting_score": formatting,
        "keyword_score": keyword,
        "structure_score": structure,
        "metadata_score": metadata,
        "impact_score": impact,
    }

    issues, strengths = build_issues_and_strengths(scores, matched_kw, missing_kw)

    return {"scores": scores, "issues": issues, "strengths": strengths}
