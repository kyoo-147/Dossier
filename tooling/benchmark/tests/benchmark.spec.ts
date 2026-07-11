import { describe, expect, it } from "vitest";

import { renderBenchmarkReport } from "../report.js";
import { observeFixture, runBenchmark } from "../run_benchmark.js";

describe("benchmark harness", () => {
  it("scores the bundled fixtures", () => {
    const report = runBenchmark();

    expect(report.observations.length).toBeGreaterThanOrEqual(3);
    expect(report.metrics.fieldLevelAccuracy).toBeGreaterThan(0);
    expect(report.metrics.fieldLevelAccuracy).toBeLessThan(1);
    expect(report.metrics.requiredFieldCompletion).toBeGreaterThan(0);
  });

  it("does not award matches when observed fields are absent", () => {
    const report = runBenchmark([
      {
        fixtureId: "empty_observation",
        bucket: "clean",
        industry: "finance",
        mode: "generic_parse",
        fileName: "empty.pdf",
        expectedFields: [{ schemaKey: "invoice.number", value: "000789", required: true }],
        expectedReview: false,
        expectedLatencyMs: 1,
        workspace: {
          documentTitle: "empty.pdf",
          subtitle: "Empty",
          fields: [],
          riskScore: "0%",
          riskSummary: [],
          warnings: [],
          logs: []
        }
      }
    ]);

    expect(report.metrics.fieldLevelAccuracy).toBe(0);
    expect(report.metrics.requiredFieldCompletion).toBe(0);
  });

  it("scores a single fixture from observed workspace fields", () => {
    const observation = observeFixture({
      fixtureId: "single_observation",
      bucket: "clean",
      industry: "finance",
      mode: "generic_parse",
      fileName: "invoice.pdf",
      expectedFields: [{ schemaKey: "invoice.total_amount", value: "7590000", required: true }],
      expectedReview: false,
      expectedLatencyMs: 1,
      workspace: {
        documentTitle: "invoice.pdf",
        subtitle: "Invoice",
        fields: [{ label: "Total Amount", value: "7.590.000", status: "approved" }],
        riskScore: "0%",
        riskSummary: [],
        warnings: [],
        logs: []
      }
    });

    expect(observation.matchedFields).toBe(1);
  });

  it("renders a readable report", () => {
    const text = renderBenchmarkReport(runBenchmark());

    expect(text).toContain("Field-level accuracy");
    expect(text).toContain("Straight-through processing rate");
  });
});
