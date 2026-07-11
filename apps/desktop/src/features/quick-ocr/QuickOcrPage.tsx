import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { StandardPageShell } from "../../app/layout/StandardPageShell.js";
import { useRuntimeContext } from "../../app/platform/runtimeContext.js";
import { FixtureSummaryCard } from "../workspace/FixtureSummaryCard.js";
import { quickOcrFixtures } from "../workspace/workspaceFixtures.js";

export function QuickOcrPage() {
  const { pickDocumentSource, registerDocument, processDocument, documents, sessions } = useRuntimeContext();
  const [pickedPath, setPickedPath] = useState<string | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const activeDocument = useMemo(() => documents.find((item) => item.document_id === activeDocumentId) ?? null, [activeDocumentId, documents]);
  const activeSession = activeDocumentId ? sessions[activeDocumentId] : undefined;
  const extraction = activeSession?.result?.source?.text_extraction;
  const fields = activeSession?.result?.fields ?? [];

  async function chooseAndRun() {
    const picked = await pickDocumentSource();
    if (!picked) return;
    setPickedPath(picked);
    const created = await registerDocument({ sourcePath: picked, modeHint: "quick_ocr", pageCount: 1, hasSchema: false });
    setActiveDocumentId(created.document_id);
    await processDocument(created);
  }

  return (
    <StandardPageShell
      title="Quick OCR"
      description="Read one PDF or image without running the full agentic pipeline. You can promote the result into a structured workflow later."
      className="quick-ocr-page"
    >
      <section className="quick-dropzone">
        <span className="quick-drop-icon">OCR</span>
        <div>
          <span className="section-eyebrow">Single document utility</span>
          <h2>Drop a PDF or image here</h2>
          <p>{pickedPath ?? "Printed text is handled by the baseline adapter. Image OCR is marked unsupported until PaddleOCR is installed."}</p>
        </div>
        <button className="button button--primary" onClick={() => void chooseAndRun()}>Choose and run OCR</button>
        <small>or press Ctrl + O</small>
      </section>

      <section className="standard-section">
        <div className="section-heading-row">
          <div>
            <h2>Quick OCR result</h2>
            <p>Artifact-backed extraction state for the latest selected document</p>
          </div>
          <span className="section-count">{fields.length}</span>
        </div>
        <div className="quick-result-panel">
          {!activeDocument ? (
            <div className="designed-empty"><span className="empty-document-icon" /><strong>No OCR run yet</strong><p>Choose a document to create an artifact, run the local runtime, and display extracted text here.</p></div>
          ) : (
            <>
              <div className="quick-result-header">
                <span className="document-kind">{activeDocument.source_type === "pdf" ? "PDF" : "IMG"}</span>
                <span><strong>{activeDocument.file_name}</strong><small>{activeDocument.artifact_ref}</small></span>
                <Link className="button" to={`/workspace?document=${activeDocument.document_id}`}>Open workspace</Link>
              </div>
              <div className="quick-result-metrics">
                <span>Extraction: <strong>{extraction?.status ?? (activeSession?.processing ? "processing" : "not run")}</strong></span>
                <span>Adapter: <strong>{extraction?.adapter ?? "none"}</strong></span>
                <span>Characters: <strong>{extraction?.characters ?? 0}</strong></span>
                <span>Events: <strong>{activeSession?.events?.length ?? 0}</strong></span>
              </div>
              <div className="quick-text-output">
                {fields.length === 0 ? (
                  <p>{activeSession?.error ?? "No extracted fields. If this is an image, install an OCR provider before expecting text output."}</p>
                ) : (
                  fields.map((field) => (
                    <div key={field.field_id} className="quick-field-row">
                      <strong>{field.label}</strong>
                      <span>{field.normalized_value}</span>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="standard-section">
        <div className="section-heading-row"><div><h2>Quick OCR fixtures</h2><p>Ready-to-run lightweight examples</p></div><span className="section-count">{quickOcrFixtures.length}</span></div>
        <div className="fixture-list">{quickOcrFixtures.map((fixture) => <FixtureSummaryCard key={fixture.fixtureId} fixture={fixture} />)}</div>
      </section>
    </StandardPageShell>
  );
}
