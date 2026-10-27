import { DEMO_TRAINS } from '../data/trains.js';

/**
 * City alias mapping to assist fuzzy/natural match
 */
const CITY_ALIASES = {
  vadodara: ['vadodara', 'baroda', 'brc'],
  goa: ['goa', 'madgaon', 'mao', 'panaji', 'vasco', 'margao', 'karmali'],
  mumbai: ['mumbai', 'bombay', 'csmt', 'ltt', 'mmct', 'bdts', 'bandra', 'dadar'],
  pune: ['pune', 'poona', 'pa'],
  ahmedabad: ['ahmedabad', 'adi', 'sabarmati'],
  jaipur: ['jaipur', 'jp'],
  delhi: ['delhi', 'new delhi', 'ndls', 'dec', 'dli', 'hazrat nizamuddin', 'nzm'],
  agra: ['agra', 'agc', 'af', 'cantt'],
  chennai: ['chennai', 'madras', 'mas', 'ms'],
  bangalore: ['bangalore', 'bengaluru', 'sbc', 'ypr'],
  kolkata: ['kolkata', 'calcutta', 'hwh', 'sdah'],
  hyderabad: ['hyderabad', 'secunderabad', 'sc', 'hyd'],
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
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
 * Evaluates whether a train operates on a given day of the week
 * 
 * @param {string[]} operatingDays - e.g. ['Mon', 'Wed'] or ['Daily']
 * @param {string} targetDay - e.g. 'Mon'
 * @returns {boolean}
 */
export const checkTrainRunsOnDay = (operatingDays = [], targetDay = '') => {
  if (!operatingDays || operatingDays.length === 0) return true;
  if (operatingDays.includes('Daily')) return true;
  if (operatingDays.includes(targetDay)) return true;

  // Handle formats like "Daily except Wed"
  const exceptRule = operatingDays.find((d) => d.toLowerCase().startsWith('daily except'));
  if (exceptRule) {
    const excludedDay = exceptRule.split('except')[1]?.trim();
    if (excludedDay && excludedDay.toLowerCase() === targetDay.toLowerCase()) {
      return false;
    }
    return true;
  }

  return false;
};

/**
 * Parses input date string or object into normalized day name and formatted date
 * 
 * @param {string|Date} dateInput 
 * @returns {{ valid: boolean, dayName: string|null, formattedDate: string }}
 */
export const parseTravelDate = (dateInput) => {
  if (!dateInput) {
    return { valid: false, dayName: null, formattedDate: 'Flexible Date' };
  }

  // Check if user directly passed day name e.g. 'Monday', 'Mon'
  const trimmed = String(dateInput).trim();
  for (const day of DAY_NAMES) {
    if (trimmed.toLowerCase().startsWith(day.toLowerCase())) {
      return { valid: true, dayName: day, formattedDate: day };
    }
  }

  const parsed = new Date(dateInput);
  if (!isNaN(parsed.getTime())) {
    const dayName = DAY_NAMES[parsed.getDay()];
    const isoDate = parsed.toISOString().split('T')[0];
    return { valid: true, dayName, formattedDate: isoDate };
  }

  return { valid: false, dayName: null, formattedDate: String(dateInput) };
};

/**
 * DEMO Transport Search Tool
 * Pure deterministic search across fictional simulated train transport options.
 * 
 * IMPORTANT:
 * - Fictional DEMO transport data for hackathon and simulation purposes.
 * - NOT connected to IRCTC, Indian Railways, or any real ticketing API.
 * - AI must never present this as a real-time availability guarantee.
 * - Always tags results with isDemo: true and "DEMO TRANSPORT DATA".
 * 
 * @param {Object} params
 * @param {string} params.from - Origin city or station
 * @param {string} params.to - Destination city or station
 * @param {string|Date} [params.date] - Optional travel date (YYYY-MM-DD or Day)
 * @param {number} [params.travelers=1] - Number of travelers
 * @param {string} [params.preference] - 'budget' | 'fast' | 'comfort'
 * @returns {Promise<{ success: boolean, isDemo: boolean, notice: string, disclaimer: string, count: number, options: Array, logs: string[] }>}
 */
export async function searchTransport({
  from = '',
  to = '',
  date = null,
  travelers = 1,
  preference = null,
} = {}) {
  const logs = [];
  const normalizedFrom = normalizeCity(from);
  const normalizedTo = normalizeCity(to);
  const travelerCount = Math.max(1, parseInt(travelers, 10) || 1);
  const parsedDate = parseTravelDate(date);

  logs.push(`Searching demo transport routes from "${from || 'origin'}" to "${to || 'destination'}"`);

  // 1. Filter matching routes between origin and destination
  let routeMatches = DEMO_TRAINS.filter((train) => {
    const tFrom = normalizeCity(train.fromCity);
    const tTo = normalizeCity(train.toCity);
    const originMatch = tFrom === normalizedFrom || (train.from && normalizeCity(train.from) === normalizedFrom);
    const destMatch = tTo === normalizedTo || (train.to && normalizeCity(train.to) === normalizedTo);
    return originMatch && destMatch;
  });

  // If no direct matching demo route, return empty list gracefully (no hallucination)
  if (routeMatches.length === 0) {
    logs.push(`Found 0 demo transport options for ${from} → ${to} (DEMO TRANSPORT DATA)`);
    return {
      success: true,
      isDemo: true,
      notice: 'DEMO TRANSPORT DATA',
      disclaimer: 'DEMO TRANSPORT DATA - Fictional simulation for demonstration only. The AI never provides real-time IRCTC booking guarantees.',
      count: 0,
      options: [],
      logs,
    };
  }

  // 2. Respect date if applicable
  let dateFilteredMatches = routeMatches;
  if (parsedDate.valid && parsedDate.dayName) {
    const activeOnDay = routeMatches.filter((train) =>
      checkTrainRunsOnDay(train.operatingDays, parsedDate.dayName)
    );

    if (activeOnDay.length > 0) {
      dateFilteredMatches = activeOnDay;
      logs.push(`Filtered by schedule for ${parsedDate.dayName} (${parsedDate.formattedDate}): ${activeOnDay.length} of ${routeMatches.length} trains running`);
    } else {
      logs.push(`Note: None of the ${routeMatches.length} route trains operate on ${parsedDate.dayName}. Returning closest scheduled demo options with operating notices.`);
    }
  }

  // 3. Format and enrich with traveler count, seat status, and demo indicators
  const normalizedResults = dateFilteredMatches.map((train) => {
    const pricePerPerson = train.price;
    const totalPrice = pricePerPerson * travelerCount;
    const totalRoundTripPrice = totalPrice * 2;
    const hasEnoughSeats = train.seatsAvailable >= travelerCount;

    return {
      id: train.id,
      trainNumber: train.trainNumber,
      name: train.name,
      from: train.from,
      to: train.to,
      fromCity: train.fromCity,
      toCity: train.toCity,
      departure: train.departure,
      arrival: train.arrival,
      duration: train.duration,
      durationHours: train.durationHours,
      class: train.class,
      price: train.price,
      pricePerPerson,
      travelers: travelerCount,
      totalPrice,
      totalRoundTripPrice,
      seatsAvailable: train.seatsAvailable,
      seatStatus: hasEnoughSeats
        ? `Available (${train.seatsAvailable} seats)`
        : `Limited (${train.seatsAvailable} seats, ${travelerCount - train.seatsAvailable} waitlist)`,
      operatingDays: train.operatingDays,
      travelDate: parsedDate.formattedDate,
      isDemo: true,
      disclaimer: 'DEMO TRANSPORT DATA: Simulated hackathon data. Not an IRCTC booking guarantee.',
    };
  });

  // 4. Deterministic sorting based on preference
  const pref = (preference || '').toLowerCase().trim();
  const tierScore = { '1A': 5, '2A': 4, CC: 3, '3A': 2, SL: 1, '2S': 0 };

  normalizedResults.sort((a, b) => {
    if (pref === 'budget' || pref === 'cheap' || pref === 'economical' || pref === 'price') {
      return a.pricePerPerson - b.pricePerPerson || a.durationHours - b.durationHours || a.trainNumber.localeCompare(b.trainNumber);
    }
    if (pref === 'fast' || pref === 'fastest' || pref === 'quick' || pref === 'duration') {
      return a.durationHours - b.durationHours || a.pricePerPerson - b.pricePerPerson || a.trainNumber.localeCompare(b.trainNumber);
    }
    if (pref === 'comfort' || pref === 'luxury') {
      const tierDiff = (tierScore[b.class] || 0) - (tierScore[a.class] || 0);
      return tierDiff !== 0 ? tierDiff : a.pricePerPerson - b.pricePerPerson || a.trainNumber.localeCompare(b.trainNumber);
    }
    // Default deterministic sort: price ascending, then duration ascending, then trainNumber
    return a.pricePerPerson - b.pricePerPerson || a.durationHours - b.durationHours || a.trainNumber.localeCompare(b.trainNumber);
  });

  logs.push(`Found ${normalizedResults.length} demo transport options for ${from} → ${to} (DEMO TRANSPORT DATA)`);

  return {
    success: true,
    isDemo: true,
    notice: 'DEMO TRANSPORT DATA',
    disclaimer: 'DEMO TRANSPORT DATA - Fictional simulation for demonstration only. The AI never provides real-time IRCTC booking guarantees.',
    count: normalizedResults.length,
    options: normalizedResults,
    logs,
  };
}

export default {
  searchTransport,
  normalizeCity,
  parseTravelDate,
  checkTrainRunsOnDay,
};
