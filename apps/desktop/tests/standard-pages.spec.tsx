import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppShell } from "../src/app/layout/AppShell.js";
import { RuntimeProvider } from "../src/app/platform/runtimeContext.js";
import { DocumentsPage } from "../src/features/documents/DocumentsPage.js";
import { InboxPage } from "../src/features/inbox/InboxPage.js";
import { QuickOcrPage } from "../src/features/quick-ocr/QuickOcrPage.js";

async function renderPage(path: string, element: ReactElement) {
  render(<RuntimeProvider><MemoryRouter initialEntries={[path]}><Routes><Route element={<AppShell />}><Route path={path} element={element} /></Route></Routes></MemoryRouter></RuntimeProvider>);
  await waitFor(() => expect(screen.getByText("Runtime ready (desktop simulator)")).toBeInTheDocument());
}

describe("standard desktop pages", () => {
  it("presents inbox as a structured intake workspace", async () => {
    await renderPage("/inbox", <InboxPage />);
    expect(screen.getByTestId("standard-shell")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Inbox" })).toBeInTheDocument();
    expect(screen.getByText("Register local document")).toBeInTheDocument();
    expect(screen.getByText("Local documents")).toBeInTheDocument();
    expect(screen.getByText("Demo documents")).toBeInTheDocument();
  });

  it("presents documents as an enterprise catalog", async () => {
    await renderPage("/documents", <DocumentsPage />);
    expect(screen.getByRole("heading", { name: "All documents" })).toBeInTheDocument();
    expect(screen.getByText("Document")).toBeInTheDocument();
    expect(screen.getByText("Mode")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Location")).toBeInTheDocument();
  });

  it("keeps quick OCR focused on a single lightweight task", async () => {
    await renderPage("/quick-ocr", <QuickOcrPage />);
    expect(screen.getByText("Single document utility")).toBeInTheDocument();
    expect(screen.getByText("Drop a PDF or image here")).toBeInTheDocument();
    expect(screen.getByText("Choose and run OCR")).toBeInTheDocument();
    expect(screen.getByText("Quick OCR result")).toBeInTheDocument();
    expect(screen.getByText("Quick OCR fixtures")).toBeInTheDocument();
  });
});
