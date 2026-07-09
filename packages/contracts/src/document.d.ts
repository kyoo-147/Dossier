import { z } from "zod";
export declare const DocumentStatusSchema: z.ZodEnum<{
    created: "created";
    processing: "processing";
    review: "review";
    approved: "approved";
    exported: "exported";
    failed: "failed";
}>;
export type DocumentStatus = z.infer<typeof DocumentStatusSchema>;
export declare const DocumentSchema: z.ZodObject<{
    document_id: z.ZodString;
    source_type: z.ZodEnum<{
        pdf: "pdf";
        image: "image";
        scan: "scan";
        bundle: "bundle";
    }>;
    file_name: z.ZodString;
    mime_type: z.ZodString;
    page_count: z.ZodNumber;
    language_hints: z.ZodArray<z.ZodString>;
    created_at: z.ZodString;
    checksum: z.ZodString;
    status: z.ZodEnum<{
        created: "created";
        processing: "processing";
        review: "review";
        approved: "approved";
        exported: "exported";
        failed: "failed";
    }>;
    current_revision_id: z.ZodString;
}, z.core.$strip>;
export type Document = z.infer<typeof DocumentSchema>;
export declare const PageSchema: z.ZodObject<{
    page_id: z.ZodString;
    document_id: z.ZodString;
    index: z.ZodNumber;
    width: z.ZodNumber;
    height: z.ZodNumber;
    rotation: z.ZodNumber;
    image_ref: z.ZodString;
    thumbnail_ref: z.ZodString;
}, z.core.$strip>;
export type Page = z.infer<typeof PageSchema>;
export declare const BBoxSchema: z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
    w: z.ZodNumber;
    h: z.ZodNumber;
}, z.core.$strip>;
export type BBox = z.infer<typeof BBoxSchema>;
export declare const RegionSchema: z.ZodObject<{
    region_id: z.ZodString;
    page_id: z.ZodString;
    type: z.ZodEnum<{
        unknown: "unknown";
        text: "text";
        table: "table";
        kv: "kv";
        stamp: "stamp";
        signature: "signature";
        barcode: "barcode";
        qr: "qr";
        handwriting: "handwriting";
    }>;
    bbox: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        w: z.ZodNumber;
        h: z.ZodNumber;
    }, z.core.$strip>;
    reading_order: z.ZodNumber;
    parent_region_id: z.ZodNullable<z.ZodString>;
    confidence: z.ZodNumber;
    artifact_ref: z.ZodString;
}, z.core.$strip>;
export type Region = z.infer<typeof RegionSchema>;
