import { describe, expect, it } from "vitest";

import { sampleFixtureById, sampleFixtures } from "../src/index.js";

describe("sample data", () => {
  it("covers all demo industries", () => {
    expect(new Set(sampleFixtures.map((fixture) => fixture.industry))).toEqual(
      new Set(["healthcare", "finance", "enterprise"])
    );
  });

  it("keeps a balanced cross-industry pilot benchmark set", () => {
    const byIndustry = sampleFixtures.reduce<Record<string, number>>((counts, fixture) => {
      counts[fixture.industry] = (counts[fixture.industry] ?? 0) + 1;
      return counts;
    }, {});

    expect(sampleFixtures.length).toBeGreaterThanOrEqual(30);
    expect(byIndustry.finance).toBeGreaterThanOrEqual(10);
    expect(byIndustry.healthcare).toBeGreaterThanOrEqual(10);
    expect(byIndustry.enterprise).toBeGreaterThanOrEqual(10);
  });

  it("indexes the primary finance workspace fixture", () => {
    expect(sampleFixtureById.finance_clean_invoice.workspace.documentTitle).toBe("DOC-2026-0001.pdf");
  });
});
