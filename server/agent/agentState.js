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

  // 7. Preferences
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

  // Destination extraction
  const destMatch = text.match(/(?:to|visit|trip to|explore)\s+([A-Za-z]+)/i);
  if (destMatch && destMatch[1]) {
    const cand = destMatch[1].trim();
    const ignoredDestWords = ['me', 'somewhere', 'anywhere', 'a', 'the', 'travel', 'go', 'see', 'vacation', 'be', 'stay', 'chill', 'relax', 'my'];
    if (!ignoredDestWords.includes(cand.toLowerCase())) {
      req.destinations = [cand];
    }
  }
  if (req.destinations.length === 0) {
    // Check known travel destinations in text
    const knownCities = ['Goa', 'Paris', 'Jaipur', 'Mumbai', 'Tokyo', 'Kyoto', 'Vadodara', 'Ahmedabad', 'Bangalore', 'Bali', 'Santorini', 'Rome', 'London', 'Dubai'];
    for (const city of knownCities) {
      const regex = new RegExp(`\\b${city}\\b`, 'i');
      if (regex.test(text) && (!req.origin || req.origin.toLowerCase() !== city.toLowerCase())) {
        req.destinations = [city];
        break;
      }
    }
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
1. EXTRACT ONLY EXPLICIT FACTS. Do NOT invent specific dates, origins, or budgets that the user never specified.
2. If exact dates are not given, 'startDate' and 'endDate' MUST be null. Add 'Exact travel dates' to 'missingInformation'.
3. If duration in days is given (e.g., '5 day', '4 days'), extract 'durationDays' as an integer. If 'weekend' is mentioned without days, durationDays should be 2 with an entry in 'assumptions'.
4. If destination is generic (e.g. 'somewhere peaceful', 'any beach'), 'destinations' MUST be empty [] and add 'Specific destination city' to 'missingInformation'. Preserve 'peaceful' under 'interests'.
5. Convert traveler count into an integer (e.g. 'for me' = 1, 'for 2 people' = 2). If completely unspecified, set 1 and record in 'assumptions'.
6. Normalize currency symbols ('₹' -> 'INR', '$' -> 'USD', '€' -> 'EUR').
7. Convert budget into a numeric number (e.g. '₹20,000' -> 20000).
8. Categorize preferences:
   - accommodationPreference: 'budget', 'mid-range', 'luxury', or null.
   - transportPreference: 'flight', 'train', 'bus', 'self-drive', or null.
   - pace: 'relaxed', 'moderate', 'fast-paced', or null.
9. Distinguish clearly:
   - 'requirements': the extracted normalized values.
   - 'missingInformation': array of strings identifying essential missing trip parameters (e.g. dates, destination, origin, budget).
   - 'assumptions': array of strings detailing any defaults or interpretations made by the system.
   - 'confidence': confidence score from 0.0 to 1.0 based on how complete the user input is.

Respond strictly with a single JSON object.`;

  try {
    const aiResponse = await generateStructuredResponse({
      systemPrompt,
      userPrompt: promptText,
      schema: {
        requirements: TRIP_REQUIREMENTS_SCHEMA,
        missingInformation: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        confidence: { type: 'number' },
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
