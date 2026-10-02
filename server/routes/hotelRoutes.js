import express from 'express';
import { searchHotels } from '../services/hotelService.js';
import { DEMO_HOTELS } from '../data/hotels.js';

const router = express.Router();

/**
 * @route   GET /api/hotels/search
 * @desc    Search simulated demo hotels with parameters
 * @access  Public
 */
router.get('/search', async (req, res) => {
  try {
    const { city, checkIn, checkOut, travelers, budgetPerNight, preference } = req.query;
    const result = await searchHotels({
      city,
      checkIn,
      checkOut,
      travelers: travelers ? parseInt(travelers, 10) : 1,
      budgetPerNight: budgetPerNight ? Number(budgetPerNight) : null,
      preference,
    });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      isDemo: true,
      notice: 'DEMO HOTEL DATA',
      message: 'Failed to search demo hotel options',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/hotels/search
 * @desc    Search simulated demo hotels via request body
 * @access  Public
 */
router.post('/search', async (req, res) => {
  try {
    const { city, checkIn, checkOut, travelers, budgetPerNight, preference } = req.body || {};
    const result = await searchHotels({
      city,
      checkIn,
      checkOut,
      travelers: travelers ? parseInt(travelers, 10) : 1,
      budgetPerNight: budgetPerNight ? Number(budgetPerNight) : null,
      preference,
    });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      isDemo: true,
      notice: 'DEMO HOTEL DATA',
      message: 'Failed to search demo hotel options',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/hotels/destinations
 * @desc    Get summary of demo hotel cities
 * @access  Public
 */
router.get('/destinations', (req, res) => {
  const cities = [...new Set(DEMO_HOTELS.map((h) => h.city))];
  return res.json({
    success: true,
    isDemo: true,
    notice: 'DEMO HOTEL DATA',
    disclaimer: 'DEMO HOTEL DATA: Fictional simulation for demonstration only.',
    totalHotels: DEMO_HOTELS.length,
    destinations: cities,
  });
});

export default router;
