export function ReviewInspector({ warnings }: { warnings: string[] }) {
  return (
    <div style={{ border: "1px solid #d1d5db", background: "#fff", padding: 16 }}>
      <div style={{ fontWeight: 600, marginBottom: 12 }}>Review Queue</div>
      <div style={{ display: "grid", gap: 10 }}>
        {warnings.map((warning) => (
          <div key={warning} style={{ borderLeft: "2px solid #d97706", paddingLeft: 10 }}>
            {warning}
          </div>
        ))}
      </div>
    </div>
  );
}
