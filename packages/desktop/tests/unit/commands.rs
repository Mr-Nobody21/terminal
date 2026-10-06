use crate::commands::{validate_export, EXPORT_LIMIT};
use crate::platform::{external_url, local_navigation};
#[test]
fn platform_local_origins_and_development_navigation_are_scoped() {
    for windows in [true, false] {
        let bundled = if windows {
            "http://tauri.localhost/index.html#workspace"
        } else {
            "tauri://localhost/index.html#workspace"
        };
        assert!(local_navigation(&bundled.parse().unwrap(), windows, false));
        let dev = "http://127.0.0.1:5173/".parse().unwrap();
        assert!(local_navigation(&dev, windows, true));
        assert!(!local_navigation(&dev, windows, false));
        for foreign in [
            "https://example.com",
            "http://tauri.localhost.evil",
            "tauri://evil/",
            "http://127.0.0.1:5174",
            "http://tauri.localhost:8080",
            "file:///etc/passwd",
            "http://user@tauri.localhost",
        ] {
            assert!(!local_navigation(&foreign.parse().unwrap(), windows, true));
        }
    }
    assert!(!local_navigation(
        &"http://tauri.localhost/".parse().unwrap(),
        false,
        false
    ));
    assert!(!local_navigation(
        &"tauri://localhost/".parse().unwrap(),
        true,
        false
    ));
}
#[test]
fn platform_packaging_configs_use_valid_tauri_contracts() {
    let base: serde_json::Value =
        serde_json::from_str(include_str!("../../tauri.conf.json")).unwrap();
    for (raw, expected) in [
        (
            include_str!("../../../../apps/mac/config/tauri.conf.json"),
            vec!["app", "dmg"],
        ),
        (
            include_str!("../../../../apps/windows/config/tauri.conf.json"),
            vec!["nsis", "msi"],
        ),
        (
            include_str!("../../../../apps/linux/config/tauri.conf.json"),
            vec!["appimage", "deb"],
        ),
    ] {
        let mut merged = base.clone();
        let platform: serde_json::Value = serde_json::from_str(raw).unwrap();
        for (key, value) in platform["bundle"].as_object().unwrap() {
            merged["bundle"][key] = value.clone();
        }
        assert_eq!(merged["bundle"]["targets"], serde_json::json!(expected));
        serde_json::from_value::<tauri::utils::config::Config>(merged)
            .expect("valid platform configuration");
    }
}
#[test]
fn exports_are_bounded_and_cannot_supply_paths() {
    for name in [
        "plan.json",
        "diagram.drawio",
        "plan.svg",
        "plan.png",
        "report.pdf",
        "report.md",
        "report.docx",
        "bundle.zip",
    ] {
        assert!(validate_export(name, 42).is_ok());
    }
    for name in [
        "",
        "../plan.json",
        "/tmp/plan.json",
        "a\\b.json",
        "a\n.json",
        "a:plan.json",
        "script.sh",
    ] {
        assert!(validate_export(name, 42).is_err());
    }
    assert!(validate_export("plan.json", EXPORT_LIMIT + 1).is_err());
}
#[test]
fn external_navigation_only_opens_https_without_credentials() {
    for url in [
        "https://aws.amazon.com/pricing/",
        "https://cloud.google.com/",
    ] {
        assert!(external_url(&url.parse().unwrap()));
    }
    for url in [
        "http://example.com",
        "file:///etc/passwd",
        "https://user:password@example.com",
        "javascript:alert(1)",
    ] {
        assert!(!external_url(&url.parse().unwrap()));
    }
}
