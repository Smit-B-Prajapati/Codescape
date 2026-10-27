import { apiRequest } from './api.js';

/**
 * Payment API Service
 * Dedicated frontend service abstraction for Razorpay Test Mode and Payment System.
 * Never calls fetch directly from React components and never exposes secrets.
 */

/**
 * Dynamically loads the official Razorpay Checkout SDK.
 * Official SDK URL: https://checkout.razorpay.com/v1/checkout.js
 * 
 * @returns {Promise<boolean>} True if script loaded successfully
 */
export function loadRazorpayCheckoutScript() {
  return new Promise((resolve) => {
    // If already loaded in window
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => {
      resolve(true);
    };

    script.onerror = () => {
      console.error('[Razorpay SDK Error]: Failed to load checkout.js script');
      resolve(false);
    };

    document.body.appendChild(script);
  });
}

/**
 * Creates an official Razorpay order on the backend for a pending booking.
 * 
 * @param {Object} params
 * @param {string} params.bookingId - Associated booking ID or reference
 * @returns {Promise<{ success: boolean, keyId: string, orderId: string, amount: number, currency: string, bookingId: string, testMode: boolean }>}
 */
export async function createRazorpayOrder({ bookingId }) {
  if (!bookingId) {
    throw new Error('A booking ID is required to create a payment order');
  }

  return apiRequest('/payments/create-order', {
    method: 'POST',
    body: JSON.stringify({ bookingId }),
  });
}

/**
 * Sends Checkout transaction response to backend for cryptographic signature verification.
 * 
 * @param {Object} params
 * @param {string} params.bookingId
 * @param {string} params.razorpay_order_id
 * @param {string} params.razorpay_payment_id
 * @param {string} params.razorpay_signature
 * @returns {Promise<{ success: boolean, message: string, payment: Object, booking: Object }>}
 */
export async function verifyRazorpayPayment({
  bookingId,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) {
  if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new Error('All Razorpay verification parameters are required');
  }

  return apiRequest('/payments/verify', {
    method: 'POST',
    body: JSON.stringify({
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    }),
  });
}

/**
 * Directly processes a test payment as successful without external bank redirects.
 * 
 * @param {Object} params
 * @param {string} params.bookingId
 * @returns {Promise<{ success: boolean, message: string, payment: Object, booking: Object }>}
 */
export async function processDirectPayment({ bookingId }) {
  if (!bookingId) {
    throw new Error('A booking ID is required to process payment');
  }

  return apiRequest('/payments/pay-direct', {
    method: 'POST',
    body: JSON.stringify({ bookingId }),
  });
}

/**
 * Retrieves payment status by payment ID.
 * 
 * @param {string} paymentId 
 * @returns {Promise<{ success: boolean, payment: Object, booking?: Object }>}
 */
export async function getPaymentStatus(paymentId) {
  if (!paymentId) {
    throw new Error('Payment ID is required');
  }

  return apiRequest(`/payments/${paymentId}/status`);
}

/**
 * Legacy payment creation (maintained for backward compatibility)
 */
export async function createPayment({ bookingId }) {
  if (!bookingId) {
    throw new Error('A booking ID is required to create a payment');
  }

  return apiRequest('/payments/create', {
    method: 'POST',
    body: JSON.stringify({ bookingId }),
  });
}

/**
 * Legacy simulation payment confirmation (maintained for backward compatibility)
 */
export async function confirmPayment(paymentId, { simulateStatus = 'success' } = {}) {
  if (!paymentId) {
    throw new Error('Payment ID is required to confirm payment');
  }

  return apiRequest(`/payments/${paymentId}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ simulateStatus }),
  });
}

/**
 * Retrieves payment status and details by payment ID.
 */
export async function getPaymentById(paymentId) {
  if (!paymentId) {
    throw new Error('Payment ID is required');
  }

  return apiRequest(`/payments/${paymentId}`);
}

/**
 * Retrieves payment associated with a booking.
 */
export async function getPaymentByBooking(bookingId) {
  if (!bookingId) {
    throw new Error('Booking ID is required');
  }

  return apiRequest(`/payments/by-booking/${bookingId}`);
}

/**
 * Downloads the demo confirmation PDF for a booking using authenticated fetch.
 */
export async function downloadConfirmationPdf(bookingId, filename) {
  const token = localStorage.getItem('globetrotter_token');
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const url = `${baseUrl}/bookings/${bookingId}/confirmation.pdf`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to download confirmation PDF');
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename || `GlobeThrottle-Confirmation-${bookingId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

export default {
  loadRazorpayCheckoutScript,
  createRazorpayOrder,
  verifyRazorpayPayment,
  processDirectPayment,
  getPaymentStatus,
  createPayment,
  confirmPayment,
  getPaymentById,
  getPaymentByBooking,
  downloadConfirmationPdf,
};
