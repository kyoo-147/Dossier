import { sampleFixtureById, sampleFixtures, type SampleFixture } from "@dossier/sample-data";

export const defaultWorkspaceFixtureId = "finance_clean_invoice";

export function resolveWorkspaceFixture(fixtureId: string | null | undefined): SampleFixture {
  if (!fixtureId) {
    return sampleFixtureById[defaultWorkspaceFixtureId] ?? sampleFixtures[0]!;
  }

  return sampleFixtureById[fixtureId] ?? sampleFixtureById[defaultWorkspaceFixtureId] ?? sampleFixtures[0]!;
}

export const reviewFixtures = sampleFixtures.filter((fixture) => fixture.expectedReview);
export const quickOcrFixtures = sampleFixtures.filter((fixture) => fixture.mode === "quick_ocr");
export const demoFixtures = sampleFixtures.filter((fixture) => fixture.bucket === "golden" || fixture.bucket === "risk");
