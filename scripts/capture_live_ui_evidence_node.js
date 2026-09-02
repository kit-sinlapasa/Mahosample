const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const baseUrl = process.env.MAHO_BASE_URL || "http://maho.kitaith.com:18080";
const email = process.env.MAHO_STAFF_EMAIL || "admin@mahosample.com";
const password = process.env.MAHO_STAFF_PASSWORD;
if (!password) {
  throw new Error("MAHO_STAFF_PASSWORD is required");
}

const root = process.cwd();
const outDir = path.join(root, "outputs", "e2e-evidence", "screenshots");
fs.mkdirSync(outDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
const shots = [];
let capturedRequestNo = null;

async function screenshot(page, name, fullPage = true) {
  const file = path.join(outDir, `${stamp}-${name}.png`);
  await page.screenshot({ path: file, fullPage });
  shots.push({ name, file });
}

async function fillRegistration(page, prefix) {
  const suffix = Date.now().toString().slice(-7);
  await page.locator('input[name="full_name"]').fill(`ทดสอบระบบ UI Evidence ${prefix}`);
  await page.locator('input[name="phone"]').fill(`083${suffix}`);
  await page.locator('input[name="line_id"]').fill(`maho-ui-${prefix.toLowerCase()}-${suffix}`);
  await page.locator('select[name="age_range"]').selectOption("40-49");
  await page.locator('select[name="health_interest"]').selectOption("immune_support");
  await page.locator('select[name="maho_experience"]').selectOption("never");
  await page.locator('input[name="recipient_name"]').fill(`ทดสอบระบบ UI Evidence ${prefix}`);
  await page.locator('input[name="address_line1"]').fill(`${suffix}/1 ซอยทดสอบ`);
  await page.locator('input[name="address_line2"]').fill("อาคารหลักฐาน");
  await page.locator('input[name="subdistrict"]').fill("บางรัก");
  await page.locator('input[name="district"]').fill("บางรัก");
  await page.locator('input[name="province"]').fill("กรุงเทพมหานคร");
  await page.locator('input[name="postal_code"]').fill("10500");
  await page.locator('input[name="pdpa_consent"]').check();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1440, height: 1100 },
  });
  const page = await context.newPage();
  try {

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await screenshot(page, "public-registration-form");

  await page.locator('input[name="full_name"]').fill("ทดสอบระบบ UI Validation");
  await page.locator('input[name="phone"]').fill("0812345678");
  await page.locator('input[name="recipient_name"]').fill("ทดสอบระบบ UI Validation");
  await page.locator('input[name="address_line1"]').fill("1 ซอยทดสอบ");
  await page.locator('input[name="subdistrict"]').fill("บางรัก");
  await page.locator('input[name="district"]').fill("บางรัก");
  await page.locator('input[name="province"]').fill("กรุงเทพมหานคร");
  await page.locator('input[name="postal_code"]').fill("10500");
  await page.locator('input[name="pdpa_consent"]').check();
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(700);
  await screenshot(page, "public-contact-validation");

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await fillRegistration(page, "SUCCESS");
  await page.locator('button[type="submit"]').click();
  await page.getByText("ลงทะเบียนสำเร็จ").waitFor({ timeout: 15000 });
  const requestNoText = await page.locator("body").textContent();
  const requestNo = (requestNoText.match(/MS\d{12}/) || [null])[0];
  capturedRequestNo = requestNo;
  await screenshot(page, "public-success-card");

  await page.goto(`${baseUrl}/tracking`, { waitUntil: "networkidle" });
  await page.getByPlaceholder("เช่น JC012366689TH").fill("JC012366691TH");
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(1200);
  await screenshot(page, "tracking-found");

  await page.goto(`${baseUrl}/tracking`, { waitUntil: "networkidle" });
  await page.getByPlaceholder("เช่น JC012366689TH").fill(`JC${stamp.slice(-9)}XX`);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(800);
  await screenshot(page, "tracking-not-found");

  await page.goto(`${baseUrl}/staff`, { waitUntil: "networkidle" });
  if (await page.getByLabel("Email").count()) {
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1500);
  }
  await screenshot(page, "staff-dashboard");

  await page.goto(`${baseUrl}/staff/requests`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await screenshot(page, "staff-full-table");

  const provinceFilter = page.getByLabel("filter จังหวัด").first();
  if (await provinceFilter.count()) {
    await provinceFilter.fill("กรุงเทพมหานคร");
    await page.waitForTimeout(800);
  }
  await screenshot(page, "staff-filter-province");

  const registrationDateInputs = await page.locator('input[type="date"]').all();
  if (registrationDateInputs.length >= 3) {
    await registrationDateInputs[2].fill("2026-09-02");
    await registrationDateInputs[3].fill("2026-09-02");
    await page.waitForTimeout(800);
  }
  await screenshot(page, "staff-date-range-filter");

  await page.locator(".table-sort-button").first().click();
  await page.waitForTimeout(500);
  await screenshot(page, "staff-sorting");

  await page.locator("tbody tr").first().click();
  await page.waitForTimeout(800);
  await screenshot(page, "staff-detail-drawer");

  const trackingLink = page.locator('a[href*="track.thailandpost.co.th"]').first();
  if (await trackingLink.count()) {
    await trackingLink.scrollIntoViewIfNeeded();
  }
  await screenshot(page, "staff-tracking-url-link");

  await page.goto(`${baseUrl}/staff`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 10000 }).catch(() => null),
    page.getByText("Export Tracking ว่าง").click().catch(() => null),
  ]);
  if (download) {
    const suggested = download.suggestedFilename();
    await download.saveAs(path.join(root, "outputs", "e2e-evidence", suggested));
  }
  await screenshot(page, "staff-export");

  } finally {
    if (capturedRequestNo) {
      try {
        const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          await fetch(`${baseUrl}/api/admin/sample-requests/${capturedRequestNo}`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${loginData.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              request_status: "cancelled",
              notes: `ข้อมูลทดสอบ UI evidence ${stamp} - แยกออกจากงานจริง`,
            }),
          });
        }
      } catch (error) {
        console.error("cleanup failed", error);
      }
    }
    await browser.close();
  }
  console.log(JSON.stringify({ stamp, requestNo: capturedRequestNo, screenshots: shots }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
