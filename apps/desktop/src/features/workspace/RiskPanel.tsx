export function RiskPanel({
  riskScore,
  riskSummary,
}: {
  riskScore: string;
  riskSummary: string[];
}) {
  return (
    <div style={{ border: "1px solid #d1d5db", background: "#fff", padding: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Risk & Validation</div>
      <div style={{ fontSize: 28, marginBottom: 12 }}>{riskScore}</div>
      <div style={{ display: "grid", gap: 8 }}>
        {riskSummary.map((item) => (
          <div key={item}>{item}</div>
        ))}
      </div>
    </div>
  );
}
