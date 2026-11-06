const express = require('express');
const { getMyTransactions, getAllTransactions } = require('../controllers/historyController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../utils/httpError');

const router = express.Router();

router.use(protect);
router.get('/transactions/my', asyncHandler(getMyTransactions));
router.get('/transactions/all', adminOnly, asyncHandler(getAllTransactions));

module.exports = router;
