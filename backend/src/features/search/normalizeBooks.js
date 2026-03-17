function buildCoverUrl(imageLinks) {
  if (!imageLinks) {
    return null;
  }

  const rawUrl = imageLinks.thumbnail || imageLinks.smallThumbnail || null;

  if (!rawUrl) {
    return null;
  }

  return rawUrl.replace('http://', 'https://');
}

function selectIndustryIdentifier(identifiers, preferredType) {
  if (!Array.isArray(identifiers)) {
    return null;
  }

  const match = identifiers.find((identifier) => identifier?.type === preferredType && identifier.identifier);
  return match ? match.identifier : null;
}

function extractPublishedYear(publishedDate) {
  if (typeof publishedDate !== 'string') {
    return null;
  }

  const match = publishedDate.match(/^(\d{4})/);
  return match ? Number(match[1]) : null;
}

function normalizeBook(item) {
  const volumeInfo = item.volumeInfo || {};
  const externalId = item.id || selectIndustryIdentifier(volumeInfo.industryIdentifiers, 'ISBN_13');
  const isbn13 = selectIndustryIdentifier(volumeInfo.industryIdentifiers, 'ISBN_13');
  const isbn10 = selectIndustryIdentifier(volumeInfo.industryIdentifiers, 'ISBN_10');

  return {
    externalSource: 'google_books',
    externalId: externalId || `fallback-${volumeInfo.title || 'unknown'}`,
    title: volumeInfo.title || 'Untitled',
    authors: Array.isArray(volumeInfo.authors) ? volumeInfo.authors.filter(Boolean) : [],
    publishedYear: extractPublishedYear(volumeInfo.publishedDate),
    isbn: isbn13 || isbn10,
    coverUrl: buildCoverUrl(volumeInfo.imageLinks)
  };
}

function normalizeSearchResults(docs) {
  return docs.map(normalizeBook);
}

module.exports = {
  normalizeSearchResults
};
