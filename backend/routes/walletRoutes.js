const express = require('express');
const { getWallets, getMyWallet, assignBalance, setupPin, addMoney } = require('../controllers/walletController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../utils/httpError');

const router = express.Router();

router.use(protect);
router.get('/', adminOnly, asyncHandler(getWallets));
router.get('/me', asyncHandler(getMyWallet));
router.post('/setup-pin', asyncHandler(setupPin));
router.post('/add-money', asyncHandler(addMoney));
router.post('/assign', adminOnly, asyncHandler(assignBalance));

module.exports = router;
