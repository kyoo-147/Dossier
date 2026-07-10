import { z } from "zod";
import { BBoxSchema } from "./document.js";

export const ProviderTypeSchema = z.enum([
  "probe",
  "layout",
  "ocr_printed",
  "ocr_handwriting",
  "table_parser",
  "field_extractor",
  "validator",
  "copilot",
  "risk_detector",
  "export_adapter"
]);

export const AdapterConfigSchema = z.object({
  source: z.enum(["cloud", "api", "ollama", "huggingface", "local_pack"]),
  model_id: z.string().optional(),
  endpoint: z.string().optional(),
  requires_api_key: z.boolean().default(false),
  size_bytes: z.number().optional()
});

export type AdapterConfig = z.infer<typeof AdapterConfigSchema>;

export const ProviderManifestSchema = z.object({
  provider_id: z.string(),
  provider_name: z.string().optional(),
  provider_type: ProviderTypeSchema,
  version: z.string(),
  capabilities: z.array(z.string()),
  input_contract: z.string(),
  output_contract: z.string(),
  adapter: AdapterConfigSchema,
  resource_profile: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  privacy_profile: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  health_status: z.enum(["healthy", "degraded", "offline", "uninstalled", "installing"])
});

export type ProviderManifest = z.infer<typeof ProviderManifestSchema>;

export const OcrProviderRequestSchema = z.object({
  image_ref: z.string(),
  language_hints: z.array(z.string()),
  region_bbox: BBoxSchema,
  preprocess_profile: z.enum(["default", "receipt", "handwriting"])
});

export type OcrProviderRequest = z.infer<typeof OcrProviderRequestSchema>;

export const OcrProviderResultSchema = z.object({
  text: z.string(),
  lines: z.array(z.string()),
  tokens: z.array(z.string()),
  alternatives: z.array(z.string()),
  confidence: z.number()
});

export type OcrProviderResult = z.infer<typeof OcrProviderResultSchema>;
