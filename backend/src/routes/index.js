const express = require('express');

const healthRoutes = require('./healthRoutes');
const searchRoutes = require('./searchRoutes');
const bookRoutes = require('./bookRoutes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/search', searchRoutes);
router.use('/books', bookRoutes);

module.exports = router;
