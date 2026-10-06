use tauri_plugin_dialog::DialogExt;

pub(crate) const EXPORT_LIMIT: usize = 128 * 1024 * 1024;
pub(crate) fn validate_export(filename: &str, size: usize) -> Result<(), String> {
    if filename.is_empty()
        || filename.len() > 240
        || filename
            .chars()
            .any(|c| c.is_control() || matches!(c, '/' | '\\' | ':'))
    {
        return Err("Invalid export filename".into());
    }
    let extension = filename
        .rsplit('.')
        .next()
        .unwrap_or_default()
        .to_ascii_lowercase();
    if !["json", "drawio", "svg", "png", "pdf", "md", "docx", "zip"].contains(&extension.as_str()) {
        return Err("Unsupported export format".into());
    }
    if size > EXPORT_LIMIT {
        return Err("Export exceeds the 128 MiB limit".into());
    }
    Ok(())
}
#[tauri::command]
pub async fn save_export(
    app: tauri::AppHandle,
    filename: String,
    bytes: Vec<u8>,
) -> Result<bool, String> {
    validate_export(&filename, bytes.len())?;
    #[cfg(feature = "native-smoke")]
    if let Ok(directory) = std::env::var("PLANNER_SMOKE_EXPORTS") {
        std::fs::write(std::path::Path::new(&directory).join(&filename), bytes)
            .map_err(|e| format!("Smoke export failed: {e}"))?;
        return Ok(true);
    }
    // Async commands run off the UI thread; only a user-selected path is writable.
    let selected = app
        .dialog()
        .file()
        .set_file_name(&filename)
        .blocking_save_file();
    let Some(selected) = selected else {
        return Ok(false);
    };
    let path = selected
        .into_path()
        .map_err(|_| "The selected location is not a local file")?;
    std::fs::write(path, bytes).map_err(|e| format!("Could not save export: {e}"))?;
    Ok(true)
}
#[tauri::command]
pub fn fullscreen_state(window: tauri::WebviewWindow) -> Result<bool, String> {
    window
        .is_fullscreen()
        .map_err(|e| format!("Could not read fullscreen state: {e}"))
}
#[tauri::command]
pub fn set_fullscreen(window: tauri::WebviewWindow, fullscreen: bool) -> Result<(), String> {
    window
        .set_fullscreen(fullscreen)
        .map_err(|e| format!("Could not change fullscreen: {e}"))
}
