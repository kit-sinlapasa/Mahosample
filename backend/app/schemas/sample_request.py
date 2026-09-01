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

