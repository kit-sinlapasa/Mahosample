import sys
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.database import SessionLocal
from app.models.sample_request import RequestStatus, SampleRequest, ShippingStatus
from app.models.user import UserRole
from app.schemas.sample_request import SampleRequestCreate
from app.schemas.user import UserCreate
from app.services.sample_request_service import (
    create_public_sample_request,
)
from app.services.user_service import create_user, get_user_by_email

DEMO_USERS = [
    UserCreate(
        email="admin.demo@example.com",
        full_name="Demo Admin",
        password="admin-password",
        role=UserRole.ADMIN,
    ),
    UserCreate(
        email="staff.demo@example.com",
        full_name="Demo Staff",
        password="staff-password",
        role=UserRole.STAFF,
    ),
]


DEMO_SAMPLE_REQUESTS = [
    {
        "payload": SampleRequestCreate(
            full_name="สมชาย ใจดี",
            phone="0812345678",
            email="somchai@example.com",
            line_id="somchai-line",
            messenger_id=None,
            age_range="40-49",
            health_interest="immune_support",
            health_interest_other=None,
            maho_experience="never",
            recipient_name="สมชาย ใจดี",
            address_line1="99/9 หมู่บ้านสุขใจ",
            address_line2="ถนนตัวอย่าง",
            subdistrict="ลาดพร้าว",
            district="ลาดพร้าว",
            province="กรุงเทพมหานคร",
            postal_code="10230",
            preferred_contact_channel="line",
            pdpa_consent=True,
            marketing_consent=False,
        ),
        "request_status": RequestStatus.PACKED,
        "shipping_status": ShippingStatus.READY_TO_SHIP,
        "tracking_number": None,
    },
    {
        "payload": SampleRequestCreate(
            full_name="อารีย์ สุขภาพดี",
            phone="0823456789",
            email="aree@example.com",
            line_id="aree-health",
            messenger_id=None,
            age_range="50-59",
            health_interest="gut_health",
            health_interest_other=None,
            maho_experience="used",
            recipient_name="อารีย์ สุขภาพดี",
            address_line1="12/4 อาคารสีเขียว",
            address_line2="ซอย 8",
            subdistrict="บางนา",
            district="บางนา",
            province="กรุงเทพมหานคร",
            postal_code="10260",
            preferred_contact_channel="phone",
            pdpa_consent=True,
            marketing_consent=True,
        ),
        "request_status": RequestStatus.SHIPPED,
        "shipping_status": ShippingStatus.SHIPPED,
        "tracking_number": "JC012366689TH",
    },
    {
        "payload": SampleRequestCreate(
            full_name="วิชัย ทดลอง",
            phone="0834567890",
            email="wichai@example.com",
            line_id=None,
            messenger_id="wichai-chat",
            age_range="60_plus",
            health_interest="senior_health",
            health_interest_other=None,
            maho_experience="never",
            recipient_name="วิชัย ทดลอง",
            address_line1="88 หมู่ 5",
            address_line2=None,
            subdistrict="เมืองเก่า",
            district="เมือง",
            province="ขอนแก่น",
            postal_code="40000",
            preferred_contact_channel="messenger",
            pdpa_consent=True,
            marketing_consent=False,
        ),
        "request_status": RequestStatus.PENDING,
        "shipping_status": ShippingStatus.NOT_READY,
        "tracking_number": None,
    },
]


def seed_users(db: Session) -> None:
    for user_in in DEMO_USERS:
        if get_user_by_email(db, user_in.email) is None:
            create_user(db, user_in)


def seed_sample_requests(db: Session) -> None:
    for item in DEMO_SAMPLE_REQUESTS:
        payload = item["payload"]
        existing = db.scalar(select(SampleRequest).where(SampleRequest.phone == payload.phone))
        if existing is not None:
            continue
        try:
            sample_request = create_public_sample_request(db, payload)
        except Exception as exc:
            print(f"Skipped sample request seed for {payload.phone}: {exc}")
            continue
        sample_request.request_status = item["request_status"].value
        sample_request.shipping_status = item["shipping_status"].value
        sample_request.tracking_number = item["tracking_number"]
        db.add(sample_request)
        db.commit()


def main() -> None:
    db = SessionLocal()
    try:
        seed_users(db)
        seed_sample_requests(db)
        print("Seeded demo auth users and sample requests.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
