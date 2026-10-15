import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Trip from '../models/Trip.js';
import Stop from '../models/Stop.js';
import Activity from '../models/Activity.js';
import { runTripAgent } from '../agent/tripAgent.js';
import { approveTripPlan } from '../controllers/agentController.js';
import {
  prepareBooking,
  getBookingById,
  generateBookingConfirmationPdf,
} from '../controllers/bookingController.js';
import {
  createPayment,
  confirmPayment,
  getPaymentById,
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
  console.log('Test MongoDB In-Memory database initialized for Master Audit.');
}

async function teardown() {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
  console.log('Test MongoDB cleaned up.');
}

async function runAudit() {
  console.log('================================================================');
  console.log('🚀 GLOBETHROTTLE COMPLETE AGENTIC WORKFLOW & SECURITY AUDIT');
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
      name: 'Primary Traveler',
      email: 'traveler@globetrotter.demo',
      role: 'user',
    };

    const user2 = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Unauthorized Intruder',
      email: 'intruder@other.com',
      role: 'user',
    };

    // =========================================================================
    // SECTION 1: AGENT LAYER - REQUIREMENT EXTRACTION & MISSING INFO CHECK
    // =========================================================================
    console.log('\n--- AUDIT 1: Natural Language Understanding & Missing Info Detection ---');
    
    // Case 1A: Missing destination
    const vagueRequest = 'Plan a relaxing 4 day trip somewhere peaceful for 2 people under ₹25,000';
    const vagueResult = await runTripAgent(vagueRequest);
    assert(vagueResult.status === 'needs_input', 'Vague request transitions to status: "needs_input"');
    assert(vagueResult.requiresUserInput === true, 'Requires user input flag is strictly true');
    assert(vagueResult.requiresApproval === false, 'Approval flag is false when input is missing');
    assert(
      vagueResult.missingInformation?.some((m) => m.toLowerCase().includes('destination')),
      'Identified missing specific destination city'
    );

    // Case 1B: Valid request with destination, dates, budget
    console.log('\n--- AUDIT 2: Multi-Tool Agent Execution & Deterministic Budget ---');
    const validRequest = 'Plan a 4 day Goa trip from Vadodara for 2 people with a budget of ₹30,000. I love beaches and seafood.';
    const agentResult = await runTripAgent(validRequest);

    assert(agentResult.success === true, 'Agent planning succeeded');
    assert(agentResult.status === 'awaiting_approval', 'Status set to "awaiting_approval"');
    assert(agentResult.requiresApproval === true, 'Approval gate is active (requiresApproval: true)');
    assert(agentResult.requiresUserInput === false, 'No further user input needed');

    // Verify explicit tool usage and results
    assert(Array.isArray(agentResult.transportOptions) && agentResult.transportOptions.length > 0, 'Transport tool executed and returned demo options');
    assert(Array.isArray(agentResult.hotelOptions) && agentResult.hotelOptions.length > 0, 'Hotel tool executed and returned demo accommodation');
    assert(Array.isArray(agentResult.activities) && agentResult.activities.length > 0, 'Activity catalog tool executed and filtered matching activities');
    
    // Verify deterministic budget
    assert(agentResult.budget && typeof agentResult.budget.totalEstimatedCost === 'number', 'Budget calculated deterministically');
    assert(agentResult.budget.withinBudget === true, 'Plan is strictly verified to be within requested budget');
    assert(agentResult.budget.breakdown?.transportation !== undefined, 'Budget includes transport breakdown');
    assert(agentResult.budget.breakdown?.accommodation !== undefined, 'Budget includes accommodation breakdown');
    assert(agentResult.budget.breakdown?.activities !== undefined, 'Budget includes activities breakdown');
    assert(agentResult.budget.breakdown?.food !== undefined, 'Budget includes food estimate');

    // Verify observable execution log (no leaked secrets or reasoning)
    const log = agentResult.agent?.executionLog || [];
    assert(log.length >= 4, `Execution log contains ${log.length} observable steps`);
    const hasPromptLeak = log.some((l) => JSON.stringify(l).includes('OPENAI_API_KEY') || JSON.stringify(l).includes('sk-'));
    assert(!hasPromptLeak, 'Execution log is clean of API keys, secrets, or internal prompts');

    // =========================================================================
    // SECTION 2: RE-PLANNING UNDER TIGHT BUDGET CONSTRAINTS
    // =========================================================================
    console.log('\n--- AUDIT 3: Automatic Re-planning & Constraint Handling ---');
    // Request with very tight budget that triggers automatic re-planning
    const tightRequest = 'Plan a 4 day Goa trip from Vadodara for 2 people with a tight budget of ₹15,000.';
    const tightResult = await runTripAgent(tightRequest);

    const replanLogs = (tightResult.agent?.executionLog || []).filter((l) => l.status === 'replanning' || l.step === 'replanning');
    assert(replanLogs.length > 0 || tightResult.status === 'needs_input', 'Triggered replanning or identified tight budget constraint');

    // Test impossible budget (₹500 for 4 days) -> must not loop infinitely, must return graceful needs_input
    const impossibleRequest = 'Plan a 5 day Goa trip from Vadodara for 2 people under ₹500.';
    const impossibleResult = await runTripAgent(impossibleRequest);
    assert(impossibleResult.status === 'needs_input', 'Impossible budget halts gracefully (status: needs_input)');
    assert(impossibleResult.requiresUserInput === true, 'Asks user to increase budget or relax constraints');
    assert(impossibleResult.requiresApproval === false, 'Cannot approve out-of-budget plan');

    // =========================================================================
    // SECTION 3: APPROVAL GATE & PERSISTENCE IN EXISTING DATABASE
    // =========================================================================
    console.log('\n--- AUDIT 4: User Approval Gate & Existing DB Persistence ---');
    
    // Ensure AI cannot approve without user authentication
    let unauthApproveRes = mockRes();
    await approveTripPlan({ user: null, body: { plan: agentResult } }, unauthApproveRes);
    assert(unauthApproveRes.statusCode === 401, 'Rejects unauthenticated plan approval with 401');

    // Cross-user approval prevention
    let crossApproveRes = mockRes();
    await approveTripPlan(
      {
        user: user2, // user2 attempts to approve user1's payload
        body: { plan: { ...agentResult, userId: user1._id.toString() } },
      },
      crossApproveRes
    );
    assert(crossApproveRes.statusCode === 403, 'Cross-user plan approval rejected with 403 Forbidden');

    // Legitimate Approval by user1
    let approveRes = mockRes();
    await approveTripPlan(
      {
        user: user1,
        body: {
          plan: {
            name: 'Goa Coastal Adventure (4 Days)',
            requirements: agentResult.requirements,
            itinerary: agentResult.itinerary,
            budget: agentResult.budget,
            travelers: agentResult.requirements.travelers,
          },
        },
      },
      approveRes
    );

    assert(approveRes.statusCode === 201, 'Legitimate plan approval succeeded with HTTP 201');
    const approvedTripId = approveRes.body?.tripId;
    assert(approvedTripId !== undefined, 'Returned created tripId');

    // Verify existing models were populated
    const createdTrip = await Trip.findById(approvedTripId);
    assert(createdTrip && createdTrip.user.toString() === user1._id.toString(), 'Trip created in existing Trip model with user1 ownership');
    assert(createdTrip.budgetLimit === agentResult.requirements.budget, 'Trip preserved budgetLimit');
    assert(createdTrip.currency === (agentResult.requirements.currency || 'INR'), 'Trip preserved currency');

    const createdStops = await Stop.find({ trip: approvedTripId });
    assert(createdStops.length > 0, `Created ${createdStops.length} Stop(s) in existing Stop model`);

    const createdActivities = await Activity.find({ trip: approvedTripId });
    assert(createdActivities.length > 0, `Created ${createdActivities.length} Activities in existing Activity model`);

    // Duplicate approval prevention
    let dupApproveRes = mockRes();
    await approveTripPlan(
      {
        user: user1,
        body: {
          plan: {
            name: 'Goa Coastal Adventure (4 Days)',
            requirements: agentResult.requirements,
            itinerary: agentResult.itinerary,
            budget: agentResult.budget,
          },
        },
      },
      dupApproveRes
    );
    assert(dupApproveRes.statusCode === 409, 'Duplicate approval blocked with 409 Conflict');

    // =========================================================================
    // SECTION 4: BOOKING LIFECYCLE (PREPARATION & REVIEW)
    // =========================================================================
    console.log('\n--- AUDIT 5: Booking Preparation, Review & Server Price Enforcement ---');

    const demoTrain = DEMO_TRAINS[0];

    // Client price tampering attempt
    let prepRes = mockRes();
    await prepareBooking(
      {
        user: user1,
        body: {
          tripId: approvedTripId.toString(),
          type: 'transport',
          optionId: demoTrain.id,
          amount: 1, // Malicious client attempt to set 1 INR
        },
      },
      prepRes
    );

    assert(prepRes.statusCode === 201, 'Booking prepared with HTTP 201');
    assert(prepRes.body?.booking?.status === 'pending', 'Booking is in "pending" status');
    assert(prepRes.body?.booking?.amount === demoTrain.price * 2, `Server price enforced (₹${demoTrain.price * 2}), ignoring client tampering`);
    assert(prepRes.body?.booking?.isDemo === true, 'Booking strictly flagged isDemo = true');

    const bookingId = prepRes.body.booking.bookingId;

    // Review booking
    let reviewRes = mockRes();
    await getBookingById(
      {
        user: user1,
        params: { bookingId: bookingId.toString() },
      },
      reviewRes
    );
    assert(reviewRes.statusCode === 200, 'Booking review fetched with HTTP 200');
    assert(reviewRes.body?.booking?.status === 'pending', 'Review displays status as pending');

    // Cross-user access prevention on booking review
    let reviewIntruderRes = mockRes();
    await getBookingById(
      {
        user: user2,
        params: { bookingId: bookingId.toString() },
      },
      reviewIntruderRes
    );
    assert(reviewIntruderRes.statusCode === 403, 'Cross-user review access blocked with 403 Forbidden');

    // =========================================================================
    // SECTION 5: PAYMENT LIFECYCLE & CONFIRMATION
    // =========================================================================
    console.log('\n--- AUDIT 6: Test Payment, Idempotency & Booking Confirmation ---');

    // Create test payment
    let payCreateRes = mockRes();
    await createPayment(
      {
        user: user1,
        body: { bookingId: bookingId.toString() },
      },
      payCreateRes
    );

    assert(payCreateRes.statusCode === 201, 'Test payment record created with HTTP 201');
    assert(payCreateRes.body?.payment?.status === 'created', 'Initial payment status is "created"');
    assert(payCreateRes.body?.payment?.testMode === true, 'Payment testMode is strictly true');
    assert(payCreateRes.body?.payment?.transactionId?.startsWith('TEST-TXN-'), 'Initial test transaction ID generated');

    const paymentId = payCreateRes.body.payment._id;

    // Simulate Payment Failure
    let failRes = mockRes();
    await confirmPayment(
      {
        user: user1,
        params: { paymentId: paymentId.toString() },
        body: { simulateStatus: 'failed' },
      },
      failRes
    );

    assert(failRes.statusCode === 400, 'Simulated failure returned HTTP 400');
    assert(failRes.body?.payment?.status === 'failed', 'Payment status updated to "failed"');
    
    // Booking must NOT be confirmed
    const bookingAfterFail = await Booking.findById(bookingId);
    assert(bookingAfterFail.status === 'pending', 'Booking remains strictly "pending" after failed payment');

    // Retry Payment
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

    // Simulate Payment Success
    let successRes = mockRes();
    await confirmPayment(
      {
        user: user1,
        params: { paymentId: retryPaymentId.toString() },
        body: { simulateStatus: 'success' },
      },
      successRes
    );

    assert(successRes.statusCode === 200, 'Payment confirmed with HTTP 200');
    assert(successRes.body?.payment?.status === 'success', 'Payment status transitioned to "success"');
    assert(successRes.body?.booking?.status === 'confirmed', 'Booking status transitioned to "confirmed"');
    assert(successRes.body?.payment?.transactionId?.startsWith('TEST-TXN-'), 'Fake transaction ID generated');
    assert(successRes.body?.booking?.bookingReference?.length > 5, 'Unique demo booking reference generated');

    // Idempotency: Repeating confirmation request
    let repeatConfirmRes = mockRes();
    await confirmPayment(
      {
        user: user1,
        params: { paymentId: retryPaymentId.toString() },
        body: { simulateStatus: 'success' },
      },
      repeatConfirmRes
    );
    assert(repeatConfirmRes.statusCode === 200, 'Idempotent confirmation call returns HTTP 200 without reprocessing');

    // Cross-user confirmation attempt
    let crossConfirmRes = mockRes();
    await confirmPayment(
      {
        user: user2,
        params: { paymentId: retryPaymentId.toString() },
        body: { simulateStatus: 'success' },
      },
      crossConfirmRes
    );
    assert(crossConfirmRes.statusCode === 403, 'Cross-user confirmation attempt rejected with 403 Forbidden');

    // =========================================================================
    // SECTION 6: DEMO CONFIRMATION PDF GENERATION
    // =========================================================================
    console.log('\n--- AUDIT 7: Demo Confirmation PDF Generation & Security ---');

    let pdfRes = mockRes();
    await generateBookingConfirmationPdf(
      {
        user: user1,
        params: { bookingId: bookingId.toString() },
      },
      pdfRes
    );

    assert(pdfRes.headers['Content-Type'] === 'application/pdf', 'PDF response Content-Type is application/pdf');
    assert(pdfRes.headers['Content-Disposition']?.includes('attachment;'), 'Header forces attachment download');
    
    // Wait for pdfkit stream chunks
    await new Promise((r) => setTimeout(r, 150));
    const pdfBytes = pdfRes.chunks.reduce((acc, c) => acc + c.length, 0);
    assert(pdfBytes > 1000, `Confirmation PDF generated (${pdfBytes} bytes)`);

    // Verify cross-user PDF download denial
    let pdfIntruderRes = mockRes();
    await generateBookingConfirmationPdf(
      {
        user: user2,
        params: { bookingId: bookingId.toString() },
      },
      pdfIntruderRes
    );
    assert(pdfIntruderRes.statusCode === 403, 'Cross-user PDF download denied with 403 Forbidden');

    // =========================================================================
    // SECTION 7: CREDENTIAL & SECRET EXPOSURE AUDIT
    // =========================================================================
    console.log('\n--- AUDIT 8: Security & Secret Audit ---');

    const finalPayment = await Payment.findById(retryPaymentId).lean();
    assert(!finalPayment.cardNumber && !finalPayment.cvv && !finalPayment.upiPin && !finalPayment.password, 'No sensitive financial credentials stored in Payment collection');
    assert(finalPayment.testMode === true, 'Payment is explicitly flagged testMode = true');

  } catch (err) {
    console.error('Audit suite encountered error:', err);
    failed++;
  } finally {
    await teardown();
  }

  console.log('\n================================================================');
  console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAudit();
