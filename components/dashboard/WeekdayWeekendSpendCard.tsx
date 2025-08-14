
import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sector } from 'recharts';
import { Transaction, Category, Envelope, Period } from '../../types';
import { Card } from '../ui';
import { PieChart as PieChartIcon, BarChart3, Spline } from 'lucide-react';
import { currencyFormatter } from '../../utils';
import { CATEGORY_COLORS } from '../../constants';

type SpendingViewType = 'focus' | 'gauge';

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

const getAdjustedBudget = (monthlyBudget: number, period: Period, range: { start: Date, end: Date }): number => {
    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    
    switch (period) {
        case 'day':
             return monthlyBudget / daysInMonth(range.start);
        case 'week':
            return (monthlyBudget / daysInMonth(range.start)) * 7;
        case 'year':
            return monthlyBudget * 12;
        case 'month':
        default:
            return monthlyBudget;
    }
};

export const WeekdayWeekendSpendCard: React.FC<{
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
