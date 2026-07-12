import type { SampleFixture } from "./types.js";

const coreSampleFixtures: SampleFixture[] = [
  {
    fixtureId: "finance_clean_invoice",
    bucket: "golden",
    industry: "finance",
    mode: "generic_parse",
    fileName: "invoice_789.pdf",
    sourceText:
      "Invoice Number 000789\nInvoice Date 05/05/2024\nSeller Tax Code 0101234567\nTotal Amount 7590000\nMay in Canon LBP 2900, 2, 3795000",
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
    sourceText:
      "Invoice Number 000021\nInvoice Date 07/06/2026\nTotal Amount 12000000\nConsulting service, 1, 9000000",
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
    sourceText:
      "Patient Name Nguyen Van A\nPatient ID BN-001\nEncounter Date 09/07/2026\nApproval required before HIS update",
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
    sourceText: "Paracetamol 500mg\nTake one tablet after meal",
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
    sourceText: "Internal Request\nDepartment Operations\nFast capture complete",
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
    sourceText:
      "Document Owner Operations\nRequestor Le Thi B\nLow confidence requestor field\nReview required before workflow handoff",
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

function financeFixture(index: number, bucket: SampleFixture["bucket"], mode: SampleFixture["mode"]): SampleFixture {
  const invoiceNumber = `90${index.toString().padStart(2, "0")}`;
  const amount = `${7000000 + index * 125000}`;
  const sellerTaxCode = `01012345${index.toString().padStart(2, "0")}`;
  return {
    fixtureId: `finance_pilot_${index.toString().padStart(2, "0")}`,
    bucket,
    industry: "finance",
    mode,
    fileName: `finance_pilot_${index.toString().padStart(2, "0")}.${index % 4 === 0 ? "png" : "pdf"}`,
    sourceText: `Invoice Number ${invoiceNumber}\nInvoice Date 1${index % 9}/06/2026\nSeller Tax Code ${sellerTaxCode}\nTotal Amount ${amount}\nService fee, 1, ${amount}`,
    expectedFields: [
      { schemaKey: "invoice.number", value: invoiceNumber, required: true },
      { schemaKey: "invoice.total_amount", value: amount, required: true },
      { schemaKey: "seller.tax_code", value: sellerTaxCode, required: true }
    ],
    expectedReview: mode === "schema_workflow",
    expectedLatencyMs: 2800 + index * 80,
    workspace: {
      documentTitle: `FIN-${invoiceNumber}.pdf`,
      subtitle: "Finance pilot document",
      fields: [
        { label: "Invoice Number", value: invoiceNumber, status: "approved" },
        { label: "Total Amount", value: amount, status: "approved" },
        { label: "Seller Tax Code", value: sellerTaxCode, status: "approved" }
      ],
      riskScore: mode === "schema_workflow" ? "31%" : "9%",
      riskSummary: mode === "schema_workflow" ? ["Approval required", "Evidence ready"] : ["Ready for export"],
      warnings: mode === "schema_workflow" ? ["Approval required"] : [],
      logs: ["Probe -> finance pack", "Extraction -> fields mapped", "Export -> draft ready"]
    }
  };
}

function healthcareFixture(index: number, bucket: SampleFixture["bucket"], mode: SampleFixture["mode"]): SampleFixture {
  const patientId = `BN-${(100 + index).toString()}`;
  const patientName = `Nguyen Van ${String.fromCharCode(65 + index)}`;
  return {
    fixtureId: `healthcare_pilot_${index.toString().padStart(2, "0")}`,
    bucket,
    industry: "healthcare",
    mode,
    fileName: `healthcare_pilot_${index.toString().padStart(2, "0")}.${index % 3 === 0 ? "jpg" : "pdf"}`,
    sourceText: `Patient Name ${patientName}\nPatient ID ${patientId}\nEncounter Date 1${index % 9}/07/2026\nApproval required before HIS update`,
    expectedFields: [
      { schemaKey: "patient.name", value: patientName, required: true },
      { schemaKey: "patient.id", value: patientId, required: true }
    ],
    expectedReview: true,
    expectedLatencyMs: 3000 + index * 70,
    workspace: {
      documentTitle: `HC-${patientId}.pdf`,
      subtitle: "Healthcare pilot document",
      fields: [
        { label: "Patient Name", value: patientName, status: "approved" },
        { label: "Patient ID", value: patientId, status: "approved" }
      ],
      riskScore: "14%",
      riskSummary: ["Required fields complete", "Approval required before system handoff"],
      warnings: ["Approval required before HIS update"],
      logs: ["Probe -> healthcare pack", "Validation -> approval gate", "Review -> queued"]
    }
  };
}

function enterpriseFixture(index: number, bucket: SampleFixture["bucket"], mode: SampleFixture["mode"]): SampleFixture {
  const owner = index % 2 === 0 ? "Operations" : "Finance";
  const requestor = index % 2 === 0 ? "Le Thi B" : "Tran Minh C";
  return {
    fixtureId: `enterprise_pilot_${index.toString().padStart(2, "0")}`,
    bucket,
    industry: "enterprise",
    mode,
    fileName: `enterprise_pilot_${index.toString().padStart(2, "0")}.${index % 5 === 0 ? "png" : "pdf"}`,
    sourceText:
      mode === "quick_ocr"
        ? "Internal Request\nDepartment Operations\nFast capture complete"
        : `Document Owner ${owner}\nRequestor ${requestor}\n${bucket === "noisy" ? "Low confidence requestor field\n" : ""}Review required before workflow handoff`,
    expectedFields:
      mode === "quick_ocr"
        ? [{ schemaKey: "document.title", value: "Internal Request", required: true }]
        : [
            { schemaKey: "document.owner", value: owner, required: true },
            { schemaKey: "approval.requestor", value: requestor, required: true }
          ],
    expectedReview: mode === "schema_workflow",
    expectedLatencyMs: 2400 + index * 60,
    workspace: {
      documentTitle: `ENT-${index.toString().padStart(3, "0")}.pdf`,
      subtitle: "Enterprise operations document",
      fields:
        mode === "quick_ocr"
          ? [{ label: "Document Title", value: "Internal Request", status: "approved" }]
          : [
              { label: "Document Owner", value: owner, status: "approved" },
              { label: "Requestor", value: requestor, status: bucket === "noisy" ? "warning" : "approved" }
            ],
      riskScore: bucket === "noisy" ? "24%" : "7%",
      riskSummary: bucket === "noisy" ? ["Low confidence field", "Review required"] : ["Ready for workflow handoff"],
      warnings: bucket === "noisy" ? ["Low confidence requestor field"] : [],
      logs: ["Probe -> enterprise pack", "Extraction -> workflow metadata", "Export -> connector draft ready"]
    }
  };
}

const generatedPilotFixtures: SampleFixture[] = [
  ...Array.from({ length: 8 }, (_, index) =>
    financeFixture(index + 1, index % 3 === 0 ? "risk" : index % 3 === 1 ? "noisy" : "clean", index % 2 === 0 ? "schema_workflow" : "generic_parse")
  ),
  ...Array.from({ length: 8 }, (_, index) =>
    healthcareFixture(index + 1, index % 3 === 0 ? "handwriting" : index % 3 === 1 ? "risk" : "clean", "schema_workflow")
  ),
  ...Array.from({ length: 8 }, (_, index) =>
    enterpriseFixture(index + 1, index % 3 === 0 ? "noisy" : index % 3 === 1 ? "risk" : "clean", index % 2 === 0 ? "schema_workflow" : "quick_ocr")
  )
];

export const sampleFixtures: SampleFixture[] = [...coreSampleFixtures, ...generatedPilotFixtures];

export const sampleFixtureById = Object.fromEntries(sampleFixtures.map((fixture) => [fixture.fixtureId, fixture])) as Record<
  string,
  SampleFixture
>;

const primaryWorkspaceFixture = sampleFixtures.find((fixture) => fixture.fixtureId === "finance_clean_invoice");

if (!primaryWorkspaceFixture) {
  throw new Error("Primary finance workspace fixture is missing.");
}

export const sampleWorkspaceRecord = primaryWorkspaceFixture.workspace;
