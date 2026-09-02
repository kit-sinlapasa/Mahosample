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
            full_name="กมลวรรณ ศรีสุข",
            phone="0812345678",
            email="kamonwan.bkk@example.com",
            line_id="kamonwan.health",
            messenger_id=None,
            age_range="30-39",
            health_interest="immune_support",
            health_interest_other=None,
            maho_experience="never",
            recipient_name="กมลวรรณ ศรีสุข",
            address_line1="99/9 หมู่บ้านพฤกษา",
            address_line2="ซอยลาดพร้าว 101",
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
            full_name="อารีย์ วัฒนกุล",
            phone="0823456789",
            email="aree.w@example.com",
            line_id=None,
            messenger_id=None,
            age_range="50-59",
            health_interest="gut_health",
            health_interest_other=None,
            maho_experience="used",
            recipient_name="อารีย์ วัฒนกุล",
            address_line1="12/4 คอนโดริมน้ำ",
            address_line2="ถนนสรรพาวุธ",
            subdistrict="บางนา",
            district="บางนา",
            province="กรุงเทพมหานคร",
            postal_code="10260",
            preferred_contact_channel="line",
            pdpa_consent=True,
            marketing_consent=True,
        ),
        "request_status": RequestStatus.SHIPPED,
        "shipping_status": ShippingStatus.SHIPPED,
        "tracking_number": "JC012366689TH",
    },
    {
        "payload": SampleRequestCreate(
            full_name="นภาพร จันทร์หอม",
            phone="0834567890",
            email=None,
            line_id="napaporn.home",
            messenger_id=None,
            age_range="40-49",
            health_interest="recovery",
            health_interest_other=None,
            maho_experience="never",
            recipient_name="นภาพร จันทร์หอม",
            address_line1="55/18 หมู่บ้านกลางเมือง",
            address_line2="ถนนรามคำแหง",
            subdistrict="หัวหมาก",
            district="บางกะปิ",
            province="กรุงเทพมหานคร",
            postal_code="10240",
            preferred_contact_channel="line",
            pdpa_consent=True,
            marketing_consent=False,
        ),
        "request_status": RequestStatus.PENDING,
        "shipping_status": ShippingStatus.NOT_READY,
        "tracking_number": None,
    },
    {
        "payload": SampleRequestCreate(
            full_name="ธนภัทร เกียรติไพบูลย์",
            phone="0845678901",
            email=None,
            line_id=None,
            messenger_id="thanaphat.k",
            age_range="30-39",
            health_interest="general_health",
            health_interest_other=None,
            maho_experience="never",
            recipient_name="ธนภัทร เกียรติไพบูลย์",
            address_line1="77/21 อาคารทีวัน",
            address_line2="ถนนสุขุมวิท",
            subdistrict="คลองเตยเหนือ",
            district="วัฒนา",
            province="กรุงเทพมหานคร",
            postal_code="10110",
            preferred_contact_channel="messenger",
            pdpa_consent=True,
            marketing_consent=True,
        ),
        "request_status": RequestStatus.APPROVED,
        "shipping_status": ShippingStatus.READY_TO_SHIP,
        "tracking_number": None,
    },
    {
        "payload": SampleRequestCreate(
            full_name="พิมพ์ชนก ลิ้มเจริญ",
            phone="0856789012",
            email="pimchanok.l@example.com",
            line_id="pim.maho",
            messenger_id="pimchanok.l",
            age_range="50-59",
            health_interest="senior_health",
            health_interest_other=None,
            maho_experience="received_sample",
            recipient_name="พิมพ์ชนก ลิ้มเจริญ",
            address_line1="88/6 หมู่บ้านสวนหลวง",
            address_line2="ถนนเฉลิมพระเกียรติ ร.9",
            subdistrict="หนองบอน",
            district="ประเวศ",
            province="กรุงเทพมหานคร",
            postal_code="10250",
            preferred_contact_channel="line",
            pdpa_consent=True,
            marketing_consent=False,
        ),
        "request_status": RequestStatus.REJECTED,
        "shipping_status": ShippingStatus.NOT_READY,
        "tracking_number": None,
    },
    {
        "payload": SampleRequestCreate(
            full_name="สุรศักดิ์ อินต๊ะ",
            phone="0867890123",
            email="surasak.cm@example.com",
            line_id=None,
            messenger_id="surasak.inta",
            age_range="60_plus",
            health_interest="senior_health",
            health_interest_other=None,
            maho_experience="never",
            recipient_name="สุรศักดิ์ อินต๊ะ",
            address_line1="24/3 หมู่ 7",
            address_line2="ถนนเชียงใหม่-ฮอด",
            subdistrict="สุเทพ",
            district="เมือง",
            province="เชียงใหม่",
            postal_code="50200",
            preferred_contact_channel="messenger",
            pdpa_consent=True,
            marketing_consent=False,
        ),
        "request_status": RequestStatus.PACKED,
        "shipping_status": ShippingStatus.READY_TO_SHIP,
        "tracking_number": None,
    },
    {
        "payload": SampleRequestCreate(
            full_name="มาลี แซ่ลี้",
            phone="0878901234",
            email=None,
            line_id="malee.cr",
            messenger_id=None,
            age_range="40-49",
            health_interest="immune_support",
            health_interest_other=None,
            maho_experience="used",
            recipient_name="มาลี แซ่ลี้",
            address_line1="16/8 หมู่ 2",
            address_line2="ใกล้ตลาดสดแม่สาย",
            subdistrict="แม่สาย",
            district="แม่สาย",
            province="เชียงราย",
            postal_code="57130",
            preferred_contact_channel="line",
            pdpa_consent=True,
            marketing_consent=True,
        ),
        "request_status": RequestStatus.SHIPPED,
        "shipping_status": ShippingStatus.SHIPPED,
        "tracking_number": "JC012366690TH",
    },
    {
        "payload": SampleRequestCreate(
            full_name="อนงค์ พรมมา",
            phone="0889012345",
            email="anong.lp@example.com",
            line_id="anong.lamphun",
            messenger_id=None,
            age_range="50-59",
            health_interest="other",
            health_interest_other="ดูแลสุขภาพตับและพักฟื้นหลังทำงานหนัก",
            maho_experience="never",
            recipient_name="อนงค์ พรมมา",
            address_line1="41/2 หมู่ 5",
            address_line2="ถนนลำพูน-ป่าซาง",
            subdistrict="ในเมือง",
            district="เมืองลำพูน",
            province="ลำพูน",
            postal_code="51000",
            preferred_contact_channel="line",
            pdpa_consent=True,
            marketing_consent=False,
        ),
        "request_status": RequestStatus.PENDING,
        "shipping_status": ShippingStatus.NOT_READY,
        "tracking_number": None,
    },
    {
        "payload": SampleRequestCreate(
            full_name="ชุติมา กิตติธนากร",
            phone="0890123456",
            email="chutima.k@example.com",
            line_id=None,
            messenger_id="chutima.kitti",
            age_range="30-39",
            health_interest="gut_health",
            health_interest_other=None,
            maho_experience="never",
            recipient_name="ชุติมา กิตติธนากร",
            address_line1="19/23 ทาวน์โฮมเดอะคอนเนค",
            address_line2="ซอยรามอินทรา 65",
            subdistrict="ท่าแร้ง",
            district="บางเขน",
            province="กรุงเทพมหานคร",
            postal_code="10220",
            preferred_contact_channel="messenger",
            pdpa_consent=True,
            marketing_consent=True,
        ),
        "request_status": RequestStatus.APPROVED,
        "shipping_status": ShippingStatus.READY_TO_SHIP,
        "tracking_number": None,
    },
    {
        "payload": SampleRequestCreate(
            full_name="ไพโรจน์ แก้วเมือง",
            phone="0801234567",
            email=None,
            line_id="pairoj.fit",
            messenger_id=None,
            age_range="60_plus",
            health_interest="general_health",
            health_interest_other=None,
            maho_experience="used",
            recipient_name="ไพโรจน์ แก้วเมือง",
            address_line1="63/5 หมู่ 4",
            address_line2="ใกล้วัดใหญ่",
            subdistrict="ในเมือง",
            district="เมืองพิษณุโลก",
            province="พิษณุโลก",
            postal_code="65000",
            preferred_contact_channel="line",
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
