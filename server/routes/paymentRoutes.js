import express from 'express';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentStatus,
  handleRazorpayWebhook,
  createPayment,
  confirmPayment,
  getPaymentById,
  getPaymentByBooking,
  processDirectPayment,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public webhook route (signature-verified internally via RAZORPAY_WEBHOOK_SECRET)
router.post('/webhook', handleRazorpayWebhook);

// Protected routes (require JWT authentication)
router.use(protect);

// @route   POST /api/payments/pay-direct
// @desc    Direct test payment endpoint: instant successful confirmation without external mock bank redirects
// @access  Private
router.post('/pay-direct', processDirectPayment);

// @route   POST /api/payments/create-order
// @desc    Create an official Razorpay order (Test Mode)
// @access  Private
router.post('/create-order', createRazorpayOrder);

// @route   POST /api/payments/verify
// @desc    Verify Razorpay payment signature & actual gateway status
// @access  Private
router.post('/verify', verifyRazorpayPayment);

// @route   GET /api/payments/:paymentId/status
// @desc    Retrieve payment status
// @access  Private
router.get('/:paymentId/status', getPaymentStatus);

// @route   POST /api/payments/create
// @desc    Initiate test-mode payment for a pending booking (legacy compatible)
// @access  Private
router.post('/create', createPayment);

// @route   POST /api/payments/:paymentId/confirm
// @desc    Simulate test payment (legacy simulation compatible)
// @access  Private
router.post('/:paymentId/confirm', confirmPayment);

// @route   GET /api/payments/:paymentId
// @desc    Retrieve payment status and details
// @access  Private
router.get('/:paymentId', getPaymentById);

// @route   GET /api/payments/by-booking/:bookingId
// @desc    Retrieve payment associated with a booking
// @access  Private
router.get('/by-booking/:bookingId', getPaymentByBooking);

export default router;
