use dossier_desktop_lib::runtime_gateway::RuntimeGateway;
use dossier_desktop_lib::storage::{initialize_workspace, list_documents, register_document};
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

#[test]
fn document_registry_persists_local_documents() {
    let temp_dir = tempfile::tempdir().expect("temp dir should be created");
    initialize_workspace(temp_dir.path()).expect("workspace should initialize");

    let source_file = temp_dir.path().join("invoice_demo.pdf");
    std::fs::write(&source_file, b"demo").expect("source file should be written");

    let record = register_document(temp_dir.path(), &source_file, "generic_parse", 2, true)
        .expect("document should register");
    let documents = list_documents(temp_dir.path()).expect("documents should list");

    assert_eq!(documents.len(), 1);
    assert_eq!(documents[0].document_id, record.document_id);
    assert_eq!(documents[0].file_name, "invoice_demo.pdf");
    assert_eq!(documents[0].mode_hint, "generic_parse");
}
