import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { apiClient } from "../../api/client";

const requestStatusOptions = [
  "pending",
  "approved",
  "rejected",
  "packed",
  "shipped",
  "completed",
  "cancelled",
];
const shippingStatusOptions = ["not_ready", "ready_to_ship", "shipped", "delivered", "failed"];
const ageRangeOptions = ["under_30", "30-39", "40-49", "50-59", "60_plus"];
const healthInterestOptions = [
  "immune_support",
  "gut_health",
  "recovery",
  "senior_health",
  "general_health",
  "other",
];
const mahoExperienceOptions = ["never", "used", "received_sample"];
const contactChannelOptions = ["phone", "line", "messenger"];
const consentOptions = [true, false];
const requestStatusLabels = {
  pending: "รอตรวจสอบ",
  approved: "อนุมัติแล้ว",
  rejected: "ไม่ผ่านเงื่อนไข",
  packed: "แพ็กแล้ว",
  shipped: "จัดส่งแล้ว",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};
const shippingStatusLabels = {
  not_ready: "ยังไม่พร้อมส่ง",
  ready_to_ship: "พร้อมส่ง",
  shipped: "จัดส่งแล้ว",
  delivered: "นำจ่ายสำเร็จ",
  failed: "จัดส่งไม่สำเร็จ",
};
const valueLabels = {
  under_30: "ต่ำกว่า 30 ปี",
  "30-39": "30-39 ปี",
  "40-49": "40-49 ปี",
  "50-59": "50-59 ปี",
  "60_plus": "60 ปีขึ้นไป",
  immune_support: "การดูแลภูมิคุ้มกัน",
  gut_health: "สุขภาพลำไส้และระบบขับถ่าย",
  recovery: "การพักผ่อนและการฟื้นตัว",
  senior_health: "สุขภาพผู้สูงอายุ",
  general_health: "การดูแลสุขภาพทั่วไป",
  other: "อื่น ๆ",
  never: "ไม่เคย",
  used: "เคยรับประทาน",
  received_sample: "เคยได้รับตัวอย่าง",
  phone: "โทรศัพท์",
  line: "LINE",
  messenger: "Facebook Messenger",
  true: "ยินยอม",
  false: "ไม่ยินยอม",
  ...requestStatusLabels,
  ...shippingStatusLabels,
};
const tableColumns = [
  { key: "id", label: "ID" },
  { key: "request_no", label: "เลขรายการ" },
  { key: "full_name", label: "ชื่อผู้ลงทะเบียน" },
  { key: "phone", label: "โทร" },
  { key: "email", label: "อีเมล" },
  { key: "line_id", label: "LINE ID" },
  { key: "messenger_id", label: "Messenger" },
  { key: "age_range", label: "ช่วงอายุ", type: "select", options: ageRangeOptions },
  { key: "health_interest", label: "สุขภาพ", type: "select", options: healthInterestOptions },
  { key: "health_interest_other", label: "สุขภาพอื่น ๆ" },
  { key: "maho_experience", label: "ประสบการณ์", type: "select", options: mahoExperienceOptions },
  { key: "recipient_name", label: "ผู้รับ" },
  { key: "address_line1", label: "ที่อยู่ 1" },
  { key: "address_line2", label: "ที่อยู่ 2" },
  { key: "subdistrict", label: "ตำบล/แขวง" },
  { key: "district", label: "อำเภอ/เขต" },
  { key: "province", label: "จังหวัด" },
  { key: "postal_code", label: "รหัสไปรษณีย์" },
  {
    key: "preferred_contact_channel",
    label: "ช่องทางติดต่อ",
    type: "select",
    options: contactChannelOptions,
  },
  { key: "pdpa_consent", label: "PDPA", type: "select", options: consentOptions },
  { key: "marketing_consent", label: "ข่าวสาร", type: "select", options: consentOptions },
  { key: "request_status", label: "คำขอ", type: "select", options: requestStatusOptions },
  { key: "shipping_status", label: "ขนส่ง", type: "select", options: shippingStatusOptions },
  { key: "tracking_number", label: "Tracking" },
  { key: "tracking_url", label: "Tracking URL" },
  { key: "shipped_at", label: "วันที่ส่ง" },
  { key: "notes", label: "หมายเหตุ" },
  { key: "created_at", label: "วันที่ลงทะเบียน" },
  { key: "updated_at", label: "อัปเดตล่าสุด" },
];
const detailFields = [
  ["เลขรายการ", "request_no"],
  ["ชื่อผู้ลงทะเบียน", "full_name"],
  ["โทร", "phone"],
  ["อีเมล", "email"],
  ["LINE ID", "line_id"],
  ["Facebook Messenger", "messenger_id"],
  ["ช่วงอายุ", "age_range"],
  ["ความสนใจสุขภาพ", "health_interest"],
  ["อื่น ๆ", "health_interest_other"],
  ["ประสบการณ์กับ มะโฮ", "maho_experience"],
  ["ผู้รับ", "recipient_name"],
  ["ที่อยู่ 1", "address_line1"],
  ["ที่อยู่ 2", "address_line2"],
  ["ตำบล/แขวง", "subdistrict"],
  ["อำเภอ/เขต", "district"],
  ["จังหวัด", "province"],
  ["รหัสไปรษณีย์", "postal_code"],
  ["ช่องทางที่เลือก", "preferred_contact_channel"],
  ["PDPA", "pdpa_consent"],
  ["รับข่าวสาร", "marketing_consent"],
  ["สถานะคำขอ", "request_status"],
  ["สถานะขนส่ง", "shipping_status"],
  ["Tracking", "tracking_number"],
  ["Tracking URL", "tracking_url"],
  ["วันที่ส่ง", "shipped_at"],
  ["หมายเหตุ", "notes"],
  ["วันที่สร้าง", "created_at"],
  ["วันที่อัปเดต", "updated_at"],
];

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return valueLabels[String(value)];
  return valueLabels[value] || value;
}

function toCsvValue(value) {
  const text = String(displayValue(value)).replaceAll('"', '""');
  return `"${text}"`;
}

export default function StaffRequestsPage() {
  const [token, setToken] = useState(() => localStorage.getItem("mahosample_token") || "");
  const [email, setEmail] = useState("admin@mahosample.com");
  const [password, setPassword] = useState("");
  const [requests, setRequests] = useState([]);
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: "created_at", direction: "desc" });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState("");
  const [shippingStatus, setShippingStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const visibleRequests = useMemo(() => {
    const filtered = requests.filter((request) =>
      tableColumns.every((column) => {
        const filterValue = filters[column.key];
        if (!filterValue) return true;
        const requestValue = request[column.key];
        if (column.type === "select") return String(requestValue) === filterValue;
        return normalize(displayValue(requestValue)).includes(normalize(filterValue));
      }),
    );
    return [...filtered].sort((left, right) => {
      const direction = sortConfig.direction === "asc" ? 1 : -1;
      return (
        normalize(displayValue(left[sortConfig.key])).localeCompare(
          normalize(displayValue(right[sortConfig.key])),
          "th",
          { numeric: true },
        ) * direction
      );
    });
  }, [filters, requests, sortConfig]);

  async function loadRequests() {
    if (!token) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await apiClient.get("/api/admin/sample-requests?limit=100", {
        headers: authHeaders,
      });
      setRequests(response.data.items);
    } catch {
      setMessage("โหลดข้อมูลไม่สำเร็จ กรุณา login ใหม่");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, [token]);

  function openDetail(request) {
    setSelectedRequest(request);
    setRequestStatus(request.request_status);
    setShippingStatus(request.shipping_status);
    setTrackingNumber(request.tracking_number || "");
    setNotes(request.notes || "");
    setMessage("");
  }

  function toggleSort(key) {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  async function login(event) {
    event.preventDefault();
    setMessage("");
    try {
      const response = await apiClient.post("/api/auth/login", { email, password });
      localStorage.setItem("mahosample_token", response.data.access_token);
      setToken(response.data.access_token);
    } catch {
      setMessage("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }
  }

  async function saveRequest() {
    if (!selectedRequest) return;
    const response = await apiClient.patch(
      `/api/admin/sample-requests/${selectedRequest.request_no}`,
      { notes, request_status: requestStatus },
      { headers: authHeaders },
    );
    setSelectedRequest(response.data);
    setMessage(`บันทึกคำขอ ${selectedRequest.request_no} แล้ว`);
    loadRequests();
  }

  async function updateShipping() {
    if (!selectedRequest) return;
    const response = await apiClient.patch(
      `/api/admin/sample-requests/${selectedRequest.request_no}/shipping`,
      {
        request_status: shippingStatus === "shipped" ? "shipped" : undefined,
        shipping_status: shippingStatus,
        tracking_number: trackingNumber || null,
      },
      { headers: authHeaders },
    );
    setSelectedRequest(response.data);
    setMessage(`อัปเดตขนส่ง ${selectedRequest.request_no} แล้ว`);
    loadRequests();
  }

  function exportVisibleCsv() {
    const rows = [
      tableColumns.map((column) => toCsvValue(column.label)).join(","),
      ...visibleRequests.map((request) =>
        tableColumns.map((column) => toCsvValue(request[column.key])).join(","),
      ),
    ];
    const blob = new Blob([`\ufeff${rows.join("\n")}`], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `Mahosample_full_requests_${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  if (!token) {
    return (
      <main className="staff-shell">
        <form className="login-panel" onSubmit={login}>
          <p className="eyebrow">Mahosample Staff</p>
          <h1 className="text-2xl">เข้าสู่ระบบพนักงาน</h1>
          <label className="field">
            <span>Email</span>
            <input onChange={(event) => setEmail(event.target.value)} value={email} />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>
          {message && <p className="alert error">{message}</p>}
          <button className="btn btn-primary w-full" type="submit">
            Login
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="staff-page min-h-screen bg-zinc-100 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-[96rem] items-center justify-between px-4 py-4">
          <div>
            <p className="eyebrow">Mahosample Staff</p>
            <h1 className="text-xl">ตารางข้อมูลเต็ม</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn btn-secondary" to="/staff">
              Dashboard
            </Link>
            <button className="btn btn-secondary" onClick={loadRequests} type="button">
              {loading ? "กำลังโหลด..." : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[96rem] px-4 py-6">
        <section className="surface">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2>รายการทั้งหมด</h2>
              <p className="mt-1 text-sm text-zinc-600">
                แสดง {visibleRequests.length} จาก {requests.length} รายการ
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-secondary" onClick={() => setFilters({})} type="button">
                ล้าง filter
              </button>
              <button className="btn btn-primary" onClick={exportVisibleCsv} type="button">
                Export CSV
              </button>
            </div>
          </div>

          {message && <p className="alert success mt-4">{message}</p>}

          <div className="mt-5 overflow-x-auto">
            <table className="data-table full-data-table">
              <thead>
                <tr>
                  {tableColumns.map((column) => (
                    <th key={column.key}>
                      <button
                        className="table-sort-button"
                        onClick={() => toggleSort(column.key)}
                        type="button"
                      >
                        <span>{column.label}</span>
                        <span aria-hidden="true">
                          {sortConfig.key === column.key
                            ? sortConfig.direction === "asc"
                              ? "↑"
                              : "↓"
                            : "↕"}
                        </span>
                      </button>
                    </th>
                  ))}
                </tr>
                <tr className="filter-row">
                  {tableColumns.map((column) => (
                    <th key={`${column.key}-filter`}>
                      {column.type === "select" ? (
                        <select
                          aria-label={`filter ${column.label}`}
                          onChange={(event) => updateFilter(column.key, event.target.value)}
                          value={filters[column.key] || ""}
                        >
                          <option value="">ทั้งหมด</option>
                          {column.options.map((option) => (
                            <option key={String(option)} value={String(option)}>
                              {displayValue(option)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          aria-label={`filter ${column.label}`}
                          onChange={(event) => updateFilter(column.key, event.target.value)}
                          placeholder="ค้นหา"
                          value={filters[column.key] || ""}
                        />
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRequests.map((request) => (
                  <tr
                    className="clickable-row"
                    key={request.request_no}
                    onClick={() => openDetail(request)}
                  >
                    {tableColumns.map((column) => (
                      <td key={`${request.request_no}-${column.key}`}>
                        {displayValue(request[column.key])}
                      </td>
                    ))}
                  </tr>
                ))}
                {visibleRequests.length === 0 && (
                  <tr>
                    <td className="empty-table-cell" colSpan={tableColumns.length}>
                      ไม่พบข้อมูลตาม filter ที่เลือก
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {selectedRequest && (
        <div className="detail-drawer-backdrop" onClick={() => setSelectedRequest(null)}>
          <aside className="detail-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">รายละเอียดรายการ</p>
                <h2>{selectedRequest.request_no}</h2>
              </div>
              <button className="btn btn-secondary" onClick={() => setSelectedRequest(null)} type="button">
                ปิด
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="field">
                <span>สถานะคำขอ</span>
                <select onChange={(event) => setRequestStatus(event.target.value)} value={requestStatus}>
                  {requestStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {requestStatusLabels[status]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>สถานะขนส่ง</span>
                <select onChange={(event) => setShippingStatus(event.target.value)} value={shippingStatus}>
                  {shippingStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {shippingStatusLabels[status]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field sm:col-span-2">
                <span>Tracking</span>
                <input onChange={(event) => setTrackingNumber(event.target.value)} value={trackingNumber} />
              </label>
              <label className="field sm:col-span-2">
                <span>บันทึก</span>
                <textarea onChange={(event) => setNotes(event.target.value)} rows={3} value={notes} />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn btn-secondary" onClick={saveRequest} type="button">
                บันทึกคำขอ
              </button>
              <button className="btn btn-primary" onClick={updateShipping} type="button">
                อัปเดตขนส่ง
              </button>
            </div>

            <dl className="detail-list">
              {detailFields.map(([label, key]) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>{displayValue(selectedRequest[key])}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      )}
    </main>
  );
}
