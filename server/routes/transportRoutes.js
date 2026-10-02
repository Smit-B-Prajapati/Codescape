import express from 'express';
import { searchTransport } from '../services/transportService.js';
import { DEMO_TRAINS } from '../data/trains.js';

const router = express.Router();

/**
 * @route   GET /api/transport/search
 * @desc    Search simulated demo trains with parameters
 * @access  Public
 */
router.get('/search', async (req, res) => {
  try {
    const { from, to, date, travelers, preference } = req.query;
    const result = await searchTransport({
      from,
      to,
      date,
      travelers: travelers ? parseInt(travelers, 10) : 1,
      preference,
    });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      isDemo: true,
      notice: 'DEMO TRANSPORT DATA',
      message: 'Failed to search demo transport options',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/transport/search
 * @desc    Search simulated demo trains via request body
 * @access  Public
 */
router.post('/search', async (req, res) => {
  try {
    const { from, to, date, travelers, preference } = req.body || {};
    const result = await searchTransport({
      from,
      to,
      date,
      travelers: travelers ? parseInt(travelers, 10) : 1,
      preference,
    });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      isDemo: true,
      notice: 'DEMO TRANSPORT DATA',
      message: 'Failed to search demo transport options',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/transport/routes
 * @desc    Get summary of available demo train routes
 * @access  Public
 */
router.get('/routes', (req, res) => {
  const routes = [
    { from: 'Vadodara', to: 'Goa / Madgaon' },
    { from: 'Mumbai', to: 'Goa / Madgaon' },
    { from: 'Ahmedabad', to: 'Goa / Madgaon' },
    { from: 'Mumbai', to: 'Jaipur' },
    { from: 'Delhi', to: 'Jaipur' },
    { from: 'Mumbai', to: 'Delhi' },
  ];

  return res.json({
    success: true,
    isDemo: true,
    notice: 'DEMO TRANSPORT DATA',
    disclaimer: 'DEMO TRANSPORT DATA: Simulated hackathon dataset. Not connected to IRCTC.',
    totalTrains: DEMO_TRAINS.length,
    keyRoutes: routes,
  });
});

export default router;
