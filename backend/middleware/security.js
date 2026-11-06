// Rejects request bodies / query strings containing MongoDB operators
// (keys starting with "$" or containing "."), e.g. {"escrowId": {"$ne": null}}.
const hasOperatorKey = (value, depth = 0) => {
  if (depth > 10 || value === null || typeof value !== 'object') return false;
  return Object.keys(value).some(
    (key) => key.startsWith('$') || key.includes('.') || hasOperatorKey(value[key], depth + 1)
  );
};

const blockOperatorInjection = (req, res, next) => {
  if (hasOperatorKey(req.body) || hasOperatorKey(req.query) || hasOperatorKey(req.params)) {
    return res.status(400).json({ error: 'Invalid characters in request' });
  }
  return next();
};

module.exports = { blockOperatorInjection };
