import express from 'express';
import { getAdminAnalytics, updateUserRole } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // Enforce authentication

router.get('/analytics', getAdminAnalytics);
router.put('/users/:userId/role', updateUserRole);

export default router;
