import { ActionPanel } from "./ActionPanel.js";
import { FieldTable } from "./FieldTable.js";
import { RiskPanel } from "./RiskPanel.js";
import { useSearchParams } from "react-router-dom";
import { resolveWorkspaceFixture } from "./workspaceFixtures.js";

export function WorkspacePage() {
  const [searchParams] = useSearchParams();
  const fixture = resolveWorkspaceFixture(searchParams.get("fixture"));
  const workspace = fixture.workspace;

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
        <ActionPanel />
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
