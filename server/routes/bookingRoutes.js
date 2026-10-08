import express from 'express';
import {
  prepareBooking,
  getBookingById,
  confirmBooking,
  getUserBookings,
  generateBookingConfirmationPdf,
} from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce authentication on all booking routes
router.use(protect);

// @route   POST /api/bookings/prepare
// @desc    Prepare a pending demo booking with backend-calculated amount
// @access  Private
router.post('/prepare', prepareBooking);

// @route   GET /api/bookings
// @desc    Get all demo bookings for the authenticated user
// @access  Private
router.get('/', getUserBookings);

// @route   GET /api/bookings/:bookingId/confirmation.pdf
// @desc    Download demo booking confirmation PDF
// @access  Private
router.get('/:bookingId/confirmation.pdf', generateBookingConfirmationPdf);

// @route   GET /api/bookings/:bookingId
// @desc    Fetch booking details for review page
// @access  Private
router.get('/:bookingId', getBookingById);

// @route   POST /api/bookings/:bookingId/confirm
// @desc    Finalize demo booking upon successful test payment
// @access  Private
router.post('/:bookingId/confirm', confirmBooking);

export default router;
