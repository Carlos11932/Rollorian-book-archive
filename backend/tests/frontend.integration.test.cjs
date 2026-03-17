const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');

const app = require('../src/app');

const browserExecutable = process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser';

function createBook(overrides = {}) {
  return {
    id: 1,
    title: 'Dune',
    authors: ['Frank Herbert'],
    publishedYear: '1965',
    isbn: '9780441172719',
    coverUrl: null,
    status: 'reading',
    notes: '',
    externalSource: 'google-books',
    externalId: 'gb-1',
    createdAt: '2026-03-17T10:00:00.000Z',
    updatedAt: '2026-03-17T10:00:00.000Z',
    ...overrides
  };
}

async function startServer() {
  return await new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      resolve(server);
    });
  });
}

async function stopServer(server) {
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

async function withBrowser(run) {
  const browser = await chromium.launch({
    executablePath: browserExecutable,
    headless: true
  });

  try {
    await run(browser);
  } finally {
    await browser.close();
  }
}

test('search route hydrates from hash and saves a result', async () => {
  const server = await startServer();
  const { port } = server.address();

  try {
    await withBrowser(async (browser) => {
      const page = await browser.newPage();

      await page.route('**/api/search/books**', async (route) => {
        const url = new URL(route.request().url());
        assert.equal(url.searchParams.get('q'), 'dune');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [createBook({ id: 11, externalId: 'search-11' })]
          })
        });
      });

      await page.route('**/api/books', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }

        const payload = JSON.parse(route.request().postData() || '{}');
        assert.equal(payload.title, 'Dune');

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ item: createBook({ id: 11 }) })
        });
      });

      await page.goto(`http://127.0.0.1:${port}/#/search?q=dune`, { waitUntil: 'networkidle' });
      await page.waitForSelector('.search-card');

      assert.equal(await page.inputValue('#search-input'), 'dune');
      assert.equal(await page.locator('[data-nav-link="/search"]').getAttribute('aria-current'), 'page');

      await page.getByRole('button', { name: 'Save to library' }).click();
      await page.waitForFunction(() => document.querySelector('.feedback')?.textContent.includes('Saved "Dune" to your library.'));

      assert.equal(await page.locator('.search-card .button').textContent(), 'Saved');
    });
  } finally {
    await stopServer(server);
  }
});

test('library route filters by hash and opens detail', async () => {
  const server = await startServer();
  const { port } = server.address();

  try {
    await withBrowser(async (browser) => {
      const page = await browser.newPage();

      await page.route('**/api/books?**', async (route) => {
        const url = new URL(route.request().url());
        assert.equal(url.searchParams.get('status'), 'reading');
        assert.equal(url.searchParams.get('q'), 'dune');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [createBook({ id: 21, notes: 'Desert power.' })]
          })
        });
      });

      await page.goto(`http://127.0.0.1:${port}/#/library?status=reading&q=dune`, { waitUntil: 'networkidle' });
      await page.waitForSelector('.library-card');

      assert.equal(await page.inputValue('#library-query'), 'dune');
      assert.equal(await page.locator('[data-status-tab="reading"]').evaluate((node) => node.classList.contains('is-active')), true);

      await page.getByRole('button', { name: 'Open detail' }).click();
      await page.waitForURL(`http://127.0.0.1:${port}/#/books/21`);

      assert.equal(await page.locator('[data-nav-link="/library"]').getAttribute('aria-current'), 'page');
    });
  } finally {
    await stopServer(server);
  }
});

test('detail removal redirects to library and shows flash feedback', async () => {
  const server = await startServer();
  const { port } = server.address();

  try {
    await withBrowser(async (browser) => {
      const page = await browser.newPage();
      const detailBook = createBook({ id: 31, title: 'The Left Hand of Darkness', authors: ['Ursula K. Le Guin'] });

      await page.route('**/api/books/31', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ item: detailBook })
          });
          return;
        }

        if (route.request().method() === 'DELETE') {
          await route.fulfill({
            status: 204,
            contentType: 'application/json',
            body: ''
          });
          return;
        }

        await route.continue();
      });

      await page.route('**/api/books', async (route) => {
        if (route.request().method() !== 'GET') {
          await route.continue();
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ items: [] })
        });
      });

      await page.goto(`http://127.0.0.1:${port}/#/books/31`, { waitUntil: 'networkidle' });
      await page.waitForSelector('.detail-view');

      await page.getByRole('button', { name: 'Remove book' }).click();
      await page.waitForURL(`http://127.0.0.1:${port}/#/library`);
      await page.waitForFunction(() => document.querySelector('.library-view .feedback')?.textContent.includes('Removed "The Left Hand of Darkness" from your library.'));

      assert.equal(await page.locator('.library-view .feedback').textContent(), 'Removed "The Left Hand of Darkness" from your library.');
    });
  } finally {
    await stopServer(server);
  }
});
