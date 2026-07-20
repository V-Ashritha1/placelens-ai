from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.readiness import ReadinessOut
from app.services.readiness import compute_readiness

router = APIRouter(prefix="/api/readiness", tags=["Readiness Score"])


@router.get("", response_model=ReadinessOut)
def get_readiness_score(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = compute_readiness(db, current_user.id)
    return ReadinessOut(**result)
