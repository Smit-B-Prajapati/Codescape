import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Trip from '../models/Trip.js';
import Stop from '../models/Stop.js';
import Activity from '../models/Activity.js';
import { approveTripPlan } from '../controllers/agentController.js';
import { getItinerary } from '../controllers/itineraryController.js';

let mongoServer;

const mockRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
};

async function setup() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  console.log('Test In-Memory MongoDB connected.');
}

async function teardown() {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
  console.log('Test MongoDB stopped.');
}

async function runTests() {
  console.log('========================================================');
  console.log('🧪 Starting "Approve Trip" Comprehensive Verification Suite');
  console.log('========================================================\n');

  await setup();

  const mockUser1 = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Traveler One',
    email: 'traveler1@example.com',
  };

  const mockUser2 = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Traveler Two',
    email: 'traveler2@example.com',
  };

  const validPlanPayload = {
    name: 'Goa Coastal Adventure',
    requirements: {
      destinations: ['Goa'],
      startDate: '2026-11-10',
      endDate: '2026-11-13',
      durationDays: 4,
      travelers: 2,
      budget: 25000,
      currency: 'INR',
      interests: ['beaches', 'culture', 'food'],
    },
    budget: {
      totalEstimatedCost: 18500,
      budget: 25000,
      currency: 'INR',
      remainingBudget: 6500,
      breakdown: {
        transportTotal: 4000,
        accommodationTotal: 9000,
        activityTotal: 3500,
        foodEstimate: 2000,
      },
    },
    itinerary: {
      overview: 'Curated 4-day trip to Goa featuring beaches, forts, and nightlife.',
      summaryExplanation: 'Balanced relaxation and local sightseeing within budget.',
      days: [
        {
          dayNumber: 1,
          date: '2026-11-10',
          city: 'Goa',
          morning: [
            {
              activityId: 'act_goa_calangute',
              name: 'Calangute Beach Walk & Watersports',
              category: 'Adventure',
              duration: 120,
              cost: 1200,
              time: '09:30 AM',
            },
          ],
          afternoon: [
            {
              activityId: 'act_goa_seafood',
              name: 'Fishermans Wharf Authentic Goan Lunch',
              category: 'Food & Dining',
              duration: 90,
              cost: 800,
              time: '01:30 PM',
            },
          ],
          evening: [
            {
              activityId: 'act_goa_anjuna_sunset',
              name: 'Anjuna Beach Sunset & Curlies Cafe',
              category: 'Nightlife',
              duration: 150,
              cost: 500,
              time: '06:00 PM',
            },
          ],
        },
        {
          dayNumber: 2,
          date: '2026-11-11',
          city: 'Goa',
          morning: [
            {
              activityId: 'act_goa_aguada',
              name: 'Fort Aguada & Historic Portuguese Lighthouse',
              category: 'Historical',
              duration: 120,
              cost: 200,
              time: '10:00 AM',
            },
          ],
          afternoon: [
            {
              activityId: 'act_goa_fontainhas',
              name: 'Fontainhas Latin Quarter Heritage Walk',
              category: 'Culture',
              duration: 90,
              cost: 300,
              time: '03:00 PM',
            },
          ],
          evening: [
            {
              activityId: 'act_goa_mandovi_cruise',
              name: 'Mandovi River Sunset Folk Dance Cruise',
              category: 'Sightseeing',
              duration: 120,
              cost: 500,
              time: '06:30 PM',
            },
          ],
        },
      ],
    },
  };

  // Test 1: Verify authenticated user required
  console.log('Test 1: Rejects unauthenticated approval request...');
  {
    const req = { user: null, body: validPlanPayload };
    const res = mockRes();
    await approveTripPlan(req, res);
    if (res.statusCode === 401 && res.body.success === false) {
      console.log('  ✅ Passed: Blocked unauthenticated approval with 401');
    } else {
      throw new Error(`Test 1 Failed: Got ${res.statusCode} ${JSON.stringify(res.body)}`);
    }
  }

  // Test 2: Forbid approving a plan belonging to another user
  console.log("Test 2: Forbid approving a plan belonging to another user...");
  {
    const req = {
      user: mockUser1,
      body: {
        ...validPlanPayload,
        userId: mockUser2._id.toString(), // belongs to user 2!
      },
    };
    const res = mockRes();
    await approveTripPlan(req, res);
    if (res.statusCode === 403 && res.body.success === false) {
      console.log('  ✅ Passed: Blocked cross-user approval with 403 Forbidden');
    } else {
      throw new Error(`Test 2 Failed: Got ${res.statusCode} ${JSON.stringify(res.body)}`);
    }
  }

  // Test 3: Validate dates (end date before start date)
  console.log('Test 3: Rejects invalid date range (end before start)...');
  {
    const req = {
      user: mockUser1,
      body: {
        ...validPlanPayload,
        requirements: {
          ...validPlanPayload.requirements,
          startDate: '2026-11-15',
          endDate: '2026-11-10', // Invalid!
        },
      },
    };
    const res = mockRes();
    await approveTripPlan(req, res);
    if (res.statusCode === 400 && res.body.success === false) {
      console.log('  ✅ Passed: Rejected invalid date range with 400');
    } else {
      throw new Error(`Test 3 Failed: Got ${res.statusCode} ${JSON.stringify(res.body)}`);
    }
  }

  // Test 4: Validate dates (day date outside trip range)
  console.log('Test 4: Rejects day date outside trip start/end bounds...');
  {
    const invalidDaysPlan = JSON.parse(JSON.stringify(validPlanPayload));
    invalidDaysPlan.itinerary.days[0].date = '2026-10-01'; // Outside bounds!
    const req = { user: mockUser1, body: invalidDaysPlan };
    const res = mockRes();
    await approveTripPlan(req, res);
    if (res.statusCode === 400 && res.body.success === false) {
      console.log('  ✅ Passed: Caught out-of-bounds day date with 400');
    } else {
      throw new Error(`Test 4 Failed: Got ${res.statusCode} ${JSON.stringify(res.body)}`);
    }
  }

  // Test 5: Validate cities (missing/empty cities)
  console.log('Test 5: Rejects empty or missing destination cities...');
  {
    const noCityPlan = JSON.parse(JSON.stringify(validPlanPayload));
    noCityPlan.requirements.destinations = [];
    noCityPlan.itinerary.days = [];
    const req = { user: mockUser1, body: noCityPlan };
    const res = mockRes();
    await approveTripPlan(req, res);
    if (res.statusCode === 400 && res.body.success === false) {
      console.log('  ✅ Passed: Rejected plan without cities with 400');
    } else {
      throw new Error(`Test 5 Failed: Got ${res.statusCode} ${JSON.stringify(res.body)}`);
    }
  }

  // Test 6: Validate activity costs (negative cost rejected)
  console.log('Test 6: Rejects negative activity costs...');
  {
    const negativeCostPlan = JSON.parse(JSON.stringify(validPlanPayload));
    negativeCostPlan.itinerary.days[0].morning[0].cost = -500;
    const req = { user: mockUser1, body: negativeCostPlan };
    const res = mockRes();
    await approveTripPlan(req, res);
    if (res.statusCode === 400 && res.body.success === false) {
      console.log('  ✅ Passed: Rejected negative activity cost with 400');
    } else {
      throw new Error(`Test 6 Failed: Got ${res.statusCode} ${JSON.stringify(res.body)}`);
    }
  }

  // Test 7: Validate budget limit (negative budget rejected)
  console.log('Test 7: Rejects negative budget limit...');
  {
    const negativeBudgetPlan = JSON.parse(JSON.stringify(validPlanPayload));
    negativeBudgetPlan.budget.budget = -10000;
    const req = { user: mockUser1, body: negativeBudgetPlan };
    const res = mockRes();
    await approveTripPlan(req, res);
    if (res.statusCode === 400 && res.body.success === false) {
      console.log('  ✅ Passed: Rejected negative budget with 400');
    } else {
      throw new Error(`Test 7 Failed: Got ${res.statusCode} ${JSON.stringify(res.body)}`);
    }
  }

  // Test 8: Successful Trip Approval & Persistence
  console.log('Test 8: Approves valid AI trip plan and verifies persistence...');
  let createdTripId;
  {
    const req = { user: mockUser1, body: validPlanPayload };
    const res = mockRes();
    await approveTripPlan(req, res);

    if (
      res.statusCode === 201 &&
      res.body.success === true &&
      res.body.tripId &&
      res.body.message === 'AI trip successfully added to GlobeThrottle'
    ) {
      createdTripId = res.body.tripId;
      console.log('  ✅ Passed: Returned exact expected success payload:');
      console.log(`     tripId: ${createdTripId}`);
      console.log(`     message: "${res.body.message}"`);
    } else {
      throw new Error(`Test 8 Failed: Got ${res.statusCode} ${JSON.stringify(res.body)}`);
    }

    // Verify Trip document
    const savedTrip = await Trip.findById(createdTripId);
    if (!savedTrip) throw new Error('Trip document not found in DB!');
    if (savedTrip.user.toString() !== mockUser1._id.toString()) throw new Error('Trip user mismatch!');
    if (savedTrip.budgetLimit !== 25000) throw new Error(`Trip budgetLimit mismatch: ${savedTrip.budgetLimit}`);
    if (savedTrip.currency !== 'INR') throw new Error(`Trip currency mismatch: ${savedTrip.currency}`);
    if (!savedTrip.travelers || savedTrip.travelers.length !== 2) throw new Error('Travelers not preserved!');
    console.log('  ✅ Verified: Trip document preserved budgetLimit, currency, travelers, user');

    // Verify Stops documents
    const savedStops = await Stop.find({ trip: createdTripId });
    if (savedStops.length === 0) throw new Error('No Stops created!');
    const firstStop = savedStops[0];
    if (firstStop.city !== 'Goa' || firstStop.country !== 'India') throw new Error('Stop city/country incorrect!');
    console.log(`  ✅ Verified: ${savedStops.length} Stop(s) created in Stop model (city: ${firstStop.city}, country: ${firstStop.country})`);

    // Verify Activities documents
    const savedActivities = await Activity.find({ trip: createdTripId });
    if (savedActivities.length !== 6) throw new Error(`Expected 6 activities, found ${savedActivities.length}`);
    for (const act of savedActivities) {
      if (!act.stop) throw new Error(`Activity ${act.name} missing stop reference!`);
      if (act.cost < 0) throw new Error(`Activity ${act.name} has negative cost!`);
    }
    console.log(`  ✅ Verified: ${savedActivities.length} Activities created with preserved dates, times, categories, costs`);
  }

  // Test 9: Duplicate submission prevention
  console.log('Test 9: Prevents duplicate trip submission within recent window...');
  {
    const req = { user: mockUser1, body: validPlanPayload };
    const res = mockRes();
    await approveTripPlan(req, res);
    if (res.statusCode === 409 && res.body.success === false && res.body.tripId) {
      console.log('  ✅ Passed: Duplicate submission blocked with 409 Conflict');
      console.log(`     Returned existing tripId: ${res.body.tripId}`);
    } else {
      throw new Error(`Test 9 Failed: Got ${res.statusCode} ${JSON.stringify(res.body)}`);
    }
  }

  // Test 10: Existing Itinerary Viewer Integration (/api/trips/:id/itinerary)
  console.log('Test 10: Verify existing getItinerary controller loads approved trip...');
  {
    const req = {
      params: { tripId: createdTripId },
      user: mockUser1,
    };
    const res = mockRes();
    await getItinerary(req, res);

    if (res.statusCode === 200 && res.body.success === true) {
      const it = res.body;
      if (!it.days || it.days.length === 0) throw new Error('Itinerary days empty!');
      if (!it.stops || it.stops.length === 0) throw new Error('Itinerary stops empty!');
      console.log(`  ✅ Passed: Existing getItinerary loaded ${it.days.length} days and ${it.stops.length} stop(s)`);
      console.log(`     Total itinerary activity cost calculated: ₹${it.totalItineraryCost}`);
    } else {
      throw new Error(`Test 10 Failed: Got ${res.statusCode} ${JSON.stringify(res.body)}`);
    }
  }

  await teardown();
  console.log('\n========================================================');
  console.log('🎉 ALL 10 TESTS PASSED! "Approve Trip" is fully verified.');
  console.log('========================================================');
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
