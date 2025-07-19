import React, { useState } from 'react';
import { Category, Envelope } from '../types';
import { Card, CategoryModal, Modal } from './ui';
import { Edit, Trash2, PlusCircle, Info, Box, Target, ArrowRightLeft } from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const Management: React.FC<{
    categories: Category[];
    envelopes: Envelope[];
    addCategory: (category: Omit<Category, 'id'>) => void;
    updateCategory: (category: Category) => void;
    deleteCategory: (id: string) => void;
    addEnvelope: (envelope: Omit<Envelope, 'id'>) => void;
    updateEnvelope: (envelope: Envelope) => void;
    deleteEnvelope: (id: string) => void;
}> = (props) => {
    const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
    const [isEnvelopeModalOpen, setEnvelopeModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editingEnvelope, setEditingEnvelope] = useState<Envelope | null>(null);

    const openNewCategoryModal = () => {
        setEditingCategory(null);
        setCategoryModalOpen(true);
    };

    const openEditCategoryModal = (category: Category) => {
        setEditingCategory(category);
        setCategoryModalOpen(true);
    };
    
    const openNewEnvelopeModal = () => {
        setEditingEnvelope(null);
        setEnvelopeModalOpen(true);
    };

    const openEditEnvelopeModal = (envelope: Envelope) => {
        setEditingEnvelope(envelope);
        setEnvelopeModalOpen(true);
    };


    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoryManager {...props} onEdit={openEditCategoryModal} onNew={openNewCategoryModal} />
            <EnvelopeManager {...props} onEdit={openEditEnvelopeModal} onNew={openNewEnvelopeModal} />
            
            <CategoryModal 
                isOpen={isCategoryModalOpen} 
                onClose={() => setCategoryModalOpen(false)}
                category={editingCategory}
                addCategory={props.addCategory}
                updateCategory={props.updateCategory}
            />

            {isEnvelopeModalOpen && (
                 <EnvelopeModal 
                    isOpen={isEnvelopeModalOpen} 
                    onClose={() => setEnvelopeModalOpen(false)}
                    envelope={editingEnvelope}
                    categories={props.categories}
                    addEnvelope={props.addEnvelope}
                    updateEnvelope={props.updateEnvelope}
                />
            )}
        </div>
    );
};

const CategoryManager: React.FC<{
    categories: Category[],
    deleteCategory: (id: string) => void,
    onEdit: (category: Category) => void,
    onNew: () => void,
}> = ({ categories, deleteCategory, onEdit, onNew }) => (
    <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-800">Categories</h3>
            <button onClick={onNew} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors">
                <PlusCircle size={16} /> New Category
            </button>
        </div>
        <div className="space-y-2">
            {categories.filter(c => c.id !== 'uncategorized').map(c => {
                const isSystemCategory = c.name === 'Income';
                return (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="flex items-center gap-3 font-medium text-slate-700">
                            <span className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color }}></span>
                            {c.name}
                            {c.isTransfer && <span title="Transfer Category"><ArrowRightLeft size={14} className="text-slate-400" /></span>}
                        </span>
                        <div className="flex items-center gap-2">
                             <button 
                                onClick={() => onEdit(c)} 
                                disabled={isSystemCategory}
                                className="p-1.5 text-slate-500 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                title={isSystemCategory ? "The Income category cannot be edited." : "Edit Category"}
                            >
                                <Edit size={16} />
                            </button>
                            <button 
                                onClick={() => deleteCategory(c.id)} 
                                disabled={isSystemCategory}
                                className="p-1.5 text-slate-500 hover:text-accent-expense disabled:opacity-50 disabled:cursor-not-allowed"
                                title={isSystemCategory ? "The Income category cannot be deleted." : "Delete Category"}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>
    </Card>
);

const EnvelopeManager: React.FC<{
    envelopes: Envelope[],
    categories: Category[],
    deleteEnvelope: (id: string) => void,
    onEdit: (envelope: Envelope) => void,
    onNew: () => void,
}> = ({ envelopes, categories, deleteEnvelope, onEdit, onNew }) => (
     <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-800">Envelopes</h3>
             <button onClick={onNew} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors">
                <PlusCircle size={16} /> New Envelope
            </button>
        </div>
        <div className="space-y-3">
            {envelopes.map(e => (
                 <div key={e.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-slate-200 text-primary">
                               {e.type === 'spending' ? <Box size={18}/> : <Target size={18}/>}
                           </div>
                           <div>
                               <h4 className="font-semibold text-slate-800">{e.name}</h4>
                                <p className="text-sm text-slate-500">
                                    {e.type === 'spending' 
                                        ? `Budget: ${currencyFormatter.format(e.budget)}/mo` 
                                        : `Contribution: ${currencyFormatter.format(e.budget)}/mo`
                                    }
                                    {e.type === 'goal' && e.startingAmount ? ` | Start: ${currencyFormatter.format(e.startingAmount)}` : ''}
                                    {e.type === 'goal' && e.finalTarget ? ` | Goal: ${currencyFormatter.format(e.finalTarget)}` : ''}
                                </p>
                           </div>
                       </div>
                       <div className="flex items-center gap-2">
                           <button onClick={() => onEdit(e)} className="p-1.5 text-slate-500 hover:text-primary"><Edit size={16} /></button>
                           <button onClick={() => deleteEnvelope(e.id)} className="p-1.5 text-slate-500 hover:text-accent-expense"><Trash2 size={16} /></button>
                       </div>
                    </div>
                     <div className="mt-2 flex flex-wrap gap-1.5">
                        {e.categoryIds.map(catId => {
                            const category = categories.find(c => c.id === catId);
                            return category ? <span key={catId} className="px-2 py-0.5 text-xs text-white rounded-full" style={{backgroundColor: category.color}}>{category.name}</span> : null;
                        })}
                    </div>
                 </div>
            ))}
             {envelopes.length === 0 && (
                <div className="text-center py-10 text-slate-500">
                    <h3 className="font-semibold">No Envelopes Yet</h3>
                    <p className="text-sm">Create an envelope to start tracking your budget goals.</p>
                </div>
            )}
        </div>
    </Card>
);


const EnvelopeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    envelope: Envelope | null;
    categories: Category[];
    addEnvelope: (envelope: Omit<Envelope, 'id'>) => void;
    updateEnvelope: (envelope: Envelope) => void;
}> = ({ isOpen, onClose, envelope, categories, addEnvelope, updateEnvelope }) => {
    const [name, setName] = useState('');
    const [budget, setBudget] = useState(0);
    const [type, setType] = useState<Envelope['type']>('spending');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [finalTarget, setFinalTarget] = useState<number | ''>('');
    const [startingAmount, setStartingAmount] = useState<number | ''>('');


    React.useEffect(() => {
        if(isOpen){
            setName(envelope?.name || '');
            setBudget(envelope?.budget || 0);
            setSelectedCategories(envelope?.categoryIds || []);
            setType(envelope?.type || 'spending');
            setFinalTarget(envelope?.finalTarget || '');
            setStartingAmount(envelope?.startingAmount || '');
        }
    }, [isOpen, envelope])

    const handleCategoryToggle = (categoryId: string) => {
        setSelectedCategories(prev => 
            prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const envelopeData = { 
            name, 
            budget, 
            categoryIds: selectedCategories, 
            type,
            finalTarget: Number(finalTarget) > 0 ? Number(finalTarget) : undefined,
            startingAmount: Number(startingAmount) > 0 ? Number(startingAmount) : undefined
        };
        if (envelope) {
            updateEnvelope({ ...envelope, ...envelopeData });
        } else {
            addEnvelope(envelopeData);
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={envelope ? "Edit Envelope" : "Add Envelope"}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Envelope Type</label>
                    <div className="flex rounded-lg border border-slate-300 p-1 bg-slate-100">
                        <button
                            type="button"
                            onClick={() => setType('spending')}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                type === 'spending' ? 'bg-white text-primary shadow' : 'text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            <Box size={16} /> Spending Pool
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('goal')}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                type === 'goal' ? 'bg-white text-primary shadow' : 'text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                           <Target size={16} /> Saving Goal
                        </button>
                    </div>
                </div>

                <div>
                    <label htmlFor="envelopeName" className="block text-sm font-medium text-slate-700 mb-1">Envelope Name</label>
                    <input id="envelopeName" type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition" />
                </div>
                <div>
                    <label htmlFor="envelopeBudget" className="block text-sm font-medium text-slate-700 mb-1">
                        {type === 'spending' ? 'Monthly Budget' : 'Monthly Contribution Goal'}
                    </label>
                    <input id="envelopeBudget" type="number" value={budget} onChange={e => setBudget(parseFloat(e.target.value) || 0)} required min="0" step="0.01" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition" />
                </div>
                
                {type === 'goal' && (
                    <>
                        <div>
                            <label htmlFor="envelopeStartingAmount" className="block text-sm font-medium text-slate-700 mb-1">Starting Amount (Optional)</label>
                            <input id="envelopeStartingAmount" type="number" value={startingAmount} onChange={e => setStartingAmount(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} min="0" step="0.01" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition" />
                            <p className="text-xs text-slate-500 mt-2">Enter any funds you already have for this goal. This amount will be added to your overall progress.</p>
                        </div>
                         <div>
                            <label htmlFor="envelopeFinalTarget" className="block text-sm font-medium text-slate-700 mb-1">Final Target Sum (Optional)</label>
                            <input id="envelopeFinalTarget" type="number" value={finalTarget} onChange={e => setFinalTarget(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} min="0" step="0.01" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition" />
                            <p className="text-xs text-slate-500 mt-2">Set a total amount you want to save for this goal. Leave at 0 or empty if there's no final target.</p>
                        </div>
                    </>
                )}

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Assign Categories</label>
                    <div className="max-h-40 overflow-y-auto space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        {categories.filter(c => c.id !== 'uncategorized' && c.name !== 'Income').map(cat => (
                            <label key={cat.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-100 cursor-pointer">
                                <input type="checkbox" checked={selectedCategories.includes(cat.id)} onChange={() => handleCategoryToggle(cat.id)} className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300" />
                                <span className="flex items-center gap-2 text-sm text-slate-700">
                                    <span className="w-3 h-3 rounded-full" style={{backgroundColor: cat.color}}></span>
                                    {cat.name}
                                    {cat.isTransfer && <ArrowRightLeft size={12} className="text-slate-400" />}
                                </span>
                            </label>
                        ))}
                    </div>
                     <p className="text-xs text-slate-500 mt-2">
                        {type === 'spending' 
                         ? 'Spending in these categories will count against this envelope\'s budget.'
                         : 'Contributions in these categories will count toward this savings goal.'
                        }
                    </p>
                </div>
                 <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark">Save</button>
                </div>
            </form>
        </Modal>
    );
};