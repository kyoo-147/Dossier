import { Link } from "react-router-dom";
import type { SampleFixture } from "@dossier/sample-data";

interface FixtureSummaryCardProps {
  fixture: SampleFixture;
}

export function FixtureSummaryCard({ fixture }: FixtureSummaryCardProps) {
  return (
    <article
      style={{
        border: "1px solid #d6d3d1",
        background: "#fcfcfb",
        padding: 16,
        display: "grid",
        gap: 10
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 600 }}>{fixture.fileName}</div>
          <div style={{ color: "#6b7280", fontSize: 13 }}>
            {fixture.industry} · {fixture.mode} · {fixture.bucket}
          </div>
        </div>
        <div style={{ color: fixture.expectedReview ? "#b45309" : "#166534", fontSize: 13 }}>
          {fixture.expectedReview ? "Review" : "STP candidate"}
        </div>
      </div>
      <div style={{ color: "#44403c", fontSize: 14 }}>
        Expected fields: {fixture.expectedFields.length} · Latency target: {fixture.expectedLatencyMs} ms
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Link
          to={`/workspace?fixture=${fixture.fixtureId}`}
          style={{ color: "#111827", textDecoration: "none", borderBottom: "1px solid #111827" }}
        >
          Open workspace
        </Link>
        {fixture.expectedReview ? (
          <Link
            to={`/review?fixture=${fixture.fixtureId}`}
            style={{ color: "#111827", textDecoration: "none", borderBottom: "1px solid #111827" }}
          >
            Open review
          </Link>
        ) : null}
      </div>
    </article>
  );
}
