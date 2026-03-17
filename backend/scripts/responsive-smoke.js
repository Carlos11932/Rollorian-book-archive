const fs = require('fs/promises');
const path = require('path');
const { chromium } = require('playwright-core');

const app = require('../src/app');

const browserExecutable = process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser';
const artifactsDir = path.resolve(__dirname, '../test-artifacts');

async function captureViewport(page, name, viewport) {
  await page.setViewportSize(viewport);
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.hero-panel');

  const assertions = await page.evaluate(() => {
    const nav = document.querySelector('.site-nav');
    const hero = document.querySelector('.hero-panel');

    return {
      hasNoHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
      navVisible: Boolean(nav && nav.getBoundingClientRect().width > 0),
      heroVisible: Boolean(hero && hero.getBoundingClientRect().width > 0)
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

async function captureRouteViewport(page, name, viewport, route, selector) {
  await page.setViewportSize(viewport);
  await page.goto(`http://127.0.0.1:3000/${route}`, { waitUntil: 'networkidle' });
  await page.waitForSelector(selector);

  const assertions = await page.evaluate((targetSelector) => {
    const target = document.querySelector(targetSelector);

    return {
      hasNoHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
      targetVisible: Boolean(target && target.getBoundingClientRect().width > 0)
    };
  }, selector);

  const failures = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([key]) => key);

  if (failures.length > 0) {
    throw new Error(`${name} route failed: ${failures.join(', ')}`);
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
    await captureRouteViewport(page, 'search-mobile', { width: 390, height: 844 }, '#/search', '#search-input');
    await captureRouteViewport(page, 'library-mobile', { width: 390, height: 844 }, '#/library', '.status-tabs');

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
