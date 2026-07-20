from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.core.exceptions import (
    http_exception_handler,
    integrity_error_handler,
    sqlalchemy_error_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.database import Base, engine
from app.routers import (
    ats,
    auth,
    dashboard,
    eligibility,
    jd,
    profile,
    readiness,
    resume,
    skill_gap,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for PlaceLens AI — resume upload, PDF/DOCX extraction, ATS scoring, "
    "JD matching, skill gap analysis, eligibility checking, and readiness scoring.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://placelens-ai-two.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(IntegrityError, integrity_error_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_error_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(resume.router)
app.include_router(ats.router)
app.include_router(jd.router)
app.include_router(skill_gap.router)
app.include_router(eligibility.router)
app.include_router(readiness.router)
app.include_router(dashboard.router)


@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME}
