import mongoose from 'mongoose';

/**
 * Booking Schema
 * Represents simulated/demo bookings for transport, hotel, or packages.
 * Strictly labeled as isDemo: true.
 */
const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must belong to a user'],
      index: true,
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Booking must be associated with a trip'],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ['transport', 'hotel', 'package'],
        message: 'Booking type must be transport, hotel, or package',
      },
      required: [true, 'Booking type is required'],
    },
    provider: {
      type: String,
      required: [true, 'Booking provider is required'],
      trim: true,
    },
    referenceId: {
      type: String,
      required: [true, 'Reference ID is required'],
      trim: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    amount: {
      type: Number,
      required: [true, 'Booking amount is required'],
      min: [0, 'Booking amount cannot be negative'],
      validate: {
        validator: (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0,
        message: 'Booking amount must be a finite, non-negative number',
      },
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'cancelled', 'failed'],
        message: 'Status must be pending, confirmed, cancelled, or failed',
      },
      default: 'pending',
      index: true,
    },
    isDemo: {
      type: Boolean,
      default: true,
      required: true,
    },
    bookingReference: {
      type: String,
      required: [true, 'Booking reference is required'],
      unique: true,
      index: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for rapid lookup and duplicate prevention
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ trip: 1, type: 1, referenceId: 1, status: 1 });

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
export default Booking;
