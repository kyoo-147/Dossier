import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RuntimeProvider } from "../src/app/platform/runtimeContext.js";
import { AppRouter } from "../src/app/router.js";

describe("app router", () => {
  it("resolves desktop hash routes for the bundled app shell", async () => {
    window.location.hash = "#/quick-ocr";

    render(
      <RuntimeProvider>
        <AppRouter />
      </RuntimeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Runtime ready (desktop simulator)")).toBeInTheDocument();
    });

    expect(screen.getByText("Quick OCR")).toBeInTheDocument();
    expect(screen.queryByText("Pilot demo inbox")).not.toBeInTheDocument();
  });
});
