import csv
from io import BytesIO, StringIO

from fastapi.testclient import TestClient
from openpyxl import Workbook

from tests.conftest import login
from tests.integration.test_public_sample_requests import valid_sample_request_payload


def create_public_request(client: TestClient, phone: str = "0812345678") -> str:
    payload = valid_sample_request_payload()
    payload["phone"] = phone
    response = client.post("/api/public/sample-requests", json=payload)
    assert response.status_code == 201
    return response.json()["request_no"]


def build_import_csv(rows: list[dict[str, str]]) -> bytes:
    output = StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=["request_no", "tracking_number", "shipping_status", "shipped_at"],
        lineterminator="\n",
    )
    writer.writeheader()
    writer.writerows(rows)
    return output.getvalue().encode("utf-8")


def build_kex_import_xlsx(request_no: str, tracking_number: str) -> bytes:
    workbook = Workbook()
    worksheet = workbook.active
    worksheet.append(
        [
            "เลขนำส่งพัสดุ",
            "สาขา",
            "รหัสลูกค้า",
            "รหัสผู้รับ",
            "ชื่อผู้รับ",
            "เบอร์โทรศัพท์ผู้รับ",
            "รหัสไปรษณีย์ผู้รับ",
            "ที่อยู่ผู้รับ",
            "สถานะการขนส่งสุดท้าย",
            "วันที่ยืนยันการสั่งซื้อ",
            "วันที่รับสินค้า",
        ],
    )
    worksheet.append(
        [
            tracking_number,
            "CATC",
            "CATC",
            request_no,
            "คุณทดสอบ ระบบ",
            "0812345678",
            "10110",
            "99/88 ถนนสุขุมวิท แขวงคลองตัน เขตวัฒนา กรุงเทพมหานคร",
            "ขนส่งเข้ารับพัสดุสำเร็จ",
            "2026-09-02T10:00:00+00:00",
            None,
        ],
    )
    output = BytesIO()
    workbook.save(output)
    return output.getvalue()


def test_tracking_import_requires_login(client: TestClient) -> None:
    csv_content = build_import_csv([])

    response = client.post(
        "/api/admin/sample-requests/import/tracking",
        files={"file": ("tracking.csv", csv_content, "text/csv")},
    )

    assert response.status_code == 401


def test_staff_can_import_tracking_updates(client: TestClient, staff_user) -> None:
    request_no = create_public_request(client)
    token = login(client, staff_user.email, "staff-password")
    csv_content = build_import_csv(
        [
            {
                "request_no": request_no,
                "tracking_number": "JC012366689TH",
                "shipping_status": "shipped",
                "shipped_at": "2026-09-01T10:00:00+00:00",
            },
        ],
    )

    response = client.post(
        "/api/admin/sample-requests/import/tracking",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("tracking.csv", csv_content, "text/csv")},
    )

    assert response.status_code == 200
    assert response.json()["total_rows"] == 1
    assert response.json()["success_count"] == 1
    assert response.json()["not_found_count"] == 0
    assert response.json()["failed_count"] == 0

    tracking_response = client.get(f"/api/public/tracking/{request_no}")

    assert tracking_response.status_code == 200
    assert tracking_response.json()["shipping_status"] == "shipped"
    assert tracking_response.json()["tracking_number"] == "JC012366689TH"


def test_staff_can_import_kex_xlsx_tracking_updates(client: TestClient, staff_user) -> None:
    request_no = create_public_request(client)
    token = login(client, staff_user.email, "staff-password")
    xlsx_content = build_kex_import_xlsx(request_no, "KEX100147504110")

    response = client.post(
        "/api/admin/sample-requests/import/tracking",
        headers={"Authorization": f"Bearer {token}"},
        files={
            "file": (
                "track_trace_picked.xlsx",
                xlsx_content,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ),
        },
    )

    assert response.status_code == 200
    assert response.json()["total_rows"] == 1
    assert response.json()["success_count"] == 1
    assert response.json()["not_found_count"] == 0
    assert response.json()["failed_count"] == 0

    tracking_response = client.get(f"/api/public/tracking/{request_no}")

    assert tracking_response.status_code == 200
    assert tracking_response.json()["shipping_status"] == "shipped"
    assert tracking_response.json()["tracking_number"] == "KEX100147504110"


def test_tracking_import_reports_missing_request_numbers(client: TestClient, staff_user) -> None:
    token = login(client, staff_user.email, "staff-password")
    csv_content = build_import_csv(
        [
            {
                "request_no": "MS209901010001",
                "tracking_number": "JC000000000TH",
                "shipping_status": "shipped",
                "shipped_at": "2026-09-01T10:00:00+00:00",
            },
        ],
    )

    response = client.post(
        "/api/admin/sample-requests/import/tracking",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("tracking.csv", csv_content, "text/csv")},
    )

    assert response.status_code == 200
    assert response.json()["total_rows"] == 1
    assert response.json()["success_count"] == 0
    assert response.json()["not_found_count"] == 1
    assert response.json()["failed_count"] == 0
    assert response.json()["rows"][0]["status"] == "not_found"

