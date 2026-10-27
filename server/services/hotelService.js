import { DEMO_HOTELS } from '../data/hotels.js';

/**
 * City normalization dictionary to handle variations (e.g., 'North Goa' -> 'Goa')
 */
const CITY_ALIASES = {
  goa: ['goa', 'north goa', 'south goa', 'candolim', 'calangute', 'panaji', 'morjim', 'anjuna', 'palolem', 'madgaon', 'margao', 'vasco'],
  mumbai: ['mumbai', 'bombay', 'colaba', 'bandra', 'marine drive', 'juhu'],
  pune: ['pune', 'poona', 'pa'],
  jaipur: ['jaipur', 'pink city', 'bani park', 'hawa mahal'],
  kashmir: ['kashmir', 'srinagar', 'gulmarg', 'pahalgam', 'dal lake'],
  vadodara: ['vadodara', 'baroda', 'brc'],
  ahmedabad: ['ahmedabad', 'amdavad', 'adi'],
  delhi: ['delhi', 'new delhi', 'ndls'],
  agra: ['agra', 'agc', 'af', 'cantt'],
  chennai: ['chennai', 'madras', 't. nagar', 'marina', 'mylapore', 'adyar'],
  bangalore: ['bangalore', 'bengaluru', 'koramangala', 'indiranagar', 'whitefield'],
  kolkata: ['kolkata', 'calcutta', 'park street', 'howrah'],
  hyderabad: ['hyderabad', 'secunderabad', 'banjara hills', 'hitech city'],
  varanasi: ['varanasi', 'banaras', 'bsb', 'kashi'],
  amritsar: ['amritsar', 'asr'],
  chandigarh: ['chandigarh', 'cdg'],
  lucknow: ['lucknow', 'lko', 'ljn'],
  udaipur: ['udaipur', 'udz'],
  mysore: ['mysore', 'mysuru', 'mys'],
  kochi: ['kochi', 'cochin', 'ernakulam', 'ers', 'ern', 'kerala'],
  surat: ['surat', 'st'],
  junagadh: ['junagadh', 'jnd', 'girnar', 'uparkot'],
  rajkot: ['rajkot', 'rjt'],
  paris: ['paris', 'tour eiffel', 'montmartre'],
  bali: ['bali', 'ubud', 'seminyak', 'canggu', 'kuta', 'denpasar'],
  tokyo: ['tokyo', 'shinjuku', 'asakusa', 'akihabara', 'shibuya'],
  kyoto: ['kyoto', 'gion', 'higashiyama', 'sanjo'],
  switzerland: ['switzerland', 'swiss', 'zurich', 'interlaken', 'zermatt', 'lucerne', 'geneva', 'bern'],
};

/**
 * Normalizes city string against common aliases
 */
export const normalizeCity = (input = '') => {
  const clean = (input || '').toLowerCase().trim();
  if (!clean) return '';
  for (const [canonical, aliases] of Object.entries(CITY_ALIASES)) {
    if (
      clean === canonical ||
      aliases.some((a) => clean === a || (a.length >= 4 && clean.length >= 4 && (clean.includes(a) || a.includes(clean))))
    ) {
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
 * Generates rich, authentic demo hotels for any destination city to ensure
 * travelers always have options across budget, mid-range, and luxury tiers.
 */
export function generateSyntheticHotelsForCity(cityName) {
  const cleanCity = cityName ? cityName.trim() : 'Destination';
  const cleanKey = cleanCity.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return [
    {
      id: `demo_htl_${cleanKey}_01`,
      name: `${cleanCity} Central Heritage Residency & Suites`,
      city: cleanCity,
      area: `${cleanCity} City Centre`,
      pricePerNight: 1400,
      rating: 4.2,
      roomsAvailable: 12,
      amenities: ['AC Private Rooms', 'Free Wi-Fi', '24/7 Front Desk', 'Breakfast Available'],
      image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
      isDemo: true,
    },
    {
      id: `demo_htl_${cleanKey}_02`,
      name: `${cleanCity} Grand Boulevard Hotel & Courtyard`,
      city: cleanCity,
      area: `${cleanCity} Promenade District`,
      pricePerNight: 3200,
      rating: 4.5,
      roomsAvailable: 8,
      amenities: ['Swimming Pool', 'Complimentary Breakfast', 'Free High-Speed Wi-Fi', 'Multi-Cuisine Restaurant'],
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      isDemo: true,
    },
    {
      id: `demo_htl_${cleanKey}_03`,
      name: `${cleanCity} Royal Palace & Spa Resort`,
      city: cleanCity,
      area: `${cleanCity} Scenic Boulevard`,
      pricePerNight: 6800,
      rating: 4.8,
      roomsAvailable: 6,
      amenities: ['Luxury Wellness Spa', 'Infinity Pool', 'Valet Parking', 'Fine Dining Lounge', 'Concierge Service'],
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
      isDemo: true,
    },
  ];
}

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

  // If no matching destination in catalog, dynamically generate realistic authentic destination hotels
  if (matchedHotels.length === 0 && city && city.trim() && city.trim().length > 2) {
    matchedHotels = generateSyntheticHotelsForCity(city);
    logs.push(`Generated ${matchedHotels.length} authentic demo hotels for "${city}"`);
  }

  // If still no matching destination, return empty list gracefully (zero hallucination)
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
