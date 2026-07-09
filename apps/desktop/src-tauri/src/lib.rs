mod commands;
mod events;
pub mod runtime_gateway;
mod state;
pub mod storage;

use runtime_gateway::RuntimeGateway;
use state::AppState;
use storage::runtime_root_from_manifest_dir;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let runtime_gateway = RuntimeGateway::new(runtime_root_from_manifest_dir());

    tauri::Builder::default()
        .manage(AppState::new(runtime_gateway))
        .invoke_handler(tauri::generate_handler![
            commands::get_kernel_status,
            commands::initialize_workspace,
            commands::get_runtime_bootstrap,
            commands::ensure_runtime,
            commands::create_run,
            commands::execute_run,
            commands::approve_run,
            commands::reject_run,
            commands::list_review_tasks,
            commands::apply_field_edit,
            commands::export_run
        ])
        .run(tauri::generate_context!())
        .expect("error while running Dossier desktop kernel");
}
