use dossier_desktop_lib::runtime_gateway::RuntimeGateway;
use dossier_desktop_lib::storage::{
    copy_artifact_to_destination, initialize_workspace, list_artifact_manifests, list_documents,
    register_document, resolve_runtime_root,
};
use std::path::PathBuf;

#[test]
fn runtime_gateway_builds_python_bootstrap() {
    let gateway = RuntimeGateway::new(PathBuf::from("D:/working/Dossier/apps/local-runtime"));
    let bootstrap = gateway.bootstrap();

    assert_eq!(bootstrap.command, "python");
    assert_eq!(
        bootstrap.args,
        vec!["-m".to_string(), "dossier_runtime".to_string()]
    );
    assert_ne!(bootstrap.port, 0);
    assert!(bootstrap.base_url.starts_with("http://127.0.0.1:"));
    assert!(bootstrap.auth_required);
}

#[test]
fn runtime_gateway_allocates_independent_loopback_ports() {
    let first = RuntimeGateway::new(PathBuf::from("D:/working/Dossier/apps/local-runtime"));
    let second = RuntimeGateway::new(PathBuf::from("D:/working/Dossier/apps/local-runtime"));

    assert_ne!(first.bootstrap().port, 0);
    assert_ne!(second.bootstrap().port, 0);
}

#[test]
fn runtime_root_prefers_bundled_resource_dir() {
    let temp_dir = tempfile::tempdir().expect("temp dir should be created");
    let resource_dir = temp_dir.path().join("resources");
    let bundled_runtime = resource_dir.join("local-runtime");
    std::fs::create_dir_all(&bundled_runtime).expect("bundled runtime should be created");

    let resolved = resolve_runtime_root(Some(resource_dir.as_path()));

    assert_eq!(resolved, bundled_runtime);
}

#[test]
fn workspace_initializer_creates_dossier_state_tree() {
    let temp_dir = tempfile::tempdir().expect("temp dir should be created");
    let paths = initialize_workspace(temp_dir.path()).expect("workspace should initialize");

    assert!(temp_dir.path().join(".dossier/state").exists());
    assert!(temp_dir.path().join(".dossier/artifacts").exists());
    assert!(
        paths.state_dir.ends_with(".dossier\\state") || paths.state_dir.ends_with(".dossier/state")
    );
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
    assert!(documents[0].artifact_ref.starts_with("artifact://"));
    assert_eq!(documents[0].artifact_size, 4);
    assert!(
        temp_dir
            .path()
            .join(".dossier/artifacts")
            .join(documents[0].artifact_ref.trim_start_matches("artifact://"))
            .exists()
    );

    let manifests = list_artifact_manifests(temp_dir.path()).expect("artifact manifests should list");
    assert_eq!(manifests.len(), 1);
    assert_eq!(manifests[0].artifact_ref, documents[0].artifact_ref);
    assert_eq!(manifests[0].sha256, documents[0].artifact_sha256);
    assert_eq!(manifests[0].source_type, "pdf");
    assert_eq!(manifests[0].original_name, "invoice_demo.pdf");
}

#[test]
fn artifact_copy_saves_to_requested_destination() {
    let temp_dir = tempfile::tempdir().expect("temp dir should be created");
    initialize_workspace(temp_dir.path()).expect("workspace should initialize");

    let artifact_dir = temp_dir.path().join(".dossier/state/runtime/artifacts");
    std::fs::create_dir_all(&artifact_dir).expect("artifact dir should exist");
    std::fs::write(artifact_dir.join("demo.json"), br#"{"ok":true}"#)
        .expect("artifact should be written");

    let destination = temp_dir.path().join("exports/final.json");
    let saved = copy_artifact_to_destination(temp_dir.path(), "artifact://demo.json", &destination)
        .expect("artifact should copy");

    assert_eq!(saved, destination.display().to_string());
    assert!(destination.exists());
}
