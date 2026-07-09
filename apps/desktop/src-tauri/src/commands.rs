use crate::runtime_gateway::{RuntimeBootstrap, RuntimeStatus};
use crate::state::AppState;
use crate::storage::{initialize_workspace as initialize_workspace_dirs, WorkspacePaths};
use serde::Serialize;
use std::path::PathBuf;
use tauri::State;

#[derive(Debug, Serialize)]
pub struct KernelStatusResponse {
    pub workspace: Option<WorkspacePaths>,
    pub runtime: RuntimeStatus,
}

#[tauri::command]
pub fn initialize_workspace(
    workspace_root: String,
    state: State<'_, AppState>,
) -> Result<WorkspacePaths, String> {
    let root = PathBuf::from(workspace_root);
    let initialized = initialize_workspace_dirs(&root).map_err(|error| error.to_string())?;

    let mut kernel = state
        .kernel
        .lock()
        .map_err(|_| "kernel state is poisoned".to_string())?;
    kernel.workspace_root = Some(root);
    kernel.workspace_paths = Some(initialized.clone());

    Ok(initialized)
}

#[tauri::command]
pub fn get_runtime_bootstrap(state: State<'_, AppState>) -> RuntimeBootstrap {
    state.runtime_gateway.bootstrap()
}

#[tauri::command]
pub fn get_kernel_status(state: State<'_, AppState>) -> Result<KernelStatusResponse, String> {
    let kernel = state
        .kernel
        .lock()
        .map_err(|_| "kernel state is poisoned".to_string())?;
    let runtime = state.runtime_gateway.status(kernel.workspace_root.as_deref());

    Ok(KernelStatusResponse {
        workspace: kernel.workspace_paths.clone(),
        runtime,
    })
}
