import { Link } from "react-router-dom";
import type { SampleFixture } from "@dossier/sample-data";

export function FixtureSummaryCard({ fixture }: { fixture: SampleFixture }) {
  return (
    <article className="fixture-row">
      <span className="fixture-file-icon">{fixture.fileName.toLowerCase().endsWith(".pdf") ? "PDF" : "IMG"}</span>
      <div className="fixture-copy">
        <strong>{fixture.fileName}</strong>
        <span>{fixture.industry} · {fixture.mode} · {fixture.bucket}</span>
        <small>{fixture.expectedFields.length} expected fields · {fixture.expectedLatencyMs} ms target</small>
      </div>
      <span className={`fixture-status${fixture.expectedReview ? " fixture-status--review" : ""}`}>{fixture.expectedReview ? "Review" : "STP candidate"}</span>
      <div className="fixture-actions">
        <Link to={`/workspace?fixture=${fixture.fixtureId}`}>Open workspace</Link>
        {fixture.expectedReview ? <Link to={`/review?fixture=${fixture.fixtureId}`}>Open review</Link> : null}
      </div>
    </article>
  );
}
