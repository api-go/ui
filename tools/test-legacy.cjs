const { spawn } = require('node:child_process');
const { mkdtemp, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const net = require('node:net');
const { chromium } = require('playwright');

const root = join(__dirname, '..');
const aliases = { DataGrid: 'components/data/DataGrid.test.html', 'data.DataGrid': 'components/data/DataGrid.test.html' };
const requested = process.argv[2];
const pages = requested
  ? [aliases[requested] || `components/${requested.replace('.', '/')}.test.html`]
  : ['utilities/Editor.test.html', 'utilities/HTTP.test.html', 'utilities/SortableAPI.test.html', 'utilities/GraphDocument.test.html', 'utilities/GraphCanvas.test.html', 'components/base/API.test.html', 'components/base/AutoForm.test.html', 'components/base/List.test.html', 'components/base/Modal.test.html', 'components/base/Nav.test.html', 'components/base/View.test.html', 'components/data/DataGrid.test.html', 'components/data/Chart.test.html', 'components/editor/Kanban.test.html', 'components/editor/Mindmap.test.html', 'components/editor/GraphEditor.test.html', 'components/editor/MarkdownViewer.test.html', 'components/editor/CodeEditor.test.html'];

const getPort = () => new Promise((resolve, reject) => {
  const server = net.createServer();
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => { const { port } = server.address(); server.close(() => resolve(port)); });
});
const waitFor = async (url, timeout = 10000) => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try { if ((await fetch(url)).ok) return; } catch (_) { }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${url}`);
};

(async () => {
  const port = await getPort();
  const server = spawn(process.execPath, [join(__dirname, 'serve.cjs')], { env: { ...process.env, PORT: String(port) }, stdio: 'inherit' });
  let browser;
  try {
    await waitFor(`http://127.0.0.1:${port}/ui/ui.test.html`);
    browser = await chromium.launch({headless:true});
    const context = await browser.newContext();
    for (const pagePath of pages) {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`http://127.0.0.1:${port}/ui/${pagePath}`, { waitUntil: 'networkidle' });
      const result = await page.evaluate(() => globalThis.runTest());
      await page.close();
      if (errors.length || result?.status !== 'passed') throw new Error(`${pagePath}: ${errors.join('\n') || JSON.stringify(result)}`);
      console.log(`Passed ${pagePath}`);
    }
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exit(1); });
