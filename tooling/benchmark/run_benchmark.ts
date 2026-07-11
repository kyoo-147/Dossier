import { sampleFixtures, type SampleFixture } from "@dossier/sample-data";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

export interface BenchmarkObservation {
  fixtureId: string;
  source: "runtime_artifact" | "workspace_fixture";
  matchedFields: number;
  totalFields: number;
  requiredFields: number;
  missingRequiredFields: number;
  reviewTriggered: boolean;
  latencyMs: number;
}

export interface BenchmarkMetrics {
  fieldLevelAccuracy: number;
  requiredFieldCompletion: number;
  reviewRate: number;
  straightThroughProcessingRate: number;
  averageLatencyMs: number;
}

export interface BenchmarkReport {
  observations: BenchmarkObservation[];
  metrics: BenchmarkMetrics;
}

function normalizeLabel(label: string): string {
  return label
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_\-.]+/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function schemaKeyToLabel(schemaKey: string): string {
  return normalizeLabel(schemaKey);
}

function schemaKeySuffixToLabel(schemaKey: string): string {
  return normalizeLabel(schemaKey.split(".").at(-1) ?? schemaKey);
}

function normalizeValue(value: string): string {
  const trimmed = value.trim().toLowerCase();
  const digits = trimmed.replace(/\D/g, "");

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split("-");
    return `${year}${month}${day}`;
  }

  const slashDate = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashDate) {
    return `${slashDate[3]}${slashDate[2]}${slashDate[1]}`;
  }

  if (digits.length > 0 && digits.length !== trimmed.length) {
    return digits;
  }

  return trimmed.replace(/[^a-z0-9]+/g, "");
}

function observedFieldMap(fixture: SampleFixture): Map<string, string> {
  return new Map(
    fixture.workspace.fields.map((field) => [normalizeLabel(field.label), normalizeValue(field.value)])
  );
}

interface RuntimeProbeResult {
  fixtureId: string;
  fields: Array<{
    schema_key?: string;
    label: string;
    normalized_value?: string;
    observed_value?: string;
    status?: string;
  }>;
  warnings: unknown[];
  review_tasks: unknown[];
}

function runtimeFieldMap(result: RuntimeProbeResult): Map<string, string> {
  const fields = new Map<string, string>();
  for (const field of result.fields) {
    const value = normalizeValue(String(field.normalized_value ?? field.observed_value ?? ""));
    fields.set(normalizeLabel(field.label), value);
    if (field.schema_key) {
      fields.set(schemaKeyToLabel(field.schema_key), value);
      fields.set(schemaKeySuffixToLabel(field.schema_key), value);
    }
  }
  return fields;
}

function scoreFixture(
  fixture: SampleFixture,
  actualFields: Map<string, string>,
  reviewTriggered: boolean,
  latencyMs: number,
  source: BenchmarkObservation["source"]
): BenchmarkObservation {
  const totalFields = fixture.expectedFields.length;
  const requiredFields = fixture.expectedFields.filter((field) => field.required).length;
  const actualValueFor = (schemaKey: string) =>
    actualFields.get(schemaKeyToLabel(schemaKey)) ?? actualFields.get(schemaKeySuffixToLabel(schemaKey));
  const matchedFields = fixture.expectedFields.filter((field) => {
    const actualValue = actualValueFor(field.schemaKey);
    return actualValue === normalizeValue(field.value);
  }).length;
  const missingRequiredFields = fixture.expectedFields.filter((field) => {
    if (!field.required) {
      return false;
    }
    const actualValue = actualValueFor(field.schemaKey);
    return actualValue !== normalizeValue(field.value);
  }).length;

  return {
    fixtureId: fixture.fixtureId,
    source,
    matchedFields,
    totalFields,
    requiredFields,
    missingRequiredFields,
    reviewTriggered,
    latencyMs
  };
}

export function observeFixture(fixture: SampleFixture): BenchmarkObservation {
  const reviewTriggered =
    fixture.workspace.warnings.length > 0 ||
    fixture.workspace.fields.some((field) => field.status === "warning");
  return scoreFixture(
    fixture,
    observedFieldMap(fixture),
    reviewTriggered,
    fixture.expectedLatencyMs,
    "workspace_fixture"
  );
}

function runRuntimeProbe(fixtures: SampleFixture[]): RuntimeProbeResult[] | null {
  const probePath = resolve(process.cwd(), "runtime_probe.py");
  if (!existsSync(probePath)) {
    return null;
  }

  const startedAt = performance.now();
  const result = spawnSync("python", [probePath], {
    input: JSON.stringify(fixtures),
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024
  });

  if (result.status !== 0) {
    return null;
  }

  const parsed = JSON.parse(result.stdout) as RuntimeProbeResult[];
  const elapsedMs = Math.max(1, Math.round(performance.now() - startedAt));
  return parsed.map((item) => ({ ...item, elapsedMs })) as Array<RuntimeProbeResult & { elapsedMs: number }>;
}

export function observeFixtureFromRuntime(
  fixture: SampleFixture,
  result: RuntimeProbeResult & { elapsedMs?: number }
): BenchmarkObservation {
  return scoreFixture(
    fixture,
    runtimeFieldMap(result),
    result.warnings.length > 0 || result.review_tasks.length > 0,
    result.elapsedMs ?? fixture.expectedLatencyMs,
    "runtime_artifact"
  );
}

export function scoreBenchmark(observations: BenchmarkObservation[]): BenchmarkMetrics {
  const totalFields = observations.reduce((sum, item) => sum + item.totalFields, 0);
  const matchedFields = observations.reduce((sum, item) => sum + item.matchedFields, 0);
  const totalRequiredFields = observations.reduce((sum, item) => sum + item.requiredFields, 0);
  const missingRequiredFields = observations.reduce((sum, item) => sum + item.missingRequiredFields, 0);
  const reviewCount = observations.filter((item) => item.reviewTriggered).length;
  const stpCount = observations.length - reviewCount;
  const totalLatencyMs = observations.reduce((sum, item) => sum + item.latencyMs, 0);

  return {
    fieldLevelAccuracy: totalFields === 0 ? 0 : matchedFields / totalFields,
    requiredFieldCompletion: totalRequiredFields === 0 ? 0 : (totalRequiredFields - missingRequiredFields) / totalRequiredFields,
    reviewRate: observations.length === 0 ? 0 : reviewCount / observations.length,
    straightThroughProcessingRate: observations.length === 0 ? 0 : stpCount / observations.length,
    averageLatencyMs: observations.length === 0 ? 0 : totalLatencyMs / observations.length
  };
}

export function runBenchmark(fixtures: SampleFixture[] = sampleFixtures): BenchmarkReport {
  const runtimeResults = runRuntimeProbe(fixtures);
  const observations = runtimeResults
    ? fixtures.map((fixture) => {
        const runtimeResult = runtimeResults.find((item) => item.fixtureId === fixture.fixtureId);
        return runtimeResult ? observeFixtureFromRuntime(fixture, runtimeResult) : observeFixture(fixture);
      })
    : fixtures.map(observeFixture);
  return {
    observations,
    metrics: scoreBenchmark(observations)
  };
}

if (process.argv[1]?.endsWith("run_benchmark.js")) {
  const report = runBenchmark();
  console.log(JSON.stringify(report, null, 2));
}
