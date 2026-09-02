# Requirements Traceability Matrix

RTM นี้เชื่อม requirement กับ flow, design/code, test case และหลักฐานทดสอบ

| Requirement | Use Case / Flow | Design / Module | Test Case | Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| FR-001 | Public registration | `frontend/src/pages/public/App.jsx`, `backend/app/routers/public_sample_requests.py` | TC-PUB-001 | `docs/test-report-2026-09-02.md` | Done |
| FR-002 | Save registration data | `SampleRequestCreate`, `SampleRequest` | TC-PUB-001, TC-STF-006 | Backend 32 tests, UI smoke | Done |
| FR-003 | Contact channel validation | `SampleRequestCreate.validate_business_rules`, public form validation | TC-PUB-002 | API/UI smoke | Done |
| FR-004 | PDPA consent validation | `SampleRequestCreate.validate_business_rules` | TC-PUB-005 | API smoke | Done |
| FR-005 | Generate internal request number | `generate_request_no` | TC-PUB-001 | Request `MS202609020020` | Done |
| FR-006 | Duplicate phone check | `create_public_sample_request` | TC-PUB-006 | `409 duplicate_phone` | Done |
| FR-007 | Duplicate address check | `build_address_fingerprint`, `create_public_sample_request` | TC-PUB-007 | `409 duplicate_address` | Done |
| FR-008 | Specific duplicate message | public API detail + frontend message mapping | TC-PUB-006, TC-PUB-007, TC-PUB-008 | API smoke | Done |
| FR-009 | Staff login | `backend/app/routers/auth.py`, staff login UI | TC-STF-001 | Login API `200` | Done |
| FR-010 | Staff dashboard | `frontend/src/pages/staff/StaffApp.jsx`, dashboard API | TC-STF-003 | API/UI smoke | Done |
| FR-011 | Full staff table | `frontend/src/pages/staff/StaffRequestsPage.jsx` | TC-STF-006 | UI smoke | Done |
| FR-012 | Header filter/sorting | `StaffRequestsPage.jsx` filter/sort state | TC-STF-007, TC-STF-008 | UI smoke | Done |
| FR-013 | Date range filtering | `isInDateRange`, date range inputs | TC-STF-009, TC-STF-010 | UI smoke | Done |
| FR-014 | Display 100 rows | `displayLimit = 100`, `displayedRequests` | TC-STF-011 | UI smoke | Done |
| FR-015 | Full table CSV export by filter | `exportVisibleCsv` uses `filteredRequests` | TC-EXP-002 | UI smoke | Done |
| FR-016 | Post office export blank tracking | `list_requests_without_tracking`, export router | TC-EXP-001 | API smoke, integration test | Done |
| FR-017 | Export filename format | `export_post_office_csv` | TC-EXP-001 | `ImportRecipientBook_2026-09-02.csv` | Done |
| FR-018 | Import CSV tracking | `tracking_import_service.import_tracking_csv` | TC-IMP-001 | API smoke, integration test | Done |
| FR-019 | Import KEX XLSX tracking | `parse_kex_xlsx_rows` | TC-IMP-002 | Integration test | Done |
| FR-020 | Public tracking by tracking number | `read_tracking_by_tracking_number`, `TrackingPage.jsx` | TC-TRK-001, TC-TRK-002 | API/UI smoke | Done |
| FR-021 | Thailand Post Tracking URL | `build_tracking_url`, clickable link renderer | TC-STF-012, TC-TRK-001 | UI smoke | Done |
| FR-022 | Admin delete/user permission | `require_admin_user`, users/admin routers | TC-ADM-001 | API smoke, permission tests | Done |
| NFR-001 | JWT auth for staff APIs | `deps.py`, auth service | TC-STF-002 | `401 Unauthorized` | Done |
| NFR-002 | Role-based access | `require_admin_user`, `require_staff_user` | TC-ADM-001 | Integration tests | Done |
| NFR-003 | Hide personal data from public tracking | `SampleRequestTrackingRead` | TC-TRK-001 | Integration test | Done |
| NFR-004 | Docker isolation on VPS | Hostinger compose stack `mahosample` | Deployment verification | Deploy logs, health check | Done |
| NFR-005 | CI checks | GitHub Actions | Automated test suite | PR checks passed | Done |
| NFR-006 | Usable UI | React pages + responsive CSS | UI smoke | Manual/browser verification | Done |
| NFR-007 | Thai CSV support | BOM CSV export | TC-EXP-001, TC-EXP-002 | Export tests | Done |
| NFR-008 | Secret handling | env vars, no committed secrets | Security review | Repo review | Done |
| NFR-009 | Table performance | display limit and paged API loading | TC-STF-011 | UI smoke | Done |
| NFR-010 | Documentation traceability | `docs/` evidence set | Report review | Current docs package | Done |

