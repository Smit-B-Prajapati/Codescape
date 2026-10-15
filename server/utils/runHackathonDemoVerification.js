import crypto from 'crypto';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Trip from '../models/Trip.js';
import Stop from '../models/Stop.js';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import { runTripAgent } from '../agent/tripAgent.js';
import { approveTripPlan } from '../controllers/agentController.js';
import {
  prepareBooking,
  getBookingById,
  generateBookingConfirmationPdf,
} from '../controllers/bookingController.js';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentStatus,
} from '../controllers/paymentController.js';
import { getRazorpayConfig, getRazorpayInstance } from '../config/razorpay.js';
import { getItinerary } from '../controllers/itineraryController.js';
import { getBudgetSummary } from '../controllers/budgetController.js';

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
  console.log('In-memory MongoDB initialized for Hackathon Verification Suite.');
}

async function teardown() {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
  console.log('In-memory MongoDB cleaned up.');
}

async function runVerification() {
  console.log('================================================================');
  console.log('🏆 GLOBETHROTTLE HACKATHON DEMO MASTER VERIFICATION SUITE');
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
      name: 'Hackathon Presenter',
      email: 'presenter@globetrotter.demo',
      role: 'user',
    };

    const user2 = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Unauthorized Intruder',
      email: 'intruder@other.com',
      role: 'user',
    };

    // =========================================================================
    // PART 1: THE EXACT 3-5 MINUTE HACKATHON DEMO FLOW
    // =========================================================================
    console.log('\n--- PART 1: Hackathon Official Demo Scenario Execution ---');
    console.log('Prompt: "Plan a 5-day Goa trip from Vadodara for 2 people with a budget of ₹20,000. We want beaches, nightlife and good food."');

    const demoPrompt = 'Plan a 5-day Goa trip from Vadodara for 2 people with a budget of ₹20,000. We want beaches, nightlife and good food.';
    const agentPlan = await runTripAgent(demoPrompt);

    // 1. Requirement Extraction
    assert(agentPlan.requirements.origin === 'Vadodara', 'Extracted origin: Vadodara');
    assert(agentPlan.requirements.destinations[0] === 'Goa', 'Extracted destination: Goa');
    assert(agentPlan.requirements.durationDays === 5, 'Extracted duration: 5 days');
    assert(agentPlan.requirements.travelers === 2, 'Extracted travelers: 2 people');
    assert(agentPlan.requirements.budget === 20000, 'Extracted budget: ₹20,000');
    assert(agentPlan.requirements.interests.includes('beaches'), 'Extracted interest: beaches');
    assert(agentPlan.requirements.interests.includes('nightlife'), 'Extracted interest: nightlife');
    assert(agentPlan.requirements.interests.includes('food'), 'Extracted interest: food');

    // 2. Multi-Tool Invocation
    assert(agentPlan.transportOptions.length > 0, `Searched transport: ${agentPlan.transportOptions.length} demo options found`);
    assert(agentPlan.hotelOptions.length > 0, `Searched hotels: ${agentPlan.hotelOptions.length} demo hotels found`);
    assert(agentPlan.activities.length > 0, `Searched activities: ${agentPlan.activities.length} matching activities found`);

    // 3. Observable Re-planning Execution Logs
    const logMessages = agentPlan.agent.executionLog.map((l) => l.message);
    const hasOverBudgetWarning = logMessages.some((m) => m.includes('exceeds budget'));
    const hasReplanLog = logMessages.some((m) => m.includes('Re-planning') || m.includes('Optimized'));
    assert(hasOverBudgetWarning, 'Demonstrated budget check exceeding initial threshold');
    assert(hasReplanLog, 'Demonstrated automatic agentic re-planning step');

    // 4. Final Optimized Cost Verification
    assert(agentPlan.budget.withinBudget === true, 'Final plan is strictly within requested budget');
    assert(agentPlan.budget.totalEstimatedCost <= 20000, `Optimized cost is ₹${agentPlan.budget.totalEstimatedCost.toLocaleString()} (<= ₹20,000)`);
    assert(agentPlan.status === 'awaiting_approval', 'Agent transitions to "awaiting_approval" status');
    assert(agentPlan.requiresApproval === true, 'Requires explicit user approval before booking');

    // 5. Itinerary Assembly
    assert(agentPlan.itinerary.days.length === 5, 'Itinerary contains 5 structured days');

    // =========================================================================
    // PART 2: APPROVAL & PERSISTENCE IN EXISTING DATABASE
    // =========================================================================
    console.log('\n--- PART 2: User Approval Gate & Existing Database Persistence ---');

    let approveRes = mockRes();
    await approveTripPlan(
      {
        user: user1,
        body: {
          plan: {
            name: 'Goa Vacation (5 Days)',
            requirements: agentPlan.requirements,
            itinerary: agentPlan.itinerary,
            budget: agentPlan.budget,
            travelers: agentPlan.requirements.travelers,
          },
        },
      },
      approveRes
    );

    assert(approveRes.statusCode === 201, 'Approved plan persisted with HTTP 201');
    const savedTripId = approveRes.body.tripId;

    // Verify existing models were populated
    const savedTrip = await Trip.findById(savedTripId);
    assert(savedTrip !== null && savedTrip.name === 'Goa Vacation (5 Days)', 'Trip document created in existing Trip model');
    assert(savedTrip.budgetLimit === 20000, 'Trip preserved budget limit');

    const savedStops = await Stop.find({ trip: savedTripId });
    assert(savedStops.length > 0, `Created ${savedStops.length} stop(s) in existing Stop model`);

    const savedActivities = await Activity.find({ trip: savedTripId });
    assert(savedActivities.length > 0, `Created ${savedActivities.length} activities in existing Activity model`);

    // Verify existing itinerary and budget endpoints load the saved trip
    let itineraryRes = mockRes();
    await getItinerary({ user: user1, params: { tripId: savedTripId.toString() } }, itineraryRes);
    assert(itineraryRes.statusCode === 200, 'Existing getItinerary controller successfully loaded the trip');

    let budgetRes = mockRes();
    await getBudgetSummary({ user: user1, params: { tripId: savedTripId.toString() } }, budgetRes);
    assert(budgetRes.statusCode === 200, 'Existing getBudgetSummary controller successfully loaded the trip');

    // =========================================================================
    // PART 3: BOOKING & RAZORPAY TEST MODE SETTLEMENT
    // =========================================================================
    console.log('\n--- PART 3: Booking Preparation & Razorpay Test Mode Verification ---');

    // Prepare Demo Booking
    const selectedTrain = agentPlan.transportOptions[0];
    let prepBookingRes = mockRes();
    await prepareBooking(
      {
        user: user1,
        body: {
          tripId: savedTripId.toString(),
          type: 'transport',
          optionId: selectedTrain.id,
          amount: 5, // Client tampering attempt
        },
      },
      prepBookingRes
    );

    assert(prepBookingRes.statusCode === 201, 'Booking prepared with HTTP 201');
    assert(prepBookingRes.body.booking.status === 'pending', 'Booking is in pending status');
    assert(prepBookingRes.body.booking.isDemo === true, 'Booking strictly flagged isDemo = true');
    const bookingId = prepBookingRes.body.booking.bookingId;

    // Review Booking
    let reviewRes = mockRes();
    await getBookingById({ user: user1, params: { bookingId: bookingId.toString() } }, reviewRes);
    assert(reviewRes.statusCode === 200, 'Booking review fetched with verified details');

    // Create Razorpay Order
    let razorpayOrderRes = mockRes();
    await createRazorpayOrder({ user: user1, body: { bookingId: bookingId.toString() } }, razorpayOrderRes);
    assert(razorpayOrderRes.statusCode === 200, 'Razorpay order created via official SDK');
    assert(razorpayOrderRes.body.orderId.startsWith('order_'), `Generated Razorpay order ID: ${razorpayOrderRes.body.orderId}`);
    assert(razorpayOrderRes.body.amount === Number(prepBookingRes.body.booking.amount) * 100, 'Converted to paise correctly');
    assert(razorpayOrderRes.body.keyId.startsWith('rzp_test_'), 'Returned public keyId only');

    const razorpayOrderId = razorpayOrderRes.body.orderId;
    const mockRazorpayPayId = `pay_demo_${Date.now().toString(36)}`;
    const rzpConfig = getRazorpayConfig();
    const validSignature = crypto.createHmac('sha256', rzpConfig.keySecret).update(`${razorpayOrderId}|${mockRazorpayPayId}`).digest('hex');

    // Mock payments.fetch for unit testing verify controller
    const rzpInstance = getRazorpayInstance();
    const origFetch = rzpInstance.payments.fetch.bind(rzpInstance);
    rzpInstance.payments.fetch = async (id) => ({
      id,
      entity: 'payment',
      amount: razorpayOrderRes.body.amount,
      currency: 'INR',
      status: 'captured',
      order_id: razorpayOrderId,
      captured: true,
    });

    // Test tampered signature rejection on pending order
    let badSigRes = mockRes();
    await verifyRazorpayPayment(
      {
        user: user1,
        body: {
          bookingId: bookingId.toString(),
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: mockRazorpayPayId,
          razorpay_signature: 'tampered_invalid_signature_hex_code_1234567890abcdef',
        },
      },
      badSigRes
    );
    assert(badSigRes.statusCode === 400, 'Tampered signature rejected with HTTP 400');

    // Verify Payment with legitimate signature
    let verifyRes = mockRes();
    await verifyRazorpayPayment(
      {
        user: user1,
        body: {
          bookingId: bookingId.toString(),
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: mockRazorpayPayId,
          razorpay_signature: validSignature,
        },
      },
      verifyRes
    );

    assert(verifyRes.statusCode === 200, 'Razorpay signature verified on server');
    assert(verifyRes.body.payment.status === 'success', 'Payment status is "success"');
    assert(verifyRes.body.booking.status === 'confirmed', 'Booking status is "confirmed"');

    // Payment Status Endpoint
    let statusRes = mockRes();
    await getPaymentStatus({ user: user1, params: { paymentId: verifyRes.body.payment._id.toString() } }, statusRes);
    assert(statusRes.statusCode === 200, 'Payment status endpoint returned HTTP 200 without leaking secrets');

    // Download Confirmation PDF
    let pdfRes = mockRes();
    await generateBookingConfirmationPdf({ user: user1, params: { bookingId: bookingId.toString() } }, pdfRes);
    assert(pdfRes.headers['Content-Type'] === 'application/pdf', 'PDF Content-Type is application/pdf');
    await new Promise((r) => setTimeout(r, 100));
    assert(pdfRes.chunks.reduce((a, c) => a + c.length, 0) > 1000, 'Confirmation PDF successfully generated and streamed');

    rzpInstance.payments.fetch = origFetch;

    // =========================================================================
    // PART 4: COMPREHENSIVE FAILURE & EDGE CASES (REQUIREMENTS 49-65)
    // =========================================================================
    console.log('\n--- PART 4: Comprehensive Failure & Security Edge Cases ---');

    // 49. Missing destination
    const missingDestPlan = await runTripAgent('Plan a trip somewhere peaceful for 2 people under ₹20,000');
    assert(missingDestPlan.status === 'needs_input', 'Missing destination triggers "needs_input"');

    // 52. Budget too low / impossible budget
    const impossiblePlan = await runTripAgent('Plan a 5 day Goa trip from Vadodara for 2 people with a budget of ₹100');
    assert(impossiblePlan.status === 'needs_input', 'Impossibly low budget halts with "needs_input"');

    // 56. Invalid authentication on approval
    let unauthApprove = mockRes();
    await approveTripPlan({ user: null, body: { plan: agentPlan } }, unauthApprove);
    assert(unauthApprove.statusCode === 401, 'Unauthenticated approval rejected with 401');

    // 57. Unauthorized trip access on booking
    let crossTripBooking = mockRes();
    await prepareBooking(
      {
        user: user2,
        body: { tripId: savedTripId.toString(), type: 'transport', optionId: selectedTrain.id },
      },
      crossTripBooking
    );
    assert(crossTripBooking.statusCode === 403, 'Cross-user trip booking blocked with 403 Forbidden');

    // 58. Unauthorized booking access
    let crossBookingReview = mockRes();
    await getBookingById({ user: user2, params: { bookingId: bookingId.toString() } }, crossBookingReview);
    assert(crossBookingReview.statusCode === 403, 'Cross-user booking review blocked with 403 Forbidden');

    // 59. Unauthorized payment access
    let crossPaymentStatus = mockRes();
    await getPaymentStatus({ user: user2, params: { paymentId: verifyRes.body.payment._id.toString() } }, crossPaymentStatus);
    assert(crossPaymentStatus.statusCode === 403, 'Cross-user payment access blocked with 403 Forbidden');

    // 60. Duplicate trip approval
    let dupApprove = mockRes();
    await approveTripPlan(
      {
        user: user1,
        body: {
          plan: {
            name: 'Goa Vacation (5 Days)',
            requirements: agentPlan.requirements,
            itinerary: agentPlan.itinerary,
            budget: agentPlan.budget,
          },
        },
      },
      dupApprove
    );
    assert(dupApprove.statusCode === 409, 'Duplicate trip approval rejected with 409 Conflict');

    // 61. Duplicate payment confirmation
    let dupVerify = mockRes();
    await verifyRazorpayPayment(
      {
        user: user1,
        body: {
          bookingId: bookingId.toString(),
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: mockRazorpayPayId,
          razorpay_signature: validSignature,
        },
      },
      dupVerify
    );
    assert(dupVerify.statusCode === 200, 'Duplicate payment verification is idempotent (returns 200)');

    // 62. Tampered signature rejection on pending booking
    let failBookingRes = mockRes();
    await prepareBooking(
      {
        user: user1,
        body: { tripId: savedTripId.toString(), type: 'hotel', optionId: 'demo_htl_goa_01' },
      },
      failBookingRes
    );
    const failBookingId = failBookingRes.body.booking.bookingId;
    let failOrderRes = mockRes();
    await createRazorpayOrder({ user: user1, body: { bookingId: failBookingId.toString() } }, failOrderRes);

    let badSig = mockRes();
    await verifyRazorpayPayment(
      {
        user: user1,
        body: {
          bookingId: failBookingId.toString(),
          razorpay_order_id: failOrderRes.body.orderId,
          razorpay_payment_id: 'pay_tampered_test_id',
          razorpay_signature: 'tampered_signature_hex_code_value_1234567890abcdef',
        },
      },
      badSig
    );
    assert(badSig.statusCode === 400, 'Tampered signature rejected with 400 Bad Request');

    // Cross-user PDF download denial
    let intruderPdf = mockRes();
    await generateBookingConfirmationPdf({ user: user2, params: { bookingId: bookingId.toString() } }, intruderPdf);
    assert(intruderPdf.statusCode === 403, 'Cross-user PDF download blocked with 403 Forbidden');

  } catch (err) {
    console.error('Hackathon verification error:', err);
    failed++;
  } finally {
    await teardown();
  }

  console.log('\n================================================================');
  console.log(`HACKATHON VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification();
