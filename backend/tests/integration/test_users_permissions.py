from fastapi.testclient import TestClient

from tests.conftest import login


def test_users_endpoint_requires_login(client: TestClient) -> None:
    response = client.get("/api/admin/users")

    assert response.status_code == 401


def test_staff_cannot_create_admin_user(client: TestClient, staff_user) -> None:
    token = login(client, staff_user.email, "staff-password")

    response = client.post(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "email": "new-admin@example.com",
            "full_name": "New Admin",
            "password": "safe-password-123",
            "role": "admin",
        },
    )

    assert response.status_code == 403


def test_admin_can_create_staff_user(client: TestClient, admin_user) -> None:
    token = login(client, admin_user.email, "admin-password")

    response = client.post(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "email": "new-staff@example.com",
            "full_name": "New Staff",
            "password": "safe-password-123",
            "role": "staff",
        },
    )

    assert response.status_code == 201
    assert response.json()["email"] == "new-staff@example.com"
    assert "hashed_password" not in response.json()

