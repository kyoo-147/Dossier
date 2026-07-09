import { z } from "zod";
export declare const ProviderTypeSchema: z.ZodEnum<{
    copilot: "copilot";
    probe: "probe";
    layout: "layout";
    ocr_printed: "ocr_printed";
    ocr_handwriting: "ocr_handwriting";
    table_parser: "table_parser";
    field_extractor: "field_extractor";
    validator: "validator";
    risk_detector: "risk_detector";
    export_adapter: "export_adapter";
}>;
export declare const ProviderManifestSchema: z.ZodObject<{
    provider_id: z.ZodString;
    provider_type: z.ZodEnum<{
        copilot: "copilot";
        probe: "probe";
        layout: "layout";
        ocr_printed: "ocr_printed";
        ocr_handwriting: "ocr_handwriting";
        table_parser: "table_parser";
        field_extractor: "field_extractor";
        validator: "validator";
        risk_detector: "risk_detector";
        export_adapter: "export_adapter";
    }>;
    version: z.ZodString;
    capabilities: z.ZodArray<z.ZodString>;
    input_contract: z.ZodString;
    output_contract: z.ZodString;
    resource_profile: z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean]>>;
    privacy_profile: z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean]>>;
    health_status: z.ZodEnum<{
        healthy: "healthy";
        degraded: "degraded";
        offline: "offline";
    }>;
}, z.core.$strip>;
export type ProviderManifest = z.infer<typeof ProviderManifestSchema>;
export declare const OcrProviderRequestSchema: z.ZodObject<{
    image_ref: z.ZodString;
    language_hints: z.ZodArray<z.ZodString>;
    region_bbox: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        w: z.ZodNumber;
        h: z.ZodNumber;
    }, z.core.$strip>;
    preprocess_profile: z.ZodEnum<{
        default: "default";
        handwriting: "handwriting";
        receipt: "receipt";
    }>;
}, z.core.$strip>;
export type OcrProviderRequest = z.infer<typeof OcrProviderRequestSchema>;
export declare const OcrProviderResultSchema: z.ZodObject<{
    text: z.ZodString;
    lines: z.ZodArray<z.ZodString>;
    tokens: z.ZodArray<z.ZodString>;
    alternatives: z.ZodArray<z.ZodString>;
    confidence: z.ZodNumber;
}, z.core.$strip>;
export type OcrProviderResult = z.infer<typeof OcrProviderResultSchema>;
