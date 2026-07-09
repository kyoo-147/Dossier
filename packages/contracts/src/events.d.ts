import { z } from "zod";
export declare const EventTypeSchema: z.ZodEnum<{
    "document.created": "document.created";
    "document.probed": "document.probed";
    "run.planned": "run.planned";
    "ocr.completed": "ocr.completed";
    "validation.failed": "validation.failed";
    "repair.succeeded": "repair.succeeded";
    "risk.scored": "risk.scored";
    "review.requested": "review.requested";
    "approval.completed": "approval.completed";
    "export.delivered": "export.delivered";
}>;
export declare const EventEnvelopeSchema: z.ZodObject<{
    event_type: z.ZodEnum<{
        "document.created": "document.created";
        "document.probed": "document.probed";
        "run.planned": "run.planned";
        "ocr.completed": "ocr.completed";
        "validation.failed": "validation.failed";
        "repair.succeeded": "repair.succeeded";
        "risk.scored": "risk.scored";
        "review.requested": "review.requested";
        "approval.completed": "approval.completed";
        "export.delivered": "export.delivered";
    }>;
    trace_id: z.ZodString;
    run_id: z.ZodNullable<z.ZodString>;
    document_id: z.ZodNullable<z.ZodString>;
    emitted_at: z.ZodString;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, z.core.$strip>;
export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;
