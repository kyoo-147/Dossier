import { z } from "zod";
export const FieldStatusSchema = z.enum([
    "extracted",
    "warning",
    "needs_review",
    "approved",
    "rejected"
]);
export const FieldTypeSchema = z.enum([
    "string",
    "number",
    "date",
    "currency",
    "id",
    "table",
    "enum",
    "boolean"
]);
export const FieldConfidenceSchema = z.object({
    ocr: z.number(),
    mapping: z.number(),
    validation: z.number(),
    overall: z.number()
});
export const FieldSchema = z.object({
    field_id: z.string(),
    run_id: z.string(),
    schema_key: z.string(),
    label: z.string(),
    type: FieldTypeSchema,
    observed_value: z.string().nullable(),
    normalized_value: z.string().nullable(),
    inferred_value: z.string().nullable(),
    generated_value: z.string().nullable(),
    human_approved_value: z.string().nullable(),
    unit: z.string().nullable(),
    status: FieldStatusSchema,
    confidence: FieldConfidenceSchema,
    evidence_ids: z.array(z.string()),
    warning_codes: z.array(z.string())
});
//# sourceMappingURL=field.js.map