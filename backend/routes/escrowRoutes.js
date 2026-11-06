const express = require('express');
const { fundEscrow, getEscrows, getMyEscrows, submitWork, approveWork } = require('../controllers/escrowController');
const { protect, adminOnly, requireRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../utils/httpError');

const router = express.Router();

router.use(protect);
router.post('/fund', requireRole('Client'), asyncHandler(fundEscrow));
router.post('/submit', requireRole('Freelancer'), asyncHandler(submitWork));
router.post('/approve', requireRole('Client'), asyncHandler(approveWork));
router.get('/my', asyncHandler(getMyEscrows));
router.get('/', adminOnly, asyncHandler(getEscrows));

module.exports = router;
