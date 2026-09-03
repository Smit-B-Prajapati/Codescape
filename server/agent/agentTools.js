import { ACTIVITIES_CATALOG } from '../controllers/activityController.js';

/**
 * Agent Travel Tools
 * Pure, deterministic tool functions called by the Agent Orchestrator.
 * Tools retrieve catalog items, generate realistic transport and accommodation options,
 * and calculate cost and budget compliance.
 */

const USD_TO_INR_RATE = 83;

/**
 * Currency conversion utility
 */
export const convertCost = (amountInUsd, targetCurrency = 'USD') => {
  const curr = (targetCurrency || 'USD').toUpperCase();
  if (curr === 'INR') {
    return Math.round(amountInUsd * USD_TO_INR_RATE);
  }
  return Math.round(amountInUsd);
};

import { searchActivities } from '../services/travelTools.js';
import { searchTransport } from '../services/transportService.js';
import { searchHotels } from '../services/hotelService.js';

/**
 * TOOL 1: Search Activity Catalog
 * Delegates directly to searchActivities in travelTools.js, reusing ACTIVITIES_CATALOG.
 */
export async function searchCatalogActivities({ destination = '', categories = [], maxCost = null, currency = 'INR' }) {
  const result = await searchActivities({
    city: destination,
    maxCost,
  });

  let matched = result.activities;
  if (matched.length === 0) {
    const fallbackSearch = await searchActivities();
    matched = fallbackSearch.activities.slice(0, 6);
  }

  // Convert cost according to requested currency
  return matched.map((act) => ({
    ...act,
    cost: convertCost(act.cost || 0, currency),
    originalUsdCost: act.cost,
    currency,
  }));
}


/**
 * TOOL 2: Search Transport Options
 * Simulates realistic carrier options between origin and destination.
 */
export async function searchTransportOptions({ origin = 'Vadodara', destination = 'Goa', travelers = 1, currency = 'INR', preference = null, date = null }) {
  const orig = origin || 'Origin City';
  const dest = destination || 'Destination City';

  const isINR = (currency || 'INR').toUpperCase() === 'INR';
  const multiplier = isINR ? 1 : 1 / USD_TO_INR_RATE;

  // 1. Query verified DEMO transport trains
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
        carrier: `${t.name} (${t.trainNumber} - ${t.class})`,
        origin: t.from,
        destination: t.to,
        departureTime: t.departure,
        arrivalTime: t.arrival,
        durationHours: t.durationHours || 12,
        tier: t.class === '1A' || t.class === '2A' ? 'premium' : t.class === '3A' || t.class === 'CC' ? 'standard' : 'budget',
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

  // 2. Multimodal flight & bus options for demonstration
  const baseOptions = [
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
    },
  ].map((opt) => ({
    ...opt,
    travelers,
    currency,
    isDemo: true,
    totalRoundTripCost: Math.round(opt.pricePerPerson * opt.roundTripMultiplier * travelers),
    notice: 'DEMO TRANSPORT DATA',
  }));

  return [...demoTrainOptions, ...baseOptions];
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
  const isINR = (currency || 'INR').toUpperCase() === 'INR';
  const dailyFoodPerPerson = isINR ? 500 : Math.round(500 / USD_TO_INR_RATE);

  const transportCost = selectedTransport ? selectedTransport.totalRoundTripCost : 0;
  const hotelCost = selectedHotel ? selectedHotel.totalStayCost : 0;
  const activitiesCost = selectedActivities.reduce((sum, a) => sum + (a.cost || 0) * travelers, 0);
  const foodCost = dailyFoodPerPerson * durationDays * travelers;

  const totalEstimatedCost = transportCost + hotelCost + activitiesCost + foodCost;

  const isOverBudget = budgetLimit !== null && budgetLimit > 0 && totalEstimatedCost > budgetLimit;
  const difference = budgetLimit !== null && budgetLimit > 0 ? totalEstimatedCost - budgetLimit : 0;

  return {
    budgetLimit: budgetLimit || null,
    totalEstimatedCost,
    currency,
    isOverBudget,
    difference,
    breakdown: {
      transportation: transportCost,
      accommodation: hotelCost,
      activities: activitiesCost,
      food: foodCost,
    },
  };
}

export default {
  convertCost,
  searchCatalogActivities,
  searchTransportOptions,
  searchAccommodationOptions,
  estimateTripCost,
};
