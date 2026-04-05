
import React, { useState, useMemo } from 'react';
import { usePms } from '../../services/kernel/persistence';
import { CURRENT_PROPERTY, ROOM_TYPES } from '../../services/kernel/config';
import { addItem, updateItem } from '../../services/kernel/firestoreService';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar
} from 'recharts';
import {
  TrendingUp, DollarSign, BedDouble, Target, Brain, Plus, Trash2,
  ChevronDown, ChevronUp, ToggleLeft, ToggleRight, BarChart3, AlertTriangle
} from 'lucide-react';
import { YieldRule, CompsetSnapshot, RateRecommendation, ReservationStatus } from '../../types';

// ── Helpers ──────────────────────────────────────────────────────────
const fmtCurrency = (v: number) => `${CURRENT_PROPERTY.currency} ${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const pct = (v: number) => `${v.toFixed(1)}%`;

const KpiCard = ({ title, value, sub, icon, color }: { title: string; value: string; sub: string; icon: React.ReactNode; color: string }) => (
  <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 group hover:border-white/10 transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2.5 rounded-xl border border-white/5 ${color}`}>{icon}</div>
      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{sub}</span>
    </div>
    <div className="text-3xl font-light text-white tracking-tight mb-1">{value}</div>
    <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-[0.15em]">{title}</div>
  </div>
);

// ── Main Component ───────────────────────────────────────────────────
const YieldDashboard: React.FC = () => {
  const {
    rooms,
    reservations,
    posOrders,
    yieldRules: YIELD_RULES,
    compsetSnapshots: COMPSET,
    rateRecommendations: RECOMMENDATIONS,
    demandEvents: DEMAND_EVENTS,
  } = usePms();

  const [activeTab, setActiveTab] = useState<'overview' | 'compset' | 'rules'>('overview');
  const [ruleFormOpen, setRuleFormOpen] = useState(false);
  const [newRule, setNewRule] = useState<Partial<YieldRule>>({
    name: '',
    condition: { metric: 'occupancy', operator: '>=', value: 85 },
    action: { adjustmentType: 'increase', valueType: 'percentage', value: 10 },
    isActive: true,
  });

  const yieldRules = YIELD_RULES || [];
  const compsetSnapshots = COMPSET || [];
  const recommendations = RECOMMENDATIONS || [];
  const demandEvents = DEMAND_EVENTS || [];

  // ── KPI Calculations ────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalRooms = rooms.length || 1;
    const inHouse = reservations.filter(r => r.status === ReservationStatus.CHECKED_IN).length;
    const occupancy = (inHouse / totalRooms) * 100;

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayRevenue = posOrders
      .filter(o => o.timestamp >= todayStart.getTime())
      .reduce((s, o) => s + (o.total ?? 0), 0);

    const adr = inHouse > 0 ? todayRevenue / inHouse : 0;
    const revpar = todayRevenue / totalRooms;

    return { occupancy, adr, revpar, inHouse, totalRooms, todayRevenue };
  }, [rooms, reservations, posOrders]);

  // ── 30-Day Occupancy Forecast (simulated from reservations) ─────────
  const forecastData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);

      const booked = reservations.filter(r =>
        new Date(r.checkIn) <= dayEnd && new Date(r.checkOut) >= dayStart
      ).length;
      const occ = rooms.length ? Math.round((booked / rooms.length) * 100) : 0;

      const matchEvent = demandEvents.find(e => e.date === dateStr);
      const impactBoost = matchEvent ? (matchEvent.impact === 'High' ? 20 : matchEvent.impact === 'Medium' ? 10 : 5) : 0;

      return {
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        occupancy: Math.min(occ + impactBoost, 100),
        baseline: occ,
        eventName: matchEvent?.name || null,
      };
    });
  }, [reservations, rooms, demandEvents]);

  // ── Compset Table Data ──────────────────────────────────────────────
  const compsetTable = useMemo(() => {
    if (!compsetSnapshots.length) {
      // Generate demo compset data
      return [
        { name: 'Market Average', rate: Math.round(kpis.adr * 0.95), diff: -5 },
        { name: 'Competitor A', rate: Math.round(kpis.adr * 1.08), diff: 8 },
        { name: 'Competitor B', rate: Math.round(kpis.adr * 0.88), diff: -12 },
        { name: 'Competitor C', rate: Math.round(kpis.adr * 1.02), diff: 2 },
      ];
    }
    const latest = compsetSnapshots.sort((a, b) => b.capturedAt - a.capturedAt)[0];
    return latest.competitors.map(c => ({
      name: c.name,
      rate: c.rate,
      diff: Math.round(((c.rate - kpis.adr) / (kpis.adr || 1)) * 100),
    }));
  }, [compsetSnapshots, kpis.adr]);

  // ── AI Recommendations ──────────────────────────────────────────────
  const aiRecs = useMemo(() => {
    if (recommendations.length) return recommendations.slice(0, 5);
    // Synthetic recommendations when no live data exists
    return ROOM_TYPES.map(rt => ({
      id: `rec_${rt.id}`,
      date: new Date().toISOString().slice(0, 10),
      baseRate: rt.baseRate,
      recommendedRate: Math.round(rt.baseRate * (kpis.occupancy > 70 ? 1.15 : 0.95)),
      currency: CURRENT_PROPERTY.currency,
      occupancy: kpis.occupancy,
      reasons: [
        kpis.occupancy > 70 ? 'High occupancy detected' : 'Occupancy below target',
        `Compset avg is ${compsetTable[0]?.rate ?? 'N/A'}`,
      ],
      createdAt: Date.now(),
    }));
  }, [recommendations, kpis.occupancy, compsetTable]);

  // ── Rule CRUD ───────────────────────────────────────────────────────
  const handleAddRule = async () => {
    if (!newRule.name) return;
    await addItem('yieldRules', {
      ...newRule,
      id: `yr_${Date.now()}`,
      isActive: true,
    });
    setNewRule({
      name: '',
      condition: { metric: 'occupancy', operator: '>=', value: 85 },
      action: { adjustmentType: 'increase', valueType: 'percentage', value: 10 },
      isActive: true,
    });
    setRuleFormOpen(false);
  };

  const toggleRule = async (rule: YieldRule) => {
    await updateItem('yieldRules', rule.id, { isActive: !rule.isActive });
  };

  // ── Tab Navigation ──────────────────────────────────────────────────
  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'compset' as const, label: 'Compset' },
    { id: 'rules' as const, label: 'Pricing Rules' },
  ];

  return (
    <div className="module-container bg-transparent flex flex-col h-full">
      {/* Header */}
      <header className="module-header flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-light text-white tracking-tight leading-none">Yield Management</h2>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">AI-Powered Revenue Optimization</p>
          </div>
        </div>
        <div className="flex gap-2">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${
                activeTab === t.id
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'text-zinc-500 hover:text-zinc-200 border border-transparent hover:border-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="module-body space-y-8">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Occupancy" value={pct(kpis.occupancy)} sub="Live" icon={<BedDouble className="w-5 h-5 text-emerald-400" />} color="bg-emerald-500/10" />
          <KpiCard title="ADR" value={fmtCurrency(kpis.adr)} sub="Today" icon={<DollarSign className="w-5 h-5 text-violet-400" />} color="bg-violet-500/10" />
          <KpiCard title="RevPAR" value={fmtCurrency(kpis.revpar)} sub="Today" icon={<BarChart3 className="w-5 h-5 text-amber-400" />} color="bg-amber-500/10" />
          <KpiCard title="Revenue" value={fmtCurrency(kpis.todayRevenue)} sub="Today" icon={<Target className="w-5 h-5 text-sky-400" />} color="bg-sky-500/10" />
        </div>

        {/* ── Tab: Overview ────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <>
            {/* Occupancy Forecast Chart */}
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-light text-white tracking-tight">30-Day Occupancy Forecast</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Projected vs baseline with event impacts</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} interval={4} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 10 }} domain={[0, 100]} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 12, fontSize: 11 }}
                    formatter={(value: number, name: string) => [`${value}%`, name === 'occupancy' ? 'Forecast' : 'Baseline']}
                    labelFormatter={(label) => {
                      const pt = forecastData.find(d => d.date === label);
                      return pt?.eventName ? `${label} — ${pt.eventName}` : label;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="baseline" stroke="#52525b" strokeWidth={1.5} dot={false} name="Baseline" />
                  <Line type="monotone" dataKey="occupancy" stroke="#34d399" strokeWidth={2} dot={false} name="Forecast" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* AI Rate Recommendations */}
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8">
              <div className="flex items-center gap-3 mb-6">
                <Brain className="w-5 h-5 text-violet-400" />
                <div>
                  <h3 className="text-xl font-light text-white tracking-tight">AI Rate Recommendations</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Neural engine suggestions for today</p>
                </div>
              </div>
              <div className="space-y-3">
                {aiRecs.map((rec) => {
                  const isIncrease = rec.recommendedRate > rec.baseRate;
                  const diffPct = Math.round(((rec.recommendedRate - rec.baseRate) / (rec.baseRate || 1)) * 100);
                  return (
                    <div key={rec.id} className="flex items-center justify-between bg-zinc-950/50 border border-white/5 rounded-2xl px-6 py-4 hover:border-white/10 transition-all">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-zinc-200 font-medium">{rec.date}</span>
                        <div className="flex items-center gap-2 mt-1">
                          {rec.reasons.map((r, i) => (
                            <span key={i} className="text-[9px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{r}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Current</span>
                          <span className="text-sm text-zinc-400">{fmtCurrency(rec.baseRate)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Suggested</span>
                          <span className={`text-sm font-semibold ${isIncrease ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {fmtCurrency(rec.recommendedRate)}
                          </span>
                        </div>
                        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${isIncrease ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {isIncrease ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />}
                          {Math.abs(diffPct)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── Tab: Compset ─────────────────────────────────────────── */}
        {activeTab === 'compset' && (
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8">
            <h3 className="text-xl font-light text-white tracking-tight mb-6">Competitive Set Comparison</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Table */}
              <div className="overflow-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.15em] pb-3">Competitor</th>
                      <th className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.15em] pb-3 text-right">Rate</th>
                      <th className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.15em] pb-3 text-right">vs. Our ADR</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/5 bg-violet-500/5">
                      <td className="py-3 text-sm text-violet-300 font-semibold">Your Property</td>
                      <td className="py-3 text-sm text-violet-300 font-semibold text-right">{fmtCurrency(kpis.adr)}</td>
                      <td className="py-3 text-sm text-zinc-500 text-right">--</td>
                    </tr>
                    {compsetTable.map((c, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 text-sm text-zinc-300">{c.name}</td>
                        <td className="py-3 text-sm text-zinc-300 text-right">{fmtCurrency(c.rate)}</td>
                        <td className={`py-3 text-sm text-right font-semibold ${c.diff > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {c.diff > 0 ? '+' : ''}{c.diff}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Bar Chart */}
              <div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[{ name: 'You', rate: Math.round(kpis.adr) }, ...compsetTable]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 12, fontSize: 11 }} />
                    <Bar dataKey="rate" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Pricing Rules ───────────────────────────────────── */}
        {activeTab === 'rules' && (
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-light text-white tracking-tight">Dynamic Pricing Rules</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Automated yield management logic</p>
              </div>
              <button
                onClick={() => setRuleFormOpen(!ruleFormOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[11px] font-bold hover:bg-emerald-500/20 transition"
              >
                <Plus className="w-3.5 h-3.5" /> New Rule
              </button>
            </div>

            {/* Rule Builder Form */}
            {ruleFormOpen && (
              <div className="bg-zinc-950/60 border border-white/5 rounded-2xl p-6 mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Rule Name</label>
                    <input
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/40"
                      value={newRule.name || ''}
                      onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                      placeholder="e.g. High Demand Surge"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">When Metric</label>
                    <select
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none"
                      value={newRule.condition?.metric || 'occupancy'}
                      onChange={e => setNewRule({ ...newRule, condition: { ...newRule.condition!, metric: e.target.value } })}
                    >
                      <option value="occupancy">Occupancy %</option>
                      <option value="adr">ADR</option>
                      <option value="revpar">RevPAR</option>
                      <option value="days_out">Days Out</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Operator / Threshold</label>
                    <div className="flex gap-2">
                      <select
                        className="bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-2 text-sm text-zinc-200 focus:outline-none"
                        value={newRule.condition?.operator || '>='}
                        onChange={e => setNewRule({ ...newRule, condition: { ...newRule.condition!, operator: e.target.value } })}
                      >
                        <option value=">=">&ge;</option>
                        <option value="<=">&le;</option>
                        <option value=">">&gt;</option>
                        <option value="<">&lt;</option>
                      </select>
                      <input
                        type="number"
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none"
                        value={newRule.condition?.value ?? 85}
                        onChange={e => setNewRule({ ...newRule, condition: { ...newRule.condition!, value: Number(e.target.value) } })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Action (% adjust)</label>
                    <div className="flex gap-2">
                      <select
                        className="bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-2 text-sm text-zinc-200 focus:outline-none"
                        value={newRule.action?.adjustmentType || 'increase'}
                        onChange={e => setNewRule({ ...newRule, action: { ...newRule.action!, adjustmentType: e.target.value } })}
                      >
                        <option value="increase">Increase</option>
                        <option value="decrease">Decrease</option>
                      </select>
                      <input
                        type="number"
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none"
                        value={newRule.action?.value ?? 10}
                        onChange={e => setNewRule({ ...newRule, action: { ...newRule.action!, value: Number(e.target.value) } })}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setRuleFormOpen(false)} className="px-4 py-2 text-[11px] text-zinc-500 hover:text-zinc-200 transition">Cancel</button>
                  <button onClick={handleAddRule} className="px-4 py-2 bg-emerald-600 rounded-xl text-[11px] font-bold text-white hover:bg-emerald-500 transition">Save Rule</button>
                </div>
              </div>
            )}

            {/* Rules List */}
            <div className="space-y-3">
              {yieldRules.length === 0 && !ruleFormOpen && (
                <div className="text-center py-12 text-zinc-600">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No pricing rules configured yet</p>
                  <p className="text-[10px] mt-1">Click "New Rule" to add automated yield logic</p>
                </div>
              )}
              {yieldRules.map(rule => (
                <div key={rule.id} className={`flex items-center justify-between bg-zinc-950/50 border rounded-2xl px-6 py-4 transition-all ${rule.isActive ? 'border-emerald-500/20' : 'border-white/5 opacity-60'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-200 font-medium">{rule.name}</span>
                      {rule.aiConfidence != null && (
                        <span className="text-[9px] bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full">
                          AI {Math.round(rule.aiConfidence * 100)}%
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      When {rule.condition.metric} {rule.condition.operator} {rule.condition.value} &rarr; {rule.action.adjustmentType} by {rule.action.value}{rule.action.valueType === 'percentage' ? '%' : ` ${CURRENT_PROPERTY.currency}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleRule(rule)} className="text-zinc-500 hover:text-zinc-200 transition">
                      {rule.isActive ? <ToggleRight className="w-6 h-6 text-emerald-400" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default YieldDashboard;
