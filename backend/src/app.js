const express = require('express');
const path = require('path');

const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
const frontendDir = path.resolve(__dirname, '../../frontend');

app.use(express.json());
app.use('/api', routes);
app.use(express.static(frontendDir));

app.get('/', (request, response) => {
  response.sendFile(path.join(frontendDir, 'index.html'));
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
