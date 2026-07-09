import { z } from "zod";
export declare const RunModeSchema: z.ZodEnum<{
    quick_ocr: "quick_ocr";
    generic_parse: "generic_parse";
    schema_workflow: "schema_workflow";
}>;
export type RunMode = z.infer<typeof RunModeSchema>;
export declare const RunStatusSchema: z.ZodEnum<{
    created: "created";
    approved: "approved";
    failed: "failed";
    queued: "queued";
    running: "running";
    needs_review: "needs_review";
    completed: "completed";
    rejected: "rejected";
    canceled: "canceled";
}>;
export type RunStatus = z.infer<typeof RunStatusSchema>;
export declare const PlannerSummarySchema: z.ZodObject<{
    doc_type: z.ZodEnum<{
        unknown: "unknown";
        invoice: "invoice";
        form: "form";
        medical: "medical";
        bank: "bank";
    }>;
    complexity: z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
    }>;
    recommended_mode: z.ZodEnum<{
        quick_ocr: "quick_ocr";
        generic_parse: "generic_parse";
        schema_workflow: "schema_workflow";
    }>;
}, z.core.$strip>;
export declare const RunSchema: z.ZodObject<{
    run_id: z.ZodString;
    document_id: z.ZodString;
    mode: z.ZodEnum<{
        quick_ocr: "quick_ocr";
        generic_parse: "generic_parse";
        schema_workflow: "schema_workflow";
    }>;
    pipeline_id: z.ZodString;
    pipeline_version: z.ZodString;
    status: z.ZodEnum<{
        created: "created";
        approved: "approved";
        failed: "failed";
        queued: "queued";
        running: "running";
        needs_review: "needs_review";
        completed: "completed";
        rejected: "rejected";
        canceled: "canceled";
    }>;
    started_at: z.ZodString;
    finished_at: z.ZodNullable<z.ZodString>;
    trace_id: z.ZodString;
    planner_summary: z.ZodObject<{
        doc_type: z.ZodEnum<{
            unknown: "unknown";
            invoice: "invoice";
            form: "form";
            medical: "medical";
            bank: "bank";
        }>;
        complexity: z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
        }>;
        recommended_mode: z.ZodEnum<{
            quick_ocr: "quick_ocr";
            generic_parse: "generic_parse";
            schema_workflow: "schema_workflow";
        }>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type Run = z.infer<typeof RunSchema>;
