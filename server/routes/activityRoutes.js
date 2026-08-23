import express from 'express';
import {
  getActivityCatalog,
  addActivityToStop,
  getActivitiesByTrip,
  deleteActivity,
} from '../controllers/activityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Catalog Discovery Route
router.get('/catalog', getActivityCatalog);

// Trip Specific Activity Routes
router.get('/trip/:tripId', protect, getActivitiesByTrip);
router.post('/trip/:tripId/stop/:stopId', protect, addActivityToStop);
router.delete('/trip/:tripId/activity/:activityId', protect, deleteActivity);

export default router;
