
import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sector } from 'recharts';
import { Transaction, Category } from '../../types';
import { Card } from '../ui';
import { currencyFormatter } from '../../utils';

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

export const SpendingPieChart: React.FC<{transactions: Transaction[], categories: Category[]}> = ({transactions, categories}) => {
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
