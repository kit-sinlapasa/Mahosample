import csv
from datetime import date
from io import BytesIO, StringIO
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile, status
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font
from openpyxl.utils import get_column_letter
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_admin_user, require_staff_user
from app.models.sample_request import SampleRequest
from app.models.user import User
from app.schemas.import_job import ImportJobRead
from app.schemas.sample_request import (
    SampleRequestAdminRead,
    SampleRequestCombinedUpdate,
    SampleRequestCreate,
    SampleRequestExportSelection,
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


def build_myorder_excel_response(sample_requests: list[SampleRequest]) -> Response:
    rows = sample_request_service.build_myorder_export_rows(sample_requests)

    workbook = Workbook()
    worksheet = workbook.active
    worksheet.title = "Template ใหม่_New102024"
    worksheet.append(sample_request_service.MYORDER_EXPORT_FIELDS)
    for row in rows:
        worksheet.append([row[field] for field in sample_request_service.MYORDER_EXPORT_FIELDS])

    red_headers = {1, 2, 3, 10, 11, 12, 13, 14, 15, 17, 18, 22}
    widths = [
        14.33,
        13,
        48.66,
        14.33,
        13,
        13,
        13,
        13,
        13,
        13,
        19.83,
        13,
        13,
        13,
        13,
        14.33,
        13,
        13,
        13,
        13,
        13,
        23.16,
    ]
    for index, width in enumerate(widths, start=1):
        worksheet.column_dimensions[get_column_letter(index)].width = width
        cell = worksheet.cell(row=1, column=index)
        cell.font = Font(bold=True, color="FF0000" if index in red_headers else "000000")
        cell.alignment = Alignment(horizontal="center", wrap_text=True)

    for row_index in range(2, worksheet.max_row + 1):
        worksheet.cell(row=row_index, column=2).number_format = "@"
        worksheet.cell(row=row_index, column=7).number_format = "@"

    output = BytesIO()
    workbook.save(output)
    return Response(
        content=output.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": (
                f'attachment; filename="Myorder_template_{date.today().isoformat()}.xlsx"'
            ),
        },
    )


@router.get("/export/myorder")
def export_myorder_excel(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_staff_user)],
) -> Response:
    sample_requests = sample_request_service.list_requests_without_tracking(db)
    return build_myorder_excel_response(sample_requests)


@router.post("/export/myorder")
def export_filtered_myorder_excel(
    selection: SampleRequestExportSelection,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_staff_user)],
) -> Response:
    sample_requests = sample_request_service.list_requests_without_tracking_by_numbers(
        db,
        selection.request_numbers,
    )
    return build_myorder_excel_response(sample_requests)


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


@router.patch("/{request_no}/combined", response_model=SampleRequestAdminRead)
def update_sample_request_combined(
    request_no: str,
    update_in: SampleRequestCombinedUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_staff_user)],
) -> SampleRequestAdminRead:
    sample_request = sample_request_service.get_sample_request_by_request_no(db, request_no)
    if sample_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sample request not found.",
        )
    updated = sample_request_service.update_sample_request_combined(
        db,
        sample_request,
        request_status=update_in.request_status.value,
        shipping_status=update_in.shipping_status.value,
        tracking_number=update_in.tracking_number,
        notes=update_in.notes,
        updated_by_user_id=current_user.id,
    )
    return to_admin_read(updated)
