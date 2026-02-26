
import React, { useState } from 'react';
import { User, LoyaltyTier, Reservation } from '../../types';
// import { RESERVATIONS, ROOMS } from '../../services/mockData'; 
import { usePms } from '../../services/kernel/persistence';
import { CURRENT_PROPERTY as CONFIG_PROPERTY } from '../../services/kernel/config';
import { X, Star, Heart, Activity, Calendar, Shield, MapPin, MessageCircle, Clock, CheckCircle } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import Inspectable from './Inspectable';
import { useInspector } from '../../context/InspectorContext';
import { botEngine } from '../../services/kernel/systemBridge';

interface GuestProfileModalProps {
    guest: User;
    onClose: () => void;
}

const GuestProfileModal: React.FC<GuestProfileModalProps> = ({ guest, onClose }) => {
    const [activeTab, setActiveTab] = useState<'Profile' | 'Stays'>('Profile');
    const { inspect } = useInspector();
    const { reservations: RESERVATIONS, rooms: ROOMS } = usePms();

    const getTierColor = (tier?: LoyaltyTier) => {
        switch (tier) {
            case LoyaltyTier.DIAMOND: return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_#06b6d4]';
            case LoyaltyTier.PLATINUM: return 'bg-zinc-300/20 text-zinc-100 border-zinc-300/50 shadow-[0_0_15px_#e4e4e7]';
            case LoyaltyTier.GOLD: return 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_15px_#f59e0b]';
            default: return 'bg-zinc-700/50 text-zinc-400';
        }
    };

    const chartData = guest.valenceHistory.map((h, i) => ({ i, score: h.score }));
    const reservations = RESERVATIONS.filter(r => r.guestId === guest.principal).sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());

    const renderProfile = () => (
        <div className="space-y-6 animate-fadeIn">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase font-bold mb-1">
                        <Activity className="w-3 h-3 text-violet-500" /> Avg Sentiment
                    </div>
                    <div className="text-2xl text-zinc-100 font-light">
                        {guest.valenceHistory.length > 0
                            ? (guest.valenceHistory.reduce((a, b) => a + b.score, 0) / guest.valenceHistory.length).toFixed(1)
                            : 'N/A'}
                        <span className="text-sm text-zinc-600 font-normal"> / 10</span>
                    </div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase font-bold mb-1">
                        <Calendar className="w-3 h-3 text-teal-500" /> Visits
                    </div>
                    <div className="text-2xl text-zinc-100 font-light">{reservations.length} <span className="text-sm text-zinc-600 font-normal">Stays</span></div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase font-bold mb-1">
                        <Shield className="w-3 h-3 text-amber-500" /> LTV
                    </div>
                    <div className="text-2xl text-zinc-100 font-light">
                        {(reservations.reduce((acc, r) => acc + r.rateApplied, 0) * 3).toLocaleString()} <span className="text-sm text-zinc-600 font-normal">{CONFIG_PROPERTY.currency}</span>
                    </div>
                </div>
            </div>

            {/* AI Analysis */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5">
                <h3 className="text-sm font-medium text-zinc-200 mb-4 flex items-center gap-2">
                    <Star className="w-4 h-4 text-violet-500" /> Singularity AI Profile
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2">Preferences</div>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(guest.preferences).map(([key, val]) => {
                                if (!val || (Array.isArray(val) && val.length === 0)) return null;
                                return (
                                    <span key={key} className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300 border border-zinc-700 capitalize">
                                        {key}: <span className="text-violet-300">{Array.isArray(val) ? val.join(', ') : val.toString()}</span>
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    {chartData.length > 0 && (
                        <div>
                            <div className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2">Sentiment History</div>
                            <div className="h-16 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <Area type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.1} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-4 p-3 bg-violet-500/5 rounded-xl border border-violet-500/10">
                    <p className="text-xs text-violet-200 leading-relaxed italic">
                        "Guest prefers {guest.preferences.lighting?.toLowerCase()} lighting and high-floor rooms. Often requests extra {guest.preferences.halal ? 'halal options' : 'amenities'}. Respond quickly to requests to maintain high sentiment."
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => {
                        const amenity = prompt('What amenity would you like to send? (e.g., Fruit Basket, Champagne)');
                        if (amenity) {
                            botEngine.logActivity('PMS', 'SEND_AMENITY', `Sent ${amenity} to ${guest.fullName}`, 'Concierge');
                            alert(`Request for ${amenity} sent to Housekeeping/Room Service.`);
                        }
                    }}
                    className="py-3 bg-zinc-100 hover:bg-white text-zinc-900 rounded-xl font-bold text-sm transition shadow-lg"
                >
                    Send Amenity
                </button>
                <button
                    onClick={() => {
                        const msg = prompt('Enter message for guest:');
                        if (msg) {
                            botEngine.logActivity('PMS', 'GUEST_MESSAGE', `Message sent to ${guest.fullName}: "${msg}"`, 'FrontDesk');
                            alert('Message sent to guest app and TV system.');
                        }
                    }}
                    className="py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2"
                >
                    <MessageCircle className="w-4 h-4" /> Message
                </button>
            </div>
        </div>
    );

    const renderStays = () => (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden animate-fadeIn">
            <table className="w-full text-left text-sm text-zinc-400">
                <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] font-bold">
                    <tr>
                        <th className="px-6 py-4">Res ID</th>
                        <th className="px-6 py-4">Dates</th>
                        <th className="px-6 py-4">Room</th>
                        <th className="px-6 py-4">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                    {reservations.map(res => {
                        const room = ROOMS.find(r => r.id === res.roomId);
                        return (
                            <Inspectable key={res.id} type="reservation" id={res.id}>
                                <tr
                                    onClick={() => inspect('reservation', res.id)}
                                    className="hover:bg-zinc-900/50 cursor-pointer transition"
                                >
                                    <td className="px-6 py-4 font-mono text-xs text-violet-400">#{res.id.split('_')[1]}</td>
                                    <td className="px-6 py-4 text-xs">
                                        {new Date(res.checkIn).toLocaleDateString()} - {new Date(res.checkOut).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-200">{room ? room.number : 'Unassigned'}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-zinc-800 text-zinc-500 px-2 py-1 rounded text-[10px] uppercase font-bold">{res.status}</span>
                                    </td>
                                </tr>
                            </Inspectable>
                        );
                    })}
                    {reservations.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-zinc-600 italic">No stay history.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <>
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
                <div
                    className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Background Accents */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-[80px]"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-[80px]"></div>

                    {/* Header */}
                    <div className="relative z-10 p-6 pb-0 flex justify-between items-start">
                        <div className="flex gap-5">
                            <div className="w-20 h-20 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center text-2xl font-bold text-zinc-500 overflow-hidden relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-transparent"></div>
                                {guest.fullName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                                <h2 className="text-2xl font-light text-zinc-100">{guest.fullName}</h2>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`px-3 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border ${getTierColor(guest.loyaltyTier)}`}>
                                        {guest.loyaltyTier}
                                    </span>
                                    <span className="text-xs text-zinc-500 flex items-center gap-1 font-mono">
                                        <MapPin className="w-3 h-3" /> G-ID: {guest.principal.split('_')[1]}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex px-6 mt-6 border-b border-zinc-800">
                        {['Profile', 'Stays'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-6 py-3 text-sm font-medium transition relative ${activeTab === tab ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                {tab}
                                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-500"></div>}
                            </button>
                        ))}
                    </div>

                    {/* Body */}
                    <div className="relative z-10 p-6 overflow-y-auto scrollbar-hide flex-1">
                        {activeTab === 'Profile' && renderProfile()}
                        {activeTab === 'Stays' && renderStays()}
                    </div>
                </div>
            </div>

        </>
    );
};

export default GuestProfileModal;
