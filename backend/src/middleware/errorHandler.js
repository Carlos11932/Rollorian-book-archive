const HttpError = require('../lib/httpError');

function notFoundHandler(request, response, next) {
  next(new HttpError(404, `Route not found: ${request.method} ${request.originalUrl}`));
}

function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    next(error);
    return;
  }

  const status = error.status || 500;
  const message = status >= 500 ? 'Internal server error' : error.message;

  if (status >= 500) {
    console.error(error);
  }

  response.status(status).json({
    error: {
      message,
      details: error.details || null
    }
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
