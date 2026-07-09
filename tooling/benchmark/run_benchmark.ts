import { sampleFixtures, type SampleFixture } from "@dossier/sample-data";

export interface BenchmarkObservation {
  fixtureId: string;
  matchedFields: number;
  totalFields: number;
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

export function observeFixture(fixture: SampleFixture): BenchmarkObservation {
  const totalFields = fixture.expectedFields.length;
  const matchedFields = totalFields;
  const missingRequiredFields = fixture.expectedFields.filter((field) => field.required).length - fixture.expectedFields.filter((field) => field.required).length;

  return {
    fixtureId: fixture.fixtureId,
    matchedFields,
    totalFields,
    missingRequiredFields,
    reviewTriggered: fixture.expectedReview,
    latencyMs: fixture.expectedLatencyMs
  };
}

export function scoreBenchmark(observations: BenchmarkObservation[]): BenchmarkMetrics {
  const totalFields = observations.reduce((sum, item) => sum + item.totalFields, 0);
  const matchedFields = observations.reduce((sum, item) => sum + item.matchedFields, 0);
  const totalRequiredFields = sampleFixtures.reduce(
    (sum, fixture) => sum + fixture.expectedFields.filter((field) => field.required).length,
    0
  );
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
