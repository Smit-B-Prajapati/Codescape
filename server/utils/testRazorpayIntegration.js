import crypto from 'crypto';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Trip from '../models/Trip.js';
import Stop from '../models/Stop.js';
import { prepareBooking, getBookingById, generateBookingConfirmationPdf } from '../controllers/bookingController.js';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentStatus,
  handleRazorpayWebhook,
} from '../controllers/paymentController.js';
import { getRazorpayConfig, getRazorpayInstance } from '../config/razorpay.js';
import { DEMO_TRAINS } from '../data/trains.js';

let mongoServer;

const mockRes = () => {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    chunks: [],
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
    write(chunk) {
      this.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    },
    end(chunk) {
      if (chunk) {
        this.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      this.isEnded = true;
    },
    on() { return this; },
    once() { return this; },
    emit() {},
  };
  return res;
};

async function setup() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  console.log('In-memory MongoDB initialized for Razorpay integration tests.');
}

async function teardown() {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
  console.log('In-memory MongoDB cleaned up.');
}

async function runTests() {
  console.log('================================================================');
  console.log('💳 STARTING RAZORPAY TEST MODE INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  await setup();

  try {
    const user1 = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Smit Traveler',
      email: 'smit@globetrotter.demo',
      role: 'user',
    };

    const user2 = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Intruder User',
      email: 'intruder@other.com',
      role: 'user',
    };

    // -------------------------------------------------------------------------
    // Test 1: Validate Razorpay Config & SDK Initialization
    // -------------------------------------------------------------------------
    console.log('--- Step 1: Razorpay Configuration & Credential Safety ---');
    const config = getRazorpayConfig();
    assert(config.isConfigured === true, 'Razorpay test credentials are configured');
    assert(config.mode === 'test', 'Razorpay mode is strictly "test"');
    assert(config.keyId.startsWith('rzp_test_'), 'Key ID starts with "rzp_test_"');
    assert(config.keySecret !== undefined && config.keySecret.length > 5, 'Key Secret is present on backend');

    const razorpay = getRazorpayInstance();
    assert(razorpay !== null && typeof razorpay.orders?.create === 'function', 'Razorpay SDK initialized successfully');

    // -------------------------------------------------------------------------
    // Test 2: Create Trip and Prepare Booking
    // -------------------------------------------------------------------------
    console.log('\n--- Step 2: Trip & Booking Preparation ---');
    const sampleTrip = await Trip.create({
      user: user1._id,
      name: 'Goa Coastal Getaway',
      description: 'Trip for 2 to Goa',
      startDate: new Date('2026-11-10'),
      endDate: new Date('2026-11-14'),
      budgetLimit: 30000,
      currency: 'INR',
      travelers: ['Smit Prajapati', 'Travel Partner'],
    });

    const validTrain = DEMO_TRAINS[0]; // 1450 INR per passenger * 2 = 2900 INR

    let prepRes = mockRes();
    await prepareBooking(
      {
        user: user1,
        body: {
          tripId: sampleTrip._id.toString(),
          type: 'transport',
          optionId: validTrain.id,
          amount: 5, // Client tampering attempt
        },
      },
      prepRes
    );

    assert(prepRes.statusCode === 201, 'Booking prepared with HTTP 201');
    assert(prepRes.body?.booking?.status === 'pending', 'Booking is in "pending" status');
    assert(prepRes.body?.booking?.amount === 2900, 'Server calculated verified 2900 INR');
    const bookingId = prepRes.body.booking.bookingId;

    // -------------------------------------------------------------------------
    // Test 3: Create Razorpay Order (POST /api/payments/create-order)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 3: Create Razorpay Order ---');

    // 3A: Cross-user order creation attempt
    let unauthOrderRes = mockRes();
    await createRazorpayOrder(
      {
        user: user2, // user2 attempts to order user1's booking
        body: { bookingId: bookingId.toString() },
      },
      unauthOrderRes
    );
    assert(unauthOrderRes.statusCode === 403, 'Cross-user order creation blocked with HTTP 403');

    // 3B: Legitimate user order creation with Razorpay SDK
    let orderRes = mockRes();
    await createRazorpayOrder(
      {
        user: user1,
        body: { bookingId: bookingId.toString() },
      },
      orderRes
    );

    assert(orderRes.statusCode === 200, 'Razorpay order created with HTTP 200');
    assert(orderRes.body?.success === true, 'Response success is true');
    assert(orderRes.body?.keyId === config.keyId, 'Returns public keyId only');
    assert(orderRes.body?.keySecret === undefined, 'Key secret is NEVER returned in response');
    assert(orderRes.body?.amount === 290000, 'Amount correctly converted to paise (2900 INR = 290000 paise)');
    assert(orderRes.body?.currency === 'INR', 'Currency is INR');
    assert(typeof orderRes.body?.orderId === 'string' && orderRes.body?.orderId.startsWith('order_'), `Generated valid Razorpay order ID: ${orderRes.body?.orderId}`);
    assert(orderRes.body?.testMode === true, 'Order strictly flagged testMode: true');

    const generatedOrderId = orderRes.body.orderId;

    // Verify stored Payment record
    const storedPayment = await Payment.findOne({ booking: bookingId, orderId: generatedOrderId });
    assert(storedPayment !== null, 'Payment document stored with Razorpay orderId');
    assert(storedPayment.status === 'created', 'Payment initial status is "created"');
    assert(storedPayment.amountPaise === 290000, 'Payment stores amountPaise');

    // -------------------------------------------------------------------------
    // Test 4: Verify Payment Signature Security & Validation
    // -------------------------------------------------------------------------
    console.log('\n--- Step 4: Verification Signature Security Checks ---');

    const mockPaymentId = `pay_${Math.random().toString(36).substring(2, 10)}`;

    // 4A: Tampered signature rejection
    let badSigRes = mockRes();
    await verifyRazorpayPayment(
      {
        user: user1,
        body: {
          bookingId: bookingId.toString(),
          razorpay_order_id: generatedOrderId,
          razorpay_payment_id: mockPaymentId,
          razorpay_signature: 'invalid_fraudulent_signature_hex_value_0123456789abcdef',
        },
      },
      badSigRes
    );
    assert(badSigRes.statusCode === 400, 'Tampered signature rejected with HTTP 400');
    assert(badSigRes.body?.message?.includes('signature'), 'Clear signature error returned');

    // Verify booking is still pending
    const bookingAfterBadSig = await Booking.findById(bookingId);
    assert(bookingAfterBadSig.status === 'pending', 'Booking remains pending after invalid signature');

    // 4B: Mismatched Order ID rejection
    const fakeOrderId = 'order_fake99999999';
    const fakeSig = crypto.createHmac('sha256', config.keySecret).update(`${fakeOrderId}|${mockPaymentId}`).digest('hex');
    let badOrderRes = mockRes();
    await verifyRazorpayPayment(
      {
        user: user1,
        body: {
          bookingId: bookingId.toString(),
          razorpay_order_id: fakeOrderId,
          razorpay_payment_id: mockPaymentId,
          razorpay_signature: fakeSig,
        },
      },
      badOrderRes
    );
    assert(badOrderRes.statusCode === 400 || badOrderRes.statusCode === 404, 'Mismatched order ID rejected');

    // 4C: Cross-user verification attempt
    const validSig = crypto.createHmac('sha256', config.keySecret).update(`${generatedOrderId}|${mockPaymentId}`).digest('hex');
    let crossVerifyRes = mockRes();
    await verifyRazorpayPayment(
      {
        user: user2, // user2 attempts to verify user1's booking
        body: {
          bookingId: bookingId.toString(),
          razorpay_order_id: generatedOrderId,
          razorpay_payment_id: mockPaymentId,
          razorpay_signature: validSig,
        },
      },
      crossVerifyRes
    );
    assert(crossVerifyRes.statusCode === 403, 'Cross-user payment verification rejected with HTTP 403');

    // -------------------------------------------------------------------------
    // Test 5: Verify Payment & Gateway Settlement
    // -------------------------------------------------------------------------
    console.log('\n--- Step 5: Successful Payment Verification & Booking Confirmation ---');

    // For unit testing the verify controller without browser popup, we mock payments.fetch
    const originalFetch = razorpay.payments.fetch.bind(razorpay);
    razorpay.payments.fetch = async (id) => ({
      id,
      entity: 'payment',
      amount: 290000,
      currency: 'INR',
      status: 'captured',
      order_id: generatedOrderId,
      captured: true,
    });

    let successVerifyRes = mockRes();
    await verifyRazorpayPayment(
      {
        user: user1,
        body: {
          bookingId: bookingId.toString(),
          razorpay_order_id: generatedOrderId,
          razorpay_payment_id: mockPaymentId,
          razorpay_signature: validSig,
        },
      },
      successVerifyRes
    );

    assert(successVerifyRes.statusCode === 200, 'Legitimate signature verified with HTTP 200');
    assert(successVerifyRes.body?.payment?.status === 'success', 'Payment status is "success"');
    assert(successVerifyRes.body?.payment?.transactionId === mockPaymentId, 'Transaction ID updated to Razorpay payment ID');
    assert(successVerifyRes.body?.booking?.status === 'confirmed', 'Booking status successfully transitioned to "confirmed"');
    assert(successVerifyRes.body?.booking?.bookingReference !== undefined, 'Booking reference preserved');

    // -------------------------------------------------------------------------
    // Test 6: Idempotent Verification
    // -------------------------------------------------------------------------
    console.log('\n--- Step 6: Idempotency & Repeat Verification ---');
    let repeatVerifyRes = mockRes();
    await verifyRazorpayPayment(
      {
        user: user1,
        body: {
          bookingId: bookingId.toString(),
          razorpay_order_id: generatedOrderId,
          razorpay_payment_id: mockPaymentId,
          razorpay_signature: validSig,
        },
      },
      repeatVerifyRes
    );

    assert(repeatVerifyRes.statusCode === 200, 'Repeated verification returns HTTP 200 (idempotent)');
    assert(repeatVerifyRes.body?.message?.includes('already been verified'), 'Idempotent response detected');

    // Total bookings count for this trip must remain 1
    const totalBookings = await Booking.countDocuments({ trip: sampleTrip._id });
    assert(totalBookings === 1, 'No duplicate booking created');

    // -------------------------------------------------------------------------
    // Test 7: Payment Status Endpoint (GET /api/payments/:paymentId/status)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 7: Payment Status Endpoint ---');
    const paymentDoc = await Payment.findOne({ booking: bookingId });
    let statusRes = mockRes();
    await getPaymentStatus(
      {
        user: user1,
        params: { paymentId: paymentDoc._id.toString() },
      },
      statusRes
    );

    assert(statusRes.statusCode === 200, 'Status endpoint returned HTTP 200');
    assert(statusRes.body?.payment?.status === 'success', 'Status endpoint reflects "success"');
    assert(statusRes.body?.payment?.orderId === generatedOrderId, 'Status endpoint returns orderId');
    assert(statusRes.body?.payment?.keySecret === undefined, 'Status endpoint never leaks key secret');

    // Cross-user status check
    let crossStatusRes = mockRes();
    await getPaymentStatus(
      {
        user: user2,
        params: { paymentId: paymentDoc._id.toString() },
      },
      crossStatusRes
    );
    assert(crossStatusRes.statusCode === 403, 'Cross-user status request rejected with HTTP 403');

    // -------------------------------------------------------------------------
    // Test 8: Confirmation PDF with Razorpay Data
    // -------------------------------------------------------------------------
    console.log('\n--- Step 8: Confirmation PDF with Razorpay Transaction Data ---');
    let pdfRes = mockRes();
    await generateBookingConfirmationPdf(
      {
        user: user1,
        params: { bookingId: bookingId.toString() },
      },
      pdfRes
    );

    assert(pdfRes.headers['Content-Type'] === 'application/pdf', 'PDF Content-Type is application/pdf');
    await new Promise((r) => setTimeout(r, 100));
    const pdfBytes = pdfRes.chunks.reduce((acc, c) => acc + c.length, 0);
    assert(pdfBytes > 1000, `Confirmation PDF generated (${pdfBytes} bytes)`);

    // Restore mock
    razorpay.payments.fetch = originalFetch;

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    await teardown();
  }

  console.log('\n================================================================');
  console.log(`RAZORPAY TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
