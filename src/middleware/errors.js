function notFound(req, res) {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.originalUrl}` } });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = err.status || 500;
  let message = err.message || 'Internal server error';

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((item) => item.message).join(', ');
  } else if (err.name === 'CastError' || err.name === 'StrictModeError') {
    status = 400;
    message = 'Invalid request data';
  } else if (err.code === 11000) {
    status = 409;
    message = 'A check-in already exists for this habit and date';
  }

  if (status >= 500) console.error(err);
  res.status(status).json({ error: { message } });
}

module.exports = { notFound, errorHandler };
