const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './test',
  testMatch: '**/*.spec.cjs',
  use: { baseURL: 'http://127.0.0.1:5173' },
  webServer: {
    command: 'node tools/serve.cjs',
    url: 'http://127.0.0.1:5173/ui/test/core.html',
    reuseExistingServer: !process.env.CI
  }
});
