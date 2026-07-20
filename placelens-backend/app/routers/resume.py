import os

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.core.deps import get_current_user
from app.crud.resume import (
    create_resume,
    delete_resume,
    get_resume,
    list_resumes,
    rename_resume,
    set_default_resume,
)
from app.database import get_db
from app.models.user import User
from app.schemas.resume import ResumeListOut, ResumeOut, ResumeRenameRequest
from app.services.file_extraction import extract_resume_text
from app.utils.file_utils import build_unique_filename, bytes_to_kb, ensure_directory

router = APIRouter(prefix="/api/resume", tags=["Resume"])

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


@router.post("/upload", response_model=ResumeOut, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")

    file_bytes = await file.read()
    size_kb = bytes_to_kb(len(file_bytes))

    if size_kb > settings.MAX_UPLOAD_SIZE_MB * 1024:
        raise HTTPException(status_code=400, detail=f"File exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit")

    ensure_directory(settings.UPLOAD_DIR)
    unique_name = build_unique_filename(file.filename)
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    raw_text = extract_resume_text(file_bytes, file.content_type, file.filename)

    resume = create_resume(
        db=db,
        owner_id=current_user.id,
        file_name=file.filename,
        file_path=file_path,
        file_size_kb=size_kb,
        content_type=file.content_type,
        raw_text=raw_text,
    )
    return resume


@router.get("", response_model=ResumeListOut)
def get_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resumes = list_resumes(db, current_user.id)
    return ResumeListOut(total=len(resumes), resumes=resumes)


@router.get("/{resume_id}", response_model=ResumeOut)
def get_resume_detail(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = get_resume(db, resume_id, current_user.id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume


@router.get("/{resume_id}/view")
def view_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    import traceback

    try:
        resume = get_resume(db, resume_id, current_user.id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        if not resume.file_path or not os.path.exists(resume.file_path):
            raise HTTPException(status_code=404, detail="File not found on server")

        disposition = "inline" if resume.content_type == "application/pdf" else "attachment"
        return FileResponse(
            path=resume.file_path,
            media_type=resume.content_type,
            filename=resume.file_name,
            headers={"Content-Disposition": f'{disposition}; filename="{resume.file_name}"'},
        )
    except HTTPException:
        raise
    except Exception:
        traceback.print_exc()
        raise


@router.get("/{resume_id}/download")
def download_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    import traceback

    try:
        resume = get_resume(db, resume_id, current_user.id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        if not resume.file_path or not os.path.exists(resume.file_path):
            raise HTTPException(status_code=404, detail="File not found on server")

        return FileResponse(
            path=resume.file_path,
            media_type=resume.content_type,
            filename=resume.file_name,
            headers={"Content-Disposition": f'attachment; filename="{resume.file_name}"'},
        )
    except HTTPException:
        raise
    except Exception:
        traceback.print_exc()
        raise


@router.patch("/{resume_id}", response_model=ResumeOut)
def rename_resume_endpoint(
    resume_id: int,
    payload: ResumeRenameRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = get_resume(db, resume_id, current_user.id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if not payload.name or not payload.name.strip():
        raise HTTPException(status_code=422, detail="Name cannot be empty")

    return rename_resume(db, resume, payload.name.strip())


@router.patch("/{resume_id}/default", response_model=ResumeOut)
def set_default_resume_endpoint(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = get_resume(db, resume_id, current_user.id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    return set_default_resume(db, resume)


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = get_resume(db, resume_id, current_user.id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if resume.file_path and os.path.exists(resume.file_path):
        os.remove(resume.file_path)

    delete_resume(db, resume)
    return None