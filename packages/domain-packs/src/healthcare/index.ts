import type { DomainPackManifest } from "../shared/manifest.js";

export const healthcarePack: DomainPackManifest = {
  packId: "healthcare.intake_v1",
  title: "Hospital Intake",
  industry: "healthcare",
  description: "Demo pack for patient intake, referral, and prescription-adjacent documents.",
  schemaKeys: ["patient.name", "patient.id", "encounter.date", "provider.name", "diagnosis.code"],
  fields: [
    { schemaKey: "patient.name", label: "Patient Name", required: true, fieldType: "text" },
    { schemaKey: "patient.id", label: "Patient ID", required: true, fieldType: "code" },
    { schemaKey: "encounter.date", label: "Encounter Date", required: true, fieldType: "date" },
    { schemaKey: "provider.name", label: "Provider Name", required: true, fieldType: "text" },
    { schemaKey: "diagnosis.code", label: "Diagnosis Code", required: false, fieldType: "code" }
  ],
  rules: [
    {
      ruleId: "healthcare.required_fields",
      description: "Patient name, patient id, encounter date, and provider name must be present.",
      severity: "high",
      metric: "required_completion"
    },
    {
      ruleId: "healthcare.review_on_missing_code",
      description: "Missing diagnosis code creates review but does not block intake.",
      severity: "medium",
      metric: "review_rate"
    }
  ],
  pipelinePresets: [
    {
      mode: "schema_workflow",
      pipelineId: "healthcare_intake_review",
      reviewRequired: true,
      providerHints: ["layout.default", "ocr_printed.default", "htr.vn_slot"]
    }
  ],
  demoFixtures: ["healthcare_clean_intake", "healthcare_handwriting_prescription"]
};
