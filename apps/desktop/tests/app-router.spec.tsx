import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RuntimeProvider } from "../src/app/platform/runtimeContext.js";
import { AppRouter } from "../src/app/router.js";

describe("app router", () => {
  it("resolves standard shell routes for the bundled desktop app", async () => {
    window.location.hash = "#/quick-ocr";

    render(
      <RuntimeProvider>
        <AppRouter />
      </RuntimeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Runtime ready (desktop simulator)")).toBeInTheDocument();
    });

    expect(screen.getByTestId("standard-shell")).toBeInTheDocument();
    expect(screen.queryByTestId("workstation-shell")).not.toBeInTheDocument();
    expect(screen.getByText("Agents")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Quick OCR" })).toBeInTheDocument();
    expect(screen.queryByText("Pilot demo inbox")).not.toBeInTheDocument();
  });

  it("resolves workstation routes for review screens", async () => {
    window.location.hash = "#/review?fixture=finance_risk_invoice";

    render(
      <RuntimeProvider>
        <AppRouter />
      </RuntimeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Runtime ready (desktop simulator)")).toBeInTheDocument();
    });

    expect(screen.getByTestId("workstation-shell")).toBeInTheDocument();
    expect(screen.queryByTestId("standard-shell")).not.toBeInTheDocument();
    expect(screen.getByTestId("document-rail")).toBeInTheDocument();
    expect(screen.getByTestId("document-viewer")).toBeInTheDocument();
    expect(screen.getByTestId("document-inspector")).toBeInTheDocument();
    expect(screen.getByTestId("workbench")).toBeInTheDocument();
    expect(screen.getByText("Current Run")).toBeInTheDocument();
  });

  it("keeps settings in the standard shell with enterprise setting groups", async () => {
    window.location.hash = "#/settings";

    render(
      <RuntimeProvider>
        <AppRouter />
      </RuntimeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Runtime ready (desktop simulator)")).toBeInTheDocument();
    });

    expect(screen.getByTestId("standard-shell")).toBeInTheDocument();
    expect(screen.getByText("Runtime & execution")).toBeInTheDocument();
    expect(screen.getByText("Providers & adapters")).toBeInTheDocument();
    expect(screen.getByText("Review policy")).toBeInTheDocument();
    expect(screen.getByText("Export defaults")).toBeInTheDocument();
  });
});
