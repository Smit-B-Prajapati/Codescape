import express from 'express';
import {
  parseTripRequirements,
  planTripWithAgent,
  approveTripPlan,
} from '../controllers/agentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce authentication for all agent operations
router.use(protect);

// @route   POST /api/agent/parse
// @desc    Extract structured trip requirements from user's message
// @access  Private
router.post('/parse', parseTripRequirements);

// @route   POST /api/agent/plan
// @desc    Run Agent Orchestrator to generate proposed trip plan
// @access  Private
router.post('/plan', planTripWithAgent);

// @route   POST /api/agent/approve
// @desc    Approve validated AI trip proposal and persist to Trip, Stop, Activity models
// @access  Private
router.post('/approve', approveTripPlan);

export default router;

