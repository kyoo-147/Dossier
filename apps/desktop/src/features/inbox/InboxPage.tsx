import { useState } from "react";
import { Link } from "react-router-dom";
import { useRuntimeContext } from "../../app/platform/runtimeContext.js";
import { FixtureSummaryCard } from "../workspace/FixtureSummaryCard.js";
import { demoFixtures } from "../workspace/workspaceFixtures.js";

export function InboxPage() {
  const { documents, registerDocument, mode } = useRuntimeContext();
  const [sourcePath, setSourcePath] = useState("");
  const [modeHint, setModeHint] = useState("generic_parse");
  const [pageCount, setPageCount] = useState("1");
  const [hasSchema, setHasSchema] = useState(false);

  return (
    <div style={{ padding: 20, display: "grid", gap: 16 }}>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>Pilot demo inbox</div>
        <div style={{ color: "#6b7280", marginTop: 6 }}>
          Desktop mode: {mode}. Demo fixtures stay available, but this inbox can now register local documents too.
        </div>
      </div>
      <section style={{ border: "1px solid #d6d3d1", background: "#fcfcfb", padding: 16, display: "grid", gap: 12 }}>
        <div style={{ fontWeight: 600 }}>Register local document</div>
        <input
          value={sourcePath}
          onChange={(event) => setSourcePath(event.target.value)}
          placeholder="D:\\docs\\invoice.pdf"
          style={{ padding: "10px 12px", border: "1px solid #d1d5db", background: "#fff" }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px auto", gap: 10 }}>
          <select value={modeHint} onChange={(event) => setModeHint(event.target.value)} style={{ padding: "10px 12px" }}>
            <option value="quick_ocr">quick_ocr</option>
            <option value="generic_parse">generic_parse</option>
            <option value="schema_workflow">schema_workflow</option>
          </select>
          <input
            value={pageCount}
            onChange={(event) => setPageCount(event.target.value)}
            placeholder="Pages"
            style={{ padding: "10px 12px", border: "1px solid #d1d5db", background: "#fff" }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={hasSchema} onChange={(event) => setHasSchema(event.target.checked)} />
            Schema
          </label>
          <button
            disabled={!sourcePath.trim()}
            onClick={() =>
              void registerDocument({
                sourcePath,
                modeHint,
                pageCount: Number(pageCount) || 1,
                hasSchema
              })
            }
            style={{ padding: "10px 12px", border: "1px solid #2563eb", background: "#2563eb", color: "#fff" }}
          >
            Add document
          </button>
        </div>
      </section>
      <section style={{ display: "grid", gap: 12 }}>
        <div style={{ fontWeight: 600 }}>Local documents</div>
        {documents.length === 0 ? (
          <div style={{ color: "#78716c" }}>No local documents registered yet.</div>
        ) : (
          documents.map((document) => (
            <Link
              key={document.document_id}
              to={`/workspace?document=${document.document_id}`}
              style={{
                display: "grid",
                gap: 6,
                border: "1px solid #d6d3d1",
                background: "#fff",
                padding: 14,
                textDecoration: "none",
                color: "#111827"
              }}
            >
              <div style={{ fontWeight: 600 }}>{document.file_name}</div>
              <div style={{ color: "#6b7280", fontSize: 13 }}>
                {document.mode_hint} · {document.source_type} · {document.page_count} page(s)
              </div>
              <div style={{ color: "#78716c", fontSize: 12 }}>{document.source_path}</div>
            </Link>
          ))
        )}
      </section>
      <div style={{ display: "grid", gap: 12 }}>
        {demoFixtures.map((fixture) => (
          <FixtureSummaryCard key={fixture.fixtureId} fixture={fixture} />
        ))}
      </div>
    </div>
  );
}
