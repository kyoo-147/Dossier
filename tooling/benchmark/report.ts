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
        `- ${item.fixtureId}: ${item.matchedFields}/${item.totalFields} fields matched, source=${item.source}, extraction=${item.textExtractionStatus ?? "n/a"}, artifact=${item.artifactSha256 ?? "n/a"}, events=${item.eventCount ?? 0}, exported=${item.exported ?? false}, export=${item.exportArtifactRef ?? "n/a"}, review=${item.reviewTriggered}, latency=${item.latencyMs} ms`
    )
  ].join("\n");
}
