const HttpError = require('../../lib/httpError');
const { fetchBooks } = require('./googleBooksClient');
const { normalizeSearchResults } = require('./normalizeBooks');

async function searchBooks(rawQuery) {
  const query = String(rawQuery || '').trim();

  if (query.length < 2) {
    throw new HttpError(400, 'A valid query with at least 2 characters is required');
  }

  const docs = await fetchBooks(query);
  return normalizeSearchResults(docs);
}

module.exports = {
  searchBooks
};
