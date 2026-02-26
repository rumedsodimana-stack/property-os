import React, { useState, useEffect } from 'react';
import { X, Calendar, User as UserIcon, BedDouble, Save, Hash, Plus, ChevronLeft } from 'lucide-react';
import { Reservation, ReservationStatus, User } from '../../types';
import { ROOM_TYPES } from '../../services/kernel/config';
import { addItem } from '../../services/kernel/firestoreService';

interface ReservationEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (reservation: Partial<Reservation>) => void;
    initialData?: Reservation; // Pass if editing an existing reservation
    guests: User[]; // Provide guest list for dropdown selection
}

const ReservationEditorModal: React.FC<ReservationEditorModalProps> = ({ isOpen, onClose, onSave, initialData, guests }) => {
    const normalizeText = (value: string, maxLen = 120) =>
        value.replace(/[<>]/g, '').trim().slice(0, maxLen);

    // Basic Form State
    const [guestId, setGuestId] = useState('');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [roomTypeId, setRoomTypeId] = useState('');

    // Advanced Form State (from 1.5.2)
    const [guaranteeType, setGuaranteeType] = useState<'Credit Card' | 'Deposit' | 'Company' | 'Non-Guaranteed'>('Credit Card');
    const [channel, setChannel] = useState<'Direct' | 'OTA' | 'GDS' | 'Walk-In' | 'Corporate'>('Direct');
    const [accompanyingGuests, setAccompanyingGuests] = useState<string[]>([]);
    const [newAccompanyingGuest, setNewAccompanyingGuest] = useState('');

    const [isCreatingGuest, setIsCreatingGuest] = useState(false);
    const [newGuestData, setNewGuestData] = useState({ firstName: '', lastName: '', email: '', phone: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Populate form for editing
                setGuestId(initialData.guestId || '');
                setCheckIn(initialData.checkIn.split('T')[0]); // Basic ISO extraction
                setCheckOut(initialData.checkOut.split('T')[0]);
                setRoomTypeId(initialData.roomTypeId || '');
                setGuaranteeType(initialData.guaranteeType as any || 'Credit Card');
                setChannel(initialData.channel as any || 'Direct');
                setAccompanyingGuests(initialData.accompanyingGuests || []);
            } else {
                // Reset form for creating
                setGuestId('');

                // Default Check-In: Today
                const today = new Date();
                setCheckIn(today.toISOString().split('T')[0]);

                // Default Check-Out: Tomorrow
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                setCheckOut(tomorrow.toISOString().split('T')[0]);

                setRoomTypeId(ROOM_TYPES[0]?.id || '');
                setGuaranteeType('Credit Card');
                setChannel('Direct');
                setAccompanyingGuests([]);
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (saving) return;
        let finalGuestId = guestId;

        if (!checkIn || !checkOut || new Date(checkOut).getTime() <= new Date(checkIn).getTime()) {
            alert('Check-out must be later than check-in.');
            return;
        }

        if (isCreatingGuest) {
            const firstName = normalizeText(newGuestData.firstName, 40);
            const lastName = normalizeText(newGuestData.lastName, 40);
            if (!firstName || !lastName) {
                alert('Please provide at least a First and Last name for the new guest.');
                return;
            }
            const newGuestId = `gst_${Date.now()}`;
            const newGuest: any = {
                principal: newGuestId,
                fullName: `${firstName} ${lastName}`.trim(),
                email: normalizeText(newGuestData.email, 120).toLowerCase(),
                phone: normalizeText(newGuestData.phone, 30),
                role: 'Guest',
                hotelId: 'H1', // Default or grab from config
                loyaltyTier: 'Silver',
                preferences: {},
                valenceHistory: []
            };

            await addItem('guests', newGuest as any);
            finalGuestId = newGuestId;
        } else if (!finalGuestId) {
            alert('Please select a guest or create a new one.');
            return;
        }

        try {
            setSaving(true);
            onSave({
                ...(initialData ? initialData : {}), // Keep ID/Status if editing
                guestId: finalGuestId,
                checkIn: new Date(`${checkIn}T14:00:00Z`).toISOString(), // Default 14:00 checkin
                checkOut: new Date(`${checkOut}T11:00:00Z`).toISOString(), // Default 11:00 checkout
                roomTypeId,
                guaranteeType,
                channel,
                accompanyingGuests: accompanyingGuests.map(g => normalizeText(g, 60)).filter(Boolean),
                status: initialData ? initialData.status : ReservationStatus.CONFIRMED // Default for new
            });
            onClose();
        } finally {
            setSaving(false);
        }
    };

    const handleAddAccompanyingGuest = () => {
        if (newAccompanyingGuest.trim()) {
            setAccompanyingGuests([...accompanyingGuests, newAccompanyingGuest.trim()]);
            setNewAccompanyingGuest('');
        }
    };

    const removeAccompanyingGuest = (idx: number) => {
        setAccompanyingGuests(accompanyingGuests.filter((_, i) => i !== idx));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-zinc-800 bg-zinc-900/50">
                    <div>
                        <h2 className="text-xl font-light text-white tracking-tight flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-emerald-500" />
                            {initialData ? 'Edit Reservation' : 'New Reservation'}
                        </h2>
                        {initialData && <p className="text-xs text-zinc-500 font-mono mt-1">ID: #{initialData.id.split('_')[1]}</p>}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">

                    {/* Primary Guest Selection */}
                    <div className="space-y-2 relative">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                <UserIcon className="w-3 h-3" /> Primary Guest *
                            </label>

                            {!isCreatingGuest ? (
                                <button type="button" onClick={() => setIsCreatingGuest(true)} className="text-[10px] text-emerald-500 hover:text-emerald-400 font-bold uppercase transition flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Quick Add Walk-In
                                </button>
                            ) : (
                                <button type="button" onClick={() => setIsCreatingGuest(false)} className="text-[10px] text-zinc-500 hover:text-zinc-400 font-bold uppercase transition flex items-center gap-1">
                                    <ChevronLeft className="w-3 h-3" /> Select Existing
                                </button>
                            )}
                        </div>

                        {!isCreatingGuest ? (
                            <select
                                value={guestId}
                                onChange={(e) => setGuestId(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none focus:border-emerald-500/50 transition-all appearance-none"
                            >
                                <option value="" disabled>Select a guest profile...</option>
                                {guests.map(g => (
                                    <option key={g.principal} value={g.principal}>{g.fullName} ({g.loyaltyTier})</option>
                                ))}
                            </select>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 bg-zinc-900 border border-emerald-500/20 rounded-xl p-4">
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">First Name *</label>
                                    <input type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none" value={newGuestData.firstName} onChange={e => setNewGuestData({ ...newGuestData, firstName: e.target.value })} placeholder="Jane" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Last Name *</label>
                                    <input type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none" value={newGuestData.lastName} onChange={e => setNewGuestData({ ...newGuestData, lastName: e.target.value })} placeholder="Doe" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Email</label>
                                    <input type="email" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none" value={newGuestData.email} onChange={e => setNewGuestData({ ...newGuestData, email: e.target.value })} placeholder="jane.doe@example.com" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Phone</label>
                                    <input type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none" value={newGuestData.phone} onChange={e => setNewGuestData({ ...newGuestData, phone: e.target.value })} placeholder="+1 555-0198" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Check-In / Check-Out */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Check In *</label>
                            <input
                                type="date"
                                value={checkIn}
                                onChange={(e) => setCheckIn(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none focus:border-emerald-500/50 transition-all [color-scheme:dark]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Check Out *</label>
                            <input
                                type="date"
                                value={checkOut}
                                onChange={(e) => setCheckOut(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none focus:border-emerald-500/50 transition-all [color-scheme:dark]"
                            />
                        </div>
                    </div>

                    {/* Room Type */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            <BedDouble className="w-3 h-3" /> Room Type *
                        </label>
                        <select
                            value={roomTypeId}
                            onChange={(e) => setRoomTypeId(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none focus:border-emerald-500/50 transition-all appearance-none"
                        >
                            <option value="" disabled>Select room type...</option>
                            {ROOM_TYPES.map(rt => (
                                <option key={rt.id} value={rt.id}>{rt.name} - ${rt.baseRate}/night</option>
                            ))}
                        </select>
                    </div>

                    <div className="h-px bg-zinc-800/50 w-full" />

                    {/* Advanced Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Guarantee Type</label>
                            <select
                                value={guaranteeType}
                                onChange={(e) => setGuaranteeType(e.target.value as any)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-emerald-500/50 transition-all appearance-none"
                            >
                                <option value="Credit Card">Credit Card</option>
                                <option value="Deposit">Deposit</option>
                                <option value="Company">Company Link</option>
                                <option value="Non-Guaranteed">Non-Guaranteed (6PM Hold)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Booking Channel</label>
                            <select
                                value={channel}
                                onChange={(e) => setChannel(e.target.value as any)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-emerald-500/50 transition-all appearance-none"
                            >
                                <option value="Direct">Direct (Phone/Web)</option>
                                <option value="Walk-In">Walk-In</option>
                                <option value="OTA">OTA (Booking/Expedia)</option>
                                <option value="Corporate">Corporate Negotiated</option>
                                <option value="GDS">GDS (Sabre/Amadeus)</option>
                            </select>
                        </div>
                    </div>

                    {/* Accompanying Guests */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Accompanying Guests</label>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="E.g. Jane Doe"
                                value={newAccompanyingGuest}
                                onChange={(e) => setNewAccompanyingGuest(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddAccompanyingGuest()}
                                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-200 outline-none focus:border-emerald-500/50 transition-all"
                            />
                            <button
                                onClick={handleAddAccompanyingGuest}
                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-xl transition"
                            >
                                Add
                            </button>
                        </div>

                        {accompanyingGuests.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {accompanyingGuests.map((guest, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-300">
                                        {guest}
                                        <button onClick={() => removeAccompanyingGuest(idx)} className="text-zinc-500 hover:text-rose-400"><X className="w-3.5 h-3.5" /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || (!isCreatingGuest && !guestId) || !checkIn || !checkOut || !roomTypeId}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : initialData ? 'Update Reservation' : 'Create Reservation'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ReservationEditorModal;
