import type { DomainPackManifest } from "../shared/manifest.js";

export const enterprisePack: DomainPackManifest = {
  packId: "enterprise.backoffice_v1",
  title: "Enterprise Backoffice",
  industry: "enterprise",
  description: "Demo pack for internal forms, approvals, and OCR-to-workflow handoff.",
  schemaKeys: ["document.title", "document.owner", "document.created_at", "approval.requestor"],
  fields: [
    { schemaKey: "document.title", label: "Document Title", required: true, fieldType: "text" },
    { schemaKey: "document.owner", label: "Document Owner", required: true, fieldType: "text" },
    { schemaKey: "document.created_at", label: "Created At", required: true, fieldType: "date" },
    { schemaKey: "approval.requestor", label: "Requestor", required: true, fieldType: "text" }
  ],
  rules: [
    {
      ruleId: "enterprise.required_fields",
      description: "Required metadata must be present before routing to workflow.",
      severity: "medium",
      metric: "required_completion"
    },
    {
      ruleId: "enterprise_low_confidence_review",
      description: "Low confidence fields trigger a review task.",
      severity: "medium",
      metric: "review_rate"
    }
  ],
  pipelinePresets: [
    {
      mode: "quick_ocr",
      pipelineId: "enterprise_quick_capture",
      reviewRequired: false,
      providerHints: ["probe.default", "ocr_printed.default"]
    },
    {
      mode: "schema_workflow",
      pipelineId: "enterprise_form_review",
      reviewRequired: true,
      providerHints: ["probe.default", "layout.default", "ocr_printed.default"]
    }
  ],
  demoFixtures: ["enterprise_clean_form", "enterprise_noisy_form"]
};
