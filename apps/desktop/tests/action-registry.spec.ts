import { describe, expect, it, vi } from "vitest";
import { createActionRegistry, formatShortcut, type DossierAction } from "../src/app/actions/actionRegistry.js";

describe("action registry", () => {
  it("returns only enabled actions and executes the selected command", async () => {
    const run = vi.fn();
    const actions: DossierAction[] = [
      { id: "review.next_warning", label: "Next warning", shortcut: "J", run },
      { id: "review.approve_export", label: "Approve and export", shortcut: "Ctrl+Enter", disabled: () => true, run: vi.fn() }
    ];

    const registry = createActionRegistry(actions);

    expect(registry.enabled().map((action) => action.id)).toEqual(["review.next_warning"]);
    await registry.execute("review.next_warning");
    expect(run).toHaveBeenCalledTimes(1);
    await expect(registry.execute("review.approve_export")).rejects.toThrow("disabled");
  });

  it("matches keyboard events against normalized shortcuts", () => {
    const registry = createActionRegistry([
      { id: "review.accept_value", label: "Accept value", shortcut: "A", run: vi.fn() },
      { id: "review.approve_export", label: "Approve and export", shortcut: "Ctrl+Enter", run: vi.fn() }
    ]);

    const accept = registry.findByKeyboardEvent({ key: "a", ctrlKey: false, metaKey: false, altKey: false, shiftKey: false });
    const approve = registry.findByKeyboardEvent({ key: "Enter", ctrlKey: true, metaKey: false, altKey: false, shiftKey: false });

    expect(accept?.id).toBe("review.accept_value");
    expect(approve?.id).toBe("review.approve_export");
    expect(formatShortcut("Ctrl+Enter")).toBe("Ctrl+Enter");
  });
});
