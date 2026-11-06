const express = require('express');
const {
  raiseDispute, resolveDispute, getAllDisputes, getMyDisputes, cancelJob,
} = require('../controllers/disputeController');
const { protect, adminOnly, requireRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../utils/httpError');

const router = express.Router();

router.use(protect);
router.get('/', adminOnly, asyncHandler(getAllDisputes));
router.get('/my', asyncHandler(getMyDisputes));
router.post('/raise', requireRole('Client', 'Freelancer'), asyncHandler(raiseDispute));
router.post('/resolve', adminOnly, asyncHandler(resolveDispute));
router.post('/cancel', requireRole('Client'), asyncHandler(cancelJob));

module.exports = router;
