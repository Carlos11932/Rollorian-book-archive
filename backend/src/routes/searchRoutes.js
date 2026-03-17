const express = require('express');

const handleAsync = require('../lib/handleAsync');
const { searchBooks } = require('../features/search/searchService');

const router = express.Router();

router.get(
  '/books',
  handleAsync(async (request, response) => {
    const results = await searchBooks(request.query.q);
    response.json({ items: results });
  })
);

module.exports = router;
