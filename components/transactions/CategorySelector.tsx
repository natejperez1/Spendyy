
import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Transaction, Category } from '../../types';
import { ChevronDown, PlusCircle } from 'lucide-react';

export const CategorySelector: React.FC<{
    transaction: Transaction,
    category?: Category,
    categories: Category[],
    onUpdateCategory: (transactionId: string, categoryId: string) => void,
    onNewCategory: () => void,
}> = ({ transaction, category, categories, onUpdateCategory, onNewCategory }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleToggle = () => {
        if (!isOpen) {
            if (buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                setPopoverStyle({
                    position: 'fixed',
                    top: `${rect.bottom + 8}px`,
                    left: `${rect.left}px`,
                    width: '224px', // w-56
                });
            }
        }
        setIsOpen(!isOpen);
    };
    
    const popoverContent = (
        <div
            style={popoverStyle}
            className="z-50 w-56 bg-white rounded-lg shadow-xl border border-slate-200 p-2 max-h-60 overflow-y-auto"
        >
            {categories.filter(c => c.id !== 'uncategorized').map(c => (
                <button key={c.id} onClick={() => { onUpdateCategory(transaction.id, c.id); setIsOpen(false); }} className="w-full text-left flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 text-sm">
                    <span className="w-3 h-3 rounded-full" style={{backgroundColor: c.color}}></span>
                    {c.name}
                </button>
            ))}
             <button onClick={() => { onNewCategory(); setIsOpen(false); }} className="w-full text-left flex items-center gap-2 p-2 mt-1 rounded-md hover:bg-slate-100 text-sm text-primary font-medium border-t border-slate-200">
                <PlusCircle size={14} />
                Create New Category
            </button>
        </div>
    );

    return (
        <>
            <button ref={buttonRef} onClick={handleToggle} className="flex items-center gap-1 group">
                 {category ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: category.color, color: 'white' }}>
                        {category.name}
                    </span>
                ) : (
                    <span className="text-xs text-slate-400 italic">None</span>
                )}
                <ChevronDown size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            {isOpen && ReactDOM.createPortal(popoverContent, document.body)}
        </>
    );
};
