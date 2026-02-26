
import React, { useState, useMemo } from 'react';
import { Reservation, Room, RoomType } from '../../types';
import { ROOM_TYPES } from '../../services/kernel/config';
import { X, BedDouble, Check, AlertCircle } from 'lucide-react';

interface RoomAllocationModalProps {
    reservation: Reservation;
    rooms: Room[]; // Now accepting live rooms data
    onClose: () => void;
    onAssign: (roomId: string) => void;
}

const RoomAllocationModal: React.FC<RoomAllocationModalProps> = ({ reservation, rooms, onClose, onAssign }) => {
    const requestedType = ROOM_TYPES.find(t => t.id === reservation.roomTypeId);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

    // Filter available rooms (Memoized for performance)
    const availableRooms = useMemo(() => {
        return rooms.filter(room => {
            // 1. Must match requested type
            if (room.typeId !== reservation.roomTypeId) return false;

            // 2. Must not be occupied (Simplified for MVP)
            // Available = Not Occupied AND Not Maintenance
            const unavailableStatuses = ['Occupied', 'Maintenance', 'Dirty'];
            // Check if status string contains any of the unavailable statuses
            // Note: RoomStatus enum values like 'Occupied' or 'Dirty/Departure'
            return !unavailableStatuses.some(status => room.status.includes(status));
        });
    }, [rooms, reservation.roomTypeId]);

    const handleAssign = () => {
        if (selectedRoomId) {
            onAssign(selectedRoomId);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                    <div>
                        <h3 className="text-lg font-light text-white">Assign Room</h3>
                        <p className="text-xs text-zinc-500">Reservation #{reservation.id.split('_')[1]}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">

                    {/* Requirement Card */}
                    <div className="bg-violet-900/10 border border-violet-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
                        <div className="p-2 bg-violet-500/20 rounded-lg text-violet-400">
                            <BedDouble className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-violet-200">Requested: {requestedType?.name}</div>
                            <div className="text-xs text-violet-400/70 mt-1">
                                {new Date(reservation.checkIn).toLocaleDateString()} — {new Date(reservation.checkOut).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Available Rooms ({availableRooms.length})</h4>

                    {availableRooms.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-zinc-800 rounded-xl">
                            <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                            <p className="text-zinc-500 text-sm">No matching rooms available.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {availableRooms.map(room => (
                                <div
                                    key={room.id}
                                    onClick={() => setSelectedRoomId(room.id)}
                                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${selectedRoomId === room.id
                                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-100'
                                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-lg font-mono font-bold">{room.number}</div>
                                        <div className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${room.status === 'Clean/Ready' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                                            }`}>
                                            {room.status}
                                        </div>
                                    </div>
                                    {selectedRoomId === room.id && <Check className="w-5 h-5 text-emerald-500" />}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 hover:bg-zinc-800 rounded-lg text-zinc-400 text-xs font-bold transition">
                        Cancel
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={!selectedRoomId}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold uppercase tracking-wide transition shadow-lg shadow-emerald-900/20"
                    >
                        Confirm Assignment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoomAllocationModal;
