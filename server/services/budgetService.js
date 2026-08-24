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
 * @returns {{
 *   breakdown: {
 *     transportTotal: number,
 *     accommodationTotal: number,
 *     activityTotal: number,
 *     foodEstimate: number,
 *     miscellaneousEstimate: number,
 *     transportation: number,
 *     accommodation: number,
 *     activities: number,
 *     food: number,
 *     miscellaneous: number
 *   },
 *   transportTotal: number,
 *   accommodationTotal: number,
 *   activityTotal: number,
 *   foodEstimate: number,
 *   miscellaneousEstimate: number,
 *   totalEstimatedCost: number,
 *   budget: number|null,
 *   remainingBudget: number|null,
 *   withinBudget: boolean,
 *   budgetUtilizationPercentage: number|null,
 *   currency: string,
 *   days: number,
 *   nights: number,
 *   travelers: number
 * }}
 */
export function calculateTripEstimate({
  transport = null,
  hotels = null,
  activities = [],
  travelers = 1,
  nights = 3,
  budget = null,
  currency = 'INR',
} = {}) {
  const travelerCount = Math.max(1, parseInt(travelers, 10) || 1);
  const nightsCount = Math.max(1, parseInt(nights, 10) || 1);
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
        // One-way specified in demo dataset -> assume round-trip return
        return sum + Number(t.totalPrice) * 2;
      }
      const p = Number(t.pricePerPerson || t.price || 0);
      return sum + p * travelerCount * 2;
    }, 0);
  }

  // 2. Calculate Accommodation Total
  let accommodationTotal = 0;
  if (hotels) {
    const hotelList = Array.isArray(hotels) ? hotels : [hotels];
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

  // 3. Calculate Activities Total
  const activityList = Array.isArray(activities) ? activities : [];
  const activityTotal = activityList.reduce((sum, act) => {
    const costPerPerson = Number(act.cost || 0);
    return sum + costPerPerson * travelerCount;
  }, 0);

  // 4. Calculate Food Estimate (Standard daily per traveler allowance)
  // INR: ₹500/day/traveler, USD: $12/day/traveler
  const dailyFoodAllowance = isINR ? 500 : Math.round(500 / USD_TO_INR_RATE);
  const foodEstimate = dailyFoodAllowance * daysCount * travelerCount;

  // 5. Calculate Miscellaneous / Local Transit Estimate (Local transport, entry passes, tips)
  // INR: ₹200/day/traveler, USD: $5/day/traveler
  const dailyMiscAllowance = isINR ? 200 : Math.round(200 / USD_TO_INR_RATE);
  const miscellaneousEstimate = dailyMiscAllowance * daysCount * travelerCount;

  // 6. Aggregate Total Estimated Cost
  const totalEstimatedCost = Math.round(
    transportTotal + accommodationTotal + activityTotal + foodEstimate + miscellaneousEstimate
  );

  // 7. Budget Compliance & Utilization Metrics
  const budgetLimit =
    budget !== null && budget !== undefined && !isNaN(Number(budget)) && Number(budget) > 0
      ? Math.round(Number(budget))
      : null;

  const withinBudget = budgetLimit !== null ? totalEstimatedCost <= budgetLimit : true;
  const remainingBudget = budgetLimit !== null ? budgetLimit - totalEstimatedCost : null;
  const budgetUtilizationPercentage =
    budgetLimit !== null
      ? parseFloat(((totalEstimatedCost / budgetLimit) * 100).toFixed(1))
      : null;

  const breakdown = {
    transportTotal,
    accommodationTotal,
    activityTotal,
    foodEstimate,
    miscellaneousEstimate,
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
    totalEstimatedCost,
    budget: budgetLimit,
    remainingBudget,
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
};
