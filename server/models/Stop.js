import mongoose from 'mongoose';

/**
 * Stop Schema
 * Represents intermediate destination stops within a multi-city trip.
 */
const stopSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Stop must belong to a trip'],
      index: true,
    },
    city: {
      type: String,
      required: [true, 'Please specify the stop city'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Please specify the stop country'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Please specify the arrival date for this stop'],
    },
    endDate: {
      type: Date,
      required: [true, 'Please specify the departure date for this stop'],
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for sorting stops sequentially within a trip
stopSchema.index({ trip: 1, order: 1 });

const Stop = mongoose.models.Stop || mongoose.model('Stop', stopSchema);
export default Stop;
