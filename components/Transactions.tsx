import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Transaction, Category, AISettings } from '../types';
import { Card, Modal, CategoryModal } from './ui';
import { ChevronDown, Edit, Trash2, WandSparkles, LoaderCircle, Tag, PlusCircle, Info, X } from 'lucide-react';
import { suggestCategoriesForTransaction, suggestCategoriesForTransactionsBatch } from '../services/geminiService';

const useClickOutside = (ref: React.RefObject<HTMLElement>, handler: () => void) => {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return;
            }
            handler();
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
};

const EditTransactionModal: React.FC<{
    transaction: Transaction | null;
    onSave: (transaction: Transaction) => void;
    onClose: () => void;
}> = ({ transaction, onSave, onClose }) => {
    const [amount, setAmount] = useState<number>(0);
    const [originalAmount, setOriginalAmount] = useState<number>(0);
    
    useEffect(() => {
        if(transaction) {
            setAmount(transaction.amount);
            setOriginalAmount(transaction.amount);
        }
    }, [transaction]);

    if (!transaction) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...transaction, amount: Number(amount) });
        onClose();
    };

    const handleQuickSplit = (percentage: number) => {
        setAmount(Number((originalAmount * percentage).toFixed(2)));
    };
    
    return (
        <Modal isOpen={!!transaction} onClose={onClose} title="Edit Transaction Amount">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="editAmount" className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">$</span>
                        <input
                            id="editAmount"
                            type="number"
                            value={amount}
                            onChange={e => setAmount(Number(e.target.value))}
                            required
                            min="0"
                            step="0.01"
                            className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition"
                        />
                    </div>
                     <p className="text-xs text-slate-500 mt-2">Editing amount for: <span className="font-medium">{transaction.payee}</span></p>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">Quick Split (Sets amount to % of original)</label>
                    <div className="flex gap-2">
                        {[0.25, 0.5, 0.75].map(pct => (
                             <button type="button" key={pct} onClick={() => handleQuickSplit(pct)} className="flex-1 py-2 text-sm font-semibold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
                                I paid {pct * 100}%
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark">Save Changes</button>
                </div>
            </form>
        </Modal>
    );
};


const CategorySelector: React.FC<{
    transaction: Transaction,
    category?: Category,
    categories: Category[],
    onUpdateCategory: (transactionId: string, categoryId: string) => void,
    onNewCategory: () => void,
}> = ({ transaction, category, categories, onUpdateCategory, onNewCategory }) => {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    useClickOutside(popoverRef, () => setIsOpen(false));

    return (
        <div className="relative" ref={popoverRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-1 group">
                 {category ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: category.color, color: 'white' }}>
                        {category.name}
                    </span>
                ) : (
                    <span className="text-xs text-slate-400 italic">None</span>
                )}
                <ChevronDown size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            {isOpen && (
                <div className="absolute z-20 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 p-2 max-h-60 overflow-y-auto">
                    {categories.filter(c => c.id !== 'uncategorized').map(c => (
                        <button key={c.id} onClick={() => { onUpdateCategory(transaction.id, c.id); setIsOpen(false); }} className="w-full text-left flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 text-sm">
                            <span className="w-3 h-3 rounded-full" style={{backgroundColor: c.color}}></span>
                            {c.name}
                        </button>
                    ))}
                     <button onClick={() => { onNewCategory(); setIsOpen(false); }} className="w-full text-left flex items-center gap-2 p-2 mt-1 rounded-md hover:bg-slate-100 text-sm text-primary font-medium border-t border-slate-200">
                        <PlusCircle size={14} />
                        Create New Category
                    </button>
                </div>
            )}
        </div>
    );
}

const TransactionRow: React.FC<{ 
    transaction: Transaction; 
    category?: Category;
    onDelete: (id: string) => void;
    onUpdateCategory: (transactionId: string, categoryId: string) => void;
    onEdit: (transaction: Transaction) => void;
    onNewCategory: () => void;
    categories: Category[];
    aiSettings: AISettings;
}> = ({ transaction, category, onDelete, onUpdateCategory, onEdit, onNewCategory, categories, aiSettings }) => {
    const [isSuggesting, setIsSuggesting] = useState(false);

    const handleSuggestCategory = async () => {
        setIsSuggesting(true);
        const suggestedCategoryId = await suggestCategoriesForTransaction(
            transaction.payee,
            transaction.description,
            categories,
            aiSettings
        );
        if (suggestedCategoryId) {
            onUpdateCategory(transaction.id, suggestedCategoryId);
        }
        setIsSuggesting(false);
    };

    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

    return (
        <tr className="border-b border-slate-200 hover:bg-slate-50">
            <td className="p-4 text-sm text-slate-600">{transaction.date}</td>
            <td className="p-4 font-medium text-slate-800">{transaction.payee}</td>
            <td className="p-4 text-sm text-slate-500 max-w-xs truncate">{transaction.description}</td>
            <td className="p-4">
                <CategorySelector 
                    transaction={transaction}
                    category={category}
                    categories={categories}
                    onUpdateCategory={onUpdateCategory}
                    onNewCategory={onNewCategory}
                />
            </td>
            <td className={`p-4 font-semibold ${category?.name === 'Income' ? 'text-accent-income' : transaction.type === 'Credit' ? 'text-blue-500' : 'text-accent-expense'}`}>
                {category?.name !== 'Income' && transaction.type === 'Debit' && '-'}{currencyFormatter.format(transaction.amount)}
            </td>
            <td className="p-4">
                <div className="flex items-center space-x-2">
                    {transaction.categoryId === 'uncategorized' && aiSettings.enabled && (
                        <button onClick={handleSuggestCategory} disabled={isSuggesting || !aiSettings.apiKey} className="p-1.5 text-slate-500 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-wait" title="Suggest Category with AI">
                            {isSuggesting ? <LoaderCircle size={16} className="animate-spin" /> : <WandSparkles size={16} />}
                        </button>
                    )}
                    <button onClick={() => onEdit(transaction)} className="p-1.5 text-slate-500 hover:text-primary transition-colors" title="Edit Amount"><Edit size={16} /></button>
                    <button onClick={() => onDelete(transaction.id)} className="p-1.5 text-slate-500 hover:text-accent-expense transition-colors" title="Delete Transaction"><Trash2 size={16} /></button>
                </div>
            </td>
        </tr>
    );
};

export const Transactions: React.FC<{
    transactions: Transaction[];
    categories: Category[];
    aiSettings: AISettings;
    getCategoryById: (id: string) => Category | undefined;
    deleteTransaction: (id: string) => void;
    updateTransaction: (transaction: Transaction) => void;
    updateTransactions: (transactions: Transaction[]) => void;
    addCategory: (category: Omit<Category, 'id'>) => void;
    updateCategory: (category: Category) => void;
}> = ({ transactions, categories, getCategoryById, deleteTransaction, updateTransaction, updateTransactions, addCategory, updateCategory, aiSettings }) => {
    const [filter, setFilter] = useState({ search: '', categoryId: '' });
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
    const [isBulkCategorizing, setIsBulkCategorizing] = useState(false);
    const [bulkCategorizeStatus, setBulkCategorizeStatus] = useState<string | null>(null);


    const filteredTransactions = useMemo(() => {
        return transactions
            .filter(t => {
                const searchLower = filter.search.toLowerCase();
                return (
                    (t.payee.toLowerCase().includes(searchLower) || t.description.toLowerCase().includes(searchLower)) &&
                    (filter.categoryId === '' || t.categoryId === filter.categoryId)
                );
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, filter]);

    const handleUpdateCategory = (transactionId: string, categoryId: string) => {
        const transaction = transactions.find(t => t.id === transactionId);
        if (transaction) {
            updateTransaction({ ...transaction, categoryId });
        }
    };

    const handleSaveTransaction = (transaction: Transaction) => {
        updateTransaction(transaction);
        setEditingTransaction(null);
    };

    const handleBulkCategorize = async () => {
        setIsBulkCategorizing(true);
        setBulkCategorizeStatus("Finding uncategorized transactions...");
    
        const uncategorizedTransactions = transactions.filter(t => t.categoryId === 'uncategorized');
        
        if (uncategorizedTransactions.length === 0) {
            setBulkCategorizeStatus("No uncategorized transactions to assist with.");
            setIsBulkCategorizing(false);
            return;
        }

        const transactionsToBatch = uncategorizedTransactions.map(t => ({
            id: t.id,
            payee: t.payee,
            description: t.description
        }));
        
        setBulkCategorizeStatus(`Sending batch of ${transactionsToBatch.length} transactions to AI...`);

        try {
            const suggestions = await suggestCategoriesForTransactionsBatch(transactionsToBatch, categories, aiSettings);
            
            if (!suggestions) {
                throw new Error("AI service did not return any suggestions.");
            }

            setBulkCategorizeStatus("Processing AI suggestions...");

            const transactionsToUpdate: Transaction[] = [];
            let categorizedCount = 0;
            const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));

            for (const suggestion of suggestions) {
                const originalTransaction = uncategorizedTransactions.find(t => t.id === suggestion.id);
                const categoryId = categoryMap.get(suggestion.suggestedCategoryName.toLowerCase());

                if (originalTransaction && categoryId && categoryId !== 'uncategorized') {
                    transactionsToUpdate.push({ ...originalTransaction, categoryId });
                    categorizedCount++;
                }
            }

            if (transactionsToUpdate.length > 0) {
                updateTransactions(transactionsToUpdate);
            }
            
            setBulkCategorizeStatus(`${categorizedCount} of ${uncategorizedTransactions.length} transactions were categorized.`);

        } catch (error) {
            console.error("Bulk categorization failed:", error);
            setBulkCategorizeStatus(`An error occurred during bulk categorization. Please check the console.`);
        } finally {
            setIsBulkCategorizing(false);
        }
    };

    return (
        <>
            <Card>
                <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h2 className="text-xl font-bold text-slate-800">All Transactions</h2>
                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
                            <div className="relative w-full md:w-48">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={filter.search}
                                    onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                                    className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition"
                                />
                                {filter.search && (
                                    <button
                                      onClick={() => setFilter(prev => ({ ...prev, search: '' }))}
                                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                                      aria-label="Clear search"
                                    >
                                      <X size={18} />
                                    </button>
                                )}
                            </div>
                            <select
                                value={filter.categoryId}
                                onChange={(e) => setFilter(prev => ({ ...prev, categoryId: e.target.value }))}
                                className="w-full md:w-48 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition"
                            >
                                <option value="">All Categories</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <button
                                onClick={handleBulkCategorize}
                                disabled={isBulkCategorizing || !aiSettings.enabled || !aiSettings.apiKey}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-secondary rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isBulkCategorizing ? <LoaderCircle size={16} className="animate-spin" /> : <WandSparkles size={16} />}
                                <span>AI Assist</span>
                            </button>
                        </div>
                    </div>
                    {bulkCategorizeStatus && (
                        <div className="mb-4 p-3 rounded-lg bg-blue-100 text-blue-800 text-sm flex items-center gap-2">
                            <Info size={16} />
                            {bulkCategorizeStatus}
                        </div>
                    )}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Payee</th>
                                    <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                                    <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                                    <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                    <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredTransactions.map(t => (
                                    <TransactionRow 
                                        key={t.id} 
                                        transaction={t} 
                                        category={getCategoryById(t.categoryId)}
                                        onDelete={deleteTransaction}
                                        onUpdateCategory={handleUpdateCategory}
                                        onEdit={setEditingTransaction}
                                        onNewCategory={() => setCategoryModalOpen(true)}
                                        categories={categories}
                                        aiSettings={aiSettings}
                                    />
                                ))}
                            </tbody>
                        </table>
                        {filteredTransactions.length === 0 && (
                            <div className="text-center py-12 text-slate-500">
                                <Tag size={48} className="mx-auto text-slate-300 mb-4" />
                                <h3 className="text-lg font-semibold">No Transactions Found</h3>
                                <p>Try adjusting your filters or upload a CSV.</p>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
            <EditTransactionModal
                transaction={editingTransaction}
                onClose={() => setEditingTransaction(null)}
                onSave={handleSaveTransaction}
            />
            <CategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setCategoryModalOpen(false)}
                category={null}
                addCategory={addCategory}
                updateCategory={updateCategory}
            />
        </>
    );
};