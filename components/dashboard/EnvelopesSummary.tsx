
import React, { useMemo } from 'react';
import { Transaction, Envelope, Category, Period } from '../../types';
import { Card } from '../ui';
import { Wallet, Box, Target } from 'lucide-react';
import { currencyFormatter } from '../../utils';

const getAdjustedBudget = (monthlyBudget: number, period: Period, range: { start: Date, end: Date }): number => {
    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    
    switch (period) {
        case 'day':
             // Use days in the specific month of the range for more accuracy
            return monthlyBudget / daysInMonth(range.start);
        case 'week':
            // Scale based on the average number of days in a week
            return (monthlyBudget / daysInMonth(range.start)) * 7;
        case 'year':
            return monthlyBudget * 12;
        case 'month':
        default:
            return monthlyBudget;
    }
};

export const EnvelopesSummary: React.FC<{ 
    allTransactions: Transaction[], 
    periodTransactions: Transaction[], 
    envelopes: Envelope[], 
    categories: Category[], 
    period: Period, 
    dateRange: {start: Date, end: Date} 
}> = ({ allTransactions, periodTransactions, envelopes, categories, period, dateRange }) => {
    const incomeCategoryId = useMemo(() => categories.find(c => c.name === 'Income')?.id, [categories]);
    const transferCategoryIds = useMemo(() => new Set(categories.filter(c => c.isTransfer).map(c => c.id)), [categories]);
    
    // For spending pools, use the pre-filtered transactions for the current period
    const spendingByCategoryIdInPeriod = useMemo(() => {
        return periodTransactions.reduce((acc, t) => {
            if (t.type === 'Debit' && !transferCategoryIds.has(t.categoryId) && t.categoryId !== incomeCategoryId) {
                acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
            }
            return acc;
        }, {} as Record<string, number>);
    }, [periodTransactions, incomeCategoryId, transferCategoryIds]);

    // For saving goals, we track contributions from ALL transactions over all time for total progress.
    const contributionsByCategoryIdAllTime = useMemo(() => {
        return allTransactions.reduce((acc, t) => {
            const isTransfer = transferCategoryIds.has(t.categoryId);
            // A debit to a transfer category is a contribution (e.g., -$100 to "Transfer to Savings")
            if (isTransfer && t.type === 'Debit') {
                acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
            }
            // A credit to a non-transfer, non-income category is also a contribution (e.g., +$50 refund to "Vacation Fund")
            else if (!isTransfer && t.type === 'Credit' && t.categoryId !== incomeCategoryId) {
                acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
            }
            return acc;
        }, {} as Record<string, number>);
    }, [allTransactions, incomeCategoryId, transferCategoryIds]);

    // And we track contributions for the selected period to display period-specific info.
    const contributionsByCategoryIdInPeriod = useMemo(() => {
        return periodTransactions.reduce((acc, t) => {
            const isTransfer = transferCategoryIds.has(t.categoryId);
            // A debit to a transfer category is a contribution
            if (isTransfer && t.type === 'Debit') {
                acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
            }
            // A credit to a non-transfer, non-income category is also a contribution
            else if (!isTransfer && t.type === 'Credit' && t.categoryId !== incomeCategoryId) {
                acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
            }
            return acc;
        }, {} as Record<string, number>);
    }, [periodTransactions, incomeCategoryId, transferCategoryIds]);

    const spendingEnvelopes = useMemo(() => envelopes.filter(e => e.type === 'spending'), [envelopes]);
    const goalEnvelopes = useMemo(() => envelopes.filter(e => e.type === 'goal'), [envelopes]);

    return (
        <Card className="p-0">
            <div className="p-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">Envelope Summary</h3>
            </div>
             {envelopes.length === 0 ? (
                <div className="h-[150px] flex flex-col items-center justify-center text-slate-500">
                    <Wallet size={32} className="mb-2 text-slate-400"/>
                    <p>No envelopes created yet.</p>
                    <p className="text-xs">Go to the Management tab to add one.</p>
                </div>
             ) : (
                <>
                    {spendingEnvelopes.length > 0 && (
                        <div className="p-4">
                            <h4 className="font-semibold text-slate-700 text-md mb-4 flex items-center gap-2"><Box size={18}/> Spending Pools</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {spendingEnvelopes.map(envelope => {
                                    const spent = envelope.categoryIds.reduce((sum, catId) => sum + (spendingByCategoryIdInPeriod[catId] || 0), 0);
                                    const adjustedBudget = getAdjustedBudget(envelope.budget, period, dateRange);
                                    const remaining = adjustedBudget - spent;
                                    const progress = adjustedBudget > 0 ? Math.min((spent / adjustedBudget) * 100, 100) : 0;
                                    const spentPercentage = adjustedBudget > 0 ? Math.round((spent / adjustedBudget) * 100) : 0;
                                    const isOverBudget = remaining < 0;
                                    
                                    return (
                                        <div key={envelope.id} className="bg-slate-50 p-4 rounded-lg">
                                            <div className="flex justify-between items-baseline mb-2">
                                                <h4 className="font-semibold text-slate-700">{envelope.name}</h4>
                                                <p className={`text-sm font-bold ${isOverBudget ? 'text-red-500' : 'text-slate-600'}`}>
                                                    {isOverBudget ? `Over by ${currencyFormatter.format(Math.abs(remaining))}` : `${currencyFormatter.format(remaining)} left`}
                                                </p>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-4 relative overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : 'bg-gradient-to-r from-blue-400 to-primary'}`} 
                                                    style={{width: `${progress}%`}}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1 text-right">
                                                {currencyFormatter.format(spent)} of {currencyFormatter.format(adjustedBudget)} ({spentPercentage}%)
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                    {goalEnvelopes.length > 0 && (
                         <div className={`p-4 ${spendingEnvelopes.length > 0 ? 'border-t border-slate-200' : ''}`}>
                             <h4 className="font-semibold text-slate-700 text-md mb-4 flex items-center gap-2"><Target size={18}/> Saving Goals</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {goalEnvelopes.map(envelope => {
                                    const contributedFromTransactions = envelope.categoryIds.reduce((sum, catId) => sum + (contributionsByCategoryIdAllTime[catId] || 0), 0);
                                    const contributedAllTime = (envelope.startingAmount || 0) + contributedFromTransactions;
                                    const contributedInPeriod = envelope.categoryIds.reduce((sum, catId) => sum + (contributionsByCategoryIdInPeriod[catId] || 0), 0);
                                    
                                    // The contribution goal, adjusted for the selected period. `envelope.budget` is the monthly goal.
                                    const contributionGoalForPeriod = getAdjustedBudget(envelope.budget, period, dateRange);
                                    
                                    // Progress for the current period's contribution goal.
                                    const periodProgress = contributionGoalForPeriod > 0 ? Math.min((contributedInPeriod / contributionGoalForPeriod) * 100, 100) : 0;
                                    const isPeriodGoalMet = contributedInPeriod >= contributionGoalForPeriod;

                                    // Overall progress if a final target is set.
                                    const overallProgress = envelope.finalTarget && envelope.finalTarget > 0 ? Math.min((contributedAllTime / envelope.finalTarget) * 100, 100) : 0;
                                    const isFinalGoalMet = envelope.finalTarget ? contributedAllTime >= envelope.finalTarget : false;

                                    return (
                                        <div key={envelope.id} className="bg-slate-50 p-4 rounded-lg">
                                            <div className="flex justify-between items-baseline mb-2">
                                                <h4 className="font-semibold text-slate-700">{envelope.name}</h4>
                                                <p className={`text-sm font-bold ${isPeriodGoalMet ? 'text-green-600' : 'text-slate-600'}`}>
                                                    {isPeriodGoalMet && contributionGoalForPeriod > 0
                                                        ? `${currencyFormatter.format(contributedInPeriod)} Contributed`
                                                        : `${currencyFormatter.format(Math.max(0, contributionGoalForPeriod - contributedInPeriod))} left this period`}
                                                </p>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-4 relative overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-500 ${isPeriodGoalMet ? 'bg-green-500' : 'bg-gradient-to-r from-teal-400 to-cyan-500'}`} 
                                                    style={{width: `${periodProgress}%`}}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1 text-right">
                                                {currencyFormatter.format(contributedInPeriod)} of {currencyFormatter.format(contributionGoalForPeriod)} ({Math.round(periodProgress)}%)
                                            </p>

                                            {/* Optional secondary display for the final target goal */}
                                            {envelope.finalTarget && envelope.finalTarget > 0 && (
                                                <div className="mt-3">
                                                    <div className="flex justify-between items-baseline text-xs text-slate-500 mb-1">
                                                        <span>Overall Goal</span>
                                                        <span className="font-semibold">{isFinalGoalMet ? 'Complete!' : `${currencyFormatter.format(contributedAllTime)} of ${currencyFormatter.format(envelope.finalTarget)}`}</span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 rounded-full h-2 relative overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-500 ${isFinalGoalMet ? 'bg-green-500' : 'bg-gradient-to-r from-blue-400 to-primary'}`} 
                                                            style={{width: `${overallProgress}%`}}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                         </div>
                    )}
                </>
             )}
        </Card>
    );
};
