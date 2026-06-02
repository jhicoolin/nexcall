/**
 * MISATO Process Watcher
 *
 * Reports whether the local runtime stack is cleanly owned by a single dev
 * server/build process and whether the canonical runtime port is reachable.
 * This is a reporting tool, not an automatic killer.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { checkEntry, buildReport } from "./misato-check-schema.mjs";

const execFileAsync = promisify(execFile);
const BASE = (process.env.MISATO_RUNTIME_ORIGIN || "http://127.0.0.1:3010").replace(/\/+$/, "");

async function getWindowsProcessTable() {
  const ps = [
    "$procs = Get-CimInstance Win32_Process | Where-Object {",
    "  $_.Name -eq 'node.exe' -and ($_.CommandLine -like '*nexcall*' -or $_.CommandLine -like '*next dev*' -or $_.CommandLine -like '*next build*' -or $_.CommandLine -like '*tauri dev*' -or $_.CommandLine -like '*desktop:dev*' -or $_.CommandLine -like '*desktop-ui:dev*')",
    "};",
    "$procs | Select-Object ProcessId,CommandLine | ConvertTo-Json -Depth 3"
  ].join(" ");
  const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-Command", ps], { windowsHide: true, maxBuffer: 1024 * 1024 });
  if (!stdout.trim()) return [];
  const parsed = JSON.parse(stdout);
  return Array.isArray(parsed) ? parsed : [parsed];
}

async function probeRuntime() {
  try {
    const res = await fetch(`${BASE}/api/misato/status`, { headers: { accept: "application/json" } });
    const ct = res.headers.get("content-type") || "";
    const text = await res.text();
    if (!res.ok || !ct.includes("application/json")) return { ok: false, status: res.status, ct, textSnippet: text.slice(0, 160) };
    return { ok: true, status: res.status, ct, textSnippet: text.slice(0, 160) };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}

async function main() {
  const checks = [];
  const processes = await getWindowsProcessTable().catch((err) => {
    checks.push(checkEntry(
      "process-watcher",
      "process-table",
      "failed",
      { error: err?.message || String(err) },
      `Could not inspect Windows process table: ${err?.message || String(err)}`
    ));
    return [];
  });

  const wrapperLike = processes.filter((p) => String(p.CommandLine || "").includes("misato-dev-server.cjs"));
  const nextDevLike = processes.filter((p) => String(p.CommandLine || "").includes("next\\dist\\bin\\next dev") || String(p.CommandLine || "").includes("next/dist/bin/next dev"));
  const startServerLike = processes.filter((p) => String(p.CommandLine || "").includes("start-server.js"));
  const buildLike = processes.filter((p) => String(p.CommandLine || "").includes("next build"));
  const duplicateDev = wrapperLike.length > 1 || nextDevLike.length > 1 || startServerLike.length > 1;
  const duplicateBuild = buildLike.length > 1;
  const runtime = await probeRuntime();

  checks.push(checkEntry(
    "process-watcher",
    "dev-processes",
    duplicateDev ? "failed" : "verified",
    {
      wrapperCount: wrapperLike.length,
      nextDevCount: nextDevLike.length,
      startServerCount: startServerLike.length,
      processIds: [...wrapperLike, ...nextDevLike, ...startServerLike].map((p) => p.ProcessId),
      processes: [...wrapperLike, ...nextDevLike, ...startServerLike].slice(0, 6)
    },
    duplicateDev
      ? `Multiple dev stack processes found (wrapper:${wrapperLike.length}, next:${nextDevLike.length}, start-server:${startServerLike.length}).`
      : `Dev stack is stable (wrapper:${wrapperLike.length}, next:${nextDevLike.length}, start-server:${startServerLike.length}).`
  ));

  checks.push(checkEntry(
    "process-watcher",
    "build-processes",
    duplicateBuild ? "failed" : "verified",
    { count: buildLike.length, processIds: buildLike.map((p) => p.ProcessId), processes: buildLike.slice(0, 4) },
    duplicateBuild
      ? `Multiple build processes found (${buildLike.length}).`
      : `Build process count is stable (${buildLike.length}).`
  ));

  checks.push(checkEntry(
    "process-watcher",
    "runtime-port",
    runtime.ok ? "verified" : "unverified",
    runtime,
    runtime.ok
      ? `Runtime API reachable on canonical origin ${BASE}.`
      : `Runtime API not confirmed on ${BASE}.`
  ));

  const failed = checks.filter((c) => c.result === "failed");
  const unverified = checks.filter((c) => c.result === "unverified");
  const humanReadable = failed.length > 0
    ? `Process watcher FAILED: ${failed.length} issue(s) found.`
    : unverified.length > 0
      ? `Process watcher PARTIALLY VERIFIED: runtime port unverified, process table healthy.`
      : `Process watcher PASS: single-process runtime looks healthy and the canonical port responds.`;

  const report = buildReport(checks, humanReadable, {
    runtimeOrigin: BASE,
    note: "This watcher only observes and reports. It does not terminate processes."
  });

  console.log(JSON.stringify(report, null, 2));
  if (failed.length > 0) process.exitCode = 1;
}

main().catch((err) => {
  const report = buildReport(
    [checkEntry("process-watcher", "runner", "failed", { error: err?.stack || err?.message || String(err) }, "Unexpected process watcher failure.")],
    `Process watcher aborted: ${err?.message || String(err)}`,
    { runtimeOrigin: BASE }
  );
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = 1;
});
