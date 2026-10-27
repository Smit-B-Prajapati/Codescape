import { ACTIVITIES_CATALOG } from '../controllers/activityController.js';

/**
 * Agent Travel Tools
 * Pure, deterministic tool functions called by the Agent Orchestrator.
 * Tools retrieve catalog items, generate realistic transport and accommodation options,
 * and calculate cost and budget compliance.
 */

const USD_TO_INR_RATE = 83;

import { searchActivities } from '../services/travelTools.js';
import { searchTransport } from '../services/transportService.js';
import { searchHotels } from '../services/hotelService.js';
import { isIndianDestination, standardizeActivityPricing } from '../services/activityPricingService.js';
import { calculateTripEstimate } from '../services/budgetService.js';

/**
 * Currency conversion utility without double-conversion risk.
 */
export const convertCost = (amount, targetCurrency = 'INR', fromCurrency = null) => {
  const num = Number(amount);
  if (isNaN(num) || num === 0) return 0;
  const target = (targetCurrency || 'INR').toUpperCase();
  const from = (fromCurrency || 'USD').toUpperCase();
  if (from === target) return Math.round(num);
  if (from === 'USD' && target === 'INR') return Math.round(num * USD_TO_INR_RATE);
  if (from === 'INR' && target === 'USD') return Math.round(num / USD_TO_INR_RATE);
  return Math.round(num);
};

/**
 * TOOL 1: Search Activity Catalog
 * Delegates directly to searchActivities in travelTools.js, returning validated pricing.
 */
export async function searchCatalogActivities({ destination = '', categories = [], maxCost = null, currency = 'INR' }) {
  const targetCurrency = (currency || 'INR').toUpperCase();
  const result = await searchActivities({
    city: destination,
    maxCost,
    interests: categories,
    currency: targetCurrency,
  });

  const matched = result.activities || [];

  return matched.map((act) => {
    const actCurr = (act.currency || (isIndianDestination(destination, targetCurrency) ? 'INR' : 'USD')).toUpperCase();
    let finalCost = Number(act.cost !== undefined ? act.cost : (act.price || 0));

    if (finalCost !== 0 && actCurr !== targetCurrency) {
      finalCost = convertCost(finalCost, targetCurrency, actCurr);
    }

    return standardizeActivityPricing({
      ...act,
      cost: finalCost,
      price: finalCost,
      currency: targetCurrency,
    }, destination, targetCurrency);
  });
}


/**
 * TOOL 2: Search Transport Options
 * Searches verified demo transport options strictly between the requested origin and destination.
 * If no direct matching options exist in catalog, returns an empty list without inventing fake routes.
 */
export async function searchTransportOptions({ origin = null, destination = null, travelers = 1, currency = 'INR', preference = null, date = null }) {
  if (!origin || !destination) {
    return [];
  }

  const orig = String(origin).trim();
  const dest = String(destination).trim();

  const isINR = (currency || 'INR').toUpperCase() === 'INR';
  const multiplier = isINR ? 1 : 1 / USD_TO_INR_RATE;

  // 1. Query verified DEMO transport trains matching origin & destination
  let demoTrainOptions = [];
  try {
    const trainRes = await searchTransport({
      from: orig,
      to: dest,
      date,
      travelers,
      preference,
    });
    if (trainRes && Array.isArray(trainRes.options)) {
      demoTrainOptions = trainRes.options.map((t) => ({
        id: t.id,
        type: 'train',
        name: t.name,
        trainNumber: t.trainNumber,
        carrier: `${t.name} (${t.trainNumber} - ${t.class})`,
        from: t.from,
        to: t.to,
        origin: t.from,
        destination: t.to,
        departureTime: t.departure,
        arrivalTime: t.arrival,
        durationHours: t.durationHours || 12,
        tier: t.class === '1A' || t.class === '2A' ? 'premium' : t.class === '3A' || t.class === 'CC' ? 'standard' : 'budget',
        price: Math.round(t.price * multiplier),
        cost: Math.round(t.price * multiplier),
        pricePerPerson: Math.round(t.price * multiplier),
        roundTripMultiplier: 2,
        travelers,
        currency,
        isDemo: true,
        totalRoundTripCost: Math.round(t.price * 2 * travelers * multiplier),
        seatsAvailable: t.seatsAvailable,
        seatStatus: t.seatStatus,
        notice: 'DEMO TRANSPORT DATA',
      }));
    }
  } catch (err) {
    console.warn('[agentTools] Failed to query demo trains:', err.message);
  }

  // 2. Multimodal flight & bus options only for supported, verified regional corridors
  // (e.g. Vadodara/Mumbai/Ahmedabad to Goa, Switzerland, Kashmir)
  const normOrig = orig.toLowerCase();
  const normDest = dest.toLowerCase();
  const isGoaCorridor = (normOrig.includes('vadodara') || normOrig.includes('mumbai') || normOrig.includes('ahmedabad')) && normDest.includes('goa');
  const isSwissCorridor = (normOrig.includes('mumbai') || normOrig.includes('delhi')) && (normDest.includes('switzerland') || normDest.includes('swiss') || normDest.includes('zurich') || normDest.includes('geneva') || normDest.includes('interlaken') || normDest.includes('zermatt'));
  const isKashmirCorridor = (normOrig.includes('delhi') || normOrig.includes('mumbai')) && (normDest.includes('kashmir') || normDest.includes('srinagar'));

  let baseOptions = [];
  if (isGoaCorridor) {
    baseOptions.push(
      {
        id: 'tr_fl_01',
        type: 'flight',
        carrier: 'IndiGo Express 6E-402',
        origin: orig,
        destination: dest,
        departureTime: '08:45 AM',
        arrivalTime: '11:15 AM',
        durationHours: 2.5,
        tier: 'premium',
        pricePerPerson: Math.round(4800 * multiplier),
        roundTripMultiplier: 2,
      },
      {
        id: 'tr_fl_02',
        type: 'flight',
        carrier: 'Air India AI-812',
        origin: orig,
        destination: dest,
        departureTime: '02:15 PM',
        arrivalTime: '05:00 PM',
        durationHours: 2.75,
        tier: 'premium',
        pricePerPerson: Math.round(5200 * multiplier),
        roundTripMultiplier: 2,
      },
      {
        id: 'tr_bus_01',
        type: 'bus',
        carrier: 'VRL Premium Multi-Axle AC Sleeper',
        origin: orig,
        destination: dest,
        departureTime: '07:00 PM',
        arrivalTime: '10:30 AM',
        durationHours: 15.5,
        tier: 'budget',
        pricePerPerson: Math.round(1100 * multiplier),
        roundTripMultiplier: 2,
      }
    );
  }

  if (isSwissCorridor) {
    baseOptions.push(
      {
        id: 'tr_fl_sws_01',
        type: 'flight',
        carrier: 'Swiss International Air Lines LX-155',
        origin: orig,
        destination: 'Switzerland (Zurich ZRH)',
        departureTime: '01:45 AM',
        arrivalTime: '06:15 AM',
        durationHours: 8.5,
        tier: 'premium',
        pricePerPerson: Math.round(38000 * multiplier),
        roundTripMultiplier: 2,
      },
      {
        id: 'tr_fl_sws_02',
        type: 'flight',
        carrier: 'Emirates Express EK-501 (via Dubai)',
        origin: orig,
        destination: 'Switzerland (Geneva GVA)',
        departureTime: '04:30 AM',
        arrivalTime: '01:15 PM',
        durationHours: 11.75,
        tier: 'standard',
        pricePerPerson: Math.round(32000 * multiplier),
        roundTripMultiplier: 2,
      },
      {
        id: 'tr_fl_sws_03',
        type: 'flight',
        carrier: 'Air India AI-143 (Boeing 787 Dreamliner)',
        origin: orig,
        destination: 'Switzerland (Zurich ZRH)',
        departureTime: '08:30 AM',
        arrivalTime: '06:00 PM',
        durationHours: 12.5,
        tier: 'budget',
        pricePerPerson: Math.round(26000 * multiplier),
        roundTripMultiplier: 2,
      }
    );
  }

  if (isKashmirCorridor) {
    baseOptions.push(
      {
        id: 'tr_fl_ksh_01',
        type: 'flight',
        carrier: 'IndiGo Express 6E-214 (Srinagar Direct)',
        origin: orig,
        destination: 'Kashmir (Srinagar SXR)',
        departureTime: '09:15 AM',
        arrivalTime: '11:45 AM',
        durationHours: 2.5,
        tier: 'standard',
        pricePerPerson: Math.round(4200 * multiplier),
        roundTripMultiplier: 2,
      },
      {
        id: 'tr_fl_ksh_02',
        type: 'flight',
        carrier: 'Air India AI-825 (Sheikh ul-Alam Direct)',
        origin: orig,
        destination: 'Kashmir (Srinagar SXR)',
        departureTime: '01:30 PM',
        arrivalTime: '04:00 PM',
        durationHours: 2.5,
        tier: 'premium',
        pricePerPerson: Math.round(5400 * multiplier),
        roundTripMultiplier: 2,
      },
      {
        id: 'tr_fl_ksh_03',
        type: 'flight',
        carrier: 'SpiceJet SG-1025 (Morning Flight)',
        origin: orig,
        destination: 'Kashmir (Srinagar SXR)',
        departureTime: '06:45 AM',
        arrivalTime: '09:15 AM',
        durationHours: 2.5,
        tier: 'budget',
        pricePerPerson: Math.round(3600 * multiplier),
        roundTripMultiplier: 2,
      }
    );
  }

  const isParisCorridor = (normOrig.includes('mumbai') || normOrig.includes('delhi')) && normDest.includes('paris');
  const isTokyoCorridor = (normOrig.includes('mumbai') || normOrig.includes('delhi')) && (normDest.includes('tokyo') || normDest.includes('japan'));
  const isBaliCorridor = (normOrig.includes('mumbai') || normOrig.includes('delhi') || normOrig.includes('ahmedabad')) && (normDest.includes('bali') || normDest.includes('ubud'));
  const isChennaiCorridor = (normOrig.includes('mumbai') || normOrig.includes('delhi') || normOrig.includes('ahmedabad') || normOrig.includes('vadodara')) && normDest.includes('chennai');

  if (isChennaiCorridor) {
    baseOptions.push(
      {
        id: 'tr_fl_chn_01',
        type: 'flight',
        carrier: 'IndiGo Express 6E-5321 (Non-Stop)',
        origin: orig,
        destination: 'Chennai (Meenambakkam MAA)',
        departureTime: '07:15 AM',
        arrivalTime: '09:20 AM',
        durationHours: 2.08,
        tier: 'standard',
        pricePerPerson: Math.round(3800 * multiplier),
        roundTripMultiplier: 2,
      },
      {
        id: 'tr_fl_chn_02',
        type: 'flight',
        carrier: 'Air India AI-671',
        origin: orig,
        destination: 'Chennai (Meenambakkam MAA)',
        departureTime: '01:45 PM',
        arrivalTime: '03:55 PM',
        durationHours: 2.17,
        tier: 'premium',
        pricePerPerson: Math.round(4600 * multiplier),
        roundTripMultiplier: 2,
      }
    );
  }

  if (isParisCorridor) {
    baseOptions.push(
      {
        id: 'tr_fl_prs_01',
        type: 'flight',
        carrier: 'Air France AF-217 (Direct Paris CDG)',
        origin: orig,
        destination: 'Paris (Charles de Gaulle CDG)',
        departureTime: '02:15 AM',
        arrivalTime: '08:00 AM',
        durationHours: 9.25,
        tier: 'premium',
        pricePerPerson: Math.round(42000 * multiplier),
        roundTripMultiplier: 2,
      },
      {
        id: 'tr_fl_prs_02',
        type: 'flight',
        carrier: 'Emirates EK-073 (via Dubai)',
        origin: orig,
        destination: 'Paris (Charles de Gaulle CDG)',
        departureTime: '04:30 AM',
        arrivalTime: '01:30 PM',
        durationHours: 12.5,
        tier: 'standard',
        pricePerPerson: Math.round(34000 * multiplier),
        roundTripMultiplier: 2,
      }
    );
  }

  if (isTokyoCorridor) {
    baseOptions.push(
      {
        id: 'tr_fl_tky_01',
        type: 'flight',
        carrier: 'ANA All Nippon Airways NH-830 (Direct Narita)',
        origin: orig,
        destination: 'Tokyo (Narita NRT)',
        departureTime: '08:20 PM',
        arrivalTime: '07:10 AM',
        durationHours: 8.5,
        tier: 'premium',
        pricePerPerson: Math.round(46000 * multiplier),
        roundTripMultiplier: 2,
      },
      {
        id: 'tr_fl_tky_02',
        type: 'flight',
        carrier: 'Japan Airlines JL-750 (Direct Haneda)',
        origin: orig,
        destination: 'Tokyo (Haneda HND)',
        departureTime: '10:45 PM',
        arrivalTime: '09:30 AM',
        durationHours: 8.25,
        tier: 'standard',
        pricePerPerson: Math.round(39000 * multiplier),
        roundTripMultiplier: 2,
      }
    );
  }

  if (isBaliCorridor) {
    baseOptions.push(
      {
        id: 'tr_fl_bli_01',
        type: 'flight',
        carrier: 'Garuda Indonesia GA-870 (Direct Denpasar)',
        origin: orig,
        destination: 'Bali (Ngurah Rai DPS)',
        departureTime: '01:30 AM',
        arrivalTime: '09:45 AM',
        durationHours: 6.25,
        tier: 'premium',
        pricePerPerson: Math.round(22000 * multiplier),
        roundTripMultiplier: 2,
      },
      {
        id: 'tr_fl_bli_02',
        type: 'flight',
        carrier: 'VietJet VJ-890 (via Ho Chi Minh)',
        origin: orig,
        destination: 'Bali (Ngurah Rai DPS)',
        departureTime: '11:45 PM',
        arrivalTime: '09:20 AM',
        durationHours: 8.0,
        tier: 'budget',
        pricePerPerson: Math.round(16500 * multiplier),
        roundTripMultiplier: 2,
      }
    );
  }

  const mappedBaseOptions = baseOptions.map((opt) => ({
    ...opt,
    price: opt.pricePerPerson,
    cost: opt.pricePerPerson,
    pricePerPerson: opt.pricePerPerson,
    travelers,
    currency,
    isDemo: true,
    totalRoundTripCost: Math.round(opt.pricePerPerson * opt.roundTripMultiplier * travelers),
    notice: 'DEMO TRANSPORT DATA',
  }));

  return [...demoTrainOptions, ...mappedBaseOptions];
}


/**
 * TOOL 3: Search Accommodation Options
 * Delegates to searchHotels in hotelService.js using simulated hotel inventory.
 */
export async function searchAccommodationOptions({ destination = 'Goa', durationNights = 4, travelers = 2, currency = 'INR', budgetPerNight = null, preference = null }) {
  const result = await searchHotels({
    city: destination,
    travelers,
    budgetPerNight,
    preference,
  });

  const isINR = (currency || 'INR').toUpperCase() === 'INR';
  const multiplier = isINR ? 1 : 1 / USD_TO_INR_RATE;
  const rooms = Math.max(1, Math.ceil(travelers / 2));

  return result.options.map((opt) => {
    const pricePerNightConverted = Math.round(opt.hotel.pricePerNight * multiplier);
    const tier = opt.hotel.pricePerNight >= 5000 ? 'luxury' : opt.hotel.pricePerNight >= 2500 ? 'mid-range' : 'budget';

    return {
      id: opt.hotel.id,
      name: opt.hotel.name,
      city: opt.hotel.city,
      area: opt.hotel.area,
      tier,
      rating: opt.hotel.rating,
      pricePerNight: pricePerNightConverted,
      amenities: opt.hotel.amenities,
      image: opt.hotel.image,
      durationNights,
      rooms,
      currency,
      totalStayCost: Math.round(pricePerNightConverted * durationNights * rooms),
      recommendationReason: opt.recommendationReason,
      isDemo: true,
    };
  });
}


/**
 * TOOL 4: Calculate Trip Cost & Budget Breakdown
 * Authoritative deterministic calculation delegating to budgetService.
 */
export function estimateTripCost({
  selectedTransport,
  selectedHotel,
  selectedActivities = [],
  travelers = 1,
  durationDays = 3,
  currency = 'INR',
  budgetLimit = null,
}) {
  const result = calculateTripEstimate({
    transport: selectedTransport,
    hotels: selectedHotel,
    activities: selectedActivities,
    travelers,
    nights: Math.max(1, durationDays - 1),
    budget: budgetLimit,
    currency,
  });

  return {
    budgetLimit: result.budget,
    totalEstimatedCost: result.totalEstimatedCost,
    currency: result.currency,
    isOverBudget: !result.withinBudget,
    difference: result.shortfall,
    remainingBudget: result.remainingBudget,
    budgetUtilizationPercentage: result.budgetUtilizationPercentage,
    contingencyReserve: result.contingencyReserve,
    breakdown: result.breakdown,
  };
}

export default {
  convertCost,
  searchCatalogActivities,
  searchTransportOptions,
  searchAccommodationOptions,
  estimateTripCost,
};
