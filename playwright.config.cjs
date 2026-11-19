const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  use: {
    baseURL: 'http://127.0.0.1:4201',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node tests/serve-h5.cjs',
    url: 'http://127.0.0.1:4201',
    reuseExistingServer: false,
  },
});
