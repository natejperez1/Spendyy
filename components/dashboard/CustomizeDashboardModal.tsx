
import React from 'react';
import { WidgetVisibility } from '../../types';
import { Modal } from '../ui';
import { DollarSign, Wallet, Spline, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';

const WIDGETS_CONFIG = [
    { id: 'stats', name: 'Key Insights', icon: <DollarSign size={20}/> },
    { id: 'envelopes', name: 'Envelope Summary', icon: <Wallet size={20}/> },
    { id: 'weekdayWeekendSpend', name: 'Weekday vs. Weekend', icon: <Spline size={20} />},
    { id: 'spendingPie', name: 'Spending by Category', icon: <PieChartIcon size={20}/> },
    { id: 'incomeBreakdown', name: 'Income to Envelope Breakdown', icon: <PieChartIcon size={20}/> },
    { id: 'trends', name: 'Spending Trends', icon: <TrendingUp size={20}/> },
];

export const CustomizeDashboardModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    visibility: WidgetVisibility,
    setVisibility: (v: WidgetVisibility) => void,
}> = ({ isOpen, onClose, visibility, setVisibility }) => {

    const handleToggle = (id: keyof WidgetVisibility) => {
        setVisibility({ ...visibility, [id]: !visibility[id] });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Customize Dashboard Widgets">
             <style>{`.toggle-checkbox:checked { right: 0; border-color: #667eea; } .toggle-checkbox:checked + .toggle-label { background-color: #667eea; }`}</style>
            <div className="space-y-4">
                <p className="text-sm text-slate-600">Select which widgets to show on your dashboard.</p>
                {WIDGETS_CONFIG.map(widget => (
                     <div key={widget.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <label htmlFor={`toggle-${widget.id}`} className="flex items-center gap-3 font-medium text-slate-700 cursor-pointer">
                            {widget.icon}
                            {widget.name}
                        </label>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input 
                                type="checkbox" 
                                id={`toggle-${widget.id}`}
                                checked={visibility[widget.id as keyof WidgetVisibility]}
                                onChange={() => handleToggle(widget.id as keyof WidgetVisibility)}
                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                            />
                            <label htmlFor={`toggle-${widget.id}`} className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-300 cursor-pointer"></label>
                        </div>
                    </div>
                ))}
            </div>
             <div className="flex justify-end mt-6">
                <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark">Done</button>
            </div>
        </Modal>
    );
};
