import { Link } from "react-router-dom";
import { useRuntimeContext } from "../../app/platform/runtimeContext.js";

export function DocumentsPage() {
  const { documents, sessions } = useRuntimeContext();

  return (
    <div style={{ padding: 20, display: "grid", gap: 16 }}>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>All documents</div>
        <div style={{ color: "#6b7280", marginTop: 6 }}>Local desktop catalog for imported documents and their latest run state.</div>
      </div>

      {documents.length === 0 ? (
        <div style={{ color: "#78716c" }}>No local documents imported yet.</div>
      ) : (
        documents.map((document) => {
          const session = sessions[document.document_id];
          const reviewTasks = session?.reviewTasks ?? session?.result?.review_tasks ?? [];
          const needsReview = reviewTasks.some((task) => task.status !== "resolved" && task.status !== "approved");
          const destination = needsReview ? `/review?document=${document.document_id}` : `/workspace?document=${document.document_id}`;

          return (
            <Link
              key={document.document_id}
              to={destination}
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
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ fontWeight: 600 }}>{document.file_name}</div>
                <div style={{ color: needsReview ? "#b45309" : "#166534", fontSize: 13 }}>
                  {needsReview ? "Review" : session?.artifactRef ? "Exported" : "Ready"}
                </div>
              </div>
              <div style={{ color: "#6b7280", fontSize: 13 }}>
                {document.mode_hint} · {document.source_type} · {document.page_count} page(s)
              </div>
              <div style={{ color: "#78716c", fontSize: 12 }}>{document.source_path}</div>
            </Link>
          );
        })
      )}
    </div>
  );
}
