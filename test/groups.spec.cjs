const { test, expect } = require('../tools/playwright.cjs');

test('ui.js expands base, form, data, and editor component groups', async ({ page }) => {
  await page.goto('/ui/test/groups.html');

  const names = ['API', 'AutoForm', 'List', 'Modal', 'Dialog', 'Toast', 'Nav', 'Resizer', 'DatePicker', 'ColorPicker', 'IconPicker', 'TagsInput', 'DataGrid', 'Chart', 'Kanban', 'Mindmap', 'GraphEditor', 'CodeEditor'];
  expect(await page.evaluate(items => items.every(name => Component.exists(name)), names)).toBe(true);
  await expect(page.locator('#datePicker')).toBeAttached();
  await expect(page.locator('#tagsInput')).toBeAttached();
  await expect(page.locator('#dataGrid')).toBeAttached();
  await expect(page.locator('#chart canvas')).toBeAttached();
  await expect(page.locator('#kanban.kanban-root')).toBeAttached();
  await expect(page.locator('#mindmap.mindmap-root')).toBeAttached();
  await expect(page.locator('#graphEditor.graph-editor-root')).toBeAttached();
  await page.locator('#codeEditor').evaluate(editor => editor.ready);
  await expect(page.locator('#codeEditor .cm-editor')).toBeAttached();
  expect(await page.evaluate(() => typeof Editor === 'object' && typeof SortableAPI === 'object' && typeof GraphDocument === 'object' && typeof GraphCanvas === 'object' && Chart.version === '4.5.1')).toBe(true);
});

test('ui.min.js loads minified libraries, utilities, and components', async ({ page }) => {
  await page.goto('/ui/test/minified.html');
  await expect(page.locator('#minChart canvas')).toBeAttached();
  await expect(page.locator('#minKanban.kanban-root')).toBeAttached();
  await expect(page.locator('#minMindmap.mindmap-root')).toBeAttached();
  await expect(page.locator('#minGraph.graph-editor-root')).toBeAttached();
  await page.locator('#minCode').evaluate(editor => editor.ready);
  await expect(page.locator('#minCode .cm-editor')).toBeAttached();
  const resources = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => new URL(entry.name).pathname));
  expect(resources.some(path => path.endsWith('/libraries/ChartJS.min.js'))).toBe(true);
  expect(resources.some(path => path.endsWith('/libraries/SortableJS.min.js'))).toBe(true);
  expect(resources.some(path => path.endsWith('/utilities/Editor.min.js'))).toBe(true);
  expect(resources.some(path => path.endsWith('/components/editor/GraphEditor.min.js'))).toBe(true);
  expect(resources.some(path => path.endsWith('/libraries/CodeMirror.min.js'))).toBe(true);
  expect(resources.some(path => path.endsWith('/libraries/CodeMirrorYAML.min.js'))).toBe(true);
  expect(resources.some(path => path.endsWith('/components/editor/CodeEditor.min.js'))).toBe(true);
});

test('Chart paints pixels without an unload permissions warning', async ({ page }) => {
  const messages = [];
  page.on('console', message => messages.push(message.text()));
  await page.goto('/ui/components/data/Chart.test.html');
  const result = await page.evaluate(() => globalThis.runTest());
  expect(result.status).toBe('passed');
  await page.waitForTimeout(100);
  const painted = await page.locator('#chart canvas').evaluate(canvas => {
    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    for (let index = 3; index < pixels.length; index += 4) if (pixels[index]) return true;
    return false;
  });
  expect(painted).toBe(true);
  expect(messages.join('\n')).not.toContain('unload is not allowed');
});
