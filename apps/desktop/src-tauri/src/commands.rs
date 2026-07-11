use crate::runtime_gateway::{RuntimeBootstrap, RuntimeStatus};
use crate::state::AppState;
use crate::storage::{
    DesktopDocumentRecord, WorkspacePaths, copy_artifact_to_destination,
    initialize_workspace as initialize_workspace_dirs, list_documents as load_documents,
    register_document as create_document_record,
};
use keyring::Entry;
use serde::Serialize;
use serde_json::{Value, json};
use std::path::PathBuf;
use tauri::State;

#[tauri::command]
pub fn set_api_key(service: String, key: String) -> Result<(), String> {
    let entry = Entry::new("Dossier", &service).map_err(|e| e.to_string())?;
    entry.set_password(&key).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_api_key(service: String) -> Result<Option<String>, String> {
    let entry = Entry::new("Dossier", &service).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(pwd) => Ok(Some(pwd)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[derive(Debug, Serialize)]
pub struct KernelStatusResponse {
    pub workspace: Option<WorkspacePaths>,
    pub runtime: RuntimeStatus,
}

#[derive(Debug, Serialize)]
pub struct RuntimeActionResponse {
    pub payload: Value,
}

#[derive(Debug, Serialize)]
pub struct DocumentListResponse {
    pub documents: Vec<DesktopDocumentRecord>,
}

#[derive(Debug, Serialize)]
pub struct ArtifactSaveResponse {
    pub saved_path: String,
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
pub fn list_documents(state: State<'_, AppState>) -> Result<DocumentListResponse, String> {
    let workspace_root = {
        let kernel = state
            .kernel
            .lock()
            .map_err(|_| "kernel state is poisoned".to_string())?;
        kernel.workspace_root.clone()
    }
    .ok_or("workspace must be initialized before listing documents")?;

    let documents = load_documents(&workspace_root).map_err(|error| error.to_string())?;
    Ok(DocumentListResponse { documents })
}

#[tauri::command]
pub fn register_document(
    source_path: String,
    mode_hint: String,
    page_count: u32,
    has_schema: bool,
    state: State<'_, AppState>,
) -> Result<DesktopDocumentRecord, String> {
    let workspace_root = {
        let kernel = state
            .kernel
            .lock()
            .map_err(|_| "kernel state is poisoned".to_string())?;
        kernel.workspace_root.clone()
    }
    .ok_or("workspace must be initialized before registering documents")?;

    create_document_record(
        &workspace_root,
        &PathBuf::from(source_path),
        &mode_hint,
        page_count,
        has_schema,
    )
    .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn ensure_runtime(state: State<'_, AppState>) -> Result<RuntimeStatus, String> {
    if state.runtime_gateway.health_check().await.is_ok() {
        let workspace_root = {
            let kernel = state
                .kernel
                .lock()
                .map_err(|_| "kernel state is poisoned".to_string())?;
            kernel.workspace_root.clone()
        };
        return Ok(state
            .runtime_gateway
            .status(workspace_root.as_deref())
            .await);
    }

    let workspace_paths = {
        let kernel = state
            .kernel
            .lock()
            .map_err(|_| "kernel state is poisoned".to_string())?;
        kernel.workspace_paths.clone()
    };

    let workspace_paths =
        workspace_paths.ok_or("workspace must be initialized before runtime start")?;
    let state_dir = PathBuf::from(&workspace_paths.state_dir).join("runtime");

    {
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
    } // drop runtime_process guard here

    state.runtime_gateway.wait_until_ready().await?;

    let workspace_root = {
        let kernel = state
            .kernel
            .lock()
            .map_err(|_| "kernel state is poisoned".to_string())?;
        kernel.workspace_root.clone()
    };
    Ok(state
        .runtime_gateway
        .status(workspace_root.as_deref())
        .await)
}

#[tauri::command]
pub async fn create_run(
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
        payload: state.runtime_gateway.create_run(&payload).await?,
    })
}

#[tauri::command]
pub async fn execute_run(
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
        payload: state.runtime_gateway.execute_run(&run_id, &payload).await?,
    })
}

#[tauri::command]
pub async fn approve_run(
    run_id: String,
    state: State<'_, AppState>,
) -> Result<RuntimeActionResponse, String> {
    Ok(RuntimeActionResponse {
        payload: state.runtime_gateway.approve_run(&run_id).await?,
    })
}

#[tauri::command]
pub async fn reject_run(
    run_id: String,
    note: Option<String>,
    state: State<'_, AppState>,
) -> Result<RuntimeActionResponse, String> {
    Ok(RuntimeActionResponse {
        payload: state.runtime_gateway.reject_run(&run_id, note.as_deref()).await?,
    })
}

#[tauri::command]
pub async fn list_review_tasks(
    run_id: String,
    state: State<'_, AppState>,
) -> Result<RuntimeActionResponse, String> {
    Ok(RuntimeActionResponse {
        payload: state.runtime_gateway.list_review_tasks(&run_id).await?,
    })
}

#[tauri::command]
pub async fn apply_field_edit(
    run_id: String,
    field_id: String,
    new_value: String,
    note: Option<String>,
    state: State<'_, AppState>,
) -> Result<RuntimeActionResponse, String> {
    Ok(RuntimeActionResponse {
        payload: state.runtime_gateway.apply_field_edit(
            &run_id,
            &field_id,
            &new_value,
            note.as_deref(),
        ).await?,
    })
}

#[tauri::command]
pub async fn export_run(
    run_id: String,
    export_target: String,
    state: State<'_, AppState>,
) -> Result<RuntimeActionResponse, String> {
    Ok(RuntimeActionResponse {
        payload: state.runtime_gateway.export_run(&run_id, &export_target).await?,
    })
}

#[tauri::command]
pub fn save_artifact_to_path(
    artifact_ref: String,
    destination_path: String,
    state: State<'_, AppState>,
) -> Result<ArtifactSaveResponse, String> {
    let workspace_root = {
        let kernel = state
            .kernel
            .lock()
            .map_err(|_| "kernel state is poisoned".to_string())?;
        kernel.workspace_root.clone()
    }
    .ok_or("workspace must be initialized before saving artifacts")?;

    let saved_path = copy_artifact_to_destination(
        &workspace_root,
        &artifact_ref,
        &PathBuf::from(destination_path),
    )
    .map_err(|error| error.to_string())?;

    Ok(ArtifactSaveResponse { saved_path })
}

#[tauri::command]
pub async fn install_provider(_provider_id: String) -> Result<(), String> {
    // Simulate download and installation
    tokio::time::sleep(std::time::Duration::from_secs(3)).await;
    Ok(())
}

#[tauri::command]
pub async fn get_kernel_status(state: State<'_, AppState>) -> Result<KernelStatusResponse, String> {
    let (workspace, workspace_root) = {
        let kernel = state
            .kernel
            .lock()
            .map_err(|_| "kernel state is poisoned".to_string())?;
        (kernel.workspace_paths.clone(), kernel.workspace_root.clone())
    };
    
    let runtime = state
        .runtime_gateway
        .status(workspace_root.as_deref())
        .await;

    Ok(KernelStatusResponse {
        workspace,
        runtime,
    })
}
