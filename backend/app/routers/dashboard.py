from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_staff_user
from app.models.user import User
from app.services.sample_request_service import get_dashboard_summary

router = APIRouter(prefix="/admin/dashboard", tags=["admin-dashboard"])


@router.get("/summary")
def read_dashboard_summary(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_staff_user)],
) -> dict[str, object]:
    return get_dashboard_summary(db)
