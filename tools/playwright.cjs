const { chromium, expect, test: base } = require('@playwright/test');

const endpoint = process.env.CDP_ENDPOINT || 'http://127.0.0.1:9222';
const cdpTest = base.extend({
  browser: [async ({}, use) => {
    const browser = await chromium.connectOverCDP(endpoint);
    try {
      await use(browser);
    } finally {
      await browser.close();
    }
  }, { scope: 'worker' }],
  context: async ({ browser }, use) => {
    const context = browser.contexts()[0];
    if (!context) throw new Error(`No browser context available at ${endpoint}`);
    await use(context);
  },
  page: async ({ context }, use, testInfo) => {
    const page = await context.newPage();
    const baseURL = testInfo.project.use.baseURL;
    if (baseURL) {
      const goto = page.goto.bind(page);
      page.goto = (url, options) => goto(new URL(url, baseURL).href, options);
    }
    try {
      await use(page);
    } finally {
      await page.close();
    }
  }
});

module.exports = { test: process.env.USE_CDP === '1' ? cdpTest : base, expect };
