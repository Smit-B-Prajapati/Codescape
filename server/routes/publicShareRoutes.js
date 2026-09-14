import express from 'express';
import {
  toggleTripShare,
  getPublicTripBySlug,
  copyPublicTrip,
} from '../controllers/publicShareController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Read-Only Route
router.get('/public/:slug', getPublicTripBySlug);

// Protected Routes
router.put('/:id/share', protect, toggleTripShare);
router.post('/public/:slug/copy', protect, copyPublicTrip);

export default router;
