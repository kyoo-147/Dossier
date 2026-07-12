import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..", "..");
const outDir = resolve(repoRoot, "artifacts", "release-evidence", "sales");

const files = {
  productBrief: "product_brief.md",
  pitchDeck: "pitch_deck.md",
  securityBrief: "security_deployment_brief.md",
  pilotProposal: "pilot_proposal_template.md",
  roiCalculator: "roi_calculator.md",
  demoChecklist: "demo_checklist.md",
  pilotReadiness: "pilot_readiness_report.md"
};

const content = {
  productBrief: `# Dossier Product Brief

Dossier turns messy documents into evidence-backed structured actions.

Dossier is a local-first, governed document intelligence platform for finance, healthcare, and enterprise operations. It reads PDFs, scans, images, tables, and handwriting-like sources; extracts structured fields; links each result to evidence; routes exceptions to review; and exports an auditable action bundle.

Pilot value:
- Raise field-level accuracy and required-field completion.
- Reduce manual review time.
- Keep humans in control for consequential actions.
- Preserve provenance, provider versions, review decisions, approvals, and export references.
`,
  pitchDeck: `# Dossier Pilot Pitch Deck

1. Messy documents still block enterprise workflows.
2. OCR alone is not enough because workflows need validation, review, and audit.
3. Dossier is local-first governed document intelligence.
4. The pipeline probes, parses, extracts, validates, repairs, reviews, approves, and exports.
5. Finance demo: invoice/application to evidence-backed payment or loan draft.
6. Healthcare demo: intake/prescription/form to approved HIS/EMR draft.
7. Enterprise demo: internal request/invoice/receipt to workflow handoff.
8. Differentiators: model-agnostic providers, evidence, review gates, local-first deployment.
9. Pilot KPIs: field accuracy, required completion, STP, review time, export success.
10. Pilot close: 4-8 week enterprise pilot with local fixtures or anonymized documents.
`,
  securityBrief: `# Security and Deployment Brief

Default deployment is local-first hybrid. The desktop app and local runtime process documents locally. The cloud gateway is optional and limited to catalog, license, policy, and optional evaluation usage.

Controls:
- Original artifacts are immutable and content-addressed.
- External AI is disabled by default in the enterprise pilot policy.
- Audit bundles include run events, provider versions, evidence, review decisions, approvals, and export refs.
- Local artifacts remain customer controlled.
- Optional gateway usage is ephemeral and is not required for local processing.
`,
  pilotProposal: `# Enterprise Pilot Proposal Template

Pilot duration: 4-8 weeks.

Pilot scope:
- Three domain packs: finance, healthcare, enterprise operations.
- Local-first desktop deployment.
- Customer-provided anonymized documents or bundled synthetic fixtures.
- Review, approval, export, and audit bundle evaluation.

Success criteria:
- Required-field completion at or above 93% on agreed pilot set.
- 100% export success for approved runs.
- Evidence link available for every exported field.
- Buyer can complete one domain demo in under 5 minutes.
`,
  roiCalculator: `# ROI Calculator

Inputs:
- Documents per month.
- Average manual review minutes per document.
- Reviewer loaded hourly cost.
- Expected automation uplift.

Formula:
- Monthly manual cost = documents_per_month * review_minutes / 60 * hourly_cost.
- Monthly saved cost = monthly_manual_cost * automation_uplift.
- Pilot ROI signal = monthly_saved_cost - pilot_monthly_cost.

Example:
- 10,000 documents/month * 4 minutes / 60 * $18/hour = $12,000 manual review cost.
- 45% uplift = $5,400 monthly saved review capacity.
`,
  demoChecklist: `# Demo Checklist

Finance:
- Run invoice/application fixture.
- Show table parse, mismatch/risk, evidence, review, approve, export.

Healthcare:
- Run intake/prescription/form fixture.
- Show OCR/handwriting evidence, approval gate, audit bundle.

Enterprise:
- Run internal request/invoice/receipt fixture.
- Show quick capture or schema workflow and connector draft.

Close:
- Show benchmark report.
- Show installer hashes.
- Show pilot readiness report and known limits.
`,
  pilotReadiness: `# Pilot Readiness Report

Status: Enterprise Pilot in progress, not production full.

Works now:
- Local runtime PDF text extraction and image OCR adapter path.
- Docling-compatible structured parser metadata path.
- Finance, healthcare, and enterprise domain packs with 30 benchmark fixtures.
- Review, approval, export, and release evidence manifest.
- Optional cloud gateway for catalog, license, policy, and usage evaluation.

Known limits:
- Local image OCR adapter is deterministic pilot scaffolding, not full PaddleOCR packaging yet.
- Handwriting recognition has evidence and fallback behavior, not production-grade HTR accuracy.
- Cloud gateway is not a team server or billing system.
- Full Model Registry install lifecycle and PDF viewer production hardening remain upcoming milestones.

Buyer takeaway:
Dossier can run a cross-industry enterprise pilot with local-first processing, evidence-backed outputs, human approval, export bundles, and measurable benchmark evidence.
`
};

export function writeSalesPacket(options = {}) {
  const destination = options.outDir ? resolve(options.outDir) : outDir;
  mkdirSync(destination, { recursive: true });

  const written = {};
  for (const [key, fileName] of Object.entries(files)) {
    const path = resolve(destination, fileName);
    writeFileSync(path, `${content[key]}\n`, "utf-8");
    written[key] = path;
  }
  return written;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(writeSalesPacket(), null, 2));
}
