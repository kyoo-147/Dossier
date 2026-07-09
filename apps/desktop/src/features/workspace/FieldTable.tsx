export interface WorkspaceFieldRow {
  fieldId: string;
  label: string;
  observedValue?: string | null;
  normalizedValue: string;
  humanApprovedValue?: string | null;
  status: "approved" | "warning" | "needs_review";
}

interface FieldTableProps {
  fields: WorkspaceFieldRow[];
  selectedFieldId?: string | null;
  onSelectField?(fieldId: string): void;
}

export function FieldTable({ fields, selectedFieldId, onSelectField }: FieldTableProps) {
  return (
    <div style={{ border: "1px solid #d1d5db", background: "#fff" }}>
      <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>
        Extracted Fields
      </div>
      <div style={{ padding: 12, display: "grid", gap: 10 }}>
        {fields.map((field) => {
          const selected = field.fieldId === selectedFieldId;
          return (
            <button
              key={field.fieldId}
              onClick={() => onSelectField?.(field.fieldId)}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 8,
                textAlign: "left",
                border: selected ? "1px solid #2563eb" : "1px solid #e5e7eb",
                background: selected ? "#f8fbff" : "#fff",
                padding: 10,
                cursor: "pointer"
              }}
            >
              <div style={{ display: "grid", gap: 4 }}>
                <span style={{ color: "#6b7280", fontSize: 12 }}>{field.label}</span>
                <span>{field.normalizedValue}</span>
                <span style={{ color: "#78716c", fontSize: 12 }}>
                  Observed: {field.observedValue ?? "—"} · Approved: {field.humanApprovedValue ?? "—"}
                </span>
              </div>
              <span
                style={{
                  color: field.status === "warning" ? "#b45309" : field.status === "needs_review" ? "#1d4ed8" : "#166534",
                  fontSize: 12
                }}
              >
                {field.status}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
