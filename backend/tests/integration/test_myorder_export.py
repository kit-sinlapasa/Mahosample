from datetime import date
from io import BytesIO

from fastapi.testclient import TestClient
from openpyxl import load_workbook

from app.services import sample_request_service
from tests.conftest import login
from tests.integration.test_post_office_export import (
    create_sample_request_with_phone,
    mark_shipped,
)


def test_myorder_export_requires_login(client: TestClient) -> None:
    response = client.get("/api/admin/sample-requests/export/myorder")

    assert response.status_code == 401


def test_staff_can_export_myorder_excel(
    client: TestClient,
    staff_user,
) -> None:
    blank_tracking_request_no = create_sample_request_with_phone(client, "0812345678")
    tracked_request_no = create_sample_request_with_phone(client, "0812345679", "B")
    token = login(client, staff_user.email, "staff-password")
    mark_shipped(client, token, tracked_request_no)

    response = client.get(
        "/api/admin/sample-requests/export/myorder",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    assert response.headers["content-disposition"] == (
        f'attachment; filename="Myorder_template_{date.today().isoformat()}.xlsx"'
    )

    workbook = load_workbook(BytesIO(response.content), data_only=True)
    worksheet = workbook["Template ใหม่_New102024"]
    assert [cell.value for cell in worksheet[1]] == sample_request_service.MYORDER_EXPORT_FIELDS
    assert worksheet.max_row == 2
    assert worksheet["A2"].value == "สมชาย ใจดี"
    assert worksheet["B2"].value == "0812345678"
    assert worksheet["C2"].value == "99/9 หมู่บ้านสุขใจ A ถนนสุขุมวิท"
    assert worksheet["I2"].value == blank_tracking_request_no
    assert worksheet["J2"].value == "MAHO Beta-1,3/1,6-Glucan แบบเจล ฟรี 2 ซอง"
    assert worksheet["R2"].value == 0
    assert worksheet["V2"].value == "Facebook"
