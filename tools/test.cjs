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
  : ['utilities/Editor.test.html', 'utilities/HTTP.test.html', 'utilities/SortableAPI.test.html', 'utilities/GraphDocument.test.html', 'utilities/GraphCanvas.test.html', 'components/base/API.test.html', 'components/base/AutoForm.test.html', 'components/base/Modal.test.html', 'components/base/Nav.test.html', 'components/base/View.test.html', 'components/data/DataGrid.test.html', 'components/data/Chart.test.html', 'components/editor/Kanban.test.html', 'components/editor/Mindmap.test.html', 'components/editor/GraphEditor.test.html', 'components/editor/MarkdownViewer.test.html', 'components/editor/CodeEditor.test.html'];

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
  const [port, cdpPort] = await Promise.all([getPort(), getPort()]);
  const profile = await mkdtemp(join(tmpdir(), 'apigo-ui-cdp-'));
  const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const server = spawn(process.execPath, [join(__dirname, 'serve.cjs')], { env: { ...process.env, PORT: String(port) }, stdio: 'inherit' });
  const browserProcess = spawn(chrome, [`--headless=new`, `--remote-debugging-port=${cdpPort}`, `--user-data-dir=${profile}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  let browser;
  try {
    await Promise.all([waitFor(`http://127.0.0.1:${port}/ui/ui.test.html`), waitFor(`http://127.0.0.1:${cdpPort}/json/version`)]);
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`);
    const context = browser.contexts()[0];
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
    await new Promise(resolve => {
      if (browserProcess.exitCode !== null) return resolve();
      browserProcess.once('exit', resolve);
      browserProcess.kill();
      setTimeout(resolve, 2000);
    });
    server.kill();
    await rm(profile, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exit(1); });
