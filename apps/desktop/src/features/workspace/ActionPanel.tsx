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

export function ActionPanel({ processing, hasRun, canApprove, canSaveExport, artifactRef, savedExportPath, revealedExportPath, error, onProcess, onApproveAndExport, onSaveExport, onRevealExport }: ActionPanelProps) {
  return <div className="action-panel">
    <div className="panel-heading">Actions</div>
    <button className="button button--primary" disabled={processing} onClick={onProcess}>{processing ? "Processing..." : hasRun ? "Re-run pipeline" : "Run local pipeline"}</button>
    <button className="button" disabled={processing || !canApprove} onClick={onApproveAndExport}>Approve & Export JSON</button>
    <button className="button" disabled={processing || !canSaveExport} onClick={onSaveExport}>Save export to disk</button>
    <button className="button" disabled={processing || !savedExportPath} onClick={onRevealExport}>Reveal export in folder</button>
    <div className="action-meta">{artifactRef ? `Last export: ${artifactRef}` : "No export artifact yet"}</div>
    <div className="action-meta">{savedExportPath ? `Saved to: ${savedExportPath}` : "Export has not been saved to disk"}</div>
    <div className="action-meta">{revealedExportPath ? `Revealed in file explorer: ${revealedExportPath}` : "Export location has not been revealed"}</div>
    {error ? <div className="action-error">{error}</div> : null}
  </div>;
}
