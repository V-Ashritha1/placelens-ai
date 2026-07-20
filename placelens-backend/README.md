# PlaceLens AI — Backend

FastAPI + SQLAlchemy + PostgreSQL + JWT backend for PlaceLens AI: resume upload, PDF/DOCX text
extraction, ATS scoring, JD matching, skill gap analysis, eligibility checking, and readiness scoring.

## Stack

- FastAPI
- SQLAlchemy 2.0
- PostgreSQL (psycopg2)
- JWT authentication (python-jose + passlib/bcrypt)
- Pydantic v2
- Alembic migrations
- pypdf / python-docx for resume text extraction

## Project layout

```
placelens-backend/
├── requirements.txt
├── .env.example
├── README.md
├── .gitignore
├── alembic.ini
├── app/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── core/           # security, JWT, dependencies, exception handlers
│   ├── crud/           # database access functions
│   ├── models/          # SQLAlchemy models
│   ├── routers/         # FastAPI route handlers
│   ├── schemas/         # Pydantic request/response schemas
│   ├── services/        # ATS scoring, JD matching, skill gap, readiness, file extraction
│   └── utils/           # small shared helpers
├── uploads/resumes/     # uploaded resume files land here
└── migrations/          # Alembic migration environment
```

## 1. Prerequisites

- Python 3.10+
- A running PostgreSQL instance

Create the database and user (adjust as needed):

```sql
CREATE DATABASE placelens_db;
CREATE USER placelens_user WITH PASSWORD 'placelens_pass';
GRANT ALL PRIVILEGES ON DATABASE placelens_db TO placelens_user;
```

## 2. Setup

```bash
python -m venv venv
source venv/bin/activate        # on Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` with your real `DATABASE_URL` and a strong `SECRET_KEY`.

## 3. Run database migrations

Tables are also auto-created on app startup for convenience, but Alembic is included for real
migration management:

```bash
alembic upgrade head
```

## 4. Start the server

```bash
uvicorn app.main:app --reload
```

- API base URL: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health check: `GET /api/health`

## 5. Authentication flow

1. `POST /api/auth/register` — create an account, returns a JWT access token.
2. `POST /api/auth/login` — log in with email/password, returns a JWT access token.
3. Pass the token as `Authorization: Bearer <token>` on all other endpoints.

## 6. Endpoints

| Method | Path                          | Description                              |
|--------|-------------------------------|-------------------------------------------|
| POST   | `/api/auth/register`          | Register a new user                       |
| POST   | `/api/auth/login`              | Log in and receive a JWT                  |
| GET    | `/api/profile/me`              | Get current user's profile                |
| PUT    | `/api/profile/me`              | Update current user's profile             |
| POST   | `/api/resume/upload`           | Upload a PDF/DOCX resume                  |
| GET    | `/api/resume`                  | List uploaded resumes                     |
| GET    | `/api/resume/{resume_id}`      | Get one resume's metadata                 |
| DELETE | `/api/resume/{resume_id}`      | Delete a resume                           |
| POST   | `/api/ats/analyze`             | Run ATS scoring on a resume               |
| GET    | `/api/ats/{resume_id}`         | Get the stored ATS report for a resume    |
| POST   | `/api/jd/analyze`              | Match a resume against a job description  |
| GET    | `/api/jd`                       | List past JD matches                      |
| POST   | `/api/skill-gap/analyze`       | Run skill gap analysis for a target role  |
| GET    | `/api/skill-gap`               | List past skill gap analyses              |
| POST   | `/api/eligibility/check`       | Check eligibility for a role               |
| GET    | `/api/eligibility`              | List past eligibility checks              |
| GET    | `/api/readiness`                | Get aggregate readiness score              |
| GET    | `/api/health`                   | Health check                              |

## Notes

- No Docker, Redis, or Celery are used or required.
- CORS is open (`*`) by default in `app/main.py` — restrict `allow_origins` to your frontend's
  origin before deploying.
- Uploaded files are stored on local disk under `uploads/resumes/` (path configurable via
  `UPLOAD_DIR` in `.env`).
