import { z } from "zod";
export declare const ReviewTaskSchema: z.ZodObject<{
    review_task_id: z.ZodString;
    run_id: z.ZodString;
    reason_codes: z.ZodArray<z.ZodString>;
    priority: z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
    }>;
    status: z.ZodEnum<{
        approved: "approved";
        rejected: "rejected";
        open: "open";
        in_progress: "in_progress";
        resolved: "resolved";
    }>;
    assigned_to: z.ZodNullable<z.ZodString>;
    required_action: z.ZodEnum<{
        field_review: "field_review";
        risk_review: "risk_review";
        approval: "approval";
    }>;
}, z.core.$strip>;
export type ReviewTask = z.infer<typeof ReviewTaskSchema>;
export declare const ApprovalRecordSchema: z.ZodObject<{
    who: z.ZodString;
    when: z.ZodString;
    what: z.ZodString;
    run_id: z.ZodString;
    revision_id: z.ZodNullable<z.ZodString>;
    note: z.ZodNullable<z.ZodString>;
    downstream_action_requested: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export type ApprovalRecord = z.infer<typeof ApprovalRecordSchema>;
