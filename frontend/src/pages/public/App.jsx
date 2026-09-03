import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ThaiAddressFinder } from "thai-address-autocomplete-react";

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

const thaiAddressFinder = new ThaiAddressFinder({ maxSearchResult: 200 });

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

function AddressAutocompleteField({
  label,
  name,
  value,
  onChange,
  onSelect,
  inputMode,
  options,
  placeholder,
}) {
  return (
    <label className="field address-field">
      <span>{label}</span>
      <input
        autoComplete="off"
        inputMode={inputMode}
        name={name}
        onBlur={() => onChange(name, value, { closeAfterBlur: true })}
        onChange={(event) => onChange(name, event.target.value)}
        onFocus={() => onChange(name, value)}
        placeholder={placeholder}
        value={value}
      />
      {options.length > 0 && (
        <div className="address-suggestions" role="listbox">
          {options.map((address) => (
            <button
              key={`${address.district}-${address.amphoe}-${address.province}-${address.zipcode}`}
              onMouseDown={(event) => {
                event.preventDefault();
                onSelect(address);
              }}
              role="option"
              type="button"
            >
              {address.district}, {address.amphoe}, {address.province}, {address.zipcode}
            </button>
          ))}
        </div>
      )}
    </label>
  );
}

function digitsOnly(value) {
  return value.replace(/\D/g, "");
}

function hasContactChannel(form) {
  return Boolean(
    form.email.trim() || form.line_id.trim() || form.messenger_id.trim(),
  );
}

function normalizeAddressValue(value) {
  return value.trim().toLowerCase();
}

function isSameAddressValue(left, right) {
  return normalizeAddressValue(left) === normalizeAddressValue(right);
}

function isAddressFilterMatch(inputValue, addressValue) {
  const normalizedInput = normalizeAddressValue(inputValue);
  const normalizedAddress = normalizeAddressValue(addressValue);
  return (
    normalizedAddress.includes(normalizedInput)
    || normalizedInput.includes(normalizedAddress)
  );
}

function getAddressFilter(form, activeField) {
  return (address) => {
    if (!address) {
      return false;
    }

    const checks = {
      subdistrict: address.district,
      district: address.amphoe,
      province: address.province,
      postal_code: address.zipcode,
    };

    return Object.entries(checks).every(([fieldName, addressValue]) => {
      if (fieldName === activeField || !form[fieldName].trim()) {
        return true;
      }
      return isAddressFilterMatch(form[fieldName], addressValue);
    });
  };
}

function getUniqueAddresses(addresses) {
  const seen = new Set();
  return addresses.filter((address) => {
    const key = `${address.district}|${address.amphoe}|${address.province}|${address.zipcode}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getAddressSuggestions(fieldName, query, form) {
  const searchValue = query.trim();
  const filter = getAddressFilter(form, fieldName);
  let results = [];

  if (searchValue) {
    if (fieldName === "postal_code") {
      results = thaiAddressFinder.SearchAddressByZipcode(digitsOnly(searchValue), filter);
    } else if (fieldName === "province") {
      results = thaiAddressFinder.SearchAddressByProvince(searchValue, filter);
    } else if (fieldName === "district") {
      results = thaiAddressFinder.SearchAddressByAmphoe(searchValue, filter);
    } else if (fieldName === "subdistrict") {
      results = thaiAddressFinder.SearchAddressByDistrict(searchValue, filter);
    }
  } else if (form.district.trim()) {
    results = thaiAddressFinder.SearchAddressByAmphoe(form.district, filter);
  } else if (form.province.trim()) {
    results = thaiAddressFinder.SearchAddressByProvince(form.province, filter);
  } else if (digitsOnly(form.postal_code).length >= 2) {
    results = thaiAddressFinder.SearchAddressByZipcode(form.postal_code, filter);
  }

  return getUniqueAddresses(results).slice(0, 12);
}

function hasKnownThaiAddress(form) {
  const postalCode = digitsOnly(form.postal_code);
  if (postalCode.length !== 5) {
    return false;
  }

  return thaiAddressFinder
    .SearchAddressByZipcode(postalCode)
    .some((address) => (
      isSameAddressValue(form.subdistrict, address.district)
      && isSameAddressValue(form.district, address.amphoe)
      && isSameAddressValue(form.province, address.province)
      && form.postal_code.trim() === address.zipcode
    ));
}

function getClientValidationErrors(form) {
  const errors = [];

  if (!form.full_name.trim()) {
    errors.push("กรุณากรอกชื่อ-นามสกุล");
  }
  if (digitsOnly(form.phone).length < 9) {
    errors.push("กรุณากรอกเบอร์โทรศัพท์ให้ครบอย่างน้อย 9 หลัก");
  }
  if (!hasContactChannel(form)) {
    errors.push("กรุณากรอกช่องทางติดต่ออย่างน้อย 1 อย่าง: อีเมล, LINE ID หรือ Facebook Messenger");
  }
  if (!form.recipient_name.trim()) {
    errors.push("กรุณากรอกชื่อผู้รับ");
  }
  if (!form.address_line1.trim()) {
    errors.push("กรุณากรอกบ้านเลขที่/อาคาร/หมู่บ้าน");
  }
  if (!form.subdistrict.trim()) {
    errors.push("กรุณากรอกตำบล/แขวง");
  }
  if (!form.district.trim()) {
    errors.push("กรุณากรอกอำเภอ/เขต");
  }
  if (!form.province.trim()) {
    errors.push("กรุณากรอกจังหวัด");
  }
  if (digitsOnly(form.postal_code).length < 5) {
    errors.push("กรุณากรอกรหัสไปรษณีย์ให้ครบ 5 หลัก");
  }
  if (
    form.subdistrict.trim()
    && form.district.trim()
    && form.province.trim()
    && digitsOnly(form.postal_code).length === 5
    && !hasKnownThaiAddress(form)
  ) {
    errors.push("กรุณาเลือกที่อยู่จากรายการแนะนำ เพื่อให้ตำบล/แขวง อำเภอ/เขต จังหวัด และรหัสไปรษณีย์ตรงกัน");
  }
  if (form.health_interest === "other" && !form.health_interest_other.trim()) {
    errors.push("กรุณาระบุข้อมูลเพิ่มเติม เมื่อเลือกความสนใจเป็น “อื่น ๆ”");
  }
  if (!form.pdpa_consent) {
    errors.push("กรุณายินยอมให้ใช้ข้อมูลเพื่อจัดส่งตัวอย่าง");
  }

  return errors;
}

function getApiErrorMessage(error) {
  if (error.response?.status === 409) {
    const detail = error.response?.data?.detail;
    if (detail === "duplicate_phone_and_address") {
      return "เบอร์โทรศัพท์และที่อยู่จัดส่งนี้เคยลงทะเบียนแล้ว กรุณาติดต่อเจ้าหน้าที่";
    }
    if (detail === "duplicate_phone") {
      return "เบอร์โทรศัพท์นี้เคยลงทะเบียนแล้ว กรุณาติดต่อเจ้าหน้าที่";
    }
    if (detail === "duplicate_address") {
      return "ที่อยู่จัดส่งนี้เคยลงทะเบียนแล้ว กรุณาติดต่อเจ้าหน้าที่";
    }
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
    if (
      fieldNames.includes("email")
      || fieldNames.includes("line_id")
      || fieldNames.includes("messenger_id")
    ) {
      return "กรุณากรอกช่องทางติดต่ออย่างน้อย 1 อย่าง: อีเมล, LINE ID หรือ Facebook Messenger";
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
  const [addressSuggestionState, setAddressSuggestionState] = useState({
    field: "",
    options: [],
  });
  const addressBlurTimerRef = useRef(null);

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

  function updateAddressField(name, value, options = {}) {
    if (options.closeAfterBlur) {
      addressBlurTimerRef.current = window.setTimeout(() => {
        setAddressSuggestionState({ field: "", options: [] });
      }, 120);
      return;
    }

    if (addressBlurTimerRef.current) {
      window.clearTimeout(addressBlurTimerRef.current);
      addressBlurTimerRef.current = null;
    }

    setForm((current) => {
      const nextForm = {
        ...current,
        [name]: name === "postal_code" ? digitsOnly(value).slice(0, 5) : value,
      };
      setAddressSuggestionState({
        field: name,
        options: getAddressSuggestions(name, nextForm[name], nextForm),
      });
      return nextForm;
    });
  }

  function selectThaiAddress(address) {
    setForm((current) => ({
      ...current,
      subdistrict: address.district,
      district: address.amphoe,
      province: address.province,
      postal_code: address.zipcode,
    }));
    setAddressSuggestionState({ field: "", options: [] });
  }

  async function submitForm(event) {
    event.preventDefault();
    const validationErrors = getClientValidationErrors(form);
    if (validationErrors.length > 0) {
      setFormError(validationErrors);
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
            <h1 className="text-xl font-normal">ลงทะเบียนรับตัวอย่าง มะโฮ</h1>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pt-6 lg:grid-cols-[1fr_420px] lg:items-stretch">
        <div className="brand-hero">
          <p className="eyebrow">MAHO Beta-1,3/1,6-Glucan</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-normal leading-tight text-[#111947] sm:text-4xl">
            รับตัวอย่างมะโฮแบบเจล ฟรี 2 ซอง
          </h2>
          <p className="mt-4 max-w-2xl text-base font-normal leading-7 text-zinc-700">
            กรอกข้อมูลเพื่อให้เจ้าหน้าที่ตรวจสอบสิทธิ์และจัดส่งตัวอย่าง
            พร้อมแจ้งเลข tracking หลังจัดส่งผ่าน LINE ID หรือ Facebook Messenger
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm font-normal">
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
                placeholder="กรอกอีเมล หรือเลือกกรอก LINE/Facebook แทน"
                type="email"
                value={form.email}
              />
              <TextField
                label="LINE ID"
                name="line_id"
                onChange={updateField}
                placeholder="กรอก LINE ID หรือเลือกกรอกอีเมล/Facebook แทน"
                value={form.line_id}
              />
              <TextField
                label="Facebook Messenger"
                name="messenger_id"
                onChange={updateField}
                placeholder="กรอกชื่อบัญชี หรือเลือกกรอกอีเมล/LINE แทน"
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
                label="ประสบการณ์กับ มะโฮ"
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
              <AddressAutocompleteField
                label="รหัสไปรษณีย์"
                inputMode="numeric"
                name="postal_code"
                options={addressSuggestionState.field === "postal_code" ? addressSuggestionState.options : []}
                placeholder="เช่น 10230"
                onChange={updateAddressField}
                onSelect={selectThaiAddress}
                value={form.postal_code}
              />
              <AddressAutocompleteField
                label="จังหวัด"
                name="province"
                options={addressSuggestionState.field === "province" ? addressSuggestionState.options : []}
                placeholder="พิมพ์จังหวัด เช่น กรุงเทพมหานคร"
                onChange={updateAddressField}
                onSelect={selectThaiAddress}
                value={form.province}
              />
              <AddressAutocompleteField
                label="อำเภอ/เขต"
                name="district"
                options={addressSuggestionState.field === "district" ? addressSuggestionState.options : []}
                placeholder="พิมพ์อำเภอ/เขต เช่น ลาดพร้าว"
                onChange={updateAddressField}
                onSelect={selectThaiAddress}
                value={form.district}
              />
              <AddressAutocompleteField
                label="ตำบล/แขวง"
                name="subdistrict"
                options={addressSuggestionState.field === "subdistrict" ? addressSuggestionState.options : []}
                placeholder="พิมพ์ตำบล/แขวง เช่น ลาดพร้าว"
                onChange={updateAddressField}
                onSelect={selectThaiAddress}
                value={form.subdistrict}
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

          {formError && (
            <div className="alert error">
              {Array.isArray(formError) ? (
                <ul className="validation-list">
                  {formError.map((errorMessage) => (
                    <li key={errorMessage}>{errorMessage}</li>
                  ))}
                </ul>
              ) : (
                formError
              )}
            </div>
          )}
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
            <div className="success-dialog-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="img">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
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
