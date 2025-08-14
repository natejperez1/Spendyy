
import React, { useMemo } from 'react';
import { Transaction, Category } from '../../types';
import { Card } from '../ui';
import { DollarSign, ReceiptText, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { currencyFormatter } from '../../utils';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="flex items-center p-4">
        <div className={`p-3 rounded-full mr-4 ${color}`}>{icon}</div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

export const StatsGroup: React.FC<{transactions: Transaction[], categories: Category[]}> = ({transactions, categories}) => {
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
