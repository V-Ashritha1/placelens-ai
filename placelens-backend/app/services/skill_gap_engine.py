from app.services.ai_service import AIServiceError, generate_structured_json

ROLE_SKILL_REQUIREMENTS = {
    "default": [
        {"category": "Core Frontend", "name": "React", "required": 85},
        {"category": "Core Frontend", "name": "TypeScript", "required": 85},
        {"category": "Core Frontend", "name": "CSS / Tailwind", "required": 75},
        {"category": "Engineering Practices", "name": "Testing (Jest/RTL)", "required": 80},
        {"category": "Engineering Practices", "name": "CI/CD", "required": 70},
        {"category": "Engineering Practices", "name": "Design Systems", "required": 75},
        {"category": "Growth Areas", "name": "GraphQL", "required": 70},
        {"category": "Growth Areas", "name": "Web Performance", "required": 75},
        {"category": "Growth Areas", "name": "Accessibility (a11y)", "required": 70},
    ],
    "ai/ml software engineer intern": [
        {"category": "Core ML", "name": "Python", "required": 85},
        {"category": "Core ML", "name": "Machine Learning", "required": 80},
        {"category": "Core ML", "name": "Deep Learning", "required": 70},
        {"category": "Frameworks", "name": "TensorFlow", "required": 60},
        {"category": "Frameworks", "name": "PyTorch", "required": 60},
        {"category": "Data Handling", "name": "NumPy", "required": 75},
        {"category": "Data Handling", "name": "Pandas", "required": 75},
        {"category": "Data Handling", "name": "SQL", "required": 65},
        {"category": "Foundations", "name": "Statistics", "required": 70},
        {"category": "Foundations", "name": "Data Structures & Algorithms", "required": 75},
        {"category": "Engineering Practices", "name": "FastAPI/Flask", "required": 55},
        {"category": "Engineering Practices", "name": "Git", "required": 70},
        {"category": "Engineering Practices", "name": "REST APIs", "required": 60},
    ],
    "ai engineer": [
        {"category": "Core ML", "name": "Python", "required": 90},
        {"category": "Core ML", "name": "Machine Learning", "required": 85},
        {"category": "Core ML", "name": "Deep Learning", "required": 85},
        {"category": "Frameworks", "name": "TensorFlow", "required": 75},
        {"category": "Frameworks", "name": "PyTorch", "required": 80},
        {"category": "Applied AI", "name": "NLP", "required": 65},
        {"category": "Applied AI", "name": "Computer Vision", "required": 60},
        {"category": "Applied AI", "name": "LLM/Generative AI", "required": 70},
        {"category": "Data Handling", "name": "SQL", "required": 65},
        {"category": "Data Handling", "name": "Pandas", "required": 75},
        {"category": "MLOps", "name": "Model Deployment", "required": 65},
        {"category": "MLOps", "name": "Docker", "required": 60},
        {"category": "Engineering Practices", "name": "REST APIs", "required": 65},
        {"category": "Engineering Practices", "name": "Git", "required": 75},
    ],
    "data scientist": [
        {"category": "Core", "name": "Python", "required": 85},
        {"category": "Core", "name": "SQL", "required": 80},
        {"category": "Core", "name": "Statistics", "required": 85},
        {"category": "Modeling", "name": "Machine Learning", "required": 80},
        {"category": "Modeling", "name": "Deep Learning", "required": 55},
        {"category": "Data Handling", "name": "Pandas", "required": 85},
        {"category": "Data Handling", "name": "NumPy", "required": 75},
        {"category": "Visualization", "name": "Data Visualization", "required": 70},
        {"category": "Visualization", "name": "Power BI/Tableau", "required": 60},
        {"category": "Engineering Practices", "name": "Git", "required": 65},
        {"category": "Engineering Practices", "name": "A/B Testing", "required": 60},
        {"category": "Communication", "name": "Data Storytelling", "required": 65},
    ],
    "data analyst": [
        {"category": "Core", "name": "SQL", "required": 85},
        {"category": "Core", "name": "Excel", "required": 80},
        {"category": "Core", "name": "Python", "required": 65},
        {"category": "Analysis", "name": "Statistics", "required": 65},
        {"category": "Analysis", "name": "Data Cleaning", "required": 75},
        {"category": "Visualization", "name": "Power BI/Tableau", "required": 80},
        {"category": "Visualization", "name": "Data Visualization", "required": 75},
        {"category": "Data Handling", "name": "Pandas", "required": 60},
        {"category": "Communication", "name": "Dashboarding", "required": 65},
        {"category": "Communication", "name": "Data Storytelling", "required": 65},
    ],
    "backend developer": [
        {"category": "Core", "name": "Java", "required": 75},
        {"category": "Core", "name": "Python", "required": 65},
        {"category": "Core", "name": "SQL", "required": 80},
        {"category": "Frameworks", "name": "Spring Boot", "required": 75},
        {"category": "Frameworks", "name": "FastAPI/Flask", "required": 60},
        {"category": "Architecture", "name": "REST APIs", "required": 85},
        {"category": "Architecture", "name": "Microservices", "required": 65},
        {"category": "Data Layer", "name": "Database Design", "required": 75},
        {"category": "Data Layer", "name": "ORM (JPA/SQLAlchemy)", "required": 65},
        {"category": "Engineering Practices", "name": "Docker", "required": 65},
        {"category": "Engineering Practices", "name": "Git", "required": 75},
        {"category": "Engineering Practices", "name": "Testing (Unit/Integration)", "required": 70},
        {"category": "Security", "name": "Authentication & Authorization", "required": 65},
    ],
    "full stack developer": [
        {"category": "Frontend", "name": "React", "required": 80},
        {"category": "Frontend", "name": "TypeScript", "required": 75},
        {"category": "Frontend", "name": "CSS / Tailwind", "required": 70},
        {"category": "Backend", "name": "Node.js", "required": 70},
        {"category": "Backend", "name": "REST APIs", "required": 80},
        {"category": "Backend", "name": "SQL", "required": 70},
        {"category": "Backend", "name": "Database Design", "required": 65},
        {"category": "Engineering Practices", "name": "Git", "required": 75},
        {"category": "Engineering Practices", "name": "Docker", "required": 55},
        {"category": "Engineering Practices", "name": "CI/CD", "required": 60},
        {"category": "Engineering Practices", "name": "Testing (Jest/RTL)", "required": 60},
    ],
    "frontend developer": [
        {"category": "Core Frontend", "name": "React", "required": 85},
        {"category": "Core Frontend", "name": "TypeScript", "required": 80},
        {"category": "Core Frontend", "name": "CSS / Tailwind", "required": 80},
        {"category": "Core Frontend", "name": "JavaScript", "required": 85},
        {"category": "Engineering Practices", "name": "Testing (Jest/RTL)", "required": 70},
        {"category": "Engineering Practices", "name": "CI/CD", "required": 60},
        {"category": "Engineering Practices", "name": "Design Systems", "required": 65},
        {"category": "Growth Areas", "name": "GraphQL", "required": 55},
        {"category": "Growth Areas", "name": "Web Performance", "required": 70},
        {"category": "Growth Areas", "name": "Accessibility (a11y)", "required": 65},
    ],
    "java developer": [
        {"category": "Core", "name": "Java", "required": 90},
        {"category": "Core", "name": "Data Structures & Algorithms", "required": 80},
        {"category": "Frameworks", "name": "Spring Boot", "required": 85},
        {"category": "Frameworks", "name": "Spring Security", "required": 60},
        {"category": "Data Layer", "name": "SQL", "required": 80},
        {"category": "Data Layer", "name": "ORM (JPA/SQLAlchemy)", "required": 70},
        {"category": "Architecture", "name": "REST APIs", "required": 80},
        {"category": "Architecture", "name": "Microservices", "required": 60},
        {"category": "Engineering Practices", "name": "Testing (Unit/Integration)", "required": 70},
        {"category": "Engineering Practices", "name": "Git", "required": 75},
        {"category": "Engineering Practices", "name": "Maven/Gradle", "required": 65},
    ],
    "python developer": [
        {"category": "Core", "name": "Python", "required": 90},
        {"category": "Core", "name": "Data Structures & Algorithms", "required": 75},
        {"category": "Frameworks", "name": "FastAPI/Flask", "required": 80},
        {"category": "Frameworks", "name": "Django", "required": 55},
        {"category": "Data Layer", "name": "SQL", "required": 75},
        {"category": "Data Layer", "name": "ORM (JPA/SQLAlchemy)", "required": 65},
        {"category": "Architecture", "name": "REST APIs", "required": 80},
        {"category": "Engineering Practices", "name": "Testing (Unit/Integration)", "required": 65},
        {"category": "Engineering Practices", "name": "Git", "required": 75},
        {"category": "Engineering Practices", "name": "Docker", "required": 55},
    ],
}

SKILL_TEXT_MARKERS = {
    "React": ["react", "react.js", "reactjs"],
    "TypeScript": ["typescript", "ts"],
    "CSS / Tailwind": ["css", "tailwind", "tailwindcss", "scss", "sass"],
    "JavaScript": ["javascript", "js", "es6", "ecmascript"],
    "Testing (Jest/RTL)": ["jest", "testing", "react testing library", "rtl", "unit test"],
    "CI/CD": ["ci/cd", "ci-cd", "continuous integration", "continuous deployment", "github actions", "jenkins"],
    "Design Systems": ["design system", "design systems", "component library", "storybook"],
    "GraphQL": ["graphql", "apollo"],
    "Web Performance": ["performance", "web vitals", "lighthouse", "lazy loading", "optimization"],
    "Accessibility (a11y)": ["accessibility", "a11y", "wcag", "aria"],

    "Python": ["python", "py3", "python3"],
    "Machine Learning": ["machine learning", "ml", "scikit-learn", "sklearn", "supervised learning", "unsupervised learning"],
    "Deep Learning": ["deep learning", "neural network", "cnn", "rnn", "lstm", "transformer"],
    "TensorFlow": ["tensorflow", "tf.keras", "keras"],
    "PyTorch": ["pytorch", "torch"],
    "NumPy": ["numpy", "np."],
    "Pandas": ["pandas", "dataframe", "pd."],
    "SQL": ["sql", "mysql", "postgresql", "postgres", "sqlite", "query", "queries"],
    "Statistics": ["statistics", "statistical", "hypothesis testing", "regression", "probability"],
    "Data Structures & Algorithms": ["data structures", "algorithms", "dsa", "leetcode", "big o"],
    "FastAPI/Flask": ["fastapi", "flask", "uvicorn"],
    "Git": ["git", "github", "gitlab", "version control"],
    "REST APIs": ["rest api", "restful", "rest apis", "api endpoint", "api development"],

    "NLP": ["nlp", "natural language processing", "text classification", "spacy", "nltk", "huggingface", "transformers"],
    "Computer Vision": ["computer vision", "opencv", "image classification", "object detection", "cnn"],
    "LLM/Generative AI": ["llm", "large language model", "generative ai", "genai", "gpt", "prompt engineering", "rag"],
    "Model Deployment": ["model deployment", "model serving", "mlops", "inference api"],
    "Docker": ["docker", "containerization", "dockerfile", "container"],

    "Excel": ["excel", "spreadsheet", "pivot table", "vlookup"],
    "Data Cleaning": ["data cleaning", "data wrangling", "data preprocessing", "etl"],
    "Data Visualization": ["data visualization", "matplotlib", "seaborn", "plotly", "chart", "dashboard"],
    "Power BI/Tableau": ["power bi", "tableau", "powerbi"],
    "Dashboarding": ["dashboard", "dashboarding", "reporting"],
    "Data Storytelling": ["data storytelling", "storytelling", "insights", "presentation"],
    "A/B Testing": ["a/b testing", "ab testing", "experimentation"],

    "Java": ["java"],
    "Spring Boot": ["spring boot", "springboot", "spring framework"],
    "Spring Security": ["spring security", "jwt", "oauth"],
    "Microservices": ["microservice", "microservices"],
    "Database Design": ["database design", "schema design", "normalization", "erd"],
    "ORM (JPA/SQLAlchemy)": ["jpa", "hibernate", "sqlalchemy", "orm"],
    "Testing (Unit/Integration)": ["unit test", "integration test", "junit", "pytest", "mockito"],
    "Maven/Gradle": ["maven", "gradle"],
    "Authentication & Authorization": ["authentication", "authorization", "jwt", "oauth", "rbac"],

    "Node.js": ["node.js", "nodejs", "node", "express", "express.js"],

    "Django": ["django", "django rest framework", "drf"],
}


def infer_skill_level(raw_text: str, skill_name: str) -> float:
    text = raw_text.lower()
    markers = SKILL_TEXT_MARKERS.get(skill_name, [skill_name.lower()])
    hits = sum(text.count(m) for m in markers)

    if hits == 0:
        return 35.0
    if hits == 1:
        return 60.0
    if hits == 2:
        return 75.0
    return 90.0


# ============ NEW: static learning resources lookup ============
LEARNING_RESOURCES = {
    "Testing (Jest/RTL)": {
        "docs_label": "Jest — Official Documentation",
        "docs_url": "https://jestjs.io/docs/getting-started",
        "youtube_label": "Jest & React Testing Library Crash Course",
        "youtube_url": "https://www.youtube.com/results?search_query=jest+react+testing+library+crash+course",
        "github_label": "React Testing Library Example Repository",
        "github_url": "https://github.com/testing-library/react-testing-library",
        "roadmap": [
            "Learn Jest basics: assertions, mocks, test runners",
            "Add React Testing Library for component testing",
            "Mock API calls with MSW (Mock Service Worker)",
            "Write integration tests for key user flows",
        ],
    },
    "Testing (Unit/Integration)": {
        "docs_label": "pytest — Official Documentation",
        "docs_url": "https://docs.pytest.org/en/stable/",
        "youtube_label": "Pytest Full Course",
        "youtube_url": "https://www.youtube.com/results?search_query=pytest+full+course",
        "github_label": "FastAPI Testing Example",
        "github_url": "https://github.com/tiangolo/fastapi/tree/master/docs_src/app_testing",
        "roadmap": [
            "Write unit tests for core business logic",
            "Add integration tests for API endpoints",
            "Set up test fixtures and mocking",
            "Track coverage with pytest-cov",
        ],
    },
    "CI/CD": {
        "docs_label": "GitHub Actions — Official Documentation",
        "docs_url": "https://docs.github.com/en/actions",
        "youtube_label": "GitHub Actions Full Course",
        "youtube_url": "https://www.youtube.com/results?search_query=github+actions+full+course",
        "github_label": "GitHub Actions Starter Workflows",
        "github_url": "https://github.com/actions/starter-workflows",
        "roadmap": [
            "Write a workflow that runs tests on every push",
            "Add lint/type-check steps to the pipeline",
            "Automate build + deploy on merge to main",
            "Add status badges to your README",
        ],
    },
    "GraphQL": {
        "docs_label": "Apollo GraphQL — Official Documentation",
        "docs_url": "https://www.apollographql.com/docs/",
        "youtube_label": "GraphQL Crash Course",
        "youtube_url": "https://www.youtube.com/results?search_query=graphql+crash+course",
        "github_label": "Apollo Full-Stack Example",
        "github_url": "https://github.com/apollographql/fullstack-tutorial",
        "roadmap": [
            "Learn GraphQL schema, queries, and mutations",
            "Set up Apollo Server on your existing backend",
            "Connect Apollo Client on the frontend",
            "Replace one REST endpoint with a GraphQL equivalent",
        ],
    },
    "Design Systems": {
        "docs_label": "Tailwind CSS — Official Documentation",
        "docs_url": "https://tailwindcss.com/docs",
        "youtube_label": "Design Systems with Tailwind Crash Course",
        "youtube_url": "https://www.youtube.com/results?search_query=tailwind+design+system+crash+course",
        "github_label": "shadcn/ui Component Library",
        "github_url": "https://github.com/shadcn-ui/ui",
        "roadmap": [
            "Define design tokens (spacing, color, typography)",
            "Build reusable Button, Input, Modal components",
            "Adopt a headless UI library (Radix/shadcn)",
            "Document components in a shared library",
        ],
    },
    "Accessibility (a11y)": {
        "docs_label": "WCAG — Official Guidelines",
        "docs_url": "https://www.w3.org/WAI/standards-guidelines/wcag/",
        "youtube_label": "Web Accessibility Crash Course",
        "youtube_url": "https://www.youtube.com/results?search_query=web+accessibility+a11y+crash+course",
        "github_label": "axe-core Accessibility Testing Engine",
        "github_url": "https://github.com/dequelabs/axe-core",
        "roadmap": [
            "Run an accessibility audit with axe-core/Lighthouse",
            "Fix semantic HTML and ARIA attribute issues",
            "Ensure full keyboard navigation support",
            "Test with a screen reader (NVDA/VoiceOver)",
        ],
    },
    "Web Performance": {
        "docs_label": "web.dev — Performance Guide",
        "docs_url": "https://web.dev/learn/performance/",
        "youtube_label": "Web Performance Optimization Crash Course",
        "youtube_url": "https://www.youtube.com/results?search_query=web+performance+optimization+crash+course",
        "github_label": "Lighthouse CI",
        "github_url": "https://github.com/GoogleChrome/lighthouse-ci",
        "roadmap": [
            "Audit with Lighthouse and identify bottlenecks",
            "Add code-splitting and lazy loading",
            "Optimize images and bundle size",
            "Track Core Web Vitals over time",
        ],
    },
    "Docker": {
        "docs_label": "Docker — Official Documentation",
        "docs_url": "https://docs.docker.com/",
        "youtube_label": "Docker Crash Course",
        "youtube_url": "https://www.youtube.com/results?search_query=docker+crash+course",
        "github_label": "Awesome Docker Compose Examples",
        "github_url": "https://github.com/docker/awesome-compose",
        "roadmap": [
            "Containerize the backend with a Dockerfile",
            "Add a docker-compose.yml for local dev (app + DB)",
            "Use multi-stage builds to shrink image size",
            "Deploy the containerized app to a cloud host",
        ],
    },
    "default": {
        "docs_label": "MDN Web Docs",
        "docs_url": "https://developer.mozilla.org/",
        "youtube_label": "freeCodeCamp — Full Courses",
        "youtube_url": "https://www.youtube.com/@freecodecamp",
        "github_label": "Awesome Lists — Curated Resources",
        "github_url": "https://github.com/sindresorhus/awesome",
        "roadmap": [
            "Study the fundamentals through official docs",
            "Follow a structured tutorial or course",
            "Build a small project applying the concept",
            "Add the project to your portfolio",
        ],
    },
}


def _match_resources(skill_or_title: str) -> dict:
    """Find the best-matching learning resource block by keyword."""
    text = skill_or_title.lower()
    for key, resources in LEARNING_RESOURCES.items():
        if key == "default":
            continue
        if key.lower().split(" (")[0] in text or key.lower() in text:
            return resources
    # loose keyword fallback
    keyword_map = {
        "test": "Testing (Jest/RTL)",
        "ci/cd": "CI/CD",
        "deploy": "CI/CD",
        "pipeline": "CI/CD",
        "graphql": "GraphQL",
        "design system": "Design Systems",
        "component librar": "Design Systems",
        "accessib": "Accessibility (a11y)",
        "a11y": "Accessibility (a11y)",
        "performance": "Web Performance",
        "docker": "Docker",
    }
    for kw, key in keyword_map.items():
        if kw in text:
            return LEARNING_RESOURCES[key]
    return LEARNING_RESOURCES["default"]


def _parse_ats_impact(ats_impact: str) -> float:
    """Parse '+8%' -> 8.0. Returns 0.0 if unparseable."""
    try:
        cleaned = ats_impact.strip().replace("%", "").replace("+", "")
        return float(cleaned)
    except (ValueError, AttributeError):
        return 0.0


def _enrich_recommendation(rec: dict, overall_readiness: float) -> dict:
    """Adds resources, ats_before/after, and default text for fields the
    AI or fallback path may not have supplied. Non-destructive: never
    overwrites a field that's already present and non-empty."""
    impact = _parse_ats_impact(rec.get("ats_impact", "+0%"))
    rec.setdefault("interview_benefit", "")
    rec.setdefault("resume_impact", "")
    rec["ats_before"] = round(overall_readiness, 1)
    rec["ats_after"] = round(min(100.0, overall_readiness + impact), 1)
    rec["resources"] = _match_resources(rec.get("title", "") + " " + rec.get("recommended_project", ""))
    return rec


SUMMARY_SYSTEM_INSTRUCTION = """You are a senior technical career coach writing a short, encouraging
AI Career Summary for a job seeker, based on facts given to you.

You will be given:
- The candidate's target role
- Their current ATS readiness score
- A projected readiness score after completing recommended improvements
- Their strongest demonstrated skills/technologies (from their resume)
- Their top skill gaps for the target role

Return ONLY a JSON object with one field:
- "summary": a 3-5 sentence, warm but professional paragraph (with 1-2 short bullet-style
  lines using "•" if helpful) that:
  1. Names the candidate's real strengths and real project names if given
  2. States the biggest opportunity areas for the target role
  3. States the current score and the realistic projected score after completing the
     recommendations, using ONLY the exact numbers provided — do not invent numbers
  4. Ends on an encouraging, confident note

Output ONLY valid JSON. No markdown, no code fences, no extra text.
"""


def _build_summary_prompt(
    raw_text: str,
    target_role: str,
    overall_readiness: float,
    projected_readiness: float,
    top_gaps: list[dict],
) -> str:
    gap_names = ", ".join(g["name"] for g in top_gaps[:4]) or "no major gaps"
    resume_excerpt = raw_text[:4000]

    return f"""Target role: {target_role}
Current ATS readiness: {overall_readiness:.0f}%
Projected ATS readiness after completing recommendations: {projected_readiness:.0f}%
Top skill gaps: {gap_names}

Candidate resume:
\"\"\"
{resume_excerpt}
\"\"\"

Generate the AI Career Summary JSON now."""


def _fallback_summary(
    target_role: str, overall_readiness: float, projected_readiness: float, top_gaps: list[dict]
) -> str:
    gap_lines = "\n".join(f"• {g['name']}" for g in top_gaps[:4])
    return (
        f"Your resume shows solid, demonstrable experience relevant to a {target_role} role. "
        f"The biggest opportunities to close before you apply are:\n{gap_lines}\n"
        f"Completing the recommendations below could realistically move your ATS readiness "
        f"from {overall_readiness:.0f}% to approximately {projected_readiness:.0f}%, while also "
        f"making you noticeably stronger in technical interviews."
    )
# ============ END NEW ============


RECOMMENDATION_SYSTEM_INSTRUCTION = """You are a senior technical career coach helping software/AI job seekers close skill gaps.

You will be given:
- A candidate's resume text
- Their target job role
- A list of skill gaps (skill name, current level 0-100, required level 0-100)

Generate 5-8 personalized, non-generic recommendations as a JSON array. Each item must have exactly these fields:
- "title": short punchy title with an emoji prefix, e.g. "🚀 Add GraphQL to PlaceLens AI"
- "why_it_matters": 1-2 sentences explaining why this matters, referencing what the resume ALREADY shows
- "explanation": 1-2 sentences of personalized advice — if the resume already mentions a related/foundational technology, recommend the NEXT logical step, not "learn X from scratch"
- "recommended_project": a specific, concrete enhancement idea with named tools/technologies
- "difficulty": one of "Beginner", "Intermediate", "Advanced"
- "learning_time": short string like "1 week", "2 weeks", "3-4 weeks"
- "ats_impact": short string like "+4%", "+6%", "+8%" representing estimated ATS score improvement
- "interview_benefit": 1 sentence describing what interview questions this project prepares them to answer confidently
- "resume_impact": 1 sentence describing how/where this can be added to their resume and what it demonstrates

CRITICAL RULE — extend existing projects, don't invent new ones:
- First, identify the specific named projects already mentioned in the resume (e.g. "WorkZen", "PlaceLens AI", or whatever the resume actually names).
- For EVERY recommendation, default to extending or enhancing one of those existing named projects with the missing skill — e.g. "Add automated testing to WorkZen", "Extend PlaceLens AI with a GraphQL layer", "Add Docker and CI/CD to PlaceLens AI", "Improve accessibility in WorkZen".
- Reference the actual project by its real name from the resume in the title and recommended_project fields whenever one exists that the skill could reasonably be added to.
- Only propose a brand-new, unrelated project if none of the candidate's existing projects could plausibly host that skill (e.g. they have no backend project at all and the gap is a backend-only skill). This should be rare — most skill gaps (testing, CI/CD, GraphQL, accessibility, performance, Docker, design systems, auth upgrades, etc.) can be added to an existing project.
- NEVER say "Learn X" generically. Always tie the recommendation to something specific in the resume or a concrete next step.
- If the resume already shows a foundational skill (e.g. Flask, React basics, SQL, Python), recommend the advanced/adjacent next step (e.g. FastAPI, Next.js, PostgreSQL optimization, AI agents) instead of repeating the basic skill.
- Order recommendations by estimated ATS impact, highest first.
- Output ONLY a valid JSON array. No markdown, no prose, no code fences.
"""


def _build_recommendation_prompt(
    raw_text: str,
    target_role: str,
    gaps: list[dict],
) -> str:
    gaps_summary = "\n".join(
        f"- {g['name']} (category: {g['category']}): currently at {g['level']:.0f}%, target role expects {g['required']:.0f}%"
        for g in gaps
    )

    resume_excerpt = raw_text[:6000]  # keep prompt size reasonable

    return f"""Target role: {target_role}

Skill gaps identified:
{gaps_summary if gaps_summary else "No significant gaps — candidate meets or exceeds requirements."}

Candidate resume:
\"\"\"
{resume_excerpt}
\"\"\"

Generate the personalized recommendations JSON array now."""


def _fallback_recommendations(gaps: list[dict]) -> list[dict]:
    """Used only if the AI call fails — keeps the feature functional."""
    if not gaps:
        return [
            {
                "title": "You're in great shape",
                "why_it_matters": "You meet or exceed all benchmarked skill requirements for this role.",
                "explanation": "Consider deepening expertise in your strongest areas or exploring adjacent technologies.",
                "recommended_project": "Contribute to an open-source project in your strongest skill area.",
                "difficulty": "Intermediate",
                "learning_time": "Ongoing",
                "ats_impact": "+0%",
                "interview_benefit": "You'll be able to speak confidently about your well-rounded skill set.",
                "resume_impact": "Continued open-source contributions strengthen your resume's credibility.",
            }
        ]
    result = []
    for gap in gaps[:5]:
        result.append(
            {
                "title": f"Strengthen {gap['name']}",
                "why_it_matters": f"Currently at {gap['level']:.0f}%, target roles expect {gap['required']:.0f}%.",
                "explanation": f"Focus on practical, project-based learning in {gap['name']}.",
                "recommended_project": f"Build a project that demonstrates applied {gap['name']} skills.",
                "difficulty": "Intermediate",
                "learning_time": "2 weeks",
                "ats_impact": "+3%",
                "interview_benefit": f"You'll be able to speak confidently about applied {gap['name']} experience.",
                "resume_impact": f"This can be added as a project bullet demonstrating {gap['name']}.",
            }
        )
    return result


def generate_skill_gap(raw_text: str, target_role: str) -> dict:
    requirements = ROLE_SKILL_REQUIREMENTS.get(
        target_role.strip().lower(), ROLE_SKILL_REQUIREMENTS["default"]
    )

    skills = []
    for req in requirements:
        level = infer_skill_level(raw_text, req["name"])
        skills.append({
            "category": req["category"],
            "name": req["name"],
            "level": level,
            "required": float(req["required"]),
        })

    overall = round(sum(s["level"] for s in skills) / len(skills), 1)

    gaps = sorted(
        [s for s in skills if s["level"] < s["required"]],
        key=lambda s: s["required"] - s["level"],
        reverse=True,
    )

    try:
        prompt = _build_recommendation_prompt(raw_text, target_role, gaps)
        recommendations = generate_structured_json(
            prompt=prompt,
            system_instruction=RECOMMENDATION_SYSTEM_INSTRUCTION,
        )
        if not isinstance(recommendations, list) or not recommendations:
            raise AIServiceError("AI returned an unexpected recommendations format.")
    except AIServiceError:
        recommendations = _fallback_recommendations(gaps)

    # NEW: enrich every recommendation with resources + ats before/after
    recommendations = [_enrich_recommendation(r, overall) for r in recommendations]

    # NEW: projected readiness = overall + sum of all recommendation impacts, capped at 100
    total_impact = sum(_parse_ats_impact(r.get("ats_impact", "+0%")) for r in recommendations)
    projected_readiness = round(min(100.0, overall + total_impact), 1)

    # NEW: generate AI career summary
    try:
        summary_prompt = _build_summary_prompt(raw_text, target_role, overall, projected_readiness, gaps)
        summary_result = generate_structured_json(
            prompt=summary_prompt,
            system_instruction=SUMMARY_SYSTEM_INSTRUCTION,
        )
        ai_summary = summary_result.get("summary", "") if isinstance(summary_result, dict) else ""
        if not ai_summary:
            raise AIServiceError("AI returned an unexpected summary format.")
    except AIServiceError:
        ai_summary = _fallback_summary(target_role, overall, projected_readiness, gaps)

    return {
        "overall_readiness": overall,
        "skills": skills,
        "recommendations": recommendations,
        "ai_summary": ai_summary,
    }