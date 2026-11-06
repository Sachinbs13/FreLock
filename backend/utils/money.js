const { HttpError } = require('./httpError');

const CURRENCY = 'INR';
const MAX_AMOUNT = 10_000_000; // ₹1 crore per operation — sanity cap for the demo

// Parses a rupee amount, rounds to paise, and enforces bounds.
const parseAmount = (value, { min = 1, max = MAX_AMOUNT, field = 'Amount' } = {}) => {
  const num = Number(value);
  if (!Number.isFinite(num)) throw new HttpError(400, `${field} must be a number`);
  const rounded = Math.round(num * 100) / 100;
  if (rounded < min) throw new HttpError(400, `${field} must be at least ₹${min.toLocaleString('en-IN')}`);
  if (rounded > max) throw new HttpError(400, `${field} cannot exceed ₹${max.toLocaleString('en-IN')}`);
  return rounded;
};

const formatINR = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

module.exports = { CURRENCY, MAX_AMOUNT, parseAmount, formatINR };
