const express = require('express');
const { sendMessage, getConversation, getConversations } = require('../controllers/messageController');
const { protect, requireRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../utils/httpError');

const router = express.Router();

router.use(protect, requireRole('Client', 'Freelancer'));
router.get('/conversations', asyncHandler(getConversations));
router.post('/send', asyncHandler(sendMessage));
router.get('/:jobId/:userId', asyncHandler(getConversation));

module.exports = router;
