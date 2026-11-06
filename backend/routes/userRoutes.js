const express = require('express');
const { getUsers, freezeUser } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../utils/httpError');

const router = express.Router();

router.use(protect, adminOnly);
router.get('/', asyncHandler(getUsers));
router.put('/:id/freeze', asyncHandler(freezeUser));

module.exports = router;
