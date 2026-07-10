interface ActionPanelProps {
  processing: boolean;
  hasRun: boolean;
  canApprove: boolean;
  canSaveExport: boolean;
  artifactRef?: string | undefined;
  savedExportPath?: string | undefined;
  revealedExportPath?: string | undefined;
  error?: string | undefined;
  onProcess(): void;
  onApproveAndExport(): void;
  onSaveExport(): void;
  onRevealExport(): void;
}

function buttonStyle(primary = false) {
  return {
    padding: "10px 12px",
    border: primary ? "1px solid #2563eb" : "1px solid #d1d5db",
    background: primary ? "#2563eb" : "#fff",
    color: primary ? "#fff" : "#111827",
    cursor: "pointer"
  } as const;
}

export function ActionPanel({
  processing,
  hasRun,
  canApprove,
  canSaveExport,
  artifactRef,
  savedExportPath,
  revealedExportPath,
  error,
  onProcess,
  onApproveAndExport,
  onSaveExport,
  onRevealExport
}: ActionPanelProps) {
  return (
    <div style={{ border: "1px solid #d1d5db", background: "#fff", padding: 12, display: "grid", gap: 10 }}>
      <div style={{ fontWeight: 600 }}>Actions</div>
      <button disabled={processing} onClick={onProcess} style={buttonStyle(true)}>
        {processing ? "Processing..." : hasRun ? "Re-run pipeline" : "Run local pipeline"}
      </button>
      <button disabled={processing || !canApprove} onClick={onApproveAndExport} style={buttonStyle()}>
        Approve & Export JSON
      </button>
      <button disabled={processing || !canSaveExport} onClick={onSaveExport} style={buttonStyle()}>
        Save export to disk
      </button>
      <button disabled={processing || !savedExportPath} onClick={onRevealExport} style={buttonStyle()}>
        Reveal export in folder
      </button>
      <div style={{ color: "#6b7280", fontSize: 13 }}>
        {artifactRef ? `Last export: ${artifactRef}` : "No export artifact yet"}
      </div>
      <div style={{ color: "#6b7280", fontSize: 13 }}>
        {savedExportPath ? `Saved to: ${savedExportPath}` : "Export has not been saved to disk"}
      </div>
      <div style={{ color: "#6b7280", fontSize: 13 }}>
        {revealedExportPath ? `Revealed in file explorer: ${revealedExportPath}` : "Export location has not been revealed"}
      </div>
      {error ? <div style={{ color: "#b91c1c", fontSize: 13 }}>{error}</div> : null}
    </div>
  );
}
