
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction, Category, Envelope, Period } from '../../types';
import { Card } from '../ui';
import { TrendingUp } from 'lucide-react';
import { currencyFormatter } from '../../utils';
import { CATEGORY_COLORS } from '../../constants';

const getWeekDateRangeLabel = (date: Date): string => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay()); // Sunday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday

    const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${startOfWeek.toLocaleDateString('en-US', formatOptions)} - ${endOfWeek.toLocaleDateString('en-US', formatOptions)}`;
};

export const SpendingTrendsChart: React.FC<{
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
