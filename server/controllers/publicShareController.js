import crypto from 'crypto';
import mongoose from 'mongoose';
import Trip from '../models/Trip.js';
import Stop from '../models/Stop.js';
import Activity from '../models/Activity.js';
import Expense from '../models/Expense.js';

/**
 * Generate a unique, unpredictable public slug for a trip
 */
const generateSlug = (tripName) => {
  const cleanName = tripName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 30);
  const randomHash = crypto.randomBytes(4).toString('hex');
  return `${cleanName}-${randomHash}`;
};

/**
 * @route   PUT /api/trips/:id/share
 * @desc    Toggle trip privacy (Public/Private) and generate public slug
 * @access  Private (Owner only)
 */
export const toggleTripShare = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublic } = req.body;

    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to share this trip' });
    }

    trip.isPublic = Boolean(isPublic);

    if (trip.isPublic && !trip.publicSlug) {
      trip.publicSlug = generateSlug(trip.name);
    }

    await trip.save();

    res.status(200).json({
      success: true,
      message: `Trip is now ${trip.isPublic ? 'Public' : 'Private'}`,
      isPublic: trip.isPublic,
      publicSlug: trip.publicSlug,
    });
  } catch (error) {
    console.error('[Toggle Trip Share Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error updating trip sharing settings',
    });
  }
};

/**
 * @route   GET /api/trips/public/:slug
 * @desc    Get public read-only trip details & itinerary (No Auth Required)
 * @access  Public
 */
export const getPublicTripBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    let trip = await Trip.findOne({ publicSlug: slug, isPublic: true }).populate('user', 'name profilePhoto');
    
    if (!trip && mongoose.Types.ObjectId.isValid(slug)) {
      trip = await Trip.findOne({ _id: slug, isPublic: true }).populate('user', 'name profilePhoto');
    }

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Public trip itinerary not found or is set to private',
      });
    }

    // Fetch Stops and Activities
    const stops = await Stop.find({ trip: trip._id }).sort({ order: 1 }).lean();
    const activities = await Activity.find({ trip: trip._id }).sort({ date: 1, time: 1 }).lean();

    // Group activities into day-by-day breakdown
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);

    const days = [];
    let currentDate = new Date(startDate);
    let dayIndex = 1;

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];

      const matchingStop = stops.find((s) => {
        const sStart = new Date(s.startDate);
        const sEnd = new Date(s.endDate);
        return currentDate >= sStart && currentDate <= sEnd;
      }) || stops[0] || null;

      const dayActivities = activities.filter((a) => {
        const aDate = new Date(a.date).toISOString().split('T')[0];
        return aDate === dateStr;
      });

      days.push({
        dayNumber: dayIndex,
        date: dateStr,
        stop: matchingStop ? { city: matchingStop.city, country: matchingStop.country } : null,
        activities: dayActivities,
        totalCost: dayActivities.reduce((sum, act) => sum + (act.cost || 0), 0),
      });

      currentDate.setDate(currentDate.getDate() + 1);
      dayIndex++;
    }

    const totalEstimatedCost = activities.reduce((sum, act) => sum + (act.cost || 0), 0);

    res.status(200).json({
      success: true,
      trip: {
        _id: trip._id,
        name: trip.name,
        description: trip.description,
        startDate: trip.startDate,
        endDate: trip.endDate,
        coverPhoto: trip.coverPhoto,
        publicSlug: trip.publicSlug,
        ownerName: trip.user?.name || 'Traveler',
      },
      stops,
      totalEstimatedCost,
      days,
    });
  } catch (error) {
    console.error('[Get Public Trip Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving public trip',
    });
  }
};

/**
 * @route   POST /api/trips/public/:slug/copy
 * @desc    Clone a public trip itinerary to authenticated user's account
 * @access  Private
 */
export const copyPublicTrip = async (req, res) => {
  try {
    const { slug } = req.params;

    // 1. Find public source trip
    const sourceTrip = await Trip.findOne({ publicSlug: slug, isPublic: true });
    if (!sourceTrip) {
      return res.status(404).json({
        success: false,
        message: 'Public trip itinerary not found or is set to private',
      });
    }

    // 2. Clone Trip for current user
    const newTrip = await Trip.create({
      user: req.user._id,
      name: `${sourceTrip.name} (Copy)`,
      description: sourceTrip.description,
      startDate: sourceTrip.startDate,
      endDate: sourceTrip.endDate,
      coverPhoto: sourceTrip.coverPhoto,
      isPublic: false,
    });

    // 3. Clone Stops
    const sourceStops = await Stop.find({ trip: sourceTrip._id }).sort({ order: 1 });
    const stopMap = new Map(); // Maps old stop ID -> new stop ID

    for (const stop of sourceStops) {
      const newStop = await Stop.create({
        trip: newTrip._id,
        city: stop.city,
        country: stop.country,
        startDate: stop.startDate,
        endDate: stop.endDate,
        order: stop.order,
      });
      stopMap.set(stop._id.toString(), newStop._id);
    }

    // 4. Clone Activities
    const sourceActivities = await Activity.find({ trip: sourceTrip._id });
    for (const act of sourceActivities) {
      const newStopId = stopMap.get(act.stop?.toString()) || Array.from(stopMap.values())[0];
      if (newStopId) {
        await Activity.create({
          trip: newTrip._id,
          stop: newStopId,
          name: act.name,
          description: act.description,
          category: act.category,
          date: act.date,
          time: act.time,
          duration: act.duration,
          cost: act.cost,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Trip itinerary copied successfully to your account',
      newTripId: newTrip._id,
    });
  } catch (error) {
    console.error('[Copy Public Trip Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error copying public trip',
    });
  }
};
