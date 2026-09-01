import csv
from io import StringIO

from fastapi.testclient import TestClient

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

