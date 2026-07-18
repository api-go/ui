const { test, expect } = require('../tools/playwright.cjs');

test('the UI test console runs every registered component test', async ({ page }) => {
  await page.goto('/ui/ui.test.html');
  await page.locator('#all').click();
  await page.waitForFunction(() => [...document.querySelectorAll('[data-test]')].every(row => row.querySelector('.status').textContent !== '…'));

  await expect(page.locator('[data-test] .status')).toHaveText(Array(22).fill('✓'));
});
