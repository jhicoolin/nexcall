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
            let runtime_api = std::env::var("MISATO_API_BASE_URL").ok();
            let buildtime_api = option_env!("MISATO_API_BASE_URL").map(|s| s.to_string());
            let selected_api = runtime_api.or(buildtime_api).unwrap_or_default();

            let selected_api = selected_api.trim();
            if !selected_api.is_empty() {
                if let Some(window) = app.get_webview_window("main") {
                    let escaped = js_escape(selected_api);
                    let script = format!(
                        "window.__MISATO_API_BASE_URL__ = \"{}\"; localStorage.setItem('misato_api_base_url', window.__MISATO_API_BASE_URL__);",
                        escaped
                    );
                    let _ = window.eval(script.as_str());
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running MISATO desktop shell");
}
