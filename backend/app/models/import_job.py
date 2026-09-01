from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ImportJob(Base):
    __tablename__ = "import_jobs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    total_rows: Mapped[int] = mapped_column(nullable=False, default=0)
    success_count: Mapped[int] = mapped_column(nullable=False, default=0)
    failed_count: Mapped[int] = mapped_column(nullable=False, default=0)
    not_found_count: Mapped[int] = mapped_column(nullable=False, default=0)
    created_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    rows: Mapped[list["ImportJobRow"]] = relationship(
        back_populates="import_job",
        cascade="all, delete-orphan",
    )


class ImportJobRow(Base):
    __tablename__ = "import_job_rows"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    import_job_id: Mapped[int] = mapped_column(ForeignKey("import_jobs.id"), nullable=False)
    row_number: Mapped[int] = mapped_column(nullable=False)
    request_no: Mapped[str | None] = mapped_column(String(32), nullable=True)
    tracking_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    import_job: Mapped[ImportJob] = relationship(back_populates="rows")

