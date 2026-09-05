import Trip from '../models/Trip.js';
import Stop from '../models/Stop.js';
import Expense from '../models/Expense.js';
import Activity from '../models/Activity.js';

/**
 * Static/Curated recommended destinations for discovery card structure
 */
const RECOMMENDED_DESTINATIONS = [
  {
    id: 'rec_paris',
    city: 'Paris',
    country: 'France',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    description: 'City of light, art, cuisine, and romantic Eiffel Tower views.',
    category: 'Cultural & Romantic',
    avgCostPerDay: '$180/day',
  },
  {
    id: 'rec_kyoto',
    city: 'Kyoto',
    country: 'Japan',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
    description: 'Ancient bamboo groves, classical Buddhist temples, and zen gardens.',
    category: 'Historical & Nature',
    avgCostPerDay: '$140/day',
  },
  {
    id: 'rec_santorini',
    city: 'Santorini',
    country: 'Greece',
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
    description: 'Iconic white cliffside villages with cobalt Aegean sea panoramas.',
    category: 'Island & Coastal',
    avgCostPerDay: '$210/day',
  },
  {
    id: 'rec_bali',
    city: 'Bali',
    country: 'Indonesia',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
    description: 'Lush terraced rice fields, sacred temples, and tropical beach resorts.',
    category: 'Adventure & Tropical',
    avgCostPerDay: '$95/day',
  },
];

/**
 * @route   GET /api/dashboard
 * @desc    Get dashboard metrics, recent user trips, budget highlights, and recommendations
 * @access  Private
 */
export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Retrieve user's actual trips from MongoDB
    const trips = await Trip.find({ user: userId })
      .sort({ startDate: 1 })
      .lean();

    // 2. Fetch associated stops for each trip
    const tripIds = trips.map((t) => t._id);
    const stops = await Stop.find({ trip: { $in: tripIds } }).lean();

    // Attach stops to their respective trips
    const tripsWithStops = trips.map((trip) => {
      const tripStops = stops.filter(
        (s) => s.trip.toString() === trip._id.toString()
      );
      return {
        ...trip,
        stopsCount: tripStops.length,
        destinations: tripStops.map((s) => `${s.city}, ${s.country}`),
      };
    });

    // 3. Compute Total Recorded Expenses (Manual Expenses + Activity Costs)
    const expenseAggregate = await Expense.aggregate([
      { $match: { trip: { $in: tripIds } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const activityAggregate = await Activity.aggregate([
      { $match: { trip: { $in: tripIds } } },
      { $group: { _id: null, total: { $sum: '$cost' } } },
    ]);

    const manualExpensesTotal = expenseAggregate[0]?.total || 0;
    const activitiesCostTotal = activityAggregate[0]?.total || 0;
    const totalSpent = manualExpensesTotal + activitiesCostTotal;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingTripsCount = trips.filter((t) => {
      const end = t.endDate ? new Date(t.endDate) : new Date(t.startDate);
      return end >= today;
    }).length;

    res.status(200).json({
      success: true,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
      stats: {
        totalTrips: trips.length,
        upcomingTrips: upcomingTripsCount,
        totalSpent,
      },
      recentTrips: tripsWithStops,
      recommendedDestinations: RECOMMENDED_DESTINATIONS,
    });
  } catch (error) {
    console.error('[Dashboard Controller Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error loading dashboard data',
    });
  }
};
