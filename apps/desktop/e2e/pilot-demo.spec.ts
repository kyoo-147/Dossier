import { expect, test } from "@playwright/test";

test.describe("Pilot golden flows", () => {
  test.use({ viewport: { width: 1440, height: 960 } });

  test("quick OCR route exposes a result panel and fixture launch points", async ({ page }) => {
    await page.goto("/#/quick-ocr");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Quick OCR", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Quick OCR result" })).toBeVisible();
    await expect(page.getByText("No OCR run yet")).toBeVisible();
    await expect(page.getByText("Quick OCR fixtures")).toBeVisible();
  });

  test("generic parse fixture runs through artifact-backed workspace extraction", async ({ page }) => {
    await page.goto("/#/workspace?fixture=enterprise_clean_form");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "Run local pipeline" }).click();

    await expect(page.getByText(/Text extraction provided via fixture/)).toBeVisible();
    await expect(page.getByText(/Run mock_enterprise_clean_form -> completed/)).toBeVisible();
  });

  test("schema workflow fixture supports review approval and export", async ({ page }) => {
    await page.goto("/#/workspace?fixture=finance_risk_invoice");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "Run local pipeline" }).click();
    await expect(page.getByText(/Review task review_finance_risk_invoice -> open/)).toBeVisible();

    await page.getByRole("button", { name: "Approve & Export JSON" }).click();
    await expect(page.locator(".action-panel")).toContainText("Last export: artifact://mock/mock_finance_risk_invoice.json");
  });
});
