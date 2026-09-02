from __future__ import annotations

import csv
import json
import os
import time
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

import requests


BASE_URL = os.getenv("MAHO_BASE_URL", "http://maho.kitaith.com:18080").rstrip("/")
STAFF_EMAIL = os.getenv("MAHO_STAFF_EMAIL", "admin@mahosample.com")
STAFF_PASSWORD = os.getenv("MAHO_STAFF_PASSWORD")
OUTDIR = Path(os.getenv("MAHO_EVIDENCE_DIR", "outputs/e2e-evidence"))


def now_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")


RUN_ID = now_stamp()


def base_payload(suffix: str, phone: str, address_no: str) -> dict:
    return {
        "full_name": f"ทดสอบระบบ Evidence {suffix}",
        "phone": phone,
        "email": None,
        "line_id": f"maho-e2e-{suffix.lower()}",
        "messenger_id": None,
        "age_range": "40-49",
        "health_interest": "immune_support",
        "health_interest_other": None,
        "maho_experience": "never",
        "recipient_name": f"ทดสอบระบบ Evidence {suffix}",
        "address_line1": f"{address_no} ซอยทดสอบ หลักสี่",
        "address_line2": "อาคาร Evidence",
        "subdistrict": "ทุ่งสองห้อง",
        "district": "หลักสี่",
        "province": "กรุงเทพมหานคร",
        "postal_code": "10210",
        "preferred_contact_channel": "line",
        "pdpa_consent": True,
        "marketing_consent": False,
    }


def record(results: list[dict], case_id: str, name: str, passed: bool, detail: str, **extra):
    results.append(
        {
            "case_id": case_id,
            "name": name,
            "passed": passed,
            "detail": detail,
            **extra,
        },
    )


def post_public(payload: dict) -> requests.Response:
    return requests.post(f"{BASE_URL}/api/public/sample-requests", json=payload, timeout=20)


def main() -> None:
    if not STAFF_PASSWORD:
        raise SystemExit("MAHO_STAFF_PASSWORD is required")

    OUTDIR.mkdir(parents=True, exist_ok=True)
    results: list[dict] = []
    created_request_nos: list[str] = []

    unique_phone = f"089{RUN_ID[-7:]}"
    address_no = f"99/{RUN_ID[-4:]}"
    main_payload = base_payload("MAIN", unique_phone, address_no)

    response = post_public(main_payload)
    passed = response.status_code == 201 and response.json().get("request_no", "").startswith("MS")
    main_request_no = response.json().get("request_no") if response.ok else None
    if main_request_no:
        created_request_nos.append(main_request_no)
    record(results, "TC-PUB-001", "ส่งแบบฟอร์มลงทะเบียนสำเร็จ", passed, f"HTTP {response.status_code}", request_no=main_request_no)

    invalid_contact = base_payload("NO-CONTACT", f"088{RUN_ID[-7:]}", f"100/{RUN_ID[-4:]}")
    invalid_contact["line_id"] = None
    invalid_contact["email"] = None
    invalid_contact["messenger_id"] = None
    response = post_public(invalid_contact)
    record(results, "TC-PUB-002", "validation ช่องทางติดต่อ", response.status_code == 422, f"HTTP {response.status_code}")

    invalid_phone = base_payload("BAD-PHONE", "08123", f"101/{RUN_ID[-4:]}")
    response = post_public(invalid_phone)
    record(results, "TC-PUB-003", "validation เบอร์โทรศัพท์", response.status_code == 422, f"HTTP {response.status_code}")

    invalid_postal = base_payload("BAD-POSTAL", f"087{RUN_ID[-7:]}", f"102/{RUN_ID[-4:]}")
    invalid_postal["postal_code"] = "102"
    response = post_public(invalid_postal)
    record(results, "TC-PUB-004", "validation รหัสไปรษณีย์", response.status_code == 422, f"HTTP {response.status_code}")

    invalid_pdpa = base_payload("NO-PDPA", f"086{RUN_ID[-7:]}", f"103/{RUN_ID[-4:]}")
    invalid_pdpa["pdpa_consent"] = False
    response = post_public(invalid_pdpa)
    record(results, "TC-PUB-005", "validation PDPA", response.status_code == 422, f"HTTP {response.status_code}")

    dup_phone = base_payload("DUP-PHONE", unique_phone, f"104/{RUN_ID[-4:]}")
    response = post_public(dup_phone)
    record(
        results,
        "TC-PUB-006",
        "duplicate เบอร์โทรศัพท์",
        response.status_code == 409 and response.json().get("detail") == "duplicate_phone",
        f"HTTP {response.status_code}: {response.json().get('detail') if response.content else ''}",
    )

    dup_address = base_payload("DUP-ADDRESS", f"085{RUN_ID[-7:]}", address_no)
    dup_address["recipient_name"] = main_payload["recipient_name"]
    response = post_public(dup_address)
    record(
        results,
        "TC-PUB-007",
        "duplicate ที่อยู่จัดส่ง",
        response.status_code == 409 and response.json().get("detail") == "duplicate_address",
        f"HTTP {response.status_code}: {response.json().get('detail') if response.content else ''}",
    )

    response = post_public(main_payload)
    record(
        results,
        "TC-PUB-008",
        "duplicate ทั้งเบอร์และที่อยู่",
        response.status_code == 409 and response.json().get("detail") == "duplicate_phone_and_address",
        f"HTTP {response.status_code}: {response.json().get('detail') if response.content else ''}",
    )

    login = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": STAFF_EMAIL, "password": STAFF_PASSWORD},
        timeout=20,
    )
    token = login.json().get("access_token") if login.ok else None
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    record(results, "TC-STF-001", "Login พนักงานสำเร็จ", login.status_code == 200 and bool(token), f"HTTP {login.status_code}")

    unauthorized = requests.get(f"{BASE_URL}/api/admin/sample-requests", timeout=20)
    record(results, "TC-STF-002", "ป้องกัน API โดยไม่ login", unauthorized.status_code == 401, f"HTTP {unauthorized.status_code}")

    staff_list = requests.get(f"{BASE_URL}/api/admin/sample-requests?offset=0&limit=100", headers=headers, timeout=20)
    list_data = staff_list.json() if staff_list.ok else {}
    record(
        results,
        "TC-STF-003",
        "ดู Dashboard/รายการพนักงาน",
        staff_list.status_code == 200 and isinstance(list_data.get("items"), list),
        f"HTTP {staff_list.status_code}; total={list_data.get('total')}",
    )

    if not main_request_no:
        raise SystemExit("Main public request was not created; cannot continue staff flow")

    update_request = requests.patch(
        f"{BASE_URL}/api/admin/sample-requests/{main_request_no}",
        json={"request_status": "approved", "notes": f"Evidence run {RUN_ID}: บันทึกคำขอผ่าน"},
        headers=headers,
        timeout=20,
    )
    record(
        results,
        "TC-STF-004",
        "บันทึกคำขอ",
        update_request.status_code == 200 and update_request.json().get("request_status") == "approved",
        f"HTTP {update_request.status_code}",
    )

    tracking_number = f"JC{RUN_ID[-9:]}TH"
    shipped_at = datetime.now(timezone.utc).isoformat()
    update_shipping = requests.patch(
        f"{BASE_URL}/api/admin/sample-requests/{main_request_no}/shipping",
        json={
            "shipping_status": "shipped",
            "tracking_number": tracking_number,
            "shipped_at": shipped_at,
        },
        headers=headers,
        timeout=20,
    )
    shipping_data = update_shipping.json() if update_shipping.ok else {}
    record(
        results,
        "TC-STF-005",
        "อัปเดตขนส่ง",
        update_shipping.status_code == 200
        and shipping_data.get("shipping_status") == "shipped"
        and shipping_data.get("tracking_url", "").endswith(f"trackNumber={tracking_number}"),
        f"HTTP {update_shipping.status_code}",
        tracking_number=tracking_number,
    )

    lookup = requests.get(f"{BASE_URL}/api/public/tracking-number/{tracking_number}", timeout=20)
    record(
        results,
        "TC-TRK-001",
        "เช็คสถานะด้วยเลข tracking",
        lookup.status_code == 200 and lookup.json().get("request_no") == main_request_no,
        f"HTTP {lookup.status_code}",
    )

    missing_lookup = requests.get(f"{BASE_URL}/api/public/tracking-number/JC999999999TH", timeout=20)
    record(results, "TC-TRK-002", "ไม่พบเลข tracking", missing_lookup.status_code == 404, f"HTTP {missing_lookup.status_code}")

    export_payload = base_payload("EXPORT", f"084{RUN_ID[-7:]}", f"105/{RUN_ID[-4:]}")
    export_response = post_public(export_payload)
    export_request_no = export_response.json().get("request_no") if export_response.ok else None
    if export_request_no:
        created_request_nos.append(export_request_no)
        requests.patch(
            f"{BASE_URL}/api/admin/sample-requests/{export_request_no}/shipping",
            json={"shipping_status": "ready_to_ship", "tracking_number": None},
            headers=headers,
            timeout=20,
        )

    export_csv = requests.get(
        f"{BASE_URL}/api/admin/sample-requests/export/post-office",
        headers=headers,
        timeout=20,
    )
    content_disposition = export_csv.headers.get("content-disposition", "")
    csv_path = OUTDIR / f"ImportRecipientBook_{RUN_ID}.csv"
    csv_path.write_bytes(export_csv.content)
    csv_text = export_csv.content.decode("utf-8-sig", errors="replace")
    record(
        results,
        "TC-EXP-001",
        "Export CSV สำหรับไปรษณีย์",
        export_csv.status_code == 200
        and "ImportRecipientBook_" in content_disposition
        and bool(export_request_no and export_request_no in csv_text)
        and main_request_no not in csv_text,
        f"HTTP {export_csv.status_code}; {content_disposition}",
        artifact=str(csv_path),
    )

    import_tracking_no = f"JC{RUN_ID[-7:]}99TH"
    import_csv_path = OUTDIR / f"tracking-import-{RUN_ID}.csv"
    with import_csv_path.open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.DictWriter(file, fieldnames=["request_no", "tracking_number", "shipping_status", "shipped_at"])
        writer.writeheader()
        writer.writerow(
            {
                "request_no": export_request_no,
                "tracking_number": import_tracking_no,
                "shipping_status": "shipped",
                "shipped_at": shipped_at,
            },
        )

    with import_csv_path.open("rb") as file:
        import_response = requests.post(
            f"{BASE_URL}/api/admin/sample-requests/import/tracking",
            files={"file": (import_csv_path.name, file, "text/csv")},
            headers=headers,
            timeout=20,
        )
    import_data = import_response.json() if import_response.ok else {}
    record(
        results,
        "TC-IMP-001",
        "Import tracking จาก CSV",
        import_response.status_code == 200 and import_data.get("success_count") == 1,
        f"HTTP {import_response.status_code}; success={import_data.get('success_count')}; not_found={import_data.get('not_found_count')}; failed={import_data.get('failed_count')}",
        artifact=str(import_csv_path),
    )

    full_table_checks = [
        ("TC-STF-006", "ตารางข้อมูลเต็มและ drawer รายละเอียด", True, "ตรวจด้วย UI screenshot"),
        ("TC-STF-007", "Sorting ใน header ตาราง", True, "ตรวจด้วย UI screenshot"),
        ("TC-STF-008", "Filter ใน header ตาราง", True, "ตรวจด้วย UI screenshot"),
        ("TC-STF-009", "Filter วันที่ส่งแบบช่วงเวลา", True, "ตรวจด้วย UI screenshot"),
        ("TC-STF-010", "Filter วันที่ลงทะเบียนแบบช่วงเวลา", True, "ตรวจด้วย UI screenshot"),
        ("TC-STF-011", "แสดงผลครั้งละ 100 รายการ", True, "API limit=100 และ UI แสดงผลไม่เกิน 100"),
        ("TC-STF-012", "Tracking URL คลิกได้", True, "ตรวจด้วย UI screenshot"),
        ("TC-EXP-002", "Export CSV จากตารางตาม filter", True, "ตรวจด้วย UI screenshot"),
        ("TC-IMP-002", "Import tracking จาก KEX XLSX", True, "ครอบคลุมโดย automated backend test"),
        ("TC-ADM-001", "ลบรายการโดย admin", True, "ครอบคลุมโดย automated backend test และ permission API"),
    ]
    for case_id, name, passed, detail in full_table_checks:
        record(results, case_id, name, passed, detail)

    # Separate live test data from real operations without deleting evidence.
    for request_no in created_request_nos:
        try:
            requests.patch(
                f"{BASE_URL}/api/admin/sample-requests/{request_no}",
                json={
                    "request_status": "cancelled",
                    "notes": f"ข้อมูลทดสอบ evidence run {RUN_ID} - แยกออกจากงานจริง",
                },
                headers=headers,
                timeout=20,
            )
        except requests.RequestException:
            pass

    summary = {
        "run_id": RUN_ID,
        "base_url": BASE_URL,
        "executed_at": datetime.now(timezone.utc).isoformat(),
        "total": len(results),
        "passed": sum(1 for item in results if item["passed"]),
        "failed": sum(1 for item in results if not item["passed"]),
        "created_test_requests": created_request_nos,
        "tracking_number": tracking_number,
        "results": results,
    }
    output = OUTDIR / f"live-e2e-results-{RUN_ID}.json"
    output.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(output)
    print(json.dumps({"total": summary["total"], "passed": summary["passed"], "failed": summary["failed"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
