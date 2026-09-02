import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { apiClient } from "../../api/client";

const statusOptions = [
  "pending",
  "approved",
  "rejected",
  "packed",
  "shipped",
  "completed",
  "cancelled",
];
const shippingOptions = ["not_ready", "ready_to_ship", "shipped", "delivered", "failed"];
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
const tableColumns = [
  { key: "request_no", label: "เลขรายการ", filter: "text" },
  { key: "full_name", label: "ลูกค้า", filter: "text" },
  { key: "phone", label: "โทร", filter: "text" },
  { key: "province", label: "จังหวัด", filter: "text" },
  { key: "request_status", label: "คำขอ", filter: "select", options: statusOptions, labels: requestStatusLabels },
  {
    key: "shipping_status",
    label: "ขนส่ง",
    filter: "select",
    options: shippingOptions,
    labels: shippingStatusLabels,
  },
  { key: "tracking_number", label: "Tracking", filter: "text" },
  { key: "actions", label: "บันทึก" },
];

function getDownloadFilename(response, fallback) {
  const disposition = response.headers["content-disposition"];
  const filenameMatch = disposition?.match(/filename="?([^"]+)"?/i);
  return filenameMatch?.[1] || fallback;
}

function normalizeForSearch(value) {
  return String(value || "").trim().toLowerCase();
}

function getSortValue(request, key) {
  if (key === "request_status") {
    return requestStatusLabels[request.request_status] || request.request_status || "";
  }
  if (key === "shipping_status") {
    return shippingStatusLabels[request.shipping_status] || request.shipping_status || "";
  }
  return request[key] || "";
}

export default function StaffApp() {
  const [token, setToken] = useState(() => localStorage.getItem("mahosample_token") || "");
  const [email, setEmail] = useState("staff.demo@example.com");
  const [password, setPassword] = useState("staff-password");
  const [loginError, setLoginError] = useState("");
  const [summary, setSummary] = useState(null);
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: "request_no", direction: "desc" });

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const visibleRequests = useMemo(() => {
    const filteredRequests = requests.filter((request) =>
      tableColumns.every((column) => {
        if (!column.filter) return true;
        const filterValue = filters[column.key];
        if (!filterValue) return true;
        const rawValue = request[column.key];
        if (column.filter === "select") return rawValue === filterValue;
        return normalizeForSearch(rawValue).includes(normalizeForSearch(filterValue));
      }),
    );

    return [...filteredRequests].sort((left, right) => {
      const leftValue = normalizeForSearch(getSortValue(left, sortConfig.key));
      const rightValue = normalizeForSearch(getSortValue(right, sortConfig.key));
      const direction = sortConfig.direction === "asc" ? 1 : -1;
      return leftValue.localeCompare(rightValue, "th", { numeric: true }) * direction;
    });
  }, [filters, requests, sortConfig]);

  async function loadDashboard() {
    if (!token) return;
    setLoading(true);
    try {
      const [summaryResponse, requestResponse] = await Promise.all([
        apiClient.get("/api/admin/dashboard/summary", { headers: authHeaders }),
        apiClient.get("/api/admin/sample-requests", { headers: authHeaders }),
      ]);
      setSummary(summaryResponse.data);
      setRequests(requestResponse.data.items);
    } catch {
      setMessage("โหลดข้อมูลไม่สำเร็จ กรุณา login ใหม่");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [token]);

  async function login(event) {
    event.preventDefault();
    setLoginError("");
    try {
      const response = await apiClient.post("/api/auth/login", { email, password });
      localStorage.setItem("mahosample_token", response.data.access_token);
      setToken(response.data.access_token);
    } catch {
      setLoginError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }
  }

  function logout() {
    localStorage.removeItem("mahosample_token");
    setToken("");
    setRequests([]);
    setSummary(null);
  }

  function updateFilter(key, value) {
    setFilters((currentFilters) => ({ ...currentFilters, [key]: value }));
  }

  function clearFilters() {
    setFilters({});
  }

  function toggleSort(key) {
    if (key === "actions") return;
    setSortConfig((currentSort) => ({
      key,
      direction: currentSort.key === key && currentSort.direction === "asc" ? "desc" : "asc",
    }));
  }

  async function updateShipping(requestNo, shippingStatus, trackingNumber) {
    setMessage("");
    await apiClient.patch(
      `/api/admin/sample-requests/${requestNo}/shipping`,
      {
        request_status: shippingStatus === "shipped" ? "shipped" : undefined,
        shipping_status: shippingStatus,
        tracking_number: trackingNumber || null,
      },
      { headers: authHeaders },
    );
    setMessage(`อัปเดต ${requestNo} แล้ว`);
    loadDashboard();
  }

  async function updateRequest(requestNo, requestStatus, notes) {
    setMessage("");
    await apiClient.patch(
      `/api/admin/sample-requests/${requestNo}`,
      { notes, request_status: requestStatus },
      { headers: authHeaders },
    );
    setMessage(`บันทึก ${requestNo} แล้ว`);
    loadDashboard();
  }

  async function exportCsv() {
    const response = await apiClient.get("/api/admin/sample-requests/export/post-office", {
      headers: authHeaders,
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = getDownloadFilename(response, "ImportRecipientBook.csv");
    anchor.click();
    window.URL.revokeObjectURL(url);
    setMessage("Export เฉพาะรายการที่ Tracking ว่างแล้ว");
  }

  async function importTracking(event) {
    event.preventDefault();
    if (!importFile) return;
    const formData = new FormData();
    formData.append("file", importFile);
    const response = await apiClient.post("/api/admin/sample-requests/import/tracking", formData, {
      headers: authHeaders,
    });
    setMessage(
      `Import สำเร็จ ${response.data.success_count}, ไม่พบ ${response.data.not_found_count}, ล้มเหลว ${response.data.failed_count}`,
    );
    setImportFile(null);
    loadDashboard();
  }

  if (!token) {
    return (
      <main className="staff-shell">
        <form className="login-panel" onSubmit={login}>
          <p className="eyebrow">Mahosample Staff</p>
          <h1 className="text-2xl">เข้าสู่ระบบพนักงาน</h1>
          <label className="field">
            <span>Email</span>
            <input
              autoComplete="username"
              onChange={(event) => setEmail(event.target.value)}
              value={email}
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              type="password"
              value={password}
            />
          </label>
          {loginError && <p className="alert error">{loginError}</p>}
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
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <p className="eyebrow">Mahosample Staff</p>
            <h1 className="text-xl">Dashboard</h1>
          </div>
          <button className="btn btn-secondary" onClick={logout} type="button">
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="ทั้งหมด" value={summary?.total_requests ?? 0} />
          <Metric label="รอจัดการ" value={summary?.by_request_status?.pending ?? 0} />
          <Metric label="พร้อมส่ง" value={summary?.by_shipping_status?.ready_to_ship ?? 0} />
          <Metric label="จัดส่งแล้ว" value={summary?.by_shipping_status?.shipped ?? 0} />
        </section>

        <section className="surface">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2>รายการลงทะเบียน</h2>
            <div className="flex flex-wrap gap-2">
              <Link className="btn btn-secondary" to="/staff/requests">
                ตารางข้อมูลเต็ม
              </Link>
              <button className="btn btn-secondary" onClick={clearFilters} type="button">
                ล้าง filter
              </button>
              <button className="btn btn-secondary" onClick={loadDashboard} type="button">
                {loading ? "กำลังโหลด..." : "Refresh"}
              </button>
              <button className="btn btn-primary" onClick={exportCsv} type="button">
                Export Tracking ว่าง
              </button>
            </div>
          </div>
          <p className="mt-2 text-sm text-zinc-600">
            Export เป็นไฟล์ ImportRecipientBook_yyyy-mm-dd.csv สำหรับนำไปใช้กับ template ขนส่ง
            โดยดึงเฉพาะรายการที่ยังไม่มีเลข Tracking
          </p>

          <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={importTracking}>
            <input
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="file-input"
              onChange={(event) => setImportFile(event.target.files?.[0] || null)}
              type="file"
            />
            <button className="btn btn-secondary" disabled={!importFile} type="submit">
              Import tracking
            </button>
          </form>

          {message && <p className="alert success mt-4">{message}</p>}

          <div className="mt-5 overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  {tableColumns.map((column) => (
                    <th key={column.key}>
                      {column.key === "actions" ? (
                        column.label
                      ) : (
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
                      )}
                    </th>
                  ))}
                </tr>
                <tr className="filter-row">
                  {tableColumns.map((column) => (
                    <th key={`${column.key}-filter`}>
                      {column.filter === "text" && (
                        <input
                          aria-label={`filter ${column.label}`}
                          onChange={(event) => updateFilter(column.key, event.target.value)}
                          placeholder="ค้นหา"
                          value={filters[column.key] || ""}
                        />
                      )}
                      {column.filter === "select" && (
                        <select
                          aria-label={`filter ${column.label}`}
                          onChange={(event) => updateFilter(column.key, event.target.value)}
                          value={filters[column.key] || ""}
                        >
                          <option value="">ทั้งหมด</option>
                          {column.options.map((option) => (
                            <option key={option} value={option}>
                              {column.labels[option] || option}
                            </option>
                          ))}
                        </select>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRequests.map((request) => (
                  <StaffRow
                    key={request.request_no}
                    onSave={updateRequest}
                    onShipping={updateShipping}
                    request={request}
                  />
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
    </main>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function StaffRow({ request, onSave, onShipping }) {
  const [requestStatus, setRequestStatus] = useState(request.request_status);
  const [shippingStatus, setShippingStatus] = useState(request.shipping_status);
  const [trackingNumber, setTrackingNumber] = useState(request.tracking_number || "");
  const [notes, setNotes] = useState(request.notes || "");

  return (
    <tr>
      <td>{request.request_no}</td>
      <td>{request.full_name}</td>
      <td>{request.phone}</td>
      <td>{request.province}</td>
      <td>
        <StatusSelect
          labels={requestStatusLabels}
          onChange={setRequestStatus}
          options={statusOptions}
          value={requestStatus}
        />
      </td>
      <td>
        <StatusSelect
          labels={shippingStatusLabels}
          onChange={setShippingStatus}
          options={shippingOptions}
          value={shippingStatus}
        />
      </td>
      <td>
        <input
          className="min-w-36"
          onChange={(event) => setTrackingNumber(event.target.value)}
          placeholder="JC..."
          value={trackingNumber}
        />
      </td>
      <td>
        <div className="flex min-w-56 gap-2">
          <input onChange={(event) => setNotes(event.target.value)} placeholder="note" value={notes} />
          <button
            className="btn btn-secondary"
            onClick={() => onSave(request.request_no, requestStatus, notes)}
            type="button"
          >
            บันทึกคำขอ
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onShipping(request.request_no, shippingStatus, trackingNumber)}
            type="button"
          >
            อัปเดตขนส่ง
          </button>
        </div>
      </td>
    </tr>
  );
}

function StatusSelect({ labels, onChange, options, value }) {
  return (
    <div className="status-cell">
      <span className="status-current">{labels[value] || value || "-"}</span>
      <select onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((status) => (
          <option key={status} value={status}>
            {labels[status] || status}
          </option>
        ))}
      </select>
    </div>
  );
}
