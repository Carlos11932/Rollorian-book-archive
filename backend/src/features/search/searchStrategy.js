const RESULT_LIMIT = 10;
const PROVIDER_LIMIT = 20;

function sanitizeQuery(rawQuery) {
  return String(rawQuery || '').trim().replace(/\s+/g, ' ');
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenize(value) {
  return normalizeText(value)
    .split(/\s+/)
    .filter((token) => token.length >= 2 && token !== 'by');
}

function isValidIsbn10(isbn) {
  if (!/^\d{9}[\dX]$/.test(isbn)) {
    return false;
  }

  const checksum = isbn.split('').reduce((total, character, index) => {
    const value = character === 'X' ? 10 : Number(character);
    return total + value * (10 - index);
  }, 0);

  return checksum % 11 === 0;
}

function isValidIsbn13(isbn) {
  if (!/^\d{13}$/.test(isbn)) {
    return false;
  }

  const checksum = isbn.split('').reduce((total, character, index) => {
    const weight = index % 2 === 0 ? 1 : 3;
    return total + Number(character) * weight;
  }, 0);

  return checksum % 10 === 0;
}

function detectIsbn(query) {
  const compact = query.replace(/[^0-9X]/gi, '').toUpperCase();

  if (compact.length === 10 && isValidIsbn10(compact)) {
    return compact;
  }

  if (compact.length === 13 && isValidIsbn13(compact)) {
    return compact;
  }

  return null;
}

function extractTitleAuthor(query) {
  const match = query.match(/^(.+?)\s+by\s+(.+)$/i);

  if (!match) {
    return null;
  }

  const title = sanitizeQuery(match[1]);
  const author = sanitizeQuery(match[2]);

  if (title.length < 2 || author.length < 2) {
    return null;
  }

  return { title, author };
}

function buildGoogleBooksQuery(analysis) {
  if (analysis.kind === 'isbn') {
    return `isbn:${analysis.isbn}`;
  }

  if (analysis.kind === 'title-author') {
    return `intitle:"${analysis.title}" inauthor:"${analysis.author}"`;
  }

  return analysis.query;
}

function analyzeQuery(rawQuery) {
  const query = sanitizeQuery(rawQuery);
  const isbn = detectIsbn(query);

  if (isbn) {
    return {
      kind: 'isbn',
      query,
      isbn,
      googleQuery: `isbn:${isbn}`,
      providerMaxResults: RESULT_LIMIT,
      tokens: [isbn],
      normalizedQuery: normalizeText(query)
    };
  }

  const titleAuthor = extractTitleAuthor(query);

  if (titleAuthor) {
    return {
      kind: 'title-author',
      query,
      title: titleAuthor.title,
      author: titleAuthor.author,
      googleQuery: buildGoogleBooksQuery({ kind: 'title-author', ...titleAuthor }),
      providerMaxResults: PROVIDER_LIMIT,
      tokens: tokenize(query),
      titleTokens: tokenize(titleAuthor.title),
      authorTokens: tokenize(titleAuthor.author),
      normalizedQuery: normalizeText(query),
      normalizedTitle: normalizeText(titleAuthor.title),
      normalizedAuthor: normalizeText(titleAuthor.author)
    };
  }

  return {
    kind: 'text',
    query,
    googleQuery: query,
    providerMaxResults: PROVIDER_LIMIT,
    tokens: tokenize(query),
    normalizedQuery: normalizeText(query)
  };
}

function countTokenMatches(tokens, text) {
  return tokens.reduce((count, token) => count + (text.includes(token) ? 1 : 0), 0);
}

function scoreBook(book, analysis) {
  const title = normalizeText(book.title);
  const authors = normalizeText((book.authors || []).join(' '));
  const isbn = String(book.isbn || '').replace(/[^0-9X]/gi, '').toUpperCase();

  if (analysis.kind === 'isbn') {
    return isbn === analysis.isbn ? 500 : -100;
  }

  let score = 0;
  const totalText = `${title} ${authors}`.trim();

  if (title === analysis.normalizedQuery) {
    score += 120;
  } else if (title.startsWith(analysis.normalizedQuery)) {
    score += 90;
  } else if (title.includes(analysis.normalizedQuery)) {
    score += 70;
  }

  if (authors.includes(analysis.normalizedQuery)) {
    score += 40;
  }

  const titleMatches = countTokenMatches(analysis.tokens, title);
  const authorMatches = countTokenMatches(analysis.tokens, authors);
  const totalMatches = countTokenMatches(analysis.tokens, totalText);

  score += titleMatches * 18;
  score += authorMatches * 12;

  if (analysis.tokens.length > 1 && totalMatches === analysis.tokens.length) {
    score += 35;
  }

  if (analysis.kind === 'title-author') {
    if (title === analysis.normalizedTitle) {
      score += 140;
    }

    if (title.includes(analysis.normalizedTitle)) {
      score += 80;
    }

    if (authors.includes(analysis.normalizedAuthor)) {
      score += 60;
    }

    if (analysis.titleTokens.length > 0 && countTokenMatches(analysis.titleTokens, title) === analysis.titleTokens.length) {
      score += 30;
    }

    if (analysis.authorTokens.length > 0 && countTokenMatches(analysis.authorTokens, authors) === analysis.authorTokens.length) {
      score += 25;
    }
  }

  if (score === 0) {
    score = -10;
  }

  return score;
}

function rankSearchResults(results, analysis) {
  const ranked = results
    .map((book, index) => ({ book, index, score: scoreBook(book, analysis) }))
    .sort((left, right) => right.score - left.score || left.index - right.index);

  if (analysis.kind === 'isbn') {
    const exactMatches = ranked.filter((entry) => entry.score > 0).map((entry) => entry.book);
    return exactMatches.slice(0, RESULT_LIMIT);
  }

  const positiveMatches = ranked.filter((entry) => entry.score > 0).map((entry) => entry.book);
  const selected = positiveMatches.length > 0 ? positiveMatches : ranked.map((entry) => entry.book);

  return selected.slice(0, RESULT_LIMIT);
}

module.exports = {
  analyzeQuery,
  rankSearchResults,
  RESULT_LIMIT,
  PROVIDER_LIMIT
};
