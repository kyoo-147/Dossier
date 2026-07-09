use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct WorkspacePaths {
    pub root: String,
    pub state_dir: String,
    pub artifacts_dir: String,
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

pub fn runtime_root_from_manifest_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("src-tauri should live under apps/desktop")
        .join("../local-runtime")
}
