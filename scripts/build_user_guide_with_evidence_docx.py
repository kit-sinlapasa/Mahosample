from __future__ import annotations

import json
from pathlib import Path

from build_final_docx import (
    add_markdown_file,
    add_page_number,
    add_screenshot_appendix,
    set_run_font,
    set_table_width,
    setup_styles,
)
from build_test_evidence_docx import add_results_table, latest_json
from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches, Pt


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUTPUT = DOCS / "Mahosample-user-guide-with-test-cases-and-screenshots.docx"


def setup_user_guide_styles(doc):
    setup_styles(doc)
    section = doc.sections[0]
    footer = section.footer.paragraphs[0]
    footer.clear()
    set_run_font(footer.add_run("Mahosample User Guide | Page "), size=9, color="666666")
    add_page_number(footer)


def add_cover(doc):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run("Mahosample")
    set_run_font(r, size=28, bold=True, color="0B2545")

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("User Guide And Test Evidence")
    set_run_font(r, size=18, color="2E74B5")

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("คู่มือการใช้งานฝั่งลูกค้าและพนักงาน พร้อม Test Cases และภาพหน้าจอประกอบ")
    set_run_font(r, size=14, color="333333")

    doc.add_paragraph()
    table = doc.add_table(rows=6, cols=2)
    set_table_width(table, [1.9, 4.5])
    rows = [
        ("Project", "Mahosample"),
        ("Document", "User Guide With Test Cases And Screen Capture Evidence"),
        ("Public URL", "http://maho.kitaith.com:18080/"),
        ("Staff URL", "http://maho.kitaith.com:18080/staff"),
        ("Tracking URL", "http://maho.kitaith.com:18080/tracking"),
        ("Date", "2026-09-03"),
    ]
    for row, (label, value) in zip(table.rows, rows):
        row.cells[0].text = label
        row.cells[1].text = value
        for cell in row.cells:
            for paragraph in cell.paragraphs:
                for run in paragraph.runs:
                    set_run_font(run, size=10.5, bold=(cell is row.cells[0]))

    doc.add_page_break()


def add_overview(doc):
    doc.add_paragraph("ภาพรวมเอกสาร", style="Heading 1")
    intro = [
        "เอกสารฉบับนี้แยกมาจากส่วนคู่มือและหลักฐานทดสอบของ Mahosample-final-project-report.docx เพื่อใช้เป็นคู่มือปฏิบัติงานและหลักฐานการใช้งานระบบโดยตรง",
        "เนื้อหาครอบคลุมฝั่งลูกค้าทั่วไป ฝั่งพนักงาน รายการ Test Cases ทั้งหมด และภาพหน้าจอจาก production environment",
    ]
    for text in intro:
        p = doc.add_paragraph()
        r = p.add_run(text)
        set_run_font(r)

    table = doc.add_table(rows=1, cols=3)
    table.style = "Table Grid"
    set_table_width(table, [1.6, 3.0, 1.8])
    headers = ["ส่วน", "เนื้อหา", "ผู้ใช้หลัก"]
    for cell, header in zip(table.rows[0].cells, headers):
        cell.text = header
    rows = [
        ("Customer Guide", "ขั้นตอนลงทะเบียนและเช็คสถานะ tracking", "ลูกค้าทั่วไป"),
        ("Staff Guide", "Dashboard, full table, บันทึกคำขอ, อัปเดตขนส่ง, import/export", "พนักงาน"),
        ("Test Cases", "กรณีทดสอบทุก flow หลัก", "ทีมตรวจรับ/ทีมพัฒนา"),
        ("Screen Capture Evidence", "ภาพหน้าจอประกอบการทำงานจริงบน production", "ทีมตรวจรับ"),
    ]
    for values in rows:
        row = table.add_row().cells
        for cell, value in zip(row, values):
            cell.text = value
    for row in table.rows:
        for cell in row.cells:
            for paragraph in cell.paragraphs:
                for run in paragraph.runs:
                    set_run_font(run, size=9.5, bold=(row is table.rows[0]))


def add_test_summary(doc):
    result_file = latest_json()
    result = json.loads(result_file.read_text(encoding="utf-8"))
    doc.add_section(WD_SECTION.NEW_PAGE)
    doc.add_paragraph("สรุปผลการทดสอบ", style="Heading 1")
    p = doc.add_paragraph()
    set_run_font(
        p.add_run(
            f'Live E2E run {result["run_id"]}: ผ่าน {result["passed"]}/{result["total"]} เคส, failed {result["failed"]} เคส',
        ),
    )
    add_results_table(doc, result["results"])


def main():
    doc = Document()
    setup_user_guide_styles(doc)
    add_cover(doc)
    add_overview(doc)
    add_markdown_file(doc, "คู่มือฝั่งลูกค้า", DOCS / "public-user-guide.md")
    add_markdown_file(doc, "คู่มือฝั่งพนักงาน", DOCS / "staff-user-guide.md")
    add_markdown_file(doc, "Test Cases ทั้งหมด", DOCS / "test-cases.md")
    add_test_summary(doc)
    add_screenshot_appendix(doc)
    doc.core_properties.title = "Mahosample User Guide With Test Cases And Screenshots"
    doc.core_properties.subject = "คู่มือการใช้งานฝั่งลูกค้าและพนักงาน พร้อม Test Cases และภาพหน้าจอ"
    doc.core_properties.author = "Mahosample Project Team"
    doc.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    main()
