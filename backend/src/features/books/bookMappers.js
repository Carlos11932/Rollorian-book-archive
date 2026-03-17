function serializeAuthors(authors) {
  if (!Array.isArray(authors) || authors.length === 0) {
    return '';
  }

  return authors
    .map((author) => String(author || '').trim())
    .filter(Boolean)
    .join(' | ');
}

function deserializeAuthors(authors) {
  if (!authors) {
    return [];
  }

  return String(authors)
    .split('|')
    .map((author) => author.trim())
    .filter(Boolean);
}

function mapBookRecord(record) {
  return {
    id: record.id,
    externalSource: record.externalSource,
    externalId: record.externalId,
    title: record.title,
    authors: deserializeAuthors(record.authors),
    publishedYear: record.publishedYear,
    isbn: record.isbn,
    coverUrl: record.coverUrl,
    status: record.status,
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

module.exports = {
  serializeAuthors,
  mapBookRecord
};
