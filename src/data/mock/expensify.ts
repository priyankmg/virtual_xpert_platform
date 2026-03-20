import { ExpensesData } from '../types/snapshot';

export const expensifyData: ExpensesData = {
  total: 284_000,
  deductible: 242_000,
  flagged: 42_000,
  byCategory: [
    { category: 'Travel & Lodging', amount: 68_000, deductiblePercent: 100, flagged: false },
    { category: 'Meals & Entertainment', amount: 54_000, deductiblePercent: 50, flagged: false },
    { category: 'Office Supplies & Equipment', amount: 38_000, deductiblePercent: 100, flagged: false },
    { category: 'Professional Development', amount: 24_000, deductiblePercent: 100, flagged: false },
    { category: 'Vehicle & Mileage', amount: 31_000, deductiblePercent: 100, flagged: false },
    { category: 'Home Office (Multiple Employees)', amount: 22_000, deductiblePercent: 100, flagged: true },
    { category: 'Client Entertainment (No Business Purpose)', amount: 18_000, deductiblePercent: 0, flagged: true },
    { category: 'Personal Charges - Ambiguous', amount: 14_000, deductiblePercent: 0, flagged: true },
    { category: 'Software Subscriptions', amount: 15_000, deductiblePercent: 100, flagged: false },
  ],
};
