
import React from 'react';
import { Visitor, EmployeeProfile } from '../../types';
import { usePms } from '../../services/kernel/persistence';
import { X, User, Clock, ShieldCheck, Mail, Phone, Calendar, Info, MapPin, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface VisitorProfileModalProps {
    visitor: Visitor;
    onClose: () => void;
}

const VisitorProfileModal: React.FC<VisitorProfileModalProps> = ({ visitor, onClose }) => {
    const { employees: PMS_EMPLOYEES } = usePms();
    const host = PMS_EMPLOYEES.find(e => e.principal === visitor.hostEmployeeId);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-zinc-900 bg-zinc-900/50 flex justify-between items-center text-zinc-100">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/30 font-bold text-xl uppercase">
                            {visitor.fullName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{visitor.fullName}</h2>
                            <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-widest mt-1">
                                <span>Badge: {visitor.badgeNumber || 'N/A'}</span>
                                <span>•</span>
                                <span className={visitor.status === 'On Site' ? 'text-emerald-500' : 'text-zinc-500'}>
                                    {visitor.status}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition text-zinc-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">
                    {/* Timeline */}
                    <div className="flex gap-4">
                        <div className="flex-1 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4">
                            <div className="text-[10px] text-zinc-500 uppercase font-bold mb-2 flex items-center gap-1">
                                <ArrowDownRight className="w-3 h-3 text-emerald-500" /> Check In
                            </div>
                            <div className="text-sm font-medium text-zinc-200">
                                {new Date(visitor.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-1">
                                {new Date(visitor.checkInTime).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="flex-1 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4">
                            <div className="text-[10px] text-zinc-500 uppercase font-bold mb-2 flex items-center gap-1">
                                <ArrowUpRight className="w-3 h-3 text-rose-500" /> Check Out
                            </div>
                            <div className="text-sm font-medium text-zinc-200">
                                {visitor.checkOutTime ? new Date(visitor.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-1">
                                {visitor.checkOutTime ? new Date(visitor.checkOutTime).toLocaleDateString() : 'Active Session'}
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                        <section>
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Info className="w-3 h-3" /> Visit Purpose
                            </h3>
                            <div className="text-zinc-200 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800">
                                {visitor.purpose}
                            </div>
                        </section>

                        {host && (
                            <section>
                                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <User className="w-3 h-3" /> Host Employee
                                </h3>
                                <div className="flex items-center gap-3 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800">
                                    <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-500 font-bold">
                                        {host.fullName[0]}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-zinc-100">{host.fullName}</div>
                                        <div className="text-xs text-zinc-500">{host.role}</div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        {visitor.status === 'On Site' ? (
                            <button className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition">
                                Check Out Visitor
                            </button>
                        ) : (
                            <button className="flex-1 py-3 bg-zinc-800 text-zinc-500 rounded-xl font-bold cursor-not-allowed">
                                Visit Completed
                            </button>
                        )}
                        <button className="px-6 py-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl font-medium transition">
                            Flag
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisitorProfileModal;
