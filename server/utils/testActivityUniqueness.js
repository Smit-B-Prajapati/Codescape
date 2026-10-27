import assert from 'assert';
import { generateItinerary, validateAndFixItinerary } from '../services/itineraryService.js';
import { runTripAgent } from '../agent/tripAgent.js';

async function testActivityUniqueness() {
  console.log('========================================================');
  console.log('🧪 Starting Itinerary Activity Uniqueness Verification');
  console.log('========================================================\n');

  // Test 1: Generate a 5-day Goa trip directly with generateItinerary
  console.log('--- Test 1: 5-Day Goa Itinerary Uniqueness ---');
  const result5Day = await generateItinerary({
    requirements: {
      origin: 'Vadodara',
      destinations: ['Goa'],
      durationDays: 5,
      travelers: 2,
      budget: 15000,
      currency: 'INR',
    },
    transport: { departureTime: '08:00 AM', arrivalTime: '11:00 AM' },
  });

  const allNames5Day = [];
  result5Day.days.forEach((day) => {
    ['morning', 'afternoon', 'evening'].forEach((period) => {
      day[period].forEach((act) => {
        allNames5Day.push({ day: day.dayNumber, period, name: act.name });
      });
    });
  });

  console.log(`  Total scheduled activities for 5-day trip: ${allNames5Day.length}`);
  const uniqueNames5Day = new Set(allNames5Day.map((a) => a.name.toLowerCase().trim()));
  console.log(`  Unique activity names: ${uniqueNames5Day.size} / ${allNames5Day.length}`);

  allNames5Day.forEach((a) => {
    console.log(`    Day ${a.day} [${a.period}]: ${a.name}`);
  });

  assert.strictEqual(
    uniqueNames5Day.size,
    allNames5Day.length,
    `Expected all ${allNames5Day.length} activities to be strictly unique, but found duplicates!`
  );
  console.log('  ✓ PASS: 5-day Goa trip has 100% unique activities with zero repeats across all days.\n');

  // Test 2: Generate a 7-day trip (21 activities)
  console.log('--- Test 2: 7-Day Goa Itinerary Uniqueness (21 activities) ---');
  const result7Day = await generateItinerary({
    requirements: {
      origin: 'Mumbai',
      destinations: ['Goa'],
      durationDays: 7,
      travelers: 1,
      budget: 25000,
      currency: 'INR',
    },
    transport: { departureTime: '07:00 AM', arrivalTime: '10:30 AM' },
  });

  const allNames7Day = [];
  result7Day.days.forEach((day) => {
    ['morning', 'afternoon', 'evening'].forEach((period) => {
      day[period].forEach((act) => {
        allNames7Day.push(act.name.toLowerCase().trim());
      });
    });
  });

  const uniqueNames7Day = new Set(allNames7Day);
  console.log(`  Total scheduled: ${allNames7Day.length}, Unique: ${uniqueNames7Day.size}`);
  assert.strictEqual(
    uniqueNames7Day.size,
    allNames7Day.length,
    `Expected all 7-day activities to be unique, got ${uniqueNames7Day.size} of ${allNames7Day.length}`
  );
  console.log('  ✓ PASS: 7-day trip has 100% unique activities with zero repeats.\n');

  // Test 3: validateAndFixItinerary auto-heals candidate days with intentional duplicates
  console.log('--- Test 3: validateAndFixItinerary Auto-heals Repeated Activities ---');
  const dirtyDays = [
    {
      dayNumber: 1,
      morning: [{ name: 'Fort Aguada & Lighthouse Coastal Panoramic Tour', cost: 0 }],
      afternoon: [{ name: 'Fort Aguada & Lighthouse Coastal Panoramic Tour', cost: 0 }],
      evening: [{ name: 'Fort Aguada & Lighthouse Coastal Panoramic Tour', cost: 0 }],
    },
    {
      dayNumber: 2,
      morning: [{ name: 'Fort Aguada & Lighthouse Coastal Panoramic Tour', cost: 0 }],
      afternoon: [{ name: 'Fort Aguada & Lighthouse Coastal Panoramic Tour', cost: 0 }],
      evening: [{ name: 'Fort Aguada & Lighthouse Coastal Panoramic Tour', cost: 0 }],
    },
  ];

  const fixed = validateAndFixItinerary({
    days: dirtyDays,
    destinationCity: 'Goa',
    durationDays: 2,
    travelers: 1,
  });

  const cleanedNames = [];
  fixed.days.forEach((day) => {
    ['morning', 'afternoon', 'evening'].forEach((period) => {
      day[period].forEach((act) => {
        cleanedNames.push(act.name.toLowerCase().trim());
      });
    });
  });

  const uniqueCleaned = new Set(cleanedNames);
  console.log(`  Input had 6 duplicate "Fort Aguada" entries.`);
  console.log(`  Output has ${uniqueCleaned.size} unique activities across ${cleanedNames.length} slots.`);
  assert.strictEqual(
    uniqueCleaned.size,
    cleanedNames.length,
    'Auto-healing failed to make all activities unique!'
  );
  assert(
    fixed.fixesApplied.some((f) => f.includes('Replaced duplicate activity')),
    'Fix log should record replaced duplicate activities'
  );
  console.log('  ✓ PASS: validateAndFixItinerary auto-replaced all repeated activities with unique experiences.\n');

  // Test 4: End-to-end tripAgent execution for Goa
  console.log('--- Test 4: Full Trip Agent Planning for Goa with Tight Budget ---');
  const agentPlan = await runTripAgent({
    origin: 'Vadodara',
    destination: 'Goa',
    durationDays: 5,
    travelers: 2,
    budget: 10000,
    currency: 'INR',
  });

  const itinerary = agentPlan.itinerary || agentPlan.plan?.itinerary;
  assert(itinerary && itinerary.days, 'Agent must produce an itinerary with days');
  const agentActivityNames = [];
  itinerary.days.forEach((day) => {
    ['morning', 'afternoon', 'evening'].forEach((period) => {
      day[period].forEach((act) => {
        agentActivityNames.push(act.name.toLowerCase().trim());
      });
    });
  });

  const uniqueAgentNames = new Set(agentActivityNames);
  console.log(`  Agent planned ${agentActivityNames.length} activities; Unique: ${uniqueAgentNames.size}`);
  assert.strictEqual(
    uniqueAgentNames.size,
    agentActivityNames.length,
    `Agent produced duplicates: ${agentActivityNames.length - uniqueAgentNames.size} duplicates found`
  );
  console.log('  ✓ PASS: Full trip agent execution produces 100% unique activities even with tight budget.\n');

  console.log('========================================================');
  console.log('🎉 ALL TESTS PASSED! Activity Uniqueness is 100% Verified.');
  console.log('========================================================');
}

testActivityUniqueness().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
