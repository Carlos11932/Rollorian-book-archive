const HttpError = require('../../lib/httpError');
const { fetchBooks } = require('./googleBooksClient');
const { normalizeSearchResults } = require('./normalizeBooks');
const { analyzeQuery, rankSearchResults } = require('./searchStrategy');

async function searchBooks(rawQuery) {
  const query = String(rawQuery || '').trim();

  if (query.length < 2) {
    throw new HttpError(400, 'A valid query with at least 2 characters is required');
  }

  const analysis = analyzeQuery(query);
  const docs = await fetchBooks(analysis.googleQuery, {
    maxResults: analysis.providerMaxResults
  });

  return rankSearchResults(normalizeSearchResults(docs), analysis);
}

module.exports = {
  searchBooks
};
