import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { RuntimeProvider } from "../src/app/platform/runtimeContext.js";
import { AppShell } from "../src/app/layout/AppShell.js";
import { WorkspacePage } from "../src/features/workspace/WorkspacePage.js";

describe("workspace shell", () => {
  it("renders the dossier shell and workspace layout", async () => {
    render(
      <RuntimeProvider>
        <MemoryRouter initialEntries={["/workspace?fixture=finance_risk_invoice"]}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/workspace" element={<WorkspacePage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RuntimeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Runtime ready (desktop simulator)")).toBeInTheDocument();
    });

    expect(screen.getByText("Dossier")).toBeInTheDocument();
    expect(screen.getByText("Agentic Document Intelligence")).toBeInTheDocument();
    expect(screen.getByTestId("workstation-shell")).toBeInTheDocument();
    expect(screen.getByTestId("document-rail")).toBeInTheDocument();
    expect(screen.getByTestId("document-viewer")).toBeInTheDocument();
    expect(screen.getByTestId("document-inspector")).toBeInTheDocument();
    expect(screen.getByTestId("workbench")).toBeInTheDocument();
    const workbench = screen.getByTestId("workbench");
    expect(within(workbench).getByText("Agent Logs")).toBeInTheDocument();
    expect(within(workbench).getByText("Self-Correction")).toBeInTheDocument();
    expect(within(workbench).getByText("Errors & Warnings")).toBeInTheDocument();
    const inspector = screen.getByTestId("document-inspector");
    expect(within(inspector).getAllByText("Extracted Fields")).toHaveLength(2);
    expect(within(workbench).getByText("Actions")).toBeInTheDocument();
    expect(within(inspector).getByText("Risk & Validation")).toBeInTheDocument();
    expect(screen.getByText("RISK-2026-0021.pdf")).toBeInTheDocument();
    expect(screen.getByText("finance · schema_workflow · risk")).toBeInTheDocument();
  });
});
