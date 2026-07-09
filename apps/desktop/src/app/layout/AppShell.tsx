import { Outlet } from "react-router-dom";
import { SplitPanel } from "@dossier/ui-kit";

const sidebarItems = [
  { label: "Inbox", count: 12 },
  { label: "Processing", count: 3 },
  { label: "Reviewed", count: 24 },
  { label: "All Documents", count: null },
  { label: "RAG / Search", count: null },
  { label: "Automation", count: null },
  { label: "Settings", count: null }
] as const;

export function AppShell() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "240px 1fr",
        minHeight: "100vh",
        background: "#f5f5f4",
        color: "#111827",
        fontFamily: "Inter, Geist Sans, sans-serif"
      }}
    >
      <aside
        style={{
          borderRight: "1px solid #e5e7eb",
          background: "#efefee",
          padding: 16
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 24 }}>Dossier</div>
        <nav style={{ display: "grid", gap: 8 }}>
          {sidebarItems.map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 10px",
                border: "1px solid transparent"
              }}
            >
              <span>{item.label}</span>
              {item.count !== null ? <span>{item.count}</span> : null}
            </div>
          ))}
        </nav>
      </aside>
      <main style={{ minWidth: 0 }}>
        <header
          style={{
            height: 56,
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            background: "#fafaf9"
          }}
        >
          <div>Agentic Document Intelligence</div>
          <div style={{ color: "#166534" }}>AI Agent Running</div>
        </header>
        <SplitPanel>
          <Outlet />
        </SplitPanel>
      </main>
    </div>
  );
}
