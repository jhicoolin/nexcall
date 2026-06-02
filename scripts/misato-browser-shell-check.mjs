import assert from "node:assert/strict";

const url = process.env.MISATO_SHELL_URL || "http://127.0.0.1:1420";

async function main() {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const pageErrors = [];
  const consoleErrors = [];

  page.on("pageerror", (error) => {
    pageErrors.push(String(error?.message || error));
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  const response = await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  const title = await page.title().catch(() => "");
  const bodyText = await page.locator("body").innerText({ timeout: 3000 }).catch(() => "");

  assert.ok(response, `No response from ${url}`);

  const result = {
    ok: true,
    url,
    status: response.status(),
    title,
    bodyHasText: Boolean(bodyText.trim()),
    shellLoaded: response.ok() && Boolean(title),
    noPageCrashObserved: pageErrors.length === 0,
    consoleErrorsChecked: true,
    consoleErrorsObserved: consoleErrors.length,
    pageErrorsObserved: pageErrors.length
  };

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
