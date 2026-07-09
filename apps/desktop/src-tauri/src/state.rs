use crate::runtime_gateway::RuntimeGateway;
use crate::storage::WorkspacePaths;
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Clone, Default)]
pub struct KernelState {
    pub workspace_root: Option<PathBuf>,
    pub workspace_paths: Option<WorkspacePaths>,
}

pub struct AppState {
    pub kernel: Mutex<KernelState>,
    pub runtime_gateway: RuntimeGateway,
}

impl AppState {
    pub fn new(runtime_gateway: RuntimeGateway) -> Self {
        Self {
            kernel: Mutex::new(KernelState::default()),
            runtime_gateway,
        }
    }
}
