import { ACTIVITIES_CATALOG } from '../controllers/activityController.js';

/**
 * Travel Tools Service
 * Whitelisted tool interface for the AI Agent.
 * Reuses the existing ACTIVITIES_CATALOG from activityController.js without duplication.
 */

// Strict parameter whitelist to prevent arbitrary or malicious queries
const ALLOWED_PARAMETERS = new Set(['city', 'query', 'category', 'maxCost', 'maxDuration']);

/**
 * Tool: searchActivities
 * 
 * @param {Object} rawParams
 * @param {string} [rawParams.city] - Target destination city (e.g. 'Goa', 'Mumbai', 'Paris')
 * @param {string} [rawParams.query] - Free-text search term
 * @param {string} [rawParams.category] - Category filter (e.g. 'Food', 'Culture', 'Nightlife', 'Adventure')
 * @param {number} [rawParams.maxCost] - Maximum activity cost filter
 * @param {number} [rawParams.maxDuration] - Maximum duration in minutes
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

  const { city, query, category, maxCost, maxDuration } = params;

  // Observable Action Logging: Search initiation
  if (city && typeof city === 'string' && city.trim()) {
    logs.push(`Searching activities in ${city.trim()}`);
  } else {
    logs.push('Searching activity catalog');
  }

  let filtered = [...ACTIVITIES_CATALOG];

  // 1. City Filter (Strict city boundary)
  if (city && typeof city === 'string' && city.trim()) {
    const targetCity = city.toLowerCase().trim();
    const firstPart = targetCity.split(',')[0].trim();

    filtered = filtered.filter((a) => {
      const aCity = (a.city || '').toLowerCase().trim();
      return targetCity === aCity || targetCity.includes(aCity) || aCity.includes(firstPart);
    });
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

  // Observable Action Logging: Search completion
  logs.push(`Found ${filtered.length} activities`);

  // Normalized schema return
  const normalized = filtered.map((a) => ({
    id: a.id,
    name: a.name,
    city: a.city,
    description: a.description || '',
    category: a.category || 'Sightseeing',
    cost: Number(a.cost || 0),
    duration: Number(a.duration || 60),
    image: a.image || '',
  }));

  return {
    success: true,
    count: normalized.length,
    activities: normalized,
    logs,
  };
}

export default {
  searchActivities,
};
