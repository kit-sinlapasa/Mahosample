# Production Cleanup 2026-09-02

## Summary

แยกข้อมูลทดสอบใน production เพื่อไม่ให้ปนกับรายการใช้งานจริง โดยเลือกวิธีเปลี่ยนสถานะคำขอเป็น `cancelled` แทนการลบทิ้ง

เหตุผล:
- เก็บหลักฐานการทดสอบย้อนหลังได้
- ลดความเสี่ยงจากการลบข้อมูลผิด
- ทำให้ staff เห็นชัดว่ารายการเหล่านี้ไม่ใช่งานจริง

## Scope

ค้นหารายการที่:
- `full_name` ขึ้นต้นด้วย `ทดสอบระบบ`
- หรือ `recipient_name` ขึ้นต้นด้วย `ทดสอบระบบ`

## Result

- Total records at cleanup time: 20
- Matched test records: 11
- Updated records: 11
- New request status: `cancelled`
- Note added: `ข้อมูลทดสอบ - แยกออกจากงานจริง 2026-09-02`

## Updated Records

| Request No | Full Name | Previous Status | New Status |
| --- | --- | --- | --- |
| MS202609020020 | ทดสอบระบบ UI Success | shipped | cancelled |
| MS202609020019 | ทดสอบระบบ TC import | shipped | cancelled |
| MS202609020018 | ทดสอบระบบ TC export | packed | cancelled |
| MS202609020017 | ทดสอบระบบ TC addrbase | pending | cancelled |
| MS202609020016 | ทดสอบระบบ TC main | shipped | cancelled |
| MS202609020015 | ทดสอบระบบ import | shipped | cancelled |
| MS202609020014 | ทดสอบระบบ export | packed | cancelled |
| MS202609020013 | ทดสอบระบบ dup-address | pending | cancelled |
| MS202609020012 | ทดสอบระบบ main | shipped | cancelled |
| MS202609020011 | ทดสอบระบบ main | pending | cancelled |
| MS202609020009 | ทดสอบระบบครบวงจร 165908 | shipped | cancelled |

## Verification

ทุก update ได้ response status `200` จาก production API

