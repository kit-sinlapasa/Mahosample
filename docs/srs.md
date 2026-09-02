# Software Requirements Specification: Mahosample

## 1. Project Overview

Mahosample เป็นเว็บแอปสำหรับจัดการกิจกรรมลงทะเบียนรับตัวอย่าง มะโฮ โดยให้ลูกค้าทั่วไปกรอกข้อมูลรับตัวอย่างฟรี เจ้าหน้าที่ตรวจสอบคำขอ จัดเตรียมข้อมูลส่งให้ขนส่ง นำเข้าเลข tracking กลับเข้าระบบ และให้ลูกค้าตรวจสอบสถานะพัสดุได้

## 2. Problem Statement

เดิมการรับข้อมูลลูกค้าจากช่องทางข้อความหรือโพสต์สาธารณะทำให้ข้อมูลกระจัดกระจาย ตรวจสอบซ้ำยาก เสี่ยงต่อข้อมูลส่วนบุคคลรั่วไหล และต้องคัดลอกข้อมูลเพื่อส่งต่อให้ระบบขนส่งด้วยมือ ระบบนี้จึงรวมขั้นตอนลงทะเบียน ตรวจสิทธิ์ จัดส่ง ติดตาม และ export/import ข้อมูลไว้ในเว็บเดียว

## 3. Goals

- ลดงานคัดลอกข้อมูลลูกค้าด้วยมือ
- ลดรายการลงทะเบียนซ้ำจากเบอร์โทรศัพท์หรือที่อยู่จัดส่ง
- ให้พนักงานเห็นรายการและสถานะทั้งหมดในตารางเดียว
- ส่งออกข้อมูลสำหรับขนส่งได้ในรูปแบบ CSV
- นำเข้าเลข tracking กลับเข้าระบบได้
- ให้ลูกค้าใช้เลข tracking ตรวจสถานะผ่านระบบหรือ Thailand Post link ได้

## 4. Stakeholders

| Stakeholder | Need | Responsibility |
| --- | --- | --- |
| ลูกค้าทั่วไป | ลงทะเบียนรับตัวอย่างและตรวจสถานะพัสดุ | กรอกข้อมูลจริงและยินยอมใช้ข้อมูล |
| พนักงาน | ตรวจรายการ อัปเดตสถานะ export/import tracking | ดูแลข้อมูลคำขอและการจัดส่ง |
| ผู้ดูแลระบบ | จัดการบัญชีและดูแลระบบ production | ควบคุมสิทธิ์ ความปลอดภัย และ deploy |
| ทีมพัฒนา | พัฒนา ทดสอบ และจัดทำหลักฐาน | ดูแล source code, tests, docs และ CI/CD |
| ผู้ให้บริการขนส่ง | รับข้อมูลผู้รับและคืนเลข tracking | จัดส่งพัสดุและให้สถานะ tracking |

## 5. User Roles

| Role | Description | Main Access |
| --- | --- | --- |
| Public User | ลูกค้าทั่วไป ไม่ต้อง login | Registration form, tracking page |
| Staff | พนักงานที่ login ได้ | Dashboard, table, export/import, update request/shipping |
| Admin | ผู้ดูแลระบบ | สิทธิ์ staff ทั้งหมด และจัดการบัญชี/ลบรายการ |

## 6. Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-001 | ระบบต้องให้ลูกค้าทั่วไปลงทะเบียนรับตัวอย่างโดยไม่ต้อง login | Must |
| FR-002 | ระบบต้องบันทึกชื่อ เบอร์โทร อีเมล LINE ID Facebook Messenger ช่วงอายุ ข้อมูลสุขภาพ ประสบการณ์กับ มะโฮ ที่อยู่ และ consent | Must |
| FR-003 | ระบบต้องบังคับกรอกช่องทางติดต่ออย่างน้อย 1 อย่างระหว่าง อีเมล LINE ID หรือ Facebook Messenger | Must |
| FR-004 | ระบบต้องบังคับ PDPA consent ก่อนส่งฟอร์ม | Must |
| FR-005 | ระบบต้อง generate เลขรายการภายในแบบไม่ซ้ำ รูปแบบ `MSYYYYMMDDNNNN` | Must |
| FR-006 | ระบบต้องตรวจรายการซ้ำจากเบอร์โทรศัพท์ | Must |
| FR-007 | ระบบต้องตรวจรายการซ้ำจากชื่อผู้รับและที่อยู่จัดส่ง | Must |
| FR-008 | ระบบต้องแจ้งข้อความซ้ำแบบระบุสาเหตุ เช่น เบอร์ซ้ำ ที่อยู่ซ้ำ หรือทั้งสองอย่าง | Must |
| FR-009 | ระบบต้องมีหน้า login พนักงาน | Must |
| FR-010 | ระบบต้องมี Dashboard พนักงานเพื่อดูรายการและอัปเดตงานเร็ว | Must |
| FR-011 | ระบบต้องมีหน้าตารางข้อมูลเต็ม แสดงข้อมูลที่บันทึกไว้ทั้งหมด | Must |
| FR-012 | ระบบต้องให้พนักงาน filter และ sort ข้อมูลจาก header ตารางได้ | Must |
| FR-013 | ระบบต้องให้ filter วันที่ส่งและวันที่ลงทะเบียนแบบกำหนดช่วงเวลาได้ | Must |
| FR-014 | ระบบต้องแสดงตารางครั้งละไม่เกิน 100 รายการเพื่อความรวดเร็ว | Should |
| FR-015 | ระบบต้องให้ export CSV จากตารางเต็มตาม filter ทั้งหมด ไม่จำกัด 100 แถวที่แสดง | Must |
| FR-016 | ระบบต้อง export CSV สำหรับไปรษณีย์ โดยเลือกเฉพาะรายการที่ tracking ว่าง | Must |
| FR-017 | ไฟล์ export สำหรับไปรษณีย์ต้องตั้งชื่อ `ImportRecipientBook_yyyy-mm-dd.csv` | Must |
| FR-018 | ระบบต้อง import tracking จาก CSV ได้ โดยจับคู่จากเลขรายการภายใน | Must |
| FR-019 | ระบบต้อง import tracking จาก KEX XLSX ได้ โดยอ่าน `รหัสผู้รับ` และ `เลขนำส่งพัสดุ` | Should |
| FR-020 | ระบบต้องให้ลูกค้าเช็คสถานะด้วยเลข tracking ได้ | Must |
| FR-021 | ระบบต้องสร้าง Tracking URL ไป Thailand Post เมื่อมีเลข tracking | Must |
| FR-022 | ระบบต้องให้ Admin ลบรายการหรือจัดการบัญชีได้ตามสิทธิ์ | Should |

## 7. Non-Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| NFR-001 | ระบบต้องป้องกัน endpoint พนักงานด้วย JWT authentication | Must |
| NFR-002 | ระบบต้องจำกัดสิทธิ์ staff/admin ตามหน้าที่ | Must |
| NFR-003 | ระบบต้องไม่แสดงข้อมูลส่วนบุคคลใน public tracking response | Must |
| NFR-004 | ระบบต้องทำงานบน Docker Compose ได้โดยไม่กระทบ Docker applications อื่นบน VPS | Must |
| NFR-005 | ระบบต้องมี automated tests และ CI สำหรับ backend/frontend | Must |
| NFR-006 | UI ต้องใช้งานง่ายบน desktop และรองรับ mobile เบื้องต้น | Should |
| NFR-007 | ข้อมูล export ต้องรองรับภาษาไทยและเปิดใน spreadsheet ได้ | Must |
| NFR-008 | ระบบต้องจัดการ secret ผ่าน environment variable ไม่ commit ลง repository | Must |
| NFR-009 | ตารางพนักงานต้องตอบสนองเร็วเมื่อมีข้อมูลจำนวนมาก โดยจำกัดการ render | Should |
| NFR-010 | เอกสารต้อง trace กลับไป requirement, test และ evidence ได้ | Should |

## 8. User Stories And Acceptance Criteria

| ID | User Story | Acceptance Criteria |
| --- | --- | --- |
| US-001 | As a customer, I want to submit a sample request so that I can receive MAHO samples. | Given form data is valid, when submitting, then the system creates a request number and shows success card. |
| US-002 | As a customer, I want clear validation messages so that I know what to fix. | Given required data is missing or invalid, when submitting, then the system shows specific messages. |
| US-003 | As a customer, I want duplicate registration blocked so that activity rights remain fair. | Given phone or address already exists, when submitting, then the system rejects and explains the duplicated field. |
| US-004 | As a customer, I want to check tracking by tracking number so that I can follow my parcel. | Given tracking exists, when searching, then the system shows request and shipping statuses plus Thailand Post link. |
| US-005 | As a staff member, I want to login so that only authorized staff can access customer records. | Given correct credentials, when logging in, then the dashboard loads. |
| US-006 | As a staff member, I want to see all request data in a table so that I can review and process items. | Given staff is logged in, when opening full table, then all saved fields are visible. |
| US-007 | As a staff member, I want to filter and sort table columns so that I can find records quickly. | Given data exists, when applying filters or sort, then visible results update correctly. |
| US-008 | As a staff member, I want date range filters so that I can review registrations or shipments by period. | Given date filters are set, when filtering, then matching records in the date range are shown. |
| US-009 | As a staff member, I want to export ready-to-ship records so that I can upload them to a shipping system. | Given ready records with blank tracking, when exporting, then CSV includes only those records. |
| US-010 | As a staff member, I want to import tracking results so that records are updated after shipment. | Given a valid import file, when importing, then matching request numbers receive tracking numbers. |
| US-011 | As a staff member, I want clickable Tracking URLs so that I can quickly open Thailand Post tracking. | Given tracking URL exists, when viewing the table or detail, then URL is a clickable link. |
| US-012 | As an admin, I want permission control so that staff cannot perform admin-only actions. | Given staff token, when trying admin-only user creation, then the system returns forbidden. |

## 9. Assumptions

- ลูกค้าได้รับเลข tracking ผ่าน LINE ID หรือ Facebook Messenger จากพนักงานนอกระบบก่อน
- ระบบยังไม่ได้เชื่อม Thailand Post real-time API โดยตรง จึงใช้ URL tracking ของ Thailand Post
- ข้อมูล import จาก KEX ต้องใส่เลขรายการภายใน `MS...` ในช่อง `รหัสผู้รับ`
- production ตอนนี้ใช้ Hostinger VPS และ Docker Compose

## 10. Constraints

- Render free tier ไม่เพียงพอสำหรับ database จึงย้าย production ไป Hostinger VPS
- ต้องไม่กระทบ Docker applications อื่นที่รันอยู่บน VPS
- ข้อมูลส่วนบุคคลต้องใช้เท่าที่จำเป็นและไม่ใส่ลง prompt AI/เอกสารสาธารณะ

