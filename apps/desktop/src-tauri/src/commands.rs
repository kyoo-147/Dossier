use crate::runtime_gateway::{RuntimeBootstrap, RuntimeStatus};
use crate::state::AppState;
use crate::storage::{initialize_workspace as initialize_workspace_dirs, WorkspacePaths};
use serde::Serialize;
use serde_json::{json, Value};
use std::path::PathBuf;
use tauri::State;

#[derive(Debug, Serialize)]
pub struct KernelStatusResponse {
    pub workspace: Option<WorkspacePaths>,
    pub runtime: RuntimeStatus,
}

#[derive(Debug, Serialize)]
pub struct RuntimeActionResponse {
    pub payload: Value,
}

#[tauri::command]
pub fn initialize_workspace(
    workspace_root: String,
    state: State<'_, AppState>,
) -> Result<WorkspacePaths, String> {
    let root = if workspace_root.trim().is_empty() {
        std::env::current_dir().map_err(|error| error.to_string())?
    } else {
        PathBuf::from(workspace_root)
    };
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
pub fn ensure_runtime(state: State<'_, AppState>) -> Result<RuntimeStatus, String> {
    if state.runtime_gateway.health_check().is_ok() {
        let kernel = state
            .kernel
            .lock()
            .map_err(|_| "kernel state is poisoned".to_string())?;
        return Ok(state.runtime_gateway.status(kernel.workspace_root.as_deref()));
    }

    let workspace_paths = {
        let kernel = state
            .kernel
            .lock()
            .map_err(|_| "kernel state is poisoned".to_string())?;
        kernel.workspace_paths.clone()
    };

    let workspace_paths = workspace_paths.ok_or("workspace must be initialized before runtime start")?;
    let state_dir = PathBuf::from(&workspace_paths.state_dir).join("runtime");

    let mut runtime_process = state
        .runtime_process
        .lock()
        .map_err(|_| "runtime state is poisoned".to_string())?;

    let should_spawn = match runtime_process.child.as_mut() {
        Some(child) => child
            .try_wait()
            .map_err(|error| format!("failed to inspect runtime process: {error}"))?
            .is_some(),
        None => true,
    };

    if should_spawn {
        runtime_process.child = Some(state.runtime_gateway.spawn_runtime(&state_dir)?);
    }

    drop(runtime_process);
    state.runtime_gateway.wait_until_ready()?;

    let kernel = state
        .kernel
        .lock()
        .map_err(|_| "kernel state is poisoned".to_string())?;
    Ok(state.runtime_gateway.status(kernel.workspace_root.as_deref()))
}

#[tauri::command]
pub fn create_run(
    document_id: String,
    mode: String,
    pipeline_id: String,
    pipeline_version: String,
    state: State<'_, AppState>,
) -> Result<RuntimeActionResponse, String> {
    let payload = json!({
        "document_id": document_id,
        "mode": mode,
        "pipeline_id": pipeline_id,
        "pipeline_version": pipeline_version
    });

    Ok(RuntimeActionResponse {
        payload: state.runtime_gateway.create_run(&payload)?,
    })
}

#[tauri::command]
pub fn execute_run(
    run_id: String,
    document_id: String,
    file_name: String,
    source_type: String,
    page_count: u32,
    has_schema: bool,
    state: State<'_, AppState>,
) -> Result<RuntimeActionResponse, String> {
    let payload = json!({
        "document_id": document_id,
        "file_name": file_name,
        "source_type": source_type,
        "page_count": page_count,
        "has_schema": has_schema
    });

    Ok(RuntimeActionResponse {
        payload: state.runtime_gateway.execute_run(&run_id, &payload)?,
    })
}

#[tauri::command]
pub fn approve_run(run_id: String, state: State<'_, AppState>) -> Result<RuntimeActionResponse, String> {
    Ok(RuntimeActionResponse {
        payload: state.runtime_gateway.approve_run(&run_id)?,
    })
}

#[tauri::command]
pub fn reject_run(
    run_id: String,
    note: Option<String>,
    state: State<'_, AppState>,
) -> Result<RuntimeActionResponse, String> {
    Ok(RuntimeActionResponse {
        payload: state.runtime_gateway.reject_run(&run_id, note.as_deref())?,
    })
}

#[tauri::command]
pub fn list_review_tasks(run_id: String, state: State<'_, AppState>) -> Result<RuntimeActionResponse, String> {
    Ok(RuntimeActionResponse {
        payload: state.runtime_gateway.list_review_tasks(&run_id)?,
    })
}

#[tauri::command]
pub fn apply_field_edit(
    run_id: String,
    field_id: String,
    new_value: String,
    note: Option<String>,
    state: State<'_, AppState>,
) -> Result<RuntimeActionResponse, String> {
    Ok(RuntimeActionResponse {
        payload: state
            .runtime_gateway
            .apply_field_edit(&run_id, &field_id, &new_value, note.as_deref())?,
    })
}

#[tauri::command]
pub fn export_run(
    run_id: String,
    export_target: String,
    state: State<'_, AppState>,
) -> Result<RuntimeActionResponse, String> {
    Ok(RuntimeActionResponse {
        payload: state.runtime_gateway.export_run(&run_id, &export_target)?,
    })
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
