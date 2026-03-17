const express = require('express');

const router = express.Router();

router.get('/', (request, response) => {
  response.json({ status: 'ok' });
});

module.exports = router;
