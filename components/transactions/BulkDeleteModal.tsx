
import React from 'react';
import { Modal } from '../ui';
import { AlertTriangle } from 'lucide-react';

export const BulkDeleteModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    onConfirm: () => void,
    count: number
}> = ({ isOpen, onClose, onConfirm, count }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirm Bulk Deletion">
            <div className="text-center">
                <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-slate-800">Are you sure?</h3>
                <p className="text-slate-500 mt-2">
                    You are about to permanently delete {count} transaction(s). This action cannot be undone.
                </p>
            </div>
            <div className="flex justify-center gap-4 mt-8">
                <button onClick={onClose} className="px-6 py-2 font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">
                    Cancel
                </button>
                <button onClick={onConfirm} className="px-6 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700">
                    Yes, delete
                </button>
            </div>
        </Modal>
    );
};
