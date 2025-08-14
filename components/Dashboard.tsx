
import React, { useMemo, useState, useEffect } from 'react';
import { Transaction, Category, Envelope, Period, WidgetVisibility } from '../types';

import { DashboardHeader } from './dashboard/DashboardHeader';
import { StatsGroup } from './dashboard/StatsGroup';
import { EnvelopesSummary } from './dashboard/EnvelopesSummary';
import { SpendingPieChart } from './dashboard/SpendingPieChart';
import { SpendingTrendsChart } from './dashboard/SpendingTrendsChart';
import { IncomeEnvelopeBreakdown } from './dashboard/IncomeEnvelopeBreakdown';
import { WeekdayWeekendSpendCard } from './dashboard/WeekdayWeekendSpendCard';
import { CustomizeDashboardModal } from './dashboard/CustomizeDashboardModal';


const getPeriodRange = (period: Period, targetDate: Date): { start: Date, end: Date } => {
    const start = new Date(targetDate);
    const end = new Date(targetDate);

    if (period === 'day') {
        // Range is just the target day
    } else if (period === 'week') {
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        start.setDate(diff);
        end.setDate(start.getDate() + 6);
    } else if (period === 'month') {
        start.setDate(1);
        end.setMonth(end.getMonth() + 1, 0);
    } else if (period === 'year') {
        start.setMonth(0, 1);
        end.setFullYear(end.getFullYear(), 11, 31);
    }
    
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
};

const useDashboardFilter = (initialPeriod: Period = 'month', allTransactions: Transaction[]) => {
    const [period, setPeriod] = useState<Period>(initialPeriod);

    const availableMonths = useMemo(() => {
        const yearMonthSet = new Set<string>();
        allTransactions.forEach(t => {
            yearMonthSet.add(t.date.substring(0, 7)); // YYYY-MM
        });
        return Array.from(yearMonthSet).sort().reverse(); // Descending sort
    }, [allTransactions]);

    const latestTransactionDate = useMemo(() => {
        if (!allTransactions || allTransactions.length === 0) {
            return new Date();
        }
        // The dates are YYYY-MM-DD, which can be compared lexicographically
        const latestDateString = allTransactions.reduce((max, t) => (t.date > max ? t.date : max), allTransactions[0].date);
        // Ensure correct parsing in local timezone by appending T00:00:00
        return new Date(latestDateString + "T00:00:00");
    }, [allTransactions]);

    const [targetDate, setTargetDate] = useState(latestTransactionDate);
    
    useEffect(() => {
        setTargetDate(latestTransactionDate);
    }, [latestTransactionDate]);


    const dateRange = useMemo(() => getPeriodRange(period, targetDate), [period, targetDate]);

    const handleNav = (direction: 'prev' | 'next') => {
        if (period === 'month') {
            const currentMonthStr = targetDate.toISOString().substring(0, 7);
            
            if (direction === 'prev') { // Go to an older month
                const nextAvailableMonth = availableMonths.find(m => m < currentMonthStr);
                if (nextAvailableMonth) {
                    setTargetDate(new Date(`${nextAvailableMonth}-01T12:00:00`));
                }
            } else { // 'next', go to a newer month
                const nextAvailableMonth = [...availableMonths].reverse().find(m => m > currentMonthStr);
                if (nextAvailableMonth) {
                    setTargetDate(new Date(`${nextAvailableMonth}-01T12:00:00`));
                }
            }
        } else {
            const newDate = new Date(targetDate);
            const increment = direction === 'next' ? 1 : -1;
            if (period === 'day') newDate.setDate(newDate.getDate() + increment);
            else if (period === 'week') newDate.setDate(newDate.getDate() + (7 * increment));
            else if (period === 'year') newDate.setFullYear(newDate.getFullYear() + increment);
            setTargetDate(newDate);
        }
    };
    
    const filterTransactions = (transactions: Transaction[]) => transactions.filter(t => {
        const tDate = new Date(t.date); // Assumes YYYY-MM-DD which is parsed as UTC midnight
        // To compare correctly, create Date objects in a consistent manner
        const transactionDate = new Date(t.date + "T00:00:00");
        return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
    });

    return { period, setPeriod, dateRange, handleNav, filterTransactions };
};

export const Dashboard: React.FC<{ 
    transactions: Transaction[]; 
    categories: Category[]; 
    envelopes: Envelope[];
    widgetVisibility: WidgetVisibility;
    updateWidgetVisibility: (v: WidgetVisibility) => void;
}> = ({ transactions, categories, envelopes, widgetVisibility, updateWidgetVisibility }) => {
    
    const { period, setPeriod, dateRange, handleNav, filterTransactions } = useDashboardFilter('month', transactions);
    const [isCustomizeModalOpen, setCustomizeModalOpen] = useState(false);
    
    // For display in period-based charts/stats, we use filtered transactions.
    const filteredTransactions = useMemo(() => filterTransactions(transactions), [transactions, dateRange, filterTransactions]);

    const chartWidgets = [
        widgetVisibility.incomeBreakdown && <IncomeEnvelopeBreakdown key="incomeBreakdown" transactions={filteredTransactions} categories={categories} envelopes={envelopes} />,
        widgetVisibility.spendingPie && <SpendingPieChart key="spendingPie" transactions={filteredTransactions} categories={categories} />,
        widgetVisibility.trends && <SpendingTrendsChart key="trends" transactions={filteredTransactions} categories={categories} envelopes={envelopes} period={period} dateRange={dateRange} />,
    ].filter(Boolean);

    return (
        <div className="space-y-6">
            <DashboardHeader period={period} setPeriod={setPeriod} onNav={handleNav} range={dateRange} onCustomize={() => setCustomizeModalOpen(true)} />

            {widgetVisibility.stats && <StatsGroup transactions={filteredTransactions} categories={categories} />}
            
            {widgetVisibility.envelopes && <EnvelopesSummary 
                allTransactions={transactions}
                periodTransactions={filteredTransactions}
                envelopes={envelopes} 
                categories={categories} 
                period={period} 
                dateRange={dateRange} 
            />}

            {widgetVisibility.weekdayWeekendSpend && <WeekdayWeekendSpendCard 
                transactions={filteredTransactions}
                envelopes={envelopes}
                categories={categories}
                period={period}
                dateRange={dateRange}
            />}

            {chartWidgets.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {chartWidgets}
                </div>
            )}

            <CustomizeDashboardModal 
                isOpen={isCustomizeModalOpen}
                onClose={() => setCustomizeModalOpen(false)}
                visibility={widgetVisibility}
                setVisibility={updateWidgetVisibility}
            />
        </div>
    );
};
