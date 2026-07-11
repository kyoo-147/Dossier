import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { WorkstationShell } from "../../app/layout/WorkstationShell.js";
import { DocumentViewerShell } from "../../app/layout/DocumentViewerShell.js";
import { DocumentInspectorShell } from "../../app/layout/DocumentInspectorShell.js";
import { WorkbenchShell } from "../../app/layout/WorkbenchShell.js";
import { EvidenceCanvasOverlay, type EvidenceRegion } from "../../app/layout/EvidenceCanvasOverlay.js";
import { useRuntimeContext } from "../../app/platform/runtimeContext.js";
import { resolveWorkspaceFixture, reviewFixtures } from "../workspace/workspaceFixtures.js";
import { ReviewInspector } from "./ReviewInspector.js";

export function ReviewPage() {
  const [searchParams] = useSearchParams();
  const fixtureId = searchParams.get("fixture");
  const documentId = searchParams.get("document");
  const {
    documents,
    sessions,
    refreshReview,
    editField,
    approveAndExport,
    rejectRun,
    refreshSessionReview,
    editSessionField,
    approveSessionAndExport,
    rejectSessionRun,
    cancelSessionRun
  } = useRuntimeContext();
  const fixture = documentId ? null : resolveWorkspaceFixture(fixtureId);
  const document = documentId ? documents.find((item) => item.document_id === documentId) ?? null : null;
  const sessionKey = document?.document_id ?? fixture?.fixtureId ?? "";
  const session = sessionKey ? sessions[sessionKey] : undefined;
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0);
  const [editValue, setEditValue] = useState("");
  const warnings = session?.result?.warnings.map((warning) => warning.message) ?? fixture?.workspace.warnings ?? [];
  const reviewTasks = session?.reviewTasks ?? session?.result?.review_tasks ?? [];
  const revisions = session?.revisions ?? session?.result?.revisions ?? [];
  const approvalAudit = session?.approvalAudit ?? session?.result?.approval_audit ?? [];
  const localReviewDocuments = documents.filter((item) =>
    (sessions[item.document_id]?.reviewTasks ?? sessions[item.document_id]?.result?.review_tasks ?? []).some((task) => task.status !== "resolved" && task.status !== "approved")
  );
  const editableField = useMemo(() => session?.result?.fields.find((field) => field.status === "warning") ?? session?.result?.fields[0] ?? null, [session?.result]);
  const title = fixture?.fileName ?? document?.file_name ?? "No document selected";
  const source = session?.result?.source;
  const runEvents = session?.events ?? [];
  const reviewRegions: EvidenceRegion[] = [
    { id: "review-reason", label: "Review reason", x: 0.04, y: 0.25, w: 0.92, h: 0.08, tone: "warning" },
    { id: "review-grid", label: "Evidence grid", x: 0.04, y: 0.43, w: 0.92, h: 0.23, tone: "accent" },
    { id: "approval-signature", label: "Approval signature", x: 0.52, y: 0.76, w: 0.42, h: 0.15, tone: "success" }
  ];

  useEffect(() => {
    if (fixture && session?.result?.run.run_id) void refreshReview(fixture);
    else if (sessionKey && session?.result?.run.run_id) void refreshSessionReview(sessionKey);
  }, [fixture, refreshReview, refreshSessionReview, session?.result?.run.run_id, sessionKey]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "j") setSelectedTaskIndex((current) => Math.min(current + 1, Math.max(reviewTasks.length - 1, 0)));
      if (event.key === "k") setSelectedTaskIndex((current) => Math.max(current - 1, 0));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [reviewTasks.length]);

  return (
    <WorkstationShell
      documentRail={
        <div className="review-queue-rail">
          <header className="review-rail-header">
            <span className="eyebrow">Human review</span>
            <strong>Current Run</strong>
            <small>{reviewFixtures.length + localReviewDocuments.length} documents require attention</small>
          </header>
          <div className="review-queue-list">
            {reviewFixtures.map((item) => (
              <Link key={item.fixtureId} to={`/review?fixture=${item.fixtureId}`} className={`review-queue-item${item.fixtureId === fixture?.fixtureId ? " review-queue-item--active" : ""}`}>
                <span className="queue-file-icon">PDF</span>
                <span><strong>{item.fileName}</strong><small>{item.industry} · {item.bucket}</small></span>
                <em>{item.expectedReview ? "Review" : "Ready"}</em>
              </Link>
            ))}
            <div className="queue-section-label">Local review queue</div>
            {localReviewDocuments.length === 0 ? (
              <p className="queue-empty">No local documents waiting for review.</p>
            ) : (
              localReviewDocuments.map((item) => (
                <Link key={item.document_id} to={`/review?document=${item.document_id}`} className={`review-queue-item${item.document_id === document?.document_id ? " review-queue-item--active" : ""}`}>
                  <span className="queue-file-icon">PDF</span>
                  <span><strong>{item.file_name}</strong><small>{item.mode_hint} · local</small></span>
                  <em>Review</em>
                </Link>
              ))
            )}
          </div>
        </div>
      }
      viewer={
        <DocumentViewerShell
          toolbar={
            <>
              <div className="toolbar-group"><button>Back</button><button>Pan</button></div>
              <div className="toolbar-group toolbar-zoom"><button>-</button><strong>114%</strong><button>+</button></div>
              <div className="toolbar-spacer" />
              <button>Panels</button>
            </>
          }
          modes={
            <>
              <button className="viewer-mode viewer-mode--active">Evidence</button>
              <button className="viewer-mode">OCR</button>
              <button className="viewer-mode">Fields</button>
              <button className="viewer-mode">Risk</button>
              <span />
              <button className="viewer-mode">Fit</button>
            </>
          }
        >
          <article className="document-paper review-document document-paper--runtime">
            <div className="review-document__title">REVIEW EVIDENCE COPY</div>
            <div className="review-document__meta">{title}<br />Evidence-linked extraction · Human approval required</div>
            <div className="review-form-block"><strong>Run identifier</strong><span>{session?.result?.run.run_id ?? "Awaiting pipeline result"}</span></div>
            <div className="review-form-block"><strong>Artifact</strong><span>{source?.artifact_ref ?? document?.artifact_ref ?? "No artifact bound"}</span></div>
            <div className="review-form-block"><strong>Text extraction</strong><span>{source?.text_extraction ? `${source.text_extraction.status} via ${source.text_extraction.adapter}` : "Not run"}</span></div>
            <div className="review-form-block review-form-block--warn"><strong>Detected review reason</strong><span>{warnings[0] ?? "No active warning"}</span></div>
            <div className="review-sheet-grid">{Array.from({ length: 18 }, (_, index) => <span key={index} />)}</div>
            <div className="review-signature"><span>Reviewer notes</span><span>Approval signature</span></div>
            <EvidenceCanvasOverlay regions={reviewRegions} selectedRegionId={reviewRegions[Math.min(selectedTaskIndex, reviewRegions.length - 1)]?.id ?? null} />
          </article>
        </DocumentViewerShell>
      }
      inspector={
        <DocumentInspectorShell
          tabs={
            <>
              <button className="panel-tab panel-tab--active">Review Tasks</button>
              <button className="panel-tab">Validation</button>
              <button className="panel-tab">Evidence</button>
              <button className="panel-tab">Audit</button>
            </>
          }
        >
          <div className="review-document-heading"><span className="eyebrow">Approval actions</span><strong>{title}</strong><small>Keyboard: j / k to move review selection</small></div>
          <ReviewInspector warnings={warnings} reviewTasks={reviewTasks} revisions={revisions} approvalAudit={approvalAudit} selectedTaskIndex={selectedTaskIndex} onSelectTask={setSelectedTaskIndex} />
          <div className="field-edit-panel">
            <div className="panel-heading">Field-level review</div>
            <div className="panel-caption">Selected field: {editableField?.label ?? "No field loaded"} · Current: {editableField?.normalized_value ?? "-"}</div>
            <input className="input" value={editValue} placeholder={editableField?.normalized_value ?? "Run a document first"} onChange={(event) => setEditValue(event.target.value)} />
            <button className="button button--primary" disabled={!session?.result || !editableField || !editValue} onClick={() => { if (!editableField || !sessionKey) return; if (fixture) void editField(fixture, editableField.field_id, editValue, "review page manual correction"); else void editSessionField(sessionKey, editableField.field_id, editValue, "review page manual correction"); setEditValue(""); }}>Apply field correction</button>
          </div>
        </DocumentInspectorShell>
      }
      workbench={
        <WorkbenchShell
          mainTabs={
            <>
              <button className="panel-tab panel-tab--active">Run Trace</button>
              <button className="panel-tab">Issue Summary</button>
              <button className="panel-tab">Approval Audit</button>
              <button className="panel-tab">History</button>
            </>
          }
          mainContent={
            <div className="review-event-list">
              {runEvents.length === 0 ? (
                warnings.length === 0 ? <div className="empty-copy">No warnings loaded for this document.</div> : warnings.map((warning, index) => <div className="review-event" key={warning}><span className="event-index">{String(index + 1).padStart(2, "0")}</span><span><strong>{warning}</strong><small>Evidence attached · Field-level decision required</small></span></div>)
              ) : (
                runEvents.map((event) => <div className="review-event" key={event.sequence}><span className="event-index">{String(event.sequence).padStart(2, "0")}</span><span><strong>{event.type}</strong><small>{event.status ?? "event"} · {event.emitted_at}</small></span></div>)
              )}
            </div>
          }
          summaryContent={
            <>
              <div className="panel-heading">Decision summary</div>
              <dl><div><dt>Tasks</dt><dd>{reviewTasks.length}</dd></div><div><dt>Warnings</dt><dd>{warnings.length}</dd></div><div><dt>Events</dt><dd>{runEvents.length}</dd></div><div><dt>Revisions</dt><dd>{revisions.length}</dd></div></dl>
            </>
          }
          actionPanel={
            <div className="review-actions">
              <div className="panel-heading">Actions</div>
              <button className="button button--danger" disabled={!session?.result} onClick={() => { if (!sessionKey) return; if (fixture) void rejectRun(fixture, "Rejected from review page"); else void rejectSessionRun(sessionKey, "Rejected from review page"); }}>Reject run</button>
              <button className="button" disabled={!session?.result || session.result.run.status === "canceled"} onClick={() => sessionKey ? void cancelSessionRun(sessionKey, "Canceled from review page") : undefined}>Cancel run</button>
              <button className="button button--primary" disabled={!session?.result || session.result.run.status === "canceled" || session.result.run.status === "failed"} onClick={() => { if (!sessionKey) return; if (fixture) void approveAndExport(fixture); else void approveSessionAndExport(sessionKey); }}>Approve and export JSON</button>
              <div className="action-meta">{session?.artifactRef ? `Last export: ${session.artifactRef}` : "No export artifact yet"}</div>
            </div>
          }
        />
      }
    />
  );
}
