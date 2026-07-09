import { describe, expect, it } from "vitest";

import { sampleFixtureById, sampleFixtures } from "../src/index.js";

describe("sample data", () => {
  it("covers all demo industries", () => {
    expect(new Set(sampleFixtures.map((fixture) => fixture.industry))).toEqual(
      new Set(["healthcare", "finance", "enterprise"])
    );
  });

  it("indexes the primary finance workspace fixture", () => {
    expect(sampleFixtureById.finance_clean_invoice.workspace.documentTitle).toBe("DOC-2026-0001.pdf");
  });
});
