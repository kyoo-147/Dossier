export const sampleWorkspaceData = {
  documentTitle: "DOC-2026-0001.pdf",
  subtitle: "Invoice · 2 pages",
  fields: [
    { label: "Invoice Number", value: "000789", status: "approved" as const },
    { label: "Invoice Date", value: "05/05/2024", status: "approved" as const },
    { label: "Seller Name", value: "CONG TY TNHH ABC", status: "approved" as const },
    { label: "Total Amount", value: "7.590.000", status: "warning" as const },
  ],
  riskScore: "18%",
  riskSummary: [
    "No visual tampering detected",
    "Stamps appear consistent",
    "Metadata valid",
  ],
  warnings: [
    "Total amount mismatch between field and line-item sum",
    "Low confidence in one handwriting region",
  ],
  logs: [
    "Document Router -> Routed to baseline OCR + table parser",
    "Validation -> Found 2 issues that need attention",
    "Self-Correction -> Retried one low-confidence region",
    "Workflow -> Waiting for reviewer approval",
  ],
};
