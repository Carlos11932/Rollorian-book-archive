const express = require('express');

const handleAsync = require('../lib/handleAsync');
const {
  listBooks,
  createBook,
  updateBook,
  deleteBook
} = require('../features/books/bookService');

const router = express.Router();

router.get(
  '/',
  handleAsync(async (request, response) => {
    const books = await listBooks({ status: request.query.status, q: request.query.q });
    response.json({ items: books });
  })
);

router.post(
  '/',
  handleAsync(async (request, response) => {
    const book = await createBook(request.body);
    response.status(201).json({ item: book });
  })
);

router.patch(
  '/:id',
  handleAsync(async (request, response) => {
    const book = await updateBook(request.params.id, request.body);
    response.json({ item: book });
  })
);

router.delete(
  '/:id',
  handleAsync(async (request, response) => {
    await deleteBook(request.params.id);
    response.status(204).send();
  })
);

module.exports = router;
