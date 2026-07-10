import { useState } from "react";
import { StandardPageShell } from "../../app/layout/StandardPageShell.js";
import { useRuntimeContext } from "../../app/platform/runtimeContext.js";
import { FixtureSummaryCard } from "../workspace/FixtureSummaryCard.js";
import { quickOcrFixtures } from "../workspace/workspaceFixtures.js";

export function QuickOcrPage() {
  const { pickDocumentSource, registerDocument } = useRuntimeContext();
  const [pickedPath, setPickedPath] = useState<string | null>(null);
  return (
    <StandardPageShell
      title="Quick OCR"
      description="Read one PDF or image without running the full agentic pipeline. You can promote the result into a structured workflow later."
      className="quick-ocr-page"
    >
      <section className="quick-dropzone"><span className="quick-drop-icon">OCR</span><div><h2>Drop a PDF or image here</h2><p>{pickedPath ?? "Printed text and Vietnamese handwriting are supported by the configured provider."}</p></div><button className="button button--primary" onClick={() => void (async () => { const picked = await pickDocumentSource(); if (!picked) return; setPickedPath(picked); await registerDocument({ sourcePath: picked, modeHint: "quick_ocr", pageCount: 1, hasSchema: false }); })()}>Choose a document</button><small>or press Ctrl + O</small></section>
      <section className="standard-section"><div className="section-heading-row"><div><h2>Quick OCR fixtures</h2><p>Ready-to-run lightweight examples</p></div><span className="section-count">{quickOcrFixtures.length}</span></div><div className="fixture-list">{quickOcrFixtures.map((fixture) => <FixtureSummaryCard key={fixture.fixtureId} fixture={fixture} />)}</div></section>
    </StandardPageShell>
  );
}
