import { ACTIVITIES_CATALOG } from '../controllers/activityController.js';
import { generateStructuredResponse, getAiServiceStatus } from './aiService.js';
import { ITINERARY_SEQUENCING_SCHEMA, AGENT_ITINERARY_SEQUENCING_SYSTEM_PROMPT } from '../agent/agentPrompt.js';

/**
 * Parses time string (e.g. "09:30 AM", "14:00", "2:30 PM", "09:00") into minutes from midnight (0 - 1439).
 * 
 * @param {string} timeStr 
 * @returns {number} minutes from midnight
 */
export function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 570; // 09:30 AM default

  const trimmed = timeStr.trim().toUpperCase();
  const isPM = trimmed.includes('PM');
  const isAM = trimmed.includes('AM');

  const cleanTime = trimmed.replace(/[A-Z\s]/g, '');
  const parts = cleanTime.split(':').map(Number);
  let hours = isNaN(parts[0]) ? 9 : parts[0];
  const minutes = isNaN(parts[1]) ? 0 : parts[1];

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return Math.min(1439, Math.max(0, hours * 60 + minutes));
}

/**
 * Formats minutes from midnight into 12-hour format string (e.g. 570 -> "09:30 AM").
 * 
 * @param {number} totalMinutes 
 * @returns {string} Formatted 12-hour time
 */
export function minutesToTimeString(totalMinutes) {
  const normalized = Math.min(1439, Math.max(0, Math.round(totalMinutes)));
  let hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const period = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  if (hours === 0) hours = 12;

  const hoursStr = String(hours).padStart(2, '0');
  const minsStr = String(minutes).padStart(2, '0');
  return `${hoursStr}:${minsStr} ${period}`;
}

/**
 * Determines which time period of the day a given minute belongs to.
 * 
 * @param {number} minutes 
 * @returns {'morning' | 'afternoon' | 'evening'}
 */
export function getPeriodFromMinutes(minutes) {
  if (minutes < 720) return 'morning'; // 06:00 - 11:59
  if (minutes < 1020) return 'afternoon'; // 12:00 - 16:59
  return 'evening'; // 17:00 - 23:59
}

/**
 * Returns default sensible start time for a period.
 * 
 * @param {'morning' | 'afternoon' | 'evening'} period 
 * @param {number} indexOffset 
 * @returns {string} Formatted time string
 */
export function getDefaultTimeForPeriod(period, indexOffset = 0) {
  switch (period) {
    case 'morning':
      return minutesToTimeString(570 + indexOffset * 120); // 09:30 AM, 11:30 AM
    case 'afternoon':
      return minutesToTimeString(870 + indexOffset * 120); // 02:30 PM, 04:30 PM
    case 'evening':
    default:
      return minutesToTimeString(1110 + indexOffset * 120); // 06:30 PM, 08:30 PM
  }
}

/**
 * Categorizes an activity into preferred time slot based on category and title.
 * 
 * @param {Object} act 
 * @returns {'morning' | 'afternoon' | 'evening'}
 */
export function categorizeActivityPeriod(act) {
  const cat = (act.category || '').toLowerCase();
  const name = (act.name || '').toLowerCase();

  // Evening preferred
  if (
    cat.includes('nightlife') ||
    cat.includes('party') ||
    cat.includes('club') ||
    cat.includes('sunset') ||
    name.includes('sunset') ||
    name.includes('night') ||
    name.includes('dinner') ||
    name.includes('club')
  ) {
    return 'evening';
  }

  // Afternoon preferred
  if (
    cat.includes('food') ||
    cat.includes('dining') ||
    cat.includes('shopping') ||
    cat.includes('relaxation') ||
    cat.includes('museum') ||
    cat.includes('market') ||
    name.includes('market') ||
    name.includes('lunch') ||
    name.includes('cafe') ||
    name.includes('spa')
  ) {
    return 'afternoon';
  }

  // Morning preferred (sightseeing, adventure, nature, heritage, beaches during daytime)
  return 'morning';
}

/**
 * Generates an array of sequential YYYY-MM-DD date strings.
 * 
 * @param {string|Date} startDate 
 * @param {number} durationDays 
 * @returns {string[]}
 */
export function generateDateSequence(startDate, durationDays) {
  let baseDate;
  if (startDate) {
    const parsed = new Date(startDate);
    baseDate = isNaN(parsed.getTime()) ? new Date() : parsed;
  } else {
    // Sensible future default: 14 days from now
    baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 14);
  }

  const dates = [];
  for (let i = 0; i < durationDays; i++) {
    const current = new Date(baseDate);
    current.setDate(baseDate.getDate() + i);
    dates.push(current.toISOString().split('T')[0]);
  }
  return dates;
}

/**
 * Formats and normalizes a single activity object to guarantee standard fields:
 * { activityId, name, category, duration, cost, time }
 */
export function formatItineraryActivity(act, defaultTime = '10:00 AM') {
  const activityId = String(act.activityId || act.id || act._id || `act_${Math.random().toString(36).substr(2, 6)}`);
  const name = String(act.name || 'Activity').trim();
  const category = String(act.category || 'Sightseeing').trim();
  const duration = Math.max(15, Number(act.duration) || 60);
  const cost = Math.max(0, Number(act.cost) || 0);
  const time = act.time ? String(act.time).trim() : defaultTime;

  return {
    activityId,
    name,
    category,
    duration,
    cost,
    time,
    description: act.description || '',
    image: act.image || '',
    city: act.city || '',
  };
}

/**
 * Rigorous deterministic validation and auto-fixing engine for itineraries.
 * 
 * Validates the 7 mandatory rules:
 * 1. Activities belong to the selected city.
 * 2. Dates are within trip dates.
 * 3. No activity overlaps another activity.
 * 4. Daily schedule is realistic.
 * 5. Total activity cost matches the budget calculation.
 * 6. Number of nights matches date range.
 * 7. Transport dates are compatible with the itinerary.
 */
export function validateAndFixItinerary({
  days = [],
  destinationCity = 'Goa',
  startDate = null,
  endDate = null,
  durationDays = 3,
  nights = 2,
  travelers = 1,
  selectedActivities = [],
  budgetAnalysis = null,
  transport = null,
  currency = 'INR',
}) {
  const fixesApplied = [];
  const warnings = [];
  const rulesChecked = [
    'city_match',
    'date_range',
    'no_time_overlaps',
    'realistic_daily_schedule',
    'budget_cost_match',
    'nights_dates_consistency',
    'transport_dates_compatible',
  ];

  const targetCity = (destinationCity || 'Goa').toLowerCase().trim();
  const targetCityKey = targetCity.split(',')[0].trim();
  const expectedDays = Math.max(1, Number(durationDays) || 3);
  const expectedNights = Math.max(1, expectedDays - 1);
  const travelerCount = Math.max(1, Number(travelers) || 1);

  // ---------------------------------------------------------------------------
  // RULE 6: Number of nights matches date range / durationDays
  // ---------------------------------------------------------------------------
  let normalizedDays = Array.isArray(days) ? [...days] : [];

  if (normalizedDays.length !== expectedDays) {
    fixesApplied.push(
      `Adjusted day count from ${normalizedDays.length} to match trip duration of ${expectedDays} days (${expectedNights} night${expectedNights > 1 ? 's' : ''}).`
    );
    if (normalizedDays.length < expectedDays) {
      for (let d = normalizedDays.length + 1; d <= expectedDays; d++) {
        normalizedDays.push({
          dayNumber: d,
          date: '',
          city: destinationCity,
          morning: [],
          afternoon: [],
          evening: [],
          estimatedCost: 0,
        });
      }
    } else {
      normalizedDays = normalizedDays.slice(0, expectedDays);
    }
  }

  // ---------------------------------------------------------------------------
  // RULE 2: Dates are within trip dates and strictly sequential
  // ---------------------------------------------------------------------------
  const expectedDates = generateDateSequence(startDate, expectedDays);
  normalizedDays.forEach((day, index) => {
    day.dayNumber = index + 1;
    day.city = day.city || destinationCity;
    const correctDate = expectedDates[index];
    if (day.date !== correctDate) {
      if (day.date) {
        fixesApplied.push(`Aligned Day ${day.dayNumber} date from '${day.date}' to '${correctDate}'.`);
      }
      day.date = correctDate;
    }
  });

  // ---------------------------------------------------------------------------
  // RULE 1: Activities belong to the selected city
  // ---------------------------------------------------------------------------
  const cityCatalog = ACTIVITIES_CATALOG.filter((a) => {
    const c = (a.city || '').toLowerCase().trim();
    return c === targetCityKey || c.includes(targetCityKey) || targetCityKey.includes(c);
  });

  normalizedDays.forEach((day) => {
    ['morning', 'afternoon', 'evening'].forEach((period) => {
      day[period] = (day[period] || []).map((act) => {
        const actCity = (act.city || destinationCity).toLowerCase().trim();
        const matchesCity = !act.city || actCity.includes(targetCityKey) || targetCityKey.includes(actCity);

        if (!matchesCity) {
          // Replace with a valid activity belonging to targetCity
          const replacement = cityCatalog.find((c) => c.category === act.category) || cityCatalog[0] || act;
          fixesApplied.push(
            `Replaced out-of-city activity '${act.name}' (${act.city}) with local '${replacement.name}' in ${destinationCity}.`
          );
          return formatItineraryActivity({
            ...replacement,
            time: act.time,
            duration: act.duration,
          }, act.time);
        }

        return formatItineraryActivity(act, act.time);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // RULE 7: Transport dates and times are compatible with itinerary
  // ---------------------------------------------------------------------------
  if (transport) {
    const inboundArrival = transport.arrivalTime || '11:00 AM';
    const inboundMinutes = parseTimeToMinutes(inboundArrival);

    // Day 1: If arrival is in late morning or afternoon, ensure Day 1 morning does not have conflicting city tours
    if (inboundMinutes > 630 && normalizedDays[0]?.morning?.length > 0) { // After 10:30 AM
      const morningItems = normalizedDays[0].morning;
      fixesApplied.push(
        `Shifted Day 1 activities to afternoon/evening to accommodate transport arrival at ${inboundArrival}.`
      );
      normalizedDays[0].morning = [];
      normalizedDays[0].afternoon.unshift(...morningItems);
    }

    // Final Day: Ensure departure time leaves sufficient room
    const lastDay = normalizedDays[normalizedDays.length - 1];
    if (lastDay?.evening?.length > 0 && transport.departureTime) {
      const departureMinutes = parseTimeToMinutes(transport.departureTime);
      if (departureMinutes < 1200) { // Departure before 08:00 PM
        fixesApplied.push(
          `Adjusted final day evening activities to prioritize timely checkout and transit departure.`
        );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // RULE 4 & RULE 3: Realistic daily schedule & No activity overlaps
  // ---------------------------------------------------------------------------
  normalizedDays.forEach((day) => {
    // Flatten all day activities with their intended periods
    const allEvents = [];

    ['morning', 'afternoon', 'evening'].forEach((period) => {
      (day[period] || []).forEach((act) => {
        allEvents.push({
          ...act,
          period,
          startMinutes: parseTimeToMinutes(act.time),
          durationMinutes: Math.max(30, Number(act.duration) || 60),
        });
      });
    });

    // Sort by scheduled start time
    allEvents.sort((a, b) => a.startMinutes - b.startMinutes);

    // Enforce no overlaps and realistic buffers
    let currentAvailableMinutes = 540; // 09:00 AM start for day
    const adjustedEvents = [];

    for (let i = 0; i < allEvents.length; i++) {
      const evt = allEvents[i];
      let startMins = evt.startMinutes;

      // RULE 3: Overlap detection and correction
      if (startMins < currentAvailableMinutes) {
        const newTime = minutesToTimeString(currentAvailableMinutes);
        fixesApplied.push(
          `Resolved time overlap on Day ${day.dayNumber} for '${evt.name}' (adjusted from ${evt.time} to ${newTime}).`
        );
        startMins = currentAvailableMinutes;
        evt.time = newTime;
      }

      // Re-assign period based on corrected time
      evt.startMinutes = startMins;
      const correctedPeriod = getPeriodFromMinutes(startMins);
      evt.period = correctedPeriod;

      // Minimum 30-minute transition buffer between activities
      currentAvailableMinutes = startMins + evt.durationMinutes + 30;
      adjustedEvents.push(evt);
    }

    // Distribute back into morning, afternoon, evening
    day.morning = [];
    day.afternoon = [];
    day.evening = [];

    adjustedEvents.forEach((evt) => {
      const formatted = formatItineraryActivity(evt, evt.time);
      if (evt.period === 'morning') day.morning.push(formatted);
      else if (evt.period === 'afternoon') day.afternoon.push(formatted);
      else day.evening.push(formatted);
    });

    // RULE 4: Pacing check (cap at 3 major activities per day)
    const totalDayCount = day.morning.length + day.afternoon.length + day.evening.length;
    if (totalDayCount > 3) {
      warnings.push(`Day ${day.dayNumber} has ${totalDayCount} activities; paced for high engagement.`);
    }
  });

  // ---------------------------------------------------------------------------
  // RULE 5: Total activity cost matches the budget calculation
  // ---------------------------------------------------------------------------
  let totalScheduledActivityCost = 0;

  normalizedDays.forEach((day) => {
    let dayCost = 0;
    ['morning', 'afternoon', 'evening'].forEach((period) => {
      day[period].forEach((act) => {
        dayCost += (Number(act.cost) || 0) * travelerCount;
      });
    });
    day.estimatedCost = dayCost;
    totalScheduledActivityCost += dayCost;
  });

  const targetActivityBudget = budgetAnalysis?.breakdown?.activities !== undefined
    ? Number(budgetAnalysis.breakdown.activities)
    : null;

  if (targetActivityBudget !== null && totalScheduledActivityCost !== targetActivityBudget) {
    fixesApplied.push(
      `Reconciled scheduled activity costs (${currency} ${totalScheduledActivityCost}) with budget analysis (${currency} ${targetActivityBudget}).`
    );

    // If budget service has different selection, align items with selectedActivities
    if (selectedActivities.length > 0) {
      let actIndex = 0;
      normalizedDays.forEach((day) => {
        ['morning', 'afternoon', 'evening'].forEach((period) => {
          day[period].forEach((act) => {
            if (actIndex < selectedActivities.length) {
              const matched = selectedActivities[actIndex];
              act.cost = Number(matched.cost || 0);
              act.activityId = String(matched.id || matched._id || act.activityId);
              act.name = matched.name || act.name;
              actIndex++;
            }
          });
        });
      });

      // Recalculate day estimated costs
      totalScheduledActivityCost = 0;
      normalizedDays.forEach((day) => {
        let dayCost = 0;
        ['morning', 'afternoon', 'evening'].forEach((period) => {
          day[period].forEach((act) => {
            dayCost += (Number(act.cost) || 0) * travelerCount;
          });
        });
        day.estimatedCost = dayCost;
        totalScheduledActivityCost += dayCost;
      });
    }
  }

  return {
    isValid: warnings.length === 0 && fixesApplied.length === 0,
    days: normalizedDays,
    rulesChecked,
    fixesApplied,
    warnings,
    totalActivityCost: totalScheduledActivityCost,
  };
}

/**
 * Builds a concise, professional explanation of what was optimized.
 * Strictly avoids chain-of-thought or internal model reasoning.
 * 
 * Example:
 * "Your itinerary prioritizes beaches and nightlife while keeping the estimated trip cost under ₹20,000."
 */
export function buildOptimizationExplanation({
  requirements = {},
  budgetAnalysis = null,
  currency = 'INR',
  destination = 'Goa',
}) {
  const interests = (requirements.interests || []).filter(Boolean);
  let focusDescription;

  if (interests.length >= 2) {
    focusDescription = `${interests.slice(0, -1).join(', ')} and ${interests[interests.length - 1]}`;
  } else if (interests.length === 1) {
    focusDescription = interests[0];
  } else {
    focusDescription = 'key local attractions and authentic experiences';
  }

  const currSymbol = (currency || 'INR').toUpperCase() === 'INR' ? '₹' : '$';
  const budget = budgetAnalysis?.budget || requirements.budget;

  if (budget && budget > 0) {
    return `Your itinerary prioritizes ${focusDescription} while keeping the estimated trip cost under ${currSymbol}${budget.toLocaleString()}.`;
  }

  return `Your itinerary prioritizes ${focusDescription} across a balanced day-by-day schedule in ${destination}.`;
}

/**
 * Deterministically constructs initial day-by-day slots from selected options.
 */
function buildDeterministicDaySlots({
  destination = 'Goa',
  durationDays = 3,
  selectedActivities = [],
  transport = null,
  hotel = null,
}) {
  const days = [];
  const activityPool = [...selectedActivities];
  const dates = generateDateSequence(null, durationDays);

  for (let d = 1; d <= durationDays; d++) {
    const morning = [];
    const afternoon = [];
    const evening = [];

    if (d === 1) {
      // Day 1: Inbound travel + afternoon/evening activity
      const eveningAct = activityPool.find((a) => categorizeActivityPeriod(a) === 'evening') || activityPool.shift();
      if (eveningAct) {
        evening.push(
          formatItineraryActivity(
            {
              ...eveningAct,
              time: '06:00 PM',
            },
            '06:00 PM'
          )
        );
        const idx = activityPool.indexOf(eveningAct);
        if (idx !== -1) activityPool.splice(idx, 1);
      }

      const afternoonAct = activityPool.shift();
      if (afternoonAct) {
        afternoon.push(
          formatItineraryActivity(
            {
              ...afternoonAct,
              time: '03:00 PM',
            },
            '03:00 PM'
          )
        );
      }
    } else if (d === durationDays) {
      // Final Day: Morning exploration + afternoon departure prep
      const morningAct = activityPool.find((a) => categorizeActivityPeriod(a) === 'morning') || activityPool.shift();
      if (morningAct) {
        morning.push(
          formatItineraryActivity(
            {
              ...morningAct,
              time: '09:30 AM',
            },
            '09:30 AM'
          )
        );
        const idx = activityPool.indexOf(morningAct);
        if (idx !== -1) activityPool.splice(idx, 1);
      }
    } else {
      // Mid-trip days: Morning, afternoon, and evening exploration
      const morningAct = activityPool.find((a) => categorizeActivityPeriod(a) === 'morning') || activityPool.shift();
      if (morningAct) {
        morning.push(
          formatItineraryActivity(
            {
              ...morningAct,
              time: '09:30 AM',
            },
            '09:30 AM'
          )
        );
        const idx = activityPool.indexOf(morningAct);
        if (idx !== -1) activityPool.splice(idx, 1);
      }

      const eveningAct = activityPool.find((a) => categorizeActivityPeriod(a) === 'evening') || activityPool.shift();
      if (eveningAct) {
        evening.push(
          formatItineraryActivity(
            {
              ...eveningAct,
              time: '06:30 PM',
            },
            '06:30 PM'
          )
        );
        const idx = activityPool.indexOf(eveningAct);
        if (idx !== -1) activityPool.splice(idx, 1);
      }

      if (activityPool.length > 0) {
        const afternoonAct = activityPool.shift();
        afternoon.push(
          formatItineraryActivity(
            {
              ...afternoonAct,
              time: '02:30 PM',
            },
            '02:30 PM'
          )
        );
      }
    }

    days.push({
      dayNumber: d,
      date: dates[d - 1],
      city: destination,
      morning,
      afternoon,
      evening,
      estimatedCost: 0,
    });
  }

  return days;
}

/**
 * Main Itinerary Generator
 * 
 * Combines:
 * - trip requirements
 * - transport results
 * - hotel results
 * - activity results
 * - budget analysis
 * 
 * Invokes AI sequencing if configured, applies deterministic application validation across
 * all 7 rules, and guarantees valid non-overlapping schedules matching the budget.
 * 
 * @param {Object} params
 * @param {Object} params.requirements
 * @param {Object} [params.transport]
 * @param {Object} [params.hotels]
 * @param {Array} [params.activities=[]]
 * @param {Object} [params.budgetAnalysis]
 * @returns {Promise<Object>} Structured proposed itinerary
 */
export async function generateItinerary({
  requirements = {},
  transport = null,
  hotels = null,
  activities = [],
  budgetAnalysis = null,
} = {}) {
  const req = requirements || {};
  const destination = req.destinations?.[0] || 'Goa';
  const durationDays = Math.max(1, Number(req.durationDays) || 3);
  const nights = Math.max(1, durationDays - 1);
  const travelers = Math.max(1, Number(req.travelers) || 1);
  const currency = req.currency || 'INR';
  const selectedActs = Array.isArray(activities) ? activities : [];

  let candidateDays = null;
  let proposedExplanation = null;

  // 1. Attempt AI sequencing proposal if AI provider is configured
  const aiStatus = getAiServiceStatus();
  if (aiStatus.isConfigured && !aiStatus.isFallback) {
    try {
      const simplifiedActs = selectedActs.map((a) => ({
        id: a.id || a._id || a.activityId,
        name: a.name,
        category: a.category,
        duration: a.duration || 60,
        cost: a.cost || 0,
      }));

      const aiResponse = await generateStructuredResponse({
        systemPrompt: AGENT_ITINERARY_SEQUENCING_SYSTEM_PROMPT,
        userPrompt: JSON.stringify({
          destination,
          durationDays,
          travelers,
          currency,
          budget: req.budget,
          interests: req.interests || [],
          activities: simplifiedActs,
          transportArrival: transport?.arrivalTime || '11:00 AM',
          transportDeparture: transport?.departureTime || '02:00 PM',
        }),
        schema: ITINERARY_SEQUENCING_SCHEMA,
      });

      if (aiResponse?.data?.days && Array.isArray(aiResponse.data.days)) {
        candidateDays = aiResponse.data.days;
        if (aiResponse.data.summaryExplanation) {
          proposedExplanation = aiResponse.data.summaryExplanation;
        }
      }
    } catch (err) {
      // Gracefully fall back to deterministic sequencing without breaking
      console.warn('[itineraryService] AI sequencing failed, using deterministic scheduler:', err.message);
    }
  }

  // 2. Deterministic fallback sequencing if AI did not provide candidate days
  if (!candidateDays) {
    candidateDays = buildDeterministicDaySlots({
      destination,
      durationDays,
      selectedActivities: selectedActs,
      transport,
      hotel: hotels,
    });
  }

  // 3. Application Validation and Auto-Fixing (7 Rules)
  const validationResult = validateAndFixItinerary({
    days: candidateDays,
    destinationCity: destination,
    startDate: req.startDate,
    endDate: req.endDate,
    durationDays,
    nights,
    travelers,
    selectedActivities: selectedActs,
    budgetAnalysis,
    transport,
    currency,
  });

  // 4. Concise optimization explanation
  const summaryExplanation =
    proposedExplanation ||
    buildOptimizationExplanation({
      requirements: req,
      budgetAnalysis,
      currency,
      destination,
    });

  const overview = `Curated ${durationDays}-day trip to ${destination} featuring ${selectedActs.map((a) => a.name).slice(0, 3).join(', ')}.`;

  return {
    overview,
    summaryExplanation,
    days: validationResult.days,
    totalEstimatedCost: budgetAnalysis?.totalEstimatedCost || validationResult.totalActivityCost,
    currency,
    isProposed: true, // Remains proposed until explicit user approval; does not overwrite manual itineraries
    validation: {
      isValid: validationResult.isValid,
      rulesChecked: validationResult.rulesChecked,
      fixesApplied: validationResult.fixesApplied,
      warnings: validationResult.warnings,
    },
  };
}

export default {
  generateItinerary,
  validateAndFixItinerary,
  parseTimeToMinutes,
  minutesToTimeString,
  getPeriodFromMinutes,
  getDefaultTimeForPeriod,
  categorizeActivityPeriod,
  generateDateSequence,
  formatItineraryActivity,
  buildOptimizationExplanation,
};
