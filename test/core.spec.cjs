const { test, expect } = require('../tools/playwright.cjs');

test('ui.js loads declared components and their dependencies', async ({ page }) => {
  await page.goto('/ui/test/core.html');

  await expect(page.locator('#users .list-group-item')).toHaveCount(1);
  await expect(page.locator('#users .edit')).toHaveCount(1);
  await expect(page.locator('#mainNav .nav-link')).toHaveText('Home');
  await expect(page.locator('#dialog .modal-title')).toHaveText('Dialog');
  await expect(page.locator('#datePicker')).toBeAttached();
  await expect(page.locator('#colorPicker')).toBeAttached();
  await expect(page.locator('#tagsInput')).toBeAttached();
  await expect(page.locator('#alertDialog')).toBeAttached();
  expect(await page.locator('#users').evaluate(node => typeof node.selectItem === 'function')).toBe(true);
  expect(await page.locator('#resize').evaluate(node => typeof node.addEventListener === 'function')).toBe(true);
  expect(await page.locator('body').evaluate(() => typeof globalThis.HTTP === 'object')).toBe(true);
  expect(await page.evaluate(() => performance.getEntriesByType('resource').some(entry => entry.name.includes('jsdelivr.net')))).toBe(false);
});
