import test from 'node:test';
import assert from 'node:assert/strict';

import { buildHash, normalizeHash } from '../../frontend/js/router.js';
import { formatAuthors, formatYear, formatIsbn, statusLabel } from '../../frontend/js/shared/formatters.js';
import { getCounts } from '../../frontend/js/views/homeView.js';
import { normalizeStatus, groupByStatus } from '../../frontend/js/views/libraryView.js';
import { getBook, getBooks, removeBook, saveBook, searchBooks, updateBook } from '../../frontend/js/shared/api.js';

test('formatters handle empty and known values', () => {
  assert.equal(formatAuthors(['Frank Herbert', 'Brian Herbert']), 'Frank Herbert, Brian Herbert');
  assert.equal(formatAuthors([]), 'Unknown author');
  assert.equal(formatYear('1965'), '1965');
  assert.equal(formatYear(''), 'Year unknown');
  assert.equal(formatIsbn('9780441172719'), '9780441172719');
  assert.equal(formatIsbn(null), 'ISBN unavailable');
  assert.equal(statusLabel('to_read'), 'To read');
  assert.equal(statusLabel('custom'), 'custom');
});

test('normalizeHash enforces slash-prefixed routes', () => {
  assert.equal(normalizeHash(''), '/');
  assert.equal(normalizeHash('#'), '/');
  assert.equal(normalizeHash('#/library'), '/library');
  assert.equal(normalizeHash('search?q=dune'), '/search?q=dune');
});

test('buildHash normalizes path and drops empty query values', () => {
  assert.equal(buildHash('/library'), '#/library');
  assert.equal(buildHash('search', { q: 'dune', status: 'reading' }), '#/search?q=dune&status=reading');
  assert.equal(buildHash('/library', { q: ' ', status: 'all', page: null }), '#/library');
});

test('getCounts returns zero-based status summary', () => {
  const counts = getCounts([
    { status: 'wishlist' },
    { status: 'reading' },
    { status: 'reading' },
    { status: 'read' }
  ]);

  assert.deepEqual(counts, {
    wishlist: 1,
    to_read: 0,
    reading: 2,
    read: 1
  });
});

test('normalizeStatus accepts known statuses and falls back to all', () => {
  assert.equal(normalizeStatus('reading'), 'reading');
  assert.equal(normalizeStatus('all'), 'all');
  assert.equal(normalizeStatus('unknown'), 'all');
  assert.equal(normalizeStatus(undefined), 'all');
});

test('groupByStatus partitions books into known buckets', () => {
  const books = [
    { id: 1, status: 'wishlist' },
    { id: 2, status: 'reading' },
    { id: 3, status: 'reading' },
    { id: 4, status: 'read' }
  ];

  assert.deepEqual(groupByStatus(books), {
    wishlist: [{ id: 1, status: 'wishlist' }],
    to_read: [],
    reading: [
      { id: 2, status: 'reading' },
      { id: 3, status: 'reading' }
    ],
    read: [{ id: 4, status: 'read' }]
  });
});

test('api helpers build expected requests', async () => {
  const calls = [];

  global.fetch = async (path, options = {}) => {
    calls.push({ path, options });

    return {
      ok: true,
      status: options.method === 'DELETE' ? 204 : 200,
      json: async () => ({ ok: true })
    };
  };

  await searchBooks('dune messiah');
  await getBooks({ q: 'frank herbert', status: 'reading' });
  await getBooks({ q: '', status: 'all' });
  await getBook(7);
  await saveBook({ title: 'Dune' });
  await updateBook(7, { status: 'read' });
  await removeBook(7);

  assert.deepEqual(calls, [
    {
      path: '/api/search/books?q=dune%20messiah',
      options: {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    },
    {
      path: '/api/books?q=frank+herbert&status=reading',
      options: {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    },
    {
      path: '/api/books',
      options: {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    },
    {
      path: '/api/books/7',
      options: {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    },
    {
      path: '/api/books',
      options: {
        method: 'POST',
        body: JSON.stringify({ title: 'Dune' }),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    },
    {
      path: '/api/books/7',
      options: {
        method: 'PATCH',
        body: JSON.stringify({ status: 'read' }),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    },
    {
      path: '/api/books/7',
      options: {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    }
  ]);
});
