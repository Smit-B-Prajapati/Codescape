import { extractTripRequirements } from '../agent/agentState.js';
import { runTripAgent } from '../agent/tripAgent.js';
import Trip from '../models/Trip.js';
import Stop from '../models/Stop.js';
import Activity from '../models/Activity.js';
import { CITIES_DATASET } from './cityController.js';
import {
  validateBudgetLimit,
  validateCurrency,
  validateTravelers,
  resolveCountryCoverPhoto,
} from './tripController.js';

const inFlightApprovals = new Set();

/**
 * Resolves country for a destination city using the curated dataset with regional fallbacks.
 *
 * @param {string} cityName
 * @returns {string} Country name
 */
export const resolveCountryForCity = (cityName) => {
  if (!cityName || typeof cityName !== 'string') return 'India';
  const trimmed = cityName.trim().toLowerCase();
  const match = CITIES_DATASET.find(
    (c) => c.city.toLowerCase() === trimmed || trimmed.includes(c.city.toLowerCase())
  );
  if (match) return match.country;

  // Regional heuristic fallback
  if (
    trimmed.includes('goa') ||
    trimmed.includes('mumbai') ||
    trimmed.includes('ahmedabad') ||
    trimmed.includes('jaipur') ||
    trimmed.includes('delhi') ||
    trimmed.includes('vadodara') ||
    trimmed.includes('bangalore') ||
    trimmed.includes('chennai') ||
    trimmed.includes('kolkata') ||
    trimmed.includes('kerala') ||
    trimmed.includes('manali') ||
    trimmed.includes('shimla') ||
    trimmed.includes('agra') ||
    trimmed.includes('varanasi')
  ) {
    return 'India';
  }
  if (trimmed.includes('paris') || trimmed.includes('nice') || trimmed.includes('lyon')) return 'France';
  if (trimmed.includes('tokyo') || trimmed.includes('kyoto') || trimmed.includes('osaka')) return 'Japan';
  if (trimmed.includes('rome') || trimmed.includes('florence') || trimmed.includes('venice')) return 'Italy';
  if (trimmed.includes('london') || trimmed.includes('edinburgh') || trimmed.includes('manchester')) return 'United Kingdom';
  if (trimmed.includes('bali') || trimmed.includes('jakarta')) return 'Indonesia';
  if (trimmed.includes('santorini') || trimmed.includes('athens')) return 'Greece';
  if (trimmed.includes('dubai') || trimmed.includes('abu dhabi')) return 'United Arab Emirates';
  if (trimmed.includes('bangkok') || trimmed.includes('phuket')) return 'Thailand';
  if (trimmed.includes('new york') || trimmed.includes('los angeles') || trimmed.includes('san francisco')) return 'United States';
  return 'India';
};

/**
 * Normalizes activity categories into the allowed Activity schema enum values.
 *
 * @param {string} category
 * @returns {string} Allowed category enum value
 */
export const normalizeCategory = (category = '') => {
  if (!category || typeof category !== 'string') return 'Sightseeing';
  const clean = category.trim().toLowerCase();
  if (clean.includes('sight') || clean.includes('landmark') || clean.includes('tour') || clean.includes('monument')) return 'Sightseeing';
  if (clean.includes('food') || clean.includes('dining') || clean.includes('cuisine') || clean.includes('restaurant') || clean.includes('eat') || clean.includes('cafe')) return 'Food & Dining';
  if (clean.includes('nature') || clean.includes('beach') || clean.includes('park') || clean.includes('lake') || clean.includes('waterfall') || clean.includes('garden')) return 'Nature';
  if (clean.includes('adventure') || clean.includes('sport') || clean.includes('scuba') || clean.includes('trek') || clean.includes('hike') || clean.includes('rafting')) return 'Adventure';
  if (clean.includes('shopping') || clean.includes('market') || clean.includes('bazaar') || clean.includes('mall')) return 'Shopping';
  if (clean.includes('cultur') || clean.includes('temple') || clean.includes('heritage') || clean.includes('museum') || clean.includes('church') || clean.includes('palace')) return 'Culture';
  if (clean.includes('relax') || clean.includes('spa') || clean.includes('wellness') || clean.includes('resort')) return 'Relaxation';
  if (clean.includes('transport') || clean.includes('transit') || clean.includes('train') || clean.includes('flight') || clean.includes('drive')) return 'Transportation';
  if (clean.includes('art') || clean.includes('gallery') || clean.includes('theater')) return 'Arts';
  if (clean.includes('night') || clean.includes('club') || clean.includes('party') || clean.includes('bar') || clean.includes('pub')) return 'Nightlife';
  if (clean.includes('history') || clean.includes('historic') || clean.includes('fort') || clean.includes('ancient')) return 'Historical';

  const validEnums = [
    'Sightseeing',
    'Food',
    'Food & Dining',
    'Dining',
    'Nature',
    'Adventure',
    'Shopping',
    'Cultural',
    'Culture',
    'Relaxation',
    'Transportation',
    'Arts',
    'Nightlife',
    'Historical',
    'Other',
  ];
  const exact = validEnums.find((v) => v.toLowerCase() === clean);
  return exact || 'Other';
};

const AGENT_EXECUTION_TIMEOUT_MS = 25000;

/**
 * @route   POST /api/agent/parse
 * @desc    Parse and extract normalized travel requirements from natural language
 * @access  Private (Requires valid JWT)
 */
export const parseTripRequirements = async (req, res) => {
  try {
    const { message } = req.body;

    // 1. Validation
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A non-empty travel request "message" is required',
      });
    }

    if (message.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Travel request message is too long (maximum 2,000 characters)',
      });
    }

    // 2. Call requirement extraction pipeline
    const extracted = await extractTripRequirements(message.trim());

    // 3. Return structured response conforming to agent specifications
    return res.status(200).json({
      success: true,
      data: {
        requirements: extracted.requirements,
        missingInformation: extracted.missingInformation,
        assumptions: extracted.assumptions,
        agentStatus: 'requirements_extracted',
      },
    });
  } catch (error) {
    console.error('[Agent Controller Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error extracting trip requirements',
    });
  }
};

/**
 * @route   POST /api/agent/plan
 * @desc    Execute the complete agentic planning pipeline (orchestrator)
 * @access  Private (Requires valid JWT)
 */
export const planTripWithAgent = async (req, res) => {
  try {
    const { message, preferences } = req.body;

    // 1. Request Validation
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A non-empty travel planning request "message" is required',
      });
    }

    if (message.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Travel planning request message is too long (maximum 2,000 characters)',
      });
    }

    if (preferences !== undefined && preferences !== null) {
      if (typeof preferences !== 'object' || Array.isArray(preferences)) {
        return res.status(400).json({
          success: false,
          message: 'Optional "preferences" must be a valid key-value object',
        });
      }
    }

    // 2. Timeout-guarded Agent Execution
    const timeoutPromise = new Promise((_, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Agent execution timed out while formulating trip plan'));
      }, AGENT_EXECUTION_TIMEOUT_MS);
      // Unref timer so it does not keep process alive in tests
      if (timer.unref) timer.unref();
    });

    const agentResult = await Promise.race([
      runTripAgent(message.trim(), preferences || null),
      timeoutPromise,
    ]);

    // 3. Handle missing information / needs user input
    if (agentResult.status === 'needs_input' || agentResult.requiresUserInput === true) {
      return res.status(200).json({
        status: 'needs_input',
        requiresUserInput: true,
        missingInformation: agentResult.missingInformation || ['destination'],
        success: true,
        message: agentResult.message || 'Additional information is required to generate your trip plan',
        agent: agentResult.agent || {
          status: 'needs_input',
          executionLog: agentResult.executionLog || [],
        },
        requirements: agentResult.requirements || null,
      });
    }

    // 4. Return complete proposed plan
    return res.status(200).json({
      success: true,
      agent: {
        status: 'awaiting_approval',
        executionLog: agentResult.executionLog || [],
      },
      requirements: agentResult.requirements,
      transportOptions: agentResult.transportOptions || agentResult.toolResults?.transport || [],
      hotelOptions: agentResult.hotelOptions || agentResult.toolResults?.hotels || [],
      activities: agentResult.activities || agentResult.selectedOptions?.activities || [],
      itinerary: agentResult.itinerary,
      budget: agentResult.budget || agentResult.budgetAnalysis,
      requiresUserInput: false,
      requiresApproval: true,
      selectedOptions: agentResult.selectedOptions,
    });
  } catch (error) {
    console.error('[Agent Plan Error]:', error.message);

    if (error.message && error.message.includes('timed out')) {
      return res.status(504).json({
        success: false,
        message: 'The travel planning agent timed out. Please retry with more specific parameters.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'An internal error occurred in the agent planning pipeline. Please try again.',
    });
  }
};

/**
 * @route   POST /api/agent/approve
 * @desc    Approve an AI-generated travel plan and persist Trip, Stops, and Activities
 * @access  Private (Requires valid JWT)
 */
export const approveTripPlan = async (req, res) => {
  let inFlightKey = null;

  try {
    // 1. Verify Authenticated User
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to approve trip plans',
      });
    }

    const authUserId = req.user._id.toString();

    // 2. Validate payload existence
    const rawPayload = req.body || {};
    const plan = rawPayload.plan || rawPayload.planPayload || rawPayload;

    if (!plan || typeof plan !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'A valid plan payload is required for approval',
      });
    }

    // 3. User Ownership Validation: Do not allow a user to approve a plan belonging to another user
    const submittedUserId = rawPayload.userId || rawPayload.user || plan.userId || plan.user;
    if (submittedUserId && submittedUserId.toString() !== authUserId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot approve a trip plan belonging to another user',
      });
    }

    const reqData = plan.requirements || {};
    const itinerary = plan.itinerary || {};
    const budgetData = plan.budget || plan.budgetAnalysis || {};

    // 4. Validate Dates
    const rawStart = plan.startDate || reqData.startDate || itinerary.days?.[0]?.date;
    const rawEnd = plan.endDate || reqData.endDate || itinerary.days?.[itinerary.days?.length - 1]?.date;

    if (!rawStart || !rawEnd) {
      return res.status(400).json({
        success: false,
        message: 'Plan must specify valid start date and end date',
      });
    }

    const startDate = new Date(rawStart);
    const endDate = new Date(rawEnd);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format for trip start or end date',
      });
    }

    if (endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: 'Trip end date cannot be earlier than start date',
      });
    }

    const durationDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    if (durationDays > 60) {
      return res.status(400).json({
        success: false,
        message: 'Trip duration cannot exceed 60 days',
      });
    }

    // Validate each itinerary day's date
    if (itinerary.days && Array.isArray(itinerary.days)) {
      for (const day of itinerary.days) {
        if (!day.date) {
          return res.status(400).json({
            success: false,
            message: `Itinerary day ${day.dayNumber || ''} is missing a date`,
          });
        }
        const dayDate = new Date(day.date);
        if (isNaN(dayDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: `Invalid date format in itinerary for day ${day.dayNumber || ''}: ${day.date}`,
          });
        }
        const dayStr = dayDate.toISOString().split('T')[0];
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        if (dayStr < startStr || dayStr > endStr) {
          return res.status(400).json({
            success: false,
            message: `Itinerary day date (${dayStr}) falls outside trip dates (${startStr} to ${endStr})`,
          });
        }
      }
    }

    // 5. Validate Cities
    let destinations = [];
    if (Array.isArray(reqData.destinations) && reqData.destinations.length > 0) {
      destinations = reqData.destinations;
    } else if (typeof reqData.destination === 'string' && reqData.destination.trim()) {
      destinations = [reqData.destination.trim()];
    } else if (Array.isArray(plan.destinations) && plan.destinations.length > 0) {
      destinations = plan.destinations;
    } else if (typeof plan.destination === 'string' && plan.destination.trim()) {
      destinations = [plan.destination.trim()];
    } else if (itinerary.days && Array.isArray(itinerary.days)) {
      const dayCities = itinerary.days.map((d) => d.city).filter((c) => typeof c === 'string' && c.trim());
      destinations = [...new Set(dayCities)];
    }

    if (!destinations || destinations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Plan must specify at least one valid destination city',
      });
    }

    for (const city of destinations) {
      if (typeof city !== 'string' || !city.trim() || city.trim().length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Destination city name must be a valid non-empty string under 100 characters',
        });
      }
    }

    // 6. Validate Activity IDs, Names, Costs, and Durations
    const allActivities = [];
    if (itinerary.days && Array.isArray(itinerary.days)) {
      for (const day of itinerary.days) {
        const slots = [
          ...(day.morning || []),
          ...(day.afternoon || []),
          ...(day.evening || []),
          ...(day.activities || []),
        ];
        for (const act of slots) {
          allActivities.push({ ...act, dayDate: day.date, dayCity: day.city });
        }
      }
    } else if (Array.isArray(plan.activities)) {
      for (const act of plan.activities) {
        allActivities.push({ ...act, dayDate: act.date || rawStart, dayCity: act.city || destinations[0] });
      }
    }

    for (let i = 0; i < allActivities.length; i++) {
      const act = allActivities[i];
      if (!act.name || typeof act.name !== 'string' || !act.name.trim()) {
        return res.status(400).json({
          success: false,
          message: `Activity at position ${i + 1} is missing a valid name`,
        });
      }

      if (act.name.trim().length > 200) {
        return res.status(400).json({
          success: false,
          message: `Activity name exceeds maximum 200 characters: ${act.name.slice(0, 30)}...`,
        });
      }

      const actId = act.activityId || act.id || act._id;
      if (actId !== undefined && actId !== null) {
        if (typeof actId !== 'string' && typeof actId !== 'number') {
          return res.status(400).json({
            success: false,
            message: `Invalid activity ID format: ${JSON.stringify(actId)}`,
          });
        }
      }

      // Cost validation (must be non-negative finite number)
      if (act.cost !== undefined && act.cost !== null) {
        const parsedCost = Number(act.cost);
        if (isNaN(parsedCost) || !isFinite(parsedCost) || parsedCost < 0) {
          return res.status(400).json({
            success: false,
            message: `Activity "${act.name}" has invalid cost: must be a non-negative number`,
          });
        }
      }

      // Duration validation
      if (act.duration !== undefined && act.duration !== null) {
        const parsedDur = Number(act.duration);
        if (isNaN(parsedDur) || !isFinite(parsedDur) || parsedDur < 0 || parsedDur > 1440) {
          return res.status(400).json({
            success: false,
            message: `Activity "${act.name}" has invalid duration (must be between 0 and 1440 minutes)`,
          });
        }
      }
    }

    // 7. Validate Budget & Currency
    const rawBudget = budgetData.budget !== undefined ? budgetData.budget : (reqData.budget !== undefined ? reqData.budget : plan.budgetLimit);
    const budgetRes = validateBudgetLimit(rawBudget);
    if (!budgetRes.valid) {
      return res.status(400).json({
        success: false,
        message: budgetRes.message,
      });
    }

    const rawCurrency = budgetData.currency || reqData.currency || plan.currency || 'USD';
    const currencyRes = validateCurrency(rawCurrency);
    if (!currencyRes.valid) {
      return res.status(400).json({
        success: false,
        message: currencyRes.message,
      });
    }

    // Validate Travelers
    let rawTravelers = plan.travelers || reqData.travelers;
    if (typeof rawTravelers === 'number' && rawTravelers > 0) {
      rawTravelers = Array.from({ length: rawTravelers }, (_, i) => `Traveler ${i + 1}`);
    }
    const travelersRes = validateTravelers(rawTravelers);
    if (!travelersRes.valid) {
      return res.status(400).json({
        success: false,
        message: travelersRes.message,
      });
    }

    // 8. Prevent Duplicate Submission
    const primaryCity = destinations[0] || 'AI Destination';
    const tripName = (
      plan.name ||
      plan.tripName ||
      `${primaryCity} Trip (${durationDays} Days)`
    ).trim().slice(0, 100);

    inFlightKey = `${authUserId}_${tripName}_${startDate.toISOString().split('T')[0]}`;
    if (inFlightApprovals.has(inFlightKey)) {
      return res.status(409).json({
        success: false,
        message: 'An approval request for this trip is already being processed. Please wait.',
      });
    }
    inFlightApprovals.add(inFlightKey);

    const recentDuplicate = await Trip.findOne({
      user: req.user._id,
      name: tripName,
      startDate: startDate,
      endDate: endDate,
      createdAt: { $gte: new Date(Date.now() - 45000) },
    });

    if (recentDuplicate) {
      return res.status(409).json({
        success: false,
        tripId: recentDuplicate._id,
        message: 'Duplicate submission detected. This trip has already been approved.',
      });
    }

    // 9. Create Trip (using existing Trip model)
    const trip = await Trip.create({
      user: req.user._id,
      name: tripName,
      description: (
        itinerary.summaryExplanation ||
        itinerary.overview ||
        `AI-generated trip itinerary for ${destinations.join(', ')}`
      ).trim().slice(0, 1000),
      startDate,
      endDate,
      budgetLimit: budgetRes.value,
      currency: currencyRes.value,
      travelers: travelersRes.value,
      coverPhoto: plan.coverPhoto || resolveCountryCoverPhoto(primaryCity),
      isPublic: false,
    });

    // 10. Create Stops (using existing Stop model)
    const stopGroups = [];
    if (itinerary.days && Array.isArray(itinerary.days) && itinerary.days.length > 0) {
      for (const day of itinerary.days) {
        const city = (day.city || primaryCity).trim();
        const currentGroup = stopGroups[stopGroups.length - 1];
        if (currentGroup && currentGroup.city.toLowerCase() === city.toLowerCase()) {
          currentGroup.endDate = day.date;
          currentGroup.days.push(day);
        } else {
          stopGroups.push({
            city,
            startDate: day.date,
            endDate: day.date,
            days: [day],
          });
        }
      }
    } else {
      const totalDays = durationDays || 1;
      const daysPerStop = Math.max(1, Math.floor(totalDays / destinations.length));
      for (let i = 0; i < destinations.length; i++) {
        const stopStart = new Date(startDate);
        stopStart.setDate(stopStart.getDate() + i * daysPerStop);
        const stopEnd = new Date(stopStart);
        if (i === destinations.length - 1) {
          stopEnd.setTime(endDate.getTime());
        } else {
          stopEnd.setDate(stopEnd.getDate() + daysPerStop - 1);
        }
        stopGroups.push({
          city: destinations[i],
          startDate: stopStart.toISOString().split('T')[0],
          endDate: stopEnd.toISOString().split('T')[0],
          days: [],
        });
      }
    }

    const createdStops = [];
    for (let i = 0; i < stopGroups.length; i++) {
      const sg = stopGroups[i];
      const stopDoc = await Stop.create({
        trip: trip._id,
        city: sg.city,
        country: resolveCountryForCity(sg.city),
        startDate: new Date(sg.startDate),
        endDate: new Date(sg.endDate),
        order: i,
      });
      createdStops.push({ stopDoc, sg });
    }

    // 11. Create Activities (using existing Activity model)
    const activityDocsToInsert = [];
    for (const { stopDoc, sg } of createdStops) {
      for (const day of sg.days) {
        const dayDate = new Date(day.date);
        const slots = [
          ...(day.morning || []),
          ...(day.afternoon || []),
          ...(day.evening || []),
          ...(day.activities || []),
        ];

        for (const act of slots) {
          activityDocsToInsert.push({
            trip: trip._id,
            stop: stopDoc._id,
            name: (act.name || 'Planned Activity').trim().slice(0, 150),
            description: (act.description || '').trim().slice(0, 500),
            category: normalizeCategory(act.category),
            date: dayDate,
            time: act.time || '10:00 AM',
            duration: Number(act.duration) || 60,
            cost: Number(act.cost) || 0,
            image: act.image || '',
          });
        }
      }
    }

    // Direct plan activities fallback
    if (activityDocsToInsert.length === 0 && Array.isArray(plan.activities) && plan.activities.length > 0) {
      const fallbackStopId = createdStops[0]?.stopDoc?._id;
      for (const act of plan.activities) {
        activityDocsToInsert.push({
          trip: trip._id,
          stop: fallbackStopId,
          name: (act.name || 'Planned Activity').trim().slice(0, 150),
          description: (act.description || '').trim().slice(0, 500),
          category: normalizeCategory(act.category),
          date: act.date ? new Date(act.date) : startDate,
          time: act.time || '10:00 AM',
          duration: Number(act.duration) || 60,
          cost: Number(act.cost) || 0,
          image: act.image || '',
        });
      }
    }

    if (activityDocsToInsert.length > 0) {
      await Activity.insertMany(activityDocsToInsert);
    }

    // 12. Return required response format
    return res.status(201).json({
      success: true,
      tripId: trip._id,
      message: 'AI trip successfully added to GlobeThrottle',
    });
  } catch (error) {
    console.error('[Agent Approve Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error approving and saving trip plan',
    });
  } finally {
    if (inFlightKey) {
      inFlightApprovals.delete(inFlightKey);
    }
  }
};

export default {
  parseTripRequirements,
  planTripWithAgent,
  approveTripPlan,
};

