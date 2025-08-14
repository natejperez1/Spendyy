
import { useState, useMemo, useEffect } from 'react';
import { Transaction } from '../types';

export const useMonthlyPagination = (transactions: Transaction[]) => {
    const availableMonths = useMemo(() => {
        const yearMonthSet = new Set<string>();
        transactions.forEach(t => {
            yearMonthSet.add(t.date.substring(0, 7)); // YYYY-MM
        });
        return Array.from(yearMonthSet).sort().reverse();
    }, [transactions]);

    const [currentMonth, setCurrentMonth] = useState<string>(availableMonths[0] || new Date().toISOString().substring(0, 7));

    useEffect(() => {
        if (availableMonths.length > 0 && !availableMonths.includes(currentMonth)) {
            setCurrentMonth(availableMonths[0]);
        }
    }, [availableMonths, currentMonth]);

    const handleNav = (direction: 'prev' | 'next') => {
        const currentIndex = availableMonths.indexOf(currentMonth);
        if (currentIndex === -1) return; // Should not happen

        // 'prev' moves to an older month (next index in descending array)
        // 'next' moves to a newer month (previous index in descending array)
        const newIndex = currentIndex + (direction === 'prev' ? 1 : -1);

        if (newIndex >= 0 && newIndex < availableMonths.length) {
            setCurrentMonth(availableMonths[newIndex]);
        }
    };
    
    const paginatedTransactions = useMemo(() => {
        return transactions.filter(t => t.date.startsWith(currentMonth));
    }, [transactions, currentMonth]);

    return { availableMonths, currentMonth, setCurrentMonth, handleNav, paginatedTransactions };
};
