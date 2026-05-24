#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

fn js_escape(value: &str) -> String {
    value
        .replace('\\', "\\\\")
        .replace('"', "\\\"")
        .replace('\n', "")
        .replace('\r', "")
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let runtime_url = std::env::var("MISATO_DESKTOP_URL").ok();
            let buildtime_url = option_env!("MISATO_DESKTOP_URL").map(|s| s.to_string());
            let selected = runtime_url.or(buildtime_url);

            if let Some(url) = selected {
                let trimmed = url.trim();
                let is_safe = trimmed.starts_with("https://") || trimmed.starts_with("http://localhost") || trimmed.starts_with("http://127.0.0.1");
                if is_safe {
                    if let Some(window) = app.get_webview_window("main") {
                        let escaped = js_escape(trimmed);
                        let script = format!("window.location.replace(\"{}\");", escaped);
                        let _ = window.eval(script.as_str());
                    }
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running MISATO desktop shell");
}
