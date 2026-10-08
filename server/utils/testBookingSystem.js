import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Booking from '../models/Booking.js';
import Trip from '../models/Trip.js';
import Stop from '../models/Stop.js';
import {
  prepareBooking,
  getBookingById,
  confirmBooking,
  getUserBookings,
} from '../controllers/bookingController.js';
import { DEMO_TRAINS } from '../data/trains.js';
import { DEMO_HOTELS } from '../data/hotels.js';

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
  console.log('Test MongoDB In-Memory database initialized.');
}

async function teardown() {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
  console.log('Test MongoDB database cleaned up.');
}

async function runTests() {
  console.log('==========================================================');
  console.log('🧪 Starting Demo Booking System & Review Verification Suite');
  console.log('==========================================================\n');

  await setup();

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

  // Create a sample Trip for user1
  const sampleTrip = await Trip.create({
    user: user1._id,
    name: 'Vadodara to Goa Winter Escape',
    description: 'Scenic holiday trip from Gujarat to Goa',
    startDate: new Date('2026-11-10'),
    endDate: new Date('2026-11-14'), // 4 nights
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

  const validTrain = DEMO_TRAINS[0]; // demo_trn_12450 (1450 INR)
  const validHotel = DEMO_HOTELS[0]; // demo_htl_goa_01 (2800 INR per night)

  // -------------------------------------------------------------------------
  // Test 1: Authentication Requirement
  // -------------------------------------------------------------------------
  console.log('Test 1: Rejects unauthenticated booking preparation...');
  {
    const req = {
      user: null,
      body: { tripId: sampleTrip._id, type: 'transport', optionId: validTrain.id },
    };
    const res = mockRes();
    await prepareBooking(req, res);

    if (res.statusCode === 401 && res.body.success === false) {
      console.log('  ✅ Passed: Blocked unauthenticated access with 401');
    } else {
      throw new Error(`Test 1 Failed: Got ${res.statusCode} ${JSON.stringify(res.body)}`);
    }
  }

  // -------------------------------------------------------------------------
  // Test 2: Trip Ownership Validation
  // -------------------------------------------------------------------------
  console.log("Test 2: Forbids booking preparation for another user's trip...");
  {
    const req = {
      user: user2, // user 2 tries to prepare booking for user 1's trip!
      body: { tripId: sampleTrip._id, type: 'transport', optionId: validTrain.id },
    };
    const res = mockRes();
    await prepareBooking(req, res);

    if (res.statusCode === 403 && res.body.success === false) {
      console.log('  ✅ Passed: Blocked cross-user booking with 403 Forbidden');
    } else {
      throw new Error(`Test 2 Failed: Got ${res.statusCode} ${JSON.stringify(res.body)}`);
    }
  }

  // -------------------------------------------------------------------------
  // Test 3: Validation of Booking Type
  // -------------------------------------------------------------------------
  console.log('Test 3: Rejects invalid booking type...');
  {
    const req = {
      user: user1,
      body: { tripId: sampleTrip._id, type: 'invalid_type', optionId: validTrain.id },
    };
    const res = mockRes();
    await prepareBooking(req, res);

    if (res.statusCode === 400 && res.body.success === false) {
      console.log('  ✅ Passed: Blocked invalid booking type with 400');
    } else {
      throw new Error(`Test 3 Failed: Got ${res.statusCode} ${JSON.stringify(res.body)}`);
    }
  }

  // -------------------------------------------------------------------------
  // Test 4: Validation Against Trusted Backend Data (Fake option rejection)
  // -------------------------------------------------------------------------
  console.log('Test 4: Rejects fake or untrusted option ID...');
  {
    const req = {
      user: user1,
      body: { tripId: sampleTrip._id, type: 'transport', optionId: 'untrusted_fake_train_999' },
    };
    const res = mockRes();
    await prepareBooking(req, res);

    if (res.statusCode === 404 && res.body.success === false) {
      console.log('  ✅ Passed: Blocked untrusted optionId with 404');
    } else {
      throw new Error(`Test 4 Failed: Got ${res.statusCode} ${JSON.stringify(res.body)}`);
    }
  }

  // -------------------------------------------------------------------------
  // Test 5: Backend Price Calculation & Tamper Resistance
  // -------------------------------------------------------------------------
  console.log('Test 5: Calculates amount strictly from backend data (never trusts client amount)...');
  let preparedTransportBookingId;
  {
    // Client attempts to send fake amount: 1 INR
    const req = {
      user: user1,
      body: {
        tripId: sampleTrip._id,
        type: 'transport',
        optionId: validTrain.id,
        amount: 1, // Malicious client attempt!
      },
    };
    const res = mockRes();
    await prepareBooking(req, res);

    const expectedAmount = validTrain.price * sampleTrip.travelers.length; // 1450 * 2 = 2900

    if (
      res.statusCode === 201 &&
      res.body.success === true &&
      res.body.booking.status === 'pending' &&
      res.body.booking.isDemo === true &&
      res.body.booking.amount === expectedAmount &&
      res.body.booking.bookingReference.startsWith('DEMO-BK-')
    ) {
      preparedTransportBookingId = res.body.booking.bookingId;
      console.log(`  ✅ Passed: Ignored client amount (1 INR); calculated verified ${expectedAmount} INR (₹${validTrain.price} × 2 travelers)`);
      console.log(`     Booking Ref: ${res.body.booking.bookingReference}`);
    } else {
      throw new Error(`Test 5 Failed: Got ${res.statusCode} ${JSON.stringify(res.body)}`);
    }
  }

  // -------------------------------------------------------------------------
  // Test 6: Duplicate Booking Prevention
  // -------------------------------------------------------------------------
  console.log('Test 6: Prevents duplicate booking creation within recent window...');
  {
    const req = {
      user: user1,
      body: { tripId: sampleTrip._id, type: 'transport', optionId: validTrain.id },
    };
    const res = mockRes();
    await prepareBooking(req, res);

    if (
      res.statusCode === 200 &&
      res.body.success === true &&
      res.body.isExisting === true &&
      res.body.booking.bookingId.toString() === preparedTransportBookingId.toString()
    ) {
      console.log('  ✅ Passed: Returned existing pending booking without creating duplicate DB entry');
    } else {
      throw new Error(`Test 6 Failed: Got ${res.statusCode} ${JSON.stringify(res.body)}`);
    }
  }

  // -------------------------------------------------------------------------
  // Test 7: Hotel Booking Preparation
  // -------------------------------------------------------------------------
  console.log('Test 7: Prepares hotel booking with deterministic nights calculation...');
  let preparedHotelBookingId;
  {
    const req = {
      user: user1,
      body: { tripId: sampleTrip._id, type: 'hotel', optionId: validHotel.id },
    };
    const res = mockRes();
    await prepareBooking(req, res);

    // 4 nights * 2800 = 11200
    const expectedHotelCost = validHotel.pricePerNight * 4;

    if (
      res.statusCode === 201 &&
      res.body.success === true &&
      res.body.booking.status === 'pending' &&
      res.body.booking.amount === expectedHotelCost &&
      res.body.booking.details.nights === 4
    ) {
      preparedHotelBookingId = res.body.booking.bookingId;
      console.log(`  ✅ Passed: Hotel booking prepared with ${expectedHotelCost} INR (4 nights × ₹${validHotel.pricePerNight})`);
    } else {
      throw new Error(`Test 7 Failed: Got ${res.statusCode} ${JSON.stringify(res.body)}`);
    }
  }

  // -------------------------------------------------------------------------
  // Test 8: Get Booking Details for Review Page & Cross-User Privacy
  // -------------------------------------------------------------------------
  console.log('Test 8: Fetch booking details for review page and enforce privacy...');
  {
    // Intruder attempts to fetch user1's booking
    const intruderReq = {
      user: user2,
      params: { bookingId: preparedTransportBookingId },
    };
    const intruderRes = mockRes();
    await getBookingById(intruderReq, intruderRes);

    if (intruderRes.statusCode === 403 && intruderRes.body.success === false) {
      console.log('  ✅ Passed: Intruder access blocked with 403 Forbidden');
    } else {
      throw new Error(`Test 8 Intruder Check Failed: Got ${intruderRes.statusCode}`);
    }

    // Legitimate owner fetches booking
    const ownerReq = {
      user: user1,
      params: { bookingId: preparedTransportBookingId },
    };
    const ownerRes = mockRes();
    await getBookingById(ownerReq, ownerRes);

    if (
      ownerRes.statusCode === 200 &&
      ownerRes.body.success === true &&
      ownerRes.body.booking.trip.destination === 'Goa' &&
      ownerRes.body.booking.trip.travelerCount === 2 &&
      ownerRes.body.booking.isDemo === true
    ) {
      console.log('  ✅ Passed: Retrieved verified booking with destination "Goa", 2 travelers, and demo flag');
    } else {
      throw new Error(`Test 8 Owner Check Failed: Got ${ownerRes.statusCode} ${JSON.stringify(ownerRes.body)}`);
    }
  }

  // -------------------------------------------------------------------------
  // Test 9: Confirmation Protection (Payment verification check)
  // -------------------------------------------------------------------------
  console.log('Test 9: Forbids marking booking confirmed without completed test payment token...');
  {
    // Try to confirm without payment token
    const unverifiedReq = {
      user: user1,
      params: { bookingId: preparedTransportBookingId },
      body: {}, // Missing payment token!
    };
    const unverifiedRes = mockRes();
    await confirmBooking(unverifiedReq, unverifiedRes);

    if (unverifiedRes.statusCode === 402 && unverifiedRes.body.success === false) {
      console.log('  ✅ Passed: Blocked confirmation without test payment token with 402 Payment Required');
    } else {
      throw new Error(`Test 9 Failed: Got ${unverifiedRes.statusCode} ${JSON.stringify(unverifiedRes.body)}`);
    }

    // Now test with valid test payment simulation token
    const testPaymentToken = 'TEST_PAY_TOKEN_' + Math.random().toString(36).substring(2, 10);
    const validConfirmReq = {
      user: user1,
      params: { bookingId: preparedTransportBookingId },
      body: { testPaymentToken, paymentStatus: 'completed' },
    };
    const validConfirmRes = mockRes();
    await confirmBooking(validConfirmReq, validConfirmRes);

    if (
      validConfirmRes.statusCode === 200 &&
      validConfirmRes.body.success === true &&
      validConfirmRes.body.booking.status === 'confirmed'
    ) {
      console.log('  ✅ Passed: Booking confirmed after valid test payment verification');
    } else {
      throw new Error(`Test 9 Confirmation Failed: Got ${validConfirmRes.statusCode}`);
    }
  }

  // -------------------------------------------------------------------------
  // Test 10: List User Bookings
  // -------------------------------------------------------------------------
  console.log('Test 10: Retrieve all user bookings...');
  {
    const req = { user: user1 };
    const res = mockRes();
    await getUserBookings(req, res);

    if (res.statusCode === 200 && res.body.success === true && res.body.count === 2) {
      console.log(`  ✅ Passed: Retrieved ${res.body.count} demo bookings for user`);
    } else {
      throw new Error(`Test 10 Failed: Got ${res.statusCode} ${JSON.stringify(res.body)}`);
    }
  }

  await teardown();
  console.log('\n==========================================================');
  console.log('🎉 ALL 10 TESTS PASSED! Demo Booking System is fully verified.');
  console.log('==========================================================');
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
