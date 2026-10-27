import { extractTripRequirements } from './agentState.js';
import {
  searchCatalogActivities,
  searchTransportOptions,
  searchAccommodationOptions,
} from './agentTools.js';
import { calculateTripEstimate, allocateTripBudget } from '../services/budgetService.js';
import { generateItinerary } from '../services/itineraryService.js';
import { getBaselineActivityCost, isIndianDestination, standardizeActivityPricing } from '../services/activityPricingService.js';


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
  const promptText = typeof request === 'string'
    ? request
    : (request?.prompt || request?.request || `Plan a ${request?.durationDays || 5} day trip from ${request?.origin || 'Vadodara'} to ${request?.destination || 'Goa'} for ${request?.travelers || 2} people with a budget of ${request?.budget || 15000}`);
  const explicitPrefs = preferences || (typeof request === 'object' ? request : null);

  const state = createInitialAgentState(promptText);
  state.status = 'running';

  try {
    // =========================================================================
    // STEP 1: Parse requirements
    // =========================================================================
    const extractionResult = await extractTripRequirements(promptText);
    state.requirements = extractionResult.requirements;

    // Apply explicit preferences if provided
    if (explicitPrefs && typeof explicitPrefs === 'object') {
      if (explicitPrefs.destination || explicitPrefs.destinations) {
        const customDests = explicitPrefs.destinations || (explicitPrefs.destination ? [explicitPrefs.destination] : []);
        if (Array.isArray(customDests) && customDests.length > 0) {
          state.requirements.destinations = customDests;
        }
      }
      if (explicitPrefs.origin !== undefined) state.requirements.origin = explicitPrefs.origin;
      if (Array.isArray(explicitPrefs.stops)) state.requirements.stops = explicitPrefs.stops;
      if (explicitPrefs.startDate) state.requirements.startDate = explicitPrefs.startDate;
      if (explicitPrefs.endDate) state.requirements.endDate = explicitPrefs.endDate;
      if (explicitPrefs.durationDays) state.requirements.durationDays = Number(explicitPrefs.durationDays);
      if (explicitPrefs.travelers) state.requirements.travelers = Number(explicitPrefs.travelers);
      if (explicitPrefs.budget !== undefined && explicitPrefs.budget !== null) {
        state.requirements.budget = Number(explicitPrefs.budget);
      }
      if (explicitPrefs.currency) state.requirements.currency = explicitPrefs.currency;
      if (Array.isArray(explicitPrefs.interests) && explicitPrefs.interests.length > 0) {
        state.requirements.interests = [...new Set([...state.requirements.interests, ...explicitPrefs.interests])];
      }
      if (explicitPrefs.accommodationPreference) {
        state.requirements.accommodationPreference = explicitPrefs.accommodationPreference;
      }
      if (explicitPrefs.transportPreference) {
        state.requirements.transportPreference = explicitPrefs.transportPreference;
      }
      if (explicitPrefs.pace) state.requirements.pace = explicitPrefs.pace;
    }

    state.isFallback = Boolean(extractionResult.isFallback);
    state.aiDiagnostics = {
      provider: extractionResult.provider || (extractionResult.isFallback ? 'fallback' : 'openai'),
      model: extractionResult.model || 'gpt-4o-mini',
      isFallback: Boolean(extractionResult.isFallback),
      fallbackReason: extractionResult.fallbackReason || null,
    };

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
        aiDiagnostics: state.aiDiagnostics,
      };
    }

    const primaryDest = req.destinations[0];
    const durationDays = req.durationDays || 3;
    const durationNights = Math.max(1, durationDays - 1);
    const travelers = req.travelers || 1;
    const currency = req.currency || 'INR';
    const origin = req.origin || null;

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
      stops: req.stops || [],
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
    // Tool A: Search Transport (exact origin and destination required)
    // Tool A: Search Transport Options
    let transportOptions = [];
    const effectiveOrigin = origin || (primaryDest.toLowerCase().includes('switzerland') || primaryDest.toLowerCase().includes('paris') || primaryDest.toLowerCase().includes('tokyo') ? 'Mumbai' : 'Vadodara');

    transportOptions = await searchTransportOptions({
      origin: effectiveOrigin,
      destination: primaryDest,
      travelers,
      currency,
      date: req.startDate,
      preference: req.transportPreference,
    });
    state.toolResults.transport = transportOptions;

    if (origin) {
      appendLog(
        state,
        'transport_search',
        'completed',
        transportOptions.length > 0
          ? `${transportOptions.length} transport options found for ${origin} → ${primaryDest}`
          : `No direct demo transport found for ${origin} → ${primaryDest}`
      );
    } else {
      appendLog(
        state,
        'transport_search',
        'completed',
        transportOptions.length > 0
          ? `${transportOptions.length} transport options found (departure estimated from ${effectiveOrigin} hub)`
          : 'Origin city not specified; transport discovery omitted'
      );
    }

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

    // =========================================================================
    // STEP 5: Deterministic Budget Allocation
    // =========================================================================
    const budgetAllocation = allocateTripBudget({
      totalBudget: req.budget,
      durationDays,
      travelers,
      destination: primaryDest,
      currency,
      accommodationPreference: req.accommodationPreference,
      hasTransport: transportOptions.length > 0,
    });
    state.budgetAllocation = budgetAllocation;

    // Initial transport selection: prefer train or standard route
    let selectedTransport = transportOptions.length > 0
      ? (transportOptions.find((t) => t.type === 'train') || transportOptions[0])
      : null;

    // Initial hotel selection: prioritize options fitting within the allocated maxNightlyRate
    let selectedHotel = null;
    if (budgetAllocation.hasBudgetLimit && hotelOptions.length > 0) {
      const affordableHotels = hotelOptions.filter(
        (h) => (h.pricePerNight || (h.hotel && h.hotel.pricePerNight) || 0) <= budgetAllocation.maxNightlyRate
      );
      selectedHotel = affordableHotels.find((h) => h.tier === 'mid-range') || affordableHotels[0] || hotelOptions[0];
    } else {
      selectedHotel = hotelOptions.find((h) => h.tier === 'mid-range') || hotelOptions[0];
    }

    // Helpers for strict uniqueness across the trip
    const normalizeActName = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const isDuplicateAct = (list, act) => {
      if (!act || !act.name) return true;
      const key = normalizeActName(act.name);
      const actId = act.id || act._id || act.activityId;
      return list.some((item) => {
        const itemKey = normalizeActName(item.name);
        const itemId = item.id || item._id || item.activityId;
        return itemKey === key || (actId && itemId && actId === itemId);
      });
    };

    const generateDistinctActivity = (destination, index, existingList = []) => {
      const cleanCity = destination ? String(destination).trim() : 'Destination';
      const sampleBank = [
        { name: `${cleanCity} Historic Old Town & Heritage Promenade`, category: 'Sightseeing', duration: 120 },
        { name: `${cleanCity} Authentic Local Street Food & Culinary Crawl`, category: 'Food', duration: 120 },
        { name: `${cleanCity} Central Art & Cultural History Museum`, category: 'Culture', duration: 120 },
        { name: `${cleanCity} Sunset Lake & Waterfront Boulevard Promenade`, category: 'Relaxation', duration: 90 },
        { name: `${cleanCity} Traditional Artisan Bazaar & Handicrafts Market`, category: 'Shopping', duration: 120 },
        { name: `${cleanCity} Sacred Temple & Ancient Shrine Heritage Trail`, category: 'Culture', duration: 90 },
        { name: `${cleanCity} Botanical Gardens & Green Valley Nature Walk`, category: 'Nature', duration: 120 },
        { name: `${cleanCity} Hilltop Viewpoint & Panoramic Sunrise Trek`, category: 'Adventure', duration: 150 },
        { name: `${cleanCity} Night Bazaar, Live Music & Rooftop Lounge`, category: 'Nightlife', duration: 180 },
        { name: `${cleanCity} Riverside Boat Cruise & Scenic Skyline Tour`, category: 'Sightseeing', duration: 90 },
        { name: `${cleanCity} Royal Palace Grounds & Architecture Walk`, category: 'Culture', duration: 120 },
        { name: `${cleanCity} Sunset Cafe & Gourmet Dessert Tasting`, category: 'Food', duration: 90 },
        { name: `${cleanCity} Coastal Beach Promenade & Golden Sands Trail`, category: 'Relaxation', duration: 90 },
        { name: `${cleanCity} Regional Spice & Organic Produce Market Tour`, category: 'Food', duration: 75 },
        { name: `${cleanCity} Historic Fortress Bastion & Defense Walls Hike`, category: 'Sightseeing', duration: 120 },
        { name: `${cleanCity} Cycling Exploration Through Heritage Suburbs`, category: 'Adventure', duration: 150 },
        { name: `${cleanCity} Contemporary Art Gallery & Modern Sculpture Park`, category: 'Culture', duration: 90 },
        { name: `${cleanCity} Twilight Street Lanterns & Cultural Music Walk`, category: 'Nightlife', duration: 90 },
        { name: `${cleanCity} Nature Reserve Birdwatching & Canopy Trail`, category: 'Nature', duration: 120 },
        { name: `${cleanCity} Authentic Cooking Demonstration & Chef's Table`, category: 'Food', duration: 120 },
        { name: `${cleanCity} Panoramic Cable Car & Valley Observation Deck`, category: 'Sightseeing', duration: 90 },
        { name: `${cleanCity} Heritage Library & Archival Rare Books Exhibit`, category: 'Culture', duration: 60 },
        { name: `${cleanCity} Peaceful Urban Oasis & Zen Reflection Garden`, category: 'Relaxation', duration: 75 },
        { name: `${cleanCity} Evening Rooftop Astronomy & Constellation Stargazing`, category: 'Adventure', duration: 90 },
        { name: `${cleanCity} Souvenir Pottery & Traditional Clay Crafting Workshop`, category: 'Shopping', duration: 90 },
      ];

      for (let i = 0; i < sampleBank.length; i++) {
        const candidate = sampleBank[(index + i) % sampleBank.length];
        if (!existingList.some((e) => normalizeActName(e.name) === normalizeActName(candidate.name))) {
          const actCost = getBaselineActivityCost(candidate.category, currency, candidate.name, cleanCity);
          return {
            id: `act_${cleanCity.toLowerCase().replace(/[^a-z0-9]/g, '_')}_synth_${index + i + 1}`,
            name: candidate.name,
            city: cleanCity,
            category: candidate.category,
            cost: actCost,
            price: actCost,
            currency,
            pricingType: actCost === 0 ? 'free' : 'estimated',
            pricePerPerson: true,
            isVerified: false,
            source: 'local_estimate',
            duration: candidate.duration,
            description: `Curated ${candidate.category.toLowerCase()} experience in ${cleanCity}.`,
          };
        }
      }

      const defaultCost = getBaselineActivityCost('Sightseeing', currency, 'Special Discovery Walk', cleanCity);
      return {
        id: `act_${cleanCity.toLowerCase().replace(/[^a-z0-9]/g, '_')}_synth_${index + 100}`,
        name: `${cleanCity} Special Discovery Walk & Highlight Tour ${index + 1}`,
        city: cleanCity,
        category: 'Sightseeing',
        cost: defaultCost,
        price: defaultCost,
        currency,
        pricingType: defaultCost === 0 ? 'free' : 'estimated',
        pricePerPerson: true,
        isVerified: false,
        source: 'local_estimate',
        duration: 90,
        description: `Curated discovery activity in ${cleanCity}.`,
      };
    };

    // Target activity count:
    // If budget per person per day is tight (< ₹1,500/day/person), target 2 activities per day
    // If standard or high budget, target 2 to 3 activities per day
    const isTightBudget = budgetAllocation.hasBudgetLimit && (req.budget / (travelers * durationDays)) < 1500;
    const targetActivityCount = isTightBudget ? Math.max(durationDays * 2, 4) : Math.max(durationDays * 3, 6);

    // Initial activity selection: prioritize user interests and budget envelope
    const matchingActs = activityOptions.filter((a) => {
      if (req.interests.length === 0) return true;
      const catLower = (a.category || '').toLowerCase();
      return req.interests.some((i) => catLower.includes(i.toLowerCase()) || a.name.toLowerCase().includes(i.toLowerCase()));
    });
    const remainingActs = activityOptions.filter((a) => !matchingActs.some((m) => m.id === a.id));

    // Sort candidate pool: when budget is tight, prioritize free & affordable items
    const sortedPool = [...matchingActs, ...remainingActs].sort((a, b) => {
      const aCost = Number(a.cost || 0);
      const bCost = Number(b.cost || 0);
      if (isTightBudget) {
        return aCost - bCost;
      }
      return 0;
    });

    const maxAllowedForActs = budgetAllocation.hasBudgetLimit ? budgetAllocation.activitiesBudget : Infinity;
    let selectedActivities = [];
    let currentActsSum = 0;

    for (const act of sortedPool) {
      if (selectedActivities.length >= targetActivityCount) break;
      if (isDuplicateAct(selectedActivities, act)) continue;
      const actCostGroup = act.pricePerPerson !== false ? (act.cost || 0) * travelers : (act.cost || 0);
      if (currentActsSum + actCostGroup <= maxAllowedForActs || (act.cost || 0) === 0 || selectedActivities.length < durationDays) {
        selectedActivities.push(act);
        currentActsSum += actCostGroup;
      }
    }

    // Ensure we reach targetActivityCount with 100% unique activities
    let synthOffset = 0;
    while (selectedActivities.length < targetActivityCount) {
      const unusedAct = activityOptions.find((a) => !isDuplicateAct(selectedActivities, a));
      if (unusedAct) {
        selectedActivities.push(unusedAct);
      } else {
        selectedActivities.push(generateDistinctActivity(primaryDest, synthOffset++, selectedActivities));
      }
    }

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
    // STEP 7 & STEP 8: Check budget & Re-plan if exceeded (Max 4 attempts)
    // =========================================================================
    if (!estimate.withinBudget) {
      state.status = 'replanning';
      appendLog(
        state,
        'budget_check',
        'warning',
        `Estimated cost ${symbol}${estimate.totalEstimatedCost.toLocaleString()} exceeds budget by ${symbol}${estimate.shortfall.toLocaleString()}`
      );
      appendLog(state, 'replanning', 'replanning', 'Re-planning: optimizing choices to fit budget');

      const MAX_REPLAN_ATTEMPTS = 4;
      let attempt = 0;

      while (!estimate.withinBudget && attempt < MAX_REPLAN_ATTEMPTS) {
        attempt++;

        if (attempt === 1) {
          // Attempt 1: Re-planning accommodation & transport to budget tier
          const budgetHotel = [...hotelOptions].sort(
            (a, b) => (a.pricePerNight || (a.hotel && a.hotel.pricePerNight) || 0) - (b.pricePerNight || (b.hotel && b.hotel.pricePerNight) || 0)
          )[0];
          if (budgetHotel) {
            selectedHotel = budgetHotel;
          }
          if (transportOptions.length > 0) {
            const budgetTransport = [...transportOptions].sort(
              (a, b) => (a.pricePerPerson || a.price || 0) - (b.pricePerPerson || b.price || 0)
            )[0];
            if (budgetTransport) {
              selectedTransport = budgetTransport;
            }
          }
        } else if (attempt === 2) {
          // Attempt 2: Replace expensive optional activities with free & low-cost destination activities
          const budgetSortedActs = [...activityOptions].sort((a, b) => (a.cost || 0) - (b.cost || 0));
          const maxRemainingForActs = req.budget
            ? Math.max(0, req.budget - (estimate.breakdown?.transportation || 0) - (estimate.breakdown?.accommodation || 0) - (estimate.breakdown?.food || 0) - (estimate.breakdown?.miscellaneous || 0))
            : Infinity;

          let picked = [];
          let currentActSum = 0;
          for (const act of budgetSortedActs) {
            if (picked.length >= targetActivityCount) break;
            if (isDuplicateAct(picked, act)) continue;
            const itemTotal = act.pricePerPerson !== false ? (act.cost || 0) * travelers : (act.cost || 0);
            if (currentActSum + itemTotal <= maxRemainingForActs || (act.cost || 0) === 0) {
              picked.push(act);
              currentActSum += itemTotal;
            }
          }
          let replanOffset = 0;
          while (picked.length < targetActivityCount) {
            const unusedFreeAct = budgetSortedActs.find((a) => !isDuplicateAct(picked, a) && (a.cost || 0) === 0);
            if (unusedFreeAct) {
              picked.push(unusedFreeAct);
            } else {
              picked.push(generateDistinctActivity(primaryDest, replanOffset++, picked));
            }
          }
          selectedActivities = picked;
        } else if (attempt === 3) {
          // Attempt 3: Adjust food & misc allowances to economical travel tier
          const econFood = currency === 'INR' ? 250 : 6;
          const econMisc = currency === 'INR' ? 80 : 2;
          estimate = calculateTripEstimate({
            transport: selectedTransport,
            hotels: selectedHotel,
            activities: selectedActivities,
            travelers,
            nights: durationNights,
            budget: req.budget,
            currency,
            foodDailyAllowance: econFood,
            miscDailyAllowance: econMisc,
          });
          state.budgetAnalysis = estimate;
          if (estimate.withinBudget) {
            state.status = 'running';
            appendLog(state, 'replanning', 'completed', `Optimized cost ${symbol}${estimate.totalEstimatedCost.toLocaleString()} within budget`);
            break;
          }
        } else if (attempt === 4) {
          // Attempt 4: Prune remaining paid optional experiences to strictly free attractions
          const allFree = activityOptions.filter((a) => (a.cost || 0) === 0);
          let strictlyFreePicked = [];
          for (const act of allFree) {
            if (strictlyFreePicked.length >= durationDays * 2) break;
            if (!isDuplicateAct(strictlyFreePicked, act)) {
              strictlyFreePicked.push(act);
            }
          }
          let freeOffset = 0;
          while (strictlyFreePicked.length < durationDays * 2) {
            const synth = generateDistinctActivity(primaryDest, freeOffset++, strictlyFreePicked);
            synth.cost = 0;
            synth.price = 0;
            synth.pricingType = 'free';
            strictlyFreePicked.push(synth);
          }
          selectedActivities = strictlyFreePicked;
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
          appendLog(state, 'replanning', 'completed', `Optimized cost ${symbol}${estimate.totalEstimatedCost.toLocaleString()} within budget`);
          break;
        }
      }

      // If still exceeding budget after replanning attempts, report shortfall and meaningful alternatives
      if (!estimate.withinBudget) {
        const explanation = `Your current preferences are estimated to exceed the budget by ${symbol}${estimate.shortfall.toLocaleString()}. We suggest considering budget accommodation, replacing paid attractions with free alternatives, or increasing the budget by ${symbol}${estimate.shortfall.toLocaleString()}.`;
        appendLog(state, 'budget_check', 'warning', explanation);
        state.budgetWarning = explanation;
        state.message = explanation;
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

    // If still exceeding budget after replanning attempts, log advisory notice and meaningful trade-offs
    if (!estimate.withinBudget) {
      const explanation = `Note: Current preferences are estimated to exceed the budget by ${symbol}${estimate.shortfall.toLocaleString()} (Estimated ${symbol}${estimate.totalEstimatedCost.toLocaleString()} vs budget ${symbol}${req.budget.toLocaleString()}). We recommend reducing accommodation costs, replacing paid attractions with free alternatives, or adjusting the budget ceiling.`;
      appendLog(state, 'budget_check', 'warning', explanation);
      state.message = explanation;
      if (state.itinerary) {
        state.itinerary.summaryExplanation = explanation;
      }
      if (state.budgetAnalysis) {
        state.budgetAnalysis.explanation = explanation;
      }
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
      message: state.message || null,
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
      aiDiagnostics: state.aiDiagnostics,
      isFallback: state.isFallback,
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
