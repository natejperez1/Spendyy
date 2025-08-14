
import React, { useState, useEffect } from 'react';
import { Transaction } from '../../types';
import { Modal } from '../ui';

export const EditTransactionModal: React.FC<{
    transaction: Transaction | null;
    onSave: (transaction: Transaction) => void;
    onClose: () => void;
}> = ({ transaction, onSave, onClose }) => {
    const [amount, setAmount] = useState<number>(0);
    const [originalAmount, setOriginalAmount] = useState<number>(0);
    
    useEffect(() => {
        if(transaction) {
            setAmount(transaction.amount);
            setOriginalAmount(transaction.amount);
        }
    }, [transaction]);

    if (!transaction) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...transaction, amount: Number(amount) });
        onClose();
    };

    const handleQuickSplit = (percentage: number) => {
        setAmount(Number((originalAmount * percentage).toFixed(2)));
    };
    
    return (
        <Modal isOpen={!!transaction} onClose={onClose} title="Edit Transaction Amount">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="editAmount" className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">$</span>
                        <input
                            id="editAmount"
                            type="number"
                            value={amount}
                            onChange={e => setAmount(Number(e.target.value))}
                            required
                            min="0"
                            step="0.01"
                            className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition"
                        />
                    </div>
                     <p className="text-xs text-slate-500 mt-2">Editing amount for: <span className="font-medium">{transaction.payee}</span></p>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">Quick Split (Sets amount to % of original)</label>
                    <div className="flex gap-2">
                        {[0.25, 0.5, 0.75].map(pct => (
                             <button type="button" key={pct} onClick={() => handleQuickSplit(pct)} className="flex-1 py-2 text-sm font-semibold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
                                I paid {pct * 100}%
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark">Save Changes</button>
                </div>
            </form>
        </Modal>
    );
};
