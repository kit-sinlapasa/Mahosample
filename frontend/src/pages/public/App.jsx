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

function TextField({
  label,
  name,
  value,
  onChange,
  required = false,
  type = "text",
  ...inputProps
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        {...inputProps}
        name={name}
        onChange={onChange}
        required={required}
        type={type}
        value={value}
      />
    </label>
  );
}

function digitsOnly(value) {
  return value.replace(/\D/g, "");
}

function getClientValidationError(form) {
  if (digitsOnly(form.phone).length < 9) {
    return "กรุณากรอกเบอร์โทรศัพท์ให้ครบอย่างน้อย 9 หลัก";
  }
  if (digitsOnly(form.postal_code).length < 5) {
    return "กรุณากรอกรหัสไปรษณีย์ให้ครบ 5 หลัก";
  }
  if (form.health_interest === "other" && !form.health_interest_other.trim()) {
    return "กรุณาระบุข้อมูลเพิ่มเติม เมื่อเลือกความสนใจเป็น “อื่น ๆ”";
  }
  return "";
}

function getApiErrorMessage(error) {
  if (error.response?.status === 409) {
    return "ข้อมูลนี้เคยลงทะเบียนแล้ว กรุณาติดต่อเจ้าหน้าที่";
  }

  const details = error.response?.data?.detail;
  if (Array.isArray(details)) {
    const fieldNames = details.map((detail) => detail.loc?.at(-1));
    if (fieldNames.includes("phone")) {
      return "กรุณาตรวจสอบเบอร์โทรศัพท์ ต้องมีอย่างน้อย 9 หลัก";
    }
    if (fieldNames.includes("postal_code")) {
      return "กรุณาตรวจสอบรหัสไปรษณีย์ ต้องมีอย่างน้อย 5 หลัก";
    }
    if (fieldNames.includes("email")) {
      return "กรุณาตรวจสอบอีเมลให้ถูกต้อง หรือเว้นว่างไว้";
    }
    if (fieldNames.includes("health_interest_other")) {
      return "กรุณาระบุข้อมูลเพิ่มเติม เมื่อเลือกความสนใจเป็น “อื่น ๆ”";
    }
  }

  return "ส่งแบบฟอร์มไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง";
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
    const validationError = getClientValidationError(form);
    if (validationError) {
      setFormError(validationError);
      setCreatedRequest(null);
      return;
    }

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
      setForm(initialForm);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="public-page min-h-screen text-zinc-950">
      <header className="border-b border-amber-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="eyebrow">Mahosample</p>
            <h1 className="text-xl font-bold">ลงทะเบียนรับตัวอย่าง มะโฮ</h1>
          </div>
          <Link className="btn btn-secondary" to="/staff">
            Staff
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pt-6 lg:grid-cols-[1fr_420px] lg:items-stretch">
        <div className="brand-hero">
          <p className="eyebrow">MAHO Beta-1,3/1,6-Glucan</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold leading-tight text-[#111947] sm:text-4xl">
            รับตัวอย่างมะโฮแบบเจล ฟรี 2 ซอง
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-700">
            กรอกข้อมูลเพื่อให้เจ้าหน้าที่ตรวจสอบสิทธิ์และจัดส่งตัวอย่าง
            พร้อมแจ้งเลข tracking หลังจัดส่งผ่าน LINE ID หรือ Facebook Messenger
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm font-semibold">
            <span className="brand-chip">ก่อตั้งจากญี่ปุ่น</span>
            <span className="brand-chip">ดูแลสุขภาพ</span>
            <span className="brand-chip">จัดส่งถึงบ้าน</span>
          </div>
        </div>

        <figure className="brand-image-wrap">
          <img
            alt="ผู้ก่อตั้ง Aureo ถือผลิตภัณฑ์ MAHO"
            className="brand-image"
            src="/yk-talk.jpg"
          />
        </figure>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_320px]">
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
                inputMode="tel"
                minLength={9}
                placeholder="เช่น 0812345678"
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
                inputMode="numeric"
                minLength={5}
                placeholder="เช่น 10230"
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
          <button className="btn btn-primary w-full sm:w-auto" disabled={!canSubmit} type="submit">
            {submitting ? "กำลังส่ง..." : "ส่งแบบฟอร์ม"}
          </button>
        </form>

        <aside className="space-y-6">
          <section className="surface text-sm leading-6 text-zinc-700">
            <h2>เงื่อนไขกิจกรรม</h2>
            <p className="mt-3">จำกัด 1 สิทธิ์ต่อ 1 คน เบอร์โทรศัพท์ และที่อยู่</p>
            <p>สำหรับผู้ที่ยังไม่เคยได้รับตัวอย่าง ตามเงื่อนไขของบริษัท</p>
            <p>ผลิตภัณฑ์เสริมอาหารไม่มีผลในการป้องกันหรือรักษาโรค</p>
          </section>
          <section className="surface text-sm leading-6 text-zinc-700">
            <h2>ติดตามพัสดุ</h2>
            <p className="mt-3">
              หลังเจ้าหน้าที่จัดส่ง ระบบจะมีเลข tracking สำหรับส่งให้ลูกค้าทาง LINE ID
              หรือ Facebook Messenger
            </p>
            <Link className="btn btn-primary mt-4 w-full" to="/tracking">
              เปิดหน้าติดตามพัสดุ
            </Link>
          </section>
        </aside>
      </div>

      {createdRequest && (
        <div className="success-dialog-backdrop" role="presentation">
          <section
            aria-labelledby="registration-success-title"
            aria-modal="true"
            className="success-dialog"
            role="dialog"
          >
            <p className="eyebrow">ส่งแบบฟอร์มเรียบร้อย</p>
            <h2 id="registration-success-title">ลงทะเบียนสำเร็จ</h2>
            <p className="success-dialog-request">
              เลขรายการภายในคือ <strong>{createdRequest.request_no}</strong>
            </p>
            <p className="success-dialog-copy">
              เจ้าหน้าที่จะส่งเลข tracking ให้ทาง LINE ID หรือ Facebook Messenger
              หลังจัดส่งแล้ว
            </p>
            <button
              className="btn btn-primary mt-5 w-full"
              onClick={() => setCreatedRequest(null)}
              type="button"
            >
              ตกลง
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
