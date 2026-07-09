import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useRuntimeContext } from "../../app/platform/runtimeContext.js";
import { FixtureSummaryCard } from "../workspace/FixtureSummaryCard.js";
import { resolveWorkspaceFixture, reviewFixtures } from "../workspace/workspaceFixtures.js";
import { ReviewInspector } from "./ReviewInspector.js";

export function ReviewPage() {
  const [searchParams] = useSearchParams();
  const fixture = resolveWorkspaceFixture(searchParams.get("fixture"));
  const { sessions, refreshReview, editField, approveAndExport, rejectRun } = useRuntimeContext();
  const session = sessions[fixture.fixtureId];
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0);
  const [editValue, setEditValue] = useState("");

  const warnings = session?.result?.warnings.map((warning) => warning.message) ?? fixture.workspace.warnings;
  const reviewTasks = session?.reviewTasks ?? session?.result?.review_tasks ?? [];
  const revisions = session?.revisions ?? session?.result?.revisions ?? [];
  const approvalAudit = session?.approvalAudit ?? session?.result?.approval_audit ?? [];
  const editableField = useMemo(
    () => session?.result?.fields.find((field) => field.status === "warning") ?? session?.result?.fields[0] ?? null,
    [session?.result]
  );

  useEffect(() => {
    if (session?.result?.run.run_id) {
      void refreshReview(fixture);
    }
  }, [fixture, refreshReview, session?.result?.run.run_id]);

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
      </section>
      <section style={{ display: "grid", gap: 16, alignContent: "start" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Approval actions</div>
          <div style={{ color: "#6b7280", marginTop: 6 }}>{fixture.fileName}</div>
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
                if (!editableField) return;
                void editField(fixture, editableField.field_id, editValue, "review page manual correction");
                setEditValue("");
              }}
              style={{ padding: "10px 12px", border: "1px solid #2563eb", background: "#2563eb", color: "#fff" }}
            >
              Apply field correction
            </button>
            <button
              disabled={!session?.result}
              onClick={() => void rejectRun(fixture, "Rejected from review page")}
              style={{ padding: "10px 12px", border: "1px solid #d1d5db", background: "#fff" }}
            >
              Reject run
            </button>
            <button
              disabled={!session?.result}
              onClick={() => void approveAndExport(fixture)}
              style={{ padding: "10px 12px", border: "1px solid #2563eb", background: "#2563eb", color: "#fff" }}
            >
              Approve and export JSON
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
