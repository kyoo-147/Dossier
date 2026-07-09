import { z } from "zod";

export const RetryPolicySchema = z.object({
  max_attempts: z.number().int().positive(),
  strategies: z.array(
    z.enum(["retry_same", "retry_alt_provider", "retry_recrop"])
  )
});

export type RetryPolicy = z.infer<typeof RetryPolicySchema>;

export const PipelineStepSchema = z.object({
  step_id: z.string(),
  type: z.enum(["provider", "rule", "router", "human_gate", "export"]),
  inputs: z.array(z.string()),
  outputs: z.array(z.string()),
  retry_policy: RetryPolicySchema,
  on_failure: z.enum(["continue_with_warning", "needs_review", "fail_run"]),
  human_gate: z.boolean()
});

export type PipelineStep = z.infer<typeof PipelineStepSchema>;
