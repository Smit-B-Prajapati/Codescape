import express from 'express';
import {
  getBudgetSummary,
  addExpense,
  updateExpense,
  deleteExpense,
  updateBudgetLimit,
} from '../controllers/budgetController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect); // Enforce authentication

router.get('/budget', getBudgetSummary);
router.put('/budget-limit', updateBudgetLimit);

router.post('/expenses', addExpense);
router.put('/expenses/:expenseId', updateExpense);
router.delete('/expenses/:expenseId', deleteExpense);

export default router;
