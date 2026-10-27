/**
 * Budget Service & Trip Cost Estimator
 * 
 * Implements deterministic financial calculations in pure application code.
 * Reuses GlobeTrotter category conventions:
 * (Transportation, Accommodation, Activities, Food, Miscellaneous/Other).
 * 
 * IMPORTANT:
 * - AI is never permitted to perform financial math or calculate balances itself.
 * - Calculations are strictly performed deterministically by application code.
 * - Primary demonstration currency is INR (₹) for India-focused routes,
 *   while preserving currency field support for global extensibility.
 */

const USD_TO_INR_RATE = 83;

/**
 * Deterministically calculates a target budget allocation across categories
 * prior to selecting activities or accommodation.
 * 
 * Consideration factors:
 * - Total trip budget
 * - Trip duration & traveler count
 * - Destination cost level
 * - Accommodation preference
 * - Contingency reserve (unspent buffer)
 * 
 * @param {Object} params
 * @returns {Object} Target budget envelopes for each spending category
 */
export function allocateTripBudget({
  totalBudget = null,
  durationDays = 3,
  travelers = 1,
  destination = '',
  currency = 'INR',
  accommodationPreference = 'any',
  hasTransport = false,
} = {}) {
  const budget = Number(totalBudget);
  if (!budget || isNaN(budget) || budget <= 0) {
    return {
      hasBudgetLimit: false,
      accommodationBudget: Infinity,
      foodBudget: Infinity,
      activitiesBudget: Infinity,
      transportBudget: Infinity,
      miscellaneousBudget: Infinity,
      contingencyReserve: 0,
      totalBudget: null,
      maxNightlyRate: Infinity,
      maxDailyFoodPerPerson: Infinity,
      maxDailyMiscPerPerson: Infinity,
    };
  }

  const curr = (currency || 'INR').toUpperCase();
  const isINR = curr === 'INR';
  const travelerCount = Math.max(1, parseInt(travelers, 10) || 1);
  const daysCount = Math.max(1, parseInt(durationDays, 10) || 1);
  const nightsCount = Math.max(1, daysCount - 1);
  const roomsNeeded = Math.max(1, Math.ceil(travelerCount / 2));

  // Contingency reserve: 8% of budget (kept as an unspent reserve, NOT counted as spent)
  const contingencyReserve = Math.round(budget * 0.08);
  const spendableBudget = Math.max(0, budget - contingencyReserve);

  // Default baseline percentage allocations
  let accommodationPct = 0.38;
  let foodPct = 0.25;
  let activitiesPct = 0.22;
  let miscTransitPct = 0.15;

  if (hasTransport) {
    accommodationPct = 0.32;
    foodPct = 0.20;
    activitiesPct = 0.18;
    miscTransitPct = 0.10;
  }

  // Adjust for luxury or budget preferences
  const pref = String(accommodationPreference || '').toLowerCase();
  if (pref.includes('luxury') || pref.includes('resort') || pref.includes('5-star')) {
    accommodationPct += 0.10;
    activitiesPct = Math.max(0.12, activitiesPct - 0.05);
    foodPct = Math.max(0.15, foodPct - 0.05);
  } else if (pref.includes('budget') || pref.includes('hostel') || pref.includes('homestay')) {
    accommodationPct = Math.max(0.20, accommodationPct - 0.10);
    activitiesPct += 0.05;
    miscTransitPct += 0.05;
  }

  // Normalize percentages to sum to exactly 1.0 of spendableBudget
  const totalPct = accommodationPct + foodPct + activitiesPct + miscTransitPct;
  const factor = 1.0 / totalPct;

  const accommodationBudget = Math.round(spendableBudget * accommodationPct * factor);
  const foodBudget = Math.round(spendableBudget * foodPct * factor);
  const activitiesBudget = Math.round(spendableBudget * activitiesPct * factor);
  const miscellaneousBudget = Math.round(spendableBudget * miscTransitPct * factor);

  return {
    hasBudgetLimit: true,
    totalBudget: budget,
    spendableBudget,
    contingencyReserve,
    accommodationBudget,
    foodBudget,
    activitiesBudget,
    miscellaneousBudget,
    maxNightlyRate: Math.max(isINR ? 600 : 15, Math.floor(accommodationBudget / (nightsCount * roomsNeeded))),
    maxDailyFoodPerPerson: Math.max(isINR ? 200 : 5, Math.floor(foodBudget / (daysCount * travelerCount))),
    maxDailyMiscPerPerson: Math.max(isINR ? 50 : 2, Math.floor(miscellaneousBudget / (daysCount * travelerCount))),
    currency: curr,
  };
}

/**
 * Calculates a complete trip financial estimate and budget utilization breakdown.
 * Deterministic application logic only.
 * 
 * @param {Object} params
 * @param {Object|Array} [params.transport=null] - Selected transport option(s)
 * @param {Object|Array} [params.hotels=null] - Selected hotel/accommodation option(s)
 * @param {Array} [params.activities=[]] - Array of selected activities
 * @param {number} [params.travelers=1] - Number of travelers
 * @param {number} [params.nights=3] - Number of stay nights
 * @param {number} [params.budget=null] - User budget limit
 * @param {string} [params.currency='INR'] - Currency code ('INR', 'USD', etc.)
 * @returns {Object} Complete verified budget summary
 */
export function calculateTripEstimate({
  transport = null,
  hotels = null,
  hotel = null,
  selectedHotel = null,
  activities = [],
  travelers = 1,
  nights = null,
  durationDays = null,
  budget = null,
  currency = 'INR',
  foodDailyAllowance = null,
  miscDailyAllowance = null,
} = {}) {
  const travelerCount = Math.max(1, parseInt(travelers, 10) || 1);
  const nightsCount = nights !== null && nights !== undefined
    ? Math.max(1, parseInt(nights, 10) || 1)
    : (durationDays ? Math.max(1, parseInt(durationDays, 10) - 1) : 3);
  const resolvedHotels = hotels || hotel || selectedHotel || null;
  const daysCount = nightsCount + 1;
  const curr = (currency || 'INR').toUpperCase();
  const isINR = curr === 'INR';

  // 1. Calculate Transportation Total (deterministic round-trip calculation)
  let transportTotal = 0;
  if (transport) {
    const transportList = Array.isArray(transport) ? transport : [transport];
    transportTotal = transportList.reduce((sum, t) => {
      if (t.totalRoundTripPrice !== undefined && t.totalRoundTripPrice !== null) {
        return sum + Number(t.totalRoundTripPrice);
      }
      if (t.totalRoundTripCost !== undefined && t.totalRoundTripCost !== null) {
        return sum + Number(t.totalRoundTripCost);
      }
      if (t.totalPrice !== undefined && t.totalPrice !== null) {
        return sum + Number(t.totalPrice) * 2;
      }
      const p = Number(t.pricePerPerson || t.price || 0);
      return sum + p * travelerCount * 2;
    }, 0);
  }

  // 2. Calculate Accommodation Total (stay total for durationNights and needed rooms)
  let accommodationTotal = 0;
  if (resolvedHotels) {
    const hotelList = Array.isArray(resolvedHotels) ? resolvedHotels : [resolvedHotels];
    accommodationTotal = hotelList.reduce((sum, h) => {
      if (h.totalCost !== undefined && h.totalCost !== null) {
        return sum + Number(h.totalCost);
      }
      if (h.totalStayCost !== undefined && h.totalStayCost !== null) {
        return sum + Number(h.totalStayCost);
      }
      const pricePerNight = Number(h.pricePerNight || (h.hotel && h.hotel.pricePerNight) || h.price || 0);
      const rooms = Math.max(1, Math.ceil(travelerCount / 2));
      return sum + pricePerNight * nightsCount * rooms;
    }, 0);
  }

  // 3. Calculate Activities Total (respects per-person vs group-level pricing)
  const activityList = Array.isArray(activities) ? activities : [];
  const activityTotal = activityList.reduce((sum, act) => {
    const cost = Number(act.cost !== undefined ? act.cost : (act.price || 0));
    if (isNaN(cost) || cost <= 0) return sum;
    const isPerPerson = act.pricePerPerson !== false;
    return sum + (isPerPerson ? cost * travelerCount : cost);
  }, 0);

  // 4. Calculate Food Estimate (Standard daily per traveler allowance)
  // Calibrated according to budget tightness:
  // - High budget (>= ₹2,500/traveler/day): ₹600/day
  // - Standard budget (₹1,500–₹2,500/traveler/day): ₹450/day
  // - Economical budget (< ₹1,500/traveler/day): ₹250–₹300/day
  const budgetPerPersonPerDay = budget ? Number(budget) / (travelerCount * daysCount) : 2500;
  let defaultDailyFood = isINR ? 450 : 12;
  if (isINR) {
    if (budgetPerPersonPerDay < 1200) {
      defaultDailyFood = 250;
    } else if (budgetPerPersonPerDay < 2000) {
      defaultDailyFood = 350;
    } else if (budgetPerPersonPerDay > 4000) {
      defaultDailyFood = 600;
    }
  } else {
    if (budgetPerPersonPerDay < 25) {
      defaultDailyFood = 8;
    }
  }

  const dailyFoodAllowance = foodDailyAllowance !== null && foodDailyAllowance !== undefined
    ? Number(foodDailyAllowance)
    : defaultDailyFood;
  const foodEstimate = Math.round(dailyFoodAllowance * daysCount * travelerCount);

  // 5. Calculate Miscellaneous / Local Transit Estimate (Local transit, entry passes, tips)
  let defaultDailyMisc = isINR ? 150 : 4;
  if (isINR && budgetPerPersonPerDay < 1200) {
    defaultDailyMisc = 80;
  }
  const dailyMiscAllowance = miscDailyAllowance !== null && miscDailyAllowance !== undefined
    ? Number(miscDailyAllowance)
    : defaultDailyMisc;
  const miscellaneousEstimate = Math.round(dailyMiscAllowance * daysCount * travelerCount);

  // 6. Aggregate Total Estimated Cost (Actual planned spending)
  // IMPORTANT: Contingency reserve is displayed separately, NOT counted as money already spent.
  const totalEstimatedCost = Math.round(
    transportTotal + accommodationTotal + activityTotal + foodEstimate + miscellaneousEstimate
  );

  // 7. Budget Compliance, Utilization & Contingency Metrics
  const budgetLimit =
    budget !== null && budget !== undefined && !isNaN(Number(budget)) && Number(budget) > 0
      ? Math.round(Number(budget))
    : null;

  const contingencyReserve = budgetLimit !== null ? Math.round(budgetLimit * 0.08) : 0;
  const withinBudget = budgetLimit !== null ? totalEstimatedCost <= budgetLimit : true;
  const remainingBudget = budgetLimit !== null ? budgetLimit - totalEstimatedCost : null;
  const shortfall = budgetLimit !== null && totalEstimatedCost > budgetLimit
    ? totalEstimatedCost - budgetLimit
    : 0;

  const budgetUtilizationPercentage =
    budgetLimit !== null && budgetLimit > 0
      ? parseFloat(((totalEstimatedCost / budgetLimit) * 100).toFixed(1))
      : null;

  const breakdown = {
    transportTotal,
    accommodationTotal,
    activityTotal,
    foodEstimate,
    miscellaneousEstimate,
    contingencyReserve,
    // Preserved for compatibility with GlobeTrotter convention names
    transportation: transportTotal,
    accommodation: accommodationTotal,
    activities: activityTotal,
    food: foodEstimate,
    miscellaneous: miscellaneousEstimate,
  };

  return {
    breakdown,
    transportTotal,
    accommodationTotal,
    activityTotal,
    foodEstimate,
    miscellaneousEstimate,
    contingencyReserve,
    totalEstimatedCost,
    budget: budgetLimit,
    remainingBudget,
    shortfall,
    withinBudget,
    budgetUtilizationPercentage,
    currency: curr,
    days: daysCount,
    nights: nightsCount,
    travelers: travelerCount,
  };
}

export default {
  calculateTripEstimate,
  allocateTripBudget,
};
