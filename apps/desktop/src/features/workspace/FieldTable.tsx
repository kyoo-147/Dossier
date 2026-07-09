export interface WorkspaceFieldRow {
  label: string;
  value: string;
  status: "approved" | "warning" | "needs_review";
}

export function FieldTable({ fields }: { fields: WorkspaceFieldRow[] }) {
  return (
    <div style={{ border: "1px solid #d1d5db", background: "#fff" }}>
      <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>
        Extracted Fields
      </div>
      <div style={{ padding: 12, display: "grid", gap: 10 }}>
        {fields.map((field) => (
          <div key={field.label} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12 }}>
            <span style={{ color: "#6b7280" }}>{field.label}</span>
            <span>{field.value}</span>
            <span
              style={{
                color: field.status === "warning" ? "#b45309" : "#166534",
                fontSize: 12,
              }}
            >
              {field.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
