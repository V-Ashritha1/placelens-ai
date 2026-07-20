import re

STOPWORDS = {
    "the", "and", "for", "with", "you", "our", "are", "will", "have",
    "this", "that", "your", "from", "who", "job", "role", "team",
    "work", "experience", "years", "strong", "ability", "skills",
    "looking", "motivated", "join", "candidate", "about", "ideal",
    "passionate", "opportunity", "responsibilities", "requirements",
    "preferred", "required", "must", "should", "such", "into", "using",
    "including", "across", "within", "other", "than", "also", "well",
    "like", "help", "make", "build", "working", "environment", "company",
    "position", "apply", "applicants", "employer", "equal", "benefits",
    "salary", "full", "time", "part", "remote", "onsite", "hybrid",
    "day", "days", "week", "weeks", "month", "months", "plus", "etc",
    "new", "great", "excellent", "good", "best", "high", "level",
    "senior", "junior", "mid", "entry", "lead", "manager", "engineer",
    "developer", "member", "members", "self", "communication",
    "collaborate", "collaborative", "detail", "oriented", "passion",
    "fast", "paced", "growing", "growth", "culture", "value", "values",
    "mission", "vision", "diverse", "diversity", "inclusion", "inclusive",
    "background", "sex", "race", "religion", "disability", "veteran",
    "please", "email", "resume", "cover", "letter", "contact", "office",
}

SKILL_NORMALIZATION = {
    "react.js": "react", "reactjs": "react", "react": "react",
    "js": "javascript", "javascript": "javascript",
    "ts": "typescript", "typescript": "typescript",
    "next.js": "next.js", "nextjs": "next.js",
    "node.js": "node.js", "nodejs": "node.js", "node": "node.js",
    "ai/ml": "ai", "ml": "ai", "ai": "ai", "machine": "ai",
    "postgres": "postgresql", "postgresql": "postgresql",
    "py": "python", "python": "python",
    "golang": "go", "go": "go",
    "k8s": "kubernetes", "kubernetes": "kubernetes",
    "aws": "aws", "gcp": "gcp", "azure": "azure",
    "docker": "docker", "graphql": "graphql", "rest": "rest api",
    "restful": "rest api", "sql": "sql", "nosql": "nosql",
    "mongo": "mongodb", "mongodb": "mongodb",
    "ci/cd": "ci/cd", "cicd": "ci/cd",
    "html": "html", "css": "css", "sass": "sass", "scss": "sass",
    "tailwind": "tailwind css", "tailwindcss": "tailwind css",
    "vue": "vue", "vue.js": "vue", "vuejs": "vue",
    "angular": "angular", "angular.js": "angular",
    "java": "java", "c++": "c++", "c#": "c#", "c": "c",
    "rust": "rust", "kotlin": "kotlin", "swift": "swift",
    "django": "django", "flask": "flask", "fastapi": "fastapi",
    "spring": "spring", "spring boot": "spring boot",
    "jest": "jest", "pytest": "pytest", "testing": "testing",
    "redis": "redis", "kafka": "kafka", "terraform": "terraform",
    "jenkins": "jenkins", "git": "git", "github": "github",
    "gitlab": "gitlab", "jira": "jira", "figma": "figma",
    "linux": "linux", "bash": "bash", "shell": "shell",
    "microservices": "microservices", "api": "api",
    "oauth": "oauth", "jwt": "jwt", "webpack": "webpack",
    "vite": "vite", "npm": "npm", "yarn": "yarn",
}

import difflib

TECHNICAL_PATTERN = re.compile(r"[A-Za-z][A-Za-z0-9+.#/-]{1,}")

KNOWN_SKILLS = {
    "react", "javascript", "typescript", "next.js", "node.js", "vue",
    "angular", "python", "java", "c++", "c#", "c", "go", "rust", "kotlin",
    "swift", "php", "ruby", "scala", "html", "css", "sass", "tailwind css",
    "bootstrap", "sql", "nosql", "postgresql", "mysql", "mongodb", "redis",
    "sqlite", "oracle", "dynamodb", "cassandra", "elasticsearch",
    "aws", "gcp", "azure", "docker", "kubernetes", "terraform", "jenkins",
    "ci/cd", "ansible", "nginx", "linux", "bash", "shell",
    "graphql", "rest api", "grpc", "websocket", "oauth", "jwt", "soap",
    "django", "flask", "fastapi", "spring", "spring boot", "express",
    "laravel", "rails", "asp.net", ".net",
    "git", "github", "gitlab", "bitbucket", "jira", "figma", "postman",
    "webpack", "vite", "babel", "npm", "yarn", "pnpm",
    "jest", "pytest", "mocha", "cypress", "selenium", "junit", "testing",
    "microservices", "api", "kafka", "rabbitmq", "grafana", "prometheus",
    "ai", "llm", "nlp", "computer vision", "tensorflow", "pytorch",
    "scikit-learn", "keras", "pandas", "numpy", "opencv", "hugging face",
    "power bi", "tableau", "excel", "spark", "hadoop", "airflow", "etl",
    "agile", "scrum", "devops", "gitops", "solidity", "blockchain",
    "unity", "unreal engine", "flutter", "react native", "android", "ios",
    "aws certified", "pmp", "ceh", "cissp", "comptia",
}


def normalize_keyword(raw: str) -> str:
    lw = raw.lower().strip(".")
    return SKILL_NORMALIZATION.get(lw, lw)


def _closest_known_skill(normalized: str) -> str | None:
    if normalized in KNOWN_SKILLS:
        return normalized
    matches = difflib.get_close_matches(normalized, KNOWN_SKILLS, n=1, cutoff=0.86)
    return matches[0] if matches else None


def extract_jd_keywords(jd_text: str) -> list[str]:
    words = TECHNICAL_PATTERN.findall(jd_text)
    seen = []
    for w in words:
        lw = w.lower()
        if lw in STOPWORDS or len(lw) < 2:
            continue
        normalized = normalize_keyword(lw)
        skill = _closest_known_skill(normalized)
        if not skill:
            continue
        if skill not in seen:
            seen.append(skill)
    return seen[:25]


def extract_resume_keywords(resume_text: str) -> set[str]:
    words = TECHNICAL_PATTERN.findall(resume_text)
    found = set()
    for w in words:
        lw = w.lower()
        if lw in STOPWORDS:
            continue
        normalized = normalize_keyword(lw)
        skill = _closest_known_skill(normalized)
        if skill:
            found.add(skill)
    return found


def compute_match(resume_text: str, jd_text: str) -> dict:
    resume_keywords = extract_resume_keywords(resume_text)
    jd_keywords = extract_jd_keywords(jd_text)

    matched = [kw for kw in jd_keywords if kw in resume_keywords]
    missing = [kw for kw in jd_keywords if kw not in resume_keywords]

    total = len(jd_keywords) or 1
    score = round((len(matched) / total) * 100, 1)

    return {
        "match_score": score,
        "matched_keywords": matched[:12],
        "missing_keywords": missing[:12],
    }