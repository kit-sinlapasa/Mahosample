import { useState } from "react";
import { Link } from "react-router-dom";

import { apiClient } from "../../api/client";

const shippingStatusLabels = {
  not_ready: "ยังไม่พร้อมจัดส่ง",
  ready_to_ship: "เตรียมจัดส่ง",
  shipped: "จัดส่งแล้ว",
  delivered: "นำจ่ายสำเร็จ",
  failed: "จัดส่งไม่สำเร็จ",
};

const requestStatusLabels = {
  pending: "รอตรวจสอบ",
  approved: "อนุมัติแล้ว",
  rejected: "ไม่ผ่านเงื่อนไข",
  packed: "แพ็กสินค้าแล้ว",
  shipped: "จัดส่งแล้ว",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};

const trackingSteps = [
  ["accepted", "รับเข้าระบบ"],
  ["in_transit", "ระหว่างขนส่ง"],
  ["out_for_delivery", "ออกไปนำจ่าย"],
  ["delivered", "นำจ่ายสำเร็จ"],
];

const shippingProgress = {
  not_ready: 0,
  ready_to_ship: 1,
  shipped: 2,
  delivered: 4,
  failed: 2,
};

function buildLocalEvents(tracking) {
  if (!tracking?.tracking_number) {
    return [];
  }

  const events = [
    {
      title: "ระบบบันทึกเลข tracking แล้ว",
      detail: `เลข tracking ${tracking.tracking_number} พร้อมสำหรับตรวจสอบสถานะ`,
    },
  ];

  if (["shipped", "delivered", "failed"].includes(tracking.shipping_status)) {
    events.unshift({
      title:
        tracking.shipping_status === "delivered"
          ? "นำจ่ายสำเร็จ"
          : "พัสดุอยู่ระหว่างกระบวนการจัดส่ง",
      detail:
        tracking.shipping_status === "delivered"
          ? "ระบบบันทึกสถานะว่าส่งถึงผู้รับแล้ว"
          : "ระบบบันทึกสถานะจัดส่งแล้ว รอรายละเอียดเพิ่มเติมจากไปรษณีย์ไทย",
    });
  }

  return events;
}

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

  const progressCount = tracking ? shippingProgress[tracking.shipping_status] || 0 : 0;
  const localEvents = buildLocalEvents(tracking);

  return (
    <main className="public-page min-h-screen text-zinc-950">
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
            <div className="tracking-result mt-5">
              <div className="tracking-summary">
                <div>
                  <p className="eyebrow">Thailand Post Tracking</p>
                  <h2>{tracking.tracking_number}</h2>
                  <p className="mt-2 text-sm text-zinc-600">
                    เลขรายการภายใน: {tracking.request_no}
                  </p>
                </div>
                <div className="tracking-status-pill">
                  {shippingStatusLabels[tracking.shipping_status] || tracking.shipping_status}
                </div>
              </div>

              <dl className="tracking-meta">
                <div>
                  <dt>สถานะคำขอ</dt>
                  <dd>{requestStatusLabels[tracking.request_status] || tracking.request_status}</dd>
                </div>
                <div>
                  <dt>สถานะขนส่งในระบบ</dt>
                  <dd>{shippingStatusLabels[tracking.shipping_status] || tracking.shipping_status}</dd>
                </div>
              </dl>

              <ol className="tracking-steps">
                {trackingSteps.map(([stepKey, label], index) => {
                  const completed = index < progressCount;
                  const current = index === Math.max(progressCount - 1, 0);
                  return (
                    <li
                      className={[
                        "tracking-step",
                        completed ? "is-complete" : "",
                        current && completed ? "is-current" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      key={stepKey}
                    >
                      <span>{index + 1}</span>
                      <p>{label}</p>
                    </li>
                  );
                })}
              </ol>

              <section className="tracking-timeline">
                <h2>รายละเอียดการจัดส่ง</h2>
                {localEvents.length > 0 ? (
                  <ol>
                    {localEvents.map((event) => (
                      <li key={`${event.title}-${event.detail}`}>
                        <strong>{event.title}</strong>
                        <p>{event.detail}</p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p>ยังไม่มีเลข tracking ในระบบ</p>
                )}
                <p className="mt-4 text-xs leading-5 text-zinc-500">
                  รายละเอียดรายจุด เช่น ศูนย์คัดแยก ปลายทาง เวลาโทรติดต่อ
                  และผลการนำจ่าย จะแสดงในส่วนนี้หลังเชื่อม Thailand Post API
                  หรือมีการ import ข้อมูล timeline เข้าระบบ
                </p>
              </section>

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
