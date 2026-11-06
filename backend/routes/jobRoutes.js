const express = require('express');
const {
  getJobs, getMyJobs, getAppliedJobs, createJob, updateJob, deleteJob,
  applyJob, acceptApplicant, toggleWishlist, getWishlist,
} = require('../controllers/jobController');
const { protect, requireRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../utils/httpError');

const router = express.Router();
const client = requireRole('Client');
const freelancer = requireRole('Freelancer');

router.use(protect);

// Static paths first so they aren't captured by /:id
router.get('/wishlist', freelancer, asyncHandler(getWishlist));
router.post('/wishlist', freelancer, asyncHandler(toggleWishlist));
router.get('/applied', freelancer, asyncHandler(getAppliedJobs));
router.get('/myjobs', client, asyncHandler(getMyJobs));

router.get('/', freelancer, asyncHandler(getJobs));
router.post('/', client, asyncHandler(createJob));

router.post('/:id/apply', freelancer, asyncHandler(applyJob));
router.post('/:id/accept', client, asyncHandler(acceptApplicant));
router.put('/:id', requireRole('Client', 'Admin'), asyncHandler(updateJob));
router.delete('/:id', requireRole('Client', 'Admin'), asyncHandler(deleteJob));

module.exports = router;
