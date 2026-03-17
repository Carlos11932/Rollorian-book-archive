const prisma = require('../../lib/prisma');
const HttpError = require('../../lib/httpError');
const { mapBookRecord, serializeAuthors } = require('./bookMappers');

const VALID_STATUSES = new Set(['wishlist', 'to_read', 'reading', 'read']);

function parseId(rawId) {
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'Book id must be a positive integer');
  }

  return id;
}

function normalizeOptionalString(value) {
  if (value == null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function validateStatus(status) {
  if (!VALID_STATUSES.has(status)) {
    throw new HttpError(400, 'Status must be one of wishlist, to_read, reading, or read');
  }

  return status;
}

function buildCreatePayload(payload) {
  const externalSource = normalizeOptionalString(payload.externalSource);
  const externalId = normalizeOptionalString(payload.externalId);
  const title = normalizeOptionalString(payload.title);
  const status = payload.status ? validateStatus(String(payload.status)) : 'wishlist';
  const notes = payload.notes == null ? '' : String(payload.notes);
  const publishedYear = payload.publishedYear == null || payload.publishedYear === ''
    ? null
    : Number(payload.publishedYear);

  if (!externalSource || !externalId || !title) {
    throw new HttpError(400, 'externalSource, externalId, and title are required');
  }

  if (publishedYear != null && !Number.isInteger(publishedYear)) {
    throw new HttpError(400, 'publishedYear must be an integer when provided');
  }

  return {
    externalSource,
    externalId,
    title,
    authors: serializeAuthors(payload.authors),
    publishedYear,
    isbn: normalizeOptionalString(payload.isbn),
    coverUrl: normalizeOptionalString(payload.coverUrl),
    status,
    notes
  };
}

async function listBooks(filters) {
  const where = {};

  if (filters.status && filters.status !== 'all') {
    where.status = validateStatus(String(filters.status));
  }

  if (filters.q) {
    where.title = {
      contains: String(filters.q).trim()
    };
  }

  const books = await prisma.book.findMany({
    where,
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }]
  });

  return books.map(mapBookRecord);
}

async function getBook(rawId) {
  const id = parseId(rawId);
  const book = await prisma.book.findUnique({ where: { id } });

  if (!book) {
    throw new HttpError(404, 'Book not found');
  }

  return mapBookRecord(book);
}

async function createBook(payload) {
  const data = buildCreatePayload(payload || {});

  const existing = await prisma.book.findUnique({
    where: {
      externalSource_externalId: {
        externalSource: data.externalSource,
        externalId: data.externalId
      }
    }
  });

  if (existing) {
    throw new HttpError(409, 'This book is already in your collection');
  }

  const book = await prisma.book.create({ data });
  return mapBookRecord(book);
}

async function updateBook(rawId, payload) {
  const id = parseId(rawId);
  const data = {};

  if (payload.status !== undefined) {
    data.status = validateStatus(String(payload.status));
  }

  if (payload.notes !== undefined) {
    data.notes = String(payload.notes);
  }

  if (Object.keys(data).length === 0) {
    throw new HttpError(400, 'At least one mutable field is required');
  }

  try {
    const book = await prisma.book.update({
      where: { id },
      data
    });

    return mapBookRecord(book);
  } catch (error) {
    if (error.code === 'P2025') {
      throw new HttpError(404, 'Book not found');
    }

    throw error;
  }
}

async function deleteBook(rawId) {
  const id = parseId(rawId);

  try {
    await prisma.book.delete({ where: { id } });
  } catch (error) {
    if (error.code === 'P2025') {
      throw new HttpError(404, 'Book not found');
    }

    throw error;
  }
}

module.exports = {
  getBook,
  listBooks,
  createBook,
  updateBook,
  deleteBook,
  VALID_STATUSES: Array.from(VALID_STATUSES)
};
