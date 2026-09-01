from fastapi.testclient import TestClient

from tests.conftest import login


def test_login_returns_jwt_for_active_user(client: TestClient, admin_user) -> None:
    token = login(client, admin_user.email, "admin-password")

    assert token


def test_login_rejects_wrong_password(client: TestClient, admin_user) -> None:
    response = client.post(
        "/api/auth/login",
        json={"email": admin_user.email, "password": "wrong-password"},
    )

    assert response.status_code == 401


def test_me_returns_current_user(client: TestClient, admin_user) -> None:
    token = login(client, admin_user.email, "admin-password")

    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["email"] == admin_user.email
    assert response.json()["role"] == "admin"

