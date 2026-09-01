import hashlib
from collections.abc import Iterable
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.sample_request import RequestStatus, SampleRequest, ShippingStatus
from app.schemas.sample_request import (
    SampleRequestCreate,
    SampleRequestShippingUpdate,
    SampleRequestTrackingRead,
    SampleRequestUpdate,
)


def build_address_fingerprint(sample_request_in: SampleRequestCreate) -> str:
    parts = [
        sample_request_in.recipient_name,
        sample_request_in.address_line1,
        sample_request_in.address_line2 or "",
        sample_request_in.subdistrict,
        sample_request_in.district,
        sample_request_in.province,
        sample_request_in.postal_code,
    ]
    normalized = "|".join(part.strip().lower().replace(" ", "") for part in parts)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def generate_request_no(db: Session) -> str:
    today = datetime.now().strftime("%Y%m%d")
    prefix = f"MS{today}"
    count = db.scalar(
        select(func.count()).select_from(SampleRequest).where(
            SampleRequest.request_no.like(f"{prefix}%"),
        ),
    )
    return f"{prefix}{(count or 0) + 1:04d}"


def build_tracking_url(tracking_number: str | None) -> str | None:
    if not tracking_number:
        return None
    base_url = get_settings().thailand_post_tracking_base_url.rstrip("/")
    return f"{base_url}/?trackNumber={tracking_number}"


def get_tracking_response(sample_request: SampleRequest) -> SampleRequestTrackingRead:
    return SampleRequestTrackingRead(
        request_no=sample_request.request_no,
        request_status=sample_request.request_status,
        shipping_status=sample_request.shipping_status,
        tracking_number=sample_request.tracking_number,
        tracking_url=build_tracking_url(sample_request.tracking_number),
    )


def create_public_sample_request(
    db: Session,
    sample_request_in: SampleRequestCreate,
) -> SampleRequest:
    address_fingerprint = build_address_fingerprint(sample_request_in)
    duplicate = db.scalar(
        select(SampleRequest).where(
            (SampleRequest.phone == sample_request_in.phone)
            | (SampleRequest.address_fingerprint == address_fingerprint),
        ),
    )
    if duplicate is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This person, phone number, or address has already registered.",
        )

    sample_request = SampleRequest(
        request_no=generate_request_no(db),
        full_name=sample_request_in.full_name,
        phone=sample_request_in.phone,
        email=sample_request_in.email,
        line_id=sample_request_in.line_id,
        messenger_id=sample_request_in.messenger_id,
        age_range=sample_request_in.age_range.value,
        health_interest=sample_request_in.health_interest.value,
        health_interest_other=sample_request_in.health_interest_other,
        maho_experience=sample_request_in.maho_experience.value,
        recipient_name=sample_request_in.recipient_name,
        address_line1=sample_request_in.address_line1,
        address_line2=sample_request_in.address_line2,
        subdistrict=sample_request_in.subdistrict,
        district=sample_request_in.district,
        province=sample_request_in.province,
        postal_code=sample_request_in.postal_code,
        address_fingerprint=address_fingerprint,
        preferred_contact_channel=sample_request_in.preferred_contact_channel.value,
        pdpa_consent=sample_request_in.pdpa_consent,
        marketing_consent=sample_request_in.marketing_consent,
        request_status=RequestStatus.PENDING.value,
        shipping_status=ShippingStatus.NOT_READY.value,
    )
    db.add(sample_request)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This registration already exists.",
        ) from None
    db.refresh(sample_request)
    return sample_request


def get_sample_request_by_request_no(db: Session, request_no: str) -> SampleRequest | None:
    return db.scalar(select(SampleRequest).where(SampleRequest.request_no == request_no))


def list_sample_requests(
    db: Session,
    offset: int = 0,
    limit: int = 50,
) -> tuple[int, list[SampleRequest]]:
    total = db.scalar(select(func.count()).select_from(SampleRequest)) or 0
    items = list(
        db.scalars(
            select(SampleRequest)
            .order_by(SampleRequest.created_at.desc(), SampleRequest.id.desc())
            .offset(offset)
            .limit(limit),
        ),
    )
    return total, items


def list_ready_to_ship_requests(db: Session) -> list[SampleRequest]:
    return list(
        db.scalars(
            select(SampleRequest)
            .where(SampleRequest.shipping_status == ShippingStatus.READY_TO_SHIP.value)
            .order_by(SampleRequest.created_at.asc(), SampleRequest.id.asc()),
        ),
    )


POST_OFFICE_EXPORT_FIELDS = [
    "request_no",
    "recipient_name",
    "phone",
    "address_line1",
    "address_line2",
    "subdistrict",
    "district",
    "province",
    "postal_code",
    "shipping_status",
]


def build_post_office_export_rows(
    sample_requests: Iterable[SampleRequest],
) -> list[dict[str, str]]:
    rows = []
    for sample_request in sample_requests:
        rows.append(
            {
                "request_no": sample_request.request_no,
                "recipient_name": sample_request.recipient_name,
                "phone": sample_request.phone,
                "address_line1": sample_request.address_line1,
                "address_line2": sample_request.address_line2 or "",
                "subdistrict": sample_request.subdistrict,
                "district": sample_request.district,
                "province": sample_request.province,
                "postal_code": sample_request.postal_code,
                "shipping_status": sample_request.shipping_status,
            },
        )
    return rows


def update_sample_request(
    db: Session,
    sample_request: SampleRequest,
    sample_request_in: SampleRequestUpdate,
    updated_by_user_id: int,
) -> SampleRequest:
    update_data = sample_request_in.model_dump(exclude_unset=True)
    if request_status := update_data.pop("request_status", None):
        sample_request.request_status = request_status.value
    for field, value in update_data.items():
        setattr(sample_request, field, value)
    sample_request.updated_by_user_id = updated_by_user_id
    db.add(sample_request)
    db.commit()
    db.refresh(sample_request)
    return sample_request


def update_sample_request_shipping(
    db: Session,
    sample_request: SampleRequest,
    shipping_in: SampleRequestShippingUpdate,
    updated_by_user_id: int,
) -> SampleRequest:
    if shipping_in.request_status is not None:
        sample_request.request_status = shipping_in.request_status.value
    sample_request.shipping_status = shipping_in.shipping_status.value
    sample_request.tracking_number = shipping_in.tracking_number
    sample_request.shipped_at = shipping_in.shipped_at
    sample_request.updated_by_user_id = updated_by_user_id
    db.add(sample_request)
    db.commit()
    db.refresh(sample_request)
    return sample_request

