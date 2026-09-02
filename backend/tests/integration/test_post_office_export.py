import csv
from datetime import date
from io import StringIO

from fastapi.testclient import TestClient

from tests.conftest import login
from tests.integration.test_public_sample_requests import valid_sample_request_payload


def create_sample_request_with_phone(
    client: TestClient,
    phone: str,
    address_suffix: str = "A",
) -> str:
    payload = valid_sample_request_payload()
    payload["phone"] = phone
    payload["address_line1"] = f"99/9 หมู่บ้านสุขใจ {address_suffix}"
    response = client.post("/api/public/sample-requests", json=payload)
    assert response.status_code == 201
    return response.json()["request_no"]


def mark_ready_to_ship(client: TestClient, token: str, request_no: str) -> None:
    response = client.patch(
        f"/api/admin/sample-requests/{request_no}/shipping",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "request_status": "packed",
            "shipping_status": "ready_to_ship",
            "tracking_number": None,
        },
    )
    assert response.status_code == 200


def mark_shipped(
    client: TestClient,
    token: str,
    request_no: str,
    tracking_number: str = "JC012366689TH",
) -> None:
    response = client.patch(
        f"/api/admin/sample-requests/{request_no}/shipping",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "request_status": "shipped",
            "shipping_status": "shipped",
            "tracking_number": tracking_number,
        },
    )
    assert response.status_code == 200


def read_csv_rows(response_text: str) -> list[dict[str, str]]:
    csv_text = response_text.removeprefix("\ufeff")
    return list(csv.DictReader(StringIO(csv_text)))


def test_post_office_export_requires_login(client: TestClient) -> None:
    response = client.get("/api/admin/sample-requests/export/post-office")

    assert response.status_code == 401


def test_staff_can_export_ready_to_ship_csv(client: TestClient, staff_user) -> None:
    request_no = create_sample_request_with_phone(client, "0812345678")
    token = login(client, staff_user.email, "staff-password")
    mark_ready_to_ship(client, token, request_no)

    response = client.get(
        "/api/admin/sample-requests/export/post-office",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "attachment" in response.headers["content-disposition"]
    assert (
        f'filename="ImportRecipientBook_{date.today().isoformat()}.csv"'
        in response.headers["content-disposition"]
    )

    rows = read_csv_rows(response.text)
    assert len(rows) == 1
    assert rows[0]["RecipientCode\n(รหัสผู้รับ)"] == request_no
    assert rows[0]["*Recipient Name\n(ชื่อผู้รับ)"] == "สมชาย ใจดี"
    assert rows[0]["*Recipient Phone\n(เบอร์โทรศัพท์ผู้รับ)"] == "0812345678"
    assert (
        rows[0][
            "*Region（SubDistrict-District-Province-PostalCode）\n"
            "(ภูมิภาค(ตำบล-อำเภอ-จังหวัด-ภูมิภาค))"
        ]
        == "10230"
    )
    assert "99/9 หมู่บ้านสุขใจ A" in rows[0]["*Address\n(ที่อยู่)"]


def test_post_office_export_filters_blank_tracking_only(
    client: TestClient,
    staff_user,
) -> None:
    blank_tracking_request_no = create_sample_request_with_phone(client, "0812345678")
    tracked_request_no = create_sample_request_with_phone(client, "0812345679", "B")
    token = login(client, staff_user.email, "staff-password")
    mark_ready_to_ship(client, token, blank_tracking_request_no)
    mark_shipped(client, token, tracked_request_no)

    response = client.get(
        "/api/admin/sample-requests/export/post-office",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    exported_request_numbers = {
        row["RecipientCode\n(รหัสผู้รับ)"] for row in read_csv_rows(response.text)
    }
    assert blank_tracking_request_no in exported_request_numbers
    assert tracked_request_no not in exported_request_numbers
