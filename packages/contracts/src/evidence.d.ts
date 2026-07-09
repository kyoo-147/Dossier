import { z } from "zod";
export declare const EvidenceSchema: z.ZodObject<{
    evidence_id: z.ZodString;
    run_id: z.ZodString;
    page_id: z.ZodString;
    region_id: z.ZodString;
    bbox: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        w: z.ZodNumber;
        h: z.ZodNumber;
    }, z.core.$strip>;
    kind: z.ZodEnum<{
        table: "table";
        ocr: "ocr";
        validation: "validation";
        risk: "risk";
        copilot: "copilot";
        human_review: "human_review";
    }>;
    provider: z.ZodString;
    provider_version: z.ZodString;
    policy_version: z.ZodNullable<z.ZodString>;
    prompt_version: z.ZodNullable<z.ZodString>;
    payload_ref: z.ZodString;
    summary: z.ZodString;
}, z.core.$strip>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export declare const RiskSignalSchema: z.ZodObject<{
    risk_signal_id: z.ZodString;
    run_id: z.ZodString;
    severity: z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
    }>;
    category: z.ZodEnum<{
        visual: "visual";
        semantic: "semantic";
        business: "business";
        cross_document: "cross_document";
    }>;
    code: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    evidence_ids: z.ZodArray<z.ZodString>;
    action: z.ZodEnum<{
        review: "review";
        ignore: "ignore";
        block_export: "block_export";
    }>;
}, z.core.$strip>;
export type RiskSignal = z.infer<typeof RiskSignalSchema>;
export declare const RevisionSchema: z.ZodObject<{
    revision_id: z.ZodString;
    document_id: z.ZodString;
    base_revision_id: z.ZodNullable<z.ZodString>;
    source: z.ZodEnum<{
        copilot: "copilot";
        original: "original";
        system_repair: "system_repair";
        human_edit: "human_edit";
    }>;
    created_at: z.ZodString;
    author_type: z.ZodEnum<{
        system: "system";
        user: "user";
    }>;
    summary: z.ZodString;
    diff_ref: z.ZodString;
}, z.core.$strip>;
export type Revision = z.infer<typeof RevisionSchema>;
