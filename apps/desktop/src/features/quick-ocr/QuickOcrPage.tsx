import { FixtureSummaryCard } from "../workspace/FixtureSummaryCard.js";
import { quickOcrFixtures } from "../workspace/workspaceFixtures.js";

export function QuickOcrPage() {
  return (
    <div style={{ padding: 20, display: "grid", gap: 16 }}>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>Quick OCR</div>
        <div style={{ color: "#6b7280", marginTop: 6 }}>
          Fast single-document flow for documents that do not need the full agentic pipeline.
        </div>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {quickOcrFixtures.map((fixture) => (
          <FixtureSummaryCard key={fixture.fixtureId} fixture={fixture} />
        ))}
      </div>
    </div>
  );
}
