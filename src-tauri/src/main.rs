#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    menu::MenuBuilder,
    tray::{TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};

fn js_escape(value: &str) -> String {
    value
        .replace('\\', "\\\\")
        .replace('"', "\\\"")
        .replace('\n', "")
        .replace('\r', "")
}

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
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

            #[cfg(desktop)]
            {
                let _ = app.handle().plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
                    show_main_window(app);
                }));

                let _ = app.handle().plugin(tauri_plugin_window_state::Builder::default().build());
                let _ = app.handle().plugin(tauri_plugin_autostart::init(
                    tauri_plugin_autostart::MacosLauncher::default(),
                    None,
                ));

                let menu = MenuBuilder::new(app)
                    .text("show-window", "Show MISATO")
                    .separator()
                    .text("quit", "Quit")
                    .build()?;

                let tray_icon = app.default_window_icon().cloned().unwrap();

                let _tray = TrayIconBuilder::new()
                    .icon(tray_icon)
                    .menu(&menu)
                    .show_menu_on_left_click(true)
                    .on_menu_event(move |app, event| match event.id().as_ref() {
                        "show-window" => show_main_window(app),
                        "quit" => app.exit(0),
                        _ => {}
                    })
                    .on_tray_icon_event(move |app, event| {
                        if let TrayIconEvent::Click { button, .. } = event {
                            if button == tauri::tray::MouseButton::Left {
                                show_main_window(app.app_handle());
                            }
                        }
                    })
                    .build(app)?;

                if let Some(window) = app.get_webview_window("main") {
                    let tray_window = window.clone();
                    let _ = window.on_window_event(move |event| {
                        if let WindowEvent::CloseRequested { api, .. } = event {
                            api.prevent_close();
                            let _ = tray_window.hide();
                        }
                    });
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running MISATO desktop shell");
}
