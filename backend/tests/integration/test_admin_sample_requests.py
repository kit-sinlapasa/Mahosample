from fastapi.testclient import TestClient

from tests.conftest import login
from tests.integration.test_public_sample_requests import valid_sample_request_payload


def create_public_request(client: TestClient, phone: str = "0812345678") -> dict[str, object]:
    payload = valid_sample_request_payload()
    payload["phone"] = phone
    response = client.post("/api/public/sample-requests", json=payload)
    assert response.status_code == 201
    return response.json()


def test_staff_sample_requests_requires_login(client: TestClient) -> None:
    response = client.get("/api/admin/sample-requests")

    assert response.status_code == 401


def test_staff_can_list_sample_requests(client: TestClient, staff_user) -> None:
    created = create_public_request(client)
    token = login(client, staff_user.email, "staff-password")

    response = client.get(
        "/api/admin/sample-requests",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["request_no"] == created["request_no"]
    assert response.json()["items"][0]["phone"] == "0812345678"


def test_staff_can_update_shipping_tracking(client: TestClient, staff_user) -> None:
    created = create_public_request(client)
    token = login(client, staff_user.email, "staff-password")

    response = client.patch(
        f"/api/admin/sample-requests/{created['request_no']}/shipping",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "request_status": "shipped",
            "shipping_status": "shipped",
            "tracking_number": "JC012366689TH",
        },
    )

    assert response.status_code == 200
    assert response.json()["tracking_number"] == "JC012366689TH"
    assert response.json()["tracking_url"] == (
        "https://track.thailandpost.co.th/?trackNumber=JC012366689TH"
    )

    public_response = client.get(f"/api/public/tracking/{created['request_no']}")

    assert public_response.status_code == 200
    assert public_response.json()["shipping_status"] == "shipped"
    assert public_response.json()["tracking_number"] == "JC012366689TH"


def test_staff_can_edit_sample_request_status(client: TestClient, staff_user) -> None:
    created = create_public_request(client)
    token = login(client, staff_user.email, "staff-password")

    response = client.patch(
        f"/api/admin/sample-requests/{created['request_no']}",
        headers={"Authorization": f"Bearer {token}"},
        json={"request_status": "approved", "notes": "Eligible for sample shipment"},
    )

    assert response.status_code == 200
    assert response.json()["request_status"] == "approved"
    assert response.json()["notes"] == "Eligible for sample shipment"

