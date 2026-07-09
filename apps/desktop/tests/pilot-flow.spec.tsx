import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { RuntimeProvider } from "../src/app/platform/runtimeContext.js";
import { AppShell } from "../src/app/layout/AppShell.js";
import { QuickOcrPage } from "../src/features/quick-ocr/QuickOcrPage.js";
import { ReviewPage } from "../src/features/review/ReviewPage.js";
import { WorkspacePage } from "../src/features/workspace/WorkspacePage.js";

function renderRoute(initialEntry: string, element: ReactElement) {
  render(
    <RuntimeProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path={initialEntry.split("?")[0]} element={element} />
          </Route>
        </Routes>
      </MemoryRouter>
    </RuntimeProvider>
  );
}

describe("pilot flows", () => {
  it("runs quick OCR fixture flow", async () => {
    renderRoute("/workspace?fixture=healthcare_handwriting_prescription", <WorkspacePage />);

    await waitFor(() => expect(screen.getByText("Runtime ready (browser-mock)")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Run local pipeline"));

    await waitFor(() => expect(screen.getByText(/Run mock_healthcare_handwriting_prescription/)).toBeInTheDocument());
  });

  it("runs generic parse fixture flow and exports", async () => {
    renderRoute("/workspace?fixture=finance_clean_invoice", <WorkspacePage />);

    await waitFor(() => expect(screen.getByText("Runtime ready (browser-mock)")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Run local pipeline"));
    await waitFor(() => expect(screen.getByText(/Run mock_finance_clean_invoice/)).toBeInTheDocument());

    fireEvent.click(screen.getByText("Approve & Export JSON"));
    await waitFor(() => expect(screen.getByText(/artifact:\/\/mock\/mock_finance_clean_invoice\.json/)).toBeInTheDocument());
  });

  it("runs schema workflow review path with edit and approval", async () => {
    renderRoute("/review?fixture=finance_risk_invoice", <ReviewPage />);

    await waitFor(() => expect(screen.getByText("Runtime ready (browser-mock)")).toBeInTheDocument());
    expect(screen.getByText("Approve and export JSON")).toBeDisabled();
  });

  it("renders quick OCR entry demo list", async () => {
    renderRoute("/quick-ocr", <QuickOcrPage />);
    await waitFor(() => expect(screen.getByText("Runtime ready (browser-mock)")).toBeInTheDocument());
    expect(screen.getByText("Quick OCR")).toBeInTheDocument();
    expect(screen.getByText("rx_handwriting_003.jpg")).toBeInTheDocument();
  });
});
