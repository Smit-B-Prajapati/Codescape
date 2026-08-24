import mongoose from 'mongoose';
import Trip from '../models/Trip.js';
import Expense from '../models/Expense.js';
import Activity from '../models/Activity.js';

const RATES_TO_USD = {
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.27,
  JPY: 0.0065,
  INR: 0.012,
  CAD: 0.74,
  AUD: 0.65,
};

/**
 * Helper to check trip ownership
 */
const checkTripOwnership = async (tripId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    return { error: 'Invalid trip ID format', status: 400 };
  }
  const trip = await Trip.findById(tripId);
  if (!trip) return { error: 'Trip not found', status: 404 };
  if (trip.user.toString() !== userId.toString()) {
    return { error: 'Not authorized to access budget data for this trip', status: 403 };
  }
  return { trip };
};

/**
 * @route   GET /api/trips/:tripId/budget
 * @desc    Get complete budget metrics, category breakdown, group expense splitter, and expense list
 * @access  Private
 */
export const getBudgetSummary = async (req, res) => {
  try {
    const { tripId } = req.params;

    const { error, status, trip } = await checkTripOwnership(tripId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    // 1. Calculate number of trip days
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate || trip.startDate);
    const diffTime = Math.abs(end - start);
    const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    // 2. Fetch recorded expenses
    const expenses = await Expense.find({ trip: tripId }).sort({ date: -1 });

    // 3. Fetch scheduled activities to integrate activity costs
    const activities = await Activity.find({ trip: tripId });
    const totalActivitiesCost = activities.reduce((sum, act) => sum + (act.cost || 0), 0);

    // 4. Calculate Category Totals
    const categories = {
      Transportation: 0,
      Accommodation: 0,
      Food: 0,
      Activities: totalActivitiesCost,
      Other: 0,
    };

    expenses.forEach((exp) => {
      const cat = exp.category;
      if (categories[cat] !== undefined) {
        categories[cat] += Number(exp.amount || 0);
      } else {
        categories['Other'] += Number(exp.amount || 0);
      }
    });

    // 5. Total Trip Cost & Average Daily Cost
    const totalCost = Object.values(categories).reduce((sum, val) => sum + val, 0);
    const averageCostPerDay = parseFloat((totalCost / totalDays).toFixed(2));

    // 6. Budget Alert Check
    const budgetLimit = trip.budgetLimit || 0;
    const isOverBudget = budgetLimit > 0 && totalCost > budgetLimit;
    const remainingBudget = budgetLimit > 0 ? budgetLimit - totalCost : null;

    // 7. Group Expense Settlement Engine ("Who Owes Whom")
    const defaultTravelers = (trip.travelers && trip.travelers.length > 0)
      ? trip.travelers
      : ['You'];

    const travelerPaid = {};
    const travelerShare = {};

    defaultTravelers.forEach((t) => {
      travelerPaid[t] = 0;
      travelerShare[t] = 0;
    });

    expenses.forEach((exp) => {
      const payer = exp.paidBy || 'You';
      const splits = (exp.splitAmong && exp.splitAmong.length > 0) ? exp.splitAmong : [payer];
      const costInUSD = exp.amount;

      if (travelerPaid[payer] === undefined) travelerPaid[payer] = 0;
      travelerPaid[payer] += costInUSD;

      const sharePerPerson = costInUSD / splits.length;
      splits.forEach((person) => {
        if (travelerShare[person] === undefined) travelerShare[person] = 0;
        travelerShare[person] += sharePerPerson;
      });
    });

    const groupBalances = [];
    const debtors = [];
    const creditors = [];

    const allPeople = Array.from(new Set([...Object.keys(travelerPaid), ...Object.keys(travelerShare)]));
    allPeople.forEach((person) => {
      const paid = travelerPaid[person] || 0;
      const share = travelerShare[person] || 0;
      const net = paid - share;
      groupBalances.push({
        person,
        totalPaid: parseFloat(paid.toFixed(2)),
        totalShare: parseFloat(share.toFixed(2)),
        netBalance: parseFloat(net.toFixed(2)),
      });

      if (net < -0.01) debtors.push({ person, owes: -net });
      if (net > 0.01) creditors.push({ person, gets: net });
    });

    const settlements = [];
    let dIdx = 0;
    let cIdx = 0;
    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];
      const amount = Math.min(debtor.owes, creditor.gets);

      settlements.push({
        from: debtor.person,
        to: creditor.person,
        amount: parseFloat(amount.toFixed(2)),
      });

      debtor.owes -= amount;
      creditor.gets -= amount;

      if (debtor.owes <= 0.01) dIdx++;
      if (creditor.gets <= 0.01) cIdx++;
    }

    res.status(200).json({
      success: true,
      trip: {
        _id: trip._id,
        name: trip.name,
        startDate: trip.startDate,
        endDate: trip.endDate,
        budgetLimit,
        travelers: defaultTravelers,
      },
      metrics: {
        totalCost,
        totalDays,
        averageCostPerDay,
        budgetLimit,
        isOverBudget,
        remainingBudget,
        exceededAmount: isOverBudget ? totalCost - budgetLimit : 0,
      },
      categories,
      groupSplitter: {
        travelers: defaultTravelers,
        groupBalances,
        settlements,
      },
      expenses,
    });
  } catch (error) {
    console.error('[Get Budget Summary Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error calculating budget summary',
    });
  }
};

/**
 * @route   POST /api/trips/:tripId/expenses
 * @desc    Add a new expense item to trip with multi-currency support and splitting
 * @access  Private
 */
export const addExpense = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { category, amount, description, date, currency = 'USD', paidBy = 'You', splitAmong = [] } = req.body;

    const { error, status } = await checkTripOwnership(tripId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    if (!category || amount === undefined || amount === null || !date) {
      return res.status(400).json({
        success: false,
        message: 'Category, amount, and date are required',
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Expense amount must be greater than 0',
      });
    }

    const expenseDate = new Date(date);
    if (isNaN(expenseDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense date format',
      });
    }

    const rate = RATES_TO_USD[currency] || 1.0;
    const amountInUSD = Number(amount) * rate;

    const expense = await Expense.create({
      trip: tripId,
      category,
      amount: amountInUSD,
      originalAmount: Number(amount),
      currency,
      paidBy: paidBy || 'You',
      splitAmong: splitAmong.length > 0 ? splitAmong : [paidBy || 'You'],
      description: description ? description.trim() : '',
      date: expenseDate,
    });

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      expense,
    });
  } catch (error) {
    console.error('[Add Expense Error]:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error adding expense',
    });
  }
};

/**
 * @route   PUT /api/trips/:tripId/expenses/:expenseId
 * @desc    Update an existing expense item
 * @access  Private
 */
export const updateExpense = async (req, res) => {
  try {
    const { tripId, expenseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      return res.status(400).json({ success: false, message: 'Invalid expense ID format' });
    }

    const { error, status } = await checkTripOwnership(tripId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    let expense = await Expense.findOne({ _id: expenseId, trip: tripId });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense record not found' });
    }

    const { category, amount, description, date, currency, paidBy, splitAmong } = req.body;

    if (category) expense.category = category;
    if (currency) expense.currency = currency;
    if (paidBy) expense.paidBy = paidBy;
    if (splitAmong && Array.isArray(splitAmong)) expense.splitAmong = splitAmong;

    if (amount !== undefined) {
      const curr = currency || expense.currency || 'USD';
      const rate = RATES_TO_USD[curr] || 1.0;
      expense.originalAmount = Number(amount);
      expense.amount = Number(amount) * rate;
    }

    if (description !== undefined) expense.description = description.trim();
    if (date) {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        expense.date = parsedDate;
      }
    }

    await expense.save();

    res.status(200).json({
      success: true,
      message: 'Expense record updated successfully',
      expense,
    });
  } catch (error) {
    console.error('[Update Expense Error]:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating expense',
    });
  }
};

/**
 * @route   DELETE /api/trips/:tripId/expenses/:expenseId
 * @desc    Delete an expense item
 * @access  Private
 */
export const deleteExpense = async (req, res) => {
  try {
    const { tripId, expenseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      return res.status(400).json({ success: false, message: 'Invalid expense ID format' });
    }

    const { error, status } = await checkTripOwnership(tripId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    const expense = await Expense.findOne({ _id: expenseId, trip: tripId });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense record not found' });
    }

    await expense.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Expense record deleted successfully',
      deletedId: expenseId,
    });
  } catch (error) {
    console.error('[Delete Expense Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error deleting expense',
    });
  }
};

/**
 * @route   PUT /api/trips/:tripId/budget-limit
 * @desc    Update trip target budget limit
 * @access  Private
 */
export const updateBudgetLimit = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { budgetLimit } = req.body;

    const { error, status, trip } = await checkTripOwnership(tripId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    trip.budgetLimit = Number(budgetLimit) >= 0 ? Number(budgetLimit) : 0;
    await trip.save();

    res.status(200).json({
      success: true,
      message: 'Trip budget limit updated successfully',
      budgetLimit: trip.budgetLimit,
    });
  } catch (error) {
    console.error('[Update Budget Limit Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error updating budget limit',
    });
  }
};
