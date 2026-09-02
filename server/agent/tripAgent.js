import { extractTripRequirements } from './agentState.js';
import {
  searchCatalogActivities,
  searchTransportOptions,
  searchAccommodationOptions,
} from './agentTools.js';
import { calculateTripEstimate } from '../services/budgetService.js';
import { generateItinerary } from '../services/itineraryService.js';


/**
 * Allowed Execution Log Statuses:
 * 'pending' | 'running' | 'completed' | 'warning' | 'failed' | 'replanning'
 */

/**
 * Creates an empty, normalized agent state object.
 */
export const createInitialAgentState = (request = '') => ({
  request,
  requirements: null,
  plan: null,
  toolResults: {
    transport: [],
    hotels: [],
    activities: [],
  },
  selectedOptions: {
    transport: null,
    hotel: null,
    activities: [],
  },
  budgetAnalysis: null,
  itinerary: {
    overview: '',
    summaryExplanation: '',
    days: [],
    isProposed: true,
  },
  executionLog: [],
  status: 'pending', // 'pending' | 'running' | 'awaiting_approval' | 'needs_user_input' | 'failed'
  requiresUserInput: false,
  requiresApproval: false,
});

/**
 * Helper to push an observable step log to executionLog.
 * Never stores or leaks hidden reasoning or secrets.
 */
const appendLog = (state, step, status, message) => {
  state.executionLog.push({
    step,
    status,
    message,
    timestamp: new Date().toISOString(),
  });
};



/**
 * Core Agent Orchestrator Pipeline
 * Deterministically coordinates requirement extraction, tool discovery, comparison,
 * budget enforcement, and re-planning.
 * 
 * @param {string} request - User natural language prompt
 * @param {Object} [preferences=null] - Optional user travel preferences
 * @returns {Promise<Object>} Final agent state or needs_input response
 */
export async function runTripAgent(request, preferences = null) {
  const state = createInitialAgentState(request);
  state.status = 'running';

  try {
    // =========================================================================
    // STEP 1: Parse requirements
    // =========================================================================
    const extractionResult = await extractTripRequirements(request);
    state.requirements = extractionResult.requirements;

    // Apply explicit preferences if provided
    if (preferences && typeof preferences === 'object') {
      if (preferences.destination || preferences.destinations) {
        const customDests = preferences.destinations || (preferences.destination ? [preferences.destination] : []);
        if (Array.isArray(customDests) && customDests.length > 0) {
          state.requirements.destinations = customDests;
        }
      }
      if (preferences.origin) state.requirements.origin = preferences.origin;
      if (preferences.startDate) state.requirements.startDate = preferences.startDate;
      if (preferences.endDate) state.requirements.endDate = preferences.endDate;
      if (preferences.durationDays) state.requirements.durationDays = Number(preferences.durationDays);
      if (preferences.travelers) state.requirements.travelers = Number(preferences.travelers);
      if (preferences.budget !== undefined && preferences.budget !== null) {
        state.requirements.budget = Number(preferences.budget);
      }
      if (preferences.currency) state.requirements.currency = preferences.currency;
      if (Array.isArray(preferences.interests) && preferences.interests.length > 0) {
        state.requirements.interests = [...new Set([...state.requirements.interests, ...preferences.interests])];
      }
      if (preferences.accommodationPreference) {
        state.requirements.accommodationPreference = preferences.accommodationPreference;
      }
      if (preferences.transportPreference) {
        state.requirements.transportPreference = preferences.transportPreference;
      }
      if (preferences.pace) state.requirements.pace = preferences.pace;
    }

    const req = state.requirements;
    const destName = req.destinations.length > 0 ? req.destinations.join(', ') : null;

    appendLog(state, 'requirements_parsing', 'completed', 'Requirements understood');

    // =========================================================================
    // STEP 2: Check whether required information is missing
    // =========================================================================

    if (!destName || req.destinations.length === 0) {
      appendLog(
        state,
        'missing_info_check',
        'warning',
        'Specific destination is missing or vague. Please specify a destination city to proceed with planning.'
      );
      state.status = 'needs_input';
      state.requiresUserInput = true;
      state.requiresApproval = false;
      const missing = extractionResult.missingInformation.length > 0
        ? [...extractionResult.missingInformation]
        : ['Specific destination city'];
      if (!missing.some((m) => m.toLowerCase().includes('destination'))) {
        missing.unshift('Specific destination city');
      }
      state.missingInformation = missing;
      state.message = 'Specific destination is missing or vague. Please specify a destination city to proceed with planning.';

      return {
        success: true,
        status: 'needs_input',
        requiresUserInput: true,
        missingInformation: missing,
        message: state.message,
        agent: {
          status: 'needs_input',
          executionLog: state.executionLog,
        },
        requirements: state.requirements,
        requiresApproval: false,
      };
    }

    const primaryDest = req.destinations[0];
    const durationDays = req.durationDays || 3;
    const durationNights = Math.max(1, durationDays - 1);
    const travelers = req.travelers || 1;
    const currency = req.currency || 'INR';
    const origin = req.origin || 'Mumbai';

    // Execution plan state
    state.plan = {
      title: `${durationDays}-Day Trip to ${primaryDest}`,
      destination: primaryDest,
      origin,
      durationDays,
      durationNights,
      travelers,
      currency,
      interests: req.interests,
      stages: [
        'Transport Discovery',
        'Hotel & Resort Selection',
        'Activity Discovery & Schedule Alignment',
        'Cost Estimation & Budget Verification',
        'Optimized Itinerary Assembly',
      ],
    };

    // =========================================================================
    // STEP 4: Call travel tools
    // =========================================================================
    // Tool A: Search Transport
    const transportOptions = await searchTransportOptions({
      origin,
      destination: primaryDest,
      travelers,
      currency,
      date: req.startDate,
      preference: req.transportPreference,
    });
    state.toolResults.transport = transportOptions;
    appendLog(state, 'transport_search', 'completed', `${transportOptions.length} transport options found`);

    // Tool B: Search Accommodations
    const hotelOptions = await searchAccommodationOptions({
      destination: primaryDest,
      durationNights,
      travelers,
      currency,
    });
    state.toolResults.hotels = hotelOptions;
    appendLog(state, 'hotel_search', 'completed', `${hotelOptions.length} hotels found`);

    // Tool C: Search Activities
    const activityOptions = await searchCatalogActivities({
      destination: primaryDest,
      categories: req.interests,
      currency,
    });
    state.toolResults.activities = activityOptions;
    appendLog(state, 'activity_search', 'completed', `${activityOptions.length} activities found`);

    // Initial default choice: comfort/standard
    let selectedTransport = transportOptions.find((t) => t.type === 'train') || transportOptions[0];
    let selectedHotel = hotelOptions.find((h) => h.tier === 'mid-range') || hotelOptions[0];

    // Align with interests for activities
    const matchingActs = activityOptions.filter((a) => {
      if (req.interests.length === 0) return true;
      const catLower = (a.category || '').toLowerCase();
      return req.interests.some((i) => catLower.includes(i.toLowerCase()) || a.name.toLowerCase().includes(i.toLowerCase()));
    });
    let selectedActivities = (matchingActs.length > 0 ? matchingActs : activityOptions).slice(0, durationDays * 2);

    // =========================================================================
    // STEP 6: Calculate cost & initial budget check
    // =========================================================================
    const symbol = (currency || 'INR').toUpperCase() === 'INR' ? '₹' : (currency || '$');

    let estimate = calculateTripEstimate({
      transport: selectedTransport,
      hotels: selectedHotel,
      activities: selectedActivities,
      travelers,
      nights: durationNights,
      budget: req.budget,
      currency,
    });
    state.budgetAnalysis = estimate;

    // =========================================================================
    // STEP 7 & STEP 8: Check budget & Re-plan if exceeded (Max 3 attempts)
    // =========================================================================
    if (!estimate.withinBudget) {
      state.status = 'replanning';
      appendLog(
        state,
        'budget_check',
        'warning',
        `Estimated cost ${symbol}${estimate.totalEstimatedCost.toLocaleString()} exceeds budget`
      );
      appendLog(state, 'replanning', 'replanning', 'Re-planning');

      const MAX_REPLAN_ATTEMPTS = 3;
      let attempt = 0;

      while (!estimate.withinBudget && attempt < MAX_REPLAN_ATTEMPTS) {
        attempt++;

        if (attempt === 1) {
          // Attempt 1: Re-planning transport
          const budgetTransport = [...transportOptions].sort((a, b) => (a.pricePerPerson || a.price || 0) - (b.pricePerPerson || b.price || 0))[0];
          if (budgetTransport) {
            selectedTransport = budgetTransport;
          }
        } else if (attempt === 2) {
          // Attempt 2: Re-planning accommodation
          const budgetHotel = [...hotelOptions].sort((a, b) => (a.pricePerNight || (a.hotel && a.hotel.pricePerNight) || 0) - (b.pricePerNight || (b.hotel && b.hotel.pricePerNight) || 0))[0];
          if (budgetHotel) {
            selectedHotel = budgetHotel;
          }
        } else if (attempt === 3) {
          // Attempt 3: Adjusting activities
          selectedActivities = activityOptions
            .sort((a, b) => (a.cost || 0) - (b.cost || 0))
            .filter((a) => (a.cost || 0) <= 1500)
            .slice(0, Math.min(2, durationDays));
        }

        // Recalculate deterministic estimate with budgetService
        estimate = calculateTripEstimate({
          transport: selectedTransport,
          hotels: selectedHotel,
          activities: selectedActivities,
          travelers,
          nights: durationNights,
          budget: req.budget,
          currency,
        });
        state.budgetAnalysis = estimate;

        if (estimate.withinBudget) {
          state.status = 'running';
          appendLog(state, 'replanning', 'completed', `Optimized cost ${symbol}${estimate.totalEstimatedCost.toLocaleString()}`);
          break;
        }
      }
    } else if (req.budget) {
      appendLog(
        state,
        'budget_check',
        'completed',
        `Estimated cost ${symbol}${estimate.totalEstimatedCost.toLocaleString()} within budget`
      );
    }

    // Save final selected options into state
    state.selectedOptions = {
      transport: selectedTransport,
      hotel: selectedHotel,
      activities: selectedActivities,
    };

    // =========================================================================
    // STEP 9: Generate structured, validated itinerary
    // =========================================================================
    const structuredItinerary = await generateItinerary({
      requirements: req,
      transport: selectedTransport,
      hotels: selectedHotel,
      activities: selectedActivities,
      budgetAnalysis: estimate,
    });
    state.itinerary = structuredItinerary;
    appendLog(state, 'itinerary_assembly', 'completed', 'Itinerary ready');

    // If still exceeding budget after MAX_REPLAN_ATTEMPTS, request user input
    if (!estimate.withinBudget) {
      const explanation = 'The available demo options could not satisfy all constraints within the requested budget. You can increase the budget or relax one of the constraints.';
      appendLog(state, 'budget_check', 'warning', explanation);
      state.status = 'needs_input';
      state.requiresUserInput = true;
      state.requiresApproval = false;
      state.message = explanation;

      return {
        success: true,
        status: 'needs_input',
        requiresUserInput: true,
        missingInformation: ['Budget flexibility or relaxed constraints'],
        message: explanation,
        agent: {
          status: 'needs_input',
          executionLog: state.executionLog,
        },
        requirements: state.requirements,
        plan: state.plan,
        toolResults: state.toolResults,
        transportOptions: state.toolResults.transport,
        hotelOptions: state.toolResults.hotels,
        activities: state.selectedOptions.activities,
        selectedOptions: state.selectedOptions,
        budget: state.budgetAnalysis,
        budgetAnalysis: state.budgetAnalysis,
        itinerary: state.itinerary,
        executionLog: state.executionLog,
        requiresApproval: false,
      };
    }

    // =========================================================================
    // STEP 10: Return proposed plan (Waiting for user approval)
    // =========================================================================
    state.status = 'awaiting_approval';
    state.requiresApproval = true;
    state.requiresUserInput = false;

    return {
      success: true,
      status: state.status,
      agent: {
        status: 'awaiting_approval',
        executionLog: state.executionLog,
      },
      requirements: state.requirements,
      plan: state.plan,
      toolResults: state.toolResults,
      transportOptions: state.toolResults.transport,
      hotelOptions: state.toolResults.hotels,
      activities: state.selectedOptions.activities,
      itinerary: state.itinerary,
      budget: state.budgetAnalysis,
      budgetAnalysis: state.budgetAnalysis,
      selectedOptions: state.selectedOptions,
      executionLog: state.executionLog,
      requiresUserInput: false,
      requiresApproval: true,
    };
  } catch (error) {
    appendLog(state, 'agent_execution', 'failed', `Agent execution error: ${error.message}`);
    state.status = 'failed';
    return {
      success: false,
      status: 'failed',
      error: error.message,
      executionLog: state.executionLog,
      requiresUserInput: false,
      requiresApproval: false,
    };
  }
}

export default {
  runTripAgent,
  createInitialAgentState,
};
