import express from 'express';
import { getItinerary, updateActivity } from '../controllers/itineraryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect); // Enforce authentication

router.get('/itinerary', getItinerary);
router.put('/activities/:activityId', updateActivity);

export default router;
