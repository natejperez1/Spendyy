
import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Transaction, Category, AISettings } from '../types';
import { Card, Modal, CategoryModal } from './ui';
import { ChevronDown, Edit, Trash2, WandSparkles, LoaderCircle, Tag, PlusCircle, Info, X, ChevronsUpDown, ArrowLeft, ArrowRight, AlertTriangle, Columns, ArrowUp, ArrowDown } from 'lucide-react';
import { suggestCategoriesForTransaction, suggestCategoriesForTransactionsBatch } from '../services/geminiService';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    flexRender,
    createColumnHelper,
    SortingState,
    ColumnFiltersState,
    VisibilityState,
    RowSelectionState,
    ColumnOrderState,
    Table,
    Column,
} from '@tanstack/react-table';

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
    const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleToggle = () => {
        if (!isOpen) {
            if (buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                setPopoverStyle({
                    position: 'fixed',
                    top: `${rect.bottom + 8}px`,
                    left: `${rect.left}px`,
                    width: '224px', // w-56
                });
            }
        }
        setIsOpen(!isOpen);
    };
    
    const popoverContent = (
        <div
            style={popoverStyle}
            className="z-50 w-56 bg-white rounded-lg shadow-xl border border-slate-200 p-2 max-h-60 overflow-y-auto"
        >
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
    );

    return (
        <>
            <button ref={buttonRef} onClick={handleToggle} className="flex items-center gap-1 group">
                 {category ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: category.color, color: 'white' }}>
                        {category.name}
                    </span>
                ) : (
                    <span className="text-xs text-slate-400 italic">None</span>
                )}
                <ChevronDown size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            {isOpen && ReactDOM.createPortal(popoverContent, document.body)}
        </>
    );
}

const IndeterminateCheckbox: React.FC<{ indeterminate?: boolean } & React.HTMLProps<HTMLInputElement>> =
    ({ indeterminate, className = '', ...rest }) => {
    const ref = React.useRef<HTMLInputElement>(null!);

    React.useEffect(() => {
        if (typeof indeterminate === 'boolean') {
            ref.current.indeterminate = !rest.checked && indeterminate;
        }
    }, [ref, indeterminate, rest.checked]);

    return (
        <input
            type="checkbox"
            ref={ref}
            className={className + " cursor-pointer w-4 h-4 rounded text-primary focus:ring-primary border-slate-300"}
            {...rest}
        />
    );
}


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

    // Date-based pagination state
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
    ], [categories, getCategoryById, aiSettings, deleteTransaction, updateTransaction]);

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
    
    const numSelected = Object.keys(rowSelection).length;

    return (
        <>
            <Card>
                <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h2 className="text-xl font-bold text-slate-800">All Transactions</h2>
                         <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-center flex-wrap">
                            <PaginationControls currentMonth={currentMonth} onNav={handleNav} />
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full items-center mb-4 flex-wrap">
                         <div className="relative w-full sm:w-auto sm:flex-1">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={globalFilter ?? ''}
                                    onChange={(e) => setGlobalFilter(String(e.target.value))}
                                    className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition"
                                />
                                {globalFilter && (
                                    <button
                                      onClick={() => setGlobalFilter('')}
                                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                                      aria-label="Clear search"
                                    >
                                      <X size={18} />
                                    </button>
                                )}
                            </div>
                        <select
                            value={(table.getColumn('categoryId')?.getFilterValue() as string) ?? ''}
                            onChange={(e) => table.getColumn('categoryId')?.setFilterValue(e.target.value || undefined)}
                            className="w-full sm:w-auto sm:flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition"
                        >
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                         <MonthYearSelector availableMonths={availableMonths} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} />
                         <ColumnVisibilityToggle table={table} />
                        <button
                            onClick={handleBulkCategorize}
                            disabled={isBulkCategorizing || !aiSettings.enabled || !aiSettings.apiKey}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-secondary rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isBulkCategorizing ? <LoaderCircle size={16} className="animate-spin" /> : <WandSparkles size={16} />}
                            <span>AI Assist</span>
                        </button>
                        {numSelected > 0 && (
                             <button
                                onClick={() => setBulkDeleteModalOpen(true)}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <Trash2 size={16} />
                                <span>Delete Selected ({numSelected})</span>
                            </button>
                        )}
                    </div>

                    {bulkCategorizeStatus && (
                        <div className="mb-4 p-3 rounded-lg bg-blue-100 text-blue-800 text-sm flex items-center gap-2">
                            <Info size={16} />
                            {bulkCategorizeStatus}
                        </div>
                    )}
                    <div className="overflow-x-auto">
                        <table className="min-w-full" style={{width: table.getCenterTotalSize()}}>
                            <thead className="bg-slate-50">
                                {table.getHeaderGroups().map(headerGroup => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map(header => (
                                            <th
                                                key={header.id}
                                                colSpan={header.colSpan}
                                                className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider select-none relative group"
                                                style={{ width: header.getSize() }}
                                            >
                                                {header.isPlaceholder ? null : (
                                                <div
                                                    className={header.column.getCanSort() ? 'cursor-pointer' : ''}
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                        {{
                                                            asc: '▲',
                                                            desc: '▼',
                                                        }[header.column.getIsSorted() as string] ?? (header.column.getCanSort() ? <ChevronsUpDown size={14} className="text-slate-400" /> : null)}
                                                    </div>
                                                </div>
                                                )}
                                                {header.column.getCanResize() && (
                                                    <div
                                                        onMouseDown={header.getResizeHandler()}
                                                        onTouchStart={header.getResizeHandler()}
                                                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-primary/20 opacity-0 group-hover:opacity-100"
                                                    />
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {table.getRowModel().rows.map(row => (
                                    <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50">
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id} className="p-4 text-sm text-slate-600 align-top" style={{ width: cell.column.getSize() }}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {table.getRowModel().rows.length === 0 && (
                            <div className="text-center py-12 text-slate-500">
                                <Tag size={48} className="mx-auto text-slate-300 mb-4" />
                                <h3 className="text-lg font-semibold">No Transactions Found</h3>
                                <p>Try adjusting your filters or selecting a different month.</p>
                            </div>
                        )}
                    </div>
                     <div className="flex justify-center mt-6">
                        <PaginationControls currentMonth={currentMonth} onNav={handleNav} />
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
            <Modal isOpen={isBulkDeleteModalOpen} onClose={() => setBulkDeleteModalOpen(false)} title="Confirm Bulk Deletion">
                <div className="text-center">
                    <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-800">Are you sure?</h3>
                    <p className="text-slate-500 mt-2">
                        You are about to permanently delete {numSelected} transaction(s). This action cannot be undone.
                    </p>
                </div>
                <div className="flex justify-center gap-4 mt-8">
                    <button onClick={() => setBulkDeleteModalOpen(false)} className="px-6 py-2 font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">
                        Cancel
                    </button>
                    <button onClick={handleBulkDelete} className="px-6 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700">
                        Yes, delete
                    </button>
                </div>
            </Modal>
        </>
    );
};

const useMonthlyPagination = (transactions: Transaction[]) => {
    const availableMonths = useMemo(() => {
        const yearMonthSet = new Set<string>();
        transactions.forEach(t => {
            yearMonthSet.add(t.date.substring(0, 7)); // YYYY-MM
        });
        return Array.from(yearMonthSet).sort().reverse();
    }, [transactions]);

    const [currentMonth, setCurrentMonth] = useState<string>(availableMonths[0] || new Date().toISOString().substring(0, 7));

    useEffect(() => {
        if (availableMonths.length > 0 && !availableMonths.includes(currentMonth)) {
            setCurrentMonth(availableMonths[0]);
        }
    }, [availableMonths, currentMonth]);

    const handleNav = (direction: 'prev' | 'next') => {
        const date = new Date(`${currentMonth}-01T12:00:00`);
        date.setMonth(date.getMonth() + (direction === 'next' ? 1 : -1));
        setCurrentMonth(date.toISOString().substring(0, 7));
    };
    
    const paginatedTransactions = useMemo(() => {
        return transactions.filter(t => t.date.startsWith(currentMonth));
    }, [transactions, currentMonth]);

    return { availableMonths, currentMonth, setCurrentMonth, handleNav, paginatedTransactions };
};

const PaginationControls: React.FC<{
    currentMonth: string;
    onNav: (dir: 'prev' | 'next') => void;
}> = ({ currentMonth, onNav }) => {
    const monthYearLabel = new Date(`${currentMonth}-01T12:00:00`).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
    });
    return (
        <div className="flex items-center gap-2">
            <button onClick={() => onNav('prev')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-md"><ArrowLeft size={18}/></button>
            <span className="text-sm font-medium text-slate-600 w-36 text-center">{monthYearLabel}</span>
            <button onClick={() => onNav('next')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-md"><ArrowRight size={18}/></button>
        </div>
    );
};

const MonthYearSelector: React.FC<{
    availableMonths: string[],
    currentMonth: string,
    setCurrentMonth: (ym: string) => void
}> = ({ availableMonths, currentMonth, setCurrentMonth }) => {
    return (
        <div className="flex-shrink-0 w-full sm:w-auto">
            <select 
                value={currentMonth} 
                onChange={e => setCurrentMonth(e.target.value)} 
                className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition"
            >
                {availableMonths.map(month => {
                    const date = new Date(`${month}-02`); // Day 2 to avoid timezone issues
                    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    return <option key={month} value={month}>{label}</option>
                })}
            </select>
        </div>
    );
};

const ColumnVisibilityToggle: React.FC<{ table: Table<Transaction> }> = ({ table }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
    
    const moveColumn = (columnId: string, direction: 'up' | 'down') => {
        const currentOrder = table.getState().columnOrder;
        const currentIndex = currentOrder.indexOf(columnId);
        if (currentIndex === -1) return;

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        
        // Prevent moving any column into the 'select' column's spot (index 0)
        if (newIndex < 1 || newIndex >= currentOrder.length) return;

        const newOrder = [...currentOrder];
        [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]]; // Swap
        table.setColumnOrder(newOrder);
    };

    const reorderableColumns = useMemo(
        () => table.getState().columnOrder
            .map(id => table.getColumn(id))
            .filter((c): c is Column<Transaction, unknown> => !!c && c.id !== 'select'),
        [table.getState().columnOrder, table.getAllColumns]
    );

    return (
        <div className="relative" ref={wrapperRef}>
            <button onClick={() => setIsOpen(o => !o)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors">
                <Columns size={16} /> Columns
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 p-2 z-10">
                    {reorderableColumns.map((column, index) => {
                        return (
                            <div key={column.id} className="flex items-center gap-2 p-1 rounded-md hover:bg-slate-100 text-sm">
                                <div className="flex flex-col">
                                    <button 
                                        onClick={() => moveColumn(column.id, 'up')}
                                        disabled={index === 0}
                                        className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-400"
                                    >
                                        <ArrowUp size={12} />
                                    </button>
                                     <button 
                                        onClick={() => moveColumn(column.id, 'down')}
                                        disabled={index >= reorderableColumns.length - 1}
                                        className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-400"
                                    >
                                        <ArrowDown size={12} />
                                    </button>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer flex-grow p-1">
                                    <input
                                        type="checkbox"
                                        checked={column.getIsVisible()}
                                        onChange={column.getToggleVisibilityHandler()}
                                        className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300"
                                    />
                                    <span>{typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}</span>
                                </label>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
