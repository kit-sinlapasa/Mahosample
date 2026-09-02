from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.models.sample_request import (
    AgeRange,
    HealthInterest,
    MahoExperience,
    PreferredContactChannel,
    RequestStatus,
    ShippingStatus,
)


class SampleRequestCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    phone: str = Field(min_length=9, max_length=32)
    email: EmailStr | None = None
    line_id: str | None = Field(default=None, max_length=100)
    messenger_id: str | None = Field(default=None, max_length=100)
    age_range: AgeRange
    health_interest: HealthInterest
    health_interest_other: str | None = Field(default=None, max_length=255)
    maho_experience: MahoExperience
    recipient_name: str = Field(min_length=1, max_length=255)
    address_line1: str = Field(min_length=1, max_length=255)
    address_line2: str | None = Field(default=None, max_length=255)
    subdistrict: str = Field(min_length=1, max_length=100)
    district: str = Field(min_length=1, max_length=100)
    province: str = Field(min_length=1, max_length=100)
    postal_code: str = Field(min_length=5, max_length=10)
    preferred_contact_channel: PreferredContactChannel
    pdpa_consent: bool
    marketing_consent: bool = False

    @field_validator("email", "line_id", "messenger_id", "health_interest_other", mode="before")
    @classmethod
    def blank_string_to_none(cls, value: object) -> object:
        if isinstance(value, str) and not value.strip():
            return None
        return value

    @field_validator("phone", "postal_code")
    @classmethod
    def keep_digits_only(cls, value: str) -> str:
        normalized = "".join(character for character in value if character.isdigit())
        if not normalized:
            raise ValueError("must contain digits")
        return normalized

    @model_validator(mode="after")
    def validate_business_rules(self) -> "SampleRequestCreate":
        if not self.pdpa_consent:
            raise ValueError("PDPA consent is required.")
        if not (self.email or self.line_id or self.messenger_id):
            raise ValueError("At least one contact channel is required.")
        if self.health_interest == HealthInterest.OTHER and not self.health_interest_other:
            raise ValueError("health_interest_other is required when health_interest is other.")
        return self


class SampleRequestPublicRead(BaseModel):
    request_no: str
    request_status: RequestStatus
    shipping_status: ShippingStatus
    tracking_number: str | None
    tracking_url: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SampleRequestTrackingRead(BaseModel):
    request_no: str
    request_status: RequestStatus
    shipping_status: ShippingStatus
    tracking_number: str | None
    tracking_url: str | None


class SampleRequestAdminRead(BaseModel):
    id: int
    request_no: str
    full_name: str
    phone: str
    email: EmailStr | None
    line_id: str | None
    messenger_id: str | None
    age_range: AgeRange
    health_interest: HealthInterest
    health_interest_other: str | None
    maho_experience: MahoExperience
    recipient_name: str
    address_line1: str
    address_line2: str | None
    subdistrict: str
    district: str
    province: str
    postal_code: str
    preferred_contact_channel: PreferredContactChannel
    pdpa_consent: bool
    marketing_consent: bool
    request_status: RequestStatus
    shipping_status: ShippingStatus
    tracking_number: str | None
    tracking_url: str | None
    shipped_at: datetime | None
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SampleRequestListResponse(BaseModel):
    total: int
    items: list[SampleRequestAdminRead]


class SampleRequestUpdate(BaseModel):
    request_status: RequestStatus | None = None
    notes: str | None = Field(default=None, max_length=5000)


class SampleRequestShippingUpdate(BaseModel):
    request_status: RequestStatus | None = None
    shipping_status: ShippingStatus
    tracking_number: str | None = Field(default=None, max_length=50)
    shipped_at: datetime | None = None

