import mongoose from 'mongoose';

/**
 * Trip Schema
 * Represents multi-city trips created by users.
 */
const tripSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Trip must belong to a user'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a trip name'],
      trim: true,
      maxlength: [100, 'Trip name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide a trip start date'],
    },
    endDate: {
      type: Date,
      required: [true, 'Please provide a trip end date'],
    },
    budgetLimit: {
      type: Number,
      default: 0,
      min: [0, 'Budget limit cannot be negative'],
    },
    currency: {
      type: String,
      default: 'USD',
    },
    travelers: {
      type: [String],
      default: [],
    },
    coverPhoto: {
      type: String,
      default: '',
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    publicSlug: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

tripSchema.index({ user: 1, startDate: -1 });

const Trip = mongoose.models.Trip || mongoose.model('Trip', tripSchema);
export default Trip;
