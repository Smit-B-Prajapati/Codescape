import mongoose from 'mongoose';

/**
 * Expense Schema
 * Represents financial expenses recorded against a trip.
 * Supports categories: Transportation, Accommodation, Food, Activities, Other.
 */
const expenseSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Expense must belong to a trip'],
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Please specify an expense category'],
      enum: {
        values: ['Transportation', 'Accommodation', 'Food', 'Activities', 'Other'],
        message: '{VALUE} is not a supported expense category',
      },
      default: 'Other',
    },
    amount: {
      type: Number,
      required: [true, 'Please specify the expense amount'],
      min: [0, 'Expense amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'USD',
    },
    originalAmount: {
      type: Number,
    },
    paidBy: {
      type: String,
      default: 'You',
    },
    splitAmong: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: Date,
      required: [true, 'Please specify the date of expense'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for budget aggregation and category reporting
expenseSchema.index({ trip: 1, category: 1 });
expenseSchema.index({ trip: 1, date: -1 });

const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
export default Expense;
