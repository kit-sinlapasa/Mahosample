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

## Full Test Case Run 2026-09-02 21:58 +07:00

ทดสอบตาม `docs/test-cases.md` ด้วย automated tests, live API smoke test และ live UI smoke test บน `http://maho.kitaith.com:18080`

| Test Case | Result | Evidence |
| --- | --- | --- |
| TC-PUB-001 | Passed | UI form submitted successfully; success card showed request `MS202609020020` |
| TC-PUB-002 | Passed | UI showed contact-channel validation message |
| TC-PUB-003 | Passed | Live API returned `422` for invalid phone |
| TC-PUB-004 | Passed | Live API returned `422` for invalid postal code |
| TC-PUB-005 | Passed | Live API returned `422` when PDPA consent was false |
| TC-PUB-006 | Passed | Live API returned `409 duplicate_phone` |
| TC-PUB-007 | Passed | Live API returned `409 duplicate_address` |
| TC-PUB-008 | Passed | Live API returned `409 duplicate_phone_and_address` |
| TC-TRK-001 | Passed | UI tracking lookup found tracking `JC090214555TH` |
| TC-TRK-002 | Passed | UI showed not-found message for missing tracking |
| TC-STF-001 | Passed | Staff login API returned `200` and issued token |
| TC-STF-002 | Passed | Admin API without token returned `401` |
| TC-STF-003 | Passed | Live API returned staff list; current total during API run was `17` |
| TC-STF-004 | Passed | Live API saved request status `approved` and notes |
| TC-STF-005 | Passed | Live API updated shipping to `shipped` and generated Tracking URL |
| TC-STF-006 | Passed | UI full table displayed all saved-data columns and opened detail drawer |
| TC-STF-007 | Passed | UI sorting button toggled successfully |
| TC-STF-008 | Passed | UI column filters worked for province/status and tracking |
| TC-STF-009 | Passed | UI shipped-date range filter accepted from/to dates |
| TC-STF-010 | Passed | UI registration-date range filter accepted from/to dates |
| TC-STF-011 | Passed | UI displayed 10 rows in current session, below the 100-row display limit |
| TC-STF-012 | Passed | UI rendered Tracking URL as clickable link to Thailand Post |
| TC-EXP-001 | Passed | Live API returned CSV `ImportRecipientBook_2026-09-02.csv` and included only blank-tracking ready item |
| TC-EXP-002 | Passed | UI full-table `Export CSV` button triggered export for filtered data |
| TC-IMP-001 | Passed | Live API import returned total `1`, success `1`, not found `0`, failed `0` |
| TC-IMP-002 | Passed | Automated integration test covers KEX XLSX import with `รหัสผู้รับ` mapped to internal request number |
| TC-ADM-001 | Passed | Live API deleted a temporary test record as admin; automated tests cover staff/admin permission boundary |

Additional verification:

- `pytest backend/tests -q --tb=short`: Passed, 32 tests
- `npm run build`: Passed

