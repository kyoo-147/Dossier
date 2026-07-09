import { z } from "zod";
export const ReviewTaskSchema = z.object({
    review_task_id: z.string(),
    run_id: z.string(),
    reason_codes: z.array(z.string()),
    priority: z.enum(["low", "medium", "high"]),
    status: z.enum(["open", "in_progress", "resolved", "approved", "rejected"]),
    assigned_to: z.string().nullable(),
    required_action: z.enum(["field_review", "risk_review", "approval"])
});
export const ApprovalRecordSchema = z.object({
    who: z.string(),
    when: z.string(),
    what: z.string(),
    run_id: z.string(),
    revision_id: z.string().nullable(),
    note: z.string().nullable(),
    downstream_action_requested: z.string().nullable()
});
//# sourceMappingURL=review.js.map