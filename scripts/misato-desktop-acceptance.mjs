import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { buildReport, checkEntry } from "./misato-check-schema.mjs";

const root = process.cwd();
const isWindows = process.platform === "win32";
const exePath = path.join(root, "src-tauri", "target", "release", "misato-desktop.exe");
const installerPath = path.join(root, "src-tauri", "target", "release", "bundle", "nsis", "MISATO_0.1.0_x64-setup.exe");
const mainRsPath = path.join(root, "src-tauri", "src", "main.rs");
const tauriConfigPath = path.join(root, "src-tauri", "tauri.conf.json");

function exists(filePath) {
  return fs.existsSync(filePath);
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function sleep(ms) {
  const shared = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(shared, 0, 0, ms);
}

function tasklistCount() {
  if (!isWindows) return { supported: false, count: 0, raw: "non-windows host" };
  const result = spawnSync("powershell", [
    "-NoProfile",
    "-Command",
    "$count = @(Get-Process misato-desktop -ErrorAction SilentlyContinue).Count; Write-Output $count"
  ], { encoding: "utf8" });
  const raw = `${result.stdout || ""}${result.stderr || ""}`.trim();
  if (result.status !== 0) {
    return { supported: true, count: 0, raw, error: result.error?.message || null };
  }
  if (!raw) {
    return { supported: true, count: 0, raw };
  }
  const parsed = Number.parseInt(raw, 10);
  return { supported: true, count: Number.isFinite(parsed) ? parsed : 0, raw };
}

function launchSecondInstance() {
  if (!isWindows) {
    return { supported: false, launched: false, raw: "non-windows host" };
  }
  if (!exists(exePath)) {
    return { supported: true, launched: false, raw: "desktop exe missing" };
  }
  const result = spawnSync("powershell", [
    "-NoProfile",
    "-Command",
    `Start-Process -FilePath "${exePath.replace(/"/g, '""')}"`
  ], { encoding: "utf8" });
  return {
    supported: true,
    launched: result.status === 0,
    raw: `${result.stdout || ""}${result.stderr || ""}`.trim(),
    status: result.status,
    error: result.error?.message || null
  };
}

const tauriConfig = JSON.parse(readText(tauriConfigPath));
const mainRs = readText(mainRsPath);
const acceptsInteractive = process.env.MISATO_DESKTOP_ACCEPTANCE_INTERACTIVE === "1";

const checks = [];

checks.push(
  checkEntry(
    "desktop-acceptance",
    "desktop-exe-present",
    exists(exePath) ? "verified" : "failed",
    { path: path.relative(root, exePath), exists: exists(exePath) },
    "Release executable exists in the Tauri target folder."
  )
);

checks.push(
  checkEntry(
    "desktop-acceptance",
    "installer-present",
    exists(installerPath) ? "verified" : "failed",
    { path: path.relative(root, installerPath), exists: exists(installerPath) },
    "NSIS installer exists in the Tauri bundle folder."
  )
);

checks.push(
  checkEntry(
    "desktop-acceptance",
    "package-config-baseline",
    tauriConfig.build?.devUrl === "http://127.0.0.1:1420" &&
      tauriConfig.build?.frontendDist === "../desktop-ui" &&
      tauriConfig.bundle?.active === true &&
      Array.isArray(tauriConfig.bundle?.targets) &&
      tauriConfig.bundle.targets.includes("nsis")
      ? "verified"
      : "failed",
    {
      devUrl: tauriConfig.build?.devUrl,
      frontendDist: tauriConfig.build?.frontendDist,
      bundleTargets: tauriConfig.bundle?.targets
    },
    "Desktop shell remains pointed at the bundled UI and NSIS packaging target."
  )
);

checks.push(
  checkEntry(
    "desktop-acceptance",
    "single-instance-plugin-present",
    mainRs.includes("tauri_plugin_single_instance::init") ? "verified" : "failed",
    { path: path.relative(root, mainRsPath), snippet: "tauri_plugin_single_instance::init" },
    "Single-instance plugin is wired into the desktop binary."
  )
);

checks.push(
  checkEntry(
    "desktop-acceptance",
    "tray-handlers-present",
    mainRs.includes("TrayIconBuilder::new()") && mainRs.includes(".on_menu_event") && mainRs.includes(".on_tray_icon_event")
      ? "verified"
      : "failed",
    { path: path.relative(root, mainRsPath), snippet: "TrayIconBuilder + tray events" },
    "Tray menu / restore wiring is present in the desktop binary."
  )
);

checks.push(
  checkEntry(
    "desktop-acceptance",
    "window-state-plugin-present",
    mainRs.includes("tauri_plugin_window_state::Builder::default().build()") ? "verified" : "failed",
    { path: path.relative(root, mainRsPath), snippet: "tauri_plugin_window_state::Builder::default().build()" },
    "Window-state plugin is present in the desktop binary."
  )
);

checks.push(
  checkEntry(
    "desktop-acceptance",
    "autostart-plugin-present",
    mainRs.includes("tauri_plugin_autostart::init") ? "verified" : "failed",
    { path: path.relative(root, mainRsPath), snippet: "tauri_plugin_autostart::init" },
    "Autostart plugin is present in the desktop binary."
  )
);

const runningBefore = tasklistCount();
if (runningBefore.supported && runningBefore.count > 0) {
  checks.push(
    checkEntry(
      "desktop-acceptance",
      "running-instance-detected",
      "loaded",
      runningBefore,
      "MISATO.exe is already running on this host."
    )
  );
} else {
  checks.push(
    checkEntry(
      "desktop-acceptance",
      "running-instance-detected",
      "unverified",
      runningBefore,
      "MISATO.exe is not currently running or the host does not support process inspection."
    )
  );
}

if (acceptsInteractive && runningBefore.supported && runningBefore.count > 0) {
  const launch = launchSecondInstance();
  sleep(4000);
  const runningAfter = tasklistCount();
  const countStable = runningAfter.supported && runningAfter.count <= Math.max(1, runningBefore.count);
  checks.push(
    checkEntry(
      "desktop-acceptance",
      "single-instance-second-launch",
      launch.launched && countStable ? "verified" : "failed",
      { before: runningBefore, launch, after: runningAfter },
      "Interactive second-instance check performed only when MISATO_DESKTOP_ACCEPTANCE_INTERACTIVE=1."
    )
  );
} else {
  checks.push(
    checkEntry(
      "desktop-acceptance",
      "single-instance-second-launch",
      "unverified",
      {
        status: "unverified",
        reason: acceptsInteractive
          ? "No running MISATO.exe detected."
          : "Set MISATO_DESKTOP_ACCEPTANCE_INTERACTIVE=1 to run the interactive second-instance check."
      },
      "Second-instance runtime behavior remains unverified in this pass."
    )
  );
}

checks.push(
  checkEntry(
    "desktop-acceptance",
    "tray-runtime-behavior",
    "unverified",
    {
      status: "unverified",
      reason: "Interactive tray click/restore requires a live Windows desktop session."
    },
    "Tray runtime behavior is not exercised by the structural checker."
  )
);

checks.push(
  checkEntry(
    "desktop-acceptance",
    "window-state-runtime-behavior",
    "unverified",
    {
      status: "unverified",
      reason: "Requires a live window minimize/restore cycle on Windows."
    },
    "Window-state persistence remains unverified in this pass."
  )
);

checks.push(
  checkEntry(
    "desktop-acceptance",
    "autostart-runtime-behavior",
    "unverified",
    {
      status: "unverified",
      reason: "Requires OS-level autostart settings verification on the host."
    },
    "Autostart enablement remains environment-bound."
  )
);

const report = buildReport(
  checks,
  "Desktop acceptance is split between structural proof, host process detection, and optional interactive second-instance verification.",
  {
    branch: "misato-hermes-live-brain",
    exePath: path.relative(root, exePath),
    installerPath: path.relative(root, installerPath),
    interactiveMode: acceptsInteractive
  }
);

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
