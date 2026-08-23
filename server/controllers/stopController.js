import Stop from '../models/Stop.js';
import Trip from '../models/Trip.js';
import Activity from '../models/Activity.js';

/**
 * Helper to verify trip ownership for authenticated user
 */
const checkTripOwnership = async (tripId, userId) => {
  const trip = await Trip.findById(tripId);
  if (!trip) return { error: 'Trip not found', status: 404 };
  if (trip.user.toString() !== userId.toString()) {
    return { error: 'Not authorized to modify stops for this trip', status: 403 };
  }
  return { trip };
};

/**
 * @route   POST /api/trips/:tripId/stops
 * @desc    Add a destination stop to a trip
 * @access  Private
 */
export const addStop = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { city, country, startDate, endDate, order } = req.body;

    // 1. Ownership check
    const { error, status, trip } = await checkTripOwnership(tripId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    // 2. Validation
    if (!city || !city.trim() || !country || !country.trim()) {
      return res.status(400).json({
        success: false,
        message: 'City and country are required for a travel stop',
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Both arrival (start) and departure (end) dates are required',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'Departure date cannot be before arrival date',
      });
    }

    // 3. Compute sequential order if not provided
    let stopOrder = order;
    if (stopOrder === undefined || stopOrder === null) {
      const existingStopsCount = await Stop.countDocuments({ trip: tripId });
      stopOrder = existingStopsCount + 1;
    }

    // 4. Create stop
    const stop = await Stop.create({
      trip: tripId,
      city: city.trim(),
      country: country.trim(),
      startDate: start,
      endDate: end,
      order: stopOrder,
    });

    res.status(201).json({
      success: true,
      message: 'Destination stop added to trip successfully',
      stop,
    });
  } catch (error) {
    console.error('[Add Stop Error]:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error adding stop',
    });
  }
};

/**
 * @route   GET /api/trips/:tripId/stops
 * @desc    Get all stops for a trip ordered by order index
 * @access  Private
 */
export const getStopsByTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    const { error, status } = await checkTripOwnership(tripId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    const stops = await Stop.find({ trip: tripId }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      count: stops.length,
      stops,
    });
  } catch (error) {
    console.error('[Get Stops Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving stops',
    });
  }
};

/**
 * @route   PUT /api/trips/:tripId/stops/:stopId
 * @desc    Update stop details or dates
 * @access  Private
 */
export const updateStop = async (req, res) => {
  try {
    const { tripId, stopId } = req.params;

    const { error, status } = await checkTripOwnership(tripId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    let stop = await Stop.findOne({ _id: stopId, trip: tripId });
    if (!stop) {
      return res.status(404).json({
        success: false,
        message: 'Destination stop not found',
      });
    }

    const { city, country, startDate, endDate, order } = req.body;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        return res.status(400).json({
          success: false,
          message: 'Departure date cannot be before arrival date',
        });
      }
      stop.startDate = start;
      stop.endDate = end;
    }

    if (city) stop.city = city.trim();
    if (country) stop.country = country.trim();
    if (order !== undefined) stop.order = order;

    await stop.save();

    res.status(200).json({
      success: true,
      message: 'Stop details updated successfully',
      stop,
    });
  } catch (error) {
    console.error('[Update Stop Error]:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating stop',
    });
  }
};

/**
 * @route   DELETE /api/trips/:tripId/stops/:stopId
 * @desc    Delete a stop and cascade delete associated activities
 * @access  Private
 */
export const deleteStop = async (req, res) => {
  try {
    const { tripId, stopId } = req.params;

    const { error, status } = await checkTripOwnership(tripId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    const stop = await Stop.findOne({ _id: stopId, trip: tripId });
    if (!stop) {
      return res.status(404).json({
        success: false,
        message: 'Destination stop not found',
      });
    }

    // Cascade delete activities attached to this stop
    await Activity.deleteMany({ stop: stop._id });

    await stop.deleteOne();

    // Re-index remaining stops order
    const remainingStops = await Stop.find({ trip: tripId }).sort({ order: 1 });
    for (let i = 0; i < remainingStops.length; i++) {
      remainingStops[i].order = i + 1;
      await remainingStops[i].save();
    }

    res.status(200).json({
      success: true,
      message: 'Destination stop deleted successfully',
      deletedId: stopId,
    });
  } catch (error) {
    console.error('[Delete Stop Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error deleting stop',
    });
  }
};

/**
 * @route   PUT /api/trips/:tripId/stops/reorder
 * @desc    Reorder stops sequence (Move Up / Move Down controls)
 * @access  Private
 */
export const reorderStops = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { stopOrders } = req.body; // Array of { stopId, order }

    const { error, status } = await checkTripOwnership(tripId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    if (!Array.isArray(stopOrders)) {
      return res.status(400).json({
        success: false,
        message: 'stopOrders must be an array of { stopId, order }',
      });
    }

    // Update each stop order
    const updatePromises = stopOrders.map((item) =>
      Stop.updateOne(
        { _id: item.stopId, trip: tripId },
        { $set: { order: item.order } }
      )
    );

    await Promise.all(updatePromises);

    const updatedStops = await Stop.find({ trip: tripId }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      message: 'Stops reordered successfully',
      stops: updatedStops,
    });
  } catch (error) {
    console.error('[Reorder Stops Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error reordering stops',
    });
  }
};
