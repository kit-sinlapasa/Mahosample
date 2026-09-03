import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
const dashboardColors = ["#25347c", "#d68019", "#4f7f33", "#8a5f2d", "#64748b", "#9f1239"];
const healthInterestLabels = {
  immune_support: "ภูมิคุ้มกัน",
  gut_health: "ลำไส้/ขับถ่าย",
  recovery: "พักผ่อน/ฟื้นตัว",
  senior_health: "ผู้สูงอายุ",
  general_health: "ทั่วไป",
  other: "อื่น ๆ",
};
const contactChannelLabels = {
  phone: "โทรศัพท์",
  line: "LINE",
  messenger: "Messenger",
};
const quickRanges = [
  { label: "7 วัน", days: 7 },
  { label: "30 วัน", days: 30 },
  { label: "90 วัน", days: 90 },
  { label: "ทั้งหมด", days: null },
];
const dashboardRequestLimit = 100;

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

function hasTrackingNumber(request) {
  return Boolean(request.tracking_number?.trim());
}

function toInputDate(date) {
  return date.toISOString().slice(0, 10);
}

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  return { from: toInputDate(start), to: toInputDate(end) };
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isWithinDateRange(value, from, to) {
  const date = parseDate(value);
  if (!date) return false;
  if (from && date < new Date(`${from}T00:00:00`)) return false;
  if (to && date > new Date(`${to}T23:59:59.999`)) return false;
  return true;
}

function countBy(items, key) {
  return items.reduce((counts, item) => {
    const value = item[key] || "-";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function toChartRows(counts, labels = {}) {
  return Object.entries(counts)
    .map(([key, value]) => ({ key, name: labels[key] || key, value }))
    .sort((left, right) => right.value - left.value);
}

function toDailyRegistrationRows(items) {
  const counts = items.reduce((current, item) => {
    const date = item.created_at?.slice(0, 10) || "-";
    current[date] = (current[date] || 0) + 1;
    return current;
  }, {});
  return Object.entries(counts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, value]) => ({ date: date.slice(5), value }));
}

function getPercent(value, total) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function averageDaysToShip(items) {
  const durations = items
    .map((item) => {
      const createdAt = parseDate(item.created_at);
      const shippedAt = parseDate(item.shipped_at);
      if (!createdAt || !shippedAt) return null;
      return (shippedAt - createdAt) / (1000 * 60 * 60 * 24);
    })
    .filter((value) => value !== null && value >= 0);

  if (!durations.length) return "-";
  const average = durations.reduce((sum, value) => sum + value, 0) / durations.length;
  return `${average.toFixed(1)} วัน`;
}

export default function StaffApp() {
  const [token, setToken] = useState(() => localStorage.getItem("mahosample_token") || "");
  const [email, setEmail] = useState("admin@mahosample.com");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [summary, setSummary] = useState(null);
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: "request_no", direction: "desc" });
  const [dateRange, setDateRange] = useState(getDefaultDateRange);

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const dashboardRequests = useMemo(
    () =>
      requests.filter((request) =>
        isWithinDateRange(request.created_at, dateRange.from, dateRange.to),
      ),
    [dateRange, requests],
  );
  const dashboardData = useMemo(() => {
    const total = dashboardRequests.length;
    const pending = dashboardRequests.filter((request) => request.request_status === "pending").length;
    const readyToShip = dashboardRequests.filter(
      (request) => request.shipping_status === "ready_to_ship",
    ).length;
    const shipped = dashboardRequests.filter((request) => request.shipping_status === "shipped").length;
    const delivered = dashboardRequests.filter(
      (request) => request.shipping_status === "delivered",
    ).length;
    const missingTracking = dashboardRequests.filter((request) => !hasTrackingNumber(request)).length;
    const topProvince = toChartRows(countBy(dashboardRequests, "province"))[0];
    const topHealthInterest = toChartRows(
      countBy(dashboardRequests, "health_interest"),
      healthInterestLabels,
    )[0];

    return {
      total,
      pending,
      readyToShip,
      shipped,
      delivered,
      missingTracking,
      deliveryRate: getPercent(shipped + delivered, total),
      missingTrackingRate: getPercent(missingTracking, total),
      averageShipTime: averageDaysToShip(dashboardRequests),
      dailyRows: toDailyRegistrationRows(dashboardRequests),
      requestStatusRows: toChartRows(countBy(dashboardRequests, "request_status"), requestStatusLabels),
      shippingStatusRows: toChartRows(
        countBy(dashboardRequests, "shipping_status"),
        shippingStatusLabels,
      ),
      provinceRows: toChartRows(countBy(dashboardRequests, "province")).slice(0, 8),
      healthInterestRows: toChartRows(
        countBy(dashboardRequests, "health_interest"),
        healthInterestLabels,
      ).slice(0, 8),
      contactRows: toChartRows(
        countBy(dashboardRequests, "preferred_contact_channel"),
        contactChannelLabels,
      ),
      topProvince: topProvince?.name || "-",
      topHealthInterest: topHealthInterest?.name || "-",
      urgentRows: dashboardRequests
        .filter(
          (request) =>
            request.request_status === "pending" ||
            request.shipping_status === "ready_to_ship" ||
            !hasTrackingNumber(request),
        )
        .slice(0, 8),
    };
  }, [dashboardRequests]);
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
      const summaryResponse = await apiClient.get("/api/admin/dashboard/summary", {
        headers: authHeaders,
      });
      const allItems = [];
      let total = 0;
      let offset = 0;
      do {
        const requestResponse = await apiClient.get(
          `/api/admin/sample-requests?offset=${offset}&limit=${dashboardRequestLimit}`,
          { headers: authHeaders },
        );
        total = requestResponse.data.total;
        allItems.push(...requestResponse.data.items);
        offset += dashboardRequestLimit;
      } while (allItems.length < total);
      setSummary(summaryResponse.data);
      setRequests(allItems);
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

  function applyQuickRange(days) {
    if (!days) {
      setDateRange({ from: "", to: "" });
      return;
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    setDateRange({ from: toInputDate(start), to: toInputDate(end) });
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
            <h1 className="text-xl">Dynamic Dashboard</h1>
          </div>
          <button className="btn btn-secondary" onClick={logout} type="button">
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <section className="surface">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow">Live Insight</p>
              <h2>ภาพรวมตามช่วงเวลา</h2>
              <p className="mt-2 text-sm text-zinc-600">
                กรองข้อมูลจากวันที่ลงทะเบียน เพื่อดูแนวโน้มคำขอและงานจัดส่งที่ต้องทำต่อ
              </p>
            </div>
            <div className="dashboard-date-controls">
              <label>
                <span>จากวันที่</span>
                <input
                  onChange={(event) =>
                    setDateRange((current) => ({ ...current, from: event.target.value }))
                  }
                  type="date"
                  value={dateRange.from}
                />
              </label>
              <label>
                <span>ถึงวันที่</span>
                <input
                  onChange={(event) =>
                    setDateRange((current) => ({ ...current, to: event.target.value }))
                  }
                  type="date"
                  value={dateRange.to}
                />
              </label>
              <div className="quick-range-group" aria-label="เลือกช่วงเวลาเร็ว">
                {quickRanges.map((range) => (
                  <button
                    className="btn btn-secondary"
                    key={range.label}
                    onClick={() => applyQuickRange(range.days)}
                    type="button"
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="ลงทะเบียนในช่วงนี้" value={dashboardData.total} detail={`ทั้งหมดในระบบ ${summary?.total_requests ?? requests.length} รายการ`} />
          <Metric label="รอตรวจสอบ" value={dashboardData.pending} detail="ควรตรวจสิทธิ์ก่อนส่งออก" tone="amber" />
          <Metric label="ยังไม่มี Tracking" value={dashboardData.missingTracking} detail={`${dashboardData.missingTrackingRate} ของช่วงนี้`} tone="rose" />
          <Metric label="ส่งแล้ว/นำจ่ายแล้ว" value={dashboardData.deliveryRate} detail={`เวลาเฉลี่ยถึงส่ง ${dashboardData.averageShipTime}`} tone="green" />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <ChartCard title="แนวโน้มลงทะเบียนรายวัน" subtitle="จำนวนคำขอที่เข้ามาในแต่ละวัน">
            <ResponsiveContainer height={260} width="100%">
              <LineChart data={dashboardData.dailyRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  dataKey="value"
                  name="ลงทะเบียน"
                  stroke="#25347c"
                  strokeWidth={3}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="สัดส่วนสถานะคำขอ" subtitle="ช่วยเห็นคิวที่ติดอยู่ในแต่ละขั้น">
            <ResponsiveContainer height={260} width="100%">
              <PieChart>
                <Pie
                  data={dashboardData.requestStatusRows}
                  dataKey="value"
                  innerRadius={58}
                  nameKey="name"
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {dashboardData.requestStatusRows.map((entry, index) => (
                    <Cell fill={dashboardColors[index % dashboardColors.length]} key={entry.key} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="สถานะขนส่ง" subtitle="ติดตามงานพร้อมส่งและงานที่จัดส่งแล้ว">
            <ResponsiveContainer height={250} width="100%">
              <BarChart data={dashboardData.shippingStatusRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#25347c" name="จำนวน" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="จังหวัดที่มีคำขอสูงสุด" subtitle={`อันดับหนึ่ง: ${dashboardData.topProvince}`}>
            <ResponsiveContainer height={250} width="100%">
              <BarChart data={dashboardData.provinceRows} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis allowDecimals={false} type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={86} />
                <Tooltip />
                <Bar dataKey="value" fill="#d68019" name="จำนวน" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="ความสนใจสุขภาพ" subtitle={`สนใจมากสุด: ${dashboardData.topHealthInterest}`}>
            <ResponsiveContainer height={250} width="100%">
              <BarChart data={dashboardData.healthInterestRows} layout="vertical" margin={{ left: 18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis allowDecimals={false} type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={92} />
                <Tooltip />
                <Bar dataKey="value" fill="#4f7f33" name="จำนวน" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <section className="surface">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2>Insight ที่ควรใช้ต่อ</h2>
                <p className="mt-1 text-sm text-zinc-600">ข้อมูลสรุปสำหรับวางแผนงานประจำวัน</p>
              </div>
              <button className="btn btn-secondary" onClick={loadDashboard} type="button">
                {loading ? "กำลังโหลด..." : "Refresh"}
              </button>
            </div>
            <div className="insight-list">
              <InsightItem
                label="ช่องทางติดต่อยอดนิยม"
                value={dashboardData.contactRows[0]?.name || "-"}
                detail="ใช้เลือกช่องทางแจ้งเลข tracking ให้ลูกค้า"
              />
              <InsightItem
                label="จังหวัดคำขอสูงสุด"
                value={dashboardData.topProvince}
                detail="ใช้ประเมินพื้นที่ที่มี demand สูง"
              />
              <InsightItem
                label="รายการพร้อมส่ง"
                value={`${dashboardData.readyToShip} รายการ`}
                detail="ควร export หรือเตรียมจัดส่งต่อ"
              />
              <InsightItem
                label="รายการไม่มี tracking"
                value={`${dashboardData.missingTracking} รายการ`}
                detail="ควรตรวจหลัง import ไฟล์ tracking"
              />
            </div>
          </section>

          <section className="surface">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2>งานที่ควรดำเนินการ</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  แสดงรายการที่รอตรวจสอบ พร้อมส่ง หรือยังไม่มีเลข tracking
                </p>
              </div>
              <Link className="btn btn-secondary" to="/staff/requests">
                เปิดตารางข้อมูลเต็ม
              </Link>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="data-table compact-action-table">
                <thead>
                  <tr>
                    <th>เลขรายการ</th>
                    <th>ลูกค้า</th>
                    <th>จังหวัด</th>
                    <th>คำขอ</th>
                    <th>ขนส่ง</th>
                    <th>Tracking</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.urgentRows.map((request) => (
                    <tr key={request.request_no}>
                      <td>{request.request_no}</td>
                      <td>{request.full_name}</td>
                      <td>{request.province}</td>
                      <td>{requestStatusLabels[request.request_status] || request.request_status}</td>
                      <td>{shippingStatusLabels[request.shipping_status] || request.shipping_status}</td>
                      <td>{request.tracking_number || "-"}</td>
                    </tr>
                  ))}
                  {dashboardData.urgentRows.length === 0 && (
                    <tr>
                      <td className="empty-table-cell" colSpan={6}>
                        ไม่มีรายการเร่งด่วนในช่วงเวลานี้
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>

        <section className="surface">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2>รายการลงทะเบียนสำหรับแก้เร็ว</h2>
              <p className="mt-1 text-sm text-zinc-600">
                ใช้บันทึกคำขอหรืออัปเดตขนส่งจากหน้าหลักได้ทันที
              </p>
            </div>
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

function Metric({ detail, label, tone = "blue", value }) {
  return (
    <div className={`metric metric-${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      {detail && <span>{detail}</span>}
    </div>
  );
}

function ChartCard({ children, subtitle, title }) {
  return (
    <section className="surface chart-card">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="chart-frame">{children}</div>
    </section>
  );
}

function InsightItem({ detail, label, value }) {
  return (
    <div className="insight-item">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </div>
  );
}

function StaffRow({ request, onSave, onShipping }) {
  const [requestStatus, setRequestStatus] = useState(request.request_status);
  const [shippingStatus, setShippingStatus] = useState(request.shipping_status);
  const [trackingNumber, setTrackingNumber] = useState(request.tracking_number || "");
  const [notes, setNotes] = useState(request.notes || "");

  return (
    <tr className={hasTrackingNumber(request) ? undefined : "missing-tracking-row"}>
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
