import express from 'express';
import {
  getProfile,
  updateProfile,
  toggleSavedDestination,
  deleteAccount,
} from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // Enforce authentication

router.route('/')
  .get(getProfile)
  .put(updateProfile);

router.post('/saved-destinations', toggleSavedDestination);
router.delete('/account', deleteAccount);

export default router;
