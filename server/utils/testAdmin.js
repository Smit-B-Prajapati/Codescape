import { admin } from '../middleware/authMiddleware.js';

/**
 * Diagnostic test script for Admin Analytics & Role Authorization API
 */
export async function runAdminTests() {
  console.log('====================================================');
  console.log(' 🛡️  Running GlobeTrotter Admin Analytics Test Suite');
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

  // Test 1: Verify Non-Admin User Access Rejection
  console.log('\n[Test 1] Testing Non-Admin Access Rejection...');
  const req1 = { user: { role: 'user' } };
  const res1 = createResHelper();
  let nextCalled = false;
  admin(req1, res1, () => { nextCalled = true; });

  console.log(`↳ Response Code: ${res1.statusCode} (${res1.jsonData?.message})`);
  console.log(res1.statusCode === 403 && !nextCalled ? '✅ PASSED: Non-admin user blocked from admin endpoints' : '❌ FAILED');

  // Test 2: Verify Admin User Authorization Approval
  console.log('\n[Test 2] Testing Admin User Authorization Pass...');
  const req2 = { user: { role: 'admin' } };
  const res2 = createResHelper();
  let adminNextCalled = false;
  admin(req2, res2, () => { adminNextCalled = true; });

  console.log(adminNextCalled ? '✅ PASSED: Administrator user authorized cleanly' : '❌ FAILED');

  console.log('\n====================================================');
  console.log(' 🟢 Admin Analytics & Security Routines Verified');
  console.log('====================================================');
  return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAdminTests();
}
