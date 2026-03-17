const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../src/app');
const prisma = require('../src/lib/prisma');

test.beforeEach(async () => {
  await prisma.book.deleteMany();
});

test.after(async () => {
  await prisma.book.deleteMany();
  await prisma.$disconnect();
});

test('GET /api/health returns ok', async () => {
  const response = await request(app).get('/api/health');

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: 'ok' });
});

test('GET /api/search/books rejects too-short queries', async () => {
  const response = await request(app).get('/api/search/books').query({ q: 'a' });

  assert.equal(response.status, 400);
  assert.equal(response.body.error.message, 'A valid query with at least 2 characters is required');
});

test('GET /api/search/books returns normalized payload', async () => {
  const originalFetch = global.fetch;
  let requestUrl;

  global.fetch = async (url) => {
    requestUrl = url;

    return {
      ok: true,
      async json() {
        return {
        items: [
          {
            id: 'google-volume-1',
            volumeInfo: {
              title: 'A Wizard of Earthsea',
              authors: ['Ursula K. Le Guin'],
              publishedDate: '1968-09-01',
              industryIdentifiers: [
                {
                  type: 'ISBN_13',
                  identifier: '9780547773742'
                }
              ],
              imageLinks: {
                thumbnail: 'http://books.google.com/books/content?id=google-volume-1&printsec=frontcover&img=1&zoom=1'
              }
            }
          }
        ]
      };
    }
    };
  };

  try {
    const response = await request(app).get('/api/search/books').query({ q: 'earthsea' });

    assert.equal(response.status, 200);
    assert.equal(requestUrl.searchParams.get('q'), 'earthsea');
    assert.equal(requestUrl.searchParams.get('orderBy'), 'relevance');
    assert.equal(requestUrl.searchParams.get('maxResults'), '20');
    assert.deepEqual(response.body.items, [
      {
        externalSource: 'google_books',
        externalId: 'google-volume-1',
        title: 'A Wizard of Earthsea',
        authors: ['Ursula K. Le Guin'],
        publishedYear: 1968,
        isbn: '9780547773742',
        coverUrl: 'https://books.google.com/books/content?id=google-volume-1&printsec=frontcover&img=1&zoom=1'
      }
    ]);
  } finally {
    global.fetch = originalFetch;
  }
});

test('GET /api/search/books uses precise Google Books ISBN query', async () => {
  const originalFetch = global.fetch;
  let requestUrl;

  global.fetch = async (url) => {
    requestUrl = url;

    return {
      ok: true,
      async json() {
        return {
          items: [
            {
              id: 'matching-isbn',
              volumeInfo: {
                title: 'A Wizard of Earthsea',
                authors: ['Ursula K. Le Guin'],
                industryIdentifiers: [
                  {
                    type: 'ISBN_13',
                    identifier: '9780547773742'
                  }
                ]
              }
            },
            {
              id: 'different-book',
              volumeInfo: {
                title: 'Some Other Book',
                authors: ['Someone Else'],
                industryIdentifiers: [
                  {
                    type: 'ISBN_13',
                    identifier: '9780000000002'
                  }
                ]
              }
            }
          ]
        };
      }
    };
  };

  try {
    const response = await request(app).get('/api/search/books').query({ q: '978-0547773742' });

    assert.equal(response.status, 200);
    assert.equal(requestUrl.searchParams.get('q'), 'isbn:9780547773742');
    assert.equal(requestUrl.searchParams.get('maxResults'), '10');
    assert.equal(response.body.items.length, 1);
    assert.equal(response.body.items[0].externalId, 'matching-isbn');
  } finally {
    global.fetch = originalFetch;
  }
});

test('GET /api/search/books recognizes title by author queries', async () => {
  const originalFetch = global.fetch;
  let requestUrl;

  global.fetch = async (url) => {
    requestUrl = url;

    return {
      ok: true,
      async json() {
        return { items: [] };
      }
    };
  };

  try {
    const response = await request(app).get('/api/search/books').query({ q: 'Dune by Frank Herbert' });

    assert.equal(response.status, 200);
    assert.equal(requestUrl.searchParams.get('q'), 'intitle:"Dune" inauthor:"Frank Herbert"');
  } finally {
    global.fetch = originalFetch;
  }
});

test('GET /api/search/books reranks noisy text results', async () => {
  const originalFetch = global.fetch;

  global.fetch = async () => ({
    ok: true,
    async json() {
      return {
        items: [
          {
            id: 'noisy-result',
            volumeInfo: {
              title: 'The Worlds of Dune',
              authors: ['Library Journal']
            }
          },
          {
            id: 'best-match',
            volumeInfo: {
              title: 'Dune',
              authors: ['Frank Herbert'],
              industryIdentifiers: [
                {
                  type: 'ISBN_13',
                  identifier: '9780441013593'
                }
              ]
            }
          },
          {
            id: 'related-result',
            volumeInfo: {
              title: 'Dune Messiah',
              authors: ['Frank Herbert']
            }
          }
        ]
      };
    }
  });

  try {
    const response = await request(app).get('/api/search/books').query({ q: 'Dune Frank Herbert' });

    assert.equal(response.status, 200);
    assert.deepEqual(
      response.body.items.map((item) => item.externalId),
      ['best-match', 'related-result', 'noisy-result']
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('local collection CRUD flow works end to end', async () => {
  const createResponse = await request(app)
    .post('/api/books')
    .send({
      externalSource: 'google_books',
      externalId: 'google-dune-id',
      title: 'Dune',
      authors: ['Frank Herbert'],
      publishedYear: 1965,
      isbn: '9780441172719',
      coverUrl: null,
      status: 'wishlist',
      notes: 'Classic sci-fi'
    });

  assert.equal(createResponse.status, 201);
  assert.equal(createResponse.body.item.title, 'Dune');
  assert.deepEqual(createResponse.body.item.authors, ['Frank Herbert']);

  const duplicateResponse = await request(app)
    .post('/api/books')
    .send({
      externalSource: 'google_books',
      externalId: 'google-dune-id',
      title: 'Dune',
      authors: ['Frank Herbert']
    });

  assert.equal(duplicateResponse.status, 409);

  const listResponse = await request(app).get('/api/books').query({ status: 'wishlist', q: 'Dune' });

  assert.equal(listResponse.status, 200);
  assert.equal(listResponse.body.items.length, 1);

  const savedId = createResponse.body.item.id;

  const detailResponse = await request(app).get(`/api/books/${savedId}`);

  assert.equal(detailResponse.status, 200);
  assert.equal(detailResponse.body.item.id, savedId);
  assert.equal(detailResponse.body.item.title, 'Dune');

  const updateResponse = await request(app)
    .patch(`/api/books/${savedId}`)
    .send({ status: 'reading', notes: 'Halfway through' });

  assert.equal(updateResponse.status, 200);
  assert.equal(updateResponse.body.item.status, 'reading');
  assert.equal(updateResponse.body.item.notes, 'Halfway through');

  const deleteResponse = await request(app).delete(`/api/books/${savedId}`);

  assert.equal(deleteResponse.status, 204);

  const finalListResponse = await request(app).get('/api/books');

  assert.equal(finalListResponse.status, 200);
  assert.equal(finalListResponse.body.items.length, 0);
});

test('GET /api/books/:id returns 404 when the book does not exist', async () => {
  const response = await request(app).get('/api/books/9999');

  assert.equal(response.status, 404);
  assert.equal(response.body.error.message, 'Book not found');
});
