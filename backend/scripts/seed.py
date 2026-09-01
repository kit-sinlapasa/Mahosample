import sys
from pathlib import Path

from sqlalchemy.orm import Session

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.database import SessionLocal
from app.models.user import UserRole
from app.schemas.user import UserCreate
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


def seed_users(db: Session) -> None:
    for user_in in DEMO_USERS:
        if get_user_by_email(db, user_in.email) is None:
            create_user(db, user_in)


def main() -> None:
    db = SessionLocal()
    try:
        seed_users(db)
        print("Seeded demo auth users.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
