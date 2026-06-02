#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

fn js_escape(value: &str) -> String {
    value.replace('\\', "\\\\").replace('"', "\\\"").replace('\n', "").replace('\r', "")
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let runtime_origin = std::env::var("MISATO_RUNTIME_ORIGIN")
                .ok()
                .or_else(|| option_env!("MISATO_RUNTIME_ORIGIN").map(|s| s.to_string()))
                .unwrap_or_else(|| "http://127.0.0.1:3010".to_string());
            let preview_api = std::env::var("MISATO_API_BASE_URL")
                .ok()
                .or_else(|| option_env!("MISATO_API_BASE_URL").map(|s| s.to_string()))
                .unwrap_or_default();

            if let Some(window) = app.get_webview_window("main") {
                let escaped_origin = js_escape(runtime_origin.trim());
                let escaped_preview = js_escape(preview_api.trim());
                let mut script = format!(
                    "window.__MISATO_RUNTIME_ORIGIN__ = \"{}\";",
                    escaped_origin
                );
                if !escaped_preview.is_empty() {
                    script.push_str(&format!(
                        "window.__MISATO_PREVIEW_API_BASE_URL__ = \"{}\"; window.__MISATO_API_BASE_URL__ = window.__MISATO_PREVIEW_API_BASE_URL__;",
                        escaped_preview
                    ));
                    script.push_str("if (!localStorage.getItem('misato_api_base_url')) { localStorage.setItem('misato_api_base_url', window.__MISATO_PREVIEW_API_BASE_URL__); }");
                }
                if !escaped_origin.is_empty() {
                    script.push_str("if (!localStorage.getItem('misato_runtime_origin')) { localStorage.setItem('misato_runtime_origin', window.__MISATO_RUNTIME_ORIGIN__); }");
                }
                let _ = window.eval(script.as_str());
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running MISATO desktop shell");
}
