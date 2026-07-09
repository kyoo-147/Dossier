use reqwest::blocking::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::thread;
use std::time::Duration;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

const DEFAULT_RUNTIME_PORT: u16 = 47821;
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct RuntimeBootstrap {
    pub command: String,
    pub args: Vec<String>,
    pub working_directory: String,
    pub base_url: String,
    pub port: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct RuntimeStatus {
    pub runtime_kind: String,
    pub configured: bool,
    pub workspace_initialized: bool,
    pub runtime_running: bool,
    pub base_url: String,
    pub port: u16,
}

#[derive(Debug, Clone)]
pub struct RuntimeGateway {
    runtime_root: PathBuf,
    client: Client,
}

impl RuntimeGateway {
    pub fn new(runtime_root: impl Into<PathBuf>) -> Self {
        Self {
            runtime_root: runtime_root.into(),
            client: Client::builder()
                .timeout(Duration::from_secs(30))
                .build()
                .expect("runtime gateway HTTP client should be constructed"),
        }
    }

    pub fn bootstrap(&self) -> RuntimeBootstrap {
        RuntimeBootstrap {
            command: "python".to_string(),
            args: vec!["-m".to_string(), "dossier_runtime".to_string()],
            working_directory: self.runtime_root.display().to_string(),
            base_url: self.base_url(),
            port: DEFAULT_RUNTIME_PORT,
        }
    }

    pub fn status(&self, workspace_root: Option<&Path>) -> RuntimeStatus {
        RuntimeStatus {
            runtime_kind: "python-local-runtime".to_string(),
            configured: self.runtime_root.exists(),
            workspace_initialized: workspace_root.is_some_and(Path::exists),
            runtime_running: self.health_check().is_ok(),
            base_url: self.base_url(),
            port: DEFAULT_RUNTIME_PORT,
        }
    }

    pub fn spawn_runtime(&self, state_dir: &Path) -> Result<Child, String> {
        let mut command = Command::new("python");
        command
            .arg("-m")
            .arg("dossier_runtime")
            .current_dir(&self.runtime_root)
            .env("PYTHONPATH", "src")
            .env("DOSSIER_RUNTIME_HOST", "127.0.0.1")
            .env("DOSSIER_RUNTIME_PORT", DEFAULT_RUNTIME_PORT.to_string())
            .env("DOSSIER_STATE_ROOT", state_dir.display().to_string())
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null());

        #[cfg(windows)]
        command.creation_flags(CREATE_NO_WINDOW);

        command
            .spawn()
            .map_err(|error| format!("failed to spawn runtime: {error}"))
    }

    pub fn wait_until_ready(&self) -> Result<(), String> {
        for _ in 0..30 {
            if self.health_check().is_ok() {
                return Ok(());
            }
            thread::sleep(Duration::from_millis(250));
        }

        Err("runtime did not become healthy in time".to_string())
    }

    pub fn health_check(&self) -> Result<Value, String> {
        self.client
            .get(format!("{}/health", self.base_url()))
            .send()
            .and_then(|response| response.error_for_status())
            .map_err(|error| format!("runtime health check failed: {error}"))?
            .json::<Value>()
            .map_err(|error| format!("runtime health JSON decode failed: {error}"))
    }

    pub fn create_run(&self, payload: &Value) -> Result<Value, String> {
        self.post_json("/runs", payload)
    }

    pub fn execute_run(&self, run_id: &str, payload: &Value) -> Result<Value, String> {
        self.post_json(&format!("/runs/{run_id}/execute"), payload)
    }

    pub fn approve_run(&self, run_id: &str) -> Result<Value, String> {
        self.post_json(&format!("/runs/{run_id}/approve"), &Value::Object(Default::default()))
    }

    pub fn export_run(&self, run_id: &str, export_target: &str) -> Result<Value, String> {
        self.post_json(
            &format!("/runs/{run_id}/export/{export_target}"),
            &Value::Object(Default::default()),
        )
    }

    fn post_json(&self, path: &str, payload: &Value) -> Result<Value, String> {
        self.client
            .post(format!("{}{}", self.base_url(), path))
            .json(payload)
            .send()
            .and_then(|response| response.error_for_status())
            .map_err(|error| format!("runtime request failed for {path}: {error}"))?
            .json::<Value>()
            .map_err(|error| format!("runtime JSON decode failed for {path}: {error}"))
    }

    fn base_url(&self) -> String {
        format!("http://127.0.0.1:{DEFAULT_RUNTIME_PORT}")
    }
}
