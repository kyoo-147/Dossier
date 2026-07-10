import type { ReactNode } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useRuntimeContext } from "../platform/runtimeContext.js";

type IconName = "inbox" | "clock" | "check" | "folder" | "search" | "automation" | "settings";

const sidebarItems: Array<{ label: string; to: string; count?: number; icon: IconName }> = [
  { label: "Inbox", to: "/inbox", count: 12, icon: "inbox" },
  { label: "Processing", to: "/quick-ocr", count: 3, icon: "clock" },
  { label: "Reviewed", to: "/review", count: 24, icon: "check" },
  { label: "All Documents", to: "/documents", icon: "folder" },
  { label: "RAG / Search", to: "/inbox", icon: "search" },
  { label: "Automation", to: "/inbox", icon: "automation" },
  { label: "Settings", to: "/settings", icon: "settings" }
];

const agentItems = [
  ["Document Router", "Routed", "done"],
  ["Parser Selection", "Paddle OCR + TableParser", "done"],
  ["Layout & Region", "12 regions", "done"],
  ["OCR Executor", "Completed", "done"],
  ["Verification", "Warnings", "warning"],
  ["Self-Correction", "2 retries", "done"],
  ["Structuring", "JSON / Markdown", "done"],
  ["Workflow / RAG", "Ready", "idle"]
] as const;

function describeRuntimeMode(mode: "browser-mock" | "tauri-live"): string {
  return mode === "tauri-live" ? "desktop runtime" : "desktop simulator";
}

function UiIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    inbox: <><path d="M4 5.5h16l-1.6 13H5.6L4 5.5Z" /><path d="M8 12h2l1 2h2l1-2h2" /></>,
    clock: <><circle cx="12" cy="12" r="8" /><path d="M12 7v5l-3 2" /></>,
    check: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="m8 12 2.5 2.5L16 9" /></>,
    folder: <path d="M3.5 7h7l2-2h8v14h-17V7Z" />,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 4 4M8 10.5h5M10.5 8v5" /></>,
    automation: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19 13.5 2-1.5-2-1.5-.7-1.8.4-2.5-2.5-.9-1.5 2-1.9-.7L12 4l-1.5 2.2-1.9.7-2-1.5-1.7 2 .8 2-1.2 1.6L2 12l2.5 1 .7 1.8-.4 2.5 2.5.9 1.5-2 1.9.7L12 20l1.5-2.2 1.9-.7 2 1.5 1.7-2-.8-2 .7-1.1Z" /></>
  };

  return <svg className="ui-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function DesktopTopbar({ runtimeLabel, runtimeError }: { runtimeLabel: string; runtimeError: boolean }) {
  return (
    <header className="desktop-topbar">
      <div className="window-controls" aria-hidden="true">
        <span className="window-dot window-dot--red" />
        <span className="window-dot window-dot--amber" />
        <span className="window-dot window-dot--green" />
      </div>
      <button className="icon-button menu-button" aria-label="Toggle navigation"><span /><span /><span /></button>
      <div className="app-wordmark">Dossier</div>
      <div className="app-product-name">Agentic Document Intelligence</div>
      <div className={`runtime-state ${runtimeError ? "runtime-state--error" : ""}`}>
        <span className="runtime-dot" />
        {runtimeLabel}
      </div>
      <button className="help-button" aria-label="Help">?</button>
      <button className="avatar-button" aria-label="Account">AK</button>
    </header>
  );
}

function PrimarySidebar() {
  return (
    <aside className="primary-sidebar">
      <nav className="primary-navigation" aria-label="Primary navigation">
        {sidebarItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) => `nav-row${isActive ? " nav-row--active" : ""}`}
          >
            <UiIcon name={item.icon} />
            <span className="nav-label">{item.label}</span>
            {item.count !== undefined ? <span className="nav-count">{item.count}</span> : null}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-separator" />
      <div className="sidebar-section-title">Agents</div>
      <ol className="agent-list">
        {agentItems.map(([name, state, status], index) => (
          <li className="agent-row" key={name}>
            <span className="agent-index">{index + 1}</span>
            <span className="agent-copy"><strong>{name}</strong><small>{state}</small></span>
            <span className={`agent-status agent-status--${status}`} aria-label={status}>{status === "warning" ? "!" : status === "done" ? "✓" : "⌄"}</span>
          </li>
        ))}
      </ol>

      <footer className="sidebar-footer">
        <UiIcon name="settings" />
        <span>v1.0.0</span>
        <span className="footer-divider" />
        <span className="runtime-dot" />
        <span>Local AI Mode</span>
      </footer>
    </aside>
  );
}

export function AppShell() {
  const { booting, bootstrapError, kernelStatus, mode } = useRuntimeContext();
  const { pathname } = useLocation();
  const workstation = pathname === "/workspace" || pathname === "/review";
  const modeLabel = describeRuntimeMode(mode);
  const runtimeLabel = bootstrapError
    ? "Runtime error"
    : booting
      ? "Booting runtime"
      : kernelStatus?.runtime.runtime_running
        ? `Runtime ready (${modeLabel})`
        : `Runtime pending (${modeLabel})`;

  return (
    <div className="desktop-frame">
      <DesktopTopbar runtimeLabel={runtimeLabel} runtimeError={Boolean(bootstrapError)} />
      <PrimarySidebar />
      <main className="desktop-content">
        <div
          className={workstation ? "route-shell route-shell--workstation" : "route-shell route-shell--standard"}
          data-testid={workstation ? "workstation-shell" : "standard-shell"}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
