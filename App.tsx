import React, { useState } from 'react';
import { Tab, WidgetVisibility } from './types';
import { useBudgetData } from './hooks/useBudgetData';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { Management } from './components/Management';
import { Upload } from './components/Upload';
import { Settings } from './components/Settings';
import { LayoutDashboard, List, FolderKanban, UploadCloud, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'transactions', label: 'Transactions', icon: <List size={18} /> },
    { id: 'management', label: 'Management', icon: <FolderKanban size={18} /> },
    { id: 'upload', label: 'Upload', icon: <UploadCloud size={18} /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon size={18} /> },
];

// Spendyy Logo.
const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor" // This will be inherited by children, 'white' from parent div
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Outer circle of the coin */}
    <circle cx="12" cy="12" r="9" />
    
    {/* Dollar sign S-curve */}
    <path d="M10 15h2.5a1.5 1.5 0 001.5-1.5h0a1.5 1.5 0 00-1.5-1.5h-1a1.5 1.5 0 01-1.5-1.5h0a1.5 1.5 0 011.5-1.5H14" />
    
    {/* Vertical lines for the dollar sign */}
    <path d="M12 9V8m0 8V15" />
  </svg>
);


export default function App() {
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const budgetData = useBudgetData();

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <Dashboard 
                    transactions={budgetData.transactions} 
                    categories={budgetData.categories} 
                    envelopes={budgetData.envelopes}
                    widgetVisibility={budgetData.widgetVisibility}
                    updateWidgetVisibility={budgetData.updateWidgetVisibility}
                />;
            case 'transactions':
                return <Transactions 
                    transactions={budgetData.transactions}
                    categories={budgetData.categories}
                    getCategoryById={budgetData.getCategoryById}
                    deleteTransaction={budgetData.deleteTransaction}
                    updateTransaction={budgetData.updateTransaction}
                    updateTransactions={budgetData.updateTransactions}
                    addCategory={budgetData.addCategory}
                    updateCategory={budgetData.updateCategory}
                    aiSettings={budgetData.aiSettings}
                 />;
            case 'management':
                return <Management {...budgetData} />;
            case 'upload':
                return <Upload addTransactions={budgetData.addTransactions} />;
            case 'settings':
                return <Settings 
                    resetAllData={budgetData.resetAllData} 
                    aiSettings={budgetData.aiSettings}
                    updateAiSettings={budgetData.updateAiSettings}
                    transactions={budgetData.transactions}
                    categories={budgetData.categories}
                    envelopes={budgetData.envelopes}
                    importAllData={budgetData.importAllData}
                />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-gradient-to-br from-slate-50 to-slate-200 min-h-screen font-sans text-slate-800">
            <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-600 rounded-lg text-white">
                                <Logo className="w-6 h-6" />
                            </div>
                            <h1 className="text-xl font-bold text-slate-800">Spendyy</h1>
                        </div>
                        <nav className="hidden md:flex items-center space-x-2">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        activeTab === tab.id ? 'text-primary' : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <motion.div
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                                            layoutId="underline"
                                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                        />
                                    )}
                                </button>
                            ))}
                        </nav>
                         <div className="md:hidden">
                            {/* Placeholder for potential mobile menu button */}
                        </div>
                    </div>
                </div>
            </header>
            
            {/* Mobile Navigation */}
             <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-200 z-40 flex justify-around">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center justify-center gap-1 p-2 flex-grow text-xs font-medium transition-colors relative ${
                            activeTab === tab.id ? 'text-primary' : 'text-slate-500'
                        }`}
                        style={{flexBasis: '20%'}}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                         {activeTab === tab.id && (
                            <motion.div
                                className="absolute bottom-0 h-0.5 bg-primary w-full"
                                layoutId="mobile-underline"
                                 transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            />
                        )}
                    </button>
                ))}
            </nav>


            <main className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8 mb-16 md:mb-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}