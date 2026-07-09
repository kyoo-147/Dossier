import { FixtureSummaryCard } from "../workspace/FixtureSummaryCard.js";
import { demoFixtures } from "../workspace/workspaceFixtures.js";

export function InboxPage() {
  return (
    <div style={{ padding: 20, display: "grid", gap: 16 }}>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>Pilot demo inbox</div>
        <div style={{ color: "#6b7280", marginTop: 6 }}>
          Golden and risk fixtures for healthcare, finance, and enterprise demo paths.
        </div>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {demoFixtures.map((fixture) => (
          <FixtureSummaryCard key={fixture.fixtureId} fixture={fixture} />
        ))}
      </div>
    </div>
  );
}
