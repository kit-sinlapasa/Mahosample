"""create sample requests

Revision ID: 202609010002
Revises: 202609010001
Create Date: 2026-09-01 18:05:00
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "202609010002"
down_revision: str | None = "202609010001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "sample_requests",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("request_no", sa.String(length=32), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=32), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("line_id", sa.String(length=100), nullable=True),
        sa.Column("messenger_id", sa.String(length=100), nullable=True),
        sa.Column("age_range", sa.String(length=20), nullable=False),
        sa.Column("health_interest", sa.String(length=50), nullable=False),
        sa.Column("health_interest_other", sa.String(length=255), nullable=True),
        sa.Column("maho_experience", sa.String(length=30), nullable=False),
        sa.Column("recipient_name", sa.String(length=255), nullable=False),
        sa.Column("address_line1", sa.String(length=255), nullable=False),
        sa.Column("address_line2", sa.String(length=255), nullable=True),
        sa.Column("subdistrict", sa.String(length=100), nullable=False),
        sa.Column("district", sa.String(length=100), nullable=False),
        sa.Column("province", sa.String(length=100), nullable=False),
        sa.Column("postal_code", sa.String(length=10), nullable=False),
        sa.Column("address_fingerprint", sa.String(length=64), nullable=False),
        sa.Column("preferred_contact_channel", sa.String(length=20), nullable=False),
        sa.Column("pdpa_consent", sa.Boolean(), nullable=False),
        sa.Column("marketing_consent", sa.Boolean(), nullable=False),
        sa.Column("request_status", sa.String(length=20), nullable=False),
        sa.Column("shipping_status", sa.String(length=20), nullable=False),
        sa.Column("tracking_number", sa.String(length=50), nullable=True),
        sa.Column("shipped_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by_user_id", sa.Integer(), nullable=True),
        sa.Column("updated_by_user_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["updated_by_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_sample_requests_address_fingerprint"),
        "sample_requests",
        ["address_fingerprint"],
    )
    op.create_index(op.f("ix_sample_requests_id"), "sample_requests", ["id"])
    op.create_index(op.f("ix_sample_requests_phone"), "sample_requests", ["phone"], unique=True)
    op.create_index(
        op.f("ix_sample_requests_request_no"),
        "sample_requests",
        ["request_no"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_sample_requests_request_no"), table_name="sample_requests")
    op.drop_index(op.f("ix_sample_requests_phone"), table_name="sample_requests")
    op.drop_index(op.f("ix_sample_requests_id"), table_name="sample_requests")
    op.drop_index(op.f("ix_sample_requests_address_fingerprint"), table_name="sample_requests")
    op.drop_table("sample_requests")
