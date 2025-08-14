
import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sector, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Transaction, Category, Envelope } from '../../types';
import { Card } from '../ui';
import { PieChart as PieChartIcon, Dot, BarChart2 } from 'lucide-react';
import { currencyFormatter } from '../../utils';
import { CATEGORY_COLORS } from '../../constants';

type ChartType = 'pie' | 'focus' | 'radar';

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

export const IncomeEnvelopeBreakdown: React.FC<{
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
