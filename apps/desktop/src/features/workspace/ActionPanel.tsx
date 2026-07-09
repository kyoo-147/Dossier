interface ActionPanelProps {
  processing: boolean;
  hasRun: boolean;
  canApprove: boolean;
  artifactRef?: string | undefined;
  error?: string | undefined;
  onProcess(): void;
  onApproveAndExport(): void;
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
  artifactRef,
  error,
  onProcess,
  onApproveAndExport
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
      <div style={{ color: "#6b7280", fontSize: 13 }}>
        {artifactRef ? `Last export: ${artifactRef}` : "No export artifact yet"}
      </div>
      {error ? <div style={{ color: "#b91c1c", fontSize: 13 }}>{error}</div> : null}
    </div>
  );
}
