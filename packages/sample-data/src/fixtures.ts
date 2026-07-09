import type { SampleFixture } from "./types.js";

export const sampleFixtures: SampleFixture[] = [
  {
    fixtureId: "finance_clean_invoice",
    bucket: "golden",
    industry: "finance",
    mode: "generic_parse",
    fileName: "invoice_789.pdf",
    expectedFields: [
      { schemaKey: "invoice.number", value: "000789", required: true },
      { schemaKey: "invoice.date", value: "2024-05-05", required: true },
      { schemaKey: "invoice.total_amount", value: "7590000", required: true },
      { schemaKey: "seller.tax_code", value: "0101234567", required: true }
    ],
    expectedReview: false,
    expectedLatencyMs: 3200,
    workspace: {
      documentTitle: "DOC-2026-0001.pdf",
      subtitle: "Invoice · 2 pages",
      fields: [
        { label: "Invoice Number", value: "000789", status: "approved" },
        { label: "Invoice Date", value: "05/05/2024", status: "approved" },
        { label: "Seller Name", value: "CONG TY TNHH ABC", status: "approved" },
        { label: "Total Amount", value: "7.590.000", status: "warning" }
      ],
      riskScore: "18%",
      riskSummary: ["No visual tampering detected", "Stamps appear consistent", "Metadata valid"],
      warnings: [
        "Total amount mismatch between field and line-item sum",
        "Low confidence in one handwriting region"
      ],
      logs: [
        "Document Router -> Routed to baseline OCR + table parser",
        "Validation -> Found 2 issues that need attention",
        "Self-Correction -> Retried one low-confidence region",
        "Workflow -> Waiting for reviewer approval"
      ]
    }
  },
  {
    fixtureId: "finance_risk_invoice",
    bucket: "risk",
    industry: "finance",
    mode: "schema_workflow",
    fileName: "invoice_risk_021.pdf",
    expectedFields: [
      { schemaKey: "invoice.number", value: "000021", required: true },
      { schemaKey: "invoice.total_amount", value: "12000000", required: true }
    ],
    expectedReview: true,
    expectedLatencyMs: 4100,
    workspace: {
      documentTitle: "RISK-2026-0021.pdf",
      subtitle: "Risk invoice · 1 page",
      fields: [
        { label: "Invoice Number", value: "000021", status: "approved" },
        { label: "Invoice Date", value: "07/06/2026", status: "approved" },
        { label: "Total Amount", value: "12.000.000", status: "warning" }
      ],
      riskScore: "46%",
      riskSummary: ["Amount mismatch detected", "Low confidence handwriting region", "Approval required"],
      warnings: ["Total amount mismatch", "Approval required"],
      logs: [
        "Probe -> schema_workflow",
        "Validation -> arithmetic mismatch",
        "Review -> approval task opened"
      ]
    }
  },
  {
    fixtureId: "healthcare_clean_intake",
    bucket: "clean",
    industry: "healthcare",
    mode: "schema_workflow",
    fileName: "hospital_intake_001.pdf",
    expectedFields: [
      { schemaKey: "patient.name", value: "Nguyen Van A", required: true },
      { schemaKey: "patient.id", value: "BN-001", required: true }
    ],
    expectedReview: true,
    expectedLatencyMs: 3700,
    workspace: {
      documentTitle: "HSBA-0001.pdf",
      subtitle: "Hospital intake · 3 pages",
      fields: [
        { label: "Patient Name", value: "Nguyen Van A", status: "approved" },
        { label: "Patient ID", value: "BN-001", status: "approved" },
        { label: "Encounter Date", value: "09/07/2026", status: "approved" }
      ],
      riskScore: "11%",
      riskSummary: ["No tampering detected", "Required fields complete", "Approval still required"],
      warnings: ["Approval required before HIS update"],
      logs: [
        "Router -> healthcare intake pack",
        "Validation -> required fields complete",
        "Workflow -> waiting for human approval"
      ]
    }
  },
  {
    fixtureId: "healthcare_handwriting_prescription",
    bucket: "handwriting",
    industry: "healthcare",
    mode: "quick_ocr",
    fileName: "rx_handwriting_003.jpg",
    expectedFields: [{ schemaKey: "document.text", value: "Paracetamol", required: true }],
    expectedReview: false,
    expectedLatencyMs: 1800,
    workspace: {
      documentTitle: "RX-003.jpg",
      subtitle: "Handwriting OCR · 1 page",
      fields: [{ label: "Detected Text", value: "Paracetamol 500mg", status: "approved" }],
      riskScore: "6%",
      riskSummary: ["Single page handwriting capture", "No business anomaly rules applied"],
      warnings: [],
      logs: ["Quick OCR -> handwriting baseline", "Export -> markdown ready"]
    }
  },
  {
    fixtureId: "enterprise_clean_form",
    bucket: "golden",
    industry: "enterprise",
    mode: "quick_ocr",
    fileName: "internal_request_004.pdf",
    expectedFields: [{ schemaKey: "document.title", value: "Internal Request", required: true }],
    expectedReview: false,
    expectedLatencyMs: 1500,
    workspace: {
      documentTitle: "REQ-004.pdf",
      subtitle: "Enterprise form · 1 page",
      fields: [{ label: "Document Title", value: "Internal Request", status: "approved" }],
      riskScore: "4%",
      riskSummary: ["Fast capture complete", "Ready for export"],
      warnings: [],
      logs: ["Quick OCR -> baseline capture", "Export -> connector stub ready"]
    }
  },
  {
    fixtureId: "enterprise_noisy_form",
    bucket: "noisy",
    industry: "enterprise",
    mode: "schema_workflow",
    fileName: "internal_request_noisy_005.pdf",
    expectedFields: [
      { schemaKey: "document.owner", value: "Operations", required: true },
      { schemaKey: "approval.requestor", value: "Le Thi B", required: true }
    ],
    expectedReview: true,
    expectedLatencyMs: 3400,
    workspace: {
      documentTitle: "REQ-005.pdf",
      subtitle: "Noisy enterprise form · 2 pages",
      fields: [
        { label: "Document Owner", value: "Operations", status: "approved" },
        { label: "Requestor", value: "Le Thi B", status: "warning" }
      ],
      riskScore: "24%",
      riskSummary: ["Low confidence requestor field", "Review required before workflow handoff"],
      warnings: ["Low confidence requestor field"],
      logs: ["Schema workflow -> enterprise form", "Self-Correction -> retry alt provider", "Review -> queued"]
    }
  }
];

export const sampleFixtureById = Object.fromEntries(sampleFixtures.map((fixture) => [fixture.fixtureId, fixture])) as Record<
  string,
  SampleFixture
>;

const primaryWorkspaceFixture = sampleFixtures.find((fixture) => fixture.fixtureId === "finance_clean_invoice");

if (!primaryWorkspaceFixture) {
  throw new Error("Primary finance workspace fixture is missing.");
}

export const sampleWorkspaceRecord = primaryWorkspaceFixture.workspace;
