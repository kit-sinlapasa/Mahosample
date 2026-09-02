import { useEffect, useMemo, useState } from "react";

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

function getDownloadFilename(response, fallback) {
  const disposition = response.headers["content-disposition"];
  const filenameMatch = disposition?.match(/filename="?([^"]+)"?/i);
  return filenameMatch?.[1] || fallback;
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

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

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
            <input onChange={(event) => setEmail(event.target.value)} value={email} />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              onChange={(event) => setPassword(event.target.value)}
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
              accept=".csv,text/csv"
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
                  <th>เลขรายการ</th>
                  <th>ลูกค้า</th>
                  <th>โทร</th>
                  <th>จังหวัด</th>
                  <th>คำขอ</th>
                  <th>ขนส่ง</th>
                  <th>Tracking</th>
                  <th>บันทึก</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <StaffRow
                    key={request.request_no}
                    onSave={updateRequest}
                    onShipping={updateShipping}
                    request={request}
                  />
                ))}
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
        <select onChange={(event) => setRequestStatus(event.target.value)} value={requestStatus}>
          {statusOptions.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </td>
      <td>
        <select onChange={(event) => setShippingStatus(event.target.value)} value={shippingStatus}>
          {shippingOptions.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
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
            Save
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onShipping(request.request_no, shippingStatus, trackingNumber)}
            type="button"
          >
            Ship
          </button>
        </div>
      </td>
    </tr>
  );
}
