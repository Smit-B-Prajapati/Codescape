import 'dotenv/config';
import assert from 'assert';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/User.js';
import Trip from '../models/Trip.js';
import Stop from '../models/Stop.js';
import Activity from '../models/Activity.js';
import { runTripAgent } from '../agent/tripAgent.js';
import { calculateTripEstimate, allocateTripBudget } from '../services/budgetService.js';
import { convertCost, searchCatalogActivities, estimateTripCost } from '../agent/agentTools.js';
import { standardizeActivityPricing, isIndianDestination } from '../services/activityPricingService.js';
import { ACTIVITIES_CATALOG } from '../controllers/activityController.js';
import { getItinerary } from '../controllers/itineraryController.js';

let mongod;

async function runAllTests() {
  console.log('================================================================');
  console.log(' GLOBETROTTER AI TRIP AGENT: 10 SCENARIO VERIFICATION SUITE');
  console.log('================================================================\n');

  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  // -------------------------------------------------------------
  // TEST A: A low-budget trip (5 days, ₹10,000 total budget)
  // -------------------------------------------------------------
  console.log('--- [TEST A] Low-budget trip (5 days, ₹10,000 budget) ---');
  const planA = await runTripAgent({
    destination: 'Udaipur',
    origin: 'Vadodara',
    durationDays: 5,
    travelers: 1,
    budget: 10000,
    currency: 'INR',
    interests: ['sightseeing', 'culture'],
  });

  assert(planA.success, 'Plan A must succeed');
  console.log(`  Total Estimated Cost: ₹${planA.budget.totalEstimatedCost}`);
  console.log(`  Activity Total: ₹${planA.budget.breakdown.activityTotal}`);
  console.log(`  Accommodation Total: ₹${planA.budget.breakdown.accommodationTotal}`);
  assert(planA.budget.breakdown.activityTotal < 3500, `Low budget activity total should be affordable (< ₹3500), got ₹${planA.budget.breakdown.activityTotal}`);
  assert(planA.budget.totalEstimatedCost <= 10000 || planA.budget.shortfall >= 0, 'Plan A must be budget-aware');
  console.log('  PASS: Low-budget trip prioritizes affordable/free experiences.\n');

  // -------------------------------------------------------------
  // TEST B: A medium-budget trip (5 days, ₹20,000 total budget)
  // -------------------------------------------------------------
  console.log('--- [TEST B] Medium-budget trip (5 days, ₹20,000 budget) ---');
  const planB = await runTripAgent({
    destination: 'Udaipur',
    origin: 'Vadodara',
    durationDays: 5,
    travelers: 1,
    budget: 20000,
    currency: 'INR',
    interests: ['heritage', 'lakes', 'dining'],
  });

  assert(planB.success, 'Plan B must succeed');
  console.log(`  Total Estimated Cost: ₹${planB.budget.totalEstimatedCost}`);
  console.log(`  Activity Total: ₹${planB.budget.breakdown.activityTotal}`);
  console.log(`  Accommodation Total: ₹${planB.budget.breakdown.accommodationTotal}`);
  assert(planB.budget.totalEstimatedCost <= 20000, `Medium budget should fit within ₹20,000, got ₹${planB.budget.totalEstimatedCost}`);
  console.log('  PASS: Medium-budget plan generated with reasonable destination costs.\n');

  // -------------------------------------------------------------
  // TEST C: A higher-budget trip (5 days, ₹50,000 budget, 5 travelers)
  // -------------------------------------------------------------
  console.log('--- [TEST C] Higher-budget trip (5 days, ₹50,000 budget, 5 travelers) ---');
  const planC = await runTripAgent({
    destination: 'Udaipur',
    origin: 'Vadodara',
    durationDays: 5,
    travelers: 5,
    budget: 50000,
    currency: 'INR',
    interests: ['palaces', 'culture', 'lakes'],
  });

  assert(planC.success, 'Plan C must succeed');
  console.log(`  Total Estimated Cost: ₹${planC.budget.totalEstimatedCost} (Budget: ₹50,000)`);
  console.log(`  Activity Total: ₹${planC.budget.breakdown.activityTotal}`);
  console.log(`  Accommodation Total: ₹${planC.budget.breakdown.accommodationTotal}`);
  // In the original bug, activities alone were ₹87,565 and total was ₹1,22,465!
  assert(planC.budget.breakdown.activityTotal < 25000, `Activities must NOT be inflated to ₹87,565! Got ₹${planC.budget.breakdown.activityTotal}`);
  assert(planC.budget.totalEstimatedCost < 65000, `Total cost must not explode to ₹1,22,465! Got ₹${planC.budget.totalEstimatedCost}`);
  console.log('  PASS: Higher-budget 5-traveler trip keeps realistic activity prices without artificial inflation.\n');

  // -------------------------------------------------------------
  // TEST D: A free-experience preference
  // -------------------------------------------------------------
  console.log('--- [TEST D] Free-experience preference ---');
  const planD = await runTripAgent({
    destination: 'Udaipur',
    durationDays: 3,
    travelers: 1,
    budget: 8000,
    currency: 'INR',
    interests: ['free attractions', 'lakes', 'ghats', 'walking'],
  });

  assert(planD.success, 'Plan D must succeed');
  let freeCount = 0;
  let totalActs = 0;
  planD.itinerary.days.forEach(day => {
    ['morning', 'afternoon', 'evening'].forEach(slot => {
      (day[slot] || []).forEach(act => {
        totalActs++;
        if (Number(act.cost) === 0 || act.pricingType === 'free') {
          freeCount++;
        }
      });
    });
  });
  console.log(`  Free activities selected: ${freeCount} out of ${totalActs}`);
  assert(freeCount >= 3, `Expected at least 3 free activities, got ${freeCount}`);
  console.log('  PASS: Free experiences correctly prioritized and kept at ₹0.\n');

  // -------------------------------------------------------------
  // TEST E: Multiple travelers (per-person vs group-level prices)
  // -------------------------------------------------------------
  console.log('--- [TEST E] Multiple travelers per-person vs group-level calculations ---');
  const perPersonActivity = { name: 'City Palace Museum Entry', cost: 300, pricePerPerson: true };
  const groupActivity = { name: 'Private Sunset Boat Charter', cost: 1500, pricePerPerson: false };
  
  const estimate1Traveler = calculateTripEstimate({
    activities: [perPersonActivity, groupActivity],
    selectedHotel: { pricePerNight: 2000 },
    durationDays: 2,
    travelers: 1,
    budget: 10000,
    currency: 'INR',
  });

  const estimate4Travelers = calculateTripEstimate({
    activities: [perPersonActivity, groupActivity],
    selectedHotel: { pricePerNight: 2000 },
    durationDays: 2,
    travelers: 4,
    budget: 25000,
    currency: 'INR',
  });

  console.log(`  1 traveler activity total: ₹${estimate1Traveler.breakdown.activityTotal}`);
  console.log(`  4 travelers activity total: ₹${estimate4Travelers.breakdown.activityTotal}`);
  assert.strictEqual(estimate1Traveler.breakdown.activityTotal, 1800, '1 traveler activity total should be 1800');
  assert.strictEqual(estimate4Travelers.breakdown.activityTotal, 2700, '4 travelers activity total should be 2700 (perPerson multiplied, group not)');
  console.log('  PASS: Per-person and group-level activity prices calculated accurately.\n');

  // -------------------------------------------------------------
  // TEST F: Multiple days of accommodation
  // -------------------------------------------------------------
  console.log('--- [TEST F] Multi-day accommodation charging verification ---');
  const hotelRatePerNight = 2500;
  const stayDays = 4;
  const stayEstimate = calculateTripEstimate({
    activities: [],
    selectedHotel: { pricePerNight: hotelRatePerNight },
    durationDays: stayDays,
    travelers: 2,
    budget: 20000,
    currency: 'INR',
  });

  console.log(`  Hotel Stay Total: ₹${stayEstimate.breakdown.accommodationTotal} (for ${stayDays} days / 3 nights at ₹${hotelRatePerNight}/night)`);
  assert.strictEqual(stayEstimate.breakdown.accommodationTotal, 7500, 'Accommodation stay total should be exactly 3 nights * 2500 = 7500');
  console.log('  PASS: Multi-day hotel stay charged once for stay duration, not repeated in full each day.\n');

  // -------------------------------------------------------------
  // TEST G: Currency consistency (no double conversion)
  // -------------------------------------------------------------
  console.log('--- [TEST G] Currency consistency & no double conversion ---');
  const inrAmount = 1500;
  const convertedInr = convertCost(inrAmount, 'INR', 'INR');
  assert.strictEqual(convertedInr, 1500, 'Converting INR to INR must not multiply by exchange rate');
  
  const usdAmount = 20;
  const convertedUsdToInr = convertCost(usdAmount, 'INR', 'USD');
  assert.strictEqual(convertedUsdToInr, 1660, '20 USD * 83 = 1660 INR');

  const zeroCost = convertCost(0, 'INR', 'USD');
  assert.strictEqual(zeroCost, 0, 'Zero cost remains 0 in any currency');
  console.log('  PASS: Currency conversion applies once and avoids duplicate exchange rates.\n');

  // -------------------------------------------------------------
  // TEST H: Budget exceeded & bounded replanning loop
  // -------------------------------------------------------------
  console.log('--- [TEST H] Bounded replanning loop & shortfall reporting ---');
  const impossiblePlan = await runTripAgent({
    destination: 'Udaipur',
    durationDays: 7,
    travelers: 2,
    budget: 3000,
    currency: 'INR',
  });

  assert(impossiblePlan.success, 'Agent must formulate response without crashing');
  console.log(`  Within Budget: ${impossiblePlan.budget.withinBudget}`);
  console.log(`  Total Estimated Cost: ₹${impossiblePlan.budget.totalEstimatedCost}`);
  console.log(`  Shortfall Reported: ₹${impossiblePlan.budget.shortfall}`);
  assert.strictEqual(impossiblePlan.budget.withinBudget, false, 'Plan should be flagged as over budget');
  assert(impossiblePlan.budget.shortfall > 0, 'Shortfall must be accurately reported');
  assert(impossiblePlan.itinerary.summaryExplanation.includes('exceed') || impossiblePlan.itinerary.summaryExplanation.includes('budget') || impossiblePlan.itinerary.summaryExplanation.includes('shortfall'), 'Agent must explain trade-offs/shortfall');
  console.log('  PASS: Replanning loop terminates within attempt limit and transparently reports shortfall.\n');

  // -------------------------------------------------------------
  // TEST I: Destination relevance
  // -------------------------------------------------------------
  console.log('--- [TEST I] Destination relevance verification ---');
  const udaipurPlan = await runTripAgent({
    destination: 'Udaipur',
    durationDays: 3,
    travelers: 1,
    budget: 15000,
    currency: 'INR',
  });

  const udaipurActivities = [];
  udaipurPlan.itinerary.days.forEach(day => {
    ['morning', 'afternoon', 'evening'].forEach(slot => {
      (day[slot] || []).forEach(act => udaipurActivities.push(act.name));
    });
  });

  console.log('  Selected activities in Udaipur plan:', udaipurActivities);
  const relevantUdaipurKeywords = ['Pichola', 'Palace', 'Saheliyon', 'Jagdish', 'Fateh', 'Ambrai', 'Bagore', 'Monsoon', 'Shilpgram', 'Ghat', 'Lake', 'Circle'];
  const relevantCount = udaipurActivities.filter(name => relevantKeywordsMatch(name, relevantUdaipurKeywords)).length;
  console.log(`  Destination-relevant attractions: ${relevantCount} of ${udaipurActivities.length}`);
  assert(relevantCount >= udaipurActivities.length * 0.7, 'At least 70% of activities must match Udaipur destination keywords');
  console.log('  PASS: Destination relevance confirmed for Udaipur.\n');

  // -------------------------------------------------------------
  // TEST J: Data persistence (Trip save, reload, consistency)
  // -------------------------------------------------------------
  console.log('--- [TEST J] Data persistence & consistency after reload ---');
  const user = await User.create({
    name: 'Smit Traveler',
    email: 'smit.tester@example.com',
    password: 'securePassword123',
  });

  const trip = await Trip.create({
    user: user._id,
    name: 'Udaipur Heritage Tour',
    startDate: new Date('2026-11-10'),
    endDate: new Date('2026-11-14'),
    budget: 35000,
    currency: 'INR',
  });

  const stop = await Stop.create({
    trip: trip._id,
    city: 'Udaipur',
    country: 'India',
    startDate: trip.startDate,
    endDate: trip.endDate,
    order: 0,
  });

  const rawActivities = [
    { trip: trip._id, stop: stop._id, name: 'City Palace Museum', category: 'Sightseeing', cost: 300, currency: 'INR', pricingType: 'entry_fee', isVerified: true, date: new Date('2026-11-10'), time: '10:00 AM' },
    { trip: trip._id, stop: stop._id, name: 'Ambrai Ghat Sunset Walk', category: 'Relaxation', cost: 0, currency: 'INR', pricingType: 'free', isVerified: true, date: new Date('2026-11-10'), time: '05:30 PM' },
    { trip: trip._id, stop: stop._id, name: 'Fateh Sagar Lake Promenade', category: 'Sightseeing', cost: 0, currency: 'INR', pricingType: 'free', isVerified: true, date: new Date('2026-11-11'), time: '09:00 AM' },
    { trip: trip._id, stop: stop._id, name: 'Bagore Ki Haveli Dharohar Dance Show', category: 'Culture', cost: 150, currency: 'INR', pricingType: 'entry_fee', isVerified: true, date: new Date('2026-11-11'), time: '07:00 PM' },
  ];
  await Activity.insertMany(rawActivities);

  let resData = null;
  const mockReq = { params: { tripId: trip._id.toString() }, user: { _id: user._id } };
  const mockRes = {
    status: (code) => ({
      json: (data) => {
        resData = data;
      },
    }),
  };

  await getItinerary(mockReq, mockRes);
  assert(resData && resData.success, 'Itinerary retrieval must succeed');

  const reloadedActivities = [];
  resData.days.forEach(day => {
    day.activities.forEach(a => reloadedActivities.push(a));
  });

  const ambrai = reloadedActivities.find(a => a.name.includes('Ambrai'));
  const palace = reloadedActivities.find(a => a.name.includes('City Palace'));
  
  console.log(`  Reloaded Ambrai Ghat cost: ₹${ambrai.cost} (pricingType: ${ambrai.pricingType})`);
  console.log(`  Reloaded City Palace cost: ₹${palace.cost} (pricingType: ${palace.pricingType})`);

  assert.strictEqual(Number(ambrai.cost), 0, 'Ambrai Ghat must remain ₹0 Free after reload');
  assert.strictEqual(Number(palace.cost), 300, 'City Palace must remain ₹300 after reload');
  assert.strictEqual(resData.totalItineraryCost, 450, 'Total itinerary activity cost must be exactly 300 + 0 + 0 + 150 = 450');
  console.log('  PASS: Trip data and pricing metadata persist accurately without unwanted inflation.\n');

  console.log('================================================================');
  console.log(' ALL 10 TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');

  await mongoose.disconnect();
  await mongod.stop();
}

function relevantKeywordsMatch(name, keywords) {
  const lower = name.toLowerCase();
  return keywords.some(k => lower.includes(k.toLowerCase()));
}

runAllTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
