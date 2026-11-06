const express = require('express');
const { login, register, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../utils/httpError');
const { rateLimit } = require('../utils/rateLimit');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many attempts. Please wait a few minutes and try again.',
});

router.post('/login', authLimiter, asyncHandler(login));
router.post('/register', authLimiter, asyncHandler(register));
router.get('/me', protect, asyncHandler(getMe));

module.exports = router;
