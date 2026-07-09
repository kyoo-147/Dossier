import { z } from "zod";
export const DocumentStatusSchema = z.enum([
    "created",
    "processing",
    "review",
    "approved",
    "exported",
    "failed"
]);
export const DocumentSchema = z.object({
    document_id: z.string(),
    source_type: z.enum(["pdf", "image", "scan", "bundle"]),
    file_name: z.string(),
    mime_type: z.string(),
    page_count: z.number().int().nonnegative(),
    language_hints: z.array(z.string()),
    created_at: z.string(),
    checksum: z.string(),
    status: DocumentStatusSchema,
    current_revision_id: z.string()
});
export const PageSchema = z.object({
    page_id: z.string(),
    document_id: z.string(),
    index: z.number().int().nonnegative(),
    width: z.number().nonnegative(),
    height: z.number().nonnegative(),
    rotation: z.number(),
    image_ref: z.string(),
    thumbnail_ref: z.string()
});
export const BBoxSchema = z.object({
    x: z.number(),
    y: z.number(),
    w: z.number().nonnegative(),
    h: z.number().nonnegative()
});
export const RegionSchema = z.object({
    region_id: z.string(),
    page_id: z.string(),
    type: z.enum([
        "text",
        "table",
        "kv",
        "stamp",
        "signature",
        "barcode",
        "qr",
        "handwriting",
        "unknown"
    ]),
    bbox: BBoxSchema,
    reading_order: z.number().int().nonnegative(),
    parent_region_id: z.string().nullable(),
    confidence: z.number(),
    artifact_ref: z.string()
});
//# sourceMappingURL=document.js.map