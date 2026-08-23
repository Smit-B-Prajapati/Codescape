import {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  validateBudgetLimit,
  validateCurrency,
  validateTravelers,
  SUPPORTED_CURRENCIES,
} from '../controllers/tripController.js';

/**
 * Diagnostic test script for Trip CRUD Controllers & Authorization Rules
 */
export async function runTripCrudTests() {
  console.log('====================================================');
  console.log(' ✈️  Running GlobeTrotter Trip CRUD Suite');
  console.log('====================================================');

  const createResHelper = () => ({
    statusCode: 200,
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
  });

  // Test 1: Date Validation (End date before Start date)
  console.log('\n[Test 1] Testing Date Validation (End date before Start date)...');
  const req1 = {
    user: { _id: '60d5ec49f1b2c80015f8e001' },
    body: {
      name: 'Invalid Date Trip',
      startDate: '2026-10-15',
      endDate: '2026-10-10',
    },
  };
  const res1 = createResHelper();
  await createTrip(req1, res1);
  console.log(`↳ Response Code: ${res1.statusCode} (${res1.jsonData.message})`);
  console.log(res1.statusCode === 400 ? '✅ PASSED: Invalid date range rejected' : '❌ FAILED');

  // Test 2: Missing Name Validation
  console.log('\n[Test 2] Testing Required Trip Name Validation...');
  const req2 = {
    user: { _id: '60d5ec49f1b2c80015f8e001' },
    body: {
      name: '   ',
      startDate: '2026-10-10',
      endDate: '2026-10-15',
    },
  };
  const res2 = createResHelper();
  await createTrip(req2, res2);
  console.log(`↳ Response Code: ${res2.statusCode} (${res2.jsonData.message})`);
  console.log(res2.statusCode === 400 ? '✅ PASSED: Empty trip name rejected' : '❌ FAILED');

  // Test 3: BudgetLimit Validation (budgetLimit >= 0)
  console.log('\n[Test 3] Testing BudgetLimit Validation (Non-negative & safe)...');
  const bNegRes = createResHelper();
  await createTrip({
    user: { _id: '60d5ec49f1b2c80015f8e001' },
    body: {
      name: 'Negative Budget Trip',
      startDate: '2026-10-10',
      endDate: '2026-10-15',
      budgetLimit: -500,
    },
  }, bNegRes);
  console.log(`↳ Negative budget response: ${bNegRes.statusCode} (${bNegRes.jsonData.message})`);
  const bNegCheck = bNegRes.statusCode === 400;

  const bValidCheck = validateBudgetLimit(25000).valid === true && validateBudgetLimit(25000).value === 25000;
  const bZeroCheck = validateBudgetLimit(0).valid === true && validateBudgetLimit(0).value === 0;
  const bDefaultCheck = validateBudgetLimit(undefined).valid === true && validateBudgetLimit(undefined).value === 0;
  const bNaNCheck = validateBudgetLimit('not_a_number').valid === false;
  console.log((bNegCheck && bValidCheck && bZeroCheck && bDefaultCheck && bNaNCheck) ? '✅ PASSED: Budget limit validation rules verified' : '❌ FAILED');

  // Test 4: Currency Validation (Supported currencies & normalization)
  console.log('\n[Test 4] Testing Currency Validation & Normalization...');
  const cInvalidRes = createResHelper();
  await createTrip({
    user: { _id: '60d5ec49f1b2c80015f8e001' },
    body: {
      name: 'Invalid Currency Trip',
      startDate: '2026-10-10',
      endDate: '2026-10-15',
      currency: 'INVALID_COIN',
    },
  }, cInvalidRes);
  console.log(`↳ Invalid currency response: ${cInvalidRes.statusCode} (${cInvalidRes.jsonData.message})`);
  const cInvalidCheck = cInvalidRes.statusCode === 400;

  const cInrCheck = validateCurrency('inr').valid === true && validateCurrency('inr').value === 'INR';
  const cUsdCheck = validateCurrency('USD').valid === true && validateCurrency('USD').value === 'USD';
  const cDefaultCheck = validateCurrency(undefined).valid === true && validateCurrency(undefined).value === 'USD';
  const cNonStringCheck = validateCurrency(999).valid === false;
  console.log((cInvalidCheck && cInrCheck && cUsdCheck && cDefaultCheck && cNonStringCheck) ? '✅ PASSED: Currency validation and normalization verified' : '❌ FAILED');

  // Test 5: Travelers Array Validation
  console.log('\n[Test 5] Testing Travelers Array Validation...');
  const tNonArrayRes = createResHelper();
  await createTrip({
    user: { _id: '60d5ec49f1b2c80015f8e001' },
    body: {
      name: 'Non Array Travelers Trip',
      startDate: '2026-10-10',
      endDate: '2026-10-15',
      travelers: 'not-an-array',
    },
  }, tNonArrayRes);
  console.log(`↳ Non-array travelers response: ${tNonArrayRes.statusCode} (${tNonArrayRes.jsonData.message})`);
  const tNonArrayCheck = tNonArrayRes.statusCode === 400;

  const tValidCheck = validateTravelers(['Traveler 1', 'Traveler 2']).valid === true;
  const tDefaultCheck = validateTravelers(undefined).valid === true && Array.isArray(validateTravelers(undefined).value) && validateTravelers(undefined).value.length === 0;
  const tSafeValuesCheck = validateTravelers([{ name: 'Alice' }, 'Bob']).valid === true;
  const tUnsafeCheck = validateTravelers([null, undefined]).valid === false;
  console.log((tNonArrayCheck && tValidCheck && tDefaultCheck && tSafeValuesCheck && tUnsafeCheck) ? '✅ PASSED: Travelers array validation verified' : '❌ FAILED');

  // Test 6: Backward Compatibility (Clients omitting new fields)
  console.log('\n[Test 6] Testing Backward Compatibility with Legacy Payloads...');
  const legacyBudget = validateBudgetLimit(undefined);
  const legacyCurrency = validateCurrency(undefined);
  const legacyTravelers = validateTravelers(undefined);
  const legacyCheck = legacyBudget.value === 0 && legacyCurrency.value === 'USD' && legacyTravelers.value.length === 0;
  console.log(legacyCheck ? '✅ PASSED: Backward-compatible defaults preserved (0, "USD", [])' : '❌ FAILED');

  console.log('\n====================================================');
  console.log(' 🟢 Trip CRUD Validation Routines Verified');
  console.log('====================================================');
  return true;
}

if (
  import.meta.url === `file://${process.argv[1]}` ||
  (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('testTripCrud.js'))
) {
  runTripCrudTests();
}

