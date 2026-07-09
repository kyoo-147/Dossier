import { z } from "zod";

export const RunModeSchema = z.enum([
  "quick_ocr",
  "generic_parse",
  "schema_workflow"
]);

export type RunMode = z.infer<typeof RunModeSchema>;

export const RunStatusSchema = z.enum([
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

export type RunStatus = z.infer<typeof RunStatusSchema>;

export const PlannerSummarySchema = z.object({
  doc_type: z.enum(["invoice", "form", "medical", "bank", "unknown"]),
  complexity: z.enum(["low", "medium", "high"]),
  recommended_mode: RunModeSchema
});

export const RunSchema = z.object({
  run_id: z.string(),
  document_id: z.string(),
  mode: RunModeSchema,
  pipeline_id: z.string(),
  pipeline_version: z.string(),
  status: RunStatusSchema,
  started_at: z.string(),
  finished_at: z.string().nullable(),
  trace_id: z.string(),
  planner_summary: PlannerSummarySchema
});

export type Run = z.infer<typeof RunSchema>;
