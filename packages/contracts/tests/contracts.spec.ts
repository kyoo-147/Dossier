import { describe, expect, it } from "vitest";
import {
  DocumentStatusSchema,
  EvidenceSchema,
  PipelineStepSchema,
  ReviewTaskSchema,
  RunStatusSchema
} from "../src/index.js";

describe("contracts", () => {
  it("includes the corrected run states", () => {
    expect(RunStatusSchema.options).toEqual([
      "created",
      "queued",
      "running",
      "needs_review",
      "approved",
      "completed",
      "rejected",
      "failed",
      "canceled"
    ]);
  });

  it("includes the canonical document states", () => {
    expect(DocumentStatusSchema.options).toEqual([
      "created",
      "processing",
      "review",
      "approved",
      "exported",
      "failed"
    ]);
  });

  it("requires evidence audit fields for policy and prompt version", () => {
    const parsed = EvidenceSchema.safeParse({
      evidence_id: "ev_1",
      run_id: "run_1",
      page_id: "page_1",
      region_id: "reg_1",
      bbox: { x: 0, y: 0, w: 10, h: 10 },
      kind: "ocr",
      provider: "paddleocr",
      provider_version: "1.0.0",
      policy_version: null,
      prompt_version: null,
      payload_ref: "artifact://payload",
      summary: "ok"
    });

    expect(parsed.success).toBe(true);
  });

  it("supports review task approval lifecycle states", () => {
    const parsed = ReviewTaskSchema.safeParse({
      review_task_id: "review_1",
      run_id: "run_1",
      reason_codes: ["LOW_CONFIDENCE"],
      priority: "medium",
      status: "resolved",
      assigned_to: null,
      required_action: "field_review"
    });

    expect(parsed.success).toBe(true);
  });

  it("validates pipeline step shape", () => {
    const parsed = PipelineStepSchema.safeParse({
      step_id: "ocr_executor",
      type: "provider",
      inputs: ["layout.regions"],
      outputs: ["ocr.blocks"],
      retry_policy: {
        max_attempts: 2,
        strategies: ["retry_same", "retry_alt_provider"]
      },
      on_failure: "needs_review",
      human_gate: false
    });

    expect(parsed.success).toBe(true);
  });
});
