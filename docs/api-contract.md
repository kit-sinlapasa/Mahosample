# Mahosample API Contract

Base URL:

```text
http://maho.kitaith.com:18080/api
```

## Authentication

Staff/Admin endpoints require:

```http
Authorization: Bearer <jwt_token>
```

## Public APIs

### POST /public/sample-requests

Create a public sample request.

Request body:

```json
{
  "full_name": "สมชาย ใจดี",
  "phone": "0812345678",
  "email": "somchai@example.com",
  "line_id": "somchai-line",
  "messenger_id": null,
  "age_range": "40-49",
  "health_interest": "immune_support",
  "health_interest_other": null,
  "maho_experience": "never",
  "recipient_name": "สมชาย ใจดี",
  "address_line1": "99/9 หมู่บ้านสุขใจ",
  "address_line2": "ถนนตัวอย่าง",
  "subdistrict": "ลาดพร้าว",
  "district": "ลาดพร้าว",
  "province": "กรุงเทพมหานคร",
  "postal_code": "10230",
  "preferred_contact_channel": "line",
  "pdpa_consent": true,
  "marketing_consent": false
}
```

Success `201`:

```json
{
  "request_no": "MS202609020020",
  "request_status": "pending",
  "shipping_status": "not_ready",
  "tracking_number": null,
  "tracking_url": null,
  "created_at": "2026-09-02T14:55:55.000000Z"
}
```

Errors:

| Status | Detail | Meaning |
| --- | --- | --- |
| 409 | `duplicate_phone` | เบอร์โทรศัพท์ซ้ำ |
| 409 | `duplicate_address` | ที่อยู่จัดส่งซ้ำ |
| 409 | `duplicate_phone_and_address` | ซ้ำทั้งเบอร์และที่อยู่ |
| 422 | validation error | ข้อมูลไม่ครบหรือผิดรูปแบบ |

### GET /public/tracking/{request_no}

Read public tracking by internal request number.

### GET /public/tracking-number/{tracking_number}

Read public tracking by tracking number.

Success `200`:

```json
{
  "request_no": "MS202609020020",
  "request_status": "shipped",
  "shipping_status": "shipped",
  "tracking_number": "JC012366691TH",
  "tracking_url": "https://track.thailandpost.co.th/?trackNumber=JC012366691TH"
}
```

Public tracking response intentionally excludes name, phone, address, email, LINE ID and Messenger ID.

## Auth APIs

### POST /auth/login

Request:

```json
{
  "email": "staff@example.com",
  "password": "password"
}
```

Success `200`:

```json
{
  "access_token": "<jwt_token>",
  "token_type": "bearer"
}
```

### GET /auth/me

Return current authenticated user.

## Staff/Admin Sample Request APIs

### GET /admin/sample-requests

Query params:

| Param | Rule | Default |
| --- | --- | --- |
| `offset` | integer >= 0 | 0 |
| `limit` | integer 1-100 | 50 |

Success:

```json
{
  "total": 20,
  "items": []
}
```

### GET /admin/sample-requests/{request_no}

Return one sample request with full staff fields.

### PATCH /admin/sample-requests/{request_no}

Update request status and notes.

Request:

```json
{
  "request_status": "approved",
  "notes": "ตรวจสิทธิ์แล้ว ส่งได้"
}
```

### PATCH /admin/sample-requests/{request_no}/shipping

Update shipping status and tracking.

Request:

```json
{
  "request_status": "shipped",
  "shipping_status": "shipped",
  "tracking_number": "JC012366691TH",
  "shipped_at": "2026-09-02T10:00:00+00:00"
}
```

### GET /admin/sample-requests/export/post-office

Export CSV for shipping provider.

Rules:
- Auth required
- Includes only requests with blank tracking
- Filename: `ImportRecipientBook_yyyy-mm-dd.csv`
- Uses internal request number as recipient code

### POST /admin/sample-requests/import/tracking

Upload CSV or KEX XLSX to update tracking.

Supported CSV columns:
- `request_no`
- `tracking_number`
- `shipping_status`
- `shipped_at`

KEX XLSX mapping:
- `รหัสผู้รับ` -> request number
- `เลขนำส่งพัสดุ` -> tracking number
- `สถานะการขนส่งสุดท้าย` -> shipping status

Success:

```json
{
  "id": 1,
  "filename": "tracking.csv",
  "total_rows": 1,
  "success_count": 1,
  "failed_count": 0,
  "not_found_count": 0,
  "rows": []
}
```

### DELETE /admin/sample-requests/{request_no}

Admin only. Delete a sample request.

## Admin User APIs

### GET /admin/users

Admin only. List users.

### POST /admin/users

Admin only. Create user.

### PATCH /admin/users/{user_id}

Admin only. Update user.

### DELETE /admin/users/{user_id}

Admin only. Deactivate user.

