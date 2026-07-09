import { describe, expect, it } from "vitest";

import { renderBenchmarkReport } from "../report.js";
import { runBenchmark } from "../run_benchmark.js";

describe("benchmark harness", () => {
  it("scores the bundled fixtures", () => {
    const report = runBenchmark();

    expect(report.observations.length).toBeGreaterThanOrEqual(3);
    expect(report.metrics.fieldLevelAccuracy).toBe(1);
    expect(report.metrics.requiredFieldCompletion).toBe(1);
  });

  it("renders a readable report", () => {
    const text = renderBenchmarkReport(runBenchmark());

    expect(text).toContain("Field-level accuracy");
    expect(text).toContain("Straight-through processing rate");
  });
});
