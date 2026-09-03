import Trip from '../models/Trip.js';
import Stop from '../models/Stop.js';
import Activity from '../models/Activity.js';

/**
 * @route   GET /api/trips/:tripId/itinerary
 * @desc    Generate full day-by-day itinerary dynamically from trip, stops, and activities
 * @access  Private
 */
export const getItinerary = async (req, res) => {
  try {
    const { tripId } = req.params;

    // 1. Fetch trip and verify ownership
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    if (trip.user.toString() !== req.user._id.toString() && !trip.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this private itinerary',
      });
    }

    // 2. Fetch stops ordered sequentially
    const stops = await Stop.find({ trip: trip._id }).sort({ order: 1 }).lean();

    // 3. Fetch activities ordered by date and time
    const activities = await Activity.find({ trip: trip._id }).sort({ date: 1, time: 1 }).lean();

    // 4. Calculate day-by-day breakdown from trip startDate to endDate
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);

    const days = [];
    let currentDate = new Date(startDate);
    let dayIndex = 1;

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];

      // Find matching stop for current date
      const matchingStop = stops.find((s) => {
        const sStart = new Date(s.startDate);
        const sEnd = new Date(s.endDate);
        return currentDate >= sStart && currentDate <= sEnd;
      }) || stops[0] || null;

      // Find matching activities for current date
      const dayActivities = activities.filter((a) => {
        const aDate = new Date(a.date).toISOString().split('T')[0];
        return aDate === dateStr;
      });

      days.push({
        dayNumber: dayIndex,
        date: dateStr,
        stop: matchingStop ? { _id: matchingStop._id, city: matchingStop.city, country: matchingStop.country } : null,
        activities: dayActivities,
        totalCost: dayActivities.reduce((sum, act) => sum + (act.cost || 0), 0),
      });

      // Increment date by 1 day
      currentDate.setDate(currentDate.getDate() + 1);
      dayIndex++;
    }

    // Total itinerary budget calculation
    const totalItineraryCost = activities.reduce((sum, act) => sum + (act.cost || 0), 0);

    res.status(200).json({
      success: true,
      trip: {
        _id: trip._id,
        name: trip.name,
        description: trip.description,
        startDate: trip.startDate,
        endDate: trip.endDate,
        coverPhoto: trip.coverPhoto,
        isPublic: trip.isPublic,
      },
      stops,
      totalItineraryCost,
      days,
    });
  } catch (error) {
    console.error('[Get Itinerary Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error generating itinerary',
    });
  }
};

/**
 * @route   PUT /api/trips/:tripId/activities/:activityId
 * @desc    Edit an activity details, date, time, duration, cost, or category
 * @access  Private
 */
export const updateActivity = async (req, res) => {
  try {
    const { tripId, activityId } = req.params;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this activity' });
    }

    let activity = await Activity.findOne({ _id: activityId, trip: tripId });
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    const { name, description, category, date, time, duration, cost, stopId } = req.body;

    if (name) activity.name = name.trim();
    if (description !== undefined) activity.description = description.trim();
    if (category) activity.category = category;
    if (date) activity.date = new Date(date);
    if (time) activity.time = time;
    if (duration !== undefined) activity.duration = Number(duration);
    if (cost !== undefined) activity.cost = Number(cost);
    if (stopId) activity.stop = stopId;

    await activity.save();

    res.status(200).json({
      success: true,
      message: 'Activity updated successfully',
      activity,
    });
  } catch (error) {
    console.error('[Update Activity Error]:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating activity',
    });
  }
};
