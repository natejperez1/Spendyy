
import React, { useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Layer, Sector, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Transaction, Category, Envelope, Period, WidgetVisibility } from '../types';
import { Card, Modal } from './ui';
import { DollarSign, ReceiptText, ArrowUpRight, ArrowDownLeft, ArrowLeft, ArrowRight, Wallet, TrendingUp, Target, Box, ArrowRightLeft, PieChart as PieChartIcon, SlidersHorizontal, BarChart2, Dot, GitCommitHorizontal, BarChart3, Spline } from 'lucide-react';
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
    range: { start: Date, end: Date },
    onCustomize: () => void;
}> = ({ period, setPeriod, onNav, range, onCustomize }) => (
    <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h3 className="text-lg font-semibold text-slate-800">Dashboard</h3>
            <div className="flex items-center gap-2 flex-wrap">
                <select value={period} onChange={e => setPeriod(e.target.value as Period)} className="text-sm px-2 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition bg-white">
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                </select>
                <button onClick={() => onNav('prev')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-md"><ArrowLeft size={18}/></button>
                <span className="text-sm font-medium text-slate-600 w-44 text-center">{formatPeriod(period, range)}</span>
                <button onClick={() => onNav('next')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-md"><ArrowRight size={18}/></button>
                <button onClick={onCustomize} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 hover:text-primary transition-colors ml-4" title="Customize Dashboard Widgets">
                    <SlidersHorizontal size={16} />
                    <span>Customize</span>
                </button>
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

const renderFocusShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
        <g>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 6}
                outerRadius={outerRadius + 10}
                fill={fill}
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
        <Card className="p-0">
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
        <Card className="lg:col-span-2 p-0">
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

type ChartType = 'pie' | 'focus' | 'radar';

const IncomeEnvelopeBreakdown: React.FC<{
    transactions: Transaction[], 
    categories: Category[], 
    envelopes: Envelope[]
}> = ({ transactions, categories, envelopes }) => {
    const [chartType, setChartType] = useState<ChartType>('pie');
    const [activeIndex, setActiveIndex] = useState(-1);

    const chartData = useMemo(() => {
        const incomeCategory = categories.find(c => c.name === 'Income');
        if (!incomeCategory) return { data: [], totalIncome: 0 };

        const totalIncome = transactions
            .filter(t => t.categoryId === incomeCategory.id)
            .reduce((sum, t) => sum + t.amount, 0);

        if (totalIncome === 0) return { data: [], totalIncome: 0 };

        const transferCategoryIds = new Set(categories.filter(c => c.isTransfer).map(c => c.id));
        let totalAllocated = 0;

        const envelopeBreakdown = envelopes.map(envelope => {
            let envelopeValue = 0;
            if (envelope.type === 'spending') {
                // Sum of debits in categories linked to this spending pool
                envelopeValue = transactions
                    .filter(t => t.type === 'Debit' && envelope.categoryIds.includes(t.categoryId) && !transferCategoryIds.has(t.categoryId))
                    .reduce((sum, t) => sum + t.amount, 0);
            } else { // 'goal'
                // Sum of contributions to this saving goal
                envelopeValue = transactions
                    .filter(t => envelope.categoryIds.includes(t.categoryId))
                    .reduce((sum, t) => {
                        const isTransfer = transferCategoryIds.has(t.categoryId);
                        // A debit to a transfer category is a contribution
                        if (isTransfer && t.type === 'Debit') {
                            return sum + t.amount;
                        }
                        // A credit to a non-transfer, non-income category is also a contribution (e.g. saving from a refund)
                        else if (!isTransfer && t.type === 'Credit' && t.categoryId !== incomeCategory.id) {
                            return sum + t.amount;
                        }
                        return sum;
                    }, 0);
            }

            totalAllocated += envelopeValue;
            return { name: envelope.name, value: envelopeValue };
        }).filter(e => e.value > 0);

        const unallocated = totalIncome - totalAllocated;
        if (unallocated > 0.01) { // Use a small threshold to avoid floating point issues
            envelopeBreakdown.push({ name: 'Unallocated', value: unallocated });
        }
        
        // Add colors
        const finalData = envelopeBreakdown.map((item, index) => ({
            ...item,
            color: item.name === 'Unallocated' ? '#a1a1aa' : CATEGORY_COLORS[index % CATEGORY_COLORS.length]
        }));
        
        return { data: finalData, totalIncome };

    }, [transactions, categories, envelopes]);

    const { data, totalIncome } = chartData;
    
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
        const percentOfTotal = totalIncome > 0 ? (value / totalIncome) * 100 : 0;
        if (percentOfTotal < 5) return null; // Don't render label for small slices
        
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold pointer-events-none">
                {`${percentOfTotal.toFixed(0)}%`}
            </text>
        );
    };

    const PatchedPie = Pie as any;
    
    const radarChartData = useMemo(() => data.map(item => ({
        subject: item.name,
        percentage: totalIncome > 0 ? (item.value / totalIncome) * 100 : 0,
        dollarValue: item.value,
        fullMark: 100, // The axis now goes up to 100
    })), [data, totalIncome]);
    
    const CHART_OPTIONS: { id: ChartType, label: string, icon: React.ReactNode }[] = [
        { id: 'pie', label: 'Pie', icon: <PieChartIcon size={16} /> },
        { id: 'focus', label: 'Focus', icon: <Dot size={16} /> },
        { id: 'radar', label: 'Radar', icon: <BarChart2 size={16} /> },
    ];

    const renderChart = () => {
        switch(chartType) {
            case 'focus':
                return (
                    <PieChart onMouseLeave={() => setActiveIndex(-1)}>
                        <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" fill="#9ca3af" className="text-sm">Total Income</text>
                        <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" fill="#1f2937" className="text-xl font-bold">
                            {currencyFormatter.format(totalIncome)}
                        </text>
                        <PatchedPie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            activeIndex={activeIndex}
                            activeShape={renderFocusShape}
                            onMouseEnter={(_:any, index:number) => setActiveIndex(index)}
                        >
                            {data.map((entry) => <Cell key={`cell-${entry.name}`} fill={entry.color} />)}
                        </PatchedPie>
                        <Tooltip formatter={(value: number, name: string) => [`${currencyFormatter.format(value)} (${(value / totalIncome * 100).toFixed(1)}%)`, name]} />
                        <Legend />
                    </PieChart>
                );
            case 'radar':
                return (
                     <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tickFormatter={(v) => `${v}%`}/>
                        <Radar name="Allocation" dataKey="percentage" stroke="#667eea" fill="#667eea" fillOpacity={0.6} />
                        <Tooltip 
                            formatter={(value, name, props) => {
                                const { dollarValue } = props.payload;
                                return [
                                    `${currencyFormatter.format(dollarValue)} (${Number(value).toFixed(1)}%)`,
                                    name
                                ];
                            }}
                            labelFormatter={(label) => <span className="font-bold">{label}</span>}
                        />
                     </RadarChart>
                );
            case 'pie':
            default:
                 return (
                    <PieChart>
                        <PatchedPie
                            data={data} 
                            dataKey="value" 
                            nameKey="name" 
                            cx="50%" 
                            cy="50%" 
                            outerRadius={100} 
                            labelLine={false}
                            label={renderCustomizedLabel}
                        >
                            {data.map((entry) => <Cell key={`cell-${entry.name}`} fill={entry.color} stroke={entry.color} />)}
                        </PatchedPie>
                        <Tooltip formatter={(value: number, name: string) => [`${currencyFormatter.format(value)} (${(value / totalIncome * 100).toFixed(1)}%)`, name]} />
                        <Legend />
                    </PieChart>
                );
        }
    };

    return (
        <Card className="p-0">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <PieChartIcon size={20}/> Income to Envelope Breakdown
                </h3>
                 <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1">
                     {CHART_OPTIONS.map(opt => (
                         <button key={opt.id} onClick={() => setChartType(opt.id)}
                           className={`flex items-center gap-2 capitalize px-3 py-1 text-sm font-medium rounded-md transition-colors ${chartType === opt.id ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>
                             {opt.icon}
                             <span>{opt.label}</span>
                         </button>
                     ))}
                 </div>
            </div>
            <div className="p-4">
                {totalIncome > 0 && data.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        {renderChart()}
                    </ResponsiveContainer>
                ) : <div className="h-[300px] flex items-center justify-center text-slate-500 text-center">No income data for this period to break down.</div>}
            </div>
        </Card>
    );
};

type SpendingViewType = 'focus' | 'gauge';

const GaugeBar: React.FC<{
    name: string;
    spent: number;
    budget: number;
}> = ({ name, spent, budget }) => {
    const progress = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
    const spentPercentage = budget > 0 ? Math.round((spent / budget) * 100) : 0;
    const isOver = spent > budget;
    
    return (
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex justify-between items-baseline mb-1">
                <h4 className="font-semibold text-sm text-slate-700">{name}</h4>
                <p className={`text-xs font-bold ${isOver ? 'text-red-500' : 'text-slate-500'}`}>
                    {spentPercentage}% used
                </p>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3.5 relative overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-gradient-to-r from-blue-400 to-primary'}`} 
                    style={{width: `${progress}%`}}
                ></div>
            </div>
            <p className="text-xs text-slate-500 mt-1 text-right">
                {currencyFormatter.format(spent)} of {currencyFormatter.format(budget)}
            </p>
        </div>
    );
};

const WeekdayWeekendSpendCard: React.FC<{
    transactions: Transaction[],
    envelopes: Envelope[],
    categories: Category[],
    period: Period,
    dateRange: {start: Date, end: Date}
}> = ({ transactions, envelopes, categories, period, dateRange }) => {
    const [viewType, setViewType] = useState<SpendingViewType>('focus');
    const [activeIndexWeekday, setActiveIndexWeekday] = useState(-1);
    const [activeIndexWeekend, setActiveIndexWeekend] = useState(-1);

    const transferCategoryIds = useMemo(() => new Set(categories.filter(c => c.isTransfer).map(c => c.id)), [categories]);
    const incomeCategoryId = useMemo(() => categories.find(c => c.name === 'Income')?.id, [categories]);
    
    const PatchedPie = Pie as any;

    const spendingData = useMemo(() => {
        const spendingEnvelopes = envelopes.filter(e => e.type === 'spending');
        if (spendingEnvelopes.length === 0) {
            return { weekday: { total: 0, data: [] }, weekend: { total: 0, data: [] } };
        }

        const spendingCategoryToEnvelopeMap = new Map<string, Envelope>();
        spendingEnvelopes.forEach(env => {
            env.categoryIds.forEach(catId => {
                spendingCategoryToEnvelopeMap.set(catId, env);
            });
        });

        const weekdaySpendByEnvelope: Record<string, number> = {};
        const weekendSpendByEnvelope: Record<string, number> = {};

        transactions.forEach(t => {
            const envelope = spendingCategoryToEnvelopeMap.get(t.categoryId);
            if (!envelope || t.type !== 'Debit' || transferCategoryIds.has(t.categoryId) || t.categoryId === incomeCategoryId) {
                return;
            }
            
            const dayOfWeek = new Date(t.date + "T00:00:00").getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            if (isWeekend) {
                weekendSpendByEnvelope[envelope.id] = (weekendSpendByEnvelope[envelope.id] || 0) + t.amount;
            } else {
                weekdaySpendByEnvelope[envelope.id] = (weekdaySpendByEnvelope[envelope.id] || 0) + t.amount;
            }
        });

        const processSpendData = (spendMap: Record<string, number>) => {
            const data = spendingEnvelopes.map((env, index) => {
                const spent = spendMap[env.id] || 0;
                if (spent < 0.01) return null;
                const weeklyBudget = getAdjustedBudget(env.budget, 'week', dateRange);
                return {
                    name: env.name,
                    value: spent,
                    budget: weeklyBudget,
                    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                };
            }).filter(Boolean) as { name: string; value: number; budget: number; color: string; }[];
            
            const total = data.reduce((sum, item) => sum + item.value, 0);
            return { total, data };
        };

        return {
            weekday: processSpendData(weekdaySpendByEnvelope),
            weekend: processSpendData(weekendSpendByEnvelope),
        };

    }, [transactions, envelopes, categories, dateRange, transferCategoryIds, incomeCategoryId]);

    if (period !== 'week') {
        return (
            <Card className="p-0 lg:col-span-2">
                 <div className="p-4 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2"><Spline size={20}/> Weekday vs. Weekend Spending</h3>
                </div>
                <div className="h-[200px] flex items-center justify-center text-slate-500">
                    Switch to 'Week' view to visualize this data.
                </div>
            </Card>
        );
    }
    
    const VIEW_OPTIONS: { id: SpendingViewType, label: string, icon: React.ReactNode }[] = [
        { id: 'focus', label: 'Focus', icon: <PieChartIcon size={16} /> },
        { id: 'gauge', label: 'Gauge', icon: <BarChart3 size={16} /> },
    ];
    
    const { weekday, weekend } = spendingData;

    return (
        <Card className="p-0 lg:col-span-2">
             <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2"><Spline size={20}/> Weekday vs. Weekend Spending</h3>
                 <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1">
                     {VIEW_OPTIONS.map(opt => (
                         <button key={opt.id} onClick={() => setViewType(opt.id)}
                           className={`flex items-center gap-2 capitalize px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewType === opt.id ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>
                             {opt.icon}
                             <span>{opt.label}</span>
                         </button>
                     ))}
                 </div>
            </div>
            <div className="p-4">
            {viewType === 'focus' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {([['Weekday', weekday, activeIndexWeekday, setActiveIndexWeekday], ['Weekend', weekend, activeIndexWeekend, setActiveIndexWeekend]] as const).map(([title, spendData, activeIndex, setActiveIndex]) => (
                        <div key={title}>
                             <h4 className="font-semibold text-slate-700 text-center mb-2">{title}</h4>
                             {spendData.data.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart onMouseLeave={() => setActiveIndex(-1)}>
                                        <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" fill="#9ca3af" className="text-sm">Total Spent</text>
                                        <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" fill="#1f2937" className="text-xl font-bold">
                                            {currencyFormatter.format(spendData.total)}
                                        </text>
                                        <PatchedPie
                                            data={spendData.data}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            activeIndex={activeIndex}
                                            activeShape={renderFocusShape}
                                            onMouseEnter={(_:any, index:number) => setActiveIndex(index)}
                                        >
                                            {spendData.data.map((entry) => <Cell key={`cell-${entry.name}`} fill={entry.color} />)}
                                        </PatchedPie>
                                        <Tooltip formatter={(value: number, name: string, props: any) => {
                                            const { budget } = props.payload;
                                            const percentage = budget > 0 ? (value / budget * 100).toFixed(0) : 0;
                                            return [`${currencyFormatter.format(value)} (${percentage}% of envelope)`, name];
                                        }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <div className="h-[250px] flex items-center justify-center text-slate-500">No spending data.</div>}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div>
                         <h4 className="font-semibold text-slate-700 text-center mb-4">Weekday</h4>
                         <div className="space-y-4">
                            {weekday.data.length > 0 ? weekday.data.map(d => <GaugeBar key={d.name} name={d.name} spent={d.value} budget={d.budget} />) : <p className="text-center text-slate-500">No spending data.</p>}
                         </div>
                    </div>
                    <div>
                         <h4 className="font-semibold text-slate-700 text-center mb-4">Weekend</h4>
                         <div className="space-y-4">
                            {weekend.data.length > 0 ? weekend.data.map(d => <GaugeBar key={d.name} name={d.name} spent={d.value} budget={d.budget} />) : <p className="text-center text-slate-500">No spending data.</p>}
                         </div>
                    </div>
                </div>
            )}
            </div>
        </Card>
    );
};


const WIDGETS_CONFIG = [
    { id: 'stats', name: 'Key Insights', icon: <DollarSign size={20}/> },
    { id: 'envelopes', name: 'Envelope Summary', icon: <Wallet size={20}/> },
    { id: 'weekdayWeekendSpend', name: 'Weekday vs. Weekend', icon: <Spline size={20} />},
    { id: 'spendingPie', name: 'Spending by Category', icon: <PieChartIcon size={20}/> },
    { id: 'incomeBreakdown', name: 'Income to Envelope Breakdown', icon: <PieChartIcon size={20}/> },
    { id: 'trends', name: 'Spending Trends', icon: <TrendingUp size={20}/> },
];

const CustomizeDashboardModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    visibility: WidgetVisibility,
    setVisibility: (v: WidgetVisibility) => void,
}> = ({ isOpen, onClose, visibility, setVisibility }) => {

    const handleToggle = (id: keyof WidgetVisibility) => {
        setVisibility({ ...visibility, [id]: !visibility[id] });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Customize Dashboard Widgets">
             <style>{`.toggle-checkbox:checked { right: 0; border-color: #667eea; } .toggle-checkbox:checked + .toggle-label { background-color: #667eea; }`}</style>
            <div className="space-y-4">
                <p className="text-sm text-slate-600">Select which widgets to show on your dashboard.</p>
                {WIDGETS_CONFIG.map(widget => (
                     <div key={widget.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <label htmlFor={`toggle-${widget.id}`} className="flex items-center gap-3 font-medium text-slate-700 cursor-pointer">
                            {widget.icon}
                            {widget.name}
                        </label>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input 
                                type="checkbox" 
                                id={`toggle-${widget.id}`}
                                checked={visibility[widget.id as keyof WidgetVisibility]}
                                onChange={() => handleToggle(widget.id as keyof WidgetVisibility)}
                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                            />
                            <label htmlFor={`toggle-${widget.id}`} className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-300 cursor-pointer"></label>
                        </div>
                    </div>
                ))}
            </div>
             <div className="flex justify-end mt-6">
                <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark">Done</button>
            </div>
        </Modal>
    );
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
