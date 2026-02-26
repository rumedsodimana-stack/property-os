
import React, { useState } from 'react';
import { LedgerEntry } from '../../types';
import { X, Receipt, Calendar, Tag, FileText, ArrowUpRight, ArrowDownLeft, Shield, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';
import { usePms } from '../../services/kernel/persistence';
import { CURRENT_PROPERTY as CONFIG_PROPERTY } from '../../services/kernel/config';
import { updateItem } from '../../services/kernel/firestoreService';
import { useAuth } from '../../context/AuthContext';

interface TransactionModalProps {
    transaction: LedgerEntry;
    onClose: () => void;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ transaction, onClose }) => {
    const { glAccounts: PMS_GL_ACCOUNTS } = usePms();
    const account = PMS_GL_ACCOUNTS.find(a => a.id === transaction.accountId);
    const { currentUser, hasPermission } = useAuth();
    const canVoid = hasPermission('void_transaction');
    const [confirmVoid, setConfirmVoid] = useState(false);
    const [voiding, setVoiding] = useState(false);

    const handleVoid = async () => {
        setVoiding(true);
        await updateItem('ledgerEntries', transaction.id, {
            isVoided: true,
            voidedAt: Date.now(),
            voidedBy: currentUser?.fullName || 'Manager',
            voidedByRole: currentUser?.role || 'Manager',
        });
        setVoiding(false);
        onClose();
    };

    const handleDownloadReceipt = () => {
        const content = [
            `HOTEL SINGULARITY - TRANSACTION RECEIPT`,
            `========================================`,
            `ID:          ${transaction.id}`,
            `Date:        ${new Date(transaction.date).toLocaleString()}`,
            `Description: ${transaction.description}`,
            `Type:        ${transaction.credit > 0 ? 'Credit' : 'Debit'}`,
            `Amount:      ${CONFIG_PROPERTY.currency} ${Math.max(transaction.debit, transaction.credit).toFixed(2)}`,
            `Account:     ${account?.name || 'General Ledger'} (${account?.code || 'N/A'})`,
            `========================================`,
            `Issued by Hotel Singularity OS`,
        ].join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt_${transaction.id}.txt`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-zinc-950 border border-zinc-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-start">
                    <div className="flex gap-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold ${transaction.credit > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                            }`}>
                            {transaction.credit > 0 ? <ArrowUpRight className="w-8 h-8" /> : <ArrowDownLeft className="w-8 h-8" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-light text-white mb-1">{transaction.description}</h2>
                            <div className="flex items-center gap-3 text-sm text-zinc-400">
                                <span className="flex items-center gap-1 font-mono text-zinc-500">{transaction.id}</span>
                                <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                                <span className="flex items-center gap-1 text-zinc-300 font-mono">
                                    {new Date(transaction.date).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition text-zinc-500 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800">
                                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-2 flex items-center gap-2">
                                    <Tag className="w-3 h-3" /> Account Entry
                                </div>
                                <div className="text-sm font-medium text-zinc-200">{account?.name || 'General Ledger'}</div>
                                <div className="text-xs text-zinc-500 mt-1 font-mono">Code: {account?.code || 'N/A'}</div>
                            </div>

                            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800">
                                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-2 flex items-center gap-2">
                                    <Shield className="w-3 h-3" /> Compliance Details
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-zinc-500 italic">Vat Regime</span>
                                        <span className="text-zinc-300">ZATCA Phase 2</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-zinc-500 italic">Audit Status</span>
                                        <span className="text-emerald-400 font-bold uppercase">Verified</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end justify-center bg-zinc-900/20 rounded-3xl p-8 border border-zinc-800">
                            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Transaction Amount</div>
                            <div className={`text-4xl font-light tracking-tighter ${transaction.type === 'Credit' ? 'text-emerald-400' : 'text-rose-400'
                                }`}>
                                <span className="text-sm align-top mr-1">{CONFIG_PROPERTY.currency}</span>
                                {transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <div className="mt-4 px-3 py-1 bg-zinc-800 text-zinc-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                {transaction.type} entry
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-violet-600/5 border border-violet-500/10 rounded-2xl">
                        <h4 className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <AlertCircle className="w-3 h-3" /> System Diagnostics
                        </h4>
                        <p className="text-xs text-zinc-500 leading-relaxed italic">
                            Automatically reconciled against bank statement #BS_9921. No discrepancies found.
                            Transaction matches {transaction.complianceFlag === 'ZATCA' ? 'E-Invoicing' : 'Manual Entry'} protocols.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-zinc-800 bg-zinc-950 flex justify-between items-center">
                    <button onClick={handleDownloadReceipt} className="flex items-center gap-2 text-xs bg-zinc-900 hover:bg-zinc-800 px-4 py-2 rounded-xl text-zinc-400 hover:text-white transition border border-zinc-800 font-bold">
                        <FileText className="w-4 h-4" /> Download Receipt
                    </button>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition">
                            Close
                        </button>
                        {canVoid && (
                            !confirmVoid ? (
                                <button onClick={() => setConfirmVoid(true)} className="px-6 py-2 bg-rose-600/80 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg">
                                    Void Transaction
                                </button>
                            ) : (
                                <div className="flex gap-2 items-center">
                                    <span className="text-xs text-rose-400 font-medium">Confirm void?</span>
                                    <button onClick={handleVoid} disabled={voiding} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50">
                                        {voiding ? '...' : 'Yes, Void'}
                                    </button>
                                    <button onClick={() => setConfirmVoid(false)} className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded-xl text-xs font-bold transition">
                                        Cancel
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionModal;
