from typing import Optional

from sqlalchemy.orm import Session

from app.models.resume import Resume


def create_resume(
    db: Session,
    owner_id: int,
    file_name: str,
    file_path: str,
    file_size_kb: int,
    content_type: str,
    raw_text: str,
) -> Resume:
    existing_count = db.query(Resume).filter(Resume.owner_id == owner_id).count()

    resume = Resume(
        owner_id=owner_id,
        file_name=file_name,
        file_path=file_path,
        file_size_kb=file_size_kb,
        content_type=content_type,
        raw_text=raw_text,
        status="Uploaded",
        is_default=(existing_count == 0),
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


def get_resume(db: Session, resume_id: int, owner_id: int) -> Optional[Resume]:
    return (
        db.query(Resume)
        .filter(Resume.id == resume_id, Resume.owner_id == owner_id)
        .first()
    )


def list_resumes(db: Session, owner_id: int) -> list[Resume]:
    return (
        db.query(Resume)
        .filter(Resume.owner_id == owner_id)
        .order_by(Resume.uploaded_at.desc())
        .all()
    )


def delete_resume(db: Session, resume: Resume) -> None:
    was_default = resume.is_default
    owner_id = resume.owner_id

    db.delete(resume)
    db.commit()

    if was_default:
        next_resume = (
            db.query(Resume)
            .filter(Resume.owner_id == owner_id)
            .order_by(Resume.uploaded_at.desc())
            .first()
        )
        if next_resume:
            next_resume.is_default = True
            db.add(next_resume)
            db.commit()


def mark_analyzed(db: Session, resume: Resume) -> Resume:
    resume.status = "Analyzed"
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


def rename_resume(db: Session, resume: Resume, name: str) -> Resume:
    resume.display_name = name
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


def set_default_resume(db: Session, resume: Resume) -> Resume:
    if resume.is_default:
        resume.is_default = False
        db.add(resume)
        db.commit()
        db.refresh(resume)
        return resume

    db.query(Resume).filter(Resume.owner_id == resume.owner_id).update({"is_default": False})
    resume.is_default = True
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume