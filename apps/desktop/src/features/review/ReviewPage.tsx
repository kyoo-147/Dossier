import { ReviewInspector } from "./ReviewInspector.js";
import { useSearchParams } from "react-router-dom";
import { FixtureSummaryCard } from "../workspace/FixtureSummaryCard.js";
import { resolveWorkspaceFixture, reviewFixtures } from "../workspace/workspaceFixtures.js";

export function ReviewPage() {
  const [searchParams] = useSearchParams();
  const fixture = resolveWorkspaceFixture(searchParams.get("fixture"));

  return (
    <div style={{ padding: 20, display: "grid", gap: 16, gridTemplateColumns: "360px 1fr" }}>
      <section style={{ display: "grid", gap: 12, alignContent: "start" }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Review queue</div>
        {reviewFixtures.map((item) => (
          <FixtureSummaryCard key={item.fixtureId} fixture={item} />
        ))}
      </section>
      <section style={{ display: "grid", gap: 16, alignContent: "start" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Approval actions</div>
          <div style={{ color: "#6b7280", marginTop: 6 }}>{fixture.fileName}</div>
        </div>
        <ReviewInspector warnings={fixture.workspace.warnings} />
      </section>
    </div>
  );
}
