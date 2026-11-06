const express = require('express');
const { getStats } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../utils/httpError');

const router = express.Router();

router.get('/stats', protect, adminOnly, asyncHandler(getStats));

module.exports = router;
