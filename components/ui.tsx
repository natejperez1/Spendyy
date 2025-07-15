import React, { ReactNode, useState } from 'react';
import { X, CheckCircle, ArrowRightLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORY_COLORS } from '../constants';
import { Category } from '../types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-800">{title}</h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const Card: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <div className={`bg-white rounded-xl shadow-md border border-slate-100 ${className}`}>
      {children}
    </div>
  );
};


export const CategoryModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    category: Category | null,
    addCategory: (category: Omit<Category, 'id'>) => void,
    updateCategory: (category: Category) => void,
}> = ({ isOpen, onClose, category, addCategory, updateCategory }) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState(CATEGORY_COLORS[0]);
    const [isTransfer, setIsTransfer] = useState(false);
    
    // Effect to reset form when modal is reopened for a new item or a different item
    React.useEffect(() => {
        if (isOpen) {
            setName(category?.name || '');
            setColor(category?.color || CATEGORY_COLORS[0]);
            setIsTransfer(category?.isTransfer || false);
        }
    }, [isOpen, category]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        const categoryData = { name, color, isTransfer };
        if (category) {
            updateCategory({ ...category, ...categoryData });
        } else {
            addCategory(categoryData);
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={category ? "Edit Category" : "Add Category"}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="categoryName" className="block text-sm font-medium text-slate-700 mb-1">Category Name</label>
                    <input id="categoryName" type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
                    <div className="grid grid-cols-6 gap-2">
                        {CATEGORY_COLORS.map(c => (
                            <button type="button" key={c} onClick={() => setColor(c)} className="w-8 h-8 rounded-full transition-transform hover:scale-110 relative" style={{backgroundColor: c}}>
                                {color === c && <CheckCircle size={16} className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={isTransfer} onChange={e => setIsTransfer(e.target.checked)} className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300" />
                        <div className="flex-grow">
                            <span className="font-medium text-slate-700">Mark as a Transfer</span>
                            <p className="text-xs text-slate-500">Select this if the category is for moving money between your own accounts (e.g., Checking to Savings). Transfers won't be counted as expenses.</p>
                        </div>
                    </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark">Save</button>
                </div>
            </form>
        </Modal>
    );
};