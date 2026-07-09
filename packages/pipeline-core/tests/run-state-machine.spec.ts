import { describe, expect, it } from "vitest";
import { advanceRunState, canTransitionRunStatus } from "../src/index.js";

describe("run state machine", () => {
  it("allows the canonical happy path", () => {
    expect(canTransitionRunStatus("created", "queued")).toBe(true);
    expect(canTransitionRunStatus("queued", "running")).toBe(true);
    expect(canTransitionRunStatus("running", "needs_review")).toBe(true);
    expect(canTransitionRunStatus("needs_review", "approved")).toBe(true);
    expect(canTransitionRunStatus("approved", "completed")).toBe(true);
  });

  it("throws on invalid transitions", () => {
    expect(() => advanceRunState("created", "running")).toThrow(
      "Invalid run transition: created -> running"
    );
  });
});
