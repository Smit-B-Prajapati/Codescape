import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Trip from '../models/Trip.js';
import Stop from '../models/Stop.js';
import {
  prepareBooking,
  getBookingById,
  generateBookingConfirmationPdf,
} from '../controllers/bookingController.js';
import {
  createPayment,
  confirmPayment,
  getPaymentById,
  getPaymentByBooking,
} from '../controllers/paymentController.js';
import { DEMO_TRAINS } from '../data/trains.js';
import { DEMO_HOTELS } from '../data/hotels.js';

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
    on(event, handler) {
      // Stub for stream listeners if needed
      return this;
    },
    once(event, handler) {
      return this;
    },
    emit() {},
  };
  return res;
};

async function setup() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  console.log('Test MongoDB In-Memory database initialized for Payment Tests.');
}

async function teardown() {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
  console.log('Test MongoDB database cleaned up.');
}

async function runTests() {
  console.log('==========================================================');
  console.log('🧪 Starting Demo Payment & Confirmation System Test Suite');
  console.log('==========================================================\n');

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

    // 1. Create sample Trip for user1
    const sampleTrip = await Trip.create({
      user: user1._id,
      name: 'Goa Holiday Getaway',
      description: 'Trip to Goa for 2 travelers',
      startDate: new Date('2026-11-10'),
      endDate: new Date('2026-11-14'),
      budgetLimit: 30000,
      currency: 'INR',
      travelers: ['Smit Prajapati', 'Friend Traveler'],
      coverPhoto: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2',
      isPublic: false,
    });

    await Stop.create({
      trip: sampleTrip._id,
      city: 'Goa',
      country: 'India',
      startDate: new Date('2026-11-10'),
      endDate: new Date('2026-11-14'),
      order: 0,
    });

    const validTrain = DEMO_TRAINS[0]; // 1450 INR per passenger * 2 = 2900 INR

    // -------------------------------------------------------------------------
    // Test 1: Prepare Pending Booking
    // -------------------------------------------------------------------------
    console.log('\n--- Step 1: Booking Preparation ---');
    let prepRes = mockRes();
    await prepareBooking(
      {
        user: user1,
        body: {
          tripId: sampleTrip._id.toString(),
          type: 'transport',
          optionId: validTrain.id,
        },
      },
      prepRes
    );

    assert(prepRes.statusCode === 201, 'Booking prepared with HTTP 201');
    assert(prepRes.body?.booking?.status === 'pending', 'Booking status is strictly "pending"');
    assert(prepRes.body?.booking?.isDemo === true, 'Booking has isDemo = true');
    assert(prepRes.body?.booking?.amount === 2900, 'Calculated server-trusted amount is 2900 INR');

    const bookingId = prepRes.body.booking.bookingId;

    // -------------------------------------------------------------------------
    // Test 2: Review Booking via GET /api/bookings/:bookingId
    // -------------------------------------------------------------------------
    console.log('\n--- Step 2: Booking Review ---');
    let reviewRes = mockRes();
    await getBookingById(
      {
        user: user1,
        params: { bookingId: bookingId.toString() },
      },
      reviewRes
    );

    assert(reviewRes.statusCode === 200, 'Fetched booking review details with HTTP 200');
    assert(reviewRes.body?.booking?.amount === 2900, 'Review displays verified amount');
    assert(reviewRes.body?.booking?.status === 'pending', 'Review shows status is pending');

    // -------------------------------------------------------------------------
    // Test 3: Unauthorized Payment Creation
    // -------------------------------------------------------------------------
    console.log('\n--- Step 3: Payment Creation Security & Ownership ---');
    let unauthRes = mockRes();
    await createPayment(
      {
        user: user2, // Different user
        body: { bookingId: bookingId.toString() },
      },
      unauthRes
    );
    assert(unauthRes.statusCode === 403, 'Cross-user payment creation rejected with HTTP 403');

    // -------------------------------------------------------------------------
    // Test 4: Create Valid Test Payment
    // -------------------------------------------------------------------------
    console.log('\n--- Step 4: Create Valid Test Payment ---');
    let payCreateRes = mockRes();
    await createPayment(
      {
        user: user1,
        body: {
          bookingId: bookingId.toString(),
          amount: 5, // Attempt client price tampering (should be ignored!)
        },
      },
      payCreateRes
    );

    assert(payCreateRes.statusCode === 201, 'Payment created with HTTP 201');
    assert(payCreateRes.body?.payment?.status === 'created', 'Initial payment status is "created"');
    assert(payCreateRes.body?.payment?.testMode === true, 'Payment testMode is strictly true');
    assert(payCreateRes.body?.payment?.amount === 2900, 'Backend ignored client price tampering (2900 INR)');
    assert(payCreateRes.body?.payment?.transactionId?.startsWith('TEST-TXN-'), 'Initial transaction ID generated');

    const paymentId = payCreateRes.body.payment._id;

    // -------------------------------------------------------------------------
    // Test 5: Cross-User Payment Access
    // -------------------------------------------------------------------------
    console.log('\n--- Step 5: Cross-User Payment Access Prevention ---');
    let getPayOtherUserRes = mockRes();
    await getPaymentById(
      {
        user: user2,
        params: { paymentId: paymentId.toString() },
      },
      getPayOtherUserRes
    );
    assert(getPayOtherUserRes.statusCode === 403, 'Cross-user getPaymentById rejected with HTTP 403');

    // -------------------------------------------------------------------------
    // Test 6: Simulate Failed Payment
    // -------------------------------------------------------------------------
    console.log('\n--- Step 6: Simulate Payment Failure ---');
    let failRes = mockRes();
    await confirmPayment(
      {
        user: user1,
        params: { paymentId: paymentId.toString() },
        body: { simulateStatus: 'failed' },
      },
      failRes
    );

    assert(failRes.statusCode === 400, 'Payment failure simulation returns HTTP 400');
    assert(failRes.body?.payment?.status === 'failed', 'Payment status updated to "failed"');

    // Verify booking is still pending (NOT confirmed)
    const bookingAfterFail = await Booking.findById(bookingId);
    assert(bookingAfterFail.status === 'pending', 'Booking remains "pending" after payment failure');

    // -------------------------------------------------------------------------
    // Test 7: Cannot confirm already failed payment without new payment or retry
    // -------------------------------------------------------------------------
    console.log('\n--- Step 7: Retry Flow / Create New Payment after Failure ---');
    let retryPayRes = mockRes();
    await createPayment(
      {
        user: user1,
        body: { bookingId: bookingId.toString() },
      },
      retryPayRes
    );
    assert(retryPayRes.statusCode === 201, 'New payment created for retry flow');
    const retryPaymentId = retryPayRes.body.payment._id;

    // -------------------------------------------------------------------------
    // Test 8: Simulate Successful Payment
    // -------------------------------------------------------------------------
    console.log('\n--- Step 8: Simulate Payment Success ---');
    let successRes = mockRes();
    await confirmPayment(
      {
        user: user1,
        params: { paymentId: retryPaymentId.toString() },
        body: { simulateStatus: 'success' },
      },
      successRes
    );

    assert(successRes.statusCode === 200, 'Payment confirmation succeeded with HTTP 200');
    assert(successRes.body?.payment?.status === 'success', 'Payment status is "success"');
    assert(successRes.body?.payment?.testMode === true, 'Payment testMode remains true');
    assert(successRes.body?.booking?.status === 'confirmed', 'Booking status transitioned to "confirmed"');
    assert(successRes.body?.booking?.isDemo === true, 'Booking isDemo remains true');
    assert(
      successRes.body?.booking?.bookingReference?.startsWith('GT-DEMO-') ||
      successRes.body?.booking?.bookingReference?.startsWith('DEMO-BK-'),
      'Unique booking reference exists'
    );
    assert(successRes.body?.payment?.transactionId?.startsWith('TEST-TXN-'), 'Verified fake test transaction ID generated');

    // -------------------------------------------------------------------------
    // Test 9: Idempotency (Repeat Confirmation Request)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 9: Payment Confirmation Idempotency ---');
    let repeatRes = mockRes();
    await confirmPayment(
      {
        user: user1,
        params: { paymentId: retryPaymentId.toString() },
        body: { simulateStatus: 'success' },
      },
      repeatRes
    );

    assert(repeatRes.statusCode === 200, 'Idempotent repeated call returns HTTP 200');
    assert(repeatRes.body?.message?.includes('already confirmed') || repeatRes.body?.success === true, 'Repeat confirm returns safely without duplicates');

    // Ensure total bookings count is still 1
    const totalBookings = await Booking.countDocuments({ trip: sampleTrip._id });
    assert(totalBookings === 1, 'No duplicate booking was created');

    // -------------------------------------------------------------------------
    // Test 10: Attempt to Confirm Invalid Payment ID
    // -------------------------------------------------------------------------
    console.log('\n--- Step 10: Invalid Payment Handling ---');
    let invalidPayRes = mockRes();
    await confirmPayment(
      {
        user: user1,
        params: { paymentId: new mongoose.Types.ObjectId().toString() },
        body: { simulateStatus: 'success' },
      },
      invalidPayRes
    );
    assert(invalidPayRes.statusCode === 404, 'Non-existent payment returns HTTP 404');

    // -------------------------------------------------------------------------
    // Test 11: Cross-User Confirmation Attempt
    // -------------------------------------------------------------------------
    console.log('\n--- Step 11: Cross-User Confirmation Security ---');
    let crossConfirmRes = mockRes();
    await confirmPayment(
      {
        user: user2,
        params: { paymentId: retryPaymentId.toString() },
        body: { simulateStatus: 'success' },
      },
      crossConfirmRes
    );
    assert(crossConfirmRes.statusCode === 403, 'Cross-user confirmation rejected with HTTP 403');

    // -------------------------------------------------------------------------
    // Test 12: GET /api/payments/booking/:bookingId
    // -------------------------------------------------------------------------
    console.log('\n--- Step 12: Retrieve Payment by Booking Reference ---');
    let getByBookingRes = mockRes();
    await getPaymentByBooking(
      {
        user: user1,
        params: { bookingId: bookingId.toString() },
      },
      getByBookingRes
    );
    assert(getByBookingRes.statusCode === 200, 'Retrieved payment by booking with HTTP 200');
    assert(getByBookingRes.body?.payment?.status === 'success', 'Retrieved payment reflects success status');

    // -------------------------------------------------------------------------
    // Test 13: Download Demo Confirmation PDF
    // -------------------------------------------------------------------------
    console.log('\n--- Step 13: Generate & Download Demo Confirmation PDF ---');
    let pdfRes = mockRes();
    await generateBookingConfirmationPdf(
      {
        user: user1,
        params: { bookingId: bookingId.toString() },
      },
      pdfRes
    );

    assert(pdfRes.headers['Content-Type'] === 'application/pdf', 'Header Content-Type is application/pdf');
    assert(pdfRes.headers['Content-Disposition']?.includes('attachment;'), 'Header Content-Disposition is attachment');
    assert(pdfRes.headers['Content-Disposition']?.includes('.pdf'), 'Filename ends in .pdf');

    // Wait briefly for PDF chunks to be piped into mockRes
    await new Promise((r) => setTimeout(r, 150));

    const totalPdfBytes = pdfRes.chunks.reduce((sum, c) => sum + c.length, 0);
    assert(totalPdfBytes > 1000, `PDF generated successfully with ${totalPdfBytes} bytes`);

    const pdfBuffer = Buffer.concat(pdfRes.chunks);
    const pdfHeader = pdfBuffer.slice(0, 5).toString('ascii');
    assert(pdfHeader === '%PDF-', 'PDF stream begins with valid %PDF- magic bytes');

    // -------------------------------------------------------------------------
    // Test 14: Cross-User PDF Download Attempt
    // -------------------------------------------------------------------------
    console.log('\n--- Step 14: Cross-User PDF Download Security ---');
    let pdfOtherRes = mockRes();
    await generateBookingConfirmationPdf(
      {
        user: user2,
        params: { bookingId: bookingId.toString() },
      },
      pdfOtherRes
    );
    assert(pdfOtherRes.statusCode === 403, 'Cross-user PDF download rejected with HTTP 403');

    // -------------------------------------------------------------------------
    // Test 15: No Sensitive Financial Credentials Stored in DB
    // -------------------------------------------------------------------------
    console.log('\n--- Step 15: Financial Credential Safety Audit ---');
    const paymentDoc = await Payment.findById(retryPaymentId).lean();
    assert(paymentDoc.cardNumber === undefined, 'No card number field exists on Payment document');
    assert(paymentDoc.cvv === undefined, 'No CVV field exists on Payment document');
    assert(paymentDoc.upiPin === undefined, 'No UPI PIN field exists on Payment document');
    assert(paymentDoc.bankPassword === undefined, 'No bank password field exists on Payment document');
    assert(paymentDoc.testMode === true, 'Payment document strictly marked testMode = true');

  } catch (err) {
    console.error('Unexpected error in test runner:', err);
    failed++;
  } finally {
    await teardown();
  }

  console.log('\n==========================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('==========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
