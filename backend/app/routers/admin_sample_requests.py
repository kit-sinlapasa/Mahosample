from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_staff_user
from app.models.sample_request import SampleRequest
from app.models.user import User
from app.schemas.sample_request import (
    SampleRequestAdminRead,
    SampleRequestListResponse,
    SampleRequestShippingUpdate,
    SampleRequestUpdate,
)
from app.services import sample_request_service

router = APIRouter(prefix="/admin/sample-requests", tags=["admin-sample-requests"])


def to_admin_read(sample_request: SampleRequest) -> SampleRequestAdminRead:
    return SampleRequestAdminRead.model_validate(
        {
            **sample_request.__dict__,
            "tracking_url": sample_request_service.build_tracking_url(
                sample_request.tracking_number,
            ),
        },
    )


@router.get("", response_model=SampleRequestListResponse)
def read_sample_requests(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_staff_user)],
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> SampleRequestListResponse:
    total, items = sample_request_service.list_sample_requests(db, offset=offset, limit=limit)
    return SampleRequestListResponse(
        total=total,
        items=[to_admin_read(item) for item in items],
    )


@router.get("/{request_no}", response_model=SampleRequestAdminRead)
def read_sample_request(
    request_no: str,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_staff_user)],
) -> SampleRequestAdminRead:
    sample_request = sample_request_service.get_sample_request_by_request_no(db, request_no)
    if sample_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sample request not found.",
        )
    return to_admin_read(sample_request)


@router.patch("/{request_no}", response_model=SampleRequestAdminRead)
def update_sample_request(
    request_no: str,
    sample_request_in: SampleRequestUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_staff_user)],
) -> SampleRequestAdminRead:
    sample_request = sample_request_service.get_sample_request_by_request_no(db, request_no)
    if sample_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sample request not found.",
        )
    updated = sample_request_service.update_sample_request(
        db,
        sample_request,
        sample_request_in,
        current_user.id,
    )
    return to_admin_read(updated)


@router.patch("/{request_no}/shipping", response_model=SampleRequestAdminRead)
def update_sample_request_shipping(
    request_no: str,
    shipping_in: SampleRequestShippingUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_staff_user)],
) -> SampleRequestAdminRead:
    sample_request = sample_request_service.get_sample_request_by_request_no(db, request_no)
    if sample_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sample request not found.",
        )
    updated = sample_request_service.update_sample_request_shipping(
        db,
        sample_request,
        shipping_in,
        current_user.id,
    )
    return to_admin_read(updated)
