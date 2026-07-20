from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.core.security import generate_verification_token, hash_password, verify_password
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_verification_token(db: Session, hashed_token: str) -> Optional[User]:
    return db.query(User).filter(User.verification_token == hashed_token).first()


def create_user(db: Session, user_in: UserCreate) -> User:
    db_user = User(
        full_name=user_in.full_name,
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        role_title=user_in.role_title,
        location=user_in.location,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def set_verification_token(db: Session, user: User) -> str:
    raw_token, hashed_token = generate_verification_token()
    user.verification_token = hashed_token
    user.verification_token_expires = datetime.utcnow() + timedelta(hours=24)
    db.add(user)
    db.commit()
    db.refresh(user)
    return raw_token


def mark_user_verified(db: Session, user: User) -> User:
    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def update_user(db: Session, user: User, user_in: UserUpdate) -> User:
    update_data = user_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: User) -> None:
    db.delete(user)
    db.commit()