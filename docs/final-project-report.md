# Mahosample Final Project Report

## 1. Project Overview

Mahosample คือระบบเว็บแอปสำหรับกิจกรรมลงทะเบียนรับตัวอย่าง มะโฮ ลูกค้าสามารถกรอกแบบฟอร์มโดยไม่ต้อง login พนักงานสามารถตรวจสอบรายการ อัปเดตสถานะ จัดการเลข tracking export/import ข้อมูลขนส่ง และลูกค้าสามารถตรวจสถานะด้วยเลข tracking ได้

Live URL:
- Public form: `http://maho.kitaith.com:18080/`
- Tracking page: `http://maho.kitaith.com:18080/tracking`
- Staff dashboard: `http://maho.kitaith.com:18080/staff`
- Staff full table: `http://maho.kitaith.com:18080/staff/requests`

## 2. Requirements Specification

Requirements หลักอยู่ใน:
- `docs/srs.md`
- `docs/rtm.md`

สรุป requirement สำคัญ:
- ลงทะเบียนรับตัวอย่างโดยไม่ต้อง login
- ตรวจข้อมูลซ้ำจากเบอร์โทรศัพท์และที่อยู่จัดส่ง
- แจ้ง validation message ชัดเจน
- Dashboard พนักงาน
- ตารางข้อมูลเต็มพร้อม filter/sort/date range
- Export CSV สำหรับไปรษณีย์
- Import tracking จาก CSV และ KEX XLSX
- เช็คสถานะด้วยเลข tracking
- แยกสิทธิ์ staff/admin

## 3. Requirements Modeling

Use cases หลัก:
1. ลูกค้าลงทะเบียนรับตัวอย่าง
2. ลูกค้าเช็คสถานะด้วยเลข tracking
3. พนักงาน login และดูรายการ
4. พนักงานตรวจคำขอและบันทึกหมายเหตุ
5. พนักงานอัปเดตขนส่งและเลข tracking
6. พนักงาน export รายการที่ยังไม่มี tracking
7. พนักงาน import tracking กลับเข้าระบบ
8. Admin จัดการข้อมูล/บัญชีตามสิทธิ์

Traceability:
- ดู `docs/rtm.md`

## 4. Architecture And Design

Architecture details:
- ดู `docs/architecture.md`

Technology stack:
- Frontend: React 18, Vite, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, Pydantic
- Database: PostgreSQL 15
- Deployment: Docker Compose on Hostinger VPS
- CI/CD: GitHub Actions

## 5. Implementation

Repository structure:

```text
backend/   FastAPI application, models, schemas, routers, services, tests
frontend/  React Vite application
docs/      Requirements, test cases, reports, deployment and user guide
deploy/    Hostinger production deployment files
```

Key modules:
- `backend/app/routers/public_sample_requests.py`
- `backend/app/routers/admin_sample_requests.py`
- `backend/app/services/sample_request_service.py`
- `backend/app/services/tracking_import_service.py`
- `frontend/src/pages/public/App.jsx`
- `frontend/src/pages/public/TrackingPage.jsx`
- `frontend/src/pages/staff/StaffApp.jsx`
- `frontend/src/pages/staff/StaffRequestsPage.jsx`

## 6. Testing And Quality

Test evidence:
- `docs/test-cases.md`
- `docs/test-report-2026-09-02.md`

Latest verified results:
- Backend: `pytest backend/tests -q --tb=short` passed, 32 tests
- Frontend: `npm run build` passed
- Live API smoke test passed
- Live UI smoke test passed

## 7. CI/CD And Release

CI:
- GitHub Actions runs backend tests and frontend build on PR
- PRs are merged after checks pass

Deployment:
- Hostinger VPS
- Docker Compose stack: `mahosample`
- Health endpoint: `http://maho.kitaith.com:18080/api/health`

Deployment safety:
- Deploy script targets only Mahosample containers
- Existing Docker applications are not modified

## 8. Security And Responsible Design

Security controls:
- JWT authentication for staff/admin APIs
- Role-based access control
- Public tracking does not expose personal contact/address data
- Passwords are hashed
- Secrets are managed through environment variables
- No real secrets should be committed to repository

Privacy controls:
- PDPA consent required
- Data used for eligibility check, contact and shipping only
- Test data is marked and separated from real work

Responsible AI:
- ดู `docs/ai-usage-log.md`

## 9. Product Demo Evidence

Demo flow:
1. Open public registration page
2. Submit sample request
3. Confirm success card and internal request number
4. Login staff dashboard
5. Open full table and filter/sort records
6. Update request status and shipping tracking
7. Open tracking page and search by tracking number
8. Export CSV and import tracking file

## 10. Retrospective

What went well:
- Flow หลักครบตั้งแต่ลงทะเบียนถึง tracking
- CI และ test ช่วยจับ regression
- Hostinger VPS deploy สำเร็จหลัง Render free tier ติด quota

What went wrong:
- Render free tier ไม่รองรับ active database เพิ่ม
- Test data บางส่วนเข้า production ระหว่าง smoke test
- Real-time Thailand Post API ยังไม่ได้เชื่อม

What we learned:
- ควรแยก staging/production ตั้งแต่ต้น
- ควรทำ seed/test mode สำหรับ demo
- import/export ต้องตรวจ column mapping จากไฟล์จริงเสมอ

Improvements:
- เพิ่ม staging environment
- เพิ่มหน้า admin สำหรับ cleanup test data
- เชื่อม Thailand Post API จริง
- เพิ่ม audit log สำหรับ staff actions
- เพิ่ม pagination UI สำหรับข้อมูลมากกว่า 100 รายการ

## Appendix

- Staff guide: `docs/staff-user-guide.md`
- Test input data: `docs/test-input-data.md`
- Hostinger deploy guide: `docs/hostinger-vps-deploy.md`
- Project evidence checklist: `docs/project-evidence-checklist.md`

