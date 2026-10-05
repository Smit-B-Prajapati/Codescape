import mongoose from 'mongoose';

/**
 * Payment Schema
 * Represents simulated/demo test payments for bookings.
 * Strictly testMode: true. Never stores real payment credentials.
 */
const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Payment must belong to a user'],
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Payment must be associated with a booking'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Payment amount cannot be negative'],
      validate: {
        validator: (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0,
        message: 'Payment amount must be a finite, non-negative number',
      },
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
      uppercase: true,
    },
    provider: {
      type: String,
      default: 'Razorpay Standard Checkout (Test Mode)',
      trim: true,
    },
    orderId: {
      type: String,
      index: true,
      trim: true,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
      default: null,
    },
    signature: {
      type: String,
      trim: true,
      default: null,
    },
    receipt: {
      type: String,
      trim: true,
      default: null,
    },
    amountPaise: {
      type: Number,
      default: null,
    },
    transactionId: {
      type: String,
      index: true,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['created', 'authorized', 'captured', 'success', 'failed'],
        message: 'Status must be created, authorized, captured, success, or failed',
      },
      default: 'created',
      index: true,
    },
    testMode: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ booking: 1, status: 1 });

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
export default Payment;
