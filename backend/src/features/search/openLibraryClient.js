const HttpError = require('../../lib/httpError');

const OPEN_LIBRARY_URL = 'https://openlibrary.org/search.json';
const SEARCH_LIMIT = 10;

async function fetchBooks(query) {
  const url = new URL(OPEN_LIBRARY_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', String(SEARCH_LIMIT));

  let response;

  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/json'
      }
    });
  } catch (error) {
    throw new HttpError(502, 'Failed to reach Open Library', error.message);
  }

  if (!response.ok) {
    throw new HttpError(502, 'Open Library request failed', `Status ${response.status}`);
  }

  const payload = await response.json();
  return Array.isArray(payload.docs) ? payload.docs : [];
}

module.exports = {
  fetchBooks
};
