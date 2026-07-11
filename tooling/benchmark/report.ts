import type { BenchmarkReport } from "./run_benchmark.js";

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function renderBenchmarkReport(report: BenchmarkReport): string {
  return [
    "# Dossier benchmark",
    "",
    `- Field-level accuracy: ${pct(report.metrics.fieldLevelAccuracy)}`,
    `- Required-field completion: ${pct(report.metrics.requiredFieldCompletion)}`,
    `- Review rate: ${pct(report.metrics.reviewRate)}`,
    `- Straight-through processing rate: ${pct(report.metrics.straightThroughProcessingRate)}`,
    `- Average latency: ${report.metrics.averageLatencyMs.toFixed(0)} ms`,
    "",
    "## Fixtures",
    ...report.observations.map(
      (item) =>
        `- ${item.fixtureId}: ${item.matchedFields}/${item.totalFields} fields matched, source=${item.source}, review=${item.reviewTriggered}, latency=${item.latencyMs} ms`
    )
  ].join("\n");
}
