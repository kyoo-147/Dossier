import type { RuntimeApprovalAuditRecord, RuntimeRevisionRecord, RuntimeReviewTaskRecord } from "../../app/platform/desktopGateway.js";

interface ReviewInspectorProps {
  warnings: string[];
  reviewTasks: RuntimeReviewTaskRecord[];
  revisions: RuntimeRevisionRecord[];
  approvalAudit: RuntimeApprovalAuditRecord[];
  selectedTaskIndex: number;
  onSelectTask(index: number): void;
}

export function ReviewInspector({
  warnings,
  reviewTasks,
  revisions,
  approvalAudit,
  selectedTaskIndex,
  onSelectTask
}: ReviewInspectorProps) {
  return (
    <div style={{ border: "1px solid #d1d5db", background: "#fff", padding: 16, display: "grid", gap: 16 }}>
      <div>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Review Queue</div>
        <div style={{ display: "grid", gap: 10 }}>
          {reviewTasks.length === 0 ? (
            <div style={{ color: "#78716c" }}>No active review tasks.</div>
          ) : (
            reviewTasks.map((task, index) => (
              <button
                key={task.review_task_id}
                onClick={() => onSelectTask(index)}
                style={{
                  border: index === selectedTaskIndex ? "1px solid #2563eb" : "1px solid #e5e7eb",
                  background: index === selectedTaskIndex ? "#f8fbff" : "#fff",
                  padding: 12,
                  textAlign: "left",
                  cursor: "pointer"
                }}
              >
                <div style={{ fontWeight: 600 }}>{task.review_task_id}</div>
                <div style={{ color: "#6b7280", fontSize: 12 }}>
                  {task.reason_codes.join(", ")} · {task.status}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Warnings</div>
        <div style={{ display: "grid", gap: 10 }}>
          {warnings.map((warning) => (
            <div key={warning} style={{ borderLeft: "2px solid #d97706", paddingLeft: 10 }}>
              {warning}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Revisions</div>
        <div style={{ display: "grid", gap: 8 }}>
          {revisions.length === 0 ? (
            <div style={{ color: "#78716c" }}>No revisions yet.</div>
          ) : (
            revisions.map((revision) => (
              <div key={revision.revision_id} style={{ borderLeft: "2px solid #2563eb", paddingLeft: 10 }}>
                <div>{revision.summary}</div>
                <div style={{ color: "#6b7280", fontSize: 12 }}>
                  {revision.before_value ?? "—"} → {revision.after_value ?? "—"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Approval Audit</div>
        <div style={{ display: "grid", gap: 8 }}>
          {approvalAudit.length === 0 ? (
            <div style={{ color: "#78716c" }}>No approval events yet.</div>
          ) : (
            approvalAudit.map((record) => (
              <div key={record.approval_id} style={{ borderLeft: "2px solid #e5e7eb", paddingLeft: 10 }}>
                <div>{record.action}</div>
                <div style={{ color: "#6b7280", fontSize: 12 }}>
                  {record.actor} · {record.created_at}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
