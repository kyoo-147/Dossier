mod commands;
mod events;
pub mod runtime_gateway;
mod state;
pub mod storage;

use runtime_gateway::RuntimeGateway;
use state::AppState;
use storage::resolve_runtime_root;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let resource_dir = app.path().resource_dir().ok();
            let runtime_root = resolve_runtime_root(resource_dir.as_deref());
            app.manage(AppState::new(RuntimeGateway::new(runtime_root)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_kernel_status,
            commands::initialize_workspace,
            commands::get_runtime_bootstrap,
            commands::list_documents,
            commands::register_document,
            commands::ensure_runtime,
            commands::create_run,
            commands::execute_run,
            commands::approve_run,
            commands::reject_run,
            commands::list_review_tasks,
            commands::apply_field_edit,
            commands::export_run,
            commands::save_artifact_to_path,
            commands::set_api_key,
            commands::get_api_key,
            commands::install_provider
        ])
        .run(tauri::generate_context!())
        .expect("error while running Dossier desktop kernel");
}
