
import React, { useState, useEffect } from 'react';
import { Reservation, Room, User, Folio } from '../../types';
import { usePms } from '../../services/kernel/persistence';
import { ROOM_TYPES, CURRENT_PROPERTY as CONFIG_PROPERTY } from '../../services/kernel/config';
import { updateItem } from '../../services/kernel/firestoreService';
import { X, Calendar, CreditCard, User as UserIcon, BedDouble, Clock, FileText, CheckCircle, MessageSquare, Tag, Printer, ChevronRight, AlertTriangle, Briefcase, Globe, Phone, Mail } from 'lucide-react';
import { useInspector } from '../../context/InspectorContext';
import Inspectable from './Inspectable';
import FolioView from './FolioView';
import ReservationEditorModal from './ReservationEditorModal';

interface ReservationProfileModalProps {
    reservation: Reservation;
    onClose: () => void;
}

const ReservationProfileModal: React.FC<ReservationProfileModalProps> = ({ reservation, onClose }) => {
    const { rooms: PMS_ROOMS, guests: PMS_GUESTS, folios: PMS_FOLIOS } = usePms();
    const [activeTab, setActiveTab] = useState<'Overview' | 'Folio' | 'Timeline'>('Overview');
    const { inspect } = useInspector();

    // Local State for Simulation
    const [localStatus, setLocalStatus] = useState(reservation.status);
    const [localFolio, setLocalFolio] = useState<Folio | undefined>(undefined);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (PMS_FOLIOS) {
            setLocalFolio(PMS_FOLIOS.find(f => f.id === reservation.folioId));
        }
    }, [PMS_FOLIOS, reservation.folioId]);

    // Hydrate Data
    const guest = PMS_GUESTS.find(g => g.principal === reservation.guestId);
    const room = PMS_ROOMS.find(r => r.id === reservation.roomId);
    const roomType = ROOM_TYPES.find(t => t.id === reservation.roomTypeId);

    // Derived Financials
    const totalCharges = localFolio?.charges.reduce((acc, c) => acc + c.amount, 0) || 0;

    const handleSettleBill = async () => {
        if (!localFolio) return;
        const paymentCharge: any = {
            id: `pay_${Date.now()}`,
            category: 'Payment',
            description: 'Settlement via Credit Card',
            amount: -localFolio.balance, // Negative amount to offset
            timestamp: Date.now()
        };

        const updatedFolioData = {
            charges: [...localFolio.charges, paymentCharge],
            balance: 0,
            status: 'Closed'
        };

        setLocalFolio({
            ...localFolio,
            ...updatedFolioData
        } as any);

        await updateItem('folios', localFolio.id, updatedFolioData);
    };

    const handleCheckOut = async () => {
        if (!localFolio) return;

        if (localFolio.balance > 0) {
            // Block Check-out
            alert(`Cannot check out. Outstanding balance of ${CONFIG_PROPERTY.currency} ${localFolio.balance.toFixed(2)} pending.`);
            setActiveTab('Folio');
            return;
        }

        // Proceed to Check Out
        setLocalStatus('Checked Out');
        await updateItem('reservations', reservation.id, { status: 'Checked Out' });
    };

    const handleCheckIn = async () => {
        setLocalStatus('Checked In');
        await updateItem('reservations', reservation.id, { status: 'Checked In' });
    };

    const handleSaveEdit = (updatedRes: Partial<Reservation>) => {
        // In a real app this would trigger an API call. Here we just close the modal.
        // We'll trust FrontDesk.tsx or the parent context to handle global persistence if needed,
        // or we dispatch an event. For the demo, closing is sufficient.
        setIsEditing(false);
        onClose(); // Optional: close profile after edit
    };

    const renderOverview = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-2 gap-4">
                {/* Guest Card */}
                <Inspectable type="guest" id={guest?.principal || ''}>
                    <div
                        onClick={() => guest && inspect('guest', guest.principal)}
                        className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-violet-500 transition cursor-pointer group relative overflow-hidden"
                    >
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-violet-500"><ChevronRight className="w-4 h-4" /></div>
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs text-zinc-500 uppercase font-bold">Primary Guest</span>
                            <UserIcon className="w-4 h-4 text-zinc-600 group-hover:text-violet-500" />
                        </div>
                        <div className="font-medium text-zinc-200 text-lg">{guest?.fullName || 'Unknown'}</div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-1">ID: {guest?.principal.split('_')[1]}</div>
                    </div>
                </Inspectable>

                {/* Room Card */}
                <Inspectable type="room" id={room?.id || ''}>
                    <div
                        onClick={() => room && inspect('room', room.id)}
                        className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-teal-500 transition cursor-pointer group relative overflow-hidden"
                    >
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-teal-500"><ChevronRight className="w-4 h-4" /></div>
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs text-zinc-500 uppercase font-bold">Allocated Room</span>
                            <BedDouble className="w-4 h-4 text-zinc-600 group-hover:text-teal-500" />
                        </div>
                        <div className="font-medium text-zinc-200 text-lg">{room?.number || 'Unassigned'}</div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-1">{roomType?.name}</div>
                    </div>
                </Inspectable>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
                <h4 className="text-xs text-zinc-500 uppercase font-bold mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Stay Details
                </h4>
                <div className="grid grid-cols-3 gap-6">
                    <div>
                        <div className="text-xs text-zinc-500 mb-1">Check In</div>
                        <div className="text-sm font-bold text-zinc-200">{new Date(reservation.checkIn).toLocaleDateString()}</div>
                        <div className="text-[10px] text-zinc-600">14:00</div>
                    </div>
                    <div className="text-center border-x border-zinc-800">
                        <div className="text-xs text-zinc-500 mb-1">Duration</div>
                        <div className="text-sm font-bold text-violet-400">
                            {Math.ceil((new Date(reservation.checkOut).getTime() - new Date(reservation.checkIn).getTime()) / (1000 * 3600 * 24))} Nights
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-zinc-500 mb-1">Check Out</div>
                        <div className="text-sm font-bold text-zinc-200">{new Date(reservation.checkOut).toLocaleDateString()}</div>
                        <div className="text-[10px] text-zinc-600">11:00</div>
                    </div>
                </div>
            </div>

            {/* Advanced PMS Features (Phase 1.5) */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5">
                    <h4 className="text-xs text-zinc-500 uppercase font-bold mb-4 flex items-center gap-2">
                        <Globe className="w-4 h-4" /> Routing & Details
                    </h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-800">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Guarantee</span>
                            <span className="text-sm font-medium text-zinc-300">{reservation.guaranteeType || 'CC'}</span>
                        </div>
                        <div className="flex justify-between items-center bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-800">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Channel Code</span>
                            <span className="text-sm font-medium text-amber-500">{reservation.channel || 'EXPEDIA'}</span>
                        </div>
                        <div className="flex justify-between items-center bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-800">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Block ID</span>
                            <span className="text-sm font-medium text-violet-400">{reservation.blockId || 'N/A'}</span>
                        </div>
                        {reservation.routingInstructions && reservation.routingInstructions.length > 0 && (
                            <div className="mt-2 p-2 px-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                                <div className="text-[10px] text-violet-400 font-bold uppercase tracking-wider mb-1">Active Routing</div>
                                {reservation.routingInstructions.map((r, idx) => (
                                    <div key={idx} className="text-xs text-zinc-400">{r.type} ➔ {r.targetId}</div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5">
                    <h4 className="text-xs text-zinc-500 uppercase font-bold mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Traces & Alerts
                    </h4>
                    <div className="space-y-2">
                        {reservation.alerts && reservation.alerts.map((alert, idx) => (
                            <div key={`alert-${idx}`} className={`p-3 rounded-xl border flex gap-3 ${alert.severity === 'High' ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' :
                                alert.severity === 'Medium' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                                    'bg-violet-500/10 border-violet-500/30 text-violet-500'
                                }`}>
                                <AlertTriangle className="w-4 h-4 mt-0.5" />
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5">{alert.type} Alert</div>
                                    <div className="text-xs font-medium">{alert.message}</div>
                                </div>
                            </div>
                        ))}

                        {reservation.traces && reservation.traces.map((trace, idx) => (
                            <div key={`trace-${idx}`} className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-start gap-3">
                                <div className="p-1.5 bg-zinc-900 rounded-lg border border-zinc-800">
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Trace : {trace.department}</div>
                                        <div className="text-[9px] text-zinc-600 font-mono">{trace.date}</div>
                                    </div>
                                    <div className="text-xs text-zinc-300 mt-1 break-words leading-relaxed">{trace.text}</div>
                                </div>
                            </div>
                        ))}

                        {(!reservation.alerts || reservation.alerts.length === 0) && (!reservation.traces || reservation.traces.length === 0) && (
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                <CheckCircle className="w-8 h-8 text-zinc-700 mb-2" />
                                <div className="text-sm font-medium text-zinc-500">No active traces or alerts</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Accompanying Guests */}
            {reservation.accompanyingGuests && reservation.accompanyingGuests.length > 0 && (
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5 mt-4">
                    <h4 className="text-xs text-zinc-500 uppercase font-bold mb-4 flex items-center gap-2">
                        <UserIcon className="w-4 h-4" /> Accompanying Guests ({reservation.accompanyingGuests.length})
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        {reservation.accompanyingGuests.map((guestName, idx) => (
                            <div key={`acc-guest-${idx}`} className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                                <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500 font-bold text-xs">
                                    {guestName.charAt(0)}
                                </div>
                                <div className="text-sm font-medium text-zinc-300">{guestName}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex gap-2 mt-4">
                {localStatus === 'Confirmed' && (
                    <button
                        onClick={handleCheckIn}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition shadow-lg shadow-emerald-900/20"
                    >
                        Check In Guest
                    </button>
                )}

                {localStatus === 'Checked In' && (
                    <button
                        onClick={handleCheckOut}
                        className="flex-1 py-3 bg-zinc-100 hover:bg-white text-zinc-900 rounded-xl font-bold text-sm transition shadow-lg"
                    >
                        Check Out
                    </button>
                )}

                <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-medium text-sm transition"
                >
                    Edit Reservation
                </button>
            </div>
        </div>
    );

    const renderFolio = () => (
        localFolio ? (
            <FolioView
                folio={localFolio}
                onSettle={handleSettleBill}
            />
        ) : (
            <div className="flex items-center justify-center h-64 text-zinc-500">
                No folio found for this reservation.
            </div>
        )
    );

    const renderTimeline = () => (
        <div className="space-y-4 animate-fadeIn p-2">
            {/* Mock Timeline */}
            <div className="flex gap-4">
                <div className="flex flex-col items-center">
                    <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                    <div className="w-0.5 h-full bg-zinc-800"></div>
                </div>
                <div className="pb-6">
                    <div className="text-xs text-zinc-500 mb-1">{new Date(reservation.checkIn).toLocaleDateString()} 14:05</div>
                    <div className="text-sm font-bold text-zinc-200">Checked In</div>
                    <div className="text-xs text-zinc-400">Front Desk Agent (Sara J.) scanned passport.</div>
                </div>
            </div>
            <div className="flex gap-4">
                <div className="flex flex-col items-center">
                    <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
                    <div className="w-0.5 h-full bg-zinc-800"></div>
                </div>
                <div className="pb-6">
                    <div className="text-xs text-zinc-500 mb-1">{new Date(reservation.checkIn).toLocaleDateString()} 19:30</div>
                    <div className="text-sm font-bold text-zinc-200">Room Service Order</div>
                    <div className="text-xs text-zinc-400">Club Sandwich, Diet Coke. Bill to Room.</div>
                </div>
            </div>
            <div className="flex gap-4">
                <div className="flex flex-col items-center">
                    <div className="w-2 h-2 bg-zinc-600 rounded-full"></div>
                </div>
                <div>
                    <div className="text-xs text-zinc-500 mb-1">Today</div>
                    <div className="text-sm font-bold text-zinc-200">Reservation Viewed</div>
                    <div className="text-xs text-zinc-400">System Audit Log</div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
                <div
                    className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="relative z-10 px-8 pt-8 pb-4 flex justify-between items-start border-b border-zinc-800 bg-zinc-950">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-light text-zinc-100">Reservation</h2>
                                <span className="font-mono text-violet-400 text-lg">#{reservation.id.split('_')[1]}</span>
                            </div>
                            <div className="flex gap-3 mt-2">
                                <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold border bg-opacity-10 ${localStatus === 'Checked In' ? 'text-violet-400 border-violet-500 bg-violet-500' :
                                    localStatus === 'Checked Out' ? 'text-zinc-500 border-zinc-600 bg-zinc-600' : 'text-teal-400 border-teal-500 bg-teal-500'
                                    }`}>
                                    {localStatus}
                                </span>
                                <span className="text-xs text-zinc-500 flex items-center gap-1">
                                    <Tag className="w-3 h-3" /> Rate: {CONFIG_PROPERTY.currency} {reservation.rateApplied}
                                </span>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 bg-zinc-900/50 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition border border-zinc-800">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex px-8 border-b border-zinc-800 bg-zinc-900/30">
                        {['Overview', 'Folio', 'Timeline'].map(tab => (
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
                        {activeTab === 'Overview' && renderOverview()}
                        {activeTab === 'Folio' && renderFolio()}
                        {activeTab === 'Timeline' && renderTimeline()}
                    </div>
                </div>
            </div>

            <ReservationEditorModal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                onSave={handleSaveEdit}
                initialData={reservation}
                guests={PMS_GUESTS}
            />
        </>
    );
};

export default ReservationProfileModal;
