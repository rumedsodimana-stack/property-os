import React, { useState, useEffect, useRef } from 'react';
import { User, Room, Reservation, ReservationStatus } from '../types';
import { generateConciergeResponse } from '../services/intelligence/geminiService';
import { Mic, Send, Thermometer, Lamp, Lock, Utensils, Bed, Compass, CalendarCheck, Clock, CheckCircle } from 'lucide-react';
import BookingEngine from './pms/BookingEngine';
import { guestActionService } from '../services/operations/guestActionService';
import { subscribeToItems } from '../services/kernel/firestoreService';
import { usePms } from '../services/kernel/persistence';

interface GuestAppProps {
  user: User;
  room: Room | undefined;
  reservation?: Reservation;
}

const GuestApp: React.FC<GuestAppProps> = ({ user, room: initialRoom, reservation: initialRes }) => {
  const { outlets } = usePms();
  const [liveRoom, setLiveRoom] = useState<Room | undefined>(initialRoom);
  const [liveRes, setLiveRes] = useState<Reservation | undefined>(initialRes);

  const initialTab = liveRes?.status === ReservationStatus.CHECKED_IN ? 'home' : 'booking';

  const [activeTab, setActiveTab] = useState<'home' | 'controls' | 'concierge' | 'booking'>(initialTab);

  const guestLastName = user.fullName?.split(' ').pop() || 'Guest';

  const [messages, setMessages] = useState<{ id: string; text: string; sender: 'user' | 'ai' }[]>([
    { id: '1', text: `Welcome, ${guestLastName}. I can help with room services, concierge requests, and checkout assistance.`, sender: 'ai' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showLateCheckoutModal, setShowLateCheckoutModal] = useState(false);
  const [lateCheckoutTime, setLateCheckoutTime] = useState('1:00 PM');

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubRes = subscribeToItems<Reservation>('reservations', (data) => {
      const userRes = data.find(r =>
        r.guestId === user.principal &&
        (r.status === ReservationStatus.CHECKED_IN || r.status === ReservationStatus.CONFIRMED)
      );
      setLiveRes(userRes);
    });

    return () => unsubRes();
  }, [user.principal]);

  useEffect(() => {
    if (liveRes?.roomId) {
      const unsubRoom = subscribeToItems<Room>('rooms', (data) => {
        const currentRoom = data.find(r => r.id === liveRes.roomId);
        setLiveRoom(currentRoom);
      });
      return () => unsubRoom();
    }
  }, [liveRes?.roomId]);

  useEffect(() => {
    if (liveRes?.status === ReservationStatus.CHECKED_IN && activeTab === 'booking') {
      setActiveTab('home');
    }
  }, [liveRes]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);


  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const newMsg = { id: Date.now().toString(), text: inputText, sender: 'user' as const };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setIsTyping(true);

    const aiRes = await generateConciergeResponse(inputText, {
      name: user.fullName,
      preferences: user.preferences,
      loyalty: user.loyaltyTier,
      reservation: liveRes,
      roomStatus: liveRoom?.iotStatus,
      checkOut: liveRes?.checkOut,
      location: 'Current Property',
      time: new Date().toLocaleTimeString()
    });

    setIsTyping(false);
    setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: aiRes.text, sender: 'ai' }]);

    // Process AI Intent
    if (aiRes.intent && liveRes) {
      console.log("[GuestApp] AI Intent Detected:", aiRes.intent);
      await guestActionService.processIntent(liveRes.id, aiRes.intent as any);

      // Optionally notify guest that service is being dispatched
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        text: `⚡ System: Request for "${aiRes.intent?.action}" has been dispatched to ${aiRes.intent?.type}.`,
        sender: 'ai'
      }]);
    }
  };

  const handleBookRoom = (roomTypeId: string, reservationId?: string) => {
    if (reservationId) {
      // Booking completed successfully
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: `✅ Booking confirmed! Your reservation ${reservationId} has been created. We look forward to welcoming you!`,
        sender: 'ai'
      }]);
      setActiveTab('concierge');
    }
  };

  const handleLateCheckoutRequest = () => {
    setShowLateCheckoutModal(false);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: `Request received: Late checkout for ${lateCheckoutTime}. Our Front Desk is reviewing availability and will confirm shortly.`,
        sender: 'ai'
      }]);
      setActiveTab('concierge');
    }, 500);
  };

  const renderHome = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="relative h-56 rounded-3xl overflow-hidden shadow-2xl border border-violet-900/30 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_45%)]" />
        <div className="absolute bottom-6 left-6 right-6 space-y-1">
          <h2 className="text-3xl font-light tracking-tight text-white">Your Stay</h2>
          <p className="text-zinc-300 text-sm flex items-center gap-2">
            <Compass className="w-4 h-4 text-violet-500" /> Reservation {liveRes?.id ? `#${liveRes.id.slice(-6)}` : 'Pending'}
          </p>
          {liveRes && (
            <p className="text-xs text-zinc-500">
              Check-out: {new Date(liveRes.checkOut).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-2 hover:bg-zinc-800/50 transition cursor-pointer" onClick={() => setActiveTab('controls')}>
          <div className="p-3 bg-violet-500/10 rounded-full text-violet-500">
            <Bed className="w-6 h-6" />
          </div>
          <span className="text-zinc-200 text-sm font-medium">My Room</span>
        </div>
        <div className="p-4 bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-2 hover:bg-zinc-800/50 transition cursor-pointer">
          <div className="p-3 bg-cyan-500/10 rounded-full text-cyan-500">
            <Utensils className="w-6 h-6" />
          </div>
          <span className="text-zinc-200 text-sm font-medium">Dining ({outlets.length} Outlets)</span>
        </div>
      </div>

      <div className="p-5 bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/5">
        <h3 className="text-zinc-500 text-xs uppercase tracking-wider mb-4 font-bold">Service Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl bg-zinc-950/60 border border-zinc-800 p-3">
            <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Room</p>
            <p className="text-sm text-zinc-200 mt-1">{liveRoom ? `#${liveRoom.number}` : 'Not assigned'}</p>
          </div>
          <div className="rounded-xl bg-zinc-950/60 border border-zinc-800 p-3">
            <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Door</p>
            <p className="text-sm text-zinc-200 mt-1">{liveRoom?.iotStatus?.doorLocked ? 'Locked' : 'Unlocked'}</p>
          </div>
          <div className="rounded-xl bg-zinc-950/60 border border-zinc-800 p-3">
            <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Temperature</p>
            <p className="text-sm text-zinc-200 mt-1">{liveRoom?.iotStatus?.temp ?? user.preferences?.temperature ?? 22}°C</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderControls = () => {
    if (!liveRoom) return <div className="p-8 text-center text-zinc-500">Please check in to access room controls.</div>;

    return (
      <div className="space-y-6 animate-fadeIn">
        <h2 className="text-2xl font-light text-zinc-100">Room {liveRoom.number}</h2>

        <div className="grid grid-cols-1 gap-4">
          <div className="p-6 bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-950 rounded-full text-violet-500 border border-zinc-800">
                <Thermometer className="w-6 h-6" />
              </div>
              <div>
                <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Climate</div>
                <div className="text-2xl text-zinc-100 font-light">{user.preferences?.temperature || 22}°C</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full bg-zinc-950 text-zinc-400 hover:bg-violet-600 hover:text-white transition flex items-center justify-center">-</button>
              <button className="w-10 h-10 rounded-full bg-zinc-950 text-zinc-400 hover:bg-violet-600 hover:text-white transition flex items-center justify-center">+</button>
            </div>
          </div>

          <div className="p-6 bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-950 rounded-full text-violet-500 border border-zinc-800">
                <Lamp className="w-6 h-6" />
              </div>
              <div>
                <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Ambience</div>
                <div className="text-2xl text-zinc-100 font-light">{user.preferences?.lighting || 'Standard'}</div>
              </div>
            </div>
            <input type="range" className="w-24 accent-violet-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
          </div>

          <div className="p-6 bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-950 rounded-full text-violet-500 border border-zinc-800">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Door</div>
                <div className="text-lg text-teal-400 font-medium">Locked</div>
              </div>
            </div>
            <button className="px-4 py-2 bg-zinc-950 rounded-lg text-xs text-violet-400 border border-violet-500/20">Unlock</button>
          </div>

          <div className="p-6 bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-950 rounded-full text-violet-500 border border-zinc-800">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Checkout</div>
                <div className="text-lg text-zinc-100 font-medium">11:00 AM</div>
              </div>
            </div>
            <button
              onClick={() => setShowLateCheckoutModal(true)}
              className="px-4 py-2 bg-violet-600 rounded-lg text-xs text-white hover:bg-violet-500 transition shadow-lg shadow-violet-900/20"
            >
              Request Late
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderConcierge = () => (
    <div className="flex flex-col h-[calc(100dvh-220px)] animate-fadeIn">
      <div className="flex-1 overflow-y-auto space-y-4 p-2 scrollbar-hide" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${msg.sender === 'user'
              ? 'bg-violet-600 text-white rounded-tr-none'
              : 'bg-zinc-800 text-zinc-200 border border-white/5 rounded-tl-none'
              }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && <div className="text-zinc-500 text-xs italic ml-4">Concierge is responding...</div>}
      </div>

      <div className="mt-4 p-2 bg-zinc-900/80 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
        <button className="p-3 rounded-full hover:bg-zinc-800 text-zinc-400 transition">
          <Mic className="w-5 h-5" />
        </button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask Concierge..."
          className="flex-1 bg-transparent border-none outline-none text-zinc-200 placeholder-zinc-600 text-sm"
        />
        <button
          onClick={handleSendMessage}
          className="p-3 rounded-full bg-violet-600 text-white hover:bg-violet-500 transition shadow-lg shadow-violet-900/50">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-zinc-950 pb-24 font-sans selection:bg-violet-500/30">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 px-4 md:px-6 py-4 md:py-6 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 flex justify-between items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-violet-900/20">
          {user.loyaltyTier ? String(user.loyaltyTier)[0] : 'G'}
        </div>
        <h1 className="text-[10px] md:text-xs tracking-[0.25em] md:tracking-[0.3em] text-zinc-400 font-bold uppercase truncate">Singularity OS</h1>
        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse shadow-[0_0_10px_#14b8a6]"></span>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-6 py-4 md:py-6">
        <BookingEngine isOpen={activeTab === 'booking'} onBook={handleBookRoom} />
        {activeTab === 'home' && renderHome()}
        {activeTab === 'controls' && renderControls()}
        {activeTab === 'concierge' && renderConcierge()}
      </div>

      {/* Late Checkout Modal */}
      {showLateCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-[40px]"></div>

            <h3 className="text-xl font-light text-zinc-100 mb-2 relative z-10">Request Late Checkout</h3>
            <p className="text-sm text-zinc-400 mb-6 relative z-10">
              Select your desired departure time.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
              {['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM'].map(time => (
                <button
                  key={time}
                  onClick={() => setLateCheckoutTime(time)}
                  className={`py-3 rounded-xl border text-sm font-medium transition flex flex-col items-center justify-center gap-1 ${lateCheckoutTime === time
                    ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-900/30'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                    }`}
                >
                  {time}
                  {time === '3:00 PM' && <span className="text-[9px] uppercase bg-zinc-950/50 px-1.5 rounded text-violet-200">Fee Applies</span>}
                </button>
              ))}
            </div>

            <div className="flex gap-3 relative z-10">
              <button
                onClick={() => setShowLateCheckoutModal(false)}
                className="flex-1 py-3 bg-zinc-800 text-zinc-300 rounded-xl hover:bg-zinc-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLateCheckoutRequest}
                className="flex-1 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-500 transition shadow-lg shadow-violet-900/20 font-medium"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800 py-3 md:py-4 px-5 md:px-8 flex justify-between items-center z-20 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <button onClick={() => setActiveTab('booking')} className={`flex flex-col items-center gap-1 transition ${activeTab === 'booking' ? 'text-violet-500' : 'text-zinc-600'}`}>
          <CalendarCheck className="w-6 h-6" />
          <span className="text-[10px] uppercase tracking-widest font-bold">Book</span>
        </button>
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition ${activeTab === 'home' ? 'text-violet-500' : 'text-zinc-600'}`}>
          <Compass className="w-6 h-6" />
          <span className="text-[10px] uppercase tracking-widest font-bold">Explore</span>
        </button>
        {liveRes?.status === ReservationStatus.CHECKED_IN && (
          <button onClick={() => setActiveTab('controls')} className={`flex flex-col items-center gap-1 transition ${activeTab === 'controls' ? 'text-violet-500' : 'text-zinc-600'}`}>
            <Bed className="w-6 h-6" />
            <span className="text-[10px] uppercase tracking-widest font-bold">Room</span>
          </button>
        )}
        <button onClick={() => setActiveTab('concierge')} className={`flex flex-col items-center gap-1 transition ${activeTab === 'concierge' ? 'text-violet-500' : 'text-zinc-600'}`}>
          <div className="relative">
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-violet-500 rounded-full"></span>
            <Mic className="w-6 h-6" />
          </div>
          <span className="text-[10px] uppercase tracking-widest font-bold">AI</span>
        </button>
      </div>
    </div>
  );
};

export default GuestApp;
