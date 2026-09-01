from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.sample_request import (
    SampleRequestCreate,
    SampleRequestPublicRead,
    SampleRequestTrackingRead,
)
from app.services import sample_request_service

router = APIRouter(prefix="/public", tags=["public-sample-requests"])


@router.post(
    "/sample-requests",
    response_model=SampleRequestPublicRead,
    status_code=status.HTTP_201_CREATED,
)
def create_sample_request(
    sample_request_in: SampleRequestCreate,
    db: Annotated[Session, Depends(get_db)],
) -> SampleRequestPublicRead:
    sample_request = sample_request_service.create_public_sample_request(db, sample_request_in)
    tracking = sample_request_service.get_tracking_response(sample_request)
    return SampleRequestPublicRead(
        request_no=tracking.request_no,
        request_status=tracking.request_status,
        shipping_status=tracking.shipping_status,
        tracking_number=tracking.tracking_number,
        tracking_url=tracking.tracking_url,
        created_at=sample_request.created_at,
    )


@router.get("/tracking/{request_no}", response_model=SampleRequestTrackingRead)
def read_tracking(
    request_no: str,
    db: Annotated[Session, Depends(get_db)],
) -> SampleRequestTrackingRead:
    sample_request = sample_request_service.get_sample_request_by_request_no(db, request_no)
    if sample_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sample request not found.",
        )
    return sample_request_service.get_tracking_response(sample_request)

