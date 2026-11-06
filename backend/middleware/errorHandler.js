const notFound = (req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e) => e.message).join(', ');
    return res.status(400).json({ error: message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate record' });
  }

  const status = err.status || 500;
  if (status >= 500) console.error(`[${req.method} ${req.originalUrl}]`, err);
  return res.status(status).json({ error: status >= 500 ? 'Internal server error' : err.message });
};

module.exports = { notFound, errorHandler };
