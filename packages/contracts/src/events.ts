import { z } from "zod";

export const EventTypeSchema = z.enum([
  "document.created",
  "document.probed",
  "run.planned",
  "run.created",
  "run.status_changed",
  "run.executed",
  "run.canceled",
  "run.cancel_ignored",
  "ocr.completed",
  "validation.failed",
  "repair.succeeded",
  "risk.scored",
  "review.requested",
  "review.field_edited",
  "approval.rejected",
  "approval.completed",
  "export.delivered"
]);

export const EventEnvelopeSchema = z.object({
  sequence: z.number().int().positive(),
  type: EventTypeSchema,
  event_type: EventTypeSchema,
  status: z.string().nullable().optional(),
  trace_id: z.string(),
  run_id: z.string().nullable(),
  document_id: z.string().nullable(),
  emitted_at: z.string(),
  payload: z.record(z.string(), z.unknown())
});

export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;

export const RunProgressEventSchema = EventEnvelopeSchema;

export type RunProgressEvent = z.infer<typeof RunProgressEventSchema>;
