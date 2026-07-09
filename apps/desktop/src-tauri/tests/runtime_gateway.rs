use dossier_desktop_lib::runtime_gateway::RuntimeGateway;
use dossier_desktop_lib::storage::initialize_workspace;
use std::path::PathBuf;

#[test]
fn runtime_gateway_builds_python_bootstrap() {
    let gateway = RuntimeGateway::new(PathBuf::from("D:/working/Dossier/apps/local-runtime"));
    let bootstrap = gateway.bootstrap();

    assert_eq!(bootstrap.command, "python");
    assert_eq!(bootstrap.args, vec!["-m".to_string(), "dossier_runtime".to_string()]);
}

#[test]
fn workspace_initializer_creates_dossier_state_tree() {
    let temp_dir = tempfile::tempdir().expect("temp dir should be created");
    let paths = initialize_workspace(temp_dir.path()).expect("workspace should initialize");

    assert!(temp_dir.path().join(".dossier/state").exists());
    assert!(temp_dir.path().join(".dossier/artifacts").exists());
    assert!(paths.state_dir.ends_with(".dossier\\state") || paths.state_dir.ends_with(".dossier/state"));
}
