export function ActionPanel() {
  return (
    <div style={{ border: "1px solid #d1d5db", background: "#fff", padding: 12, display: "grid", gap: 10 }}>
      <div style={{ fontWeight: 600 }}>Actions</div>
      <button style={{ padding: "10px 12px", border: "1px solid #2563eb", background: "#2563eb", color: "#fff" }}>
        Send to Review
      </button>
      <button style={{ padding: "10px 12px", border: "1px solid #d1d5db", background: "#fff" }}>
        Approve & Export
      </button>
      <button style={{ padding: "10px 12px", border: "1px solid #d1d5db", background: "#f9fafb" }}>
        More Actions
      </button>
    </div>
  );
}
