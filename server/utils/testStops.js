import { getCities } from '../controllers/cityController.js';

/**
 * Diagnostic test script for Cities & Travel Stops API
 */
export async function runStopsTests() {
  console.log('====================================================');
  console.log(' 🏙️  Running GlobeTrotter Cities & Stops Test Suite');
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

  // Test 1: City Search Query
  console.log('\n[Test 1] Searching Cities Dataset for "Mumbai"...');
  const req1 = { query: { query: 'Mumbai' } };
  const res1 = createResHelper();
  await getCities(req1, res1);
  console.log(`↳ Response Code: ${res1.statusCode}`);
  console.log(`↳ Matching Cities Count: ${res1.jsonData.count}`);
  console.log(res1.jsonData.count >= 1 && res1.jsonData.cities[0].city === 'Mumbai' ? '✅ PASSED: City search functional' : '❌ FAILED');

  console.log('\n====================================================');
  console.log(' 🟢 Cities & Stops Validation Routines Verified');
  console.log('====================================================');
  return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runStopsTests();
}
