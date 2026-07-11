use sha2::{Digest, Sha256};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct WorkspacePaths {
    pub root: String,
    pub state_dir: String,
    pub artifacts_dir: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DesktopDocumentRecord {
    pub document_id: String,
    pub file_name: String,
    pub source_path: String,
    pub source_type: String,
    #[serde(default)]
    pub artifact_ref: String,
    #[serde(default)]
    pub artifact_sha256: String,
    #[serde(default)]
    pub artifact_size: u64,
    pub page_count: u32,
    pub has_schema: bool,
    pub mode_hint: String,
    pub status: String,
    pub created_at: String,
}

pub fn initialize_workspace(root: &Path) -> std::io::Result<WorkspacePaths> {
    let state_dir = root.join(".dossier").join("state");
    let artifacts_dir = root.join(".dossier").join("artifacts");

    fs::create_dir_all(&state_dir)?;
    fs::create_dir_all(&artifacts_dir)?;

    Ok(WorkspacePaths {
        root: root.display().to_string(),
        state_dir: state_dir.display().to_string(),
        artifacts_dir: artifacts_dir.display().to_string(),
    })
}

pub fn resolve_runtime_root(resource_dir: Option<&Path>) -> PathBuf {
    if let Some(resource_dir) = resource_dir {
        let bundled_runtime = resource_dir.join("local-runtime");
        if bundled_runtime.exists() {
            return bundled_runtime;
        }
    }

    runtime_root_from_dev_layout()
}

#[cfg(debug_assertions)]
fn runtime_root_from_dev_layout() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("src-tauri should live under apps/desktop")
        .join("../local-runtime")
}

#[cfg(not(debug_assertions))]
fn runtime_root_from_dev_layout() -> PathBuf {
    std::env::current_exe()
        .ok()
        .and_then(|path| path.parent().map(Path::to_path_buf))
        .unwrap_or_else(|| PathBuf::from("."))
        .join("local-runtime")
}

pub fn list_documents(workspace_root: &Path) -> std::io::Result<Vec<DesktopDocumentRecord>> {
    let registry_path = documents_registry_path(workspace_root);
    if !registry_path.exists() {
        return Ok(Vec::new());
    }

    let raw = fs::read_to_string(registry_path)?;
    let parsed =
        serde_json::from_str::<Vec<DesktopDocumentRecord>>(&raw).map_err(std::io::Error::other)?;
    Ok(parsed)
}

pub fn register_document(
    workspace_root: &Path,
    source_path: &Path,
    mode_hint: &str,
    page_count: u32,
    has_schema: bool,
) -> std::io::Result<DesktopDocumentRecord> {
    let mut documents = list_documents(workspace_root)?;
    let file_name = source_path
        .file_name()
        .map(|item| item.to_string_lossy().to_string())
        .unwrap_or_else(|| source_path.display().to_string());
    let source_type = match source_path
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase()
        .as_str()
    {
        "png" | "jpg" | "jpeg" | "tif" | "tiff" | "bmp" => "image",
        "txt" | "md" | "csv" => "text",
        _ => "pdf",
    }
    .to_string();
    let artifact = import_source_artifact(workspace_root, source_path)?;

    let record = DesktopDocumentRecord {
        document_id: format!("doc_{}", Uuid::new_v4().simple()),
        file_name,
        source_path: source_path.display().to_string(),
        source_type,
        artifact_ref: artifact.artifact_ref,
        artifact_sha256: artifact.sha256,
        artifact_size: artifact.size,
        page_count,
        has_schema,
        mode_hint: mode_hint.to_string(),
        status: "ready".to_string(),
        created_at: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|duration| duration.as_secs().to_string())
            .unwrap_or_else(|_| "0".to_string()),
    };

    documents.push(record.clone());
    save_documents(workspace_root, &documents)?;
    Ok(record)
}

struct ImportedArtifact {
    artifact_ref: String,
    sha256: String,
    size: u64,
}

fn import_source_artifact(
    workspace_root: &Path,
    source_path: &Path,
) -> std::io::Result<ImportedArtifact> {
    let mut source = fs::File::open(source_path)?;
    let mut hasher = Sha256::new();
    let mut size = 0_u64;
    let mut buffer = [0_u8; 8192];

    loop {
        let read = source.read(&mut buffer)?;
        if read == 0 {
            break;
        }
        hasher.update(&buffer[..read]);
        size += read as u64;
    }

    let sha256 = format!("{:x}", hasher.finalize());
    let suffix = source_path
        .extension()
        .and_then(|value| value.to_str())
        .map(|extension| format!(".{extension}"))
        .unwrap_or_else(|| ".bin".to_string());
    let artifact_name = format!("{sha256}{suffix}");
    let artifacts_dir = workspace_root.join(".dossier").join("artifacts");
    fs::create_dir_all(&artifacts_dir)?;
    let target = artifacts_dir.join(&artifact_name);
    if !target.exists() {
        fs::copy(source_path, target)?;
    }

    Ok(ImportedArtifact {
        artifact_ref: format!("artifact://{artifact_name}"),
        sha256,
        size,
    })
}

pub fn copy_artifact_to_destination(
    workspace_root: &Path,
    artifact_ref: &str,
    destination_path: &Path,
) -> std::io::Result<String> {
    let artifact_name = artifact_ref
        .split('/')
        .next_back()
        .filter(|item| !item.is_empty())
        .ok_or_else(|| {
            std::io::Error::new(std::io::ErrorKind::InvalidInput, "invalid artifact ref")
        })?;
    let source_path = workspace_root
        .join(".dossier")
        .join("state")
        .join("runtime")
        .join("artifacts")
        .join(artifact_name);

    if !source_path.exists() {
        return Err(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            format!("artifact not found: {artifact_name}"),
        ));
    }

    if let Some(parent) = destination_path.parent() {
        fs::create_dir_all(parent)?;
    }

    fs::copy(&source_path, destination_path)?;
    Ok(destination_path.display().to_string())
}

fn save_documents(
    workspace_root: &Path,
    documents: &[DesktopDocumentRecord],
) -> std::io::Result<()> {
    let registry_path = documents_registry_path(workspace_root);
    if let Some(parent) = registry_path.parent() {
        fs::create_dir_all(parent)?;
    }
    let payload = serde_json::to_string_pretty(documents).map_err(std::io::Error::other)?;
    fs::write(registry_path, payload)
}

fn documents_registry_path(workspace_root: &Path) -> PathBuf {
    workspace_root
        .join(".dossier")
        .join("state")
        .join("documents.json")
}
