const HttpError = require('../../lib/httpError');

const GOOGLE_BOOKS_URL = 'https://www.googleapis.com/books/v1/volumes';
const SEARCH_LIMIT = 10;

async function fetchBooks(query) {
  const url = new URL(GOOGLE_BOOKS_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('maxResults', String(SEARCH_LIMIT));
  url.searchParams.set('printType', 'books');

  if (process.env.GOOGLE_BOOKS_API_KEY) {
    url.searchParams.set('key', process.env.GOOGLE_BOOKS_API_KEY);
  }

  let response;

  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/json'
      }
    });
  } catch (error) {
    throw new HttpError(502, 'Failed to reach Google Books', error.message);
  }

  if (!response.ok) {
    throw new HttpError(502, 'Google Books request failed', `Status ${response.status}`);
  }

  const payload = await response.json();
  return Array.isArray(payload.items) ? payload.items : [];
}

module.exports = {
  fetchBooks
};
