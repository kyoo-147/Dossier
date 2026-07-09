import type { PipelineStep, RetryPolicy, RunMode } from "@dossier/contracts";
import { createPipelinePlan, type PipelinePlan } from "./pipeline-step.js";

export function createRunPlan(mode: RunMode): PipelinePlan {
  const commonRetry: RetryPolicy = {
    max_attempts: 2,
    strategies: ["retry_same", "retry_alt_provider"]
  };

  const plans: Record<RunMode, PipelineStep[]> = {
    quick_ocr: [
      {
        step_id: "probe",
        type: "provider",
        inputs: ["document.input"],
        outputs: ["document.probe"],
        retry_policy: commonRetry,
        on_failure: "fail_run",
        human_gate: false
      },
      {
        step_id: "ocr_executor",
        type: "provider",
        inputs: ["document.page"],
        outputs: ["ocr.blocks"],
        retry_policy: commonRetry,
        on_failure: "needs_review",
        human_gate: false
      }
    ],
    generic_parse: [
      {
        step_id: "probe",
        type: "provider",
        inputs: ["document.input"],
        outputs: ["document.probe"],
        retry_policy: commonRetry,
        on_failure: "fail_run",
        human_gate: false
      },
      {
        step_id: "layout",
        type: "provider",
        inputs: ["document.page"],
        outputs: ["layout.regions"],
        retry_policy: commonRetry,
        on_failure: "needs_review",
        human_gate: false
      },
      {
        step_id: "ocr_executor",
        type: "provider",
        inputs: ["layout.regions"],
        outputs: ["ocr.blocks"],
        retry_policy: commonRetry,
        on_failure: "needs_review",
        human_gate: false
      }
    ],
    schema_workflow: [
      {
        step_id: "probe",
        type: "provider",
        inputs: ["document.input"],
        outputs: ["document.probe"],
        retry_policy: commonRetry,
        on_failure: "fail_run",
        human_gate: false
      },
      {
        step_id: "layout",
        type: "provider",
        inputs: ["document.page"],
        outputs: ["layout.regions"],
        retry_policy: commonRetry,
        on_failure: "needs_review",
        human_gate: false
      },
      {
        step_id: "ocr_executor",
        type: "provider",
        inputs: ["layout.regions"],
        outputs: ["ocr.blocks"],
        retry_policy: commonRetry,
        on_failure: "needs_review",
        human_gate: false
      },
      {
        step_id: "validation",
        type: "rule",
        inputs: ["ocr.blocks"],
        outputs: ["validation.result"],
        retry_policy: commonRetry,
        on_failure: "needs_review",
        human_gate: false
      }
    ]
  };

  return createPipelinePlan(mode, "0.1.0", plans[mode]);
}
