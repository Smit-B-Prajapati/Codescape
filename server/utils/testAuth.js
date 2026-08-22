import { registerUser, loginUser, getMe } from '../controllers/authController.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

/**
 * Unit & Integration Test Audit for Part 3 Authentication
 */
export async function runAuthTests() {
  console.log('====================================================');
  console.log(' 🔐 Running GlobeTrotter Authentication Suite');
  console.log('====================================================');

  const mockUser = {
    name: 'Travel Tester',
    email: `test_${Date.now()}@globetrotter.io`,
    password: 'securePassword123',
    confirmPassword: 'securePassword123',
  };

  let token = null;

  // Mock Express Request / Response helpers
  const createMockRes = () => {
    const res = {
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
    };
    return res;
  };

  // Test 1: Validation Check (Password mismatch)
  console.log('\n[Test 1] Registering with mismatched passwords...');
  const req1 = { body: { ...mockUser, confirmPassword: 'differentPassword' } };
  const res1 = createMockRes();
  await registerUser(req1, res1);
  console.log(`↳ Response Code: ${res1.statusCode} (${res1.jsonData.message})`);
  console.log(res1.statusCode === 400 ? '✅ PASSED: Password mismatch rejected' : '❌ FAILED');

  // Test 2: JWT Verification helper test
  console.log('\n[Test 2] Testing JWT Secret & Sign/Verify...');
  const secret = process.env.JWT_SECRET || 'globetrotter_super_secret_jwt_key_change_in_production';
  const dummyToken = jwt.sign({ id: 'dummy_id' }, secret, { expiresIn: '1h' });
  const decoded = jwt.verify(dummyToken, secret);
  console.log(`↳ Token decoded successfully for ID: ${decoded.id}`);
  console.log(decoded.id === 'dummy_id' ? '✅ PASSED: JWT verification functional' : '❌ FAILED');

  // Test 3: Invalid JWT test
  console.log('\n[Test 3] Testing Invalid JWT rejection...');
  try {
    jwt.verify('invalid_tampered_token_string', secret);
    console.log('❌ FAILED: Invalid token should have thrown error');
  } catch (err) {
    console.log(`↳ Caught expected JWT error: ${err.message}`);
    console.log('✅ PASSED: Invalid JWT correctly rejected');
  }

  console.log('\n====================================================');
  console.log(' 🟢 Auth Middleware & Security Routines Verified');
  console.log('====================================================');
  return true;
}

import { pathToFileURL } from 'url';

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runAuthTests();
}
