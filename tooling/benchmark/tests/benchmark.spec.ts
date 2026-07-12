import { describe, expect, it } from "vitest";
import { mkdtempSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { renderBenchmarkReport } from "../report.js";
import { observeFixture, observeFixtureFromRuntime, runBenchmark, writeBenchmarkArtifacts } from "../run_benchmark.js";

describe("benchmark harness", () => {
  it("scores the bundled fixtures", () => {
    const report = runBenchmark();

    expect(report.observations.length).toBeGreaterThanOrEqual(3);
    expect(report.observations.every((observation) => observation.source === "runtime_artifact")).toBe(true);
    expect(report.observations.find((observation) => observation.fixtureId === "healthcare_handwriting_prescription")?.textExtractionStatus).toBe("extracted");
    expect(report.observations.every((observation) => observation.structuredParseStatus === "parsed")).toBe(true);
    expect(report.metrics.fieldLevelAccuracy).toBeGreaterThan(0);
    expect(report.metrics.fieldLevelAccuracy).toBeLessThanOrEqual(1);
    expect(report.metrics.requiredFieldCompletion).toBeGreaterThan(0);
    expect(report.metrics.evidenceCoverage).toBe(1);
    expect(report.metrics.exportSuccessRate).toBe(1);
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

  it("scores a single fixture from runtime output fields", () => {
    const observation = observeFixtureFromRuntime(
      {
        fixtureId: "runtime_observation",
        bucket: "clean",
        industry: "finance",
        mode: "generic_parse",
        fileName: "invoice.pdf",
        sourceText: "Invoice Number 000789\nTotal Amount 7590000",
        expectedFields: [{ schemaKey: "invoice.total_amount", value: "7590000", required: true }],
        expectedReview: false,
        expectedLatencyMs: 1,
        workspace: {
          documentTitle: "invoice.pdf",
          subtitle: "Invoice",
          fields: [],
          riskScore: "0%",
          riskSummary: [],
          warnings: [],
          logs: []
        }
      },
      {
        fixtureId: "runtime_observation",
        fields: [{ schema_key: "invoice.total_amount", label: "Total Amount", normalized_value: "7590000" }],
        warnings: [],
        review_tasks: []
      }
    );

    expect(observation.source).toBe("runtime_artifact");
    expect(observation.matchedFields).toBe(1);
  });

  it("uses runtime observations when the runtime probe is available", () => {
    const report = runBenchmark();

    expect(report.observations.every((observation) => observation.source === "runtime_artifact")).toBe(true);
  });

  it("renders a readable report", () => {
    const text = renderBenchmarkReport(runBenchmark());

    expect(text).toContain("Field-level accuracy");
    expect(text).toContain("Straight-through processing rate");
    expect(text).toContain("Evidence coverage");
    expect(text).toContain("Export success rate");
  });

  it("writes release evidence artifacts for benchmark runs", () => {
    const report = runBenchmark();
    const outDir = mkdtempSync(join(tmpdir(), "dossier-benchmark-"));
    const paths = writeBenchmarkArtifacts(report, outDir);

    expect(existsSync(paths.jsonPath)).toBe(true);
    expect(existsSync(paths.markdownPath)).toBe(true);
    expect(readFileSync(paths.markdownPath, "utf-8")).toContain("Dossier benchmark");
    expect(JSON.parse(readFileSync(paths.jsonPath, "utf-8"))).toMatchObject({
      metrics: expect.any(Object),
      observations: expect.any(Array)
    });
  });
});
