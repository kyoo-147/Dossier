import { Link, Outlet } from "react-router-dom";
import { SplitPanel } from "@dossier/ui-kit";
import { useRuntimeContext } from "../platform/runtimeContext.js";

const sidebarItems = [
  { label: "Inbox", count: 12 },
  { label: "Processing", count: 3 },
  { label: "Reviewed", count: 24 },
  { label: "All Documents", count: null },
  { label: "RAG / Search", count: null },
  { label: "Automation", count: null },
  { label: "Settings", count: null }
] as const;

function describeRuntimeMode(mode: "browser-mock" | "tauri-live"): string {
  return mode === "tauri-live" ? "desktop runtime" : "desktop simulator";
}

export function AppShell() {
  const { booting, bootstrapError, kernelStatus, mode } = useRuntimeContext();
  const modeLabel = describeRuntimeMode(mode);
  const runtimeLabel = bootstrapError
    ? "Runtime error"
    : booting
      ? "Booting runtime"
      : kernelStatus?.runtime.runtime_running
        ? `Runtime ready (${modeLabel})`
        : `Runtime pending (${modeLabel})`;

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
            <Link
              key={item.label}
              to={
                item.label === "Inbox"
                  ? "/inbox"
                  : item.label === "Settings"
                    ? "/settings"
                    : item.label === "All Documents"
                      ? "/documents"
                      : item.label === "Processing"
                        ? "/quick-ocr"
                        : item.label === "Reviewed"
                          ? "/review"
                          : "/inbox"
              }
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 10px",
                border: "1px solid transparent",
                color: "#111827",
                textDecoration: "none"
              }}
            >
              <span>{item.label}</span>
              {item.count !== null ? <span>{item.count}</span> : null}
            </Link>
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
          <div style={{ color: bootstrapError ? "#b91c1c" : "#166534" }}>{runtimeLabel}</div>
        </header>
        <SplitPanel>
          <Outlet />
        </SplitPanel>
      </main>
    </div>
  );
}
