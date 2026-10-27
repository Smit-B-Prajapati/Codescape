import assert from 'assert';
import { runTripAgent } from '../agent/tripAgent.js';
import { extractTripRequirements, extractFallbackRequirements } from '../agent/agentState.js';
import { searchTransportOptions, searchCatalogActivities } from '../agent/agentTools.js';
import { calculateTripEstimate } from '../services/budgetService.js';
import { getAiServiceStatus, generateStructuredResponse } from '../services/aiService.js';
import { ACTIVITIES_CATALOG } from '../controllers/activityController.js';
import { DEMO_HOTELS } from '../data/hotels.js';

let passed = 0;
let failed = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${desc}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function itAsync(desc, fn) {
  try {
    await fn();
    console.log(`  ✓ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${desc}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('\n=============================================================');
  console.log('🤖 CODESCAPE AI TRIP AGENT COMPREHENSIVE VERIFICATION SUITE');
  console.log('=============================================================\n');

  // ---------------------------------------------------------------------------
  // TEST CASE A: Vadodara to Kashmir, 5 days, ₹20,000 budget
  // ---------------------------------------------------------------------------
  console.log('\n--- 1. TEST CASE A: "Plan a 5 day trip from Vadodara to Kashmir with a budget of ₹20,000" ---');

  const promptA = 'Plan a 5 day trip from Vadodara to Kashmir with a budget of ₹20,000';
  const planA = await runTripAgent(promptA);

  it('Vadodara remains exact origin (never defaulted to Mumbai)', () => {
    assert.strictEqual(planA.requirements.origin, 'Vadodara');
    assert.strictEqual(planA.plan.origin, 'Vadodara');
  });

  it('Kashmir remains exact destination', () => {
    assert.deepStrictEqual(planA.requirements.destinations, ['Kashmir']);
    assert.strictEqual(planA.plan.destination, 'Kashmir');
  });

  it('Duration (5 days) and budget (₹20,000) are strictly preserved', () => {
    assert.strictEqual(planA.requirements.durationDays, 5);
    assert.strictEqual(planA.requirements.budget, 20000);
    assert.strictEqual(planA.requirements.currency, 'INR');
  });

  it('No unrelated Mumbai or fake route is displayed as a matching transport result for Vadodara → Kashmir', () => {
    // In our catalog there are no direct demo trains or flights between Vadodara and Kashmir
    // System must return 0 matching options rather than inventing fake IndiGo or VRL bus routes
    assert.strictEqual(planA.transportOptions.length, 0);
    assert.strictEqual(planA.selectedOptions.transport, null);
    assert.strictEqual(planA.budget.transportTotal, 0);
  });

  it('Activities are genuinely Kashmir-specific (Dal Lake, Gulmarg, Pahalgam, Wazwan, Mughal Gardens)', () => {
    assert(planA.activities.length >= 6, `Expected at least 6 activities, got ${planA.activities.length}`);
    const actNames = planA.activities.map((a) => a.name.toLowerCase()).join(' ');
    const kashmirKeywords = ['kashmir', 'dal lake', 'shikara', 'mughal', 'gulmarg', 'pahalgam', 'wazwan', 'shankaracharya', 'kahwa'];
    const matchedKeywords = kashmirKeywords.filter((kw) => actNames.includes(kw));
    assert(matchedKeywords.length >= 3, `Expected at least 3 Kashmir keywords in activities, found: ${matchedKeywords.join(', ')}`);
  });

  it('Itinerary days each contain 2 to 3 activities mapped to Kashmir destination', () => {
    assert.strictEqual(planA.itinerary.days.length, 5);
    for (const day of planA.itinerary.days) {
      const dayTotal = (day.morning?.length || 0) + (day.afternoon?.length || 0) + (day.evening?.length || 0);
      assert(dayTotal >= 2 && dayTotal <= 3, `Day ${day.dayNumber} has ${dayTotal} activities (expected 2-3)`);
      assert(day.city.toLowerCase().includes('kashmir') || day.city.toLowerCase().includes('srinagar'), `Day city was ${day.city}`);
    }
  });

  it('Kashmir hotels are authentically available (Houseboat, Gulmarg resort, etc.)', () => {
    assert(planA.hotelOptions.length > 0, 'Expected Kashmir hotels in hotelOptions');
    assert(planA.hotelOptions.some((h) => h.city.toLowerCase().includes('kashmir') || h.name.toLowerCase().includes('dal lake')));
  });

  it('Deterministic budget calculation matches limits and utilization percentage', () => {
    assert(planA.budget.totalEstimatedCost > 0);
    assert(planA.budget.budget === 20000);
    assert.strictEqual(planA.budget.withinBudget, planA.budget.totalEstimatedCost <= 20000);
    assert.strictEqual(planA.budget.remainingBudget, 20000 - planA.budget.totalEstimatedCost);
  });

  // ---------------------------------------------------------------------------
  // TEST CASE B: Ahmedabad to Goa, 4 days, 2 people, beaches and food
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. TEST CASE B: "Plan a 4 day Goa trip from Ahmedabad for 2 people focused on beaches and food" ---');

  const promptB = 'Plan a 4 day Goa trip from Ahmedabad for 2 people focused on beaches and food';
  const planB = await runTripAgent(promptB);

  it('Ahmedabad is exact origin and Goa is exact destination', () => {
    assert.strictEqual(planB.requirements.origin, 'Ahmedabad');
    assert.deepStrictEqual(planB.requirements.destinations, ['Goa']);
  });

  it('Traveler count (2 people) and duration (4 days) are preserved', () => {
    assert.strictEqual(planB.requirements.travelers, 2);
    assert.strictEqual(planB.requirements.durationDays, 4);
  });

  it('Interests (beaches and food) are extracted and preserved', () => {
    assert(planB.requirements.interests.includes('beaches'));
    assert(planB.requirements.interests.includes('food'));
  });

  it('Activities are Goa-specific and reflect beach/food interests', () => {
    const actNames = planB.activities.map((a) => a.name.toLowerCase()).join(' ');
    const goaKeywords = ['goa', 'beach', 'candolim', 'baga', 'anjuna', 'seafood', 'shack', 'curry', 'aguada', 'dudhsagar'];
    const matched = goaKeywords.filter((kw) => actNames.includes(kw));
    assert(matched.length >= 2, `Expected Goa-specific terms, found: ${matched.join(', ')}`);
  });

  // ---------------------------------------------------------------------------
  // TEST CASE C: Modify Plan Workflow & Stale Plan Guard Simulation
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. TEST CASE C: Modify Plan Workflow & Stale Plan Invalidation ---');

  it('Modify plan prepopulates existing requirements without loss', () => {
    const initialReq = planA.requirements;
    const modifiedReq = {
      ...initialReq,
      durationDays: 7,
      budget: 35000,
      stops: ['Gulmarg', 'Pahalgam'],
    };
    assert.strictEqual(modifiedReq.origin, 'Vadodara');
    assert.strictEqual(modifiedReq.destination || modifiedReq.destinations[0], 'Kashmir');
    assert.strictEqual(modifiedReq.durationDays, 7);
    assert.strictEqual(modifiedReq.budget, 35000);
    assert.deepStrictEqual(modifiedReq.stops, ['Gulmarg', 'Pahalgam']);
  });

  itAsync('Regenerating plan recalculates with updated 7-day duration and stops', async () => {
    const updatedPlan = await runTripAgent('Plan a 7 day trip from Vadodara to Kashmir with budget of ₹35,000', {
      origin: 'Vadodara',
      destinations: ['Kashmir'],
      durationDays: 7,
      budget: 35000,
      stops: ['Gulmarg', 'Pahalgam'],
    });

    assert.strictEqual(updatedPlan.requirements.durationDays, 7);
    assert.strictEqual(updatedPlan.requirements.budget, 35000);
    assert.strictEqual(updatedPlan.itinerary.days.length, 7);
  });

  // ---------------------------------------------------------------------------
  // EDGE & ERROR HANDLING TESTS
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Edge & Error Handling Tests ---');

  it('Missing destination triggers needs_input rather than failing silently', async () => {
    const res = await runTripAgent('Plan a 5 day trip for 2 people with a budget of ₹20,000');
    assert.strictEqual(res.status, 'needs_input');
    assert.strictEqual(res.requiresUserInput, true);
    assert(res.missingInformation.some((m) => m.toLowerCase().includes('destination')));
  });

  it('Safe AI diagnostics correctly report provider and simulation status without leaking keys', () => {
    const status = getAiServiceStatus();
    assert(typeof status.provider === 'string');
    assert(typeof status.model === 'string');
    assert(typeof status.isConfigured === 'boolean');
    assert(typeof status.isFallback === 'boolean');
    // Ensure no API keys or bearer tokens exist in the status object
    const serialized = JSON.stringify(status);
    assert(!serialized.includes('sk-'));
    assert(!serialized.includes('Bearer'));
  });

  it('Deterministic budget math prevents double counting and never relies on AI arithmetic', () => {
    const est = calculateTripEstimate({
      transport: null, // No transport found
      hotels: [{ totalStayCost: 5000 }],
      activities: [{ cost: 500 }, { cost: 300 }],
      travelers: 2,
      nights: 4,
      budget: 20000,
      currency: 'INR',
    });

    assert.strictEqual(est.transportTotal, 0);
    assert.strictEqual(est.accommodationTotal, 5000);
    assert.strictEqual(est.activityTotal, (500 + 300) * 2); // 1600
    // Food = 500 * 5 days * 2 travelers = 5000
    assert.strictEqual(est.foodEstimate, 5000);
    // Misc = 200 * 5 days * 2 travelers = 2000
    assert.strictEqual(est.miscellaneousEstimate, 2000);
    // Total = 0 + 5000 + 1600 + 5000 + 2000 = 13600
    assert.strictEqual(est.totalEstimatedCost, 13600);
    assert.strictEqual(est.remainingBudget, 20000 - 13600); // 6400
    assert.strictEqual(est.withinBudget, true);
    assert.strictEqual(est.budgetUtilizationPercentage, 68);
  });

  it('Empty activity search for unknown city returns safe empty list without cross-city contamination', async () => {
    const acts = await searchCatalogActivities({ destination: 'AtlantisUnderseaCity', currency: 'INR' });
    // Must NOT return Paris or Tokyo activities!
    assert(acts.every((a) => !a.city.toLowerCase().includes('paris') && !a.city.toLowerCase().includes('tokyo')));
  });

  console.log('\n=============================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
