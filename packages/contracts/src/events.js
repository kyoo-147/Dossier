import { z } from "zod";
export const EventTypeSchema = z.enum([
    "document.created",
    "document.probed",
    "run.planned",
    "ocr.completed",
    "validation.failed",
    "repair.succeeded",
    "risk.scored",
    "review.requested",
    "approval.completed",
    "export.delivered"
]);
export const EventEnvelopeSchema = z.object({
    event_type: EventTypeSchema,
    trace_id: z.string(),
    run_id: z.string().nullable(),
    document_id: z.string().nullable(),
    emitted_at: z.string(),
    payload: z.record(z.string(), z.unknown())
});
//# sourceMappingURL=events.js.map