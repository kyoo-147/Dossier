import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { WorkstationShell } from "../../app/layout/WorkstationShell.js";
import { useRuntimeContext } from "../../app/platform/runtimeContext.js";
import { ActionPanel } from "./ActionPanel.js";
import { FieldTable, type WorkspaceFieldRow } from "./FieldTable.js";
import { RiskPanel } from "./RiskPanel.js";
import { resolveWorkspaceFixture } from "./workspaceFixtures.js";

function deriveWorkspace(
  fallback: ReturnType<typeof resolveWorkspaceFixture>["workspace"],
  result: {
    fields: Array<{ field_id: string; label: string; observed_value?: string; normalized_value: string; human_approved_value?: string | null; status?: string }>;
    warnings: Array<{ code: string; message: string }>;
    review_tasks: Array<{ review_task_id: string; status: string }>;
    revisions?: Array<{ summary: string }>;
    approval_audit?: Array<{ action: string; actor: string }>;
    repair?: { attempts: Array<{ strategy: string; result: string }> };
    run: { run_id: string; status: string };
  } | undefined
) {
  if (!result) {
    return {
      fields: fallback.fields.map((field, index) => ({
        fieldId: `fixture_field_${index + 1}`,
        label: field.label,
        observedValue: field.value,
        normalizedValue: field.value,
        humanApprovedValue: null,
        status: field.status === "warning" ? "warning" : "approved"
      }) satisfies WorkspaceFieldRow),
      warnings: fallback.warnings,
      riskSummary: fallback.riskSummary,
      riskScore: fallback.riskScore,
      logs: fallback.logs
    };
  }

  return {
    fields: result.fields.map((field) => ({
      fieldId: field.field_id,
      label: field.label,
      observedValue: field.observed_value ?? field.normalized_value,
      normalizedValue: field.normalized_value,
      humanApprovedValue: field.human_approved_value ?? null,
      status: field.status === "warning" ? "warning" : field.status === "needs_review" ? "needs_review" : "approved"
    }) satisfies WorkspaceFieldRow),
    warnings: result.warnings.map((warning) => warning.message),
    riskSummary: result.warnings.length > 0
      ? result.warnings.map((warning) => `${warning.code}: ${warning.message}`)
      : ["No validation warnings after current run"],
    riskScore: `${Math.min(result.warnings.length * 18, 99)}%`,
    logs: [
      `Run ${result.run.run_id} -> ${result.run.status}`,
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
  const { documents, sessions, processFixture, processDocument, approveSessionAndExport, saveSessionExport, revealSessionExport, editSessionField, rejectSessionRun } = useRuntimeContext();
  const document = documentId ? documents.find((item) => item.document_id === documentId) ?? null : null;
  const sessionKey = document?.document_id ?? fixture?.fixtureId ?? "";
  const session = sessionKey ? sessions[sessionKey] : undefined;
  const fallbackWorkspace = fixture ? fixture.workspace : {
    documentTitle: document?.file_name ?? "Local document",
    subtitle: document?.source_path ?? "No path",
    fields: [], riskScore: "0%", riskSummary: ["No runtime result yet"], warnings: [], logs: ["Document registered in local desktop catalog"]
  };
  const workspace = deriveWorkspace(fallbackWorkspace, session?.result);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(workspace.fields[0]?.fieldId ?? null);
  const selectedField = useMemo(() => workspace.fields.find((field) => field.fieldId === selectedFieldId) ?? workspace.fields[0] ?? null, [selectedFieldId, workspace.fields]);
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

  return (
    <WorkstationShell
      documentRail={<div className="rail-layout">
        <header className="rail-header"><strong>{fallbackWorkspace.documentTitle}</strong><span>{fallbackWorkspace.subtitle}</span><small>{documentMeta}</small><small>State: {stateLabel}</small></header>
        <div className="thumbnail-list">{[1, 2].map((page) => <button className={`page-thumbnail${page === 1 ? " page-thumbnail--active" : ""}`} key={page} aria-label={`Page ${page}`}><span className="thumbnail-paper"><span className="thumbnail-title" /><span className="thumbnail-line thumbnail-line--long" /><span className="thumbnail-line" /><span className="thumbnail-grid" /><span className="thumbnail-signatures" /></span><span className="page-number">{page}</span></button>)}</div>
        <footer className="rail-footer"><button className="rail-add">＋ <span>Add page</span></button><button className="rail-more">•••</button></footer>
      </div>}
      viewer={<div className="viewer-layout">
        <div className="viewer-toolbar"><div className="toolbar-group"><button>↖</button><button>✋</button></div><div className="toolbar-group toolbar-zoom"><button>−</button><strong>114%</strong><button>＋</button></div><div className="toolbar-spacer" /><button aria-label="Toggle panels">▣</button></div>
        <div className="canvas-stage"><article className="document-paper" aria-label="Document preview">
          <div className="invoice-kicker">HÓA ĐƠN GIÁ TRỊ GIA TĂNG</div><div className="invoice-subtitle">(BẢN CHÍNH)</div><div className="invoice-code">Mẫu số: 01GTKT0/001<br />Ký hiệu: AB/25E<br /><strong>Số: 000789</strong></div>
          <div className="invoice-block invoice-block--seller"><strong>Đơn vị bán hàng:</strong> CÔNG TY TNHH ABC<br /><strong>Mã số thuế:</strong> 0101234567<br /><strong>Địa chỉ:</strong> 123 Nguyễn Trãi, Thanh Xuân, Hà Nội<br /><strong>Điện thoại:</strong> 024 1234 5678</div>
          <div className="invoice-block invoice-block--buyer"><strong>Họ tên người mua hàng:</strong> CÔNG TY TNHH XYZ<br /><strong>Mã số thuế:</strong> 0209876543<br /><strong>Địa chỉ:</strong> 456 Lê Lợi, Hải Châu, Đà Nẵng<br /><strong>Hình thức thanh toán:</strong> Chuyển khoản</div>
          <table className="invoice-table"><thead><tr><th>STT</th><th>Tên hàng hóa, dịch vụ</th><th>ĐVT</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody><tr><td>1</td><td>Máy in Canon LBP 2900</td><td>Cái</td><td>2</td><td>2.500.000</td><td>5.000.000</td></tr><tr><td>2</td><td>Mực in Canon 303</td><td>Hộp</td><td>4</td><td>300.000</td><td>1.200.000</td></tr><tr><td>3</td><td>Giấy in A4 Double A</td><td>Ram</td><td>10</td><td>70.000</td><td>700.000</td></tr></tbody></table>
          <div className="invoice-totals">Cộng tiền hàng: <strong>6.900.000</strong><br />Tiền GTGT (10%): <strong>690.000</strong><br />Tổng cộng thanh toán: <strong>7.590.000</strong></div>
          <div className="signature-row"><div>Người mua hàng<span className="signature-stroke">Navin</span></div><div>Người bán hàng<span className="stamp">CÔNG TY<br />TNHH ABC</span></div></div>
          {workspace.fields.slice(0, 5).map((field, index) => <span key={field.fieldId} className={`evidence-box evidence-box--${index + 1}`} />)}
        </article></div>
        <div className="viewer-modes"><button className="viewer-mode viewer-mode--active">▧ Regions</button><button className="viewer-mode">◎ OCR</button><button className="viewer-mode">▦ Table</button><button className="viewer-mode">▧ Heatmap</button><span /><button className="viewer-mode">Fit⌄</button></div>
      </div>}
      inspector={<div className="inspector-layout">
        <div className="panel-tabs"><button className="panel-tab panel-tab--active">Extracted Fields</button><button className="panel-tab">Validation</button><button className="panel-tab">Risk & Anomaly</button><button className="panel-tab">Metadata</button></div>
        <div className="inspector-scroll">
          <FieldTable fields={workspace.fields} selectedFieldId={selectedFieldId} onSelectField={(fieldId) => { setSelectedFieldId(fieldId); setEditValue(workspace.fields.find((field) => field.fieldId === fieldId)?.normalizedValue ?? ""); }} />
          <div className="field-edit-panel"><div className="panel-heading">Field review</div><div className="panel-caption">Observed: {selectedField?.observedValue ?? "—"} · Normalized: {selectedField?.normalizedValue ?? "—"}</div><input className="input" value={editValue} placeholder={selectedField?.normalizedValue ?? "Select a field"} onChange={(event) => setEditValue(event.target.value)} /><div className="button-row"><button className="button button--primary" disabled={!session?.result || !selectedField || !editValue} onClick={() => { if (!selectedField || !sessionKey) return; void editSessionField(sessionKey, selectedField.fieldId, editValue, "workspace manual correction"); setEditValue(""); }}>Apply human edit</button><button className="button button--danger" disabled={!session?.result} onClick={() => sessionKey ? void rejectSessionRun(sessionKey, "Rejected from workspace review") : undefined}>Reject run</button></div></div>
          <RiskPanel riskScore={workspace.riskScore} riskSummary={workspace.riskSummary} />
        </div>
      </div>}
      workbench={<div className="workbench-layout">
        <div className="workbench-main"><div className="panel-tabs"><button className="panel-tab panel-tab--active">Agent Logs</button><button className="panel-tab">Self-Correction</button><button className="panel-tab">Errors & Warnings</button><button className="panel-tab">History</button></div><div className="log-list">{workspace.logs.map((entry, index) => <div className="log-row" key={`${entry}-${index}`}><time>{`10:21:${String(14 + index * 3).padStart(2, "0")}`}</time><span>{entry}</span></div>)}</div></div>
        <div className="issue-summary"><div className="panel-heading">{workspace.warnings.length} Issues Detected</div>{workspace.warnings.length === 0 ? <p className="empty-copy">No blocking issues.</p> : <ul>{workspace.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}</div>
        <ActionPanel processing={session?.processing ?? false} hasRun={Boolean(session?.result)} canApprove={Boolean(session?.result?.run.run_id)} canSaveExport={Boolean(session?.artifactRef)} artifactRef={session?.artifactRef} savedExportPath={session?.savedExportPath} revealedExportPath={session?.revealedExportPath} error={session?.error}
          onProcess={() => fixture ? void processFixture(fixture) : document ? void processDocument(document) : undefined}
          onApproveAndExport={() => sessionKey ? void approveSessionAndExport(sessionKey) : undefined}
          onSaveExport={() => sessionKey ? void saveSessionExport(sessionKey) : undefined}
          onRevealExport={() => sessionKey ? void revealSessionExport(sessionKey) : undefined} />
      </div>}
    />
  );
}
