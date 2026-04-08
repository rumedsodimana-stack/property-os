import React, { useState } from 'react';
import { ROOM_TYPES, CURRENT_PROPERTY } from '../../services/kernel/config';
import { RoomType } from '../../types';
import { Calendar, Users, Star, ArrowRight, Check } from 'lucide-react';
import BookingModal from './BookingModal';

interface BookingEngineProps {
  isOpen?: boolean;
  onBook?: (roomTypeId: string) => void;
  onBookingComplete?: (reservationId: string) => void;
}

const BookingEngine: React.FC<BookingEngineProps> = ({ isOpen = true, onBook, onBookingComplete }) => {
  const getDefaultDates = () => {
    const checkInDate = new Date();
    const checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkInDate.getDate() + 1);
    return {
      checkIn: checkInDate.toISOString().split('T')[0],
      checkOut: checkOutDate.toISOString().split('T')[0]
    };
  };

  const [dates, setDates] = useState(getDefaultDates());
  const [guests, setGuests] = useState(2);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);

  const handleBookNow = (roomTypeId: string) => {
    const roomType = ROOM_TYPES.find(rt => rt.id === roomTypeId);
    if (roomType) {
      setSelectedRoomType(roomType);
      setShowBookingModal(true);

      // Call legacy callback if provided
      onBook?.(roomTypeId);
    }
  };

  const handleCloseModal = () => {
    setShowBookingModal(false);
    setSelectedRoomType(null);
  };

  if (!isOpen) return null;

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      {/* Search Header */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-amber-900/30 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-600/10 rounded-full blur-[80px]"></div>
        <h2 className="text-3xl font-serif text-slate-100 mb-2 relative z-10">Find Your Sanctuary</h2>
        <p className="text-slate-400 text-sm mb-6 relative z-10">Experience the singularity of luxury at {CURRENT_PROPERTY.name}.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
          <div className="space-y-1">
            <label className="text-xs text-amber-500 uppercase tracking-wider font-bold">Check-in</label>
            <div className="flex items-center bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200">
              <Calendar className="w-4 h-4 mr-3 text-slate-500" />
              <input
                type="date"
                value={dates.checkIn}
                onChange={(e) => setDates({ ...dates, checkIn: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="bg-transparent border-none outline-none text-sm w-full"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-amber-500 uppercase tracking-wider font-bold">Check-out</label>
            <div className="flex items-center bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200">
              <Calendar className="w-4 h-4 mr-3 text-slate-500" />
              <input
                type="date"
                value={dates.checkOut}
                onChange={(e) => setDates({ ...dates, checkOut: e.target.value })}
                min={dates.checkIn}
                className="bg-transparent border-none outline-none text-sm w-full"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-amber-500 uppercase tracking-wider font-bold">Guests</label>
            <div className="flex items-center bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200">
              <Users className="w-4 h-4 mr-3 text-slate-500" />
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="bg-transparent border-none outline-none text-sm w-full appearance-none"
              >
                {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Room Results */}
      <div className="space-y-6">
        <h3 className="text-slate-400 text-xs uppercase tracking-wider">Available Rooms</h3>
        <div className="grid grid-cols-1 gap-6">
          {ROOM_TYPES.map((room) => (
            <div
              key={room.id}
              className={`group relative bg-slate-900/40 backdrop-blur-md border ${selectedType === room.id ? 'border-amber-500' : 'border-white/5'} rounded-2xl overflow-hidden transition-all hover:border-amber-500/30`}
              onClick={() => setSelectedType(room.id)}
            >
              <div className="flex flex-col md:flex-row h-full">
                <div className="md:w-1/3 h-48 md:h-auto relative overflow-hidden">
                  <img src={room.image} alt={room.name} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                  <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur px-2 py-1 rounded-md text-[10px] text-amber-500 border border-amber-500/20 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-500" /> AI Match 98%
                  </div>
                </div>
                <div className="p-6 md:w-2/3 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-xl font-serif text-slate-100 group-hover:text-amber-400 transition">{room.name}</h4>
                      <div className="text-right">
                        <div className="text-2xl text-emerald-400 font-light">{CURRENT_PROPERTY.currency} {room.baseRate}</div>
                        <div className="text-[10px] text-slate-500">per night</div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 mb-4 leading-relaxed">{room.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {room.amenities.map(am => (
                        <span key={am} className="text-[10px] uppercase bg-slate-800 text-slate-300 px-2 py-1 rounded border border-white/5">{am}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleBookNow(room.id); }}
                      className="px-6 py-2 bg-slate-100 text-slate-900 rounded-lg text-sm font-medium hover:bg-amber-500 hover:text-white transition flex items-center gap-2 shadow-lg"
                    >
                      Book Now <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={handleCloseModal}
        roomType={selectedRoomType}
        checkIn={dates.checkIn}
        checkOut={dates.checkOut}
        guests={guests}
      />
    </div>
  );
};

export default BookingEngine;
