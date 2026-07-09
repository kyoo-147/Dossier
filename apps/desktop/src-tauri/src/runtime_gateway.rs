use serde::Serialize;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct RuntimeBootstrap {
    pub command: String,
    pub args: Vec<String>,
    pub working_directory: String,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct RuntimeStatus {
    pub runtime_kind: String,
    pub configured: bool,
    pub workspace_initialized: bool,
}

#[derive(Debug, Clone)]
pub struct RuntimeGateway {
    runtime_root: PathBuf,
}

impl RuntimeGateway {
    pub fn new(runtime_root: impl Into<PathBuf>) -> Self {
        Self {
            runtime_root: runtime_root.into(),
        }
    }

    pub fn bootstrap(&self) -> RuntimeBootstrap {
        RuntimeBootstrap {
            command: "python".to_string(),
            args: vec!["-m".to_string(), "dossier_runtime".to_string()],
            working_directory: self.runtime_root.display().to_string(),
        }
    }

    pub fn status(&self, workspace_root: Option<&Path>) -> RuntimeStatus {
        RuntimeStatus {
            runtime_kind: "python-local-runtime".to_string(),
            configured: self.runtime_root.exists(),
            workspace_initialized: workspace_root.is_some_and(Path::exists),
        }
    }
}
