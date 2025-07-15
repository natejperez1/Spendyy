import React, { useState, useRef } from 'react';
import { Card, Modal } from './ui';
import { Transaction } from '../types';
import Papa, { ParseResult } from 'papaparse';
import { UploadCloud, CheckCircle, AlertTriangle, FileUp, ArrowRight } from 'lucide-react';

type Mapping = {
    date: string | null;
    payee: string | null;
    description: string | null;
    amount: string | null;
    type: string | null; // This is kept for mapping but the new logic prioritizes the amount's sign
    category: string | null;
};

const REQUIRED_FIELDS: (keyof Mapping)[] = ['date', 'payee', 'amount'];

const MappingModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    headers: string[];
    dataPreview: any[];
    onConfirm: (mapping: Mapping) => void;
}> = ({ isOpen, onClose, headers, dataPreview, onConfirm }) => {
    const [mapping, setMapping] = useState<Mapping>({
        date: null,
        payee: null,
        description: null,
        amount: null,
        type: null,
        category: null,
    });
    
    // Auto-map initial state
    React.useEffect(() => {
        if (!isOpen) return;
        const initialMapping: Mapping = { date: null, payee: null, description: null, amount: null, type: null, category: null };
        const lowerHeaders = headers.map(h => h.toLowerCase());
        
        const tryMap = (key: keyof Mapping, potentialMatches: string[]) => {
            for (const match of potentialMatches) {
                const index = lowerHeaders.findIndex(h => h.includes(match));
                if (index !== -1) {
                    initialMapping[key] = headers[index];
                    return;
                }
            }
        };

        tryMap('date', ['date', 'time']);
        tryMap('payee', ['payee', 'vendor', 'merchant']);
        tryMap('description', ['description', 'memo', 'details']);
        tryMap('amount', ['amount', 'total', 'subtotal']);
        tryMap('type', ['type', 'transaction type', 'kind']);
        tryMap('category', ['category', 'cat.', 'group']);

        setMapping(initialMapping);
    }, [isOpen, headers]);

    const isMappingValid = REQUIRED_FIELDS.every(field => mapping[field]);

    const handleConfirm = () => {
        if (isMappingValid) {
            onConfirm(mapping);
        }
    };
    
    const previewHeaders: (keyof Mapping)[] = ['date', 'payee', 'amount', 'category', 'description', 'type'];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Map CSV Columns">
            <div className="space-y-6">
                <div>
                    <p className="text-sm text-slate-600 mb-4">Match the columns from your CSV file to the required transaction fields. We've made some initial guesses for you.</p>
                </div>

                <div className="space-y-4">
                    {(Object.keys(mapping) as (keyof Mapping)[]).map(field => (
                        <div key={field} className="flex items-center justify-between">
                            <label className="capitalize font-medium text-slate-700">
                                {field}
                                {REQUIRED_FIELDS.includes(field) && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            <select
                                value={mapping[field] || ''}
                                onChange={(e) => setMapping(prev => ({ ...prev, [field]: e.target.value }))}
                                className="w-60 p-2 border border-slate-300 rounded-md bg-white text-sm"
                            >
                                <option value="">Select a column...</option>
                                {headers.map(header => <option key={header} value={header}>{header}</option>)}
                            </select>
                        </div>
                    ))}
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-4">
                    <h4 className="text-sm font-semibold text-slate-600 mb-2">Data Preview</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="text-left text-slate-500">
                                    {previewHeaders.map(h => <th key={h} className="p-1 font-medium capitalize">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {dataPreview.slice(0, 2).map((row, i) => (
                                    <tr key={i} className="border-t border-slate-200">
                                        {previewHeaders.map(field => {
                                            const mappedColumn = mapping[field];
                                            const cellData = mappedColumn ? row[mappedColumn] : <span className="text-slate-400 italic">N/A</span>;
                                            return <td key={field} className="p-1 text-slate-700 truncate max-w-[100px]">{cellData}</td>
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                     <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
                    <button
                        onClick={handleConfirm}
                        disabled={!isMappingValid}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Confirm Mapping & Import
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export const Upload: React.FC<{
    addTransactions: (transactions: (Omit<Transaction, 'id' | 'categoryId'> & { categoryName?: string })[]) => void;
}> = ({ addTransactions }) => {
    const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isMappingModalOpen, setMappingModalOpen] = useState(false);
    const [csvData, setCsvData] = useState<ParseResult<any> | null>(null);

    const processFile = (mapping: Mapping) => {
        setMappingModalOpen(false);
        if (!csvData) return;

        try {
            const { validTransactions, invalidRowCount, firstSkippedRow } = csvData.data.reduce(
                (acc, row, index) => {
                    const getVal = (key: keyof Mapping) => mapping[key] ? row[mapping[key]!] : null;
                    
                    const amountString = getVal('amount')?.replace(/[^0-9.-]+/g, "");
                    const amount = parseFloat(amountString);
                    const dateVal = getVal('date');
                    const parsedDate = dateVal ? new Date(dateVal) : null;
                    const payee = getVal('payee')?.trim();

                    if (payee && !isNaN(amount) && parsedDate && !isNaN(parsedDate.getTime())) {
                        const date = parsedDate.toISOString().split('T')[0];
                        const description = getVal('description')?.trim() || '';
                        
                        // **FIX**: The sign of the amount is the most reliable source of truth.
                        const finalType = amount >= 0 ? 'Credit' : 'Debit';
                        const categoryName = getVal('category')?.trim();
                        
                        const transaction: Omit<Transaction, 'id' | 'categoryId'> & { categoryName?: string } = {
                            date,
                            payee,
                            description,
                            categoryName: categoryName || undefined,
                            type: finalType,
                            amount: Math.abs(amount), // Store only the positive magnitude
                            paymentMethod: 'Unknown'
                        };
                        acc.validTransactions.push(transaction);
                    } else {
                        acc.invalidRowCount++;
                        if (acc.firstSkippedRow === 0) acc.firstSkippedRow = index + 2;
                    }
                    return acc;
                },
                { validTransactions: [] as (Omit<Transaction, 'id' | 'categoryId'> & { categoryName?: string })[], invalidRowCount: 0, firstSkippedRow: 0 }
            );

            if (validTransactions.length > 0) {
                addTransactions(validTransactions);
                let message = `Successfully imported ${validTransactions.length} transactions.`;
                if (invalidRowCount > 0) {
                    message += ` Skipped ${invalidRowCount} rows with missing or invalid required data (Date, Payee, Amount), starting from row ${firstSkippedRow}.`;
                }
                setUploadStatus({ type: 'success', message });
            } else {
                 if (csvData.data.length > 0) {
                    throw new Error("No valid transactions could be imported. Please check your column mapping and ensure the file contains valid data.");
                } else {
                    throw new Error("The CSV file is empty or could not be read.");
                }
            }

        } catch (error: any) {
            setUploadStatus({ type: 'error', message: error.message || "An unexpected error occurred during import." });
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadStatus(null);
        setCsvData(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    setUploadStatus({ type: 'error', message: `CSV parsing error on row ${results.errors[0].row}: ${results.errors[0].message}` });
                    return;
                }
                if (results.data.length === 0 || !results.meta.fields || results.meta.fields.length === 0) {
                    setUploadStatus({ type: 'error', message: 'The selected file is empty or has no column headers.' });
                    return;
                }
                setCsvData(results);
                setMappingModalOpen(true);
            },
            error: (error: any) => {
                setUploadStatus({ type: 'error', message: `CSV parsing error: ${error.message}` });
            }
        });
        
        // Reset file input value to allow re-uploading the same file
        event.target.value = '';
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <Card className="flex flex-col items-center text-center p-8">
                <FileUp size={48} className="mb-4 text-primary" />
                <h3 className="text-xl font-semibold text-slate-800">Upload Transaction File</h3>
                <p className="text-sm text-slate-500 my-3 max-w-md">
                    Choose a CSV file from your bank. You'll be asked to match your columns to the right fields before importing.
                </p>
                <input type="file" ref={fileInputRef} accept=".csv" onChange={handleFileUpload} className="hidden" />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 w-full max-w-xs px-4 py-2.5 font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                >
                    <UploadCloud size={18} />
                    Choose CSV File
                </button>
            </Card>

            {uploadStatus && (
                <div className={`p-4 rounded-lg flex items-start gap-3 text-sm ${
                    uploadStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {uploadStatus.type === 'success' ? <CheckCircle size={20} className="flex-shrink-0" /> : <AlertTriangle size={20} className="flex-shrink-0" />}
                    <p>{uploadStatus.message}</p>
                </div>
            )}
            
            {csvData && (
                 <MappingModal 
                    isOpen={isMappingModalOpen}
                    onClose={() => setMappingModalOpen(false)}
                    headers={csvData.meta.fields || []}
                    dataPreview={csvData.data}
                    onConfirm={processFile}
                />
            )}
        </div>
    );
};