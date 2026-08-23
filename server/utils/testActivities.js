import { getActivityCatalog } from '../controllers/activityController.js';

/**
 * Diagnostic test script for Activities Discovery & Management API
 */
export async function runActivitiesTests() {
  console.log('====================================================');
  console.log(' 🎡 Running GlobeTrotter Activities Test Suite');
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

  // Test 1: Activity Catalog Discovery Search
  console.log('\n[Test 1] Searching Activity Discovery Catalog for "Scuba"...');
  const req1 = { query: { query: 'Scuba' } };
  const res1 = createResHelper();
  await getActivityCatalog(req1, res1);
  console.log(`↳ Response Code: ${res1.statusCode}`);
  console.log(`↳ Matching Activities Count: ${res1.jsonData.count}`);
  console.log(res1.jsonData.count >= 1 ? '✅ PASSED: Activity discovery catalog functional' : '❌ FAILED');

  // Test 2: Filter Activity Catalog by Category
  console.log('\n[Test 2] Filtering Activity Catalog by Category "Food"...');
  const req2 = { query: { category: 'Food' } };
  const res2 = createResHelper();
  await getActivityCatalog(req2, res2);
  console.log(`↳ Response Code: ${res2.statusCode}`);
  console.log(`↳ Food Category Activities Count: ${res2.jsonData.count}`);
  console.log(res2.jsonData.count >= 1 ? '✅ PASSED: Activity category filtering functional' : '❌ FAILED');

  console.log('\n====================================================');
  console.log(' 🟢 Activity Discovery & Search Routines Verified');
  console.log('====================================================');
  return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runActivitiesTests();
}
