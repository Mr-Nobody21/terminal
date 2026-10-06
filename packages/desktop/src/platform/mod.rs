pub(crate) fn local_navigation(url: &tauri::Url, windows: bool, development: bool) -> bool {
    if !url.username().is_empty() || url.password().is_some() {
        return false;
    }
    let bundled = if windows {
        url.scheme() == "http" && url.host_str() == Some("tauri.localhost") && url.port().is_none()
    } else {
        url.scheme() == "tauri" && url.host_str() == Some("localhost") && url.port().is_none()
    };
    bundled
        || development
            && url.scheme() == "http"
            && url.host_str() == Some("127.0.0.1")
            && url.port() == Some(5173)
}
pub(crate) fn external_url(url: &tauri::Url) -> bool {
    url.scheme() == "https"
        && url.host_str().is_some()
        && url.username().is_empty()
        && url.password().is_none()
}
