import { generateStructuredResponse, getAiConfig } from './aiService.js';

/**
 * In-memory cache for activity price estimates.
 * Key: `${city.toLowerCase()}:${normalizedName}:${currency.toUpperCase()}`
 * Value: { cost: number, pricingType: string }
 */
const pricingCache = new Map();

/**
 * Normalizes activity name for matching.
 */
export function normalizeName(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Detects whether a destination or currency corresponds to Indian domestic travel.
 */
export function isIndianDestination(dest = '', currency = 'INR') {
  const curr = String(currency || '').toUpperCase().trim();
  if (curr === 'INR') return true;

  const d = String(dest || '').toLowerCase().trim();
  const indianCities = [
    'india', 'udaipur', 'goa', 'mumbai', 'jaipur', 'delhi', 'kashmir', 'srinagar',
    'vadodara', 'ahmedabad', 'pune', 'bangalore', 'bengaluru', 'chennai', 'kolkata',
    'hyderabad', 'varanasi', 'agra', 'manali', 'shimla', 'kerala', 'kochi', 'amritsar',
    'lucknow', 'chandigarh', 'surat', 'rajkot', 'junagadh', 'mysore', 'jodhpur',
    'jaisalmer', 'rishikesh', 'haridwar', 'darjeeling', 'gangtok', 'ooty', 'munnar'
  ];
  return indianCities.some((c) => d.includes(c));
}

/**
 * Common free attraction keywords in India & worldwide.
 * Public lakes, promenades, ghats, beaches, street markets, and shrines have ₹0 entry.
 */
const FREE_EXPERIENCE_KEYWORDS = [
  'promenade',
  'ghat',
  'beach',
  'beaches',
  'cliff',
  'cliffs',
  'viewpoint',
  'overlook',
  'panoramic view',
  'sunset point',
  'sunset view',
  'sunset trail',
  'sunset stroll',
  'sunset walk',
  'sunrise trek',
  'sunrise overlook',
  'marine drive',
  'sea face',
  'bandstand',
  'boulevard',
  'lakefront',
  'waterfront',
  'lake promenade',
  'riverfront',
  'temple',
  'shrine',
  'basilica',
  'cathedral',
  'church',
  'dargah',
  'gurdwara',
  'bazaar',
  'flea market',
  'street market',
  'artisan stalls',
  'old town walk',
  'heritage walk',
  'heritage stroll',
  'walking tour',
  'trail',
  'hike',
  'coastal hike',
  'coastal trail',
  'turtle trail',
  'nature walk',
  'public park',
  'drum circle',
  'fort ramparts',
  'fort cliffside',
  'exterior',
  'latin quarter',
  'fontainhas',
];

/**
 * Checks whether an activity is inherently a free attraction (public beach, cliff, viewpoint, promenade, ghat, temple, trail, market).
 * 
 * @param {string} name 
 * @param {string} [category=''] 
 * @returns {boolean}
 */
export function isInherentlyFreeExperience(name = '', category = '') {
  const lowerName = String(name || '').toLowerCase();
  const lowerCat = String(category || '').toLowerCase();

  // If paid excursion or dining keywords are explicitly present, it is not free
  const paidKeywords = [
    'scuba', 'snorkel', 'kayak', 'paddle', 'parasail', 'water sport', 'jetski', 'jet ski',
    'cruise', 'boat cruise', 'shikara', 'ferry tour', 'yacht',
    'safari', 'jeep', 'gondola', 'cable car', 'ropeway',
    'tasting', 'thali', 'feast', 'dinner', 'lunch', 'culinary crawl', 'food crawl', 'pub crawl', 'bar crawl',
    'party', 'club', 'lounge', 'brewery',
    'jail museum', 'museum masterpieces', 'palace complex'
  ];
  if (paidKeywords.some((pk) => lowerName.includes(pk))) {
    return false;
  }

  // Keywords that represent free public spaces, walks, beaches, ghats, viewpoints
  if (FREE_EXPERIENCE_KEYWORDS.some((kw) => lowerName.includes(kw))) {
    return true;
  }

  if (lowerCat === 'relaxation' || lowerCat === 'shopping') {
    return true;
  }

  return false;
}

/**
 * Category-based deterministic baseline costs for international travel (in USD).
 */
const INTERNATIONAL_CATEGORY_COSTS_USD = {
  Food: 20,
  'Food & Dining': 20,
  Dining: 20,
  Culture: 15,
  Historical: 15,
  Sightseeing: 10,
  Nature: 8,
  Adventure: 25,
  Nightlife: 20,
  Shopping: 0,
  Relaxation: 0,
  Arts: 12,
  Transportation: 8,
  Other: 10,
};

const CURRENCY_MULTIPLIERS_FROM_USD = {
  USD: 1,
  INR: 83,
  EUR: 0.92,
  GBP: 0.78,
  CAD: 1.36,
  AUD: 1.52,
  JPY: 155,
};

/**
 * Returns a realistic, defensible baseline cost and pricingType for an activity
 * based on category, destination economy, and activity title keywords.
 * 
 * Accurately recognizes free attractions (₹0) and distinguishes modest entry fees
 * from paid experiences without inflating ordinary sightseeing.
 * 
 * @param {string} category 
 * @param {string} currency 
 * @param {string} [name=''] 
 * @param {string} [city=''] 
 * @returns {number}
 */
export function getBaselineActivityCost(category, currency = 'INR', name = '', city = '') {
  const curr = (currency || 'INR').toUpperCase();
  const lowerName = String(name || '').toLowerCase();
  const isIndia = isIndianDestination(city || name, curr);

  // 1. Recognize inherently free experiences (parks, ghats, beaches, temples, promenades, walks)
  if (isInherentlyFreeExperience(name, category)) {
    return 0;
  }

  // 2. India-specific realistic pricing calibrations (in INR)
  if (isIndia) {
    // Paid experiences & excursions
    if (lowerName.includes('scuba') || lowerName.includes('paragliding')) {
      return 1500;
    }
    if (lowerName.includes('safari') || lowerName.includes('dudhsagar') || lowerName.includes('gondola')) {
      return 650;
    }
    if (lowerName.includes('kayak') || lowerName.includes('paddle')) {
      return 300;
    }
    if (lowerName.includes('cruise') || lowerName.includes('boat') || lowerName.includes('shikara') || lowerName.includes('ferry')) {
      return 350;
    }
    if (lowerName.includes('ropeway') || lowerName.includes('cable car')) {
      return 150;
    }
    if (lowerName.includes('cycling') || lowerName.includes('bicycle')) {
      return 150;
    }
    if (lowerName.includes('dance') || lowerName.includes('folk') || lowerName.includes('theatre') || lowerName.includes('show')) {
      return 100;
    }
    if (lowerName.includes('thali') || lowerName.includes('feast') || lowerName.includes('wazwan') || lowerName.includes('dinner')) {
      return 350;
    }
    if (lowerName.includes('tasting') || lowerName.includes('crawl') || lowerName.includes('street food') || lowerName.includes('snack') || lowerName.includes('poi')) {
      return 150;
    }
    // Heritage monuments & museums in India (ASI tickets are ₹30–₹50, museums ₹50–₹100)
    if (lowerName.includes('aguada') && !lowerName.includes('jail museum')) {
      return 50;
    }
    if (lowerName.includes('jail museum')) {
      return 100;
    }
    if (lowerName.includes('palace') || lowerName.includes('fort') || lowerName.includes('museum') || lowerName.includes('caves')) {
      return 50; // Standard heritage monument entry ticket
    }
    if (lowerName.includes('garden') || lowerName.includes('park') || lowerName.includes('botanical') || lowerName.includes('bari')) {
      return 50;
    }

    // Default category fallback in INR
    const cat = category || 'Sightseeing';
    switch (cat) {
      case 'Food':
      case 'Food & Dining':
      case 'Dining':
        return 150;
      case 'Culture':
      case 'Historical':
        return 50;
      case 'Sightseeing':
        return 0; // Free unless ticketed monument
      case 'Nature':
        return 0; // Nature walks, hills, beaches are ₹0
      case 'Adventure':
        return 250;
      case 'Nightlife':
        return 250;
      case 'Shopping':
      case 'Relaxation':
        return 0; // Browsing bazaar or relaxing is ₹0
      default:
        return 0;
    }
  }

  // 3. International baseline pricing (in USD / converted)
  let baseUsd = INTERNATIONAL_CATEGORY_COSTS_USD[category] || 10;
  if (lowerName.includes('cruise') || lowerName.includes('boat') || lowerName.includes('ferry')) {
    baseUsd = 25;
  } else if (lowerName.includes('tasting') || lowerName.includes('food') || lowerName.includes('dinner')) {
    baseUsd = 25;
  } else if (lowerName.includes('museum') || lowerName.includes('palace') || lowerName.includes('summit')) {
    baseUsd = 18;
  }

  const mult = CURRENCY_MULTIPLIERS_FROM_USD[curr] || 1;
  return Math.round(baseUsd * mult);
}

/**
 * Annotates and standardizes pricing metadata fields for any activity.
 * 
 * Ensures all items have:
 * - cost: number (>= 0)
 * - currency: string
 * - pricingType: 'free' | 'entry_fee' | 'verified' | 'estimated' | 'optional'
 * - pricePerPerson: boolean
 * - source: string
 * - isVerified: boolean
 */
export function standardizeActivityPricing(act = {}, defaultCity = '', defaultCurrency = 'INR') {
  const currency = (act.currency || defaultCurrency || 'INR').toUpperCase();
  const name = act.name || '';
  const city = act.city || defaultCity || '';
  const isIndia = isIndianDestination(city || name, currency);

  const rawCost = Number(act.cost !== undefined ? act.cost : act.price);
  let cost = isNaN(rawCost) || rawCost < 0 ? null : rawCost;
  let pricingType = act.pricingType;

  // Strict enforcement for Indian domestic destinations:
  // If an activity is inherently a free natural spot, beach, viewpoint, trail, walk, or shrine:
  if (isIndia && isInherentlyFreeExperience(name, act.category)) {
    cost = 0;
    pricingType = 'free';
  } else if (cost === null) {
    cost = getBaselineActivityCost(act.category, currency, name, city);
  } else if (isIndia && !act.isVerified) {
    // If an unverified Indian activity has an inflated cost (e.g. legacy USD conversion like ₹664 or ₹830):
    // For standard sightseeing, nature, walks, trails, viewpoints, cap or re-evaluate with getBaselineActivityCost
    const isExcursion = name.toLowerCase().includes('scuba') || name.toLowerCase().includes('safari') ||
      name.toLowerCase().includes('cruise') || name.toLowerCase().includes('boat') ||
      name.toLowerCase().includes('kayak') || name.toLowerCase().includes('thali') ||
      name.toLowerCase().includes('dinner') || name.toLowerCase().includes('tasting');

    if (cost > 200 && !isExcursion) {
      cost = getBaselineActivityCost(act.category, currency, name, city);
    }
  }

  // Assign pricingType
  if (!pricingType || cost === 0) {
    if (cost === 0) {
      pricingType = 'free';
    } else if (act.isVerified) {
      pricingType = 'verified';
    } else if (cost <= (currency === 'INR' ? 100 : 15)) {
      pricingType = 'entry_fee';
    } else {
      pricingType = 'estimated';
    }
  }

  return {
    ...act,
    cost,
    price: cost,
    currency,
    pricingType,
    pricePerPerson: act.pricePerPerson !== false,
    source: act.source || (act.isVerified ? 'local_catalog' : (cost === 0 ? 'free_attraction' : 'category_estimate')),
    isVerified: Boolean(act.isVerified),
  };
}

/**
 * Uses OpenAI / active LLM to estimate realistic tourist costs for activities
 * with missing costs, scaled to the destination and currency.
 * Fully supports and encourages authentic ₹0 free attractions.
 * 
 * @param {Object} params
 * @param {Array<Object>} params.activities - Array of activity objects
 * @param {string} params.city - Destination city name
 * @param {string} [params.currency='INR'] - Target currency
 * @returns {Promise<Array<Object>>} Updated activities with validated costs
 */
export async function estimateActivityCostsWithAi({
  activities = [],
  city = 'Udaipur',
  currency = 'INR',
}) {
  if (!Array.isArray(activities) || activities.length === 0) {
    return activities;
  }

  const cleanCity = String(city || 'Destination').trim();
  const cleanCurr = String(currency || 'INR').toUpperCase().trim();
  const isIndia = isIndianDestination(cleanCity, cleanCurr);

  // 1. Identify which activities require pricing (do NOT touch verified or explicitly free items)
  const needingPricing = [];
  activities.forEach((act) => {
    // If activity is already free or has valid numeric cost >= 0, keep it
    if (act.cost !== undefined && act.cost !== null && !isNaN(Number(act.cost)) && Number(act.cost) >= 0) {
      if (Number(act.cost) === 0) {
        act.pricingType = act.pricingType || 'free';
      }
      return;
    }

    const key = `${cleanCity.toLowerCase()}:${normalizeName(act.name)}:${cleanCurr}`;
    if (pricingCache.has(key)) {
      const cached = pricingCache.get(key);
      act.cost = cached.cost;
      act.pricingType = cached.pricingType;
    } else {
      needingPricing.push(act);
    }
  });

  if (needingPricing.length === 0) {
    return activities.map((a) => standardizeActivityPricing(a, cleanCity, cleanCurr));
  }

  // 2. Prepare structured LLM prompt for uncached activities
  const { isConfigured, provider } = getAiConfig();

  if (isConfigured && provider !== 'fallback') {
    try {
      const itemsList = needingPricing
        .map((a, idx) => `${idx + 1}. "${a.name}" (${a.category || 'Sightseeing'}): ${a.description || 'tourist experience'}`)
        .join('\n');

      const systemPrompt = `You are a professional travel economist and local destination specialist.
Given a destination city, travel currency, and list of activities/landmarks, estimate authentic, realistic individual tourist costs in that currency.

Rules:
1. Free public attractions (lakes, beaches, promenades, ghats, public gardens, temples, open street markets) MUST have cost 0 and pricingType 'free'.
2. Entry ticketed attractions (museums, forts, monuments) should have realistic entry fees (typically ₹50–₹300 INR for Indian monuments or $5–$20 USD internationally).
3. Food tastings/feasts should have realistic meal budgets (₹150–₹450 INR or $10–$30 USD).
4. Paid guided tours and special adventure excursions (boat cruises, cable cars, scuba) should reflect authentic local rates (₹250–₹800 INR or $15–$50 USD).
5. Never invent expensive western tour fees for ordinary domestic sightseeing.
6. Return whole integer numbers for costs in ${cleanCurr}.`;

      const userPrompt = `City: ${cleanCity}
Currency: ${cleanCurr}

Estimate realistic individual tourist costs in ${cleanCurr} for:
${itemsList}`;

      const aiResponse = await generateStructuredResponse({
        systemPrompt,
        userPrompt,
        schema: {
          type: 'object',
          properties: {
            activities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  cost: { type: 'number' },
                  pricingType: {
                    type: 'string',
                    enum: ['free', 'entry_fee', 'estimated', 'optional'],
                  },
                },
                required: ['name', 'cost'],
              },
            },
          },
          required: ['activities'],
        },
      });

      if (aiResponse?.data?.activities && Array.isArray(aiResponse.data.activities)) {
        const costMap = new Map();
        aiResponse.data.activities.forEach((item) => {
          if (item.name && typeof item.cost === 'number' && item.cost >= 0) {
            costMap.set(normalizeName(item.name), {
              cost: Math.round(Number(item.cost)),
              pricingType: item.cost === 0 ? 'free' : (item.pricingType || 'estimated'),
            });
          }
        });

        needingPricing.forEach((act) => {
          const actKey = normalizeName(act.name);
          let estimated = costMap.get(actKey);

          // Substring match fallback
          if (!estimated) {
            for (const [k, v] of costMap.entries()) {
              if (actKey.includes(k) || k.includes(actKey)) {
                estimated = v;
                break;
              }
            }
          }

          if (estimated) {
            act.cost = estimated.cost;
            act.pricingType = estimated.pricingType;
          } else {
            act.cost = getBaselineActivityCost(act.category, cleanCurr, act.name, cleanCity);
            act.pricingType = act.cost === 0 ? 'free' : 'estimated';
          }

          // Cache result
          const cacheKey = `${cleanCity.toLowerCase()}:${actKey}:${cleanCurr}`;
          pricingCache.set(cacheKey, { cost: act.cost, pricingType: act.pricingType });
        });

        return activities.map((a) => standardizeActivityPricing(a, cleanCity, cleanCurr));
      }
    } catch (err) {
      console.warn(`[activityPricingService] AI estimation failed for ${cleanCity}, using baseline heuristics:`, err.message);
    }
  }

  // 3. Fallback: Use calibrated destination & category baseline
  needingPricing.forEach((act) => {
    act.cost = getBaselineActivityCost(act.category, cleanCurr, act.name, cleanCity);
    act.pricingType = act.cost === 0 ? 'free' : 'estimated';
    const cacheKey = `${cleanCity.toLowerCase()}:${normalizeName(act.name)}:${cleanCurr}`;
    pricingCache.set(cacheKey, { cost: act.cost, pricingType: act.pricingType });
  });

  return activities.map((a) => standardizeActivityPricing(a, cleanCity, cleanCurr));
}

export default {
  estimateActivityCostsWithAi,
  getBaselineActivityCost,
  standardizeActivityPricing,
  isIndianDestination,
  normalizeName,
};
