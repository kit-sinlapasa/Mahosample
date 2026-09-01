from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ImportJobRowRead(BaseModel):
    id: int
    row_number: int
    request_no: str | None
    tracking_number: str | None
    status: str
    error_message: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ImportJobRead(BaseModel):
    id: int
    filename: str
    total_rows: int
    success_count: int
    failed_count: int
    not_found_count: int
    created_by_user_id: int
    created_at: datetime
    rows: list[ImportJobRowRead]

    model_config = ConfigDict(from_attributes=True)

