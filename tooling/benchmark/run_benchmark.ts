import { sampleFixtures, type SampleFixture } from "@dossier/sample-data";

export interface BenchmarkObservation {
  fixtureId: string;
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

export function observeFixture(fixture: SampleFixture): BenchmarkObservation {
  const actualFields = observedFieldMap(fixture);
  const totalFields = fixture.expectedFields.length;
  const requiredFields = fixture.expectedFields.filter((field) => field.required).length;
  const matchedFields = fixture.expectedFields.filter((field) => {
    const actualValue = actualFields.get(schemaKeyToLabel(field.schemaKey));
    return actualValue === normalizeValue(field.value);
  }).length;
  const missingRequiredFields = fixture.expectedFields.filter((field) => {
    if (!field.required) {
      return false;
    }
    const actualValue = actualFields.get(schemaKeyToLabel(field.schemaKey));
    return actualValue !== normalizeValue(field.value);
  }).length;
  const reviewTriggered =
    fixture.workspace.warnings.length > 0 ||
    fixture.workspace.fields.some((field) => field.status === "warning");

  return {
    fixtureId: fixture.fixtureId,
    matchedFields,
    totalFields,
    requiredFields,
    missingRequiredFields,
    reviewTriggered,
    latencyMs: fixture.expectedLatencyMs
  };
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
  const observations = fixtures.map(observeFixture);
  return {
    observations,
    metrics: scoreBenchmark(observations)
  };
}

if (process.argv[1]?.endsWith("run_benchmark.js")) {
  const report = runBenchmark();
  console.log(JSON.stringify(report, null, 2));
}
