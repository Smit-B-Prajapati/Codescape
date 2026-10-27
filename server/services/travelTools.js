import { ACTIVITIES_CATALOG } from '../controllers/activityController.js';
import { generateStructuredResponse, getAiConfig } from './aiService.js';
import { isIndianDestination, standardizeActivityPricing } from './activityPricingService.js';

/**
 * Travel Tools Service
 * Whitelisted tool interface for the AI Agent.
 * Reuses the existing ACTIVITIES_CATALOG from activityController.js without duplication.
 */

// Strict parameter whitelist to prevent arbitrary or malicious queries
const ALLOWED_PARAMETERS = new Set(['city', 'destination', 'query', 'category', 'categories', 'maxCost', 'maxDuration', 'interests', 'currency']);

/**
 * Prompts the configured LLM to generate authentic, real-world activities and landmarks
 * for any destination worldwide when the catalog has fewer than 24 activities.
 */
export async function fetchAiProposedActivities(cityName, neededCount = 12, interests = [], currency = 'INR') {
  const { isConfigured, provider } = getAiConfig();
  if (!isConfigured || provider === 'fallback') return null;

  try {
    const cleanCity = cityName ? cityName.trim() : 'Destination';
    const isIndia = isIndianDestination(cleanCity, currency);
    const curr = (currency || (isIndia ? 'INR' : 'USD')).toUpperCase();
    const actualCount = Math.min(Math.max(6, Number(neededCount) || 10), 12);

    const systemPrompt = `You are an expert travel concierge and destination specialist.
Generate a list of exactly ${actualCount} authentic, destination-specific tourist activities, famous landmarks, cultural spots, and dining experiences specifically in ${cleanCity}.
Rules:
1. Every activity MUST be a real, iconic, or beloved landmark/activity in or immediately around ${cleanCity}.
2. Every activity name MUST be 100% unique. Never repeat landmarks or activities.
3. Pricing must be realistic and in ${curr}:
   - Free public attractions (lakes, beaches, promenades, ghats, parks, temples, shrines, markets) MUST have cost 0 and pricingType 'free'.
   - Ticketed heritage sites and museums should have realistic entry fees (e.g. ₹50–₹250 INR for Indian sites or $5–$20 USD internationally).
   - Food tastings/dining should reflect authentic meal costs (₹150–₹350 INR or $10–$25 USD).
   - Optional experiences (boat cruises, cable cars, safaris) should reflect local rates (₹250–₹600 INR or $15–$45 USD).
4. Duration should be in minutes (typically 60 to 240 minutes).
5. Category must be one of: 'Sightseeing', 'Culture', 'Food', 'Nature', 'Adventure', 'Shopping', 'Relaxation', 'Nightlife'.
6. Provide an engaging 1-2 sentence description.`;

    const response = await generateStructuredResponse({
      systemPrompt,
      userPrompt: `Generate ${actualCount} authentic, unique activities for ${cleanCity}${interests?.length ? ` focusing on interests: ${interests.join(', ')}` : ''}.`,
      schema: {
        type: 'object',
        properties: {
          activities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                category: { type: 'string' },
                cost: { type: 'number' },
                pricingType: { type: 'string', enum: ['free', 'entry_fee', 'estimated', 'optional'] },
                duration: { type: 'number' },
                description: { type: 'string' },
              },
              required: ['name', 'category', 'cost', 'duration', 'description'],
            },
          },
        },
        required: ['activities'],
      },
    });

    const rawList = Array.isArray(response?.data)
      ? response.data
      : (response?.data?.activities || response?.data?.items || response?.data?.data || response?.data?.experiences || []);

    if (Array.isArray(rawList) && rawList.length > 0) {
      const parseCost = (val) => {
        if (val === null || val === undefined) return 0;
        if (typeof val === 'number') return Math.max(0, val);
        const str = String(val).trim().toLowerCase();
        if (str.includes('free') || str === '0') return 0;
        const match = str.match(/\d+(\.\d+)?/);
        return match ? Math.max(0, Math.round(Number(match[0]))) : 0;
      };

      const parseDuration = (val) => {
        if (val === null || val === undefined) return 90;
        if (typeof val === 'number') return Math.max(30, val <= 12 ? Math.round(val * 60) : Math.round(val));
        const str = String(val).trim().toLowerCase();
        const match = str.match(/\d+(\.\d+)?/);
        if (!match) return 90;
        const num = Number(match[0]);
        if (str.includes('hour') || str.includes('hr')) return Math.max(30, Math.round(num * 60));
        return Math.max(30, Math.round(num));
      };

      const categoryImages = {
        Food: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
        Culture: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80',
        Nature: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
        Adventure: 'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?auto=format&fit=crop&w=800&q=80',
        Nightlife: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
        Shopping: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80',
        Relaxation: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        Sightseeing: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      };

      return rawList.slice(0, actualCount).map((a, idx) => {
        const costNum = parseCost(a.cost);
        const durationMins = parseDuration(a.duration);
        const category = a.category || 'Sightseeing';
        const img = categoryImages[category] || categoryImages.Sightseeing;

        return {
          id: `act_${cleanCity.toLowerCase().replace(/[^a-z0-9]/g, '_')}_ai_${idx + 1}`,
          name: a.name,
          city: cleanCity,
          description: a.description || `Experience ${a.name} in ${cleanCity}.`,
          category,
          cost: costNum,
          price: costNum,
          currency: curr,
          pricingType: a.pricingType || (costNum === 0 ? 'free' : 'estimated'),
          pricePerPerson: true,
          duration: durationMins,
          image: a.image || img,
          isVerified: true,
          source: 'ai_generated',
        };
      });
    }
  } catch (err) {
    console.warn(`[travelTools] AI activity generation failed for ${cityName}:`, err.message);
  }
  return null;
}

/**
 * Generates rich, authentic activities for any destination city to ensure
 * the AI agent always has enough unique options to plan 2-3 activities per day.
 * Includes a balanced mixture of free (₹0), low-cost entry fees, and paid experiences.
 */
export function generateSyntheticCityActivities(cityName, neededCount = 24, currency = 'INR') {
  const cleanCity = cityName ? cityName.trim() : 'Destination';
  const isIndia = isIndianDestination(cleanCity, currency);
  const curr = (currency || (isIndia ? 'INR' : 'USD')).toUpperCase();

  const templatesIndia = [
    {
      name: `${cleanCity} Historic Old Town & Heritage Promenade`,
      category: 'Sightseeing',
      cost: 0,
      pricingType: 'free',
      duration: 120,
      description: `Scenic morning walk exploring ${cleanCity}'s historic old quarter, landmark facades, and heritage architecture.`,
    },
    {
      name: `${cleanCity} Authentic Local Street Food & Culinary Crawl`,
      category: 'Food',
      cost: 150,
      pricingType: 'estimated',
      duration: 120,
      description: `Taste iconic traditional snacks, savory chaats, and local sweets across ${cleanCity}'s bustling food alleys.`,
    },
    {
      name: `${cleanCity} Central Art & Cultural History Museum`,
      category: 'Culture',
      cost: 100,
      pricingType: 'entry_fee',
      duration: 120,
      description: `Discover ancient sculptures, regional folk art, and royal dynasty relics at ${cleanCity}'s premier museum.`,
    },
    {
      name: `${cleanCity} Sunset Lake & Waterfront Boulevard Promenade`,
      category: 'Relaxation',
      cost: 0,
      pricingType: 'free',
      duration: 90,
      description: `Peaceful evening stroll along scenic lakeside pathways catching refreshing breezes and picturesque golden-hour views.`,
    },
    {
      name: `${cleanCity} Traditional Artisan Bazaar & Handicrafts Market`,
      category: 'Shopping',
      cost: 0,
      pricingType: 'free',
      duration: 120,
      description: `Wander through colorful street stalls browsing handwoven textiles, local spices, brass antiques, and authentic souvenirs.`,
    },
    {
      name: `${cleanCity} Sacred Temple & Ancient Shrine Heritage Trail`,
      category: 'Culture',
      cost: 0,
      pricingType: 'free',
      duration: 90,
      description: `Visit revered centuries-old sacred temple architecture, peaceful sanctums, and vibrant spiritual cultural traditions in ${cleanCity}.`,
    },
    {
      name: `${cleanCity} Botanical Gardens & Green Valley Nature Walk`,
      category: 'Nature',
      cost: 50,
      pricingType: 'entry_fee',
      duration: 120,
      description: `Refreshing walk among lush tropical flora, shade trees, fountains, and tranquil scenic garden paths.`,
    },
    {
      name: `${cleanCity} Hilltop Viewpoint & Panoramic Sunrise Trek`,
      category: 'Adventure',
      cost: 0,
      pricingType: 'free',
      duration: 150,
      description: `Early morning hike to a scenic summit overlooking the spectacular skyline and natural surroundings of ${cleanCity}.`,
    },
    {
      name: `${cleanCity} Night Bazaar, Live Music & Rooftop Lounge`,
      category: 'Nightlife',
      cost: 250,
      pricingType: 'optional',
      duration: 180,
      description: `Vibrant evening nightlife with live acoustic performances, local specialty drinks, and energetic social vibes.`,
    },
    {
      name: `${cleanCity} Riverside Boat Cruise & Scenic Skyline Tour`,
      category: 'Sightseeing',
      cost: 350,
      pricingType: 'optional',
      duration: 90,
      description: `Relaxing cruise on calm waters offering unique panoramic angles of landmark bridges and historical facades.`,
    },
    {
      name: `${cleanCity} Royal Palace Grounds & Architecture Walk`,
      category: 'Culture',
      cost: 200,
      pricingType: 'entry_fee',
      duration: 120,
      description: `Marvel at majestic royal courtyards, decorative archways, and opulent historic chambers in the heart of ${cleanCity}.`,
    },
    {
      name: `${cleanCity} Sunset Cafe & Gourmet Dessert Tasting`,
      category: 'Food',
      cost: 150,
      pricingType: 'estimated',
      duration: 90,
      description: `Unwind at a celebrated local cafe tasting handcrafted regional desserts, artisanal teas, and specialty coffees.`,
    },
    {
      name: `${cleanCity} Coastal Beach Promenade & Golden Sands Trail`,
      category: 'Relaxation',
      cost: 0,
      pricingType: 'free',
      duration: 90,
      description: `Breezy seaside walk along gentle waves, watching fishing boats and vibrant horizon colors.`,
    },
    {
      name: `${cleanCity} Regional Spice & Organic Produce Market Tour`,
      category: 'Food',
      cost: 0,
      pricingType: 'free',
      duration: 75,
      description: `Experience the aromatic fragrances and colorful mounds of fresh spices, tropical fruits, and estate teas.`,
    },
    {
      name: `${cleanCity} Historic Fortress Bastion & Defense Walls Hike`,
      category: 'Sightseeing',
      cost: 50,
      pricingType: 'entry_fee',
      duration: 120,
      description: `Explore centuries-old watchtowers, cannon emplacements, and strategic vistas overlooking the valleys.`,
    },
    {
      name: `${cleanCity} Cycling Exploration Through Heritage Suburbs`,
      category: 'Adventure',
      cost: 150,
      pricingType: 'optional',
      duration: 150,
      description: `Guided morning bicycle ride meandering past quaint residential avenues, shaded gardens, and civic monuments.`,
    },
    {
      name: `${cleanCity} Contemporary Art Gallery & Modern Sculpture Park`,
      category: 'Culture',
      cost: 50,
      pricingType: 'entry_fee',
      duration: 90,
      description: `Discover thought-provoking regional installations, avant-garde paintings, and peaceful sculpture courtyards.`,
    },
    {
      name: `${cleanCity} Twilight Street Lanterns & Cultural Music Walk`,
      category: 'Nightlife',
      cost: 0,
      pricingType: 'free',
      duration: 90,
      description: `Atmospheric dusk walk under glowing decorative street lamps with street buskers playing folk tunes.`,
    },
    {
      name: `${cleanCity} Nature Reserve Birdwatching & Canopy Trail`,
      category: 'Nature',
      cost: 100,
      pricingType: 'entry_fee',
      duration: 120,
      description: `Spot migratory songbirds, butterflies, and indigenous wildlife along designated eco-sanctuary pathways.`,
    },
    {
      name: `${cleanCity} Authentic Cooking Demonstration & Chef's Table`,
      category: 'Food',
      cost: 350,
      pricingType: 'optional',
      duration: 120,
      description: `Learn the secrets of regional spice blending and traditional cookware with a demonstration and dinner.`,
    },
    {
      name: `${cleanCity} Panoramic Cable Car & Valley Observation Deck`,
      category: 'Sightseeing',
      cost: 150,
      pricingType: 'optional',
      duration: 90,
      description: `Soar high above the city ridges for breathtaking 360-degree vistas and crisp mountain breezes.`,
    },
    {
      name: `${cleanCity} Heritage Library & Archival Rare Books Exhibit`,
      category: 'Culture',
      cost: 30,
      pricingType: 'entry_fee',
      duration: 60,
      description: `Admire ornate teak bookshelves, historic cartography, and preserved royal manuscripts.`,
    },
    {
      name: `${cleanCity} Peaceful Urban Oasis & Zen Reflection Garden`,
      category: 'Relaxation',
      cost: 0,
      pricingType: 'free',
      duration: 75,
      description: `Quiet morning retreat featuring stepping stones, reflection ponds, bamboo groves, and shaded benches.`,
    },
    {
      name: `${cleanCity} Evening Rooftop Astronomy & Constellation Stargazing`,
      category: 'Adventure',
      cost: 150,
      pricingType: 'optional',
      duration: 90,
      description: `Peer through high-powered optical telescopes to view moon craters, planets, and seasonal star clusters.`,
    },
    {
      name: `${cleanCity} Souvenir Pottery & Traditional Clay Crafting Workshop`,
      category: 'Shopping',
      cost: 150,
      pricingType: 'optional',
      duration: 90,
      description: `Shape your own terracotta keepsake under the guidance of multi-generational ceramic artisans.`,
    },
  ];

  const templatesInternational = [
    {
      name: `${cleanCity} Historic Old Town & Heritage Promenade`,
      category: 'Sightseeing',
      cost: 0,
      pricingType: 'free',
      duration: 120,
      description: `Scenic morning exploration of ${cleanCity}'s historic quarter, architectural monuments, and heritage landmarks.`,
    },
    {
      name: `${cleanCity} Authentic Local Street Food & Culinary Crawl`,
      category: 'Food',
      cost: 25,
      pricingType: 'estimated',
      duration: 120,
      description: `Taste iconic traditional treats, savory delicacies, and beloved local snacks across ${cleanCity}'s bustling food alleys.`,
    },
    {
      name: `${cleanCity} Central Art & Cultural History Museum`,
      category: 'Culture',
      cost: 18,
      pricingType: 'entry_fee',
      duration: 120,
      description: `Immerse in ancient artifacts, regional art collections, and royal heritage at ${cleanCity}'s premier cultural museum.`,
    },
    {
      name: `${cleanCity} Sunset Lake & Waterfront Boulevard Promenade`,
      category: 'Relaxation',
      cost: 0,
      pricingType: 'free',
      duration: 90,
      description: `Peaceful evening stroll along scenic waterfront pathways catching refreshing breezes and picturesque golden-hour views.`,
    },
    {
      name: `${cleanCity} Traditional Artisan Bazaar & Handicrafts Market`,
      category: 'Shopping',
      cost: 0,
      pricingType: 'free',
      duration: 120,
      description: `Wander through colorful street stalls browsing handwoven textiles, local goods, and authentic souvenirs.`,
    },
    {
      name: `${cleanCity} Botanical Gardens & Green Valley Nature Walk`,
      category: 'Nature',
      cost: 10,
      pricingType: 'entry_fee',
      duration: 120,
      description: `Refreshing walk among lush flora, shade trees, fountains, and tranquil scenic garden paths.`,
    },
    {
      name: `${cleanCity} Riverside Boat Cruise & Scenic Skyline Tour`,
      category: 'Sightseeing',
      cost: 30,
      pricingType: 'optional',
      duration: 90,
      description: `Relaxing cruise on calm waters offering unique panoramic angles of landmark bridges and historical facades.`,
    },
  ];

  const templates = isIndia ? templatesIndia : templatesInternational;

  return templates.slice(0, neededCount).map((t, idx) => ({
    id: `act_${cleanCity.toLowerCase().replace(/[^a-z0-9]/g, '_')}_synth_${idx + 1}`,
    name: t.name,
    city: cleanCity,
    description: t.description,
    category: t.category,
    cost: t.cost,
    price: t.cost,
    currency: curr,
    pricingType: t.pricingType,
    pricePerPerson: true,
    duration: t.duration,
    isVerified: false,
    source: 'local_estimate',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  }));
}

/**
 * Tool: searchActivities
 * 
 * @param {Object} rawParams
 * @param {string} [rawParams.city] - Target destination city (e.g. 'Udaipur', 'Goa', 'Mumbai', 'Paris')
 * @param {string} [rawParams.destination] - Alias for city
 * @param {string} [rawParams.query] - Free-text search term
 * @param {string} [rawParams.category] - Category filter
 * @param {number} [rawParams.maxCost] - Maximum activity cost filter
 * @param {number} [rawParams.maxDuration] - Maximum duration in minutes
 * @param {string} [rawParams.currency='INR'] - Target currency
 * @returns {Promise<{ success: boolean, count: number, activities: Array, logs: string[] }>}
 */
export async function searchActivities(rawParams = {}) {
  const logs = [];

  // Whitelist parameter extraction: discards any unsupported or malicious input
  const params = {};
  if (rawParams && typeof rawParams === 'object') {
    for (const key of Object.keys(rawParams)) {
      if (ALLOWED_PARAMETERS.has(key)) {
        params[key] = rawParams[key];
      }
    }
  }

  const city = (params.city || params.destination || rawParams.city || rawParams.destination || '').trim();
  const query = (params.query || rawParams.query || '').trim();
  const category = (params.category || rawParams.category || '').trim();
  const maxCost = params.maxCost !== undefined ? params.maxCost : rawParams.maxCost;
  const maxDuration = params.maxDuration !== undefined ? params.maxDuration : rawParams.maxDuration;
  const interests = params.interests || rawParams.interests || params.categories || rawParams.categories || [];
  const currency = (params.currency || rawParams.currency || (isIndianDestination(city) ? 'INR' : 'USD')).toUpperCase();

  // Observable Action Logging: Search initiation
  if (city) {
    logs.push(`Searching activities in ${city}`);
  } else {
    logs.push('Searching activity catalog');
  }

  let filtered = [...ACTIVITIES_CATALOG];

  // 1. City Filter (Strict city boundary)
  if (city) {
    const targetCity = city.toLowerCase().trim();
    const firstPart = targetCity.split(',')[0].trim();

    filtered = filtered.filter((a) => {
      const aCity = (a.city || '').toLowerCase().trim();
      const isKashmir = (targetCity.includes('kashmir') || targetCity.includes('srinagar')) &&
                        (aCity.includes('kashmir') || aCity.includes('srinagar'));
      return isKashmir || targetCity === aCity || targetCity.includes(aCity) || aCity.includes(firstPart);
    });

    // If city has fewer than 24 activities in catalog, first query the active LLM if available,
    // otherwise fall back gracefully to synthetic templates
    if (filtered.length < 24) {
      const needed = Math.min(12, Math.max(8, 24 - filtered.length));
      let aiActivities = null;
      try {
        aiActivities = await fetchAiProposedActivities(city, needed, interests, currency);
      } catch (_) {}

      if (aiActivities && aiActivities.length > 0) {
        logs.push(`Generated ${aiActivities.length} live AI-recommended activities for ${city}`);
        filtered.push(...aiActivities);
      } else {
        const synthetic = generateSyntheticCityActivities(city, needed, currency).map((s) => ({
          ...s,
          isVerified: false,
          source: 'local_estimate',
          notice: 'Estimated activity',
        }));
        filtered.push(...synthetic);
      }
    }
  }

  // 2. Query Text Search
  if (query && typeof query === 'string' && query.trim()) {
    const q = query.toLowerCase().trim();
    filtered = filtered.filter(
      (a) =>
        (a.name || '').toLowerCase().includes(q) ||
        (a.description || '').toLowerCase().includes(q) ||
        (a.category || '').toLowerCase().includes(q)
    );
  }

  // 3. Category Filter
  if (category && typeof category === 'string' && category.trim() && category.toLowerCase() !== 'all') {
    const cat = category.toLowerCase().trim();
    filtered = filtered.filter((a) => (a.category || '').toLowerCase() === cat);
  }

  // 4. Max Cost Filter
  if (maxCost !== undefined && maxCost !== null && !isNaN(Number(maxCost))) {
    const limit = Number(maxCost);
    filtered = filtered.filter((a) => Number(a.cost || 0) <= limit);
  }

  // 5. Max Duration Filter (in minutes)
  if (maxDuration !== undefined && maxDuration !== null && !isNaN(Number(maxDuration))) {
    const limit = Number(maxDuration);
    filtered = filtered.filter((a) => Number(a.duration || 0) <= limit);
  }

  // Deduplicate activities by normalized name and ID to guarantee complete uniqueness
  const seenNames = new Set();
  const seenIds = new Set();
  const uniqueActivities = [];

  for (const a of filtered) {
    const normKey = (a.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const actId = a.id || a._id;
    if (!normKey || seenNames.has(normKey) || (actId && seenIds.has(actId))) continue;
    seenNames.add(normKey);
    if (actId) seenIds.add(actId);
    uniqueActivities.push(a);
  }

  // Observable Action Logging: Search completion
  logs.push(`Found ${uniqueActivities.length} unique activities`);

  // Standardize pricing metadata on every returned item
  const normalized = uniqueActivities.map((a) =>
    standardizeActivityPricing(a, city, currency)
  );

  return {
    success: true,
    count: normalized.length,
    activities: normalized,
    logs,
  };
}

export default {
  searchActivities,
  generateSyntheticCityActivities,
  fetchAiProposedActivities,
};
