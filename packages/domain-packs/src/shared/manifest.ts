import { z } from "zod";

export const domainPackFieldSchema = z.object({
  schemaKey: z.string(),
  label: z.string(),
  required: z.boolean(),
  fieldType: z.enum(["text", "number", "date", "currency", "code", "signature"])
});

export const domainPackRuleSchema = z.object({
  ruleId: z.string(),
  description: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  metric: z.enum(["field_accuracy", "required_completion", "review_rate", "stp_rate"])
});

export const pipelinePresetSchema = z.object({
  mode: z.enum(["quick_ocr", "generic_parse", "schema_workflow"]),
  pipelineId: z.string(),
  reviewRequired: z.boolean(),
  providerHints: z.array(z.string())
});

export const domainPackManifestSchema = z.object({
  packId: z.string(),
  title: z.string(),
  industry: z.enum(["healthcare", "finance", "enterprise"]),
  description: z.string(),
  schemaKeys: z.array(z.string()).min(1),
  fields: z.array(domainPackFieldSchema).min(1),
  rules: z.array(domainPackRuleSchema).min(1),
  pipelinePresets: z.array(pipelinePresetSchema).min(1),
  demoFixtures: z.array(z.string()).min(1)
});

export type DomainPackField = z.infer<typeof domainPackFieldSchema>;
export type DomainPackRule = z.infer<typeof domainPackRuleSchema>;
export type PipelinePreset = z.infer<typeof pipelinePresetSchema>;
export type DomainPackManifest = z.infer<typeof domainPackManifestSchema>;
