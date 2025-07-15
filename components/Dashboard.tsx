
import React, { useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Layer, Sector } from 'recharts';
import { Transaction, Category, Envelope, Period } from '../types';
import { Card } from './ui';
import { DollarSign, ReceiptText, ArrowUpRight, ArrowDownLeft, ArrowLeft, ArrowRight, Wallet, TrendingUp, Target, Box, ArrowRightLeft } from 'lucide-react';
import { CATEGORY_COLORS } from '../constants';

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

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

const useDashboardFilter = (initialPeriod: Period = 'month', allTransactions: Transaction[]) => {
    const [period, setPeriod] = useState<Period>(initialPeriod);

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
        const newDate = new Date(targetDate);
        const increment = direction === 'next' ? 1 : -1;
        if (period === 'day') newDate.setDate(newDate.getDate() + increment);
        else if (period === 'week') newDate.setDate(newDate.getDate() + (7 * increment));
        else if (period === 'month') {
            newDate.setDate(1); // Avoids skipping months on uneven month lengths
            newDate.setMonth(newDate.getMonth() + increment);
        }
        else if (period === 'year') newDate.setFullYear(newDate.getFullYear() + increment);
        setTargetDate(newDate);
    };
    
    const filterTransactions = (transactions: Transaction[]) => transactions.filter(t => {
        const tDate = new Date(t.date); // Assumes YYYY-MM-DD which is parsed as UTC midnight
        // To compare correctly, create Date objects in a consistent manner
        const transactionDate = new Date(t.date + "T00:00:00");
        return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
    });

    return { period, setPeriod, dateRange, handleNav, filterTransactions };
};

const DashboardHeader: React.FC<{
    period: Period,
    setPeriod: (p: Period) => void,
    onNav: (dir: 'prev' | 'next') => void,
    range: { start: Date, end: Date }
}> = ({ period, setPeriod, onNav, range }) => (
    <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-800">Dashboard Filter</h3>
            <div className="flex items-center gap-2">
                <select value={period} onChange={e => setPeriod(e.target.value as Period)} className="text-sm px-2 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition bg-white">
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                </select>
                <button onClick={() => onNav('prev')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-md"><ArrowLeft size={18}/></button>
                <span className="text-sm font-medium text-slate-600 w-44 text-center">{formatPeriod(period, range)}</span>
                <button onClick={() => onNav('next')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-md"><ArrowRight size={18}/></button>
            </div>
        </div>
    </Card>
);


const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="flex items-center p-4">
        <div className={`p-3 rounded-full mr-4 ${color}`}>{icon}</div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

const StatsGroup: React.FC<{transactions: Transaction[], categories: Category[]}> = ({transactions, categories}) => {
    const stats = useMemo(() => {
        const incomeCategory = categories.find(c => c.name === 'Income');
        const incomeCategoryId = incomeCategory ? incomeCategory.id : null;
        const transferCategoryIds = new Set(categories.filter(c => c.isTransfer).map(c => c.id));

        let income = 0;
        let expenses = 0;

        transactions.forEach(t => {
            if (transferCategoryIds.has(t.categoryId)) {
                return; // Skip transfer transactions
            }

            if (t.categoryId === incomeCategoryId) {
                income += t.amount;
            } else {
                if (t.type === 'Credit') {
                    expenses -= t.amount; // A credit to a spending category is a refund, reducing expense
                } else { // Debit
                    expenses += t.amount;
                }
            }
        });

        return { income, expenses, net: income - expenses, count: transactions.length };
    }, [transactions, categories]);

    return (
        <Card className="p-0">
            <div className="p-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">Key Insights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2 p-4">
                <StatCard title="Income" value={currencyFormatter.format(stats.income)} icon={<ArrowUpRight size={24} className="text-white"/>} color="bg-accent-income" />
                <StatCard title="Expenses" value={currencyFormatter.format(stats.expenses)} icon={<ArrowDownLeft size={24} className="text-white"/>} color="bg-accent-expense" />
                <StatCard title="Net" value={currencyFormatter.format(stats.net)} icon={<DollarSign size={24} className="text-white"/>} color="bg-blue-500" />
                <StatCard title="Transactions" value={String(stats.count)} icon={<ReceiptText size={24} className="text-white"/>} color="bg-purple-500" />
            </div>
        </Card>
    );
};

const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

    return (
        <g>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 8}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                stroke={fill}
                strokeWidth={1}
            />
        </g>
    );
};


const SpendingPieChart: React.FC<{transactions: Transaction[], categories: Category[]}> = ({transactions, categories}) => {
    const [activeIndex, setActiveIndex] = useState<number>(-1);
    
    const spendingByCategory = useMemo(() => {
        const incomeCategory = categories.find(c => c.name === 'Income');
        const incomeCategoryId = incomeCategory ? incomeCategory.id : null;
        const transferCategoryIds = new Set(categories.filter(c => c.isTransfer).map(c => c.id));

        const categorySpend: { [key: string]: number } = {};
        transactions.forEach(t => {
            if (t.categoryId !== incomeCategoryId && !transferCategoryIds.has(t.categoryId) && t.type === 'Debit') {
                const currentSpend = categorySpend[t.categoryId] || 0;
                categorySpend[t.categoryId] = parseFloat((currentSpend + t.amount).toFixed(2));
            }
        });
        return Object.entries(categorySpend)
            .map(([categoryId, amount]) => {
                const category = categories.find(c => c.id === categoryId);
                return { name: category?.name || 'Uncategorized', value: amount, color: category?.color || '#78716c' };
            })
            .filter(item => item.value > 0).sort((a, b) => b.value - a.value);
    }, [transactions, categories]);

    const onPieEnter = (_:any, index: number) => {
        setActiveIndex(index);
    };
    
    const onPieLeave = () => {
        setActiveIndex(-1);
    };
    
    const PatchedPie = Pie as any;

    return (
        <Card className="lg:col-span-2 p-0">
             <div className="p-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">Spending by Category</h3>
            </div>
            <div className="p-4">
                {spendingByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart onMouseLeave={onPieLeave}>
                            <PatchedPie
                                data={spendingByCategory} 
                                dataKey="value" 
                                nameKey="name" 
                                cx="50%" 
                                cy="50%" 
                                outerRadius={80} 
                                onMouseEnter={onPieEnter}
                                activeIndex={activeIndex}
                                activeShape={renderActiveShape}
                            >
                                {spendingByCategory.map((entry) => <Cell key={`cell-${entry.name}`} fill={entry.color} stroke={entry.color} />)}
                            </PatchedPie>
                            <Tooltip formatter={(value: number) => currencyFormatter.format(value)} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                ) : <div className="h-[300px] flex items-center justify-center text-slate-500">No expense data for this period.</div>}
            </div>
        </Card>
    );
};

const getWeekDateRangeLabel = (date: Date): string => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay()); // Sunday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday

    const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${startOfWeek.toLocaleDateString('en-US', formatOptions)} - ${endOfWeek.toLocaleDateString('en-US', formatOptions)}`;
};

const SpendingTrendsChart: React.FC<{
    transactions: Transaction[], 
    categories: Category[], 
    envelopes: Envelope[], 
    period: Period,
    dateRange: { start: Date, end: Date }
}> = ({ transactions, categories, envelopes, period }) => {
    const [trendBy, setTrendBy] = useState<'total' | 'category' | 'envelope'>('total');
    const incomeCategoryId = useMemo(() => categories.find(c => c.name === 'Income')?.id, [categories]);
    const transferCategoryIds = useMemo(() => new Set(categories.filter(c => c.isTransfer).map(c => c.id)), [categories]);

    const trendData = useMemo(() => {
        const expenseTransactions = transactions.filter(t => 
            t.type === 'Debit' && 
            t.categoryId !== incomeCategoryId &&
            !transferCategoryIds.has(t.categoryId)
        );
        if (expenseTransactions.length === 0) return { data: [], keys: [] };

        const getGroupKey = (date: Date): string => {
            switch(period) {
                case 'year': return date.toLocaleString('default', { month: 'short' });
                case 'month': return getWeekDateRangeLabel(date);
                case 'week': return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                case 'day':
                    const category = categories.find(c => c.id === expenseTransactions[0].categoryId);
                    return category?.name || 'Uncategorized'; // This case is different, it groups by category/envelope for a single day
                default: return '';
            }
        };

        const groupedData = new Map<string, any>();
        const allKeys = new Set<string>();

        for (const t of expenseTransactions) {
            const date = new Date(t.date + "T00:00:00");
            const groupKey = period === 'day' ? 'Today' : getGroupKey(date);
            
            if (!groupedData.has(groupKey)) groupedData.set(groupKey, { name: groupKey });

            const group = groupedData.get(groupKey);

            if (trendBy === 'total') {
                group.Spending = (group.Spending || 0) + t.amount;
                allKeys.add('Spending');
            } else if (trendBy === 'category') {
                const category = categories.find(c => c.id === t.categoryId) || { name: 'Uncategorized' };
                group[category.name] = (group[category.name] || 0) + t.amount;
                allKeys.add(category.name);
            } else if (trendBy === 'envelope') {
                 const relevantEnvelopes = envelopes.filter(e => e.type === 'spending' && e.categoryIds.includes(t.categoryId));
                 if (relevantEnvelopes.length === 0) {
                     group['No Envelope'] = (group['No Envelope'] || 0) + t.amount;
                     allKeys.add('No Envelope');
                 } else {
                    relevantEnvelopes.forEach(env => {
                        group[env.name] = (group[env.name] || 0) + t.amount;
                        allKeys.add(env.name);
                    });
                 }
            }
        }
        
        if (period === 'day' && trendBy !== 'total') {
            const dailySummary = new Map<string, any>();
            for(const t of expenseTransactions) {
                if (trendBy === 'category') {
                    const category = categories.find(c => c.id === t.categoryId) || { name: 'Uncategorized' };
                    dailySummary.set(category.name, { name: category.name, Spending: (dailySummary.get(category.name)?.Spending || 0) + t.amount });
                    allKeys.add(category.name);
                } else { // envelope
                    const relevantEnvelopes = envelopes.filter(e => e.type === 'spending' && e.categoryIds.includes(t.categoryId));
                    if(relevantEnvelopes.length === 0) {
                         dailySummary.set('No Envelope', { name: 'No Envelope', Spending: (dailySummary.get('No Envelope')?.Spending || 0) + t.amount });
                         allKeys.add('No Envelope');
                    } else {
                        relevantEnvelopes.forEach(env => {
                            dailySummary.set(env.name, { name: env.name, Spending: (dailySummary.get(env.name)?.Spending || 0) + t.amount });
                            allKeys.add(env.name);
                        });
                    }
                }
            }
             return { data: Array.from(dailySummary.values()), keys: ['Spending'] };
        }

        const dataArray = Array.from(groupedData.values());
        const sortByNameAsDate = (a: any, b: any) => new Date(a.name.split(' - ')[0]).getTime() - new Date(b.name.split(' - ')[0]).getTime();
        
        if (period === 'year') {
            const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            dataArray.sort((a,b) => monthOrder.indexOf(a.name) - monthOrder.indexOf(b.name));
        } else if (period === 'week' || period === 'month') {
            dataArray.sort(sortByNameAsDate);
        }

        return { data: dataArray, keys: Array.from(allKeys) };
    }, [transactions, categories, envelopes, period, trendBy, incomeCategoryId, transferCategoryIds]);
    
    return (
        <Card className="lg:col-span-3 p-0">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                 <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2"><TrendingUp size={20}/> Spending Trends</h3>
                 <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1">
                     {(['total', 'category', 'envelope'] as const).map(opt => (
                         <button key={opt} onClick={() => setTrendBy(opt)}
                           className={`capitalize px-3 py-1 text-sm font-medium rounded-md transition-colors ${trendBy === opt ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>
                             {opt}
                         </button>
                     ))}
                 </div>
            </div>
            <div className="p-4">
                {trendData.data.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={trendData.data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{fontSize: 12}} />
                            <YAxis tickFormatter={(value: number) => currencyFormatter.format(value).replace(/\.00$/, '')} />
                            <Tooltip formatter={(value: number) => currencyFormatter.format(value)} />
                            <Legend iconSize={10} wrapperStyle={{fontSize: "12px"}}/>
                            {trendData.keys.length === 1 && trendData.keys[0] === 'Spending' ? (
                                <Bar dataKey="Spending" fill="#667eea" />
                            ) : (
                                trendData.keys.map((key, index) => (
                                    <Bar key={key} dataKey={key} stackId="a" fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                                ))
                            )}
                        </BarChart>
                    </ResponsiveContainer>
                ) : <div className="h-[300px] flex items-center justify-center text-slate-500">No trend data for this period.</div>}
            </div>
        </Card>
    );
};

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

const EnvelopesSummary: React.FC<{ 
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

    // For saving goals, we track contributions from ALL transactions, over all time.
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

    const spendingEnvelopes = useMemo(() => envelopes.filter(e => e.type === 'spending'), [envelopes]);
    const goalEnvelopes = useMemo(() => envelopes.filter(e => e.type === 'goal'), [envelopes]);

    return (
        <Card className="lg:col-span-5 p-0">
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
                                    const contributed = envelope.categoryIds.reduce((sum, catId) => sum + (contributionsByCategoryIdAllTime[catId] || 0), 0);
                                    const goalTarget = envelope.budget;
                                    const progress = goalTarget > 0 ? Math.min((contributed / goalTarget) * 100, 100) : 0;
                                    const isComplete = contributed >= goalTarget;

                                    return (
                                        <div key={envelope.id} className="bg-slate-50 p-4 rounded-lg">
                                            <div className="flex justify-between items-baseline mb-2">
                                                <h4 className="font-semibold text-slate-700">{envelope.name}</h4>
                                                 <p className={`text-sm font-bold ${isComplete ? 'text-green-600' : 'text-slate-600'}`}>
                                                    {isComplete ? 'Goal Reached!' : `${currencyFormatter.format(Math.max(0, goalTarget - contributed))} to go`}
                                                </p>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-4 relative overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-gradient-to-r from-teal-400 to-cyan-500'}`} 
                                                    style={{width: `${progress}%`}}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1 text-right">
                                                {currencyFormatter.format(contributed)} of {currencyFormatter.format(goalTarget)} ({Math.round(progress)}%)
                                            </p>
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

export const Dashboard: React.FC<{ transactions: Transaction[]; categories: Category[]; envelopes: Envelope[] }> = ({ transactions, categories, envelopes }) => {
    
    const { period, setPeriod, dateRange, handleNav, filterTransactions } = useDashboardFilter('month', transactions);
    
    // For display in period-based charts/stats, we use filtered transactions.
    const filteredTransactions = useMemo(() => filterTransactions(transactions), [transactions, dateRange, filterTransactions]);

    return (
        <div className="space-y-6">
            <DashboardHeader period={period} setPeriod={setPeriod} onNav={handleNav} range={dateRange} />

            <StatsGroup transactions={filteredTransactions} categories={categories} />
            
            <EnvelopesSummary 
                allTransactions={transactions} // Goals need all-time transactions
                periodTransactions={filteredTransactions} // Spending pools use filtered
                envelopes={envelopes} 
                categories={categories} 
                period={period} 
                dateRange={dateRange} 
            />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <SpendingPieChart transactions={filteredTransactions} categories={categories} />
                <SpendingTrendsChart 
                    transactions={filteredTransactions} 
                    categories={categories} 
                    envelopes={envelopes}
                    period={period}
                    dateRange={dateRange}
                />
            </div>
        </div>
    );
};
