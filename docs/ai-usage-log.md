# AI Usage Log

บันทึกนี้ใช้เปิดเผยการใช้ AI ในงาน Mahosample ตามแนวทาง responsible AI usage disclosure

## AI Usage Summary

| Date | Tool / Model | Task | Prompt / Context Summary | Output Used | Human Verification | Final Decision |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-09-02 | Codex | Requirement clarification | ผู้ใช้ให้ requirement ระบบลงทะเบียนรับตัวอย่าง ติดตามขนส่ง dashboard export/import | สรุป requirement และคำถาม clarification | ผู้ใช้ตอบ flow tracking, export/import, deploy target | Accepted |
| 2026-09-02 | Codex | Implementation planning | ออกแบบ stack และโครงสร้าง React/FastAPI/PostgreSQL | โครงสร้าง project, API, DB model, frontend flow | ทดสอบ local และ CI | Accepted |
| 2026-09-02 | Codex | Public registration UI | สร้างและปรับหน้า "ลงทะเบียนรับตัวอย่าง มะโฮ" | React form, validation messages, success card | UI/browser smoke test | Accepted |
| 2026-09-02 | Codex | Staff dashboard | สร้าง dashboard พนักงานและ full table | Staff UI, filter/sort, date range, detail drawer | UI smoke test and backend tests | Accepted |
| 2026-09-02 | Codex | Export/import | สร้าง CSV export และ tracking import CSV/KEX XLSX | Backend services and tests | Integration tests and live API smoke | Accepted |
| 2026-09-02 | Codex | Deployment support | ย้าย deploy จาก Render ไป Hostinger VPS เพราะ free tier database quota | Docker Compose deploy docs/scripts | User confirmed deploy; health check passed | Accepted |
| 2026-09-02 | Codex | Test documentation | สร้าง test cases, test report และ staff guide | Markdown documents in `docs/` | Local tests, CI, live smoke test | Accepted |
| 2026-09-02 | Codex | Production test data cleanup | แยกรายการทดสอบที่ชื่อขึ้นต้น `ทดสอบระบบ` | อัปเดตสถานะคำขอเป็น `cancelled` | Live API response status `200` | Accepted |

## Scope Of AI Use

AI ถูกใช้ช่วยในงานต่อไปนี้:
- Requirements
- Architecture
- Code implementation
- Test case design
- Debugging
- Documentation
- Deployment guidance
- Test data generation

## Human Verification

ทุก output ที่นำไปใช้ผ่านการตรวจด้วยอย่างน้อยหนึ่งวิธี:
- Automated backend integration tests
- Frontend build
- GitHub Actions CI
- Live API smoke test
- Live UI smoke test
- User review ผ่านหน้าเว็บจริง

## Data Handling

แนวทางที่ใช้:
- ไม่ใส่ข้อมูลลูกค้าจริงลงเอกสาร test
- ใช้ข้อมูลจำลองที่ขึ้นต้น `ทดสอบระบบ`
- ไม่ commit password, token, API key หรือ secret ลง repository
- เอกสารคู่มือไม่ระบุรหัสผ่าน production
- ข้อมูลทดสอบใน production ถูกแยกด้วยสถานะ `cancelled`

## AI Limitations And Controls

- AI suggestions ต้องตรวจด้วย tests ก่อน merge
- งาน deploy ใช้ user confirmation ก่อนสั่งคำสั่งบน Hostinger Web Terminal
- การเชื่อม Thailand Post real-time API ยังไม่ได้ทำ จึงระบุเป็น known risk
- การ import KEX XLSX ต้องยืนยัน mapping column จากไฟล์ตัวอย่างและ test

