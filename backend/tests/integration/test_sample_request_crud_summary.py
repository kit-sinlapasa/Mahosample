from fastapi.testclient import TestClient

from tests.conftest import login
from tests.integration.test_public_sample_requests import valid_sample_request_payload


def test_staff_can_create_sample_request(client: TestClient, staff_user) -> None:
    token = login(client, staff_user.email, "staff-password")
    payload = valid_sample_request_payload()
    payload["phone"] = "0812345680"

    response = client.post(
        "/api/admin/sample-requests",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )

    assert response.status_code == 201
    assert response.json()["request_no"].startswith("MS")
    assert response.json()["phone"] == "0812345680"


def test_staff_cannot_delete_sample_request(client: TestClient, staff_user) -> None:
    request_no = client.post(
        "/api/public/sample-requests",
        json=valid_sample_request_payload(),
    ).json()["request_no"]
    token = login(client, staff_user.email, "staff-password")

    response = client.delete(
        f"/api/admin/sample-requests/{request_no}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_admin_can_delete_sample_request(client: TestClient, admin_user) -> None:
    request_no = client.post(
        "/api/public/sample-requests",
        json=valid_sample_request_payload(),
    ).json()["request_no"]
    token = login(client, admin_user.email, "admin-password")

    response = client.delete(
        f"/api/admin/sample-requests/{request_no}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 204
    assert client.get(f"/api/public/tracking/{request_no}").status_code == 404


def test_staff_can_read_dashboard_summary(client: TestClient, staff_user) -> None:
    first = client.post("/api/public/sample-requests", json=valid_sample_request_payload())
    assert first.status_code == 201
    token = login(client, staff_user.email, "staff-password")
    client.patch(
        f"/api/admin/sample-requests/{first.json()['request_no']}/shipping",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "request_status": "packed",
            "shipping_status": "ready_to_ship",
            "tracking_number": None,
        },
    )

    response = client.get(
        "/api/admin/dashboard/summary",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["total_requests"] == 1
    assert response.json()["by_request_status"]["packed"] == 1
    assert response.json()["by_shipping_status"]["ready_to_ship"] == 1

