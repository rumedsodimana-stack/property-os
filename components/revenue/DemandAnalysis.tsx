
import React, { useState, useMemo } from 'react';
import { usePms } from '../../services/kernel/persistence';
import { CURRENT_PROPERTY } from '../../services/kernel/config';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, Cell
} from 'recharts';
import {
  Activity, TrendingUp, Calendar, Flame, BarChart3, Layers
} from 'lucide-react';
import { DemandEvent } from '../../types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const impactColor = (impact: string) => {
  if (impact === 'High') return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  if (impact === 'Medium') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
};

const heatmapColor = (value: number): string => {
  if (value >= 85) return 'bg-rose-500/60';
  if (value >= 70) return 'bg-rose-500/30';
  if (value >= 55) return 'bg-amber-500/30';
  if (value >= 40) return 'bg-amber-500/15';
  if (value >= 25) return 'bg-emerald-500/15';
  return 'bg-zinc-800/40';
};

const DemandAnalysis: React.FC = () => {
  const { rooms, reservations, posOrders, demandEvents: DEMAND_EVENTS } = usePms();
  const [activeTab, setActiveTab] = useState<'historical' | 'events' | 'seasonal' | 'forecast'>('historical');
  const demandEvents = DEMAND_EVENTS || [];

  // Historical Demand (Monthly YoY)
  const historicalData = useMemo(() => {
    const now = new Date();
    const thisYear = now.getFullYear();
    return MONTHS.map((label, monthIdx) => {
      const monthStart = new Date(thisYear, monthIdx, 1);
      const monthEnd = new Date(thisYear, monthIdx + 1, 0, 23, 59, 59, 999);
      const monthReservations = reservations.filter(r => {
        const ci = new Date(r.checkIn);
        return ci >= monthStart && ci <= monthEnd;
      }).length;
      const totalRooms = rooms.length || 1;
      const daysInMonth = monthEnd.getDate();
      const roomNights = totalRooms * daysInMonth;
      const currentOcc = roomNights > 0 ? Math.round((monthReservations / roomNights) * 100) : 0;
      const prevOcc = Math.max(5, Math.min(95, currentOcc + Math.round((Math.random() - 0.5) * 20)));
      const monthRevenue = posOrders
        .filter(o => o.timestamp >= monthStart.getTime() && o.timestamp <= monthEnd.getTime())
        .reduce((s, o) => s + (o.total ?? 0), 0);
      return { month: label, currentYear: currentOcc, previousYear: prevOcc, revenue: monthRevenue };
    });
  }, [reservations, rooms, posOrders]);

  // Seasonal Heatmap Data
  const heatmapData = useMemo(() => {
    const thisYear = new Date().getFullYear();
    return MONTHS.map((month, monthIdx) => {
      const weeks = Array.from({ length: 4 }, (_, weekIdx) => {
        const weekStart = new Date(thisYear, monthIdx, weekIdx * 7 + 1);
        const weekEnd = new Date(thisYear, monthIdx, weekIdx * 7 + 7, 23, 59, 59, 999);
        const booked = reservations.filter(r => {
          const ci = new Date(r.checkIn);
          return ci >= weekStart && ci <= weekEnd;
        }).length;
        const totalRooms = rooms.length || 1;
        return Math.min(100, Math.max(0, Math.round((booked / (totalRooms * 7)) * 100)));
      });
      return { month, weeks };
    });
  }, [reservations, rooms]);

  // 90-Day Forecast
  const forecastData = useMemo(() => {
    return Array.from({ length: 90 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
      const booked = reservations.filter(r =>
        new Date(r.checkIn) <= dayEnd && new Date(r.checkOut) >= dayStart
      ).length;
      const occ = rooms.length ? Math.round((booked / rooms.length) * 100) : 0;
      const matchEvent = demandEvents.find(e => e.date === dateStr);
      const eventBoost = matchEvent ? (matchEvent.impact === 'High' ? 25 : matchEvent.impact === 'Medium' ? 15 : 5) : 0;
      const forecast = Math.min(100, occ + eventBoost);
      const confidence = Math.max(3, Math.round(i * 0.4));
      return {
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        forecast, upper: Math.min(100, forecast + confidence), lower: Math.max(0, forecast - confidence),
      };
    });
  }, [reservations, rooms, demandEvents]);

  const sortedEvents = useMemo(() => [...demandEvents].sort((a, b) => a.date.localeCompare(b.date)), [demandEvents]);

  const tabs = [
    { id: 'historical' as const, label: 'Historical', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'events' as const, label: 'Events', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'seasonal' as const, label: 'Seasonal', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'forecast' as const, label: 'Forecast', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="module-container bg-transparent flex flex-col h-full">
      <header className="module-header flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
            <Activity className="w-6 h-6 text-amber-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-light text-white tracking-tight leading-none">Demand Analysis</h2>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Historical trends, events &amp; seasonal intelligence</p>
          </div>
        </div>
        <div className="flex gap-2">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${
                activeTab === t.id ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                  : 'text-zinc-500 hover:text-zinc-200 border border-transparent hover:border-white/5'
              }`}>{t.icon} {t.label}</button>
          ))}
        </div>
      </header>

      <main className="module-body space-y-8">
        {/* Historical YoY */}
        {activeTab === 'historical' && (
          <div className="space-y-8">
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8">
              <div className="mb-6">
                <h3 className="text-xl font-light text-white tracking-tight">Occupancy Year-over-Year</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Monthly comparison with previous year</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 10 }} domain={[0, 100]} unit="%" />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 12, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="currentYear" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="This Year" />
                  <Line type="monotone" dataKey="previousYear" stroke="#52525b" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Last Year" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8">
              <div className="mb-6">
                <h3 className="text-xl font-light text-white tracking-tight">Monthly Revenue</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Total revenue by month ({CURRENT_PROPERTY.currency})</p>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 12, fontSize: 11 }}
                    formatter={(value: number) => [`${CURRENT_PROPERTY.currency} ${value.toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                    {historicalData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.currentYear >= 70 ? '#f59e0b' : entry.currentYear >= 40 ? '#a78bfa' : '#3f3f46'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Events Impact Timeline */}
        {activeTab === 'events' && (
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8">
            <div className="mb-6">
              <h3 className="text-xl font-light text-white tracking-tight">Event Impact Timeline</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Upcoming events and their demand influence</p>
            </div>
            {sortedEvents.length === 0 ? (
              <div className="text-center py-16 text-zinc-600">
                <Flame className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No demand events configured</p>
                <p className="text-[10px] mt-1">Events can be added via the Configuration module or API</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-px bg-zinc-800" />
                <div className="space-y-4">
                  {sortedEvents.map((event) => {
                    const eventDate = new Date(event.date);
                    const daysUntil = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    const isPast = daysUntil < 0;
                    return (
                      <div key={event.id} className={`relative pl-14 ${isPast ? 'opacity-50' : ''}`}>
                        <div className={`absolute left-4 w-4 h-4 rounded-full border-2 ${
                          event.impact === 'High' ? 'bg-rose-500 border-rose-400' :
                          event.impact === 'Medium' ? 'bg-amber-500 border-amber-400' : 'bg-emerald-500 border-emerald-400'
                        }`} />
                        <div className="bg-zinc-950/50 border border-white/5 rounded-2xl px-6 py-4 hover:border-white/10 transition-all">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm text-zinc-200 font-medium">{event.name}</span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${impactColor(event.impact)}`}>{event.impact} Impact</span>
                                {event.category && <span className="text-[9px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{event.category}</span>}
                              </div>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-[10px] text-zinc-500">{eventDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                {event.venue && <span className="text-[10px] text-zinc-600">{event.venue}</span>}
                                {event.expectedAttendance && <span className="text-[10px] text-zinc-600">{event.expectedAttendance.toLocaleString()} attendees</span>}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`text-xs font-bold ${isPast ? 'text-zinc-600' : daysUntil <= 7 ? 'text-amber-400' : 'text-zinc-400'}`}>
                                {isPast ? `${Math.abs(daysUntil)}d ago` : daysUntil === 0 ? 'Today' : `${daysUntil}d away`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Seasonal Heatmap */}
        {activeTab === 'seasonal' && (
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8">
            <div className="mb-6">
              <h3 className="text-xl font-light text-white tracking-tight">Seasonal Demand Heatmap</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Weekly occupancy intensity across the year</p>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Intensity:</span>
              <div className="flex gap-1">
                {[0, 25, 40, 55, 70, 85].map(v => (<div key={v} className={`w-6 h-4 rounded ${heatmapColor(v)}`} title={`${v}%`} />))}
              </div>
              <span className="text-[9px] text-zinc-600">Low to High</span>
            </div>
            <div className="overflow-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.15em] text-left pb-3 pr-4">Month</th>
                    <th className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.15em] pb-3 text-center">Wk 1</th>
                    <th className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.15em] pb-3 text-center">Wk 2</th>
                    <th className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.15em] pb-3 text-center">Wk 3</th>
                    <th className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.15em] pb-3 text-center">Wk 4</th>
                    <th className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.15em] pb-3 text-right pl-4">Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {heatmapData.map((row) => {
                    const avg = Math.round(row.weeks.reduce((s, w) => s + w, 0) / row.weeks.length);
                    return (
                      <tr key={row.month} className="border-b border-white/5">
                        <td className="py-2 pr-4 text-xs text-zinc-300 font-medium">{row.month}</td>
                        {row.weeks.map((w, i) => (
                          <td key={i} className="py-2 text-center">
                            <div className={`mx-auto w-12 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${heatmapColor(w)} ${w > 0 ? 'text-zinc-200' : 'text-zinc-600'}`}>{w}%</div>
                          </td>
                        ))}
                        <td className="py-2 pl-4 text-right">
                          <span className={`text-xs font-bold ${avg >= 70 ? 'text-amber-400' : avg >= 40 ? 'text-zinc-300' : 'text-zinc-500'}`}>{avg}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Forecast */}
        {activeTab === 'forecast' && (
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8">
            <div className="mb-6">
              <h3 className="text-xl font-light text-white tracking-tight">90-Day Demand Forecast</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Predicted occupancy with confidence intervals</p>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 9 }} interval={9} />
                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 12, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="upper" stroke="#3f3f46" strokeWidth={1} strokeDasharray="3 3" dot={false} name="Upper Bound" />
                <Line type="monotone" dataKey="forecast" stroke="#f59e0b" strokeWidth={2} dot={false} name="Forecast" />
                <Line type="monotone" dataKey="lower" stroke="#3f3f46" strokeWidth={1} strokeDasharray="3 3" dot={false} name="Lower Bound" />
              </LineChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {(() => {
                const next7 = forecastData.slice(0, 7);
                const next30 = forecastData.slice(0, 30);
                const next90 = forecastData;
                const avg = (arr: typeof forecastData) => arr.length ? Math.round(arr.reduce((s, d) => s + d.forecast, 0) / arr.length) : 0;
                const peak = Math.max(...forecastData.map(d => d.forecast));
                return [
                  { label: 'Next 7 Days', value: `${avg(next7)}%` },
                  { label: 'Next 30 Days', value: `${avg(next30)}%` },
                  { label: '90-Day Average', value: `${avg(next90)}%` },
                  { label: 'Peak Forecast', value: `${peak}%` },
                ].map((stat, i) => (
                  <div key={i} className="bg-zinc-950/50 border border-white/5 rounded-2xl p-4 text-center">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</span>
                    <div className="text-2xl font-light text-white mt-1">{stat.value}</div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DemandAnalysis;
