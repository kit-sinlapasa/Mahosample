import csv
from datetime import date
from io import StringIO
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_admin_user, require_staff_user
from app.models.sample_request import SampleRequest
from app.models.user import User
from app.schemas.import_job import ImportJobRead
from app.schemas.sample_request import (
    SampleRequestAdminRead,
    SampleRequestCreate,
    SampleRequestListResponse,
    SampleRequestShippingUpdate,
    SampleRequestUpdate,
)
from app.services import sample_request_service
from app.services.tracking_import_service import import_tracking_csv

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


@router.post("", response_model=SampleRequestAdminRead, status_code=status.HTTP_201_CREATED)
def create_sample_request(
    sample_request_in: SampleRequestCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_staff_user)],
) -> SampleRequestAdminRead:
    sample_request = sample_request_service.create_public_sample_request(db, sample_request_in)
    sample_request.created_by_user_id = current_user.id
    sample_request.updated_by_user_id = current_user.id
    db.add(sample_request)
    db.commit()
    db.refresh(sample_request)
    return to_admin_read(sample_request)


@router.get("/export/post-office")
def export_post_office_csv(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_staff_user)],
) -> Response:
    sample_requests = sample_request_service.list_requests_without_tracking(db)
    output = StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=sample_request_service.POST_OFFICE_EXPORT_FIELDS,
        lineterminator="\n",
    )
    writer.writeheader()
    writer.writerows(sample_request_service.build_post_office_export_rows(sample_requests))

    return Response(
        content=f"\ufeff{output.getvalue()}",
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": (
                f'attachment; filename="ImportRecipientBook_{date.today().isoformat()}.csv"'
            ),
        },
    )


@router.post("/import/tracking", response_model=ImportJobRead)
async def import_tracking(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_staff_user)],
    file: Annotated[UploadFile, File()],
) -> ImportJobRead:
    content = await file.read()
    return import_tracking_csv(
        db,
        filename=file.filename or "tracking.csv",
        content=content,
        created_by_user_id=current_user.id,
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


@router.delete("/{request_no}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sample_request(
    request_no: str,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_admin_user)],
) -> Response:
    sample_request = sample_request_service.get_sample_request_by_request_no(db, request_no)
    if sample_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sample request not found.",
        )
    sample_request_service.delete_sample_request(db, sample_request)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


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
