function buildCoverUrl(coverId) {
  if (!coverId) {
    return null;
  }

  return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
}

function normalizeBook(doc) {
  const externalId = doc.key || doc.cover_edition_key || doc.edition_key?.[0] || doc.isbn?.[0];

  return {
    externalSource: 'open_library',
    externalId: externalId || `fallback-${doc.title || 'unknown'}`,
    title: doc.title || 'Untitled',
    authors: Array.isArray(doc.author_name) ? doc.author_name.filter(Boolean) : [],
    publishedYear: Number.isInteger(doc.first_publish_year) ? doc.first_publish_year : null,
    isbn: Array.isArray(doc.isbn) && doc.isbn.length > 0 ? doc.isbn[0] : null,
    coverUrl: buildCoverUrl(doc.cover_i)
  };
}

function normalizeSearchResults(docs) {
  return docs.map(normalizeBook);
}

module.exports = {
  normalizeSearchResults
};
