import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppShell } from "../src/app/layout/AppShell.js";
import { WorkspacePage } from "../src/features/workspace/WorkspacePage.js";

describe("workspace shell", () => {
  it("renders the dossier shell and workspace layout", () => {
    render(
      <MemoryRouter initialEntries={["/workspace"]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/workspace" element={<WorkspacePage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Dossier")).toBeInTheDocument();
    expect(screen.getByText("Agentic Document Intelligence")).toBeInTheDocument();
    expect(screen.getByText("Document canvas")).toBeInTheDocument();
    expect(screen.getByText("Extracted Fields")).toBeInTheDocument();
  });
});
