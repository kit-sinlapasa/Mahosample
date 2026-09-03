import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AgeRange(str, enum.Enum):
    UNDER_30 = "under_30"
    AGE_30_39 = "30-39"
    AGE_40_49 = "40-49"
    AGE_50_59 = "50-59"
    AGE_60_PLUS = "60_plus"


class HealthInterest(str, enum.Enum):
    IMMUNE_SUPPORT = "immune_support"
    GUT_HEALTH = "gut_health"
    RECOVERY = "recovery"
    SENIOR_HEALTH = "senior_health"
    GENERAL_HEALTH = "general_health"
    OTHER = "other"


class MahoExperience(str, enum.Enum):
    NEVER = "never"
    USED = "used"
    RECEIVED_SAMPLE = "received_sample"


class ReferralSource(str, enum.Enum):
    FACEBOOK = "facebook"
    WEBSITE = "website"
    GOOGLE_SEARCH = "google_search"
    IG = "ig"
    TIKTOK = "tiktok"
    FRIEND = "friend"
    BOOTH_EVENT = "booth_event"


class PreferredContactChannel(str, enum.Enum):
    PHONE = "phone"
    MESSENGER = "messenger"
    LINE = "line"


class RequestStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PACKED = "packed"
    SHIPPED = "shipped"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ShippingStatus(str, enum.Enum):
    NOT_READY = "not_ready"
    READY_TO_SHIP = "ready_to_ship"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    FAILED = "failed"


class SampleRequest(Base):
    __tablename__ = "sample_requests"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    request_no: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    line_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    messenger_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    age_range: Mapped[str] = mapped_column(String(20), nullable=False)
    health_interest: Mapped[str] = mapped_column(String(50), nullable=False)
    health_interest_other: Mapped[str | None] = mapped_column(String(255), nullable=True)
    maho_experience: Mapped[str] = mapped_column(String(30), nullable=False)
    referral_source: Mapped[str | None] = mapped_column(String(30), nullable=True)
    recipient_name: Mapped[str] = mapped_column(String(255), nullable=False)
    address_line1: Mapped[str] = mapped_column(String(255), nullable=False)
    address_line2: Mapped[str | None] = mapped_column(String(255), nullable=True)
    subdistrict: Mapped[str] = mapped_column(String(100), nullable=False)
    district: Mapped[str] = mapped_column(String(100), nullable=False)
    province: Mapped[str] = mapped_column(String(100), nullable=False)
    postal_code: Mapped[str] = mapped_column(String(10), nullable=False)
    address_fingerprint: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    preferred_contact_channel: Mapped[str] = mapped_column(String(20), nullable=False)
    pdpa_consent: Mapped[bool] = mapped_column(Boolean, nullable=False)
    marketing_consent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    request_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=RequestStatus.PENDING.value,
    )
    shipping_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=ShippingStatus.NOT_READY.value,
    )
    tracking_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    shipped_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    updated_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

