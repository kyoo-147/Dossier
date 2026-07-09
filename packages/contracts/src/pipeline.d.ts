import { z } from "zod";
export declare const RetryPolicySchema: z.ZodObject<{
    max_attempts: z.ZodNumber;
    strategies: z.ZodArray<z.ZodEnum<{
        retry_same: "retry_same";
        retry_alt_provider: "retry_alt_provider";
        retry_recrop: "retry_recrop";
    }>>;
}, z.core.$strip>;
export type RetryPolicy = z.infer<typeof RetryPolicySchema>;
export declare const PipelineStepSchema: z.ZodObject<{
    step_id: z.ZodString;
    type: z.ZodEnum<{
        provider: "provider";
        rule: "rule";
        router: "router";
        human_gate: "human_gate";
        export: "export";
    }>;
    inputs: z.ZodArray<z.ZodString>;
    outputs: z.ZodArray<z.ZodString>;
    retry_policy: z.ZodObject<{
        max_attempts: z.ZodNumber;
        strategies: z.ZodArray<z.ZodEnum<{
            retry_same: "retry_same";
            retry_alt_provider: "retry_alt_provider";
            retry_recrop: "retry_recrop";
        }>>;
    }, z.core.$strip>;
    on_failure: z.ZodEnum<{
        needs_review: "needs_review";
        continue_with_warning: "continue_with_warning";
        fail_run: "fail_run";
    }>;
    human_gate: z.ZodBoolean;
}, z.core.$strip>;
export type PipelineStep = z.infer<typeof PipelineStepSchema>;
