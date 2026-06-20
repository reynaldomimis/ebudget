import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

/**
 * ConfirmModal
 * A reusable modal for confirmation dialogs.
 */
const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Are you sure?",
    message = "This action cannot be undone.",
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "danger"
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${variant === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                            <AlertTriangle size={18} />
                        </div>
                        <h3 className="font-bold text-neutral-900 text-sm uppercase tracking-wider">{title}</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-neutral-200 rounded-full transition-colors">
                        <X size={18} className="text-neutral-400" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-neutral-600 text-sm leading-relaxed">
                        {message}
                    </p>
                </div>

                <div className="p-4 bg-neutral-50/50 border-t border-neutral-100 flex justify-end gap-3">
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={variant === 'danger' ? 'danger' : 'primary'}
                        size="sm"
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
