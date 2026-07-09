import { useSearchParams } from "react-router-dom";
import { useRuntimeContext } from "../../app/platform/runtimeContext.js";
import { ActionPanel } from "./ActionPanel.js";
import { FieldTable } from "./FieldTable.js";
import { RiskPanel } from "./RiskPanel.js";
import { resolveWorkspaceFixture } from "./workspaceFixtures.js";

function deriveWorkspace(
  fallback: ReturnType<typeof resolveWorkspaceFixture>["workspace"],
  result: {
    fields: Array<{ label: string; normalized_value: string; status?: string }>;
    warnings: Array<{ code: string; message: string }>;
    review_tasks: Array<{ review_task_id: string; status: string }>;
    repair?: { attempts: Array<{ strategy: string; result: string }> };
    run: { run_id: string; status: string };
  } | undefined
) {
  if (!result) {
    return fallback;
  }

  return {
    ...fallback,
    fields: result.fields.map((field) => ({
      label: field.label,
      value: field.normalized_value,
      status: (field.status === "warning" ? "warning" : "approved") as "approved" | "warning"
    })),
    warnings: result.warnings.map((warning) => warning.message),
    riskSummary:
      result.warnings.length > 0
        ? result.warnings.map((warning) => `${warning.code}: ${warning.message}`)
        : ["No validation warnings after current run"],
    riskScore: `${Math.min(result.warnings.length * 18, 99)}%`,
    logs: [
      `Run ${result.run.run_id} -> ${result.run.status}`,
      ...result.review_tasks.map((task) => `Review task ${task.review_task_id} -> ${task.status}`),
      ...(result.repair?.attempts.map((attempt) => `Repair ${attempt.strategy} -> ${attempt.result}`) ?? [])
    ]
  };
}

export function WorkspacePage() {
  const [searchParams] = useSearchParams();
  const fixture = resolveWorkspaceFixture(searchParams.get("fixture"));
  const { sessions, processFixture, approveAndExport } = useRuntimeContext();
  const session = sessions[fixture.fixtureId];
  const workspace = deriveWorkspace(fixture.workspace, session?.result);

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
        <div style={{ fontWeight: 600, marginBottom: 12 }}>{workspace.documentTitle}</div>
        <div style={{ color: "#6b7280", marginBottom: 8 }}>{workspace.subtitle}</div>
        <div style={{ color: "#44403c", fontSize: 13, marginBottom: 16 }}>
          {fixture.industry} · {fixture.mode} · {fixture.bucket}
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ border: "1px solid #cbd5e1", padding: 12, height: 240 }}>Page 1 thumbnail</div>
          <div style={{ border: "1px solid #e5e7eb", padding: 12, height: 240 }}>Page 2 thumbnail</div>
        </div>
      </section>
      <section style={{ borderRight: "1px solid #e5e7eb", padding: 16 }}>
        <div style={{ border: "1px solid #d1d5db", background: "#fff", height: "100%" }}>
          <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>Document canvas</div>
        </div>
      </section>
      <section style={{ padding: 16, display: "grid", gap: 16 }}>
        <FieldTable fields={workspace.fields} />
        <RiskPanel riskScore={workspace.riskScore} riskSummary={workspace.riskSummary} />
        <ActionPanel
          processing={session?.processing ?? false}
          hasRun={Boolean(session?.result)}
          canApprove={Boolean(session?.result?.run.run_id)}
          artifactRef={session?.artifactRef}
          error={session?.error}
          onProcess={() => void processFixture(fixture)}
          onApproveAndExport={() => void approveAndExport(fixture)}
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
