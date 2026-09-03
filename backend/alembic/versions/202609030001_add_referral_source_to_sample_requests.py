"""add referral source to sample requests

Revision ID: 202609030001
Revises: 202609010003
Create Date: 2026-09-03 13:35:00
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "202609030001"
down_revision: str | None = "202609010003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "sample_requests",
        sa.Column("referral_source", sa.String(length=30), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("sample_requests", "referral_source")
