
import React from 'react';
import { Folio, FolioCharge } from '../../types';
import { CURRENT_PROPERTY as CONFIG_PROPERTY } from '../../services/kernel/config';
import { Printer, CreditCard } from 'lucide-react';

interface FolioViewProps {
    folio: Folio;
    onSettle?: () => void;
    readOnly?: boolean;
}

const FolioView: React.FC<FolioViewProps> = ({ folio, onSettle, readOnly = false }) => {
    const totalCharges = folio.charges.reduce((acc, c) => acc + c.amount, 0);

    return (
        <div className="flex flex-col h-full animate-fadeIn w-full">
            {/* Summary Header */}
            <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 mb-4">
                <div>
                    <div className="text-xs text-zinc-500 uppercase font-bold">Total Charges</div>
                    <div className="text-xl font-mono text-zinc-200">{CONFIG_PROPERTY.currency} {totalCharges.toFixed(2)}</div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-zinc-500 uppercase font-bold">Balance Due</div>
                    <div className={`text-xl font-mono ${folio.balance === 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {CONFIG_PROPERTY.currency} {folio.balance.toFixed(2)}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-zinc-900/30 border border-zinc-800 rounded-xl min-h-[200px]">
                <table className="w-full text-left text-sm text-zinc-400">
                    <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] font-bold sticky top-0">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {folio.charges.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-zinc-600 italic">No charges posted yet.</td>
                            </tr>
                        ) : (
                            folio.charges.map((charge: any) => (
                                <tr key={charge.id} className="hover:bg-zinc-900/50">
                                    <td className="px-4 py-3 font-mono text-xs">{new Date(charge.timestamp).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-zinc-200">{charge.description}</td>
                                    <td className="px-4 py-3 text-xs"><span className="bg-zinc-800 px-2 py-0.5 rounded">{charge.category}</span></td>
                                    <td className="px-4 py-3 text-right font-mono text-zinc-200">{charge.amount.toFixed(2)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {!readOnly && (
                <div className="mt-4 flex justify-end gap-2">
                    <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition flex items-center gap-2">
                        <Printer className="w-3 h-3" /> Print Folio
                    </button>
                    {/* Only show Settle Bill if balance > 0 */}
                    {folio.balance > 0 && onSettle && (
                        <button
                            onClick={onSettle}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-lg"
                        >
                            <CreditCard className="w-3 h-3" /> Settle Bill
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default FolioView;
