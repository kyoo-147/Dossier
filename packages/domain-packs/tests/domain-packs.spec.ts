import { describe, expect, it } from "vitest";

import { domainPackManifestSchema, domainPacks } from "../src/index.js";

describe("domain packs", () => {
  it("publishes one pack per demo industry", () => {
    expect(domainPacks.map((pack) => pack.industry)).toEqual(["healthcare", "finance", "enterprise"]);
  });

  it("validates every manifest", () => {
    for (const pack of domainPacks) {
      expect(() => domainPackManifestSchema.parse(pack)).not.toThrow();
    }
  });
});
