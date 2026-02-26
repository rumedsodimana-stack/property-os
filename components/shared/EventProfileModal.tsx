
import React, { useState } from 'react';
import { BanquetEvent } from '../../types';
import { CURRENT_PROPERTY as CONFIG_PROPERTY } from '../../services/kernel/config';
import { X, Calendar, Users, MapPin, DollarSign, FileText, CheckCircle, Clock, ChefHat } from 'lucide-react';

interface EventProfileModalProps {
    event: BanquetEvent;
    onClose: () => void;
}

const EventProfileModal: React.FC<EventProfileModalProps> = ({ event, onClose }) => {
    const [activeTab, setActiveTab] = useState<'BEO' | 'Menu' | 'Financials'>('BEO');

    const renderBEO = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <div className="text-zinc-500 text-xs uppercase font-bold mb-2">Client</div>
                    <div className="text-lg text-zinc-200 font-medium">{event.clientName}</div>
                    <div className="text-xs text-zinc-500">Contact: 973-3333-1234</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <div className="text-zinc-500 text-xs uppercase font-bold mb-2">Venue</div>
                    <div className="text-lg text-zinc-200 font-medium">{event.venueId.replace('ven_', '').toUpperCase()}</div>
                    <div className="text-xs text-zinc-500 flex items-center gap-1"><Users className="w-3 h-3" /> {event.pax} Pax Setup</div>
                </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <h4 className="text-sm font-bold text-zinc-200 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-violet-500" /> Run of Show
                </h4>
                <div className="space-y-4 relative pl-4 border-l border-zinc-800">
                    <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-zinc-600 rounded-full border-2 border-zinc-950"></div>
                        <div className="text-sm font-mono text-zinc-300">{new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-zinc-400 text-sm">Guest Arrival & Welcome Drink</div>
                    </div>
                    <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-zinc-600 rounded-full border-2 border-zinc-950"></div>
                        <div className="text-sm font-mono text-zinc-300">
                            {new Date(new Date(event.startDate).getTime() + 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-zinc-400 text-sm">Main Reception / Dinner Service</div>
                    </div>
                    <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-zinc-600 rounded-full border-2 border-zinc-950"></div>
                        <div className="text-sm font-mono text-zinc-300">{new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-zinc-400 text-sm">Event Conclusion</div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
            <div
                className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-[80px]"></div>

                {/* Header */}
                <div className="relative z-10 px-8 pt-8 pb-4 flex justify-between items-start border-b border-zinc-800">
                    <div>
                        <h2 className="text-2xl font-light text-zinc-100 flex items-center gap-2">
                            {event.name}
                        </h2>
                        <div className="flex gap-3 mt-2">
                            <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold border bg-opacity-10 ${event.status === 'Definite' ? 'text-teal-400 border-teal-500 bg-teal-500' : 'text-amber-400 border-amber-500 bg-amber-500'
                                }`}>
                                {event.status}
                            </span>
                            <span className="text-xs text-zinc-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {new Date(event.startDate).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-zinc-900/50 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition border border-zinc-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-8 border-b border-zinc-800 bg-zinc-900/30">
                    {['BEO', 'Menu', 'Financials'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-4 text-sm font-medium transition relative ${activeTab === tab ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            {tab}
                            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-500"></div>}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="relative z-10 p-8 overflow-y-auto flex-1 bg-zinc-950">
                    {activeTab === 'BEO' && renderBEO()}
                    {activeTab === 'Financials' && (
                        <div className="flex flex-col items-center justify-center h-full space-y-4">
                            <div className="text-4xl font-mono text-zinc-100">{CONFIG_PROPERTY.currency} {event.totalValue.toLocaleString()}</div>
                            <div className="text-zinc-500 text-sm">Total Contract Value</div>
                            <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-bold transition flex items-center gap-2">
                                <FileText className="w-3 h-3" /> View Invoice
                            </button>
                        </div>
                    )}
                    {activeTab === 'Menu' && (
                        <div className="text-center p-12 text-zinc-600 italic border-2 border-dashed border-zinc-800 rounded-2xl">
                            <ChefHat className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            Menu Selection Pending
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventProfileModal;
