import { generateStructuredResponse } from '../services/aiService.js';

/**
 * Normalized Trip Requirements Schema Specification
 */
export const TRIP_REQUIREMENTS_SCHEMA = {
  type: 'object',
  properties: {
    origin: { type: ['string', 'null'], description: 'Departure city or starting location' },
    destinations: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of specific target cities or destinations',
    },
    startDate: { type: ['string', 'null'], description: 'ISO 8601 date (YYYY-MM-DD) if explicitly specified' },
    endDate: { type: ['string', 'null'], description: 'ISO 8601 date (YYYY-MM-DD) if explicitly specified' },
    durationDays: { type: ['integer', 'null'], description: 'Total trip duration in days' },
    travelers: { type: 'integer', description: 'Number of travelers (minimum 1)' },
    travelerDetails: {
      type: 'array',
      items: { type: 'string' },
      description: 'Details about travelers (e.g., solo, couple, family with kids)',
    },
    budget: { type: ['number', 'null'], description: 'Explicit budget amount limit' },
    currency: { type: ['string', 'null'], description: 'Standard currency code (e.g., INR, USD, EUR)' },
    interests: {
      type: 'array',
      items: { type: 'string' },
      description: 'Specific activities or vibes requested (e.g., beaches, nightlife, food, culture)',
    },
    accommodationPreference: {
      type: ['string', 'null'],
      enum: ['budget', 'mid-range', 'luxury', 'hostel', 'resort', null],
      description: 'Preferred accommodation tier or style',
    },
    stops: {
      type: 'array',
      items: { type: 'string' },
      description: 'Intermediate stops or day-trip destinations within the trip',
    },
    transportPreference: {
      type: ['string', 'null'],
      enum: ['flight', 'train', 'bus', 'self-drive', null],
      description: 'Preferred mode of transportation',
    },
    foodPreference: { type: ['string', 'null'], description: 'Dietary or dining preferences' },
    pace: {
      type: ['string', 'null'],
      enum: ['relaxed', 'moderate', 'fast-paced', null],
      description: 'Desired travel pace',
    },
    specialRequirements: {
      type: 'array',
      items: { type: 'string' },
      description: 'Accessibility, visa, or special constraints',
    },
  },
  required: ['destinations', 'travelers', 'interests'],
};

/**
 * Default empty requirements object
 */
export const createDefaultRequirements = () => ({
  origin: null,
  destinations: [],
  stops: [],
  startDate: null,
  endDate: null,
  durationDays: null,
  travelers: 1,
  travelerDetails: [],
  budget: null,
  currency: null,
  interests: [],
  accommodationPreference: null,
  transportPreference: null,
  foodPreference: null,
  pace: null,
  specialRequirements: [],
});

/**
 * Currency Normalization Helper
 */
export const normalizeCurrency = (text = '') => {
  if (!text) return null;
  const upper = text.toUpperCase().trim();
  if (upper.includes('₹') || upper.includes('RS') || upper.includes('INR') || upper.includes('RUPEE')) return 'INR';
  if (upper.includes('$') || upper.includes('USD') || upper.includes('DOLLAR')) return 'USD';
  if (upper.includes('€') || upper.includes('EUR') || upper.includes('EURO')) return 'EUR';
  if (upper.includes('£') || upper.includes('GBP') || upper.includes('POUND')) return 'GBP';
  return upper.slice(0, 3);
};

/**
 * Validates, sanitizes, and normalizes extracted requirements.
 * Enforces distinction between explicit inputs, missing information, and assumptions.
 */
export function validateAndNormalizeRequirements(extracted = {}) {
  const rawReq = extracted.requirements || extracted;
  const missingInfo = Array.isArray(extracted.missingInformation) ? [...extracted.missingInformation] : [];
  const assumptions = Array.isArray(extracted.assumptions) ? [...extracted.assumptions] : [];

  const normalized = createDefaultRequirements();

  // 1. Origin
  if (rawReq.origin && typeof rawReq.origin === 'string' && rawReq.origin.trim()) {
    normalized.origin = rawReq.origin.trim();
  } else {
    normalized.origin = null;
    if (!missingInfo.some((m) => m.toLowerCase().includes('origin') || m.toLowerCase().includes('departure'))) {
      missingInfo.push('Departure origin city is not specified');
    }
  }

  // 2. Destinations
  if (Array.isArray(rawReq.destinations) && rawReq.destinations.length > 0) {
    normalized.destinations = rawReq.destinations
      .map((d) => (typeof d === 'string' ? d.trim() : ''))
      .filter((d) => d.length > 0 && !d.toLowerCase().includes('somewhere') && !d.toLowerCase().includes('anywhere'));
  } else if (typeof rawReq.destination === 'string' && rawReq.destination.trim()) {
    const d = rawReq.destination.trim();
    if (!d.toLowerCase().includes('somewhere') && !d.toLowerCase().includes('anywhere')) {
      normalized.destinations = [d];
    }
  }

  if (normalized.destinations.length === 0) {
    if (!missingInfo.some((m) => m.toLowerCase().includes('destination'))) {
      missingInfo.push('Specific destination city is missing or vague');
    }
  }

  // 3. Dates & Duration
  if (rawReq.startDate && typeof rawReq.startDate === 'string' && !isNaN(Date.parse(rawReq.startDate))) {
    normalized.startDate = rawReq.startDate.split('T')[0];
  }
  if (rawReq.endDate && typeof rawReq.endDate === 'string' && !isNaN(Date.parse(rawReq.endDate))) {
    normalized.endDate = rawReq.endDate.split('T')[0];
  }

  // Compute or sanitize durationDays
  if (rawReq.durationDays && Number.isInteger(Number(rawReq.durationDays)) && Number(rawReq.durationDays) > 0) {
    normalized.durationDays = Number(rawReq.durationDays);
  } else if (normalized.startDate && normalized.endDate) {
    const start = new Date(normalized.startDate);
    const end = new Date(normalized.endDate);
    const diff = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
    normalized.durationDays = diff;
  }

  if (!normalized.startDate || !normalized.endDate) {
    if (!missingInfo.some((m) => m.toLowerCase().includes('date'))) {
      missingInfo.push('Exact travel start and end dates are missing');
    }
  }

  if (!normalized.durationDays) {
    if (!missingInfo.some((m) => m.toLowerCase().includes('duration') || m.toLowerCase().includes('days'))) {
      missingInfo.push('Trip duration in days was not specified');
    }
  }

  // 4. Travelers
  if (rawReq.travelers && !isNaN(Number(rawReq.travelers)) && Number(rawReq.travelers) > 0) {
    normalized.travelers = Math.round(Number(rawReq.travelers));
  } else {
    normalized.travelers = 1;
    assumptions.push('Defaulted traveler count to 1 person (solo traveler)');
  }

  if (Array.isArray(rawReq.travelerDetails)) {
    normalized.travelerDetails = rawReq.travelerDetails.filter((t) => typeof t === 'string');
  }

  // 5. Budget & Currency
  if (rawReq.budget !== undefined && rawReq.budget !== null && !isNaN(Number(rawReq.budget))) {
    normalized.budget = Number(rawReq.budget);
  } else {
    normalized.budget = null;
    if (!missingInfo.some((m) => m.toLowerCase().includes('budget'))) {
      missingInfo.push('Explicit budget limit was not specified');
    }
  }

  normalized.currency = normalizeCurrency(rawReq.currency);
  if (normalized.budget && !normalized.currency) {
    normalized.currency = 'INR';
    assumptions.push('Assumed currency INR based on default regional context');
  }

  // 6. Interests
  if (Array.isArray(rawReq.interests)) {
    normalized.interests = rawReq.interests
      .map((i) => (typeof i === 'string' ? i.trim() : ''))
      .filter((i) => i.length > 0);
  }

  // 7. Stops / Intermediate destinations
  if (Array.isArray(rawReq.stops)) {
    normalized.stops = rawReq.stops
      .map((s) => (typeof s === 'string' ? s.trim() : (s?.city || s?.name || '')))
      .filter((s) => s.length > 0);
  } else {
    normalized.stops = [];
  }

  // 8. Preferences
  if (rawReq.accommodationPreference) {
    normalized.accommodationPreference = String(rawReq.accommodationPreference).toLowerCase().trim();
  }
  if (rawReq.transportPreference) {
    normalized.transportPreference = String(rawReq.transportPreference).toLowerCase().trim();
  }
  if (rawReq.foodPreference) {
    normalized.foodPreference = String(rawReq.foodPreference).trim();
  }
  if (rawReq.pace) {
    normalized.pace = String(rawReq.pace).toLowerCase().trim();
  }
  if (Array.isArray(rawReq.specialRequirements)) {
    normalized.specialRequirements = rawReq.specialRequirements.filter((s) => typeof s === 'string');
  }

  // Calculate Confidence Score (0.0 to 1.0)
  let score = 1.0;
  if (normalized.destinations.length === 0) score -= 0.35;
  if (!normalized.durationDays && (!normalized.startDate || !normalized.endDate)) score -= 0.25;
  if (!normalized.origin) score -= 0.15;
  if (!normalized.budget) score -= 0.15;
  if (normalized.interests.length === 0) score -= 0.1;

  const confidence = Math.max(0.1, parseFloat(score.toFixed(2)));

  return {
    requirements: normalized,
    missingInformation: Array.from(new Set(missingInfo)),
    assumptions: Array.from(new Set(assumptions)),
    confidence,
  };
}

/**
 * Deterministic Rule-Based Fallback Extractor
 * Executes when no AI key is configured or offline.
 */
export function extractFallbackRequirements(prompt = '') {
  const text = prompt.trim();
  const lower = text.toLowerCase();

  const req = createDefaultRequirements();
  const missingInfo = [];
  const assumptions = [];

  // Origin extraction
  const originMatch = text.match(/(?:from|departing from|leaving)\s+([A-Za-z]+)/i);
  if (originMatch && originMatch[1]) {
    const cand = originMatch[1].trim();
    if (!['me', 'home', 'here', 'now'].includes(cand.toLowerCase())) {
      req.origin = cand;
    }
  }

  // Destination extraction: Prioritize verified cities first to avoid misparsing conjunctions/prepositions
  const knownCities = [
    { name: 'Switzerland', aliases: ['switzerland', 'swiss', 'zurich', 'interlaken', 'zermatt', 'lucerne', 'geneva', 'bern'] },
    { name: 'Kashmir', aliases: ['kashmir', 'srinagar', 'gulmarg', 'pahalgam', 'dal lake'] },
    { name: 'Goa', aliases: ['goa', 'north goa', 'south goa', 'candolim', 'calangute', 'panaji', 'morjim', 'anjuna'] },
    { name: 'Jaipur', aliases: ['jaipur', 'pink city'] },
    { name: 'Mumbai', aliases: ['mumbai', 'bombay'] },
    { name: 'Vadodara', aliases: ['vadodara', 'baroda'] },
    { name: 'Ahmedabad', aliases: ['ahmedabad', 'amdavad'] },
    { name: 'Delhi', aliases: ['delhi', 'new delhi'] },
    { name: 'Bangalore', aliases: ['bangalore', 'bengaluru'] },
    { name: 'Paris', aliases: ['paris'] },
    { name: 'Tokyo', aliases: ['tokyo'] },
    { name: 'Kyoto', aliases: ['kyoto'] },
    { name: 'Rome', aliases: ['rome'] },
    { name: 'London', aliases: ['london'] },
    { name: 'Bali', aliases: ['bali', 'ubud'] },
    { name: 'Santorini', aliases: ['santorini'] },
    { name: 'Dubai', aliases: ['dubai'] },
    { name: 'Singapore', aliases: ['singapore'] },
    { name: 'Bangkok', aliases: ['bangkok'] },
    { name: 'Kerala', aliases: ['kerala', 'munnar', 'alleppey', 'kochi'] },
    { name: 'Manali', aliases: ['manali'] },
    { name: 'Shimla', aliases: ['shimla'] },
    { name: 'Udaipur', aliases: ['udaipur'] },
    { name: 'Agra', aliases: ['agra'] },
    { name: 'Varanasi', aliases: ['varanasi', 'banaras', 'kashi'] },
  ];

  for (const kc of knownCities) {
    const isMatched = kc.aliases.some((alias) => {
      const rx = new RegExp(`\\b${alias}\\b`, 'i');
      return rx.test(text);
    });
    if (isMatched && (!req.origin || req.origin.toLowerCase() !== kc.name.toLowerCase())) {
      req.destinations = [kc.name];
      break;
    }
  }

  // Fallback to regex destination extraction only if no known city matched
  if (req.destinations.length === 0) {
    const destMatch = text.match(/(?:to|visit|trip to|explore|in)\s+([A-Za-z]+)/i)
      || text.match(/\b([A-Za-z]+)\s+trip\b/i);

    const IGNORED_DEST_WORDS = new Set([
      'while', 'when', 'where', 'what', 'which', 'who', 'how', 'why',
      'me', 'somewhere', 'anywhere', 'a', 'an', 'the', 'travel', 'go', 'see', 'vacation',
      'be', 'stay', 'chill', 'relax', 'my', 'day', 'days', 'weekend', 'quick', 'road',
      'budget', 'cost', 'money', 'keeping', 'staying', 'having', 'giving', 'getting',
      'hotel', 'hotels', 'train', 'trains', 'flight', 'flights', 'bus', 'buses', 'transport',
      'itinerary', 'plan', 'planning', 'trip', 'trips', 'place', 'places', 'tour', 'tours',
      'under', 'above', 'around', 'near', 'nearby', 'between', 'during', 'before', 'after',
      'from', 'to', 'for', 'and', 'or', 'but', 'so', 'then', 'than', 'just', 'only', 'all',
      'some', 'any', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'another',
      'such', 'own', 'same', 'too', 'very', 'can', 'will', 'should', 'would', 'could',
      'now', 'please', 'make', 'create', 'build', 'give', 'show', 'suggest', 'recommend'
    ]);

    if (destMatch && destMatch[1]) {
      const cand = destMatch[1].trim();
      if (!IGNORED_DEST_WORDS.has(cand.toLowerCase()) && cand.length > 2) {
        req.destinations = [cand];
      }
    }
  }

  if (req.destinations.length === 0) {
    missingInfo.push('Specific destination city is missing or vague');
  }

  // Duration extraction
  const daysMatch = text.match(/(\d+)\s*(?:[- ]?day|days)/i);
  if (daysMatch) {
    req.durationDays = parseInt(daysMatch[1], 10);
  } else if (lower.includes('weekend')) {
    req.durationDays = 2;
    assumptions.push('Interpreted "weekend" as a 2-day trip duration');
  }

  // Travelers extraction
  const travelersMatch = text.match(/(\d+)\s*(?:people|persons|travelers|pax|adults)/i);
  if (travelersMatch) {
    req.travelers = parseInt(travelersMatch[1], 10);
  } else if (lower.includes('for me') || lower.includes('solo') || lower.includes('myself')) {
    req.travelers = 1;
  } else if (lower.includes('couple') || lower.includes('for two') || lower.includes('2 of us')) {
    req.travelers = 2;
  } else {
    req.travelers = 1;
    assumptions.push('Defaulted traveler count to 1 person (solo traveler)');
  }

  // Budget & Currency extraction
  const budgetMatch = text.match(/(?:₹|rs\.?|inr|\$|usd|€|eur)?\s*([\d,]+(?:\.\d+)?)\s*(?:budget|inr|rs|usd|\$|euro|bucks)?/i);
  const moneyMatch = text.match(/(?:under|budget of|within|budget:?|cost:?)\s*(?:₹|rs\.?|inr|\$|usd|€|eur)?\s*([\d,]+)/i)
    || text.match(/(?:₹|rs\.?|inr|\$|usd|€|eur)\s*([\d,]+)/i);

  if (moneyMatch && moneyMatch[1]) {
    const rawVal = moneyMatch[1].replace(/,/g, '');
    const num = parseFloat(rawVal);
    if (!isNaN(num) && num > 0) {
      req.budget = num;
    }
  }

  if (text.includes('₹') || lower.includes('inr') || lower.includes('rs')) {
    req.currency = 'INR';
  } else if (text.includes('$') || lower.includes('usd')) {
    req.currency = 'USD';
  } else if (text.includes('€') || lower.includes('eur')) {
    req.currency = 'EUR';
  } else if (req.budget) {
    req.currency = 'INR';
    assumptions.push('Defaulted currency to INR for numeric budget');
  }

  if (lower.includes('cheap') || lower.includes('budget-friendly') || lower.includes('economical')) {
    req.accommodationPreference = 'budget';
  } else if (lower.includes('luxury') || lower.includes('5 star') || lower.includes('resort')) {
    req.accommodationPreference = 'luxury';
  }

  // Interests extraction
  const interestKeywords = [
    'beaches', 'beach', 'nightlife', 'party', 'food', 'dining', 'street food',
    'culture', 'heritage', 'peaceful', 'quiet', 'relaxation', 'nature', 'adventure',
    'shopping', 'sightseeing', 'temples', 'mountains', 'history'
  ];

  interestKeywords.forEach((kw) => {
    if (lower.includes(kw)) {
      const normalizedTag = kw === 'beach' ? 'beaches' : kw === 'party' ? 'nightlife' : kw;
      if (!req.interests.includes(normalizedTag)) {
        req.interests.push(normalizedTag);
      }
    }
  });

  return validateAndNormalizeRequirements({
    requirements: req,
    missingInformation: missingInfo,
    assumptions: assumptions,
  });
}

/**
 * Requirement Extraction Engine
 * Uses aiService to extract structured requirements with full schema compliance,
 * falling back to the deterministic rule engine if no API key is active.
 * 
 * @param {string} userPrompt - Raw user request
 * @returns {Promise<{ requirements: Object, missingInformation: string[], assumptions: string[], confidence: number, provider: string, isFallback: boolean }>}
 */
export async function extractTripRequirements(userPrompt) {
  if (!userPrompt || !userPrompt.trim()) {
    throw new Error('User trip prompt cannot be empty');
  }

  const promptText = userPrompt.trim();

  // Prepare fallback data using our deterministic parser
  const fallbackResult = extractFallbackRequirements(promptText);

  const systemPrompt = `You are a strict, factual travel requirement extraction agent for GlobeThrottle.
Your task is to analyze the user's travel request and extract facts into a structured JSON schema.

CRITICAL INSTRUCTIONS:
1. You MUST output a JSON object containing the top-level property "requirements" with:
   - destinations: array of string destination names (e.g. ["Switzerland"]).
   - origin: string departure city or null if not mentioned.
   - durationDays: integer number of days (e.g. 5).
   - budget: number or null.
   - currency: string currency code (e.g. "INR", "USD", "EUR").
   - travelers: integer (default 1).
   - interests: array of string interest categories.
2. In addition to "requirements", include "missingInformation" (array of strings), "assumptions" (array of strings), and "confidence" (number between 0.0 and 1.0).
3. Output strictly valid JSON matching this schema.`;

  try {
    const aiResponse = await generateStructuredResponse({
      systemPrompt,
      userPrompt: promptText,
      schema: {
        type: 'object',
        properties: {
          requirements: TRIP_REQUIREMENTS_SCHEMA,
          missingInformation: { type: 'array', items: { type: 'string' } },
          assumptions: { type: 'array', items: { type: 'string' } },
          confidence: { type: 'number' },
        },
        required: ['requirements'],
      },
      fallbackData: fallbackResult,
    });

    // If AI service is operating in fallback mode
    if (aiResponse.isFallback) {
      return {
        ...fallbackResult,
        provider: 'fallback',
        isFallback: true,
      };
    }

    // Post-validate and normalize AI response
    const validated = validateAndNormalizeRequirements(aiResponse.data);

    // Safeguard: Merge verified factual entities from deterministic parser if AI omitted them
    if ((!validated.requirements.destinations || validated.requirements.destinations.length === 0) && fallbackResult.requirements.destinations.length > 0) {
      validated.requirements.destinations = fallbackResult.requirements.destinations;
    }
    if (!validated.requirements.durationDays && fallbackResult.requirements.durationDays) {
      validated.requirements.durationDays = fallbackResult.requirements.durationDays;
    }
    if (!validated.requirements.budget && fallbackResult.requirements.budget) {
      validated.requirements.budget = fallbackResult.requirements.budget;
    }
    if (!validated.requirements.currency && fallbackResult.requirements.currency) {
      validated.requirements.currency = fallbackResult.requirements.currency;
    }
    if (!validated.requirements.origin && fallbackResult.requirements.origin) {
      validated.requirements.origin = fallbackResult.requirements.origin;
    }

    return {
      ...validated,
      provider: aiResponse.provider || 'openai',
      model: aiResponse.model,
      isFallback: false,
    };
  } catch (error) {
    console.warn(`[Requirement Extractor Warning] AI call failed (${error.message}). Falling back to rule-based parser.`);
    return {
      ...fallbackResult,
      provider: 'fallback',
      isFallback: true,
      fallbackReason: error.message,
    };
  }
}

export default {
  TRIP_REQUIREMENTS_SCHEMA,
  createDefaultRequirements,
  validateAndNormalizeRequirements,
  extractFallbackRequirements,
  extractTripRequirements,
};
