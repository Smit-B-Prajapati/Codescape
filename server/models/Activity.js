import mongoose from 'mongoose';

/**
 * Activity Schema
 * Represents planned activities assigned to specific trip days and stops.
 */
const activitySchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Activity must belong to a trip'],
      index: true,
    },
    stop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stop',
      required: [true, 'Activity must belong to a stop'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide an activity name'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      enum: [
        'Sightseeing',
        'Food',
        'Food & Dining',
        'Dining',
        'Nature',
        'Adventure',
        'Shopping',
        'Cultural',
        'Culture',
        'Relaxation',
        'Transportation',
        'Arts',
        'Nightlife',
        'Historical',
        'Other',
      ],
      default: 'Sightseeing',
    },
    date: {
      type: Date,
      required: [true, 'Please specify the date for this activity'],
    },
    time: {
      type: String,
      default: '09:00',
    },
    duration: {
      type: Number, // Duration in minutes
      default: 60,
      min: [0, 'Duration cannot be negative'],
    },
    cost: {
      type: Number,
      default: 0,
      min: [0, 'Cost cannot be negative'],
    },
    image: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for retrieving day-by-day activity timelines efficiently
activitySchema.index({ trip: 1, date: 1, time: 1 });
activitySchema.index({ stop: 1, date: 1 });

const Activity = mongoose.models.Activity || mongoose.model('Activity', activitySchema);
export default Activity;
