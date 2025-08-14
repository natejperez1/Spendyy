
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, Category, AISettings } from '../types';
import { Card, CategoryModal } from './ui';
import { LoaderCircle, Edit, Trash2, WandSparkles, Info, ArrowLeft, ArrowRight } from 'lucide-react';
import { suggestCategoriesForTransaction, suggestCategoriesForTransactionsBatch } from '../services/geminiService';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    createColumnHelper,
    SortingState,
    ColumnFiltersState,
    VisibilityState,
    RowSelectionState,
    ColumnOrderState,
} from '@tanstack/react-table';

import { useMonthlyPagination } from '../hooks/useMonthlyPagination';
import { EditTransactionModal } from './transactions/EditTransactionModal';
import { CategorySelector } from './transactions/CategorySelector';
import { TransactionToolbar } from './transactions/TransactionToolbar';
import { TransactionTable, IndeterminateCheckbox } from './transactions/TransactionTable';
import { BulkDeleteModal } from './transactions/BulkDeleteModal';

const columnHelper = createColumnHelper<Transaction>();

export const Transactions: React.FC<{
    transactions: Transaction[];
    categories: Category[];
    aiSettings: AISettings;
    getCategoryById: (id: string) => Category | undefined;
    deleteTransaction: (id: string) => void;
    deleteTransactions: (ids: string[]) => void;
    updateTransaction: (transaction: Transaction) => void;
    updateTransactions: (transactions: Transaction[]) => void;
    addCategory: (category: Omit<Category, 'id'>) => void;
    updateCategory: (category: Category) => void;
}> = ({ 
    transactions, 
    categories, 
    getCategoryById, 
    deleteTransaction,
    deleteTransactions, 
    updateTransaction, 
    updateTransactions, 
    addCategory, 
    updateCategory, 
    aiSettings 
}) => {
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
    const [isBulkCategorizing, setIsBulkCategorizing] = useState(false);
    const [bulkCategorizeStatus, setBulkCategorizeStatus] = useState<string | null>(null);

    const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [isBulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

    const { availableMonths, currentMonth, setCurrentMonth, handleNav, paginatedTransactions } = useMonthlyPagination(transactions);
    
    const handleUpdateCategory = (transactionId: string, categoryId: string) => {
        const transaction = transactions.find(t => t.id === transactionId);
        if (transaction) {
            updateTransaction({ ...transaction, categoryId });
        }
    };

    const columns = useMemo(() => [
        columnHelper.display({
            id: 'select',
            header: ({ table }) => (
                <IndeterminateCheckbox
                    {...{
                        checked: table.getIsAllRowsSelected(),
                        indeterminate: table.getIsSomeRowsSelected(),
                        onChange: table.getToggleAllRowsSelectedHandler(),
                    }}
                />
            ),
            cell: ({ row }) => (
                <div className="px-1">
                    <IndeterminateCheckbox
                        {...{
                            checked: row.getIsSelected(),
                            disabled: !row.getCanSelect(),
                            indeterminate: row.getIsSomeSelected(),
                            onChange: row.getToggleSelectedHandler(),
                        }}
                    />
                </div>
            ),
            size: 48,
            enableResizing: false,
        }),
        columnHelper.accessor('date', {
            header: 'Date',
            cell: info => info.getValue(),
            size: 120,
        }),
        columnHelper.accessor('payee', {
            header: 'Payee',
            cell: info => info.getValue(),
            size: 200,
        }),
        columnHelper.accessor('description', {
            header: 'Description',
            cell: info => <span className="max-w-xs truncate block">{info.getValue()}</span>,
            size: 250,
        }),
        columnHelper.accessor('categoryId', {
            header: 'Category',
            cell: ({ row }) => {
                const transaction = row.original;
                return (
                    <CategorySelector
                        transaction={transaction}
                        category={getCategoryById(transaction.categoryId)}
                        categories={categories}
                        onUpdateCategory={handleUpdateCategory}
                        onNewCategory={() => setCategoryModalOpen(true)}
                    />
                );
            },
            filterFn: 'equals',
            size: 180,
        }),
        columnHelper.accessor('amount', {
            header: 'Amount',
            cell: ({ row }) => {
                const transaction = row.original;
                const category = getCategoryById(transaction.categoryId);
                const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
                return (
                    <span className={`font-semibold ${category?.name === 'Income' ? 'text-accent-income' : transaction.type === 'Credit' ? 'text-blue-500' : 'text-accent-expense'}`}>
                        {category?.name !== 'Income' && transaction.type === 'Debit' && '-'}{currencyFormatter.format(transaction.amount)}
                    </span>
                );
            },
            size: 120,
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const transaction = row.original;
                const [isSuggesting, setIsSuggesting] = useState(false);

                const handleSuggestCategory = async () => {
                    setIsSuggesting(true);
                    const suggestedCategoryId = await suggestCategoriesForTransaction(transaction.payee, transaction.description, categories, aiSettings);
                    if (suggestedCategoryId) {
                        handleUpdateCategory(transaction.id, suggestedCategoryId);
                    }
                    setIsSuggesting(false);
                };

                return (
                    <div className="flex items-center space-x-2">
                        {transaction.categoryId === 'uncategorized' && aiSettings.enabled && (
                            <button onClick={handleSuggestCategory} disabled={isSuggesting || !aiSettings.apiKey} className="p-1.5 text-slate-500 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-wait" title="Suggest Category with AI">
                                {isSuggesting ? <LoaderCircle size={16} className="animate-spin" /> : <WandSparkles size={16} />}
                            </button>
                        )}
                        <button onClick={() => setEditingTransaction(transaction)} className="p-1.5 text-slate-500 hover:text-primary transition-colors" title="Edit Amount"><Edit size={16} /></button>
                        <button onClick={() => deleteTransaction(transaction.id)} className="p-1.5 text-slate-500 hover:text-accent-expense transition-colors" title="Delete Transaction"><Trash2 size={16} /></button>
                    </div>
                );
            },
            size: 120,
        })
    ], [categories, getCategoryById, aiSettings, deleteTransaction, updateTransaction, handleUpdateCategory]);

    const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([
        'select',
        'date',
        'payee',
        'description',
        'categoryId',
        'amount',
        'actions',
    ]);

    const table = useReactTable({
        data: paginatedTransactions,
        columns,
        state: {
            sorting,
            columnFilters,
            globalFilter,
            columnVisibility,
            rowSelection,
            columnOrder,
        },
        columnResizeMode: 'onChange',
        enableRowSelection: true,
        enableHiding: true,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onColumnOrderChange: setColumnOrder,
        globalFilterFn: (row, columnId, filterValue) => {
            const search = filterValue.toLowerCase();
            const payee = row.original.payee?.toLowerCase() || '';
            const description = row.original.description?.toLowerCase() || '';
            return payee.includes(search) || description.includes(search);
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

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
    
    const handleBulkDelete = () => {
        const selectedIds = table.getSelectedRowModel().rows.map(row => row.original.id);
        deleteTransactions(selectedIds);
        setRowSelection({}); // Clear selection
        setBulkDeleteModalOpen(false);
    };
    
    return (
        <>
            <Card>
                <div className="p-6">
                    <TransactionToolbar
                        table={table}
                        categories={categories}
                        aiSettings={aiSettings}
                        isBulkCategorizing={isBulkCategorizing}
                        onBulkCategorize={handleBulkCategorize}
                        onBulkDelete={() => setBulkDeleteModalOpen(true)}
                        currentMonth={currentMonth}
                        onNav={handleNav}
                        availableMonths={availableMonths}
                        setCurrentMonth={setCurrentMonth}
                    />

                    {bulkCategorizeStatus && (
                        <div className="mb-4 p-3 rounded-lg bg-blue-100 text-blue-800 text-sm flex items-center gap-2">
                            <Info size={16} />
                            {bulkCategorizeStatus}
                        </div>
                    )}
                    
                    <TransactionTable table={table} />

                     <div className="flex justify-center mt-6">
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleNav('prev')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
                                <ArrowLeft size={18}/>
                            </button>
                            <span className="text-sm font-medium text-slate-600 w-36 text-center">
                                {new Date(`${currentMonth}-01T12:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                            <button onClick={() => handleNav('next')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
                                <ArrowRight size={18}/>
                            </button>
                        </div>
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
            <BulkDeleteModal
                isOpen={isBulkDeleteModalOpen}
                onClose={() => setBulkDeleteModalOpen(false)}
                onConfirm={handleBulkDelete}
                count={Object.keys(rowSelection).length}
            />
        </>
    );
};