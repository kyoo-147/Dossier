import { describe, expect, it } from "vitest";
import { canStraightThroughProcess, createRunPlan, shouldCreateReviewTask } from "../src/index.js";

describe("review gates", () => {
  it("blocks STP when critical validation fails", () => {
    expect(
      canStraightThroughProcess({
        hasCriticalValidationError: true,
        hasHighSeverityRiskBlock: false,
        requiredFieldsMeetThreshold: true,
        workflowAllowsAutoProgress: true
      })
    ).toBe(false);
  });

  it("creates review tasks when an approval gate exists", () => {
    expect(
      shouldCreateReviewTask({
        hasCriticalLowConfidenceField: false,
        hasCriticalValidationFailure: false,
        hasHighSeverityRiskSignal: false,
        schemaRequiresApproval: true,
        exportActionHasConsequences: false
      })
    ).toBe(true);
  });

  it("creates a schema workflow plan with validation step", () => {
    const plan = createRunPlan("schema_workflow");

    expect(plan.pipelineId).toBe("schema_workflow");
    expect(plan.steps.at(-1)?.step_id).toBe("validation");
  });
});
