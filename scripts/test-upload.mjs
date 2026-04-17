import { chromium } from "@playwright/test";

const PDF_PATH = "/Users/admin/conductor/workspaces/help-courses/managua/.context/attachments/Francais_CME2_Conjugaison.pdf";
const EMAIL = "prof.test@jotnaschool.app";
const PASSWORD = "prof123456";

(async () => {
  const context = await chromium.launchPersistentContext(
    "/tmp/pw-test-" + Date.now(),
    { headless: true, ignoreHTTPSErrors: true },
  );
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const browser = { close: () => context.close() };

  page.on("console", (msg) => {
    if (msg.type() === "error") console.log("[browser error]", msg.text());
  });

  console.log("→ Navigating to /login");
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.waitForSelector('input[type="email"]', { timeout: 30000 });
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);

  console.log("URL after login:", page.url());
  const errText = await page.locator(".bg-red-50").textContent().catch(() => null);
  if (errText) console.log("Login error shown:", errText);

  if (!page.url().includes("/teacher")) {
    const uniq = Date.now();
    const regEmail = `prof.${uniq}@jotnaschool.app`;
    console.log("→ Registering new account:", regEmail);
    await page.goto("http://localhost:3000/register");
    await page.waitForSelector('input[type="email"]');
    await page.locator('input[type="text"]').fill("Prof Upload Test");
    await page.locator('input[type="email"]').fill(regEmail);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.locator("select").selectOption("professeur");
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(5000);
    console.log("URL after register:", page.url());
    const regErr = await page.locator(".bg-red-50").textContent().catch(() => null);
    if (regErr) console.log("Register error:", regErr);
  }

  console.log("→ Waiting for /teacher page");
  await page.waitForURL(/\/teacher/, { timeout: 30000 });

  console.log("→ Navigating to /teacher/pdf-uploads");
  await page.goto("http://localhost:3000/teacher/pdf-uploads");
  await page.waitForSelector("#subject-select");

  console.log("→ Selecting 'Français'");
  await page.selectOption("#subject-select", { label: "Français" });

  console.log("→ Uploading PDF:", PDF_PATH);
  await page.setInputFiles("#pdf-file-input", PDF_PATH);

  console.log("→ Waiting for upload to complete");
  // wait until upload progress disappears or a row appears in the table
  await page.waitForSelector("table tbody tr", { timeout: 30000 });

  const rowText = await page.locator("table tbody tr").first().innerText();
  console.log("→ Row content:", rowText);

  console.log("→ Waiting up to 60s for extraction to finish…");
  const start = Date.now();
  let lastStatus = "";
  while (Date.now() - start < 60000) {
    const text = await page.locator("table tbody tr").first().innerText();
    const statusMatch = text.match(/(En cours|Extrait|Erreur|Relu|Publié)/);
    const status = statusMatch ? statusMatch[1] : "";
    if (status !== lastStatus) {
      console.log(`   status = ${status} (${Math.round((Date.now() - start) / 1000)}s)`);
      lastStatus = status;
    }
    if (status === "Extrait" || status === "Erreur") break;
    await page.waitForTimeout(2000);
  }

  const finalText = await page.locator("table tbody tr").first().innerText();
  console.log("→ Final row:", finalText);

  await browser.close();
})().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
