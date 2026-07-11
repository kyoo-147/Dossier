import { Outlet, useLocation } from "react-router-dom";
import { useRuntimeContext } from "../platform/runtimeContext.js";
import { DesktopTopbar } from "./DesktopTopbar.js";
import { PrimarySidebar } from "./PrimarySidebar.js";

function describeRuntimeMode(mode: "browser-mock" | "tauri-live"): string {
  return mode === "tauri-live" ? "desktop runtime" : "desktop simulator";
}

export function AppShell() {
  const { booting, bootstrapError, kernelStatus, mode } = useRuntimeContext();
  const { pathname } = useLocation();
  const workstation = pathname === "/workspace" || pathname === "/review";
  const topbarTitle = pathname === "/review" ? "Invoice review" : pathname === "/workspace" ? "Workspace" : "Agentic Document Intelligence";
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
      <DesktopTopbar title={topbarTitle} runtimeLabel={runtimeLabel} runtimeError={Boolean(bootstrapError)} />
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
