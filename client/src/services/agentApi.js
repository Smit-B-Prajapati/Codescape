import { apiRequest } from './api.js';

/**
 * Agent API Service
 * Dedicated frontend service abstraction for the AI Trip Planning Agent.
 * Never calls fetch directly from React components.
 */

/**
 * Executes the full agentic trip planning pipeline.
 * 
 * @param {Object} params
 * @param {string} params.message - Natural language travel request prompt
 * @param {Object} [params.preferences] - Optional key-value travel preferences
 * @returns {Promise<Object>} Formatted agent proposal or missing information requirements
 */
export async function planTripWithAgent({ message, preferences = null }) {
  if (!message || typeof message !== 'string' || !message.trim()) {
    throw new Error('Please provide a travel planning request message');
  }

  const payload = {
    message: message.trim(),
  };

  if (preferences && typeof preferences === 'object') {
    payload.preferences = preferences;
  }

  return apiRequest('/agent/plan', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Calls the requirement extraction endpoint to parse natural language into parameters.
 * 
 * @param {Object} params
 * @param {string} params.message - Natural language prompt
 * @returns {Promise<Object>} Extracted requirements, assumptions, and missing info
 */
export async function parseTripRequirements({ message }) {
  if (!message || typeof message !== 'string' || !message.trim()) {
    throw new Error('Please provide a message to extract requirements');
  }

  return apiRequest('/agent/parse', {
    method: 'POST',
    body: JSON.stringify({ message: message.trim() }),
  });
}

/**
 * Approves an AI-generated trip plan and creates Trip, Stops, and Activities in GlobeTrotter.
 * 
 * @param {Object} planPayload - Validated AI plan object or identifier
 * @returns {Promise<{ success: boolean, tripId: string, message: string }>}
 */
export async function approveTripPlan(planPayload) {
  if (!planPayload || typeof planPayload !== 'object') {
    throw new Error('A valid travel plan payload is required for approval');
  }

  return apiRequest('/agent/approve', {
    method: 'POST',
    body: JSON.stringify(planPayload),
  });
}

export default {
  planTripWithAgent,
  parseTripRequirements,
  approveTripPlan,
};
