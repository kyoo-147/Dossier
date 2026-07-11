import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { WorkstationShell } from "../../app/layout/WorkstationShell.js";
import { DocumentRailShell } from "../../app/layout/DocumentRailShell.js";
import { DocumentViewerShell } from "../../app/layout/DocumentViewerShell.js";
import { DocumentInspectorShell } from "../../app/layout/DocumentInspectorShell.js";
import { WorkbenchShell } from "../../app/layout/WorkbenchShell.js";
import { EvidenceCanvasOverlay, type EvidenceRegion } from "../../app/layout/EvidenceCanvasOverlay.js";
import { useRuntimeContext } from "../../app/platform/runtimeContext.js";
import { ActionPanel } from "./ActionPanel.js";
import { FieldTable, type WorkspaceFieldRow } from "./FieldTable.js";
import { RiskPanel } from "./RiskPanel.js";
import { resolveWorkspaceFixture } from "./workspaceFixtures.js";

function deriveWorkspace(
  fallback: ReturnType<typeof resolveWorkspaceFixture>["workspace"],
  result:
    | {
        fields: Array<{ field_id: string; label: string; observed_value?: string; normalized_value: string; human_approved_value?: string | null; status?: string }>;
        warnings: Array<{ code: string; message: string }>;
        review_tasks: Array<{ review_task_id: string; status: string }>;
        revisions?: Array<{ summary: string }>;
        approval_audit?: Array<{ action: string; actor: string }>;
        repair?: { attempts: Array<{ strategy: string; result: string }> };
        run: { run_id: string; status: string };
        source?: { artifact_ref?: string | null; artifact_sha256?: string | null; text_extraction?: { status: string; adapter: string; characters: number } };
      }
    | undefined
) {
  if (!result) {
    return {
      fields: fallback.fields.map(
        (field, index) =>
          ({
            fieldId: `fixture_field_${index + 1}`,
            label: field.label,
            observedValue: field.value,
            normalizedValue: field.value,
            humanApprovedValue: null,
            status: field.status === "warning" ? "warning" : "approved"
          }) satisfies WorkspaceFieldRow
      ),
      warnings: fallback.warnings,
      riskSummary: fallback.riskSummary,
      riskScore: fallback.riskScore,
      logs: fallback.logs
    };
  }

  return {
    fields: result.fields.map(
      (field) =>
        ({
          fieldId: field.field_id,
          label: field.label,
          observedValue: field.observed_value ?? field.normalized_value,
          normalizedValue: field.normalized_value,
          humanApprovedValue: field.human_approved_value ?? null,
          status: field.status === "warning" ? "warning" : field.status === "needs_review" ? "needs_review" : "approved"
        }) satisfies WorkspaceFieldRow
    ),
    warnings: result.warnings.map((warning) => warning.message),
    riskSummary:
      result.warnings.length > 0
        ? result.warnings.map((warning) => `${warning.code}: ${warning.message}`)
        : ["No validation warnings after current run"],
    riskScore: `${Math.min(result.warnings.length * 18, 99)}%`,
    logs: [
      `Run ${result.run.run_id} -> ${result.run.status}`,
      result.source?.artifact_ref ? `Artifact ${result.source.artifact_ref}` : "Artifact reference not available",
      result.source?.text_extraction
        ? `Text extraction ${result.source.text_extraction.status} via ${result.source.text_extraction.adapter} (${result.source.text_extraction.characters} chars)`
        : "Text extraction not reported",
      ...result.review_tasks.map((task) => `Review task ${task.review_task_id} -> ${task.status}`),
      ...(result.revisions?.map((revision) => `Revision -> ${revision.summary}`) ?? []),
      ...(result.approval_audit?.map((record) => `Approval audit -> ${record.action} by ${record.actor}`) ?? []),
      ...(result.repair?.attempts.map((attempt) => `Repair ${attempt.strategy} -> ${attempt.result}`) ?? [])
    ]
  };
}

export function WorkspacePage() {
  const [searchParams] = useSearchParams();
  const fixture = searchParams.get("document") ? null : resolveWorkspaceFixture(searchParams.get("fixture"));
  const documentId = searchParams.get("document");
  const {
    documents,
    sessions,
    processFixture,
    processDocument,
    approveSessionAndExport,
    saveSessionExport,
    revealSessionExport,
    editSessionField,
    rejectSessionRun,
    cancelSessionRun
  } = useRuntimeContext();
  const document = documentId ? documents.find((item) => item.document_id === documentId) ?? null : null;
  const sessionKey = document?.document_id ?? fixture?.fixtureId ?? "";
  const session = sessionKey ? sessions[sessionKey] : undefined;
  const fallbackWorkspace = fixture
    ? fixture.workspace
    : {
        documentTitle: document?.file_name ?? "Local document",
        subtitle: document?.source_path ?? "No path",
        fields: [],
        riskScore: "0%",
        riskSummary: ["No runtime result yet"],
        warnings: [],
        logs: ["Document registered in local desktop catalog"]
      };
  const workspace = deriveWorkspace(fallbackWorkspace, session?.result);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(workspace.fields[0]?.fieldId ?? null);
  const selectedField = useMemo(
    () => workspace.fields.find((field) => field.fieldId === selectedFieldId) ?? workspace.fields[0] ?? null,
    [selectedFieldId, workspace.fields]
  );
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (workspace.fields.some((field) => field.fieldId === selectedFieldId)) return;
    const first = workspace.fields[0] ?? null;
    setSelectedFieldId(first?.fieldId ?? null);
    setEditValue(first?.normalizedValue ?? "");
  }, [selectedFieldId, workspace.fields]);

  const stateLabel = session?.processing ? "processing" : session?.error ? "failed" : session?.artifactRef ? "export_ready" : session?.result?.run.status ?? "empty";
  const documentMeta = fixture
    ? `${fixture.industry} · ${fixture.mode} · ${fixture.bucket}`
    : `${document?.mode_hint ?? "generic_parse"} · ${document?.source_type ?? "document"} · local`;
  const extraction = session?.result?.source?.text_extraction;
  const artifactRef = session?.result?.source?.artifact_ref ?? document?.artifact_ref ?? null;
  const artifactHash = session?.result?.source?.artifact_sha256 ?? document?.artifact_sha256 ?? null;
  const runEvents = session?.events ?? [];
  const evidenceRegions: EvidenceRegion[] = workspace.fields.slice(0, 5).map((field, index) => {
    const templates = [
      { x: 0.07, y: 0.23, w: 0.86, h: 0.10, tone: "warning" as const },
      { x: 0.07, y: 0.35, w: 0.70, h: 0.10, tone: "accent" as const },
      { x: 0.07, y: 0.47, w: 0.86, h: 0.16, tone: "success" as const },
      { x: 0.07, y: 0.66, w: 0.86, h: 0.09, tone: "accent" as const },
      { x: 0.07, y: 0.80, w: 0.86, h: 0.13, tone: "warning" as const }
    ];
    const template = templates[index] ?? templates[templates.length - 1]!;
    return { ...template, id: field.fieldId, label: field.label };
  });

  return (
    <WorkstationShell
      documentRail={
        <DocumentRailShell
          header={
            <>
              <strong>{fallbackWorkspace.documentTitle}</strong>
              <span>{fallbackWorkspace.subtitle}</span>
              <small>{documentMeta}</small>
              <small>State: {stateLabel}</small>
            </>
          }
          footer={
            <>
              <button className="rail-add">+ <span>Add page</span></button>
              <button className="rail-more">...</button>
            </>
          }
        >
          <div className="thumbnail-list">
            {[1, 2].map((page) => (
              <button className={`page-thumbnail${page === 1 ? " page-thumbnail--active" : ""}`} key={page} aria-label={`Page ${page}`}>
                <span className="thumbnail-paper">
                  <span className="thumbnail-title" />
                  <span className="thumbnail-line thumbnail-line--long" />
                  <span className="thumbnail-line" />
                  <span className="thumbnail-grid" />
                  <span className="thumbnail-signatures" />
                </span>
                <span className="page-number">{page}</span>
              </button>
            ))}
          </div>
        </DocumentRailShell>
      }
      viewer={
        <DocumentViewerShell
          toolbar={
            <>
              <div className="toolbar-group"><button>Back</button><button>Pan</button></div>
              <div className="toolbar-group toolbar-zoom"><button>-</button><strong>114%</strong><button>+</button></div>
              <div className="toolbar-spacer" />
              <button aria-label="Toggle panels">Panels</button>
            </>
          }
          modes={
            <>
              <button className="viewer-mode viewer-mode--active">Regions</button>
              <button className="viewer-mode">OCR</button>
              <button className="viewer-mode">Table</button>
              <button className="viewer-mode">Heatmap</button>
              <span />
              <button className="viewer-mode">Fit</button>
            </>
          }
        >
          <article className="document-paper document-paper--runtime" aria-label="Document preview">
            <div className="runtime-page-kicker">DOSSIER SOURCE ARTIFACT</div>
            <div className="runtime-page-title">{fallbackWorkspace.documentTitle}</div>
            <div className="runtime-page-meta">{documentMeta}</div>
            <div className="runtime-page-block"><strong>Artifact</strong><span>{artifactRef ?? "Run or import a document to bind an artifact."}</span></div>
            <div className="runtime-page-block"><strong>SHA-256</strong><span>{artifactHash ?? "Not available"}</span></div>
            <div className="runtime-page-grid">
              {workspace.fields.slice(0, 8).map((field, index) => (
                <button key={field.fieldId} className={`runtime-evidence-row${field.fieldId === selectedField?.fieldId ? " runtime-evidence-row--active" : ""}`} onClick={() => setSelectedFieldId(field.fieldId)}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{field.label}</strong>
                  <em>{field.normalizedValue}</em>
                </button>
              ))}
              {workspace.fields.length === 0 ? <div className="runtime-empty-evidence">No extracted fields yet. Run the document to create evidence-linked candidates.</div> : null}
            </div>
            <div className="runtime-page-status">
              <span>Extraction: {extraction?.status ?? "not run"}</span>
              <span>Adapter: {extraction?.adapter ?? "none"}</span>
              <span>Chars: {extraction?.characters ?? 0}</span>
            </div>
            <EvidenceCanvasOverlay
              regions={evidenceRegions}
              selectedRegionId={selectedField?.fieldId ?? null}
              onSelectRegion={(fieldId) => {
                setSelectedFieldId(fieldId);
                setEditValue(workspace.fields.find((field) => field.fieldId === fieldId)?.normalizedValue ?? "");
              }}
            />
          </article>
        </DocumentViewerShell>
      }
      inspector={
        <DocumentInspectorShell
          tabs={
            <>
              <button className="panel-tab panel-tab--active">Extracted Fields</button>
              <button className="panel-tab">Validation</button>
              <button className="panel-tab">Risk & Anomaly</button>
              <button className="panel-tab">Metadata</button>
            </>
          }
        >
          <FieldTable
            fields={workspace.fields}
            selectedFieldId={selectedFieldId}
            onSelectField={(fieldId) => {
              setSelectedFieldId(fieldId);
              setEditValue(workspace.fields.find((field) => field.fieldId === fieldId)?.normalizedValue ?? "");
            }}
          />
          <div className="field-edit-panel">
            <div className="panel-heading">Field review</div>
            <div className="panel-caption">Observed: {selectedField?.observedValue ?? "-"} · Normalized: {selectedField?.normalizedValue ?? "-"}</div>
            <input className="input" value={editValue} placeholder={selectedField?.normalizedValue ?? "Select a field"} onChange={(event) => setEditValue(event.target.value)} />
            <div className="button-row">
              <button className="button button--primary" disabled={!session?.result || !selectedField || !editValue} onClick={() => { if (!selectedField || !sessionKey) return; void editSessionField(sessionKey, selectedField.fieldId, editValue, "workspace manual correction"); setEditValue(""); }}>Apply human edit</button>
              <button className="button button--danger" disabled={!session?.result} onClick={() => sessionKey ? void rejectSessionRun(sessionKey, "Rejected from workspace review") : undefined}>Reject run</button>
              <button className="button" disabled={!session?.result || session.result.run.status === "canceled"} onClick={() => sessionKey ? void cancelSessionRun(sessionKey, "Canceled from workspace") : undefined}>Cancel run</button>
            </div>
          </div>
          <RiskPanel riskScore={workspace.riskScore} riskSummary={workspace.riskSummary} />
        </DocumentInspectorShell>
      }
      workbench={
        <WorkbenchShell
          mainTabs={
            <>
              <button className="panel-tab panel-tab--active">Agent Logs</button>
              <button className="panel-tab">Self-Correction</button>
              <button className="panel-tab">Errors & Warnings</button>
              <button className="panel-tab">History</button>
            </>
          }
          mainContent={
            <div className="log-list">
              {[...workspace.logs, ...runEvents.map((event) => `#${event.sequence} ${event.type} -> ${event.status ?? "event"}`)].map((entry, index) => (
                <div className="log-row" key={`${entry}-${index}`}><time>{`10:21:${String(14 + index * 3).padStart(2, "0")}`}</time><span>{entry}</span></div>
              ))}
            </div>
          }
          summaryContent={
            <>
              <div className="panel-heading">{workspace.warnings.length} Issues Detected</div>
              {workspace.warnings.length === 0 ? <p className="empty-copy">No blocking issues.</p> : <ul>{workspace.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}
            </>
          }
          actionPanel={
            <ActionPanel
              processing={session?.processing ?? false}
              hasRun={Boolean(session?.result)}
              canApprove={Boolean(session?.result?.run.run_id)}
              canSaveExport={Boolean(session?.artifactRef)}
              artifactRef={session?.artifactRef}
              savedExportPath={session?.savedExportPath}
              revealedExportPath={session?.revealedExportPath}
              error={session?.error}
              onProcess={() => fixture ? void processFixture(fixture) : document ? void processDocument(document) : undefined}
              onApproveAndExport={() => sessionKey ? void approveSessionAndExport(sessionKey) : undefined}
              onSaveExport={() => sessionKey ? void saveSessionExport(sessionKey) : undefined}
              onRevealExport={() => sessionKey ? void revealSessionExport(sessionKey) : undefined}
            />
          }
        />
      }
    />
  );
}
