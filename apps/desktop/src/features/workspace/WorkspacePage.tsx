import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useRuntimeContext } from "../../app/platform/runtimeContext.js";
import { ActionPanel } from "./ActionPanel.js";
import { FieldTable, type WorkspaceFieldRow } from "./FieldTable.js";
import { RiskPanel } from "./RiskPanel.js";
import { resolveWorkspaceFixture } from "./workspaceFixtures.js";

function deriveWorkspace(
  fallback: ReturnType<typeof resolveWorkspaceFixture>["workspace"],
  result: {
    fields: Array<{
      field_id: string;
      label: string;
      observed_value?: string;
      normalized_value: string;
      human_approved_value?: string | null;
      status?: string;
    }>;
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
          status:
            field.status === "warning"
              ? "warning"
              : field.status === "needs_review"
                ? "needs_review"
                : "approved"
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
  const { documents, sessions, processFixture, processDocument, approveSessionAndExport, saveSessionExport, editSessionField, rejectSessionRun } =
    useRuntimeContext();
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
    const nextSelectedField = workspace.fields.find((field) => field.fieldId === selectedFieldId);
    if (nextSelectedField) {
      return;
    }
    const fallbackField = workspace.fields[0] ?? null;
    setSelectedFieldId(fallbackField?.fieldId ?? null);
    setEditValue(fallbackField?.normalizedValue ?? "");
  }, [selectedFieldId, workspace.fields]);

  const stateLabel = session?.processing
    ? "processing"
    : session?.error
      ? "failed"
      : session?.artifactRef
        ? "export_ready"
        : session?.result?.run.status ?? "empty";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr 360px",
        gridTemplateRows: "1fr 220px",
        minHeight: "calc(100vh - 56px)"
      }}
    >
      <section style={{ borderRight: "1px solid #e5e7eb", padding: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>{fallbackWorkspace.documentTitle}</div>
        <div style={{ color: "#6b7280", marginBottom: 8 }}>{fallbackWorkspace.subtitle}</div>
        <div style={{ color: "#44403c", fontSize: 13, marginBottom: 8 }}>
          {fixture
            ? `${fixture.industry} · ${fixture.mode} · ${fixture.bucket}`
            : `${document?.mode_hint ?? "generic_parse"} · ${document?.source_type ?? "document"} · local`}
        </div>
        <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 16 }}>State: {stateLabel}</div>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ border: "1px solid #cbd5e1", padding: 12, height: 240 }}>Page 1 thumbnail</div>
          <div style={{ border: "1px solid #e5e7eb", padding: 12, height: 240 }}>Page 2 thumbnail</div>
        </div>
      </section>
      <section style={{ borderRight: "1px solid #e5e7eb", padding: 16, display: "grid", gap: 16 }}>
        <div style={{ border: "1px solid #d1d5db", background: "#fff", minHeight: 260 }}>
          <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>Document canvas</div>
          <div style={{ padding: 12, color: "#6b7280", fontSize: 13 }}>
            Selected field: {selectedField?.label ?? "None"} · Selection sync is currently field-driven.
          </div>
        </div>

        <div style={{ border: "1px solid #d1d5db", background: "#fff", padding: 12, display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 600 }}>Field review</div>
          <div style={{ color: "#6b7280", fontSize: 13 }}>
            Observed: {selectedField?.observedValue ?? "—"} · Normalized: {selectedField?.normalizedValue ?? "—"}
          </div>
          <input
            value={editValue}
            placeholder={selectedField?.normalizedValue ?? "Select a field"}
            onChange={(event) => setEditValue(event.target.value)}
            style={{ padding: "10px 12px", border: "1px solid #d1d5db", background: "#fff" }}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <button
              disabled={!session?.result || !selectedField || !editValue}
              onClick={() => {
                if (!selectedField || !sessionKey) return;
                void editSessionField(sessionKey, selectedField.fieldId, editValue, "workspace manual correction");
                setEditValue("");
              }}
              style={{ padding: "10px 12px", border: "1px solid #2563eb", background: "#2563eb", color: "#fff" }}
            >
              Apply human edit
            </button>
            <button
              disabled={!session?.result}
              onClick={() => {
                if (!sessionKey) return;
                void rejectSessionRun(sessionKey, "Rejected from workspace review");
              }}
              style={{ padding: "10px 12px", border: "1px solid #d1d5db", background: "#fff" }}
            >
              Reject run
            </button>
          </div>
        </div>
      </section>
      <section style={{ padding: 16, display: "grid", gap: 16 }}>
        <FieldTable
          fields={workspace.fields}
          selectedFieldId={selectedFieldId}
          onSelectField={(fieldId) => {
            setSelectedFieldId(fieldId);
            const nextField = workspace.fields.find((field) => field.fieldId === fieldId);
            setEditValue(nextField?.normalizedValue ?? "");
          }}
        />
        <RiskPanel riskScore={workspace.riskScore} riskSummary={workspace.riskSummary} />
        <ActionPanel
          processing={session?.processing ?? false}
          hasRun={Boolean(session?.result)}
          canApprove={Boolean(session?.result?.run.run_id)}
          canSaveExport={Boolean(session?.artifactRef)}
          artifactRef={session?.artifactRef}
          savedExportPath={session?.savedExportPath}
          error={session?.error}
          onProcess={() => {
            if (fixture) {
              void processFixture(fixture);
            } else if (document) {
              void processDocument(document);
            }
          }}
          onApproveAndExport={() => {
            if (!sessionKey) return;
            void approveSessionAndExport(sessionKey);
          }}
          onSaveExport={() => {
            if (!sessionKey) return;
            void saveSessionExport(sessionKey);
          }}
        />
      </section>
      <section
        style={{
          gridColumn: "1 / 4",
          borderTop: "1px solid #e5e7eb",
          background: "#fafaf9",
          padding: 16
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Agent logs / self-correction / history</div>
        <div style={{ display: "grid", gap: 8 }}>
          {workspace.logs.map((entry) => (
            <div key={entry}>{entry}</div>
          ))}
        </div>
      </section>
    </div>
  );
}
