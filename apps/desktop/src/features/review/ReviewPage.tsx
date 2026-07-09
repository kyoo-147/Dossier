import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useRuntimeContext } from "../../app/platform/runtimeContext.js";
import { FixtureSummaryCard } from "../workspace/FixtureSummaryCard.js";
import { resolveWorkspaceFixture, reviewFixtures } from "../workspace/workspaceFixtures.js";
import { ReviewInspector } from "./ReviewInspector.js";

export function ReviewPage() {
  const [searchParams] = useSearchParams();
  const fixtureId = searchParams.get("fixture");
  const documentId = searchParams.get("document");
  const {
    documents,
    sessions,
    refreshReview,
    editField,
    approveAndExport,
    rejectRun,
    refreshSessionReview,
    editSessionField,
    approveSessionAndExport,
    rejectSessionRun
  } = useRuntimeContext();
  const fixture = documentId ? null : resolveWorkspaceFixture(fixtureId);
  const document = documentId ? documents.find((item) => item.document_id === documentId) ?? null : null;
  const sessionKey = document?.document_id ?? fixture?.fixtureId ?? "";
  const session = sessionKey ? sessions[sessionKey] : undefined;
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0);
  const [editValue, setEditValue] = useState("");

  const warnings = session?.result?.warnings.map((warning) => warning.message) ?? fixture?.workspace.warnings ?? [];
  const reviewTasks = session?.reviewTasks ?? session?.result?.review_tasks ?? [];
  const revisions = session?.revisions ?? session?.result?.revisions ?? [];
  const approvalAudit = session?.approvalAudit ?? session?.result?.approval_audit ?? [];
  const localReviewDocuments = documents.filter((item) => {
    const localSession = sessions[item.document_id];
    const tasks = localSession?.reviewTasks ?? localSession?.result?.review_tasks ?? [];
    return tasks.some((task) => task.status !== "resolved" && task.status !== "approved");
  });
  const editableField = useMemo(
    () => session?.result?.fields.find((field) => field.status === "warning") ?? session?.result?.fields[0] ?? null,
    [session?.result]
  );

  useEffect(() => {
    if (fixture && session?.result?.run.run_id) {
      void refreshReview(fixture);
    } else if (sessionKey && session?.result?.run.run_id) {
      void refreshSessionReview(sessionKey);
    }
  }, [fixture, refreshReview, refreshSessionReview, session?.result?.run.run_id, sessionKey]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "j") {
        setSelectedTaskIndex((current) => Math.min(current + 1, Math.max(reviewTasks.length - 1, 0)));
      }
      if (event.key === "k") {
        setSelectedTaskIndex((current) => Math.max(current - 1, 0));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [reviewTasks.length]);

  return (
    <div style={{ padding: 20, display: "grid", gap: 16, gridTemplateColumns: "360px 1fr" }}>
      <section style={{ display: "grid", gap: 12, alignContent: "start" }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Review queue</div>
        {reviewFixtures.map((item) => (
          <FixtureSummaryCard key={item.fixtureId} fixture={item} />
        ))}
        <div style={{ fontSize: 18, fontWeight: 600, marginTop: 12 }}>Local review queue</div>
        {localReviewDocuments.length === 0 ? (
          <div style={{ color: "#78716c" }}>No local documents waiting for review.</div>
        ) : (
          localReviewDocuments.map((item) => (
            <Link
              key={item.document_id}
              to={`/review?document=${item.document_id}`}
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
              <div style={{ fontWeight: 600 }}>{item.file_name}</div>
              <div style={{ color: "#6b7280", fontSize: 13 }}>{item.mode_hint} · {item.source_type} · local</div>
            </Link>
          ))
        )}
      </section>
      <section style={{ display: "grid", gap: 16, alignContent: "start" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Approval actions</div>
          <div style={{ color: "#6b7280", marginTop: 6 }}>{fixture?.fileName ?? document?.file_name ?? "No document selected"}</div>
          <div style={{ color: "#6b7280", marginTop: 4, fontSize: 12 }}>Keyboard: j / k to move review selection</div>
        </div>
        <ReviewInspector
          warnings={warnings}
          reviewTasks={reviewTasks}
          revisions={revisions}
          approvalAudit={approvalAudit}
          selectedTaskIndex={selectedTaskIndex}
          onSelectTask={setSelectedTaskIndex}
        />
        <div style={{ border: "1px solid #d1d5db", background: "#fff", padding: 16, display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 600 }}>Field-level review</div>
          <div style={{ color: "#6b7280", fontSize: 13 }}>
            Selected field: {editableField?.label ?? "No field loaded"} · Current: {editableField?.normalized_value ?? "—"}
          </div>
          <input
            value={editValue}
            placeholder={editableField?.normalized_value ?? "Run a document first"}
            onChange={(event) => setEditValue(event.target.value)}
            style={{ padding: "10px 12px", border: "1px solid #d1d5db", background: "#fff" }}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <button
              disabled={!session?.result || !editableField || !editValue}
              onClick={() => {
                if (!editableField || !sessionKey) return;
                if (fixture) {
                  void editField(fixture, editableField.field_id, editValue, "review page manual correction");
                } else {
                  void editSessionField(sessionKey, editableField.field_id, editValue, "review page manual correction");
                }
                setEditValue("");
              }}
              style={{ padding: "10px 12px", border: "1px solid #2563eb", background: "#2563eb", color: "#fff" }}
            >
              Apply field correction
            </button>
            <button
              disabled={!session?.result}
              onClick={() => {
                if (!sessionKey) return;
                if (fixture) {
                  void rejectRun(fixture, "Rejected from review page");
                } else {
                  void rejectSessionRun(sessionKey, "Rejected from review page");
                }
              }}
              style={{ padding: "10px 12px", border: "1px solid #d1d5db", background: "#fff" }}
            >
              Reject run
            </button>
            <button
              disabled={!session?.result}
              onClick={() => {
                if (!sessionKey) return;
                if (fixture) {
                  void approveAndExport(fixture);
                } else {
                  void approveSessionAndExport(sessionKey);
                }
              }}
              style={{ padding: "10px 12px", border: "1px solid #2563eb", background: "#2563eb", color: "#fff" }}
            >
              Approve and export JSON
            </button>
          </div>
          <div style={{ color: "#6b7280", fontSize: 13 }}>
            {session?.artifactRef ? `Last export: ${session.artifactRef}` : "No export artifact yet"}
          </div>
        </div>
      </section>
    </div>
  );
}
