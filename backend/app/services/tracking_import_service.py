import csv
from datetime import datetime
from io import StringIO

from sqlalchemy.orm import Session

from app.models.import_job import ImportJob, ImportJobRow
from app.models.sample_request import RequestStatus, ShippingStatus
from app.services.sample_request_service import get_sample_request_by_request_no

REQUIRED_IMPORT_FIELDS = {"request_no", "tracking_number", "shipping_status", "shipped_at"}


def parse_optional_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value)


def import_tracking_csv(
    db: Session,
    *,
    filename: str,
    content: bytes,
    created_by_user_id: int,
) -> ImportJob:
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(StringIO(text))
    missing_fields = REQUIRED_IMPORT_FIELDS.difference(reader.fieldnames or [])
    if missing_fields:
        job = ImportJob(
            filename=filename,
            total_rows=0,
            success_count=0,
            failed_count=1,
            not_found_count=0,
            created_by_user_id=created_by_user_id,
        )
        job.rows.append(
            ImportJobRow(
                row_number=0,
                request_no=None,
                tracking_number=None,
                status="failed",
                error_message=f"Missing required columns: {', '.join(sorted(missing_fields))}",
            ),
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job

    job = ImportJob(
        filename=filename,
        total_rows=0,
        success_count=0,
        failed_count=0,
        not_found_count=0,
        created_by_user_id=created_by_user_id,
    )
    db.add(job)

    for row_number, row in enumerate(reader, start=2):
        job.total_rows += 1
        request_no = (row.get("request_no") or "").strip()
        tracking_number = (row.get("tracking_number") or "").strip()
        shipping_status = (row.get("shipping_status") or "").strip()

        try:
            parsed_shipping_status = ShippingStatus(shipping_status)
            sample_request = get_sample_request_by_request_no(db, request_no)
            if sample_request is None:
                job.not_found_count += 1
                job.rows.append(
                    ImportJobRow(
                        row_number=row_number,
                        request_no=request_no,
                        tracking_number=tracking_number,
                        status="not_found",
                        error_message="Sample request not found.",
                    ),
                )
                continue

            sample_request.tracking_number = tracking_number
            sample_request.shipping_status = parsed_shipping_status.value
            if parsed_shipping_status == ShippingStatus.SHIPPED:
                sample_request.request_status = RequestStatus.SHIPPED.value
            sample_request.shipped_at = parse_optional_datetime(row.get("shipped_at"))
            sample_request.updated_by_user_id = created_by_user_id
            job.success_count += 1
            job.rows.append(
                ImportJobRow(
                    row_number=row_number,
                    request_no=request_no,
                    tracking_number=tracking_number,
                    status="success",
                    error_message=None,
                ),
            )
        except (ValueError, TypeError) as exc:
            job.failed_count += 1
            job.rows.append(
                ImportJobRow(
                    row_number=row_number,
                    request_no=request_no or None,
                    tracking_number=tracking_number or None,
                    status="failed",
                    error_message=str(exc),
                ),
            )

    db.commit()
    db.refresh(job)
    return job
