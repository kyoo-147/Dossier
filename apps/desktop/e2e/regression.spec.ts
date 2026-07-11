import { expect, test } from "@playwright/test";

test.describe("Screenshot Regression", () => {
  test.use({ viewport: { width: 1440, height: 960 } });

  test("Workspace Page Layout", async ({ page }) => {
    await page.goto("/#/workspace");
    await expect(page.getByTestId("workstation-shell")).toBeVisible();

    await expect(page).toHaveScreenshot("workspace-1440x960.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02
    });
  });

  test("Review Page Layout", async ({ page }) => {
    await page.goto("/#/review?fixture=finance_risk_invoice");
    await expect(page.getByText("Current Run")).toBeVisible();

    await expect(page).toHaveScreenshot("review-1440x960.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02
    });
  });

  test("Inbox Page Layout", async ({ page }) => {
    await page.goto("/#/inbox");
    await expect(page.getByRole("heading", { name: "Inbox" })).toBeVisible();

    await expect(page).toHaveScreenshot("inbox-1440x960.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02
    });
  });

  test("Settings Page Layout", async ({ page }) => {
    await page.goto("/#/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    await expect(page).toHaveScreenshot("settings-1440x960.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02
    });
  });
});
