const { test, expect } = require('../tools/playwright.cjs');

test('ui.js expands base and form component groups', async ({ page }) => {
  await page.goto('/ui/test/groups.html');

  const names = ['API', 'AutoForm', 'List', 'Modal', 'Dialog', 'Toast', 'Nav', 'Resizer', 'DatePicker', 'ColorPicker', 'IconPicker', 'TagsInput', 'DataGrid'];
  expect(await page.evaluate(items => items.every(name => Component.exists(name)), names)).toBe(true);
  await expect(page.locator('#datePicker')).toBeAttached();
  await expect(page.locator('#tagsInput')).toBeAttached();
  await expect(page.locator('#dataGrid')).toBeAttached();
});
