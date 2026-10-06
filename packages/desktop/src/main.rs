#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod commands;
mod platform;
use platform::{external_url, local_navigation};
use tauri_plugin_opener::OpenerExt;

#[cfg(feature = "native-smoke")]
#[tauri::command]
fn smoke_result(app: tauri::AppHandle, result: serde_json::Value) {
    let path = std::env::var("PLANNER_SMOKE_REPORT").expect("smoke report path");
    std::fs::write(path, result.to_string()).expect("write smoke report");
    app.exit(if result["ok"] == true { 0 } else { 1 });
}
fn main() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_opener::Builder::new()
                .open_js_links_on_click(false)
                .build(),
        );
    #[cfg(feature = "native-smoke")]
    let builder = builder.invoke_handler(tauri::generate_handler![
        commands::save_export,
        commands::fullscreen_state,
        commands::set_fullscreen,
        smoke_result
    ]);
    #[cfg(not(feature = "native-smoke"))]
    let builder = builder.invoke_handler(tauri::generate_handler![
        commands::save_export,
        commands::fullscreen_state,
        commands::set_fullscreen
    ]);
    builder
        .setup(|app| {
            let handle = app.handle().clone();
            let window = tauri::WebviewWindowBuilder::new(
                app,
                "main",
                tauri::WebviewUrl::App("index.html".into()),
            )
            .title("Cloud Architecture Planner")
            .resizable(true)
            .maximizable(true)
            .inner_size(1440.0, 940.0)
            .min_inner_size(1000.0, 740.0)
            .on_navigation(|url| {
                local_navigation(url, cfg!(target_os = "windows"), cfg!(debug_assertions))
            })
            .on_new_window(move |url, _| {
                if external_url(&url) {
                    let _ = handle.opener().open_url(url.as_str(), None::<&str>);
                }
                tauri::webview::NewWindowResponse::Deny
            });
            #[cfg(feature = "native-smoke")]
            let window = window.initialization_script(include_str!("smoke.js"));
            #[cfg(all(feature = "native-smoke", not(target_os = "macos")))]
            let window = window.data_directory(std::path::PathBuf::from(
                std::env::var("PLANNER_SMOKE_PROFILE").expect("isolated native smoke profile"),
            ));
            window.build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("run planner");
}
#[cfg(test)]
#[path = "../tests/unit/commands.rs"]
mod tests;
