const fs = require('fs/promises');
const path = require('path');
const { chromium } = require('playwright-core');

const app = require('../src/app');

const browserExecutable = process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser';
const artifactsDir = path.resolve(__dirname, '../test-artifacts');

async function captureViewport(page, name, viewport) {
  await page.setViewportSize(viewport);
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle' });

  const assertions = await page.evaluate(() => {
    const searchInput = document.querySelector('#search-input');
    const collectionStatus = document.querySelector('#collection-status');
    const contentGrid = document.querySelector('.content-grid');

    return {
      hasNoHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
      searchInputVisible: Boolean(searchInput && searchInput.getBoundingClientRect().width > 0),
      collectionStatusVisible: Boolean(collectionStatus && collectionStatus.getBoundingClientRect().width > 0),
      singleColumnAtSmallWidths:
        window.innerWidth > 900 ||
        window.getComputedStyle(contentGrid).gridTemplateColumns.split(' ').length === 1
    };
  });

  await page.screenshot({
    path: path.join(artifactsDir, `${name}.png`),
    fullPage: true
  });

  const failures = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([key]) => key);

  if (failures.length > 0) {
    throw new Error(`${name} viewport failed: ${failures.join(', ')}`);
  }
}

async function main() {
  await fs.mkdir(artifactsDir, { recursive: true });

  const server = app.listen(3000);
  const browser = await chromium.launch({
    executablePath: browserExecutable,
    headless: true
  });

  try {
    const page = await browser.newPage();

    await captureViewport(page, 'desktop', { width: 1366, height: 900 });
    await captureViewport(page, 'mobile', { width: 390, height: 844 });

    console.log('Responsive smoke test passed for desktop and mobile viewports.');
  } finally {
    await browser.close();
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
