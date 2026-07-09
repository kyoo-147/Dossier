import { z } from "zod";
export declare const FieldStatusSchema: z.ZodEnum<{
    approved: "approved";
    needs_review: "needs_review";
    rejected: "rejected";
    extracted: "extracted";
    warning: "warning";
}>;
export declare const FieldTypeSchema: z.ZodEnum<{
    string: "string";
    number: "number";
    boolean: "boolean";
    date: "date";
    enum: "enum";
    table: "table";
    currency: "currency";
    id: "id";
}>;
export declare const FieldConfidenceSchema: z.ZodObject<{
    ocr: z.ZodNumber;
    mapping: z.ZodNumber;
    validation: z.ZodNumber;
    overall: z.ZodNumber;
}, z.core.$strip>;
export declare const FieldSchema: z.ZodObject<{
    field_id: z.ZodString;
    run_id: z.ZodString;
    schema_key: z.ZodString;
    label: z.ZodString;
    type: z.ZodEnum<{
        string: "string";
        number: "number";
        boolean: "boolean";
        date: "date";
        enum: "enum";
        table: "table";
        currency: "currency";
        id: "id";
    }>;
    observed_value: z.ZodNullable<z.ZodString>;
    normalized_value: z.ZodNullable<z.ZodString>;
    inferred_value: z.ZodNullable<z.ZodString>;
    generated_value: z.ZodNullable<z.ZodString>;
    human_approved_value: z.ZodNullable<z.ZodString>;
    unit: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        approved: "approved";
        needs_review: "needs_review";
        rejected: "rejected";
        extracted: "extracted";
        warning: "warning";
    }>;
    confidence: z.ZodObject<{
        ocr: z.ZodNumber;
        mapping: z.ZodNumber;
        validation: z.ZodNumber;
        overall: z.ZodNumber;
    }, z.core.$strip>;
    evidence_ids: z.ZodArray<z.ZodString>;
    warning_codes: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type Field = z.infer<typeof FieldSchema>;
