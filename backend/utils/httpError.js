const { randomUUID } = require('crypto');

const newId = () => randomUUID();

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { newId, HttpError, asyncHandler };
