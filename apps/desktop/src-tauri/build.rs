fn main() {
    tauri_build::try_build(
        tauri_build::Attributes::new()
            .app_manifest(tauri_build::AppManifest::new().commands(&[
                "get_kernel_status",
                "initialize_workspace",
                "get_runtime_bootstrap",
            ])),
    )
    .expect("failed to build tauri application manifest");
}
