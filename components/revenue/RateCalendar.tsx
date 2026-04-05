
import React, { useState, useMemo, useCallback } from 'react';
import { usePms } from '../../services/kernel/persistence';
import { CURRENT_PROPERTY, ROOM_TYPES } from '../../services/kernel/config';
import {
  ChevronLeft, ChevronRight, Calendar, X, Check, Edit3
} from 'lucide-react';

const fmtCurrency = (v: number) => `${CURRENT_PROPERTY.currency} ${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getDemandColor = (occupancy: number): string => {
  if (occupancy >= 85) return 'bg-rose-500/15 border-rose-500/30 text-rose-300';
  if (occupancy >= 60) return 'bg-amber-500/15 border-amber-500/30 text-amber-300';
  return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';
};

const getDemandDot = (occupancy: number): string => {
  if (occupancy >= 85) return 'bg-rose-500';
  if (occupancy >= 60) return 'bg-amber-500';
  return 'bg-emerald-500';
};

interface DayData {
  date: Date;
  dateStr: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  occupancy: number;
  rates: { typeId: string; typeName: string; baseRate: number; effectiveRate: number }[];
}

interface EditingCell {
  dateStr: string;
  typeId: string;
  value: string;
}

const RateCalendar: React.FC = () => {
  const { rooms, reservations, demandEvents: DEMAND_EVENTS } = usePms();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  const demandEvents = DEMAND_EVENTS || [];

  const prevMonth = () => setCurrentMonth(prev => { const d = new Date(prev); d.setMonth(d.getMonth() - 1); return d; });
  const nextMonth = () => setCurrentMonth(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + 1); return d; });
  const goToday = () => setCurrentMonth(new Date());

  const calendarDays: DayData[] = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days: DayData[] = [];

    for (let i = -startPad; i <= lastDay.getDate() + (6 - lastDay.getDay()); i++) {
      const date = new Date(year, month, i + 1);
      const dateStr = date.toISOString().slice(0, 10);
      const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);

      const booked = reservations.filter(r =>
        new Date(r.checkIn) <= dayEnd && new Date(r.checkOut) >= dayStart
      ).length;
      const totalRooms = rooms.length || 1;
      const occ = Math.round((booked / totalRooms) * 100);

      const demandMultiplier = occ >= 85 ? 1.20 : occ >= 60 ? 1.08 : 1.0;
      const matchEvent = demandEvents.find(e => e.date === dateStr);
      const eventBoost = matchEvent ? (matchEvent.impact === 'High' ? 1.15 : matchEvent.impact === 'Medium' ? 1.08 : 1.03) : 1.0;

      const rates = ROOM_TYPES.map(rt => ({
        typeId: rt.id,
        typeName: rt.name,
        baseRate: rt.baseRate,
        effectiveRate: Math.round(rt.baseRate * demandMultiplier * eventBoost),
      }));

      days.push({
        date, dateStr, dayOfMonth: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isToday: date.getTime() === today.getTime(),
        occupancy: occ, rates,
      });
    }
    return days;
  }, [currentMonth, rooms, reservations, demandEvents]);

  const startEdit = (dateStr: string, typeId: string, currentRate: number) => {
    setEditing({ dateStr, typeId, value: String(currentRate) });
  };
  const confirmEdit = useCallback(async () => { if (!editing) return; setEditing(null); }, [editing]);
  const cancelEdit = () => setEditing(null);

  const visibleTypes = selectedCategory === 'all' ? ROOM_TYPES : ROOM_TYPES.filter(rt => rt.id === selectedCategory);
  const monthLabel = currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className="module-container bg-transparent flex flex-col h-full">
      <header className="module-header flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <div className="p-3 bg-sky-500/10 rounded-2xl border border-sky-500/20">
            <Calendar className="w-6 h-6 text-sky-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-light text-white tracking-tight leading-none">Rate Calendar</h2>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Daily rates by room category &bull; color-coded by demand</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-[11px] text-zinc-300 font-semibold focus:outline-none"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {ROOM_TYPES.map(rt => (<option key={rt.id} value={rt.id}>{rt.name}</option>))}
          </select>
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={goToday} className="px-3 py-2 rounded-xl text-[11px] font-bold text-zinc-300 hover:bg-zinc-800 transition min-w-[140px] text-center">{monthLabel}</button>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <main className="module-body flex-1 overflow-auto">
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Low (&lt;60%)</span></div>
          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Moderate (60-84%)</span></div>
          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-rose-500" /><span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">High (&ge;85%)</span></div>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 overflow-auto">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map(d => (<div key={d} className="text-center text-[9px] font-black text-zinc-500 uppercase tracking-[0.15em] py-2">{d}</div>))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const matchEvent = demandEvents.find(e => e.date === day.dateStr);
              return (
                <div
                  key={day.dateStr}
                  onClick={() => day.isCurrentMonth && setSelectedDay(day)}
                  className={`min-h-[90px] rounded-xl border p-2 cursor-pointer transition-all hover:scale-[1.02] ${
                    !day.isCurrentMonth ? 'opacity-30 border-transparent'
                      : day.isToday ? 'border-violet-500/40 bg-violet-500/5'
                        : getDemandColor(day.occupancy)
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold ${day.isToday ? 'text-violet-400' : day.isCurrentMonth ? 'text-zinc-300' : 'text-zinc-600'}`}>{day.dayOfMonth}</span>
                    {day.isCurrentMonth && (
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${getDemandDot(day.occupancy)}`} />
                        <span className="text-[8px] font-bold text-zinc-500">{day.occupancy}%</span>
                      </div>
                    )}
                  </div>
                  {day.isCurrentMonth && (
                    <div className="space-y-0.5">
                      {visibleTypes.slice(0, 2).map(rt => {
                        const rateInfo = day.rates.find(r => r.typeId === rt.id);
                        if (!rateInfo) return null;
                        return (
                          <div key={rt.id} className="flex justify-between items-center">
                            <span className="text-[8px] text-zinc-500 truncate max-w-[60px]">{rt.name.split(' ')[0]}</span>
                            <span className="text-[9px] font-bold text-zinc-300">{fmtCurrency(rateInfo.effectiveRate)}</span>
                          </div>
                        );
                      })}
                      {matchEvent && (<div className="text-[7px] text-amber-400 font-bold truncate mt-0.5" title={matchEvent.name}>{matchEvent.name}</div>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {selectedDay && (
          <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setSelectedDay(null); setEditing(null); }}>
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-md w-full p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-light text-white tracking-tight">
                    {selectedDay.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${getDemandDot(selectedDay.occupancy)}`} />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Occupancy: {selectedDay.occupancy}%</span>
                  </div>
                </div>
                <button onClick={() => { setSelectedDay(null); setEditing(null); }} className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                {selectedDay.rates.map(rate => (
                  <div key={rate.typeId} className="flex items-center justify-between bg-zinc-900/60 border border-white/5 rounded-2xl px-5 py-3">
                    <div>
                      <span className="text-sm text-zinc-200 font-medium">{rate.typeName}</span>
                      <span className="text-[9px] text-zinc-500 block">Base: {fmtCurrency(rate.baseRate)}</span>
                    </div>
                    {editing && editing.dateStr === selectedDay.dateStr && editing.typeId === rate.typeId ? (
                      <div className="flex items-center gap-2">
                        <input autoFocus type="number" className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/40"
                          value={editing.value} onChange={e => setEditing({ ...editing, value: e.target.value })}
                          onKeyDown={e => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') cancelEdit(); }} />
                        <button onClick={confirmEdit} className="p-1 text-emerald-400 hover:text-emerald-300"><Check className="w-4 h-4" /></button>
                        <button onClick={cancelEdit} className="p-1 text-zinc-500 hover:text-zinc-200"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-emerald-400">{fmtCurrency(rate.effectiveRate)}</span>
                        <button onClick={() => startEdit(selectedDay.dateStr, rate.typeId, rate.effectiveRate)} className="p-1 text-zinc-600 hover:text-zinc-300 transition"><Edit3 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {(() => {
                const ev = demandEvents.find(e => e.date === selectedDay.dateStr);
                if (!ev) return null;
                return (
                  <div className="mt-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl px-5 py-3">
                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Event</span>
                    <p className="text-sm text-zinc-200 mt-0.5">{ev.name}</p>
                    <p className="text-[10px] text-zinc-500">Impact: {ev.impact} {ev.expectedAttendance ? `| ${ev.expectedAttendance.toLocaleString()} expected` : ''}</p>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default RateCalendar;
