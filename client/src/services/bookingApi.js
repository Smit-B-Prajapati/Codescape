import { apiRequest } from './api.js';

/**
 * Booking API Service
 * Dedicated frontend service abstraction for the Demo Booking System.
 * Never calls fetch directly from React components.
 */

/**
 * Prepares a pending demo booking with backend-calculated prices.
 * 
 * @param {Object} params
 * @param {string} params.tripId - Associated Trip ID
 * @param {'transport'|'hotel'|'package'} params.type - Booking category
 * @param {string} [params.optionId] - Target demo option ID
 * @param {string} [params.transportOptionId] - Target transport ID for package
 * @param {string} [params.hotelOptionId] - Target hotel ID for package
 * @param {number} [params.travelers] - Optional traveler count override
 * @returns {Promise<{ success: boolean, booking: Object }>}
 */
export async function prepareBooking({
  tripId,
  type,
  optionId,
  transportOptionId,
  hotelOptionId,
  travelers,
}) {
  if (!tripId) {
    throw new Error('Trip ID is required to prepare a booking');
  }

  if (!type) {
    throw new Error('Booking type ("transport", "hotel", or "package") is required');
  }

  const payload = {
    tripId,
    type,
    ...(optionId && { optionId }),
    ...(transportOptionId && { transportOptionId }),
    ...(hotelOptionId && { hotelOptionId }),
    ...(travelers && { travelers }),
  };

  return apiRequest('/bookings/prepare', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetches booking details by booking ID or bookingReference from the authenticated backend.
 * 
 * @param {string} bookingId - MongoDB ObjectId or DEMO-BK reference
 * @returns {Promise<{ success: boolean, booking: Object }>}
 */
export async function getBookingById(bookingId) {
  if (!bookingId) {
    throw new Error('A booking ID is required to fetch booking details');
  }

  return apiRequest(`/bookings/${bookingId}`);
}

/**
 * Finalizes demo booking upon successful test payment.
 * 
 * @param {string} bookingId 
 * @param {Object} paymentProof 
 * @param {string} paymentProof.testPaymentToken 
 * @param {'completed'} paymentProof.paymentStatus 
 * @returns {Promise<{ success: boolean, booking: Object, message: string }>}
 */
export async function confirmBooking(bookingId, { testPaymentToken, paymentStatus = 'completed' }) {
  if (!bookingId) {
    throw new Error('Booking ID is required to confirm booking');
  }

  return apiRequest(`/bookings/${bookingId}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ testPaymentToken, paymentStatus }),
  });
}

/**
 * Retrieves all demo bookings created by the authenticated user.
 * 
 * @returns {Promise<{ success: boolean, count: number, bookings: Array }>}
 */
export async function getUserBookings() {
  return apiRequest('/bookings');
}

export default {
  prepareBooking,
  getBookingById,
  confirmBooking,
  getUserBookings,
};
