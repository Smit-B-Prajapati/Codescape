import mongoose from 'mongoose';
import { User, Trip, Stop, Activity, Expense } from '../models/index.js';

/**
 * Diagnostic utility script to verify schema registration and validation rules.
 */
export async function validateSchemas() {
  console.log('--- Mongoose Schema Integrity Audit ---');
  console.log('✓ User Model loaded:', User.modelName);
  console.log('✓ Trip Model loaded:', Trip.modelName);
  console.log('✓ Stop Model loaded:', Stop.modelName);
  console.log('✓ Activity Model loaded:', Activity.modelName);
  console.log('✓ Expense Model loaded:', Expense.modelName);

  // Validate Enum rules
  const expenseCategories = Expense.schema.path('category').enumValues;
  console.log('✓ Expense Categories Supported:', expenseCategories.join(', '));

  const activityCategories = Activity.schema.path('category').enumValues;
  console.log('✓ Activity Categories Supported:', activityCategories.join(', '));

  console.log('--- All 5 Schemas Successfully Compiled ---');
  return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateSchemas();
}
