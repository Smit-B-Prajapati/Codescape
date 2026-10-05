import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

let razorpayInstance = null;

/**
 * Validates and retrieves the Razorpay configuration.
 * Never prints or leaks key secrets to logs.
 * 
 * @returns {{ keyId: string, isConfigured: boolean, mode: string }}
 */
export const getRazorpayConfig = () => {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  const mode = (process.env.RAZORPAY_MODE || 'test').toLowerCase().trim();

  const isConfigured = Boolean(
    keyId &&
    keySecret &&
    keyId !== 'your_test_key_id' &&
    keySecret !== 'your_test_key_secret'
  );

  return {
    keyId: keyId || '',
    keySecret: keySecret || '',
    isConfigured,
    mode,
  };
};

/**
 * Returns an initialized Razorpay SDK client.
 * Enforces test-mode integrity and blocks live keys in test mode.
 * 
 * @throws {Error} If credentials are missing, invalid, or mismatched with mode.
 * @returns {Razorpay} Initialized Razorpay client instance
 */
export const getRazorpayInstance = () => {
  const { keyId, keySecret, isConfigured, mode } = getRazorpayConfig();

  if (!isConfigured) {
    throw new Error(
      'Razorpay is not configured. Please set valid RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env'
    );
  }

  // Safety check: Prevent accidental live keys when configured for test mode
  if (mode === 'test' && keyId.startsWith('rzp_live_')) {
    throw new Error(
      'Safety violation: Live Razorpay credentials detected while RAZORPAY_MODE is set to test. Refusing to initialize live gateway.'
    );
  }

  if (mode === 'test' && !keyId.startsWith('rzp_test_')) {
    throw new Error(
      'Invalid Razorpay Test Key ID format. Test mode requires a key starting with "rzp_test_".'
    );
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return razorpayInstance;
};

export default {
  getRazorpayConfig,
  getRazorpayInstance,
};
