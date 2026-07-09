import { z } from "zod";
import { BBoxSchema } from "./document.js";

export const EvidenceSchema = z.object({
  evidence_id: z.string(),
  run_id: z.string(),
  page_id: z.string(),
  region_id: z.string(),
  bbox: BBoxSchema,
  kind: z.enum(["ocr", "table", "validation", "risk", "copilot", "human_review"]),
  provider: z.string(),
  provider_version: z.string(),
  policy_version: z.string().nullable(),
  prompt_version: z.string().nullable(),
  payload_ref: z.string(),
  summary: z.string()
});

export type Evidence = z.infer<typeof EvidenceSchema>;

export const RiskSignalSchema = z.object({
  risk_signal_id: z.string(),
  run_id: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  category: z.enum(["visual", "semantic", "business", "cross_document"]),
  code: z.string(),
  title: z.string(),
  description: z.string(),
  evidence_ids: z.array(z.string()),
  action: z.enum(["ignore", "review", "block_export"])
});

export type RiskSignal = z.infer<typeof RiskSignalSchema>;

export const RevisionSchema = z.object({
  revision_id: z.string(),
  document_id: z.string(),
  base_revision_id: z.string().nullable(),
  source: z.enum(["original", "system_repair", "copilot", "human_edit"]),
  created_at: z.string(),
  author_type: z.enum(["system", "user"]),
  summary: z.string(),
  diff_ref: z.string()
});

export type Revision = z.infer<typeof RevisionSchema>;
