# Mahosample Test Report 2026-09-02

รายงานผลทดสอบนี้บันทึกผลการทดสอบระบบหลักของ Mahosample หลัง deploy บน Hostinger VPS

## Environment

- Date: 2026-09-02
- Application URL: `http://maho.kitaith.com:18080`
- API health: `GET /api/health`
- Source branch tested locally: `main`
- Latest deployed change before test: `dab8d2a feat: add staff date range filters (#28)`

## Automated Test Results

| Test Type | Command | Result |
| --- | --- | --- |
| Backend integration | `pytest backend/tests -q --tb=short` | Passed: 32 tests |
| Frontend build | `npm run build` | Passed |

## Live End-to-End Smoke Test

ทดสอบผ่าน live API บน `http://maho.kitaith.com:18080` ด้วยข้อมูลจำลอง

| Flow | Result | Evidence |
| --- | --- | --- |
| Public registration | Passed | Created request `MS202609020012`, status `201` |
| Duplicate phone validation | Passed | Response `409`, detail `duplicate_phone` |
| Duplicate address validation | Passed | Response `409`, detail `duplicate_address` |
| Staff login | Passed | Login response `200`, token issued |
| Staff shipping update | Passed | Request `MS202609020012` updated with tracking `JC000212846TH` |
| Public tracking by tracking number | Passed | Tracking lookup returned request `MS202609020012`, status `shipped` |
| Post office CSV export | Passed | Response `200`, filename `ImportRecipientBook_2026-09-02.csv` |
| Export blank tracking condition | Passed | Export contained ready request with blank tracking |
| Tracking import CSV | Passed | Total `1`, success `1`, not found `0`, failed `0`; request `MS202609020015` |
| Staff full table page | Passed | `/staff/requests` loads after deploy and shows table headers, filters, date range inputs |

## Notes

- Live test created test records in production database using clearly marked names beginning with `ทดสอบระบบ`.
- One duplicate-address attempt initially returned `201` because the recipient name differed; the system's address fingerprint includes recipient name plus address fields. Retest with the same recipient name and same address returned `409 duplicate_address`.
- The staff full table page intentionally renders up to 100 rows for performance. CSV export from that page uses all rows that match current filters.

## Known Risks

- Thailand Post real-time tracking API integration is not active yet; current tracking URL opens Thailand Post by URL pattern.
- KEX import requires the file's receiver code field to contain the internal request number `MS...`; files with unrelated customer codes will import as not found.
- Production has test data from smoke tests. If needed, admin cleanup can remove those test records later.

