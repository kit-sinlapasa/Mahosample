import { useState } from "react";
import { Link } from "react-router-dom";

import { apiClient } from "../../api/client";

export default function TrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [tracking, setTracking] = useState(null);
  const [trackingError, setTrackingError] = useState("");

  async function checkTracking(event) {
    event.preventDefault();
    setTracking(null);
    setTrackingError("");
    try {
      const response = await apiClient.get(
        `/api/public/tracking-number/${trackingNumber.trim()}`,
      );
      setTracking(response.data);
    } catch {
      setTrackingError("ไม่พบเลข tracking นี้ในระบบ");
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div>
            <p className="eyebrow">Mahosample</p>
            <h1 className="text-xl font-bold">ติดตามพัสดุ</h1>
          </div>
          <Link className="btn btn-secondary" to="/">
            กลับไปฟอร์ม
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        <section className="surface">
          <h2>ตรวจสอบสถานะด้วยเลข tracking</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            เมื่อลูกค้าได้รับเลข tracking จากเจ้าหน้าที่ทาง LINE ID หรือ Facebook Messenger
            สามารถนำเลขนั้นมาตรวจในระบบ หรือกดลิงก์ไปหน้า Thailand Post ได้
          </p>

          <form className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={checkTracking}>
            <label className="field">
              <span>เลข tracking ไปรษณีย์</span>
              <input
                onChange={(event) => setTrackingNumber(event.target.value)}
                placeholder="เช่น JC012366689TH"
                required
                value={trackingNumber}
              />
            </label>
            <button className="btn btn-primary self-end" type="submit">
              เช็คสถานะ
            </button>
          </form>

          {trackingError && <p className="alert error mt-4">{trackingError}</p>}
          {tracking && (
            <div className="mt-5 rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm">
              <p className="font-semibold">เลข tracking: {tracking.tracking_number}</p>
              <p className="mt-2">สถานะคำขอ: {tracking.request_status}</p>
              <p>สถานะขนส่งในระบบ: {tracking.shipping_status}</p>
              {tracking.tracking_url && (
                <a className="link" href={tracking.tracking_url} rel="noreferrer" target="_blank">
                  เปิดหน้า Thailand Post
                </a>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
