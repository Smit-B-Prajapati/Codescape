import Trip from '../models/Trip.js';
import Stop from '../models/Stop.js';
import Activity from '../models/Activity.js';
import Expense from '../models/Expense.js';

const COUNTRY_PHOTOS = {
  switzerland: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80',
  swiss: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80',
  japan: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=1200&q=80',
  tokyo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80',
  kyoto: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
  france: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
  paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
  italy: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
  rome: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
  greece: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80',
  santorini: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80',
  india: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80',
  mumbai: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80',
  goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
  ahmedabad: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=1200&q=80',
  bali: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
  usa: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80',
  uk: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
  london: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
  spain: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=80',
  thailand: 'https://images.unsplash.com/photo-1506665531195-3566fe27652f?auto=format&fit=crop&w=1200&q=80',
  dubai: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
};

export const resolveCountryCoverPhoto = (name = '') => {
  const text = (name || '').toLowerCase();
  for (const key of Object.keys(COUNTRY_PHOTOS)) {
    if (text.includes(key)) return COUNTRY_PHOTOS[key];
  }
  return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80';
};

export const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'INR',
  'JPY',
  'CAD',
  'AUD',
  'CHF',
  'CNY',
  'SGD',
  'AED',
  'THB',
  'NZD',
];

/**
 * Validates budgetLimit. Must be a finite number >= 0.
 * Returns { valid: true, value: number } or { valid: false, message: string }.
 */
export const validateBudgetLimit = (budgetLimit) => {
  if (budgetLimit === undefined || budgetLimit === null) {
    return { valid: true, value: 0 };
  }
  const parsed = Number(budgetLimit);
  if (isNaN(parsed) || !isFinite(parsed) || parsed < 0) {
    return { valid: false, message: 'Budget limit must be a non-negative number' };
  }
  return { valid: true, value: parsed };
};

/**
 * Validates currency string. Must match a supported currency.
 * Returns { valid: true, value: string } or { valid: false, message: string }.
 */
export const validateCurrency = (currency) => {
  if (currency === undefined || currency === null) {
    return { valid: true, value: 'USD' };
  }
  if (typeof currency !== 'string' || !currency.trim()) {
    return { valid: false, message: 'Currency must be a valid supported currency string' };
  }
  const normalized = currency.trim().toUpperCase();
  if (!SUPPORTED_CURRENCIES.includes(normalized)) {
    return {
      valid: false,
      message: `Unsupported currency '${currency}'. Supported currencies: ${SUPPORTED_CURRENCIES.join(', ')}`,
    };
  }
  return { valid: true, value: normalized };
};

/**
 * Validates travelers array. Must be an array of safe traveler identifiers/names.
 * Returns { valid: true, value: string[] } or { valid: false, message: string }.
 */
export const validateTravelers = (travelers) => {
  if (travelers === undefined || travelers === null) {
    return { valid: true, value: [] };
  }
  if (!Array.isArray(travelers)) {
    return { valid: false, message: 'Travelers must be an array' };
  }
  if (travelers.length > 50) {
    return { valid: false, message: 'Travelers list cannot exceed 50 travelers' };
  }
  const sanitized = [];
  for (const t of travelers) {
    if (typeof t === 'string') {
      const trimmed = t.trim();
      if (trimmed.length > 100) {
        return { valid: false, message: 'Traveler name cannot exceed 100 characters' };
      }
      if (trimmed) sanitized.push(trimmed);
    } else if (typeof t === 'number' && Number.isInteger(t) && t > 0) {
      sanitized.push(`Traveler ${t}`);
    } else if (t && typeof t === 'object' && typeof t.name === 'string') {
      const trimmed = t.name.trim();
      if (trimmed.length > 100) {
        return { valid: false, message: 'Traveler name cannot exceed 100 characters' };
      }
      if (trimmed) sanitized.push(trimmed);
    } else {
      return { valid: false, message: 'Each traveler must be a valid string name' };
    }
  }
  return { valid: true, value: sanitized };
};

/**
 * @route   POST /api/trips
 * @desc    Create a new trip for authenticated user
 * @access  Private
 */
export const createTrip = async (req, res) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      coverPhoto,
      isPublic,
      budgetLimit,
      currency,
      travelers,
    } = req.body;

    // 1. Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Trip name is required',
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Both start date and end date are required',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start date or end date format',
      });
    }

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be before start date',
      });
    }

    // BudgetLimit validation (>= 0)
    const budgetRes = validateBudgetLimit(budgetLimit);
    if (!budgetRes.valid) {
      return res.status(400).json({
        success: false,
        message: budgetRes.message,
      });
    }

    // Currency validation (supported currency string)
    const currencyRes = validateCurrency(currency);
    if (!currencyRes.valid) {
      return res.status(400).json({
        success: false,
        message: currencyRes.message,
      });
    }

    // Travelers validation (array of safe traveler items)
    const travelersRes = validateTravelers(travelers);
    if (!travelersRes.valid) {
      return res.status(400).json({
        success: false,
        message: travelersRes.message,
      });
    }

    const defaultCameraCover = 'photo-1488646953014-85cb44e25828';
    const finalCover = (coverPhoto && !coverPhoto.includes(defaultCameraCover))
      ? coverPhoto.trim()
      : resolveCountryCoverPhoto(name);

    // 2. Create Trip with validated fields and backward-compatible defaults
    const trip = await Trip.create({
      user: req.user._id,
      name: name.trim(),
      description: description ? description.trim() : '',
      startDate: start,
      endDate: end,
      budgetLimit: budgetRes.value,
      currency: currencyRes.value,
      travelers: travelersRes.value,
      coverPhoto: finalCover,
      isPublic: isPublic || false,
    });

    res.status(201).json({
      success: true,
      message: 'Trip created successfully',
      trip,
    });
  } catch (error) {
    console.error('[Create Trip Error]:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating trip',
    });
  }
};

/**
 * @route   GET /api/trips
 * @desc    Get all trips for authenticated user
 * @access  Private
 */
export const getTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.user._id })
      .sort({ startDate: 1 })
      .lean();

    // Fetch stops count for each trip
    const tripIds = trips.map((t) => t._id);
    const stops = await Stop.find({ trip: { $in: tripIds } }).lean();

    const enrichedTrips = trips.map((trip) => {
      const tripStops = stops.filter(
        (s) => s.trip.toString() === trip._id.toString()
      );
      return {
        ...trip,
        stopsCount: tripStops.length,
        destinations: tripStops.map((s) => `${s.city}, ${s.country}`),
      };
    });

    res.status(200).json({
      success: true,
      count: enrichedTrips.length,
      trips: enrichedTrips,
    });
  } catch (error) {
    console.error('[Get Trips Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving user trips',
    });
  }
};

/**
 * @route   GET /api/trips/:id
 * @desc    Get single trip details by ID
 * @access  Private
 */
export const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Security check: User must own the trip (unless public)
    if (trip.user.toString() !== req.user._id.toString() && !trip.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this private trip',
      });
    }

    // Fetch associated stops, activities, and expenses
    const stops = await Stop.find({ trip: trip._id }).sort({ order: 1 }).lean();
    const activities = await Activity.find({ trip: trip._id }).sort({ date: 1, time: 1 }).lean();
    const expenses = await Expense.find({ trip: trip._id }).sort({ date: -1 }).lean();

    res.status(200).json({
      success: true,
      trip: {
        ...trip.toObject(),
        stops,
        activities,
        expenses,
      },
    });
  } catch (error) {
    console.error('[Get Trip By ID Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving trip details',
    });
  }
};

/**
 * @route   PUT /api/trips/:id
 * @desc    Update an existing trip
 * @access  Private
 */
export const updateTrip = async (req, res) => {
  try {
    let trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Security check: User must own the trip
    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this trip',
      });
    }

    const {
      name,
      description,
      startDate,
      endDate,
      coverPhoto,
      isPublic,
      budgetLimit,
      currency,
      travelers,
    } = req.body;

    // Validations if dates updated
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        return res.status(400).json({
          success: false,
          message: 'End date cannot be before start date',
        });
      }
    }

    if (budgetLimit !== undefined) {
      const budgetRes = validateBudgetLimit(budgetLimit);
      if (!budgetRes.valid) {
        return res.status(400).json({
          success: false,
          message: budgetRes.message,
        });
      }
      trip.budgetLimit = budgetRes.value;
    }

    if (currency !== undefined) {
      const currencyRes = validateCurrency(currency);
      if (!currencyRes.valid) {
        return res.status(400).json({
          success: false,
          message: currencyRes.message,
        });
      }
      trip.currency = currencyRes.value;
    }

    if (travelers !== undefined) {
      const travelersRes = validateTravelers(travelers);
      if (!travelersRes.valid) {
        return res.status(400).json({
          success: false,
          message: travelersRes.message,
        });
      }
      trip.travelers = travelersRes.value;
    }

    // Update fields
    if (name) trip.name = name.trim();
    if (description !== undefined) trip.description = description.trim();
    if (startDate) trip.startDate = new Date(startDate);
    if (endDate) trip.endDate = new Date(endDate);
    if (coverPhoto !== undefined) trip.coverPhoto = coverPhoto;
    if (isPublic !== undefined) trip.isPublic = isPublic;

    await trip.save();

    res.status(200).json({
      success: true,
      message: 'Trip updated successfully',
      trip,
    });
  } catch (error) {
    console.error('[Update Trip Error]:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating trip',
    });
  }
};

/**
 * @route   DELETE /api/trips/:id
 * @desc    Delete a trip and perform cascade cleanup
 * @access  Private
 */
export const deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Security check: User must own the trip
    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this trip',
      });
    }

    // Cascade delete associated stops, activities, and expenses
    await Stop.deleteMany({ trip: trip._id });
    await Activity.deleteMany({ trip: trip._id });
    await Expense.deleteMany({ trip: trip._id });

    // Delete trip
    await trip.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Trip and all associated data deleted successfully',
      deletedId: req.params.id,
    });
  } catch (error) {
    console.error('[Delete Trip Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error deleting trip',
    });
  }
};
