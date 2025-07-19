export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  payee: string;
  description: string;
  categoryId: string;
  type: 'Credit' | 'Debit';
  amount: number;
  paymentMethod: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  isTransfer?: boolean; // New: True if the category represents transfers between accounts
}

export interface Envelope {
  id: string;
  name: string;
  type: 'spending' | 'goal'; // 'spending' is a pool, 'goal' is a saving goal
  budget: number; // For 'spending', monthly budget. For 'goal', monthly contribution goal.
  finalTarget?: number; // For 'goal', the optional final target sum.
  categoryIds: string[];
}

export type Tab = 'dashboard' | 'transactions' | 'management' | 'upload' | 'settings';

export type Period = 'day' | 'week' | 'month' | 'year';

export interface AISettings {
  enabled: boolean;
  provider: 'gemini'; // Future: 'deepseek' | 'openai' etc.
  apiKey: string;
}