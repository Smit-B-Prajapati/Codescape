import express from 'express';
import { getAiServiceStatus } from '../services/aiService.js';

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Health check endpoint to verify backend service and AI status
 * @access  Public
 */
router.get('/', (req, res) => {
  const aiStatus = getAiServiceStatus();

  res.status(200).json({
    success: true,
    message: 'GlobeTrotter Backend Service is running smoothly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    aiService: aiStatus,
  });
});

export default router;

