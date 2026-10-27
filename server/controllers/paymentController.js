import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import Trip from '../models/Trip.js';
import Stop from '../models/Stop.js';
import { getRazorpayInstance, getRazorpayConfig } from '../config/razorpay.js';

/**
 * Generates a unique test transaction ID for fallback simulation.
 * Example: TEST-TXN-8K2A-N9F1M4
 * 
 * @returns {string} Unique test transaction ID
 */
export const generateTestTransactionId = () => {
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  const timestampChars = Date.now().toString(36).toUpperCase();
  return `TEST-TXN-${randomChars}-${timestampChars}`;
};

/**
 * Cache of processed webhook event IDs to prevent duplicate processing
 */
const processedWebhookEvents = new Set();

/**
 * @route   POST /api/payments/create-order
 * @desc    Create an official Razorpay order for an existing pending booking (Test Mode)
 * @access  Private (Requires JWT)
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // 1. Authenticate user
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to initiate payment order',
      });
    }

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'A valid bookingId is required to create a payment order',
      });
    }

    // 2. Retrieve booking from MongoDB
    const idStr = String(bookingId);
    const query = idStr.startsWith('DEMO-BK-') || idStr.startsWith('GT-DEMO-')
      ? { bookingReference: idStr }
      : { _id: bookingId };

    const booking = await Booking.findOne(query);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // 3. Verify booking ownership
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to pay for this booking',
      });
    }

    // 4. Verify booking is pending & eligible for payment
    if (booking.status === 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'This booking is already confirmed and paid',
        bookingId: booking._id,
        status: booking.status,
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot initiate payment for a cancelled booking',
      });
    }

    // 5. Calculate amount strictly from server-trusted booking record
    const amount = Number(booking.amount);
    if (isNaN(amount) || !isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking amount. Payment cannot be initiated.',
      });
    }

    // 6. Convert amount into smallest currency unit (INR: 1 INR = 100 paise)
    const currency = (booking.currency || 'INR').toUpperCase();
    const amountInPaise = Math.round(amount * 100);

    // 7. Get Razorpay instance & validate configuration
    const razorpay = getRazorpayInstance();
    const { keyId } = getRazorpayConfig();

    // 8. Prevent duplicate pending orders within a 5-minute window if already created
    const existingRecentPayment = await Payment.findOne({
      booking: booking._id,
      user: req.user._id,
      status: 'created',
      orderId: { $ne: null },
      amountPaise: amountInPaise,
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
    }).sort({ createdAt: -1 });

    if (existingRecentPayment && existingRecentPayment.orderId) {
      return res.status(200).json({
        success: true,
        keyId,
        orderId: existingRecentPayment.orderId,
        amount: amountInPaise,
        currency,
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        testMode: true,
      });
    }

    // 9. Create unique receipt reference (max 40 chars allowed by Razorpay)
    const receipt = `rcpt_${String(booking._id).slice(-8)}_${Date.now().toString(36)}`;

    // 10. Call official Razorpay SDK to create order
    const orderOptions = {
      amount: amountInPaise,
      currency,
      receipt,
      notes: {
        bookingId: booking._id.toString(),
        bookingReference: booking.bookingReference,
        tripId: booking.trip?.toString() || '',
        userId: req.user._id.toString(),
      },
    };

    const order = await razorpay.orders.create(orderOptions);

    if (!order || !order.id) {
      throw new Error('Failed to generate order ID from Razorpay SDK');
    }

    // 11. Create or update Payment record with Razorpay order details
    const payment = await Payment.create({
      user: req.user._id,
      booking: booking._id,
      amount,
      amountPaise: amountInPaise,
      currency,
      provider: 'Razorpay Standard Checkout (Test Mode)',
      orderId: order.id,
      receipt,
      transactionId: order.id, // temporary until pay_ ID issued
      status: 'created',
      testMode: true,
    });

    // 12. Return only required frontend fields (Key Secret is NEVER returned)
    return res.status(200).json({
      success: true,
      keyId,
      orderId: order.id,
      amount: amountInPaise,
      currency,
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      testMode: true,
      paymentId: payment._id,
    });
  } catch (error) {
    console.error('[Razorpay Create Order Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating Razorpay order',
    });
  }
};

/**
 * @route   POST /api/payments/verify
 * @desc    Verify Razorpay payment signature & actual payment status on the server
 * @access  Private (Requires JWT)
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // 1. Authenticate user
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to verify payment',
      });
    }

    // 2. Validate input fields
    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required Razorpay payment verification parameters',
      });
    }

    // 3. Find booking
    const idStr = String(bookingId);
    const query = idStr.startsWith('DEMO-BK-') || idStr.startsWith('GT-DEMO-')
      ? { bookingReference: idStr }
      : { _id: bookingId };

    const booking = await Booking.findOne(query);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Associated booking record not found',
      });
    }

    // 4. Verify booking ownership
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to verify payment for this booking',
      });
    }

    // 5. Find payment record by orderId or booking
    let payment = await Payment.findOne({
      booking: booking._id,
      orderId: razorpay_order_id,
    });

    if (!payment) {
      payment = await Payment.findOne({
        booking: booking._id,
        user: req.user._id,
      }).sort({ createdAt: -1 });
    }

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'No matching payment record found for this order',
      });
    }

    // Verify payment ownership
    if (payment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not own this payment record',
      });
    }

    // 6. Idempotency Check: If already confirmed, return success immediately
    if (payment.status === 'success' && booking.status === 'confirmed') {
      return res.status(200).json({
        success: true,
        message: 'Payment has already been verified and confirmed (idempotent request)',
        payment,
        booking,
      });
    }

    // 7. Verify order ID matches server-stored record
    const storedOrderId = payment.orderId || razorpay_order_id;
    if (payment.orderId && payment.orderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: 'Submitted Razorpay order ID does not match server-stored order ID',
      });
    }

    // 8. Signature Verification using HMAC-SHA256 and server-side Key Secret
    const { keySecret } = getRazorpayConfig();
    const payload = `${storedOrderId}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    // Timing-safe comparison to prevent timing attacks
    let isSignatureValid = false;
    if (expectedSignature.length === razorpay_signature.length) {
      isSignatureValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(razorpay_signature, 'utf8')
      );
    }

    if (!isSignatureValid) {
      payment.status = 'failed';
      await payment.save();
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid Razorpay signature',
      });
    }

    // 9. Retrieve actual payment status from Razorpay using the SDK
    const razorpay = getRazorpayInstance();
    let paymentDetails;
    try {
      paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
    } catch (fetchErr) {
      console.error('[Razorpay Fetch Payment Error]:', fetchErr.message);
      return res.status(502).json({
        success: false,
        message: 'Unable to verify payment status with Razorpay gateway: ' + fetchErr.message,
      });
    }

    if (!paymentDetails) {
      return res.status(502).json({
        success: false,
        message: 'No payment details returned from Razorpay gateway',
      });
    }

    // 10. Confirm amount and currency against Razorpay payment record
    if (payment.amountPaise && paymentDetails.amount !== payment.amountPaise) {
      payment.status = 'failed';
      await payment.save();
      return res.status(400).json({
        success: false,
        message: `Amount mismatch: expected ${payment.amountPaise} paise, but received ${paymentDetails.amount} paise`,
      });
    }

    // 11. Handle payment status: capture if authorized
    let finalStatus = paymentDetails.status;
    if (finalStatus === 'authorized') {
      try {
        const captureResult = await razorpay.payments.capture(
          razorpay_payment_id,
          payment.amountPaise || paymentDetails.amount,
          payment.currency || paymentDetails.currency
        );
        finalStatus = captureResult.status;
      } catch (captureErr) {
        console.warn('[Razorpay Capture Warning]:', captureErr.message);
        // If capture failed, check if it was already captured
        const recheck = await razorpay.payments.fetch(razorpay_payment_id);
        finalStatus = recheck.status;
      }
    }

    if (finalStatus !== 'captured' && finalStatus !== 'authorized') {
      payment.status = 'failed';
      await payment.save();
      return res.status(400).json({
        success: false,
        message: `Payment is not captured. Current gateway status: ${finalStatus}`,
        paymentStatus: finalStatus,
      });
    }

    // 12. Update Payment record to success
    payment.status = 'success';
    payment.transactionId = razorpay_payment_id;
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.signature = razorpay_signature;
    payment.orderId = storedOrderId;
    payment.testMode = true;
    await payment.save();

    // 13. Transition Booking to confirmed
    booking.status = 'confirmed';
    booking.details = {
      ...(booking.details || {}),
      payment: {
        paymentId: payment._id,
        orderId: storedOrderId,
        transactionId: razorpay_payment_id,
        razorpayPaymentId: razorpay_payment_id,
        amount: payment.amount,
        currency: payment.currency,
        status: 'success',
        testMode: true,
        paidAt: new Date(),
        provider: 'Razorpay Standard Checkout (Test Mode)',
      },
    };
    await booking.save();

    // Mark associated trip as officially approved and confirmed upon payment
    if (booking.trip) {
      try {
        await Trip.findByIdAndUpdate(booking.trip, { isApproved: true });
      } catch (tripErr) {
        console.warn('[Payment Trip Approval Warning]:', tripErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Razorpay payment successfully verified and booking confirmed',
      payment: {
        _id: payment._id,
        paymentId: payment._id,
        orderId: payment.orderId,
        transactionId: payment.transactionId,
        razorpayPaymentId: payment.razorpayPaymentId,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        testMode: payment.testMode,
      },
      booking: {
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        status: booking.status,
        isDemo: booking.isDemo,
        amount: booking.amount,
        currency: booking.currency,
        details: booking.details,
      },
    });
  } catch (error) {
    console.error('[Razorpay Verify Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error verifying Razorpay payment',
    });
  }
};

/**
 * @route   GET /api/payments/:paymentId/status
 * @desc    Get current server-side payment status without exposing secrets
 * @access  Private (Requires JWT)
 */
export const getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found',
      });
    }

    if (payment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this payment',
      });
    }

    const booking = await Booking.findById(payment.booking);

    return res.status(200).json({
      success: true,
      payment: {
        _id: payment._id,
        paymentId: payment._id,
        orderId: payment.orderId,
        transactionId: payment.transactionId,
        razorpayPaymentId: payment.razorpayPaymentId,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        testMode: payment.testMode,
        createdAt: payment.createdAt,
      },
      booking: booking
        ? {
            bookingId: booking._id,
            bookingReference: booking.bookingReference,
            status: booking.status,
          }
        : null,
    });
  } catch (error) {
    console.error('[Get Payment Status Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving payment status',
    });
  }
};

/**
 * @route   POST /api/payments/webhook
 * @desc    Optional Razorpay Webhook listener for asynchronous payment-status updates
 * @access  Public (Signature-verified via RAZORPAY_WEBHOOK_SECRET)
 */
export const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
    const signature = req.headers['x-razorpay-signature'];

    // If webhook secret is configured, strictly enforce signature verification
    if (webhookSecret) {
      if (!signature) {
        return res.status(400).json({ success: false, message: 'Missing Razorpay webhook signature header' });
      }

      const bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const expectedSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(bodyStr)
        .digest('hex');

      if (expectedSig !== signature) {
        return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      }
    }

    const event = req.body;
    const eventId = event?.event_id || req.headers['x-razorpay-event-id'];

    if (eventId && processedWebhookEvents.has(eventId)) {
      return res.status(200).json({ success: true, message: 'Event already processed (idempotent)' });
    }
    if (eventId) processedWebhookEvents.add(eventId);

    const eventName = event?.event;
    const paymentEntity = event?.payload?.payment?.entity;

    if (eventName === 'payment.captured' && paymentEntity) {
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      if (orderId) {
        const payment = await Payment.findOne({ orderId });
        if (payment && payment.status !== 'success') {
          payment.status = 'success';
          payment.transactionId = paymentId;
          payment.razorpayPaymentId = paymentId;
          await payment.save();

          const booking = await Booking.findById(payment.booking);
          if (booking && booking.status !== 'confirmed') {
            booking.status = 'confirmed';
            booking.details = {
              ...(booking.details || {}),
              payment: {
                paymentId: payment._id,
                orderId,
                transactionId: paymentId,
                status: 'success',
                testMode: true,
                paidAt: new Date(),
                provider: 'Razorpay Webhook',
              },
            };
            await booking.save();
          }
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Webhook received' });
  } catch (error) {
    console.error('[Razorpay Webhook Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Error processing webhook' });
  }
};

/**
 * @route   POST /api/payments/create
 * @desc    Legacy / direct payment creation endpoint (retained for backward compatibility)
 * @access  Private (Requires JWT)
 */
export const createPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to create a payment',
      });
    }

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'A valid bookingId is required to initiate test payment',
      });
    }

    const idStr = String(bookingId);
    const query = idStr.startsWith('DEMO-BK-') || idStr.startsWith('GT-DEMO-')
      ? { bookingReference: idStr }
      : { _id: bookingId };

    const booking = await Booking.findOne(query);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to pay for this booking',
      });
    }

    if (booking.status === 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'This booking is already confirmed and paid',
        bookingId: booking._id,
        status: booking.status,
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot initiate payment for a cancelled booking',
      });
    }

    const existingPayment = await Payment.findOne({
      booking: booking._id,
      user: req.user._id,
      status: 'created',
      createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) },
    });

    if (existingPayment) {
      return res.status(200).json({
        success: true,
        isExisting: true,
        payment: {
          _id: existingPayment._id,
          paymentId: existingPayment._id,
          bookingId: booking._id,
          amount: existingPayment.amount,
          currency: existingPayment.currency,
          status: existingPayment.status,
          transactionId: existingPayment.transactionId,
          testMode: existingPayment.testMode,
          bookingReference: booking.bookingReference,
        },
      });
    }

    const amount = Number(booking.amount);
    const currency = booking.currency || 'INR';
    const initialTxnId = generateTestTransactionId();

    const payment = await Payment.create({
      user: req.user._id,
      booking: booking._id,
      amount,
      amountPaise: Math.round(amount * 100),
      currency,
      provider: 'GlobeThrottle Simulated Test Payment Gateway',
      transactionId: initialTxnId,
      status: 'created',
      testMode: true,
    });

    return res.status(201).json({
      success: true,
      payment: {
        _id: payment._id,
        paymentId: payment._id,
        bookingId: booking._id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        transactionId: payment.transactionId,
        testMode: payment.testMode,
        bookingReference: booking.bookingReference,
      },
    });
  } catch (error) {
    console.error('[Create Payment Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating test payment',
    });
  }
};

/**
 * @route   POST /api/payments/:paymentId/confirm
 * @desc    Simulate payment confirmation (Legacy test simulation endpoint)
 * @access  Private (Requires JWT)
 */
export const confirmPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { simulateStatus = 'success' } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to confirm payment',
      });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found',
      });
    }

    if (payment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to confirm this payment',
      });
    }

    if (payment.status === 'success') {
      const existingBooking = await Booking.findById(payment.booking);
      return res.status(200).json({
        success: true,
        message: 'Payment has already been confirmed (idempotent request)',
        payment: {
          _id: payment._id,
          paymentId: payment._id,
          status: payment.status,
          transactionId: payment.transactionId,
          amount: payment.amount,
          currency: payment.currency,
          testMode: payment.testMode,
        },
        booking: existingBooking
          ? {
              bookingId: existingBooking._id,
              bookingReference: existingBooking.bookingReference,
              status: existingBooking.status,
              isDemo: existingBooking.isDemo,
              amount: existingBooking.amount,
              currency: existingBooking.currency,
            }
          : null,
      });
    }

    const booking = await Booking.findById(payment.booking);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Associated booking record not found',
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot process payment for a cancelled booking',
      });
    }

    if (simulateStatus === 'failed') {
      payment.status = 'failed';
      await payment.save();

      return res.status(400).json({
        success: false,
        status: 'failed',
        message: 'Simulated payment failed as requested. You can retry the payment or return to review.',
        payment: {
          _id: payment._id,
          paymentId: payment._id,
          status: payment.status,
          transactionId: payment.transactionId,
          amount: payment.amount,
          currency: payment.currency,
          testMode: payment.testMode,
        },
        booking: {
          bookingId: booking._id,
          status: booking.status,
          bookingReference: booking.bookingReference,
        },
      });
    }

    const finalTxnId = generateTestTransactionId();
    payment.status = 'success';
    payment.transactionId = finalTxnId;
    await payment.save();

    try {
      booking.status = 'confirmed';
      booking.details = {
        ...(booking.details || {}),
        payment: {
          paymentId: payment._id,
          transactionId: finalTxnId,
          amount: payment.amount,
          currency: payment.currency,
          status: 'success',
          testMode: true,
          paidAt: new Date(),
        },
      };
      await booking.save();
    } catch (bookingSaveErr) {
      console.error('[Payment Reconciliation Error]:', bookingSaveErr);
      payment.status = 'created';
      await payment.save();
      throw new Error('Failed to update booking status. Payment rolled back.');
    }

    return res.status(200).json({
      success: true,
      status: 'success',
      message: 'Test payment completed and demo booking confirmed',
      payment: {
        _id: payment._id,
        paymentId: payment._id,
        status: payment.status,
        transactionId: payment.transactionId,
        amount: payment.amount,
        currency: payment.currency,
        testMode: payment.testMode,
      },
      booking: {
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        status: booking.status,
        isDemo: booking.isDemo,
        amount: booking.amount,
        currency: booking.currency,
        details: booking.details,
      },
    });
  } catch (error) {
    console.error('[Confirm Payment Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error confirming test payment',
    });
  }
};

/**
 * @route   GET /api/payments/:paymentId
 * @desc    Get payment details by ID
 * @access  Private (Requires JWT)
 */
export const getPaymentById = async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    if (payment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this payment',
      });
    }

    const booking = await Booking.findById(payment.booking);
    let trip = null;
    let destination = 'Destination';

    if (booking) {
      trip = await Trip.findById(booking.trip);
      if (trip) {
        const stops = await Stop.find({ trip: trip._id }).sort({ order: 1 });
        if (stops && stops.length > 0) {
          destination = stops.map((s) => s.city).join(' → ');
        } else {
          destination = trip.name;
        }
      }
    }

    return res.status(200).json({
      success: true,
      payment: {
        _id: payment._id,
        paymentId: payment._id,
        orderId: payment.orderId,
        status: payment.status,
        transactionId: payment.transactionId,
        razorpayPaymentId: payment.razorpayPaymentId,
        amount: payment.amount,
        currency: payment.currency,
        testMode: payment.testMode,
        createdAt: payment.createdAt,
        booking: booking
          ? {
              bookingId: booking._id,
              bookingReference: booking.bookingReference,
              type: booking.type,
              provider: booking.provider,
              status: booking.status,
              amount: booking.amount,
              currency: booking.currency,
              details: booking.details,
            }
          : null,
        trip: trip
          ? {
              _id: trip._id,
              name: trip.name,
              destination,
              startDate: trip.startDate,
              endDate: trip.endDate,
              travelers: trip.travelers || [],
              travelerCount: trip.travelers?.length || 1,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('[Get Payment By ID Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving payment',
    });
  }
};

/**
 * @route   GET /api/payments/by-booking/:bookingId
 * @desc    Get payment associated with a booking
 * @access  Private (Requires JWT)
 */
export const getPaymentByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const idStr = String(bookingId);
    const query = idStr.startsWith('DEMO-BK-') || idStr.startsWith('GT-DEMO-')
      ? { bookingReference: idStr }
      : { _id: bookingId };

    const booking = await Booking.findOne(query);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not own this booking',
      });
    }

    const payment = await Payment.findOne({
      booking: booking._id,
      user: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      payment: payment || null,
      booking,
    });
  } catch (error) {
    console.error('[Get Payment By Booking Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving payment for booking',
    });
  }
};

/**
 * @route   POST /api/payments/pay-direct
 * @desc    Direct test payment endpoint: immediately processes and confirms payment as successful without external bank redirects
 * @access  Private (Requires JWT)
 */
export const processDirectPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to process payment',
      });
    }

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'A valid bookingId is required',
      });
    }

    const idStr = String(bookingId);
    const query = idStr.startsWith('DEMO-BK-') || idStr.startsWith('GT-DEMO-')
      ? { bookingReference: idStr }
      : { _id: bookingId };

    const booking = await Booking.findOne(query);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to pay for this booking',
      });
    }

    if (booking.status === 'confirmed') {
      const existingPayment = await Payment.findOne({
        booking: booking._id,
        user: req.user._id,
        status: 'success',
      }).sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        status: 'success',
        message: 'Payment has already been confirmed',
        booking,
        payment: existingPayment,
      });
    }

    const amount = Number(booking.amount);
    const currency = (booking.currency || 'INR').toUpperCase();
    const finalTxnId = generateTestTransactionId();

    // Create or update payment record as successful
    let payment = await Payment.findOne({
      booking: booking._id,
      user: req.user._id,
    }).sort({ createdAt: -1 });

    if (!payment) {
      payment = new Payment({
        user: req.user._id,
        booking: booking._id,
        amount,
        amountPaise: Math.round(amount * 100),
        currency,
        provider: 'Razorpay Instant Demo Gateway',
        transactionId: finalTxnId,
        status: 'success',
        testMode: true,
        paidAt: new Date(),
      });
    } else {
      payment.status = 'success';
      payment.transactionId = finalTxnId;
      payment.paidAt = new Date();
      payment.amount = amount;
      payment.amountPaise = Math.round(amount * 100);
      payment.currency = currency;
      payment.provider = 'Razorpay Instant Demo Gateway';
      payment.testMode = true;
    }

    await payment.save();

    // Confirm booking
    booking.status = 'confirmed';
    booking.details = {
      ...(booking.details || {}),
      payment: {
        paymentId: payment._id,
        transactionId: finalTxnId,
        amount,
        currency,
        status: 'success',
        testMode: true,
        paidAt: new Date(),
        provider: 'Razorpay Instant Demo Gateway',
      },
    };
    await booking.save();

    // Mark associated trip as officially approved and confirmed upon payment
    if (booking.trip) {
      try {
        await Trip.findByIdAndUpdate(booking.trip, { isApproved: true });
      } catch (tripErr) {
        console.warn('[Payment Trip Approval Warning]:', tripErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      status: 'success',
      message: 'Payment processed successfully',
      payment,
      booking,
    });
  } catch (error) {
    console.error('[Direct Payment Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error processing direct payment',
    });
  }
};

export default {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentStatus,
  handleRazorpayWebhook,
  createPayment,
  confirmPayment,
  getPaymentById,
  getPaymentByBooking,
  generateTestTransactionId,
  processDirectPayment,
};
