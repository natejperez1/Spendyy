import { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, Category, Envelope, AISettings } from '../types';
import { DEFAULT_CATEGORIES, CATEGORY_COLORS } from '../constants';

function useLocalStorage<T,>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}

const defaultAISettings: AISettings = {
    enabled: true,
    provider: 'gemini',
    apiKey: process.env.API_KEY || '',
};

export const useBudgetData = () => {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [categories, setCategories] = useLocalStorage<Category[]>('categories', DEFAULT_CATEGORIES);
  const [envelopes, setEnvelopes] = useLocalStorage<Envelope[]>('envelopes', []);
  const [aiSettings, setAiSettings] = useLocalStorage<AISettings>('aiSettings', defaultAISettings);

  // One-time effect to migrate legacy envelope data.
  useEffect(() => {
    const needsMigration = envelopes.some(e => !e.type);
    if (needsMigration) {
      console.log("Migrating legacy envelopes to new data structure.");
      const migratedEnvelopes = envelopes.map(e => ({
        ...e,
        type: e.type || 'spending',
      }));
      setEnvelopes(migratedEnvelopes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount.

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [...prev, { ...transaction, id: `trans-${Date.now()}` }]);
  };

  const addTransactions = (newTransactions: (Omit<Transaction, 'id' | 'categoryId'> & { categoryName?: string })[]) => {
    // Use a functional update to get the latest categories state
    setCategories(prevCategories => {
        let currentCategories = [...prevCategories];
        const newCategoryNames = new Set<string>();

        const existingCategoryNamesLower = new Set(currentCategories.map(c => c.name.toLowerCase()));

        // Discover new categories from the incoming transactions
        newTransactions.forEach(t => {
            if (t.categoryName && !existingCategoryNamesLower.has(t.categoryName.toLowerCase())) {
                newCategoryNames.add(t.categoryName);
            }
        });

        // Create and add new categories if any were found
        if (newCategoryNames.size > 0) {
            const categoriesToAdd = Array.from(newCategoryNames).map((name, index) => ({
                id: `cat-${Date.now()}-${Math.random()}-${index}`,
                name,
                color: CATEGORY_COLORS[(currentCategories.length + index) % CATEGORY_COLORS.length]
            }));
            currentCategories = [...currentCategories, ...categoriesToAdd];
        }

        const categoryNameToIdMap = new Map(currentCategories.map(c => [c.name.toLowerCase(), c.id]));

        const enrichedTransactions = newTransactions.map(t => {
            const categoryId = t.categoryName ? (categoryNameToIdMap.get(t.categoryName.toLowerCase()) || 'uncategorized') : 'uncategorized';
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { categoryName, ...rest } = t;
            return { ...rest, categoryId, id: `trans-${Date.now()}-${Math.random()}` };
        });
        setTransactions(prev => [...prev, ...enrichedTransactions]);

        // Return the potentially updated categories array to be stored
        return currentCategories;
    });
  };
  
  const updateTransaction = (updatedTransaction: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
  };
  
  const updateTransactions = (transactionsToUpdate: Transaction[]) => {
      const updatesMap = new Map(transactionsToUpdate.map(t => [t.id, t]));
      setTransactions(prev => prev.map(t => updatesMap.get(t.id) || t));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    setCategories(prev => [...prev, { ...category, id: `cat-${Date.now()}` }]);
  };

  const updateCategory = (updatedCategory: Category) => {
    setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
  };

  const deleteCategory = (id: string) => {
    const categoryToDelete = categories.find(c => c.id === id);
    if (categoryToDelete?.name === 'Income') {
        alert("The 'Income' category is essential for reporting and cannot be deleted.");
        return;
    }
    setCategories(prev => prev.filter(c => c.id !== id));
    // Also remove this category from any envelopes
    setEnvelopes(prev => prev.map(e => ({...e, categoryIds: e.categoryIds.filter(catId => catId !== id)})));
  };

  const addEnvelope = (envelope: Omit<Envelope, 'id'>) => {
    setEnvelopes(prev => [...prev, { ...envelope, id: `env-${Date.now()}` }]);
  };
  
  const updateEnvelope = (updatedEnvelope: Envelope) => {
    setEnvelopes(prev => prev.map(e => e.id === updatedEnvelope.id ? updatedEnvelope : e));
  };

  const deleteEnvelope = (id: string) => {
    setEnvelopes(prev => prev.filter(e => e.id !== id));
  };

  const resetAllData = () => {
    setTransactions([]);
    setCategories(DEFAULT_CATEGORIES);
    setEnvelopes([]);
  };

  const importAllData = (data: any): { success: boolean, message: string } => {
    if (!data || !data.transactions || !data.categories || !data.envelopes || !data.aiSettings) {
        return { success: false, message: "Invalid backup file. The file is missing required data sections." };
    }
    try {
        if (!Array.isArray(data.transactions) || !Array.isArray(data.categories) || !Array.isArray(data.envelopes)) {
             return { success: false, message: "Backup file is corrupted. Data sections are not in the correct format." };
        }

        setTransactions(data.transactions);
        setCategories(data.categories);
        setEnvelopes(data.envelopes);
        setAiSettings(data.aiSettings);

        return { success: true, message: "Data imported successfully! The application will now reload." };
    } catch (error) {
        console.error("Failed to import data:", error);
        return { success: false, message: "An unexpected error occurred during import. Please check console for details." };
    }
  };
  
  const getCategoryById = useCallback((id: string) => {
    return categories.find(c => c.id === id);
  }, [categories]);

  return {
    transactions,
    categories,
    envelopes,
    aiSettings,
    addTransaction,
    addTransactions,
    updateTransaction,
    updateTransactions,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    addEnvelope,
    updateEnvelope,
    deleteEnvelope,
    resetAllData,
    importAllData,
    getCategoryById,
    updateAiSettings: setAiSettings,
  };
};