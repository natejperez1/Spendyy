
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Table, Column } from '@tanstack/react-table';
import { Transaction, Category, AISettings } from '../../types';
import { LoaderCircle, WandSparkles, Trash2, X, ArrowLeft, ArrowRight, Columns, ArrowUp, ArrowDown } from 'lucide-react';

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
        [table.getState().columnOrder, table]
    );

    return (
        <div className="w-full sm:w-auto">
            <div className="relative" ref={wrapperRef}>
                <button onClick={() => setIsOpen(o => !o)} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors">
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
        </div>
    );
};


export const TransactionToolbar: React.FC<{
    table: Table<Transaction>;
    categories: Category[];
    aiSettings: AISettings;
    isBulkCategorizing: boolean;
    onBulkCategorize: () => void;
    onBulkDelete: () => void;
    currentMonth: string;
    onNav: (dir: 'prev' | 'next') => void;
    availableMonths: string[];
    setCurrentMonth: (ym: string) => void;
}> = ({
    table,
    categories,
    aiSettings,
    isBulkCategorizing,
    onBulkCategorize,
    onBulkDelete,
    currentMonth,
    onNav,
    availableMonths,
    setCurrentMonth,
}) => {
    const globalFilter = table.getState().globalFilter;
    const setGlobalFilter = table.setGlobalFilter;
    const numSelected = table.getSelectedRowModel().rows.length;

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-slate-800">All Transactions</h2>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-center flex-wrap">
                    <PaginationControls currentMonth={currentMonth} onNav={onNav} />
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
                    onClick={onBulkCategorize}
                    disabled={isBulkCategorizing || !aiSettings.enabled || !aiSettings.apiKey}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-secondary rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isBulkCategorizing ? <LoaderCircle size={16} className="animate-spin" /> : <WandSparkles size={16} />}
                    <span>AI Assist</span>
                </button>
                {numSelected > 0 && (
                     <button
                        onClick={onBulkDelete}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <Trash2 size={16} />
                        <span>Delete Selected ({numSelected})</span>
                    </button>
                )}
            </div>
        </div>
    );
};
