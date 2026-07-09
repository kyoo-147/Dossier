import type { DomainPackManifest } from "../shared/manifest.js";

export const financePack: DomainPackManifest = {
  packId: "finance.risk_triage_v1",
  title: "Finance Risk Triage",
  industry: "finance",
  description: "Demo pack for invoice, payment, and application review with arithmetic and approval gates.",
  schemaKeys: ["invoice.number", "invoice.date", "invoice.total_amount", "buyer.tax_code", "seller.tax_code"],
  fields: [
    { schemaKey: "invoice.number", label: "Invoice Number", required: true, fieldType: "text" },
    { schemaKey: "invoice.date", label: "Invoice Date", required: true, fieldType: "date" },
    { schemaKey: "invoice.total_amount", label: "Total Amount", required: true, fieldType: "currency" },
    { schemaKey: "buyer.tax_code", label: "Buyer Tax Code", required: false, fieldType: "code" },
    { schemaKey: "seller.tax_code", label: "Seller Tax Code", required: true, fieldType: "code" }
  ],
  rules: [
    {
      ruleId: "finance.total_mismatch",
      description: "Invoice total must match the line item sum.",
      severity: "high",
      metric: "field_accuracy"
    },
    {
      ruleId: "finance.approval_gate",
      description: "Pilot exports remain blocked until human approval.",
      severity: "medium",
      metric: "stp_rate"
    }
  ],
  pipelinePresets: [
    {
      mode: "generic_parse",
      pipelineId: "finance_invoice_parse",
      reviewRequired: false,
      providerHints: ["probe.default", "layout.default", "table_parser.default"]
    },
    {
      mode: "schema_workflow",
      pipelineId: "finance_invoice_review",
      reviewRequired: true,
      providerHints: ["probe.default", "layout.default", "table_parser.default", "risk.default"]
    }
  ],
  demoFixtures: ["finance_clean_invoice", "finance_risk_invoice"]
};
