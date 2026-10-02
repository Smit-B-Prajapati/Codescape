import { DEMO_HOTELS } from '../data/hotels.js';

/**
 * City normalization dictionary to handle variations (e.g., 'North Goa' -> 'Goa')
 */
const CITY_ALIASES = {
  goa: ['goa', 'north goa', 'south goa', 'candolim', 'calangute', 'panaji', 'morjim', 'anjuna', 'palolem', 'madgaon', 'margao', 'vasco'],
  mumbai: ['mumbai', 'bombay', 'colaba', 'bandra', 'marine drive', 'juhu'],
  jaipur: ['jaipur', 'pink city', 'bani park', 'hawa mahal'],
  paris: ['paris', 'tour eiffel', 'montmartre'],
  bali: ['bali', 'ubud', 'seminyak', 'canggu', 'kuta', 'denpasar'],
  tokyo: ['tokyo', 'shinjuku', 'asakusa', 'akihabara', 'shibuya'],
  kyoto: ['kyoto', 'gion', 'higashiyama', 'sanjo'],
};

/**
 * Normalizes city string against common aliases
 */
export const normalizeCity = (input = '') => {
  const clean = (input || '').toLowerCase().trim();
  for (const [canonical, aliases] of Object.entries(CITY_ALIASES)) {
    if (clean === canonical || aliases.some((a) => clean.includes(a) || a.includes(clean))) {
      return canonical;
    }
  }
  return clean;
};

/**
 * Calculates number of nights between checkIn and checkOut dates in application code.
 * AI is never allowed to perform financial or date math calculations directly.
 * 
 * @param {string|Date} checkIn 
 * @param {string|Date} checkOut 
 * @returns {number} Minimum 1 night
 */
export const calculateNights = (checkIn, checkOut) => {
  if (checkIn && checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      return Math.max(1, diffDays);
    }
  }
  // Standard fallback duration if dates not specified
  return 3;
};

/**
 * Parameter whitelist to prevent arbitrary or unhandled query properties
 */
const ALLOWED_PARAMETERS = new Set([
  'city',
  'checkIn',
  'checkOut',
  'travelers',
  'budgetPerNight',
  'preference',
]);

/**
 * Tool: searchHotels
 * 
 * Searches fictional simulated hotel inventory for planning and demonstration.
 * Calculates nights, room requirements, and total costs in pure application code.
 * AI never performs financial calculations.
 * Uses neutral recommendation labels without superlative bias (NEVER labels as 'best').
 * 
 * @param {Object} rawParams
 * @param {string} rawParams.city - Destination city (Goa, Mumbai, Jaipur, Paris, Bali, Tokyo, Kyoto, etc.)
 * @param {string} [rawParams.checkIn] - Check-in date (YYYY-MM-DD)
 * @param {string} [rawParams.checkOut] - Check-out date (YYYY-MM-DD)
 * @param {number} [rawParams.travelers=1] - Number of travelers
 * @param {number} [rawParams.budgetPerNight] - Optional budget ceiling per night
 * @param {string} [rawParams.preference] - 'price' | 'rating' | 'budget' | 'luxury' | 'comfort'
 * @returns {Promise<{ success: boolean, isDemo: boolean, notice: string, disclaimer: string, nights: number, count: number, options: Array, logs: string[] }>}
 */
export async function searchHotels(rawParams = {}) {
  const logs = [];

  // Whitelist parameter filtering
  const params = {};
  if (rawParams && typeof rawParams === 'object') {
    for (const key of Object.keys(rawParams)) {
      if (ALLOWED_PARAMETERS.has(key)) {
        params[key] = rawParams[key];
      }
    }
  }

  const {
    city = '',
    checkIn = null,
    checkOut = null,
    travelers = 1,
    budgetPerNight = null,
    preference = null,
  } = params;

  const normalizedTargetCity = normalizeCity(city);
  const travelerCount = Math.max(1, parseInt(travelers, 10) || 1);
  const nights = calculateNights(checkIn, checkOut);
  const roomsNeeded = Math.max(1, Math.ceil(travelerCount / 2));

  logs.push(`Searching demo accommodations in "${city || 'destination'}" for ${nights} night(s) (${travelerCount} traveler(s), ${roomsNeeded} room(s))`);

  // 1. Filter matching destination city
  let matchedHotels = DEMO_HOTELS.filter((h) => {
    const hCity = normalizeCity(h.city);
    return hCity === normalizedTargetCity || (h.area && normalizeCity(h.area) === normalizedTargetCity);
  });

  // If no matching destination, return empty list gracefully (zero hallucination)
  if (matchedHotels.length === 0) {
    logs.push(`Found 0 demo hotel options in ${city} (DEMO HOTEL DATA)`);
    return {
      success: true,
      isDemo: true,
      notice: 'DEMO HOTEL DATA',
      disclaimer: 'DEMO HOTEL DATA - Fictional simulation for demonstration only. Not connected to real hotel booking providers.',
      nights,
      count: 0,
      options: [],
      logs,
    };
  }

  // 2. Budget per night filter if specified
  if (budgetPerNight !== null && budgetPerNight !== undefined && !isNaN(Number(budgetPerNight))) {
    const maxBudget = Number(budgetPerNight);
    const budgetMatches = matchedHotels.filter((h) => h.pricePerNight <= maxBudget);
    if (budgetMatches.length > 0) {
      matchedHotels = budgetMatches;
      logs.push(`Filtered options within budget ceiling of ${maxBudget}/night: ${budgetMatches.length} options`);
    } else {
      logs.push(`Note: No demo options found strictly under ${maxBudget}/night. Returning available inventory.`);
    }
  }

  // Compute baseline min price and max rating for neutral classification
  const minPrice = Math.min(...matchedHotels.map((h) => h.pricePerNight));
  const maxRating = Math.max(...matchedHotels.map((h) => h.rating));

  // 3. Compute costs and assign neutral labels (Never label as 'best')
  const enrichedOptions = matchedHotels.map((item) => {
    // Financial calculation performed deterministically in application code
    const pricePerNight = item.pricePerNight;
    const totalCost = pricePerNight * nights * roomsNeeded;

    // Neutral descriptive labeling without superlative bias
    let recommendationReason = 'matches preferences';
    if (pricePerNight === minPrice) {
      recommendationReason = 'lowest price';
    } else if (item.rating === maxRating) {
      recommendationReason = 'highest rating';
    } else if (budgetPerNight && pricePerNight <= Number(budgetPerNight)) {
      recommendationReason = 'recommended based on budget';
    }

    return {
      hotel: {
        id: item.id,
        name: item.name,
        city: item.city,
        area: item.area,
        pricePerNight: item.pricePerNight,
        rating: item.rating,
        roomsAvailable: item.roomsAvailable,
        amenities: item.amenities,
        image: item.image,
        isDemo: true,
      },
      nights,
      rooms: roomsNeeded,
      totalCost,
      recommendationReason,
      isDemo: true,
    };
  });

  // 4. Sort according to explicit criteria
  const pref = (preference || '').toLowerCase().trim();
  enrichedOptions.sort((a, b) => {
    if (pref === 'price' || pref === 'budget' || pref === 'cheap' || pref === 'lowest price') {
      return a.hotel.pricePerNight - b.hotel.pricePerNight || b.hotel.rating - a.hotel.rating || a.hotel.name.localeCompare(b.hotel.name);
    }
    if (pref === 'rating' || pref === 'quality' || pref === 'highest rating') {
      return b.hotel.rating - a.hotel.rating || a.hotel.pricePerNight - b.hotel.pricePerNight || a.hotel.name.localeCompare(b.hotel.name);
    }
    if (pref === 'luxury' || pref === 'premium') {
      return b.hotel.pricePerNight - a.hotel.pricePerNight || b.hotel.rating - a.hotel.rating || a.hotel.name.localeCompare(b.hotel.name);
    }
    // Default deterministic sort: price ascending, then rating descending, then name
    return a.hotel.pricePerNight - b.hotel.pricePerNight || b.hotel.rating - a.hotel.rating || a.hotel.name.localeCompare(b.hotel.name);
  });

  logs.push(`Found ${enrichedOptions.length} demo hotel options in ${city} (DEMO HOTEL DATA)`);

  return {
    success: true,
    isDemo: true,
    notice: 'DEMO HOTEL DATA',
    disclaimer: 'DEMO HOTEL DATA - Fictional simulation for demonstration only. Not connected to real hotel booking providers. The AI never guarantees live availability.',
    nights,
    count: enrichedOptions.length,
    options: enrichedOptions,
    logs,
  };
}

export default {
  searchHotels,
  calculateNights,
  normalizeCity,
};
