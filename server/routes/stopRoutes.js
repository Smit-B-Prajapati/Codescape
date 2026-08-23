import express from 'express';
import {
  addStop,
  getStopsByTrip,
  updateStop,
  deleteStop,
  reorderStops,
} from '../controllers/stopController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect); // Enforce authentication

router.route('/')
  .post(addStop)
  .get(getStopsByTrip);

router.put('/reorder', reorderStops);

router.route('/:stopId')
  .put(updateStop)
  .delete(deleteStop);

export default router;
