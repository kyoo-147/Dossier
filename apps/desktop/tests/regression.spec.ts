import { test, expect } from '@playwright/test';

test.describe('Screenshot Regression', () => {
  test.use({ viewport: { width: 1440, height: 960 } });

  test('Workspace Page Layout', async ({ page }) => {
    // Assuming the dev server runs on localhost:5173
    await page.goto('http://localhost:5173/');
    
    // Wait for the page to render fully
    await page.waitForLoadState('networkidle');

    // Take a screenshot of the entire page and compare it to the baseline
    await expect(page).toHaveScreenshot('workspace-1440x960.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05 // Allow up to 5% visual difference for minor font rendering diffs
    });
  });
});
