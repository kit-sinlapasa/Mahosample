from fastapi.testclient import TestClient


def valid_sample_request_payload() -> dict[str, object]:
    return {
        "full_name": "สมชาย ใจดี",
        "phone": "0812345678",
        "email": "somchai@example.com",
        "line_id": "somchai-line",
        "messenger_id": None,
        "age_range": "40-49",
        "health_interest": "immune_support",
        "health_interest_other": None,
        "maho_experience": "never",
        "recipient_name": "สมชาย ใจดี",
        "address_line1": "99/9 หมู่บ้านสุขใจ",
        "address_line2": "ถนนตัวอย่าง",
        "subdistrict": "ลาดพร้าว",
        "district": "ลาดพร้าว",
        "province": "กรุงเทพมหานคร",
        "postal_code": "10230",
        "preferred_contact_channel": "line",
        "pdpa_consent": True,
        "marketing_consent": False,
    }


def test_public_user_can_create_sample_request(client: TestClient) -> None:
    response = client.post("/api/public/sample-requests", json=valid_sample_request_payload())

    assert response.status_code == 201
    body = response.json()
    assert body["request_no"].startswith("MS")
    assert body["request_status"] == "pending"
    assert body["shipping_status"] == "not_ready"


def test_public_user_can_create_sample_request_with_line_only(client: TestClient) -> None:
    payload = valid_sample_request_payload()
    payload["phone"] = "0812345680"
    payload["email"] = None
    payload["line_id"] = "somchai-line-only"
    payload["messenger_id"] = None

    response = client.post("/api/public/sample-requests", json=payload)

    assert response.status_code == 201


def test_public_user_can_create_sample_request_with_messenger_only(client: TestClient) -> None:
    payload = valid_sample_request_payload()
    payload["phone"] = "0812345681"
    payload["email"] = None
    payload["line_id"] = None
    payload["messenger_id"] = "somchai-messenger-only"

    response = client.post("/api/public/sample-requests", json=payload)

    assert response.status_code == 201


def test_public_sample_request_requires_at_least_one_contact_channel(
    client: TestClient,
) -> None:
    payload = valid_sample_request_payload()
    payload["phone"] = "0812345682"
    payload["email"] = None
    payload["line_id"] = None
    payload["messenger_id"] = None

    response = client.post("/api/public/sample-requests", json=payload)

    assert response.status_code == 422


def test_public_sample_request_requires_pdpa_consent(client: TestClient) -> None:
    payload = valid_sample_request_payload()
    payload["phone"] = "0812345679"
    payload["pdpa_consent"] = False

    response = client.post("/api/public/sample-requests", json=payload)

    assert response.status_code == 422


def test_public_sample_request_rejects_duplicate_phone(client: TestClient) -> None:
    payload = valid_sample_request_payload()
    first_response = client.post("/api/public/sample-requests", json=payload)
    assert first_response.status_code == 201

    duplicate_payload = valid_sample_request_payload()
    duplicate_payload["email"] = "another@example.com"

    response = client.post("/api/public/sample-requests", json=duplicate_payload)

    assert response.status_code == 409


def test_public_tracking_does_not_expose_personal_data(client: TestClient) -> None:
    create_response = client.post(
        "/api/public/sample-requests",
        json=valid_sample_request_payload(),
    )
    assert create_response.status_code == 201
    request_no = create_response.json()["request_no"]

    response = client.get(f"/api/public/tracking/{request_no}")

    assert response.status_code == 200
    body = response.json()
    assert body["request_no"] == request_no
    assert "full_name" not in body
    assert "phone" not in body
    assert "address_line1" not in body
    assert "email" not in body


def test_public_tracking_can_be_read_by_tracking_number(client: TestClient, staff_user) -> None:
    create_response = client.post(
        "/api/public/sample-requests",
        json=valid_sample_request_payload(),
    )
    assert create_response.status_code == 201
    request_no = create_response.json()["request_no"]

    from tests.conftest import login

    token = login(client, staff_user.email, "staff-password")
    shipping_response = client.patch(
        f"/api/admin/sample-requests/{request_no}/shipping",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "request_status": "shipped",
            "shipping_status": "shipped",
            "tracking_number": "JC012366689TH",
        },
    )
    assert shipping_response.status_code == 200

    response = client.get("/api/public/tracking-number/JC012366689TH")

    assert response.status_code == 200
    assert response.json()["request_no"] == request_no
    assert response.json()["tracking_url"] == (
        "https://track.thailandpost.co.th/?trackNumber=JC012366689TH"
    )
    assert "phone" not in response.json()
