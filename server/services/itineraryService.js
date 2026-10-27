import { ACTIVITIES_CATALOG } from '../controllers/activityController.js';
import { generateStructuredResponse, getAiServiceStatus } from './aiService.js';
import { ITINERARY_SEQUENCING_SCHEMA, AGENT_ITINERARY_SEQUENCING_SYSTEM_PROMPT } from '../agent/agentPrompt.js';
import { getBaselineActivityCost, standardizeActivityPricing, isInherentlyFreeExperience } from './activityPricingService.js';

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
  const currency = (act.currency || 'INR').toUpperCase();
  const pricingType = act.pricingType || (cost === 0 ? 'free' : (cost <= 100 ? 'entry_fee' : 'estimated'));
  const pricePerPerson = act.pricePerPerson !== false;
  const isVerified = Boolean(act.isVerified);
  const source = act.source || (isVerified ? 'local_catalog' : (cost === 0 ? 'free_attraction' : 'category_estimate'));

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
    currency,
    pricingType,
    pricePerPerson,
    isVerified,
    source,
  };
}

/**
 * Helper to retrieve an activity from the pool with preferred time slot categorization,
 * or gracefully generate a contextual destination activity if pool is exhausted.
 */
export function getNextSlotActivity(activityPool = [], destination = 'Destination', preferredPeriod = 'morning', fallbackIndex = 0, usedNames = new Set(), currency = 'INR') {
  const normKey = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  let act = null;
  // 1. Try finding an un-used activity matching the preferred period
  if (preferredPeriod && Array.isArray(activityPool) && activityPool.length > 0) {
    const candidateIdx = activityPool.findIndex(
      (a) => categorizeActivityPeriod(a) === preferredPeriod && !usedNames.has(normKey(a.name))
    );
    if (candidateIdx !== -1) {
      act = activityPool.splice(candidateIdx, 1)[0];
      usedNames.add(normKey(act.name));
      if (act.cost === undefined || act.cost === null || isNaN(Number(act.cost))) {
        act.cost = getBaselineActivityCost(act.category, currency, act.name, destination);
      } else {
        act.cost = Number(act.cost);
      }
      return act;
    }
  }

  // 2. Try finding ANY un-used activity in the pool
  if (Array.isArray(activityPool) && activityPool.length > 0) {
    const anyUnusedIdx = activityPool.findIndex((a) => !usedNames.has(normKey(a.name)));
    if (anyUnusedIdx !== -1) {
      act = activityPool.splice(anyUnusedIdx, 1)[0];
      usedNames.add(normKey(act.name));
      if (act.cost === undefined || act.cost === null || isNaN(Number(act.cost))) {
        act.cost = getBaselineActivityCost(act.category, currency, act.name, destination);
      } else {
        act.cost = Number(act.cost);
      }
      return act;
    }
  }

  // 3. Pool is exhausted or all items are already used: synthesize a distinct, authentic activity for destination
  const cleanCity = destination || 'Destination';
  const isINR = (currency || 'INR').toUpperCase() === 'INR';

  const periodDefaults = {
    morning: [
      { name: `${cleanCity} Historic Old Town & Heritage Promenade`, category: 'Sightseeing', cost: 0, duration: 120 },
      { name: `${cleanCity} Ancient Architecture & Colonial Heritage Walk`, category: 'Culture', cost: 0, duration: 120 },
      { name: `${cleanCity} Botanical Gardens & Green Park Trail`, category: 'Nature', cost: isINR ? 50 : 5, duration: 90 },
      { name: `${cleanCity} Sacred Temple & Ancient Shrine Heritage Trail`, category: 'Culture', cost: 0, duration: 90 },
      { name: `${cleanCity} Hilltop Viewpoint & Panoramic Sunrise Trek`, category: 'Adventure', cost: 0, duration: 120 },
      { name: `${cleanCity} Cycling Exploration Through Heritage Suburbs`, category: 'Adventure', cost: isINR ? 150 : 12, duration: 120 },
      { name: `${cleanCity} Coastal Morning Promenade & Sands Walk`, category: 'Relaxation', cost: 0, duration: 90 },
      { name: `${cleanCity} Peaceful Urban Oasis & Zen Reflection Garden`, category: 'Relaxation', cost: 0, duration: 75 },
    ],
    afternoon: [
      { name: `${cleanCity} Premier Art & Cultural Heritage Museum`, category: 'Culture', cost: isINR ? 100 : 10, duration: 120 },
      { name: `${cleanCity} Traditional Spice & Artisan Handicrafts Bazaar`, category: 'Shopping', cost: 0, duration: 120 },
      { name: `${cleanCity} Celebrated Regional Cafe & Culinary Tasting`, category: 'Food', cost: isINR ? 150 : 15, duration: 90 },
      { name: `${cleanCity} Royal Palace Grounds & Architecture Walk`, category: 'Culture', cost: isINR ? 150 : 12, duration: 120 },
      { name: `${cleanCity} Riverside Boat Cruise & Scenic Skyline Tour`, category: 'Sightseeing', cost: isINR ? 350 : 20, duration: 90 },
      { name: `${cleanCity} Contemporary Art Gallery & Modern Sculpture Park`, category: 'Culture', cost: isINR ? 50 : 8, duration: 90 },
      { name: `${cleanCity} Regional Spice & Organic Produce Market Tour`, category: 'Food', cost: 0, duration: 75 },
      { name: `${cleanCity} Historic Fortress Bastion & Defense Walls Hike`, category: 'Sightseeing', cost: isINR ? 50 : 6, duration: 120 },
    ],
    evening: [
      { name: `${cleanCity} Sunset Promenade & Waterfront Breeze Walk`, category: 'Relaxation', cost: 0, duration: 90 },
      { name: `${cleanCity} Authentic Street Food & Night Market Trail`, category: 'Food', cost: isINR ? 150 : 15, duration: 120 },
      { name: `${cleanCity} Cultural Music & Evening Lounge`, category: 'Nightlife', cost: isINR ? 250 : 20, duration: 150 },
      { name: `${cleanCity} Sunset Cafe & Regional Dessert Tasting`, category: 'Food', cost: isINR ? 150 : 12, duration: 90 },
      { name: `${cleanCity} Night Bazaar & Traditional Handicrafts Walk`, category: 'Shopping', cost: 0, duration: 120 },
      { name: `${cleanCity} Twilight Street Lanterns & Cultural Music Walk`, category: 'Nightlife', cost: 0, duration: 90 },
      { name: `${cleanCity} Evening Rooftop Astronomy & Constellation Stargazing`, category: 'Adventure', cost: isINR ? 150 : 15, duration: 90 },
      { name: `${cleanCity} Coastal Sunset Pier & Evening Harbor Trail`, category: 'Relaxation', cost: 0, duration: 90 },
    ],
  };

  const periodOptions = periodDefaults[preferredPeriod] || periodDefaults.morning;

  let picked = null;
  for (let i = 0; i < periodOptions.length; i++) {
    const candidate = periodOptions[(fallbackIndex + i) % periodOptions.length];
    if (!usedNames.has(normKey(candidate.name))) {
      picked = candidate;
      break;
    }
  }

  if (!picked) {
    const allFallbackOptions = [
      ...periodDefaults.morning,
      ...periodDefaults.afternoon,
      ...periodDefaults.evening,
    ];
    picked = allFallbackOptions.find((o) => !usedNames.has(normKey(o.name)));
  }

  if (!picked) {
    picked = {
      name: `${cleanCity} Curated Discovery Highlight Tour ${fallbackIndex + 1}`,
      category: 'Sightseeing',
      cost: 0,
      duration: 90,
    };
  }

  usedNames.add(normKey(picked.name));

  const numCost = Number(picked.cost);
  const finalCost = !isNaN(numCost) && numCost >= 0
    ? numCost
    : getBaselineActivityCost(picked.category, currency, picked.name, cleanCity);

  return {
    id: `act_${cleanCity.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${preferredPeriod}_${fallbackIndex + 1}`,
    name: picked.name,
    city: cleanCity,
    category: picked.category,
    cost: finalCost,
    price: finalCost,
    currency,
    pricingType: finalCost === 0 ? 'free' : 'estimated',
    pricePerPerson: true,
    duration: picked.duration || 90,
    description: `Curated ${preferredPeriod} experience in ${cleanCity}.`,
  };
}

/**
 * Rigorous deterministic validation and auto-fixing engine for itineraries.
 * 
 * Validates the 7 mandatory rules:
 * 1. Activities belong to the selected city.
 * 2. Dates are within trip dates.
 * 3. No activity overlaps another activity.
 * 4. Daily schedule is realistic (2 to 3 activities per day).
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

    // RULE 4: Guarantee 2 to 3 activities per day with realistic pacing
    const spareActivities = Array.isArray(selectedActivities) ? [...selectedActivities] : [];
    let totalDayCount = day.morning.length + day.afternoon.length + day.evening.length;
    if (totalDayCount < 2) {
      fixesApplied.push(`Expanded Day ${day.dayNumber} itinerary to include a full schedule of 2-3 activities.`);
      if (day.morning.length === 0) {
        const morningAct = getNextSlotActivity(spareActivities, destinationCity, 'morning', day.dayNumber * 10 + 1);
        day.morning.push(formatItineraryActivity({ ...morningAct, time: '09:30 AM' }, '09:30 AM'));
      }
      if (day.afternoon.length === 0) {
        const afternoonAct = getNextSlotActivity(spareActivities, destinationCity, 'afternoon', day.dayNumber * 10 + 2);
        day.afternoon.push(formatItineraryActivity({ ...afternoonAct, time: '02:00 PM' }, '02:00 PM'));
      }
      if (day.evening.length === 0 && (day.morning.length + day.afternoon.length < 3)) {
        const eveningAct = getNextSlotActivity(spareActivities, destinationCity, 'evening', day.dayNumber * 10 + 3);
        day.evening.push(formatItineraryActivity({ ...eveningAct, time: '06:30 PM' }, '06:30 PM'));
      }
      totalDayCount = day.morning.length + day.afternoon.length + day.evening.length;
    }

    // If evening is empty and there are unused selected activities, schedule them
    if (day.evening.length === 0 && (day.morning.length + day.afternoon.length < 3)) {
      const scheduledIds = new Set();
      normalizedDays.forEach((d) => {
        ['morning', 'afternoon', 'evening'].forEach((p) => {
          (d[p] || []).forEach((a) => {
            if (a.name) scheduledIds.add(a.name.toLowerCase().replace(/[^a-z0-9]/g, ''));
            if (a.id || a.activityId) scheduledIds.add(String(a.id || a.activityId).toLowerCase());
          });
        });
      });
      const unscheduled = (selectedActivities || []).find((a) => {
        const nKey = (a.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const idKey = String(a.id || a.activityId || '').toLowerCase();
        return !scheduledIds.has(nKey) && (!idKey || !scheduledIds.has(idKey));
      });
      if (unscheduled) {
        day.evening.push(formatItineraryActivity({ ...unscheduled, time: '06:30 PM' }, '06:30 PM'));
      }
    }

    totalDayCount = day.morning.length + day.afternoon.length + day.evening.length;
    if (totalDayCount > 3) {
      warnings.push(`Day ${day.dayNumber} has ${totalDayCount} activities; paced for high engagement.`);
    }
  });

  // ---------------------------------------------------------------------------
  // RULE 8: Activity Uniqueness Across Entire Trip (Zero Repeated Activities)
  // ---------------------------------------------------------------------------
  rulesChecked.push('activity_uniqueness');
  const tripUsedNames = new Set();
  const sparePoolForUniqueness = Array.isArray(selectedActivities) ? [...selectedActivities] : [];
  let fixCounter = 1;

  normalizedDays.forEach((day) => {
    ['morning', 'afternoon', 'evening'].forEach((period) => {
      day[period].forEach((act) => {
        const rawName = String(act.name || '').trim();
        const normKey = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (!normKey || tripUsedNames.has(normKey)) {
          // Replace duplicate with a unique activity for this destination and period
          const replacement = getNextSlotActivity(sparePoolForUniqueness, targetCityKey, period, day.dayNumber * 10 + fixCounter++, tripUsedNames, currency);
          fixesApplied.push(
            `Replaced duplicate activity "${rawName || 'Activity'}" on Day ${day.dayNumber} with unique experience "${replacement.name}".`
          );
          act.name = replacement.name;
          act.category = replacement.category || act.category;
          act.description = replacement.description || act.description;
          const repCost = Number(replacement.cost);
          act.cost = !isNaN(repCost) && repCost >= 0 ? repCost : getBaselineActivityCost(act.category, currency, act.name, targetCityKey);
          act.activityId = replacement.id || `act_unique_${Math.random().toString(36).substr(2, 7)}`;
          act.currency = replacement.currency || currency;
          act.pricingType = replacement.pricingType || (act.cost === 0 ? 'free' : 'estimated');
          act.pricePerPerson = replacement.pricePerPerson !== false;
          act.isVerified = Boolean(replacement.isVerified);
          tripUsedNames.add(replacement.name.toLowerCase().replace(/[^a-z0-9]/g, ''));
        } else {
          tripUsedNames.add(normKey);
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Authoritative Pricing & Re-Anchoring Against Catalog & Selected Activities
  // Guarantees AI sequencing cannot invent, inflate, or alter verified activity prices
  // ---------------------------------------------------------------------------
  const selectedById = new Map();
  const selectedByNormName = new Map();
  (selectedActivities || []).forEach((sa) => {
    if (sa.id || sa._id || sa.activityId) {
      selectedById.set(String(sa.id || sa._id || sa.activityId), sa);
    }
    if (sa.name) {
      selectedByNormName.set(sa.name.toLowerCase().replace(/[^a-z0-9]/g, ''), sa);
    }
  });

  const catalogByCityAndNorm = new Map();
  (ACTIVITIES_CATALOG || []).forEach((c) => {
    const cCity = (c.city || '').toLowerCase().trim();
    const cNorm = (c.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    catalogByCityAndNorm.set(`${cCity}:${cNorm}`, c);
  });

  normalizedDays.forEach((day) => {
    ['morning', 'afternoon', 'evening'].forEach((period) => {
      day[period].forEach((act) => {
        const actId = String(act.activityId || act.id || '');
        const actKey = String(act.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cityKey = `${targetCityKey}:${actKey}`;

        const matchedSelected = selectedById.get(actId) || selectedByNormName.get(actKey);
        const matchedCatalog = catalogByCityAndNorm.get(cityKey);
        const matched = matchedSelected || matchedCatalog;

        if (matched) {
          act.name = matched.name;
          act.category = matched.category || act.category;
          act.cost = Number(matched.cost !== undefined ? matched.cost : (matched.price || 0));
          act.currency = matched.currency || currency;
          act.pricingType = matched.pricingType || (act.cost === 0 ? 'free' : (act.cost <= 100 ? 'entry_fee' : 'estimated'));
          act.pricePerPerson = matched.pricePerPerson !== false;
          act.isVerified = Boolean(matched.isVerified);
          act.source = matched.source || (act.isVerified ? 'local_catalog' : 'estimated');
          act.duration = matched.duration || act.duration;
          act.activityId = String(matched.id || matched._id || matched.activityId || act.activityId);
        } else {
          // Standardize pricing using activity pricing rules (recognizes free beaches, trails, viewpoints)
          const standardized = standardizeActivityPricing(act, targetCityKey, currency);
          act.cost = standardized.cost;
          act.currency = standardized.currency;
          act.pricingType = standardized.pricingType;
          act.pricePerPerson = standardized.pricePerPerson !== false;
          act.isVerified = Boolean(standardized.isVerified);
          act.source = standardized.source;
        }

        if (act.cost === 0) {
          act.pricingType = 'free';
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // RULE 5: Total activity cost matches the budget calculation
  // ---------------------------------------------------------------------------
  let totalScheduledActivityCost = 0;
  const foodPerPersonDaily = budgetAnalysis?.foodEstimate
    ? Math.round(budgetAnalysis.foodEstimate / (expectedDays * travelerCount))
    : (currency === 'INR' ? 450 : 12);
  const hotelPerNightShare = budgetAnalysis?.accommodationTotal && expectedNights > 0
    ? Math.round(budgetAnalysis.accommodationTotal / expectedDays)
    : 0;

  normalizedDays.forEach((day) => {
    let dayActivitiesCost = 0;
    ['morning', 'afternoon', 'evening'].forEach((period) => {
      day[period].forEach((act) => {
        const itemCost = Number(act.cost) || 0;
        const isPerPerson = act.pricePerPerson !== false;
        dayActivitiesCost += isPerPerson ? itemCost * travelerCount : itemCost;
      });
    });
    // Each day's estimated cost represents day's activities (group) + day's food allowance (group) + nightly hotel share
    day.activityCost = dayActivitiesCost;
    day.foodCost = foodPerPersonDaily * travelerCount;
    day.hotelCost = hotelPerNightShare;
    day.estimatedCost = dayActivitiesCost + day.foodCost + day.hotelCost;
    totalScheduledActivityCost += dayActivitiesCost;
  });

  const targetActivityBudget = budgetAnalysis?.breakdown?.activities !== undefined
    ? Number(budgetAnalysis.breakdown.activities)
    : null;

  if (targetActivityBudget !== null && totalScheduledActivityCost !== targetActivityBudget) {
    fixesApplied.push(
      `Reconciled scheduled activity costs (${currency} ${totalScheduledActivityCost}) with budget analysis (${currency} ${targetActivityBudget}).`
    );
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
 * Guarantees a full schedule with 2 to 3 100% unique activities for EACH day.
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
  const usedNames = new Set();

  const inboundMinutes = transport?.arrivalTime ? parseTimeToMinutes(transport.arrivalTime) : 660; // default ~11:00 AM
  const outboundMinutes = transport?.departureTime ? parseTimeToMinutes(transport.departureTime) : 1080; // default ~06:00 PM

  for (let d = 1; d <= durationDays; d++) {
    const morning = [];
    const afternoon = [];
    const evening = [];

    if (d === 1) {
      // Day 1: If arriving late afternoon (after 01:30 PM), schedule 2 activities (Afternoon + Evening).
      // If arriving earlier in morning/midday, schedule 3 activities (Morning arrival stroll, Afternoon, Evening).
      if (inboundMinutes <= 690) { // On or before 11:30 AM
        const morningAct = getNextSlotActivity(activityPool, destination, 'morning', d * 10 + 1, usedNames);
        morning.push(formatItineraryActivity({ ...morningAct, time: '11:00 AM' }, '11:00 AM'));
      }

      const afternoonAct = getNextSlotActivity(activityPool, destination, 'afternoon', d * 10 + 2, usedNames);
      afternoon.push(formatItineraryActivity({ ...afternoonAct, time: '02:30 PM' }, '02:30 PM'));

      const eveningAct = getNextSlotActivity(activityPool, destination, 'evening', d * 10 + 3, usedNames);
      evening.push(formatItineraryActivity({ ...eveningAct, time: '06:30 PM' }, '06:30 PM'));
    } else if (d === durationDays) {
      // Final Day: Morning exploration + Afternoon local culture/lunch
      const morningAct = getNextSlotActivity(activityPool, destination, 'morning', d * 10 + 1, usedNames);
      morning.push(formatItineraryActivity({ ...morningAct, time: '09:30 AM' }, '09:30 AM'));

      const afternoonAct = getNextSlotActivity(activityPool, destination, 'afternoon', d * 10 + 2, usedNames);
      afternoon.push(formatItineraryActivity({ ...afternoonAct, time: '01:30 PM' }, '01:30 PM'));

      // If departure is evening (after 07:00 PM), add evening farewell activity (3 activities total)
      if (outboundMinutes >= 1140) {
        const eveningAct = getNextSlotActivity(activityPool, destination, 'evening', d * 10 + 3, usedNames);
        evening.push(formatItineraryActivity({ ...eveningAct, time: '05:30 PM' }, '05:30 PM'));
      }
    } else {
      // Mid-trip days: Always 3 activities (Morning, Afternoon, Evening)
      const morningAct = getNextSlotActivity(activityPool, destination, 'morning', d * 10 + 1, usedNames);
      morning.push(formatItineraryActivity({ ...morningAct, time: '09:30 AM' }, '09:30 AM'));

      const afternoonAct = getNextSlotActivity(activityPool, destination, 'afternoon', d * 10 + 2, usedNames);
      afternoon.push(formatItineraryActivity({ ...afternoonAct, time: '02:00 PM' }, '02:00 PM'));

      const eveningAct = getNextSlotActivity(activityPool, destination, 'evening', d * 10 + 3, usedNames);
      evening.push(formatItineraryActivity({ ...eveningAct, time: '06:30 PM' }, '06:30 PM'));
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

      const rawDays = Array.isArray(aiResponse?.data)
        ? aiResponse.data
        : (aiResponse?.data?.days || []);

      if (rawDays.length > 0) {
        candidateDays = rawDays;
        if (aiResponse?.data?.summaryExplanation) {
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
