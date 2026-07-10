import { useState } from "react";
import { Link } from "react-router-dom";
import { StandardPageShell } from "../../app/layout/StandardPageShell.js";
import { useRuntimeContext } from "../../app/platform/runtimeContext.js";
import { FixtureSummaryCard } from "../workspace/FixtureSummaryCard.js";
import { demoFixtures } from "../workspace/workspaceFixtures.js";

function describeDesktopMode(mode: "browser-mock" | "tauri-live") { return mode === "tauri-live" ? "desktop runtime" : "desktop simulator"; }

export function InboxPage() {
  const { documents, registerDocument, pickDocumentSource, mode } = useRuntimeContext();
  const [sourcePath, setSourcePath] = useState("");
  const [modeHint, setModeHint] = useState("generic_parse");
  const [pageCount, setPageCount] = useState("1");
  const [hasSchema, setHasSchema] = useState(false);
  const addDocument = (path = sourcePath) => registerDocument({ sourcePath: path, modeHint, pageCount: Number(pageCount) || 1, hasSchema });

  return (
    <StandardPageShell
      title="Inbox"
      description="Import documents, choose a processing mode, and route work into the local Dossier runtime."
      headerContent={<div className="header-status"><span className="runtime-dot" /><span>Desktop mode: {describeDesktopMode(mode)}.</span></div>}
      wide={true}
    >
      <section className="intake-panel"><div className="section-heading-row"><div><h2>Register local document</h2><p>PDF, image, scan, or handwriting source</p></div><span className="section-index">01</span></div>
        <div className="intake-source-row"><label className="field-label"><span>Source path</span><input className="input" value={sourcePath} onChange={(event) => setSourcePath(event.target.value)} placeholder="D:\\docs\\invoice.pdf" /></label><button className="button" onClick={() => void (async () => { const picked = await pickDocumentSource(); if (picked) { setSourcePath(picked); await addDocument(picked); } })()}>Pick from device</button></div>
        <div className="intake-options"><label className="field-label"><span>Processing mode</span><select className="select" value={modeHint} onChange={(event) => setModeHint(event.target.value)}><option value="quick_ocr">quick_ocr</option><option value="generic_parse">generic_parse</option><option value="schema_workflow">schema_workflow</option></select></label><label className="field-label field-label--pages"><span>Pages</span><input className="input" value={pageCount} onChange={(event) => setPageCount(event.target.value)} placeholder="Pages" /></label><label className="checkbox-field"><input type="checkbox" checked={hasSchema} onChange={(event) => setHasSchema(event.target.checked)} /><span>Schema</span></label><button className="button button--primary" disabled={!sourcePath.trim()} onClick={() => void addDocument()}>Add document</button></div>
      </section>
      <section className="standard-section"><div className="section-heading-row"><div><h2>Local documents</h2><p>Imported on this device</p></div><span className="section-count">{documents.length}</span></div><div className="document-list">{documents.length === 0 ? <div className="designed-empty"><span className="empty-document-icon" /><strong>No local documents</strong><p>Choose a file above to create the first local document record.</p></div> : documents.map((document) => <Link className="document-row" key={document.document_id} to={`/workspace?document=${document.document_id}`}><span className="document-kind">{document.source_type === "pdf" ? "PDF" : "IMG"}</span><span className="document-copy"><strong>{document.file_name}</strong><small>{document.mode_hint} · {document.page_count} page(s)</small></span><span className="document-path">{document.source_path}</span><span className="row-arrow">›</span></Link>)}</div></section>
      <section className="standard-section"><div className="section-heading-row"><div><h2>Demo documents</h2><p>Curated fixtures for the three pilot domains</p></div><span className="section-count">{demoFixtures.length}</span></div><div className="fixture-list">{demoFixtures.map((fixture) => <FixtureSummaryCard key={fixture.fixtureId} fixture={fixture} />)}</div></section>
    </StandardPageShell>
  );
}
