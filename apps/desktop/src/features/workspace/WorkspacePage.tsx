const sampleFields = [
  ["Invoice Number", "000789"],
  ["Invoice Date", "05/05/2024"],
  ["Seller Name", "CONG TY TNHH ABC"],
  ["Total Amount", "7.590.000"]
] as const;

export function WorkspacePage() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr 360px",
        gridTemplateRows: "1fr 220px",
        minHeight: "calc(100vh - 56px)"
      }}
    >
      <section style={{ borderRight: "1px solid #e5e7eb", padding: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>DOC-2026-0001.pdf</div>
        <div style={{ color: "#6b7280", marginBottom: 16 }}>Invoice · 2 pages</div>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ border: "1px solid #cbd5e1", padding: 12, height: 240 }}>Page 1 thumbnail</div>
          <div style={{ border: "1px solid #e5e7eb", padding: 12, height: 240 }}>Page 2 thumbnail</div>
        </div>
      </section>
      <section style={{ borderRight: "1px solid #e5e7eb", padding: 16 }}>
        <div style={{ border: "1px solid #d1d5db", background: "#fff", height: "100%" }}>
          <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>Document canvas</div>
        </div>
      </section>
      <section style={{ padding: 16, display: "grid", gap: 16 }}>
        <div style={{ border: "1px solid #d1d5db", background: "#fff" }}>
          <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>
            Extracted Fields
          </div>
          <div style={{ padding: 12, display: "grid", gap: 10 }}>
            {sampleFields.map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                <span style={{ color: "#6b7280" }}>{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ border: "1px solid #d1d5db", background: "#fff", padding: 12 }}>
          Risk score and validation summary.
        </div>
      </section>
      <section
        style={{
          gridColumn: "1 / 4",
          borderTop: "1px solid #e5e7eb",
          background: "#fafaf9",
          padding: 16
        }}
      >
        Agent logs / self-correction / history
      </section>
    </div>
  );
}
