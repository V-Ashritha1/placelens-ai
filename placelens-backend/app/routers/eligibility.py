import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.crud.eligibility import create_eligibility_check, list_eligibility_checks
from app.crud.resume import get_resume
from app.database import get_db
from app.models.user import User
from app.schemas.eligibility import EligibilityOut, EligibilityRequest

router = APIRouter(prefix="/api/eligibility", tags=["Eligibility Checker"])

# ---------------------------------------------------------------------------
# Role-specific, skill/evidence-based requirement definitions.
# Each requirement is only marked "met" if its keywords are actually found
# in the resume text — nothing here is auto-satisfied.
# ---------------------------------------------------------------------------

ROLE_REQUIREMENTS: dict[str, list[dict]] = {
    "ai/ml software engineer intern": [
        {"label": "Python proficiency", "keywords": ["python"]},
        {"label": "Machine Learning fundamentals", "keywords": ["machine learning", "scikit-learn", "sklearn", "supervised learning", "unsupervised learning", "regression", "classification model", "ml model"]},
        {"label": "Deep Learning fundamentals", "keywords": ["deep learning", "neural network", "cnn", "rnn", "lstm", "transformer"]},
        {"label": "TensorFlow or PyTorch", "keywords": ["tensorflow", "pytorch", "keras", "torch"]},
        {"label": "SQL", "keywords": ["sql", "mysql", "postgresql", "postgres", "sqlite", "database"]},
        {"label": "Git/GitHub", "keywords": ["git", "github", "gitlab", "version control"]},
        {"label": "REST APIs / FastAPI / Flask", "keywords": ["rest api", "restful", "fastapi", "flask", "api development", "api endpoint", "api"]},
        {"label": "Data Structures & Algorithms", "keywords": ["data structures", "algorithms", "dsa", "leetcode"]},
        {"label": "Bachelor's degree (completed or pursuing)", "keywords": ["bachelor", "b.e", "b.tech", "bsc", "b.sc", "university", "college", "computer science", "engineering"]},
        {"label": "AI/ML projects", "keywords": ["project", "model", "dataset", "trained", "prediction", "classifier", "detection", "notebook"]},
    ],
    "ai engineer": [
        {"label": "Python proficiency", "keywords": ["python"]},
        {"label": "Machine Learning", "keywords": ["machine learning", "scikit-learn", "sklearn"]},
        {"label": "Deep Learning", "keywords": ["deep learning", "neural network", "cnn", "rnn", "transformer"]},
        {"label": "TensorFlow or PyTorch", "keywords": ["tensorflow", "pytorch", "keras", "torch"]},
        {"label": "NLP, Computer Vision, or LLM/GenAI experience", "keywords": ["nlp", "natural language processing", "computer vision", "opencv", "llm", "large language model", "generative ai", "genai", "gpt", "huggingface", "transformers"]},
        {"label": "Model deployment / MLOps", "keywords": ["model deployment", "mlops", "model serving", "inference api"]},
        {"label": "Docker", "keywords": ["docker", "containerization", "dockerfile"]},
        {"label": "REST APIs", "keywords": ["rest api", "restful", "api development", "fastapi", "flask"]},
        {"label": "Git/GitHub", "keywords": ["git", "github", "gitlab"]},
        {"label": "AI/ML projects or production experience", "keywords": ["project", "deployed", "production", "internship", "built a model", "trained"]},
    ],
    "data scientist": [
        {"label": "Python proficiency", "keywords": ["python"]},
        {"label": "SQL", "keywords": ["sql", "mysql", "postgresql", "postgres", "query"]},
        {"label": "Statistics", "keywords": ["statistics", "statistical", "hypothesis testing", "regression", "probability"]},
        {"label": "Machine Learning", "keywords": ["machine learning", "scikit-learn", "sklearn", "predictive model"]},
        {"label": "Data manipulation (Pandas/NumPy)", "keywords": ["pandas", "numpy", "dataframe"]},
        {"label": "Data Visualization", "keywords": ["matplotlib", "seaborn", "plotly", "data visualization", "tableau", "power bi"]},
        {"label": "A/B Testing / experimentation", "keywords": ["a/b testing", "ab testing", "experimentation"]},
        {"label": "Git/GitHub", "keywords": ["git", "github", "gitlab"]},
        {"label": "Data science projects", "keywords": ["project", "dataset", "analysis", "model", "notebook"]},
    ],
    "data analyst": [
        {"label": "SQL", "keywords": ["sql", "mysql", "postgresql", "postgres", "query"]},
        {"label": "Excel", "keywords": ["excel", "spreadsheet", "pivot table", "vlookup"]},
        {"label": "Statistics", "keywords": ["statistics", "statistical", "probability"]},
        {"label": "Data Cleaning / Wrangling", "keywords": ["data cleaning", "data wrangling", "data preprocessing", "etl"]},
        {"label": "Data Visualization", "keywords": ["data visualization", "matplotlib", "seaborn", "chart", "graph"]},
        {"label": "Power BI / Tableau", "keywords": ["power bi", "powerbi", "tableau"]},
        {"label": "Dashboarding / Reporting", "keywords": ["dashboard", "reporting", "report"]},
        {"label": "Data storytelling / communication", "keywords": ["insight", "presentation", "storytelling", "stakeholder"]},
        {"label": "Analyst projects", "keywords": ["project", "dataset", "analysis"]},
    ],
    "backend developer": [
        {"label": "Server-side language (Java/Python/Node)", "keywords": ["java", "python", "node.js", "nodejs", "node"]},
        {"label": "SQL / relational database", "keywords": ["sql", "mysql", "postgresql", "postgres", "database", "mongodb"]},
        {"label": "REST APIs", "keywords": ["rest api", "restful", "api development", "api endpoint", "api"]},
        {"label": "Backend framework (Spring Boot/FastAPI/Flask/Express)", "keywords": ["spring boot", "springboot", "fastapi", "flask", "express", "express.js"]},
        {"label": "Database design", "keywords": ["database design", "schema design", "normalization", "erd", "database"]},
        {"label": "Git/GitHub", "keywords": ["git", "github", "gitlab"]},
        {"label": "Testing (unit/integration)", "keywords": ["unit test", "integration test", "junit", "pytest", "mockito", "testing"]},
        {"label": "Docker", "keywords": ["docker", "containerization", "dockerfile"]},
        {"label": "Authentication & Authorization", "keywords": ["authentication", "authorization", "jwt", "oauth", "login", "security"]},
        {"label": "Backend projects", "keywords": ["project", "built", "developed", "backend"]},
    ],
    "full stack developer": [
        {"label": "Frontend framework (React/Vue/Angular)", "keywords": ["react", "vue", "angular"]},
        {"label": "JavaScript/TypeScript", "keywords": ["javascript", "typescript", "js", "ts"]},
        {"label": "Backend language (Node/Java/Python)", "keywords": ["node.js", "nodejs", "node", "java", "python", "express"]},
        {"label": "REST APIs", "keywords": ["rest api", "restful", "api development", "api"]},
        {"label": "SQL / Database", "keywords": ["sql", "mysql", "postgresql", "postgres", "mongodb", "database"]},
        {"label": "CSS / Tailwind", "keywords": ["css", "tailwind", "scss", "sass"]},
        {"label": "Git/GitHub", "keywords": ["git", "github", "gitlab"]},
        {"label": "Full stack projects", "keywords": ["project", "full stack", "fullstack", "built", "deployed"]},
    ],
    "mern stack": [
        {"label": "MongoDB", "keywords": ["mongodb", "mongo", "nosql"]},
        {"label": "Express.js", "keywords": ["express", "express.js", "expressjs"]},
        {"label": "React", "keywords": ["react", "react.js", "reactjs"]},
        {"label": "Node.js", "keywords": ["node.js", "nodejs", "node"]},
        {"label": "JavaScript/TypeScript", "keywords": ["javascript", "typescript", "js", "ts", "es6"]},
        {"label": "REST APIs", "keywords": ["rest api", "restful", "api development", "api"]},
        {"label": "Git/GitHub", "keywords": ["git", "github", "gitlab"]},
        {"label": "Full-stack / MERN projects", "keywords": ["project", "full stack", "fullstack", "mern", "built", "deployed", "web app", "application"]},
    ],
    "frontend developer": [
        {"label": "React", "keywords": ["react", "react.js", "reactjs"]},
        {"label": "JavaScript", "keywords": ["javascript", "js", "es6"]},
        {"label": "TypeScript", "keywords": ["typescript", "ts"]},
        {"label": "CSS / Tailwind", "keywords": ["css", "tailwind", "scss", "sass"]},
        {"label": "Responsive design", "keywords": ["responsive", "mobile-first", "media query"]},
        {"label": "REST API integration", "keywords": ["rest api", "axios", "fetch api", "api integration", "api"]},
        {"label": "Testing (Jest/RTL)", "keywords": ["jest", "react testing library", "unit test", "testing"]},
        {"label": "Git/GitHub", "keywords": ["git", "github", "gitlab"]},
        {"label": "Frontend projects", "keywords": ["project", "built", "deployed", "ui"]},
    ],
    "java developer": [
        {"label": "Java proficiency", "keywords": ["java"]},
        {"label": "Data Structures & Algorithms", "keywords": ["data structures", "algorithms", "dsa", "leetcode"]},
        {"label": "Spring Boot", "keywords": ["spring boot", "springboot", "spring framework"]},
        {"label": "SQL", "keywords": ["sql", "mysql", "postgresql", "postgres", "database"]},
        {"label": "Object-Oriented Programming", "keywords": ["oop", "object-oriented", "object oriented"]},
        {"label": "REST APIs", "keywords": ["rest api", "restful", "api development", "api"]},
        {"label": "Testing (JUnit)", "keywords": ["junit", "unit test", "mockito", "testing"]},
        {"label": "Git/GitHub", "keywords": ["git", "github", "gitlab"]},
        {"label": "Maven/Gradle", "keywords": ["maven", "gradle"]},
        {"label": "Java projects", "keywords": ["project", "built", "developed"]},
    ],
    "python developer": [
        {"label": "Python proficiency", "keywords": ["python"]},
        {"label": "Data Structures & Algorithms", "keywords": ["data structures", "algorithms", "dsa", "leetcode"]},
        {"label": "Web framework (FastAPI/Flask/Django)", "keywords": ["fastapi", "flask", "django"]},
        {"label": "SQL", "keywords": ["sql", "mysql", "postgresql", "postgres", "sqlite", "database"]},
        {"label": "Object-Oriented Programming", "keywords": ["oop", "object-oriented", "object oriented"]},
        {"label": "REST APIs", "keywords": ["rest api", "restful", "api development", "api"]},
        {"label": "Testing (pytest)", "keywords": ["pytest", "unit test", "unittest", "testing"]},
        {"label": "Git/GitHub", "keywords": ["git", "github", "gitlab"]},
        {"label": "Python projects", "keywords": ["project", "built", "developed", "script"]},
    ],
}

# Generic internship fallback for roles that indicate an internship but
# don't match a specific technical profile above (e.g. "MERN Stack Intern"
# before a dedicated profile existed, "Software Engineering Intern", etc.).
# Broad, transferable-skill based — never falls back to years-of-experience
# or leadership criteria, since those don't apply to internship candidates.
GENERIC_INTERNSHIP_REQUIREMENTS: list[dict] = [
    {
        "label": "Programming language proficiency",
        "keywords": ["python", "java", "javascript", "typescript", "c++", "c#", "go", "ruby", "php"],
    },
    {
        "label": "Web or software development experience (projects/coursework)",
        "keywords": ["project", "built", "developed", "designed", "implemented", "created", "application", "web app", "coursework", "assignment"],
    },
    {
        "label": "Frontend or backend framework exposure",
        "keywords": ["react", "angular", "vue", "node", "express", "django", "flask", "fastapi", "spring boot", "next.js"],
    },
    {
        "label": "Database / API experience",
        "keywords": ["sql", "mysql", "postgresql", "mongodb", "database", "rest api", "restful", "api"],
    },
    {
        "label": "Version control (Git/GitHub)",
        "keywords": ["git", "github", "gitlab", "version control"],
    },
    {
        "label": "Internship, hackathon, or practical technical experience",
        "keywords": ["intern", "internship", "hackathon", "training", "practical"],
    },
    {
        "label": "Portfolio / GitHub presence",
        "keywords": ["github.com", "portfolio", "github", "deployed", "live demo", "vercel", "netlify", "render"],
    },
]

EXPERIENCED_ROLE_KEYWORDS = ["senior", "staff", "principal", "lead", "manager", "architect", "sr."]


def resolve_role_key(role_title: str) -> str | None:
    text = role_title.lower().strip()

    def has_any(words: list[str]) -> bool:
        return any(w in text for w in words)

    if "intern" in text and has_any(["ai", "ml", "machine learning", "artificial intelligence"]):
        return "ai/ml software engineer intern"
    if has_any(["mern"]):
        return "mern stack"
    if has_any(["ai engineer", "artificial intelligence engineer"]) or (
        "ai" in text and has_any(["engineer"]) and "intern" not in text
    ):
        return "ai engineer"
    if "data scientist" in text:
        return "data scientist"
    if "data analyst" in text:
        return "data analyst"
    if has_any(["full stack", "fullstack", "full-stack"]):
        return "full stack developer"
    if has_any(["backend", "back-end", "back end"]):
        return "backend developer"
    if has_any(["frontend", "front-end", "front end"]):
        return "frontend developer"
    if "java" in text and has_any(["developer", "engineer"]) and "javascript" not in text:
        return "java developer"
    if "python" in text and has_any(["developer", "engineer"]):
        return "python developer"
    return None


def is_internship_role(role_title: str) -> bool:
    text = role_title.lower()
    return "intern" in text and not any(w in text for w in EXPERIENCED_ROLE_KEYWORDS)


def evaluate_role_requirements(raw_text: str, requirements: list[dict]) -> list[dict]:
    text = raw_text.lower()
    results = []
    for req in requirements:
        met = any(kw in text for kw in req["keywords"])
        results.append({"label": req["label"], "met": met})
    return results


def extract_max_years(text: str) -> int:
    matches = re.findall(r"(\d+)\+?\s*(?:years|yrs)", text)
    if not matches:
        return 0
    return max(int(m) for m in matches)


def evaluate_experience_based(raw_text: str, level: str) -> list[dict]:
    """
    Only used for experienced-hire roles (Senior/Staff/Manager/etc.) —
    never applied to internship roles, which route through the generic
    internship or role-specific technical profiles instead.
    """
    text = raw_text.lower()
    years = extract_max_years(text)
    min_years = {"mid": 2, "senior": 4, "staff": 7}.get(level, 4)

    results = [
        {"label": f"{min_years}+ years relevant experience", "met": years >= min_years},
        {
            "label": "Track record of owning projects independently",
            "met": any(k in text for k in ["led", "owned", "spearheaded", "drove", "independently led"]),
        },
        {
            "label": "Experience with testing and CI/CD practices",
            "met": any(
                k in text
                for k in ["ci/cd", "ci-cd", "continuous integration", "jenkins", "github actions", "unit test", "testing"]
            ),
        },
        {
            "label": "Ability to mentor junior engineers",
            "met": any(k in text for k in ["mentor", "mentoring", "mentored", "coached", "coaching"]),
        },
        {
            "label": "Cross-functional stakeholder communication",
            "met": any(k in text for k in ["stakeholder", "cross-functional", "collaborated with product", "collaborated with design"]),
        },
    ]

    if level == "staff":
        results.append({
            "label": "Experience influencing technical direction across teams",
            "met": any(k in text for k in ["technical direction", "tech lead", "architecture decision", "rfc"]),
        })
        results.append({
            "label": "Experience with large-scale system design",
            "met": any(
                k in text
                for k in ["scalable", "distributed system", "system design", "high availability", "microservices"]
            ),
        })

    return results


@router.post("/check", response_model=EligibilityOut)
def check_eligibility(
    payload: EligibilityRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = get_resume(db, payload.resume_id, current_user.id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if not resume.raw_text:
        raise HTTPException(status_code=422, detail="No extractable text found in this resume")

    if payload.experience_level not in ("mid", "senior", "staff"):
        raise HTTPException(status_code=400, detail="experience_level must be one of: mid, senior, staff")

    role_key = resolve_role_key(payload.role_title)

    if role_key:
        requirements = evaluate_role_requirements(resume.raw_text, ROLE_REQUIREMENTS[role_key])
    elif is_internship_role(payload.role_title):
        requirements = evaluate_role_requirements(resume.raw_text, GENERIC_INTERNSHIP_REQUIREMENTS)
    else:
        requirements = evaluate_experience_based(resume.raw_text, payload.experience_level)

    met_count = sum(1 for r in requirements if r["met"])
    total_count = len(requirements)
    result = "eligible" if total_count and (met_count / total_count) >= 0.6 else "not-eligible"

    check = create_eligibility_check(
        db=db,
        owner_id=current_user.id,
        resume_id=payload.resume_id,
        role_title=payload.role_title,
        company=payload.company,
        experience_level=payload.experience_level,
        result=result,
        met_requirements=met_count,
        total_requirements=total_count,
        requirements=requirements,
    )
    return check


@router.get("", response_model=list[EligibilityOut])
def get_eligibility_history(
    resume_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_eligibility_checks(db, current_user.id, resume_id=resume_id)