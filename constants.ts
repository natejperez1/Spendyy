
import { Category } from './types';

export const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899', '#78716c'
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Groceries', color: '#22c55e' },
  { id: 'cat-2', name: 'Utilities', color: '#3b82f6' },
  { id: 'cat-3', name: 'Rent/Mortgage', color: '#8b5cf6' },
  { id: 'cat-4', name: 'Transportation', color: '#f97316' },
  { id: 'cat-5', name: 'Dining Out', color: '#ec4899' },
  { id: 'cat-6', name: 'Entertainment', color: '#d946ef' },
  { id: 'cat-7', name: 'Shopping', color: '#14b8a6' },
  { id: 'cat-8', name: 'Income', color: '#10b981' },
  { id: 'uncategorized', name: 'Uncategorized', color: '#78716c' }
];
