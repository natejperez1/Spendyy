import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Card, Modal } from './ui';
import { AlertTriangle, Trash2, BotMessageSquare, CheckCircle, XCircle, LoaderCircle, Download, Upload as UploadIcon, FileJson, RefreshCw } from 'lucide-react';
import { AISettings, Transaction, Category, Envelope } from '../types';
import { testAIApiKey } from '../services/geminiService';
import Papa from 'papaparse';

const DataPrivacyManager: React.FC<{
    allData: {
        transactions: Transaction[];
        categories: Category[];
        envelopes: Envelope[];
        aiSettings: AISettings;
    };
    resetAllData: () => void;
}> = ({ allData, resetAllData }) => {
    const [storageSize, setStorageSize] = useState(0);
    const [isRawDataModalOpen, setRawDataModalOpen] = useState(false);
    const [isResetConfirmModalOpen, setResetConfirmModalOpen] = useState(false);

    const formatBytes = (bytes: number, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const calculateStorageSize = useCallback(() => {
        const keys = ['transactions', 'categories', 'envelopes', 'aiSettings'];
        let totalBytes = 0;
        keys.forEach(key => {
            try {
                const item = window.localStorage.getItem(key);
                if (item) {
                    totalBytes += new Blob([item]).size;
                }
            } catch (error) {
                console.error(`Could not access localStorage for key: ${key}`, error);
            }
        });
        setStorageSize(totalBytes);
    }, []);

    useEffect(() => {
        calculateStorageSize();
    }, [allData, calculateStorageSize]);

    const handleReset = () => {
        resetAllData();
        setResetConfirmModalOpen(false);
    };

    return (
        <>
            <Card className="p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Data Privacy & Storage</h2>
                <p className="text-sm text-slate-500 mb-6">
                    All your data is stored locally in your browser's storage. Nothing is sent to a server, ensuring your financial information remains private.
                </p>
                <div className="space-y-4">
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex items-center justify-between gap-3">
                        <div>
                            <p className="font-medium text-slate-700">Local Data Usage</p>
                            <p className="text-xs text-slate-500">The total size of your data stored in this browser.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-primary">{formatBytes(storageSize)}</span>
                            <button onClick={calculateStorageSize} className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-200 rounded-full transition-colors" title="Refresh size">
                                <RefreshCw size={14} />
                            </button>
                        </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
                         <div>
                            <p className="font-medium text-slate-700">View Raw Data</p>
                            <p className="text-xs text-slate-500">Inspect the exact JSON data being stored locally.</p>
                        </div>
                        <button onClick={() => setRawDataModalOpen(true)} className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-primary border border-primary/50 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors flex items-center justify-center gap-2">
                             <FileJson size={16} /> View Data
                        </button>
                    </div>
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div>
                            <p className="font-medium text-red-800">Reset All Data</p>
                            <p className="text-xs text-red-700">Permanently delete all data from this browser.</p>
                        </div>
                         <button 
                            onClick={() => setResetConfirmModalOpen(true)}
                            className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 size={16} />
                            Reset All
                        </button>
                    </div>
                </div>
            </Card>
            
            <Modal isOpen={isRawDataModalOpen} onClose={() => setRawDataModalOpen(false)} title="Raw Local Data">
                 <div>
                    <p className="text-sm text-slate-600 mb-4">This is a read-only view of the data stored in your browser's `localStorage`.</p>
                    <textarea
                        readOnly
                        value={JSON.stringify(allData, null, 2)}
                        className="w-full h-80 p-2 border border-slate-300 rounded-lg font-mono text-xs bg-slate-50 resize-none"
                    />
                </div>
                 <div className="flex justify-end mt-4">
                    <button onClick={() => setRawDataModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark">Close</button>
                </div>
            </Modal>

            <Modal isOpen={isResetConfirmModalOpen} onClose={() => setResetConfirmModalOpen(false)} title="Confirm Data Reset">
                <div className="text-center">
                    <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-800">Are you absolutely sure?</h3>
                    <p className="text-slate-500 mt-2">
                        This action is irreversible and will delete all your budget data from this browser.
                    </p>
                </div>
                <div className="flex justify-center gap-4 mt-8">
                    <button 
                        onClick={() => setResetConfirmModalOpen(false)} 
                        className="px-6 py-2 font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleReset} 
                        className="px-6 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
                    >
                        Yes, delete everything
                    </button>
                </div>
            </Modal>
        </>
    );
};


const ExportDataManager: React.FC<{
    transactions: Transaction[];
    categories: Category[];
}> = ({ transactions, categories }) => {
    const availableYears = useMemo(() => {
        if (transactions.length === 0) return [];
        const years = new Set(transactions.map(t => new Date(t.date).getFullYear()));
        return Array.from(years).sort((a, b) => b - a);
    }, [transactions]);

    const [selectedYear, setSelectedYear] = useState<number | 'all'>(availableYears[0] || 'all');

    const categoryMap = useMemo(() => {
        return new Map(categories.map(c => [c.id, c.name]));
    }, [categories]);

    const handleExport = (year?: number) => {
        const dataToExport = year
            ? transactions.filter(t => new Date(t.date).getFullYear() === year)
            : transactions;

        if (dataToExport.length === 0) {
            alert(year ? `No transactions found for ${year}.` : "No transactions to export.");
            return;
        }

        const csvData = dataToExport.map(t => ({
            "Date": t.date,
            "Payee": t.payee,
            "Description": t.description,
            "Category": categoryMap.get(t.categoryId) || 'Uncategorized',
            "Type": t.type,
            "Amount": t.amount,
            "Payment Method": t.paymentMethod,
        }));

        const csv = Papa.unparse(csvData, {
             columns: ["Date", "Payee", "Description", "Category", "Type", "Amount", "Payment Method"]
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        const fileName = year ? `spendyy_export_${year}.csv` : `spendyy_export_all.csv`;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card className="mt-6 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Export Data to CSV</h2>
            <p className="text-sm text-slate-500 mb-6">Download your transaction data as a human-readable CSV file, including all your categorization changes.</p>
            
            <div className="space-y-4">
                 <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="font-medium text-slate-700">Export all transactions</p>
                    <button 
                        onClick={() => handleExport()}
                        className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                    >
                        <Download size={16} />
                        Export All
                    </button>
                 </div>
                 <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <label htmlFor="export-year" className="font-medium text-slate-700">Export by year</label>
                        <select
                            id="export-year"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            disabled={availableYears.length === 0}
                            className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition"
                        >
                            {availableYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                    <button 
                        onClick={() => handleExport(selectedYear as number)}
                        disabled={availableYears.length === 0}
                        className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                         <Download size={16} />
                        Export Year
                    </button>
                 </div>
            </div>
        </Card>
    );
};


const AISettingsManager: React.FC<{
    settings: AISettings;
    updateSettings: (settings: AISettings) => void;
}> = ({ settings, updateSettings }) => {
    // Only use local state for the API key input to avoid losing an unsaved key.
    const [localApiKey, setLocalApiKey] = useState(settings.apiKey);
    const [testStatus, setTestStatus] = useState<{ type: 'idle' | 'testing' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

    // Sync local key if the global settings change (e.g. from another tab or after a save)
    useEffect(() => {
        setLocalApiKey(settings.apiKey);
    }, [settings.apiKey]);
    
    const handleToggleEnabled = (enabled: boolean) => {
        // Immediately persist the change for the toggle.
        updateSettings({
            ...settings,
            enabled: enabled,
        });
    };

    const handleTestAndSave = async () => {
        setTestStatus({ type: 'testing', message: 'Testing API Key...' });
        // Create a settings object with the new key to test
        const settingsToTest = { ...settings, apiKey: localApiKey };
        const result = await testAIApiKey(settingsToTest);
        
        if (result.success) {
            // If the test is successful, save the new settings.
            updateSettings(settingsToTest);
            setTestStatus({ type: 'success', message: result.message });
        } else {
            setTestStatus({ type: 'error', message: result.message });
        }
    };

    return (
        <Card className="mt-6 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-2">AI Settings</h2>
            <p className="text-sm text-slate-500 mb-6">Configure artificial intelligence features like category suggestions.</p>

            <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <label htmlFor="enable-ai" className="font-medium text-slate-700">Enable AI Features</label>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input 
                            type="checkbox" 
                            id="enable-ai"
                            checked={settings.enabled} // Bind directly to the persisted settings
                            onChange={(e) => handleToggleEnabled(e.target.checked)} // Immediately save on change
                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                        />
                         <label htmlFor="enable-ai" className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-300 cursor-pointer"></label>
                    </div>
                </div>
                 <style>{`.toggle-checkbox:checked { right: 0; border-color: #667eea; } .toggle-checkbox:checked + .toggle-label { background-color: #667eea; }`}</style>

                {settings.enabled && (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="ai-provider" className="block text-sm font-medium text-slate-700 mb-1">AI Provider</label>
                            <select
                                id="ai-provider"
                                value={settings.provider} // Bind directly to persisted settings
                                onChange={(e) => updateSettings({...settings, provider: e.target.value as 'gemini'})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition"
                            >
                                <option value="gemini">Google Gemini</option>
                                <option value="other" disabled>More providers coming soon...</option>
                            </select>
                        </div>
                         <div>
                            <label htmlFor="api-key" className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                            <input
                                id="api-key"
                                type="password"
                                placeholder="Paste your API key here"
                                value={localApiKey} // Use local state for the input field
                                onChange={(e) => setLocalApiKey(e.target.value)} // Update local state on change
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition"
                            />
                        </div>

                        <div>
                            <button 
                                onClick={handleTestAndSave}
                                disabled={testStatus.type === 'testing'}
                                className="w-full px-4 py-2 font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:bg-primary/50"
                            >
                                {testStatus.type === 'testing' ? <LoaderCircle size={18} className="animate-spin" /> : <BotMessageSquare size={18} />}
                                Test & Save Settings
                            </button>
                             {testStatus.type !== 'idle' && (
                                <div className={`flex items-center gap-2 mt-3 text-sm p-2 rounded-md ${
                                    testStatus.type === 'success' ? 'bg-green-100 text-green-700' : 
                                    testStatus.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                    {testStatus.type === 'success' && <CheckCircle size={16} />}
                                    {testStatus.type === 'error' && <XCircle size={16} />}
                                    {testStatus.type === 'testing' && <LoaderCircle size={16} className="animate-spin"/>}
                                    <span>{testStatus.message}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}

const BackupAndRestoreManager: React.FC<{
    allData: {
        transactions: Transaction[];
        categories: Category[];
        envelopes: Envelope[];
        aiSettings: AISettings;
    };
    importData: (data: any) => { success: boolean, message: string };
}> = ({ allData, importData }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
    const [dataToImport, setDataToImport] = useState<any | null>(null);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleExport = () => {
        const dataStr = JSON.stringify(allData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        link.download = `spendyy_backup_${date}.json`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setStatus(null);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("Could not read file content.");
                const parsedData = JSON.parse(text);
                setDataToImport(parsedData);
                setConfirmModalOpen(true);
            } catch (err) {
                setStatus({ type: 'error', message: "Invalid JSON file. Please select a valid backup file." });
            }
        };
        reader.onerror = () => setStatus({ type: 'error', message: "Failed to read the selected file." });
        reader.readAsText(file);
        event.target.value = '';
    };

    const confirmImport = () => {
        if (!dataToImport) return;
        const result = importData(dataToImport);
        setConfirmModalOpen(false);
        setDataToImport(null);

        if (result.success) {
            setStatus({ type: 'success', message: result.message });
            // Reload the page gracefully after giving the user time to see the message.
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } else {
            setStatus({ type: 'error', message: result.message });
        }
    };

    return (
        <>
            <Card className="mt-6 p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Backup & Restore</h2>
                <p className="text-sm text-slate-500 mb-6">Save a complete backup of all your data (transactions, categories, envelopes, settings) into a single file, or restore from a backup.</p>
                <div className="space-y-4">
                     <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div>
                            <p className="font-medium text-slate-700">Export Full Backup</p>
                            <p className="text-xs text-slate-500">Downloads a machine-readable JSON file.</p>
                        </div>
                        <button onClick={handleExport} className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-secondary rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                            <Download size={16} /> Export Backup
                        </button>
                    </div>
                     <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
                         <div>
                            <p className="font-medium text-red-800">Import from Backup</p>
                            <p className="text-xs text-red-700">This will overwrite all current data in the application.</p>
                        </div>
                        <input type="file" ref={fileInputRef} accept=".json" onChange={handleFileSelect} className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                            <UploadIcon size={16} /> Import Backup
                        </button>
                    </div>
                </div>
                 {status && (
                    <div className={`mt-4 p-3 rounded-lg flex items-start gap-3 text-sm ${
                        status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                        {status.type === 'success' ? <CheckCircle size={20} className="flex-shrink-0" /> : <AlertTriangle size={20} className="flex-shrink-0" />}
                        <p>{status.message}</p>
                    </div>
                )}
            </Card>

            <Modal isOpen={isConfirmModalOpen} onClose={() => setConfirmModalOpen(false)} title="Confirm Data Import">
                 <div className="text-center">
                    <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-800">Overwrite All Data?</h3>
                    <p className="text-slate-500 mt-2">
                        This will replace all your current data with the contents of the backup file. This action cannot be undone.
                    </p>
                </div>
                <div className="flex justify-center gap-4 mt-8">
                    <button onClick={() => setConfirmModalOpen(false)} className="px-6 py-2 font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">
                        Cancel
                    </button>
                    <button onClick={confirmImport} className="px-6 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700">
                        Yes, Overwrite Data
                    </button>
                </div>
            </Modal>
        </>
    );
};

export const Settings: React.FC<{ 
    resetAllData: () => void;
    aiSettings: AISettings;
    updateAiSettings: (settings: AISettings) => void;
    transactions: Transaction[];
    categories: Category[];
    envelopes: Envelope[];
    importAllData: (data: any) => { success: boolean, message: string };
}> = ({ resetAllData, aiSettings, updateAiSettings, transactions, categories, envelopes, importAllData }) => {
    
    const allData = { transactions, categories, envelopes, aiSettings };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            
            <DataPrivacyManager allData={allData} resetAllData={resetAllData} />

            <BackupAndRestoreManager allData={allData} importData={importAllData} />

            <ExportDataManager transactions={transactions} categories={categories} />

            <AISettingsManager settings={aiSettings} updateSettings={updateAiSettings} />

        </div>
    );
};