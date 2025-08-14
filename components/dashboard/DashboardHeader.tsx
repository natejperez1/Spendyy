
import React from 'react';
import { Period } from '../../types';
import { Card } from '../ui';
import { ArrowLeft, ArrowRight, SlidersHorizontal } from 'lucide-react';

const formatPeriod = (period: Period, range: { start: Date, end: Date }): string => {
    const optionsMonthYear: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    const optionsDate: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };

    if (period === 'day') return range.start.toLocaleDateString('en-US', optionsDate);
    if (period === 'month') return range.start.toLocaleDateString('en-US', optionsMonthYear);
    if (period === 'year') return String(range.start.getFullYear());
    if (range.start.getFullYear() !== range.end.getFullYear()) {
        return `${range.start.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})} - ${range.end.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}`;
    }
    return `${range.start.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} - ${range.end.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}`;
};

export const DashboardHeader: React.FC<{
    period: Period,
    setPeriod: (p: Period) => void,
    onNav: (dir: 'prev' | 'next') => void,
    range: { start: Date, end: Date },
    onCustomize: () => void;
}> = ({ period, setPeriod, onNav, range, onCustomize }) => (
    <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h3 className="text-lg font-semibold text-slate-800">Dashboard</h3>
            <div className="grid grid-cols-1 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                <select value={period} onChange={e => setPeriod(e.target.value as Period)} className="text-sm px-2 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition bg-white">
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                </select>
                <div className="flex items-center justify-between border border-slate-300 rounded-md p-1 sm:border-none sm:p-0">
                    <button onClick={() => onNav('prev')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-md"><ArrowLeft size={18}/></button>
                    <span className="text-sm font-medium text-slate-600 w-full sm:w-44 text-center">{formatPeriod(period, range)}</span>
                    <button onClick={() => onNav('next')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-md"><ArrowRight size={18}/></button>
                </div>
                <button onClick={onCustomize} className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 hover:text-primary transition-colors" title="Customize Dashboard Widgets">
                    <SlidersHorizontal size={16} />
                    <span>Customize</span>
                </button>
            </div>
        </div>
    </Card>
);
