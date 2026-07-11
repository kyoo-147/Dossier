import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { RuntimeProvider } from "../src/app/platform/runtimeContext.js";
import { AppShell } from "../src/app/layout/AppShell.js";
import { DocumentsPage } from "../src/features/documents/DocumentsPage.js";
import { InboxPage } from "../src/features/inbox/InboxPage.js";
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

    await waitFor(() => expect(screen.getByText("Runtime ready (desktop simulator)")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Run local pipeline"));

    await waitFor(() => expect(screen.getByText(/Run mock_healthcare_handwriting_prescription/)).toBeInTheDocument());
  });

  it("runs generic parse fixture flow and exports", async () => {
    renderRoute("/workspace?fixture=finance_clean_invoice", <WorkspacePage />);

    await waitFor(() => expect(screen.getByText("Runtime ready (desktop simulator)")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Run local pipeline"));
    await waitFor(() => expect(screen.getByText(/Run mock_finance_clean_invoice/)).toBeInTheDocument());

    fireEvent.click(screen.getByText("Approve & Export JSON"));
    await waitFor(() => expect(screen.getByText(/artifact:\/\/mock\/mock_finance_clean_invoice\.json/)).toBeInTheDocument());
  });

  it("runs schema workflow review path with edit and approval", async () => {
    renderRoute("/review?fixture=finance_risk_invoice", <ReviewPage />);

    await waitFor(() => expect(screen.getByText("Runtime ready (desktop simulator)")).toBeInTheDocument());
    expect(screen.getByText("Approve and export JSON")).toBeDisabled();
  });

  it("registers a local document and processes it from the workspace", async () => {
    render(
      <RuntimeProvider>
        <MemoryRouter initialEntries={["/inbox"]}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/inbox" element={<InboxPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/workspace" element={<WorkspacePage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RuntimeProvider>
    );

    await waitFor(() => expect(screen.getByText("Runtime ready (desktop simulator)")).toBeInTheDocument());

    const sourcePathInput = screen.getAllByRole("textbox")[0]!;
    fireEvent.change(sourcePathInput, {
      target: { value: "D:\\docs\\claim-form.pdf" }
    });
    fireEvent.click(screen.getByText("Add document"));

    await waitFor(() => expect(screen.getByText("claim-form.pdf")).toBeInTheDocument());
    fireEvent.click(screen.getByText("claim-form.pdf"));

    await waitFor(() => expect(screen.getByText("State: empty")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Run local pipeline"));
    await waitFor(() => expect(screen.getByText(/Run mock_local_/)).toBeInTheDocument());
    fireEvent.click(screen.getByText("Approve & Export JSON"));
    await waitFor(() => expect(screen.getByText(/artifact:\/\/mock\/mock_local_.*\.json/)).toBeInTheDocument());
  });

  it("picks a local document from the desktop picker entry point", async () => {
    renderRoute("/inbox", <InboxPage />);

    await waitFor(() => expect(screen.getByText("Runtime ready (desktop simulator)")).toBeInTheDocument());
    expect(screen.getByText(/Desktop mode: desktop simulator\./)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Pick from device"));

    await waitFor(() => expect(screen.getByText("picked-demo.pdf")).toBeInTheDocument());
  });

  it("shows local review documents in the review queue and supports approval", async () => {
    render(
      <RuntimeProvider>
        <MemoryRouter initialEntries={["/inbox"]}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/inbox" element={<InboxPage />} />
              <Route path="/workspace" element={<WorkspacePage />} />
              <Route path="/review" element={<ReviewPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RuntimeProvider>
    );

    await waitFor(() => expect(screen.getByText("Runtime ready (desktop simulator)")).toBeInTheDocument());

    const sourcePathInput = screen.getAllByRole("textbox")[0]!;
    fireEvent.change(sourcePathInput, {
      target: { value: "D:\\docs\\needs-review.pdf" }
    });
    fireEvent.click(screen.getByLabelText("Schema"));
    fireEvent.click(screen.getByText("Add document"));
    await waitFor(() => expect(screen.getByText("needs-review.pdf")).toBeInTheDocument());

    fireEvent.click(screen.getByText("needs-review.pdf"));
    await waitFor(() => expect(screen.getByText("Run local pipeline")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Run local pipeline"));
    await waitFor(() => expect(screen.getByText(/Run mock_local_/)).toBeInTheDocument());

    fireEvent.click(screen.getByText("Review"));
    await waitFor(() => expect(screen.getByText("Local review queue")).toBeInTheDocument());
    fireEvent.click(screen.getByText("needs-review.pdf"));

    await waitFor(() => expect(screen.getByText("Approve and export JSON")).toBeEnabled());
    fireEvent.click(screen.getByText("Approve and export JSON"));
    await waitFor(() => expect(screen.getByText(/artifact:\/\/mock\/mock_local_.*\.json/)).toBeInTheDocument());
  });

  it("shows registered local documents in the All Documents browser", async () => {
    render(
      <RuntimeProvider>
        <MemoryRouter initialEntries={["/inbox"]}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/inbox" element={<InboxPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/workspace" element={<WorkspacePage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RuntimeProvider>
    );

    await waitFor(() => expect(screen.getByText("Runtime ready (desktop simulator)")).toBeInTheDocument());

    const sourcePathInput = screen.getAllByRole("textbox")[0]!;
    fireEvent.change(sourcePathInput, {
      target: { value: "D:\\docs\\all-docs-demo.pdf" }
    });
    fireEvent.click(screen.getByText("Add document"));
    await waitFor(() => expect(screen.getByText("all-docs-demo.pdf")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Documents"));
    await waitFor(() => expect(screen.getByText("All documents")).toBeInTheDocument());
    expect(screen.getByText("all-docs-demo.pdf")).toBeInTheDocument();
  });

  it("saves an exported artifact to a desktop path after approval", async () => {
    renderRoute("/workspace?fixture=finance_clean_invoice", <WorkspacePage />);

    await waitFor(() => expect(screen.getByText("Runtime ready (desktop simulator)")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Run local pipeline"));
    await waitFor(() => expect(screen.getByText(/Run mock_finance_clean_invoice/)).toBeInTheDocument());

    fireEvent.click(screen.getByText("Approve & Export JSON"));
    await waitFor(() => expect(screen.getByText(/artifact:\/\/mock\/mock_finance_clean_invoice\.json/)).toBeInTheDocument());

    fireEvent.click(screen.getByText("Save export to disk"));
    await waitFor(() => expect(screen.getByText(/Saved to: D:\\Exports\\mock_finance_clean_invoice\.json/)).toBeInTheDocument());

    fireEvent.click(screen.getByText("Reveal export in folder"));
    await waitFor(() =>
      expect(screen.getByText(/Revealed in file explorer: D:\\Exports\\mock_finance_clean_invoice\.json/)).toBeInTheDocument()
    );
  });

  it("renders quick OCR entry demo list", async () => {
    renderRoute("/quick-ocr", <QuickOcrPage />);
    await waitFor(() => expect(screen.getByText("Runtime ready (desktop simulator)")).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Quick OCR" })).toBeInTheDocument();
    expect(screen.getByText("rx_handwriting_003.jpg")).toBeInTheDocument();
  });
});
