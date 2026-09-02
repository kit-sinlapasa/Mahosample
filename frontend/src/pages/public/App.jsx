import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { apiClient } from "../../api/client";

const initialForm = {
  full_name: "",
  phone: "",
  email: "",
  line_id: "",
  messenger_id: "",
  age_range: "30-39",
  health_interest: "immune_support",
  health_interest_other: "",
  maho_experience: "never",
  recipient_name: "",
  address_line1: "",
  address_line2: "",
  subdistrict: "",
  district: "",
  province: "",
  postal_code: "",
  preferred_contact_channel: "line",
  pdpa_consent: false,
  marketing_consent: false,
};

const ageRanges = [
  ["under_30", "ต่ำกว่า 30 ปี"],
  ["30-39", "30-39 ปี"],
  ["40-49", "40-49 ปี"],
  ["50-59", "50-59 ปี"],
  ["60_plus", "60 ปีขึ้นไป"],
];

const healthInterests = [
  ["immune_support", "การดูแลภูมิคุ้มกัน"],
  ["gut_health", "สุขภาพลำไส้และระบบขับถ่าย"],
  ["recovery", "การพักผ่อนและการฟื้นตัว"],
  ["senior_health", "สุขภาพผู้สูงอายุ"],
  ["general_health", "การดูแลสุขภาพทั่วไป"],
  ["other", "อื่น ๆ"],
];

const experiences = [
  ["never", "ไม่เคย"],
  ["used", "เคยรับประทาน"],
  ["received_sample", "เคยได้รับตัวอย่าง"],
];

function TextField({ label, name, value, onChange, required = false, type = "text" }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        name={name}
        onChange={onChange}
        required={required}
        type={type}
        value={value}
      />
    </label>
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select name={name} onChange={onChange} value={value}>
        {options.map(([optionValue, labelText]) => (
          <option key={optionValue} value={optionValue}>
            {labelText}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function App() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [createdRequest, setCreatedRequest] = useState(null);
  const [formError, setFormError] = useState("");
  const [trackingNo, setTrackingNo] = useState("");
  const [tracking, setTracking] = useState(null);
  const [trackingError, setTrackingError] = useState("");

  const canSubmit = useMemo(
    () => form.pdpa_consent && !submitting,
    [form.pdpa_consent, submitting],
  );

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "full_name" && !current.recipient_name ? { recipient_name: value } : {}),
    }));
  }

  async function submitForm(event) {
    event.preventDefault();
    setSubmitting(true);
    setFormError("");
    setCreatedRequest(null);
    try {
      const payload = {
        ...form,
        address_line2: form.address_line2 || null,
        email: form.email || null,
        health_interest_other: form.health_interest_other || null,
        line_id: form.line_id || null,
        messenger_id: form.messenger_id || null,
      };
      const response = await apiClient.post("/api/public/sample-requests", payload);
      setCreatedRequest(response.data);
      setTrackingNo(response.data.request_no);
      setForm(initialForm);
    } catch (error) {
      setFormError(
        error.response?.status === 409
          ? "ข้อมูลนี้เคยลงทะเบียนแล้ว กรุณาติดต่อเจ้าหน้าที่"
          : "ส่งแบบฟอร์มไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function checkTracking(event) {
    event.preventDefault();
    setTracking(null);
    setTrackingError("");
    try {
      const response = await apiClient.get(`/api/public/tracking/${trackingNo.trim()}`);
      setTracking(response.data);
    } catch {
      setTrackingError("ไม่พบเลขรายการนี้");
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="eyebrow">Mahosample</p>
            <h1 className="text-xl font-bold">ลงทะเบียนรับตัวอย่าง MAHO</h1>
          </div>
          <Link className="btn btn-secondary" to="/staff">
            Staff
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_340px]">
        <form className="surface space-y-6" onSubmit={submitForm}>
          <section>
            <h2>ข้อมูลผู้ลงทะเบียน</h2>
            <div className="form-grid mt-4">
              <TextField
                label="ชื่อ-นามสกุล"
                name="full_name"
                onChange={updateField}
                required
                value={form.full_name}
              />
              <TextField
                label="เบอร์โทรศัพท์"
                name="phone"
                onChange={updateField}
                required
                value={form.phone}
              />
              <TextField
                label="อีเมล"
                name="email"
                onChange={updateField}
                type="email"
                value={form.email}
              />
              <TextField
                label="LINE ID"
                name="line_id"
                onChange={updateField}
                value={form.line_id}
              />
              <TextField
                label="Facebook Messenger"
                name="messenger_id"
                onChange={updateField}
                value={form.messenger_id}
              />
              <SelectField
                label="ช่วงอายุ"
                name="age_range"
                onChange={updateField}
                options={ageRanges}
                value={form.age_range}
              />
            </div>
          </section>

          <section>
            <h2>ข้อมูลสุขภาพ</h2>
            <div className="form-grid mt-4">
              <SelectField
                label="ความสนใจ"
                name="health_interest"
                onChange={updateField}
                options={healthInterests}
                value={form.health_interest}
              />
              <TextField
                label="ระบุเพิ่มเติม"
                name="health_interest_other"
                onChange={updateField}
                value={form.health_interest_other}
              />
              <SelectField
                label="ประสบการณ์กับ MAHO"
                name="maho_experience"
                onChange={updateField}
                options={experiences}
                value={form.maho_experience}
              />
            </div>
          </section>

          <section>
            <h2>ที่อยู่จัดส่ง</h2>
            <div className="form-grid mt-4">
              <TextField
                label="ชื่อผู้รับ"
                name="recipient_name"
                onChange={updateField}
                required
                value={form.recipient_name}
              />
              <TextField
                label="บ้านเลขที่/อาคาร/หมู่บ้าน"
                name="address_line1"
                onChange={updateField}
                required
                value={form.address_line1}
              />
              <TextField
                label="ถนน/รายละเอียดเพิ่ม"
                name="address_line2"
                onChange={updateField}
                value={form.address_line2}
              />
              <TextField
                label="ตำบล/แขวง"
                name="subdistrict"
                onChange={updateField}
                required
                value={form.subdistrict}
              />
              <TextField
                label="อำเภอ/เขต"
                name="district"
                onChange={updateField}
                required
                value={form.district}
              />
              <TextField
                label="จังหวัด"
                name="province"
                onChange={updateField}
                required
                value={form.province}
              />
              <TextField
                label="รหัสไปรษณีย์"
                name="postal_code"
                onChange={updateField}
                required
                value={form.postal_code}
              />
            </div>
          </section>

          <section className="space-y-3">
            <label className="check-row">
              <input
                checked={form.pdpa_consent}
                name="pdpa_consent"
                onChange={updateField}
                type="checkbox"
              />
              <span>ยินยอมให้ใช้ข้อมูลเพื่อตรวจสอบสิทธิ์ ติดต่อกลับ และจัดส่งตัวอย่าง</span>
            </label>
            <label className="check-row">
              <input
                checked={form.marketing_consent}
                name="marketing_consent"
                onChange={updateField}
                type="checkbox"
              />
              <span>ยินยอมรับข่าวสาร โปรโมชั่น และข้อมูลผลิตภัณฑ์ในอนาคต</span>
            </label>
          </section>

          {formError && <p className="alert error">{formError}</p>}
          {createdRequest && (
            <p className="alert success">ลงทะเบียนสำเร็จ เลขรายการ {createdRequest.request_no}</p>
          )}

          <button className="btn btn-primary w-full sm:w-auto" disabled={!canSubmit} type="submit">
            {submitting ? "กำลังส่ง..." : "ส่งแบบฟอร์ม"}
          </button>
        </form>

        <aside className="space-y-6">
          <section className="surface">
            <h2>ตรวจสอบสถานะ</h2>
            <p className="mt-2 text-sm text-zinc-600">
              ใช้เลขรายการที่ได้หลังส่งฟอร์ม เพื่อตรวจสถานะคำขอและเปิดลิงก์ Thailand Post
              เมื่อมีเลข tracking แล้ว
            </p>
            <form className="mt-4 space-y-3" onSubmit={checkTracking}>
              <label className="field">
                <span>เลขรายการ</span>
                <input
                  onChange={(event) => setTrackingNo(event.target.value)}
                  required
                  value={trackingNo}
                />
              </label>
              <button className="btn btn-primary w-full" type="submit">
                เช็คสถานะ
              </button>
            </form>
            {trackingError && <p className="alert error mt-4">{trackingError}</p>}
            {tracking && (
              <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm">
                <p className="font-semibold">{tracking.request_no}</p>
                <p>สถานะคำขอ: {tracking.request_status}</p>
                <p>สถานะขนส่ง: {tracking.shipping_status}</p>
                {tracking.tracking_url && (
                  <a className="link" href={tracking.tracking_url} rel="noreferrer" target="_blank">
                    เปิด Thailand Post
                  </a>
                )}
              </div>
            )}
          </section>

          <section className="surface text-sm leading-6 text-zinc-700">
            <h2>เงื่อนไขกิจกรรม</h2>
            <p className="mt-3">จำกัด 1 สิทธิ์ต่อ 1 คน เบอร์โทรศัพท์ และที่อยู่</p>
            <p>สำหรับผู้ที่ยังไม่เคยได้รับตัวอย่าง ตามเงื่อนไขของบริษัท</p>
            <p>ผลิตภัณฑ์เสริมอาหารไม่มีผลในการป้องกันหรือรักษาโรค</p>
          </section>
        </aside>
      </div>
    </main>
  );
}
