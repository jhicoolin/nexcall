import fs from "node:fs";
import path from "node:path";
import { buildReport, checkEntry } from "./misato-check-schema.mjs";

const root = process.cwd();
const rel = (...parts) => path.join(root, ...parts);
const exists = (...parts) => fs.existsSync(rel(...parts));
const readText = (...parts) => fs.readFileSync(rel(...parts), "utf8");

function findSnippet(text, needle) {
  return text.includes(needle);
}

const checks = [];

const tauriConfigPath = rel("src-tauri", "tauri.conf.json");
const mainPath = rel("src-tauri", "src", "main.rs");
const exePath = rel("src-tauri", "target", "release", "misato-desktop.exe");
const installerPath = rel("src-tauri", "target", "release", "bundle", "nsis", "MISATO_0.1.0_x64-setup.exe");

const tauriConfig = JSON.parse(readText("src-tauri", "tauri.conf.json"));
const mainRs = readText("src-tauri", "src", "main.rs");
const configOk =
  tauriConfig.build?.devUrl === "http://127.0.0.1:1420" &&
  tauriConfig.build?.beforeDevCommand === "npm run desktop-ui:dev" &&
  tauriConfig.build?.beforeBuildCommand === "npm run desktop-ui:build && npm run build" &&
  tauriConfig.build?.frontendDist === "../desktop-ui" &&
  tauriConfig.bundle?.active === true &&
  Array.isArray(tauriConfig.bundle?.targets) &&
  tauriConfig.bundle.targets.includes("nsis");
const runtimeOriginOk =
  findSnippet(mainRs, '"http://127.0.0.1:3010".to_string()') &&
  findSnippet(mainRs, "MISATO_RUNTIME_ORIGIN") &&
  findSnippet(mainRs, "MISATO_API_BASE_URL");
const singleInstanceOk = findSnippet(mainRs, "tauri_plugin_single_instance::init") && findSnippet(mainRs, "show_main_window(app);");
const trayOk = findSnippet(mainRs, "TrayIconBuilder::new()") && findSnippet(mainRs, ".on_menu_event") && findSnippet(mainRs, ".on_tray_icon_event") && findSnippet(mainRs, "tray_window.hide()");
const windowStateOk = findSnippet(mainRs, "tauri_plugin_window_state::Builder::default().build()");
const autostartOk = findSnippet(mainRs, "tauri_plugin_autostart::init") && findSnippet(mainRs, "MacosLauncher::default()");
const desktopExeOk = exists("src-tauri", "target", "release", "misato-desktop.exe");
const installerOk = exists("src-tauri", "target", "release", "bundle", "nsis", "MISATO_0.1.0_x64-setup.exe");

checks.push(
  checkEntry(
    "desktop-packaging",
    "tauri-config-canonicalized",
    configOk ? "verified" : "failed",
    {
      devUrl: tauriConfig.build?.devUrl,
      beforeDevCommand: tauriConfig.build?.beforeDevCommand,
      beforeBuildCommand: tauriConfig.build?.beforeBuildCommand,
      frontendDist: tauriConfig.build?.frontendDist,
      bundleTargets: tauriConfig.bundle?.targets,
    },
    "Tauri config points at the local desktop UI and NSIS packaging target."
  )
);

checks.push(
  checkEntry(
    "desktop-packaging",
    "runtime-origin-default-kept-separate",
    runtimeOriginOk ? "verified" : "failed",
    {
      runtimeOriginDefault: "http://127.0.0.1:3010",
      runtimeOriginPresent: findSnippet(mainRs, "MISATO_RUNTIME_ORIGIN"),
      previewApiPresent: findSnippet(mainRs, "MISATO_API_BASE_URL"),
    },
    "Canonical runtime origin remains distinct from preview API base handling."
  )
);

checks.push(
  checkEntry(
    "desktop-packaging",
    "single-instance-plugin-loaded",
    singleInstanceOk ? "verified" : "failed",
    {
      evidence: "src-tauri/src/main.rs",
      snippet: "tauri_plugin_single_instance::init(...)",
    },
    "Single-instance plugin is wired into the desktop shell."
  )
);

checks.push(
  checkEntry(
    "desktop-packaging",
    "tray-behavior-loaded",
    trayOk ? "verified" : "failed",
    {
      evidence: "src-tauri/src/main.rs",
      snippet: "TrayIconBuilder + show/hide handlers",
    },
    "Tray menu and restore/hide handlers are present in the desktop shell."
  )
);

checks.push(
  checkEntry(
    "desktop-packaging",
    "window-state-plugin-loaded",
    windowStateOk ? "verified" : "failed",
    {
      evidence: "src-tauri/src/main.rs",
      snippet: "tauri_plugin_window_state::Builder::default().build()",
    },
    "Window state plugin is registered for desktop restore behavior."
  )
);

checks.push(
  checkEntry(
    "desktop-packaging",
    "autostart-plugin-loaded",
    autostartOk ? "verified" : "failed",
    {
      evidence: "src-tauri/src/main.rs",
      snippet: "tauri_plugin_autostart::init(...)",
    },
    "Autostart plugin is registered at the desktop shell level."
  )
);

checks.push(
  checkEntry(
    "desktop-packaging",
    "desktop-exe-built",
    desktopExeOk ? "verified" : "failed",
    { path: "src-tauri/target/release/misato-desktop.exe", exists: desktopExeOk },
    "Release desktop executable is present."
  )
);

checks.push(
  checkEntry(
    "desktop-packaging",
    "installer-built",
    installerOk ? "verified" : "failed",
    { path: "src-tauri/target/release/bundle/nsis/MISATO_0.1.0_x64-setup.exe", exists: installerOk },
    "NSIS installer artifact is present."
  )
);

checks.push(
  checkEntry(
    "desktop-packaging",
    "tray-runtime-behavior",
    "unverified",
    {
      status: "unverified",
      reason: "Requires interactive Windows desktop launch and tray click test.",
    },
    "Tray runtime behavior not exercised in this pass."
  )
);

checks.push(
  checkEntry(
    "desktop-packaging",
    "single-instance-runtime-behavior",
    "unverified",
    {
      status: "unverified",
      reason: "Requires opening a second MISATO instance on Windows.",
    },
    "Single-instance runtime behavior not exercised in this pass."
  )
);

checks.push(
  checkEntry(
    "desktop-packaging",
    "autostart-runtime-behavior",
    "unverified",
    {
      status: "unverified",
      reason: "Requires Windows autostart settings verification on the host.",
    },
    "Autostart runtime behavior not exercised in this pass."
  )
);

checks.push(
  checkEntry(
    "desktop-packaging",
    "updater-wiring",
    "unverified",
    {
      status: "not_present",
      reason: "No updater plugin or release update flow found in the current desktop shell.",
    },
    "Updater wiring remains absent in the current repository state."
  )
);

const humanReadable = [
  "Desktop packaging checks are split between structural proof and environment-bound runtime behavior.",
  "Build artifacts and plugin wiring are verified separately from tray/single-instance/autostart behavior.",
  "Updater wiring is not present in this branch and remains unverified.",
].join(" ");

const report = buildReport(checks, humanReadable, {
  branch: "misato-hermes-live-brain",
  canonicalRuntimeOrigin: "http://127.0.0.1:3010",
  previewApiBaseUrl: "preview-only / fallback-only",
});

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
