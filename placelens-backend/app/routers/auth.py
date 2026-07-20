from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.email import send_verification_email
from app.core.security import create_access_token, hash_verification_token
from app.crud.user import (
    authenticate_user,
    create_user,
    get_user_by_email,
    get_user_by_verification_token,
    mark_user_verified,
    set_verification_token,
)
from app.database import get_db
from app.schemas.auth import LoginRequest, RegisterResponse, Token, VerifyEmailRequest
from app.schemas.user import UserCreate, UserOut

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = get_user_by_email(db, user_in.email)
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    user = create_user(db, user_in)
    raw_token = set_verification_token(db, user)

    try:
        send_verification_email(user.email, user.full_name, raw_token)
    except Exception:
        # Don't leave an unverifiable ghost account if the email never went out
        db.delete(user)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not send the verification email. Please try registering again.",
        )

    return RegisterResponse(
        message="Registration successful. Please check your email to verify your account before logging in.",
        email=user.email,
    )


@router.post("/verify-email", response_model=Token)
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    hashed_token = hash_verification_token(payload.token)
    user = get_user_by_verification_token(db, hashed_token)

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or already-used verification link")

    if user.verification_token_expires and user.verification_token_expires < datetime.utcnow():
        raise HTTPException(
            status_code=400,
            detail="Verification link has expired. Please register again to get a new one.",
        )

    user = mark_user_verified(db, user)
    access_token = create_access_token(subject=user.email)
    return Token(access_token=access_token, user=UserOut.model_validate(user))


@router.post("/login", response_model=Token)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in. Check your inbox for the verification link.",
        )

    access_token = create_access_token(subject=user.email)
    return Token(access_token=access_token, user=UserOut.model_validate(user))