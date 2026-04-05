import React, { useState, useMemo } from 'react';
import {
  Brain, Activity, Cpu, DollarSign, Gauge, Shield,
  RefreshCw, AlertTriangle, CheckCircle2, XCircle,
  Zap, Clock, TrendingUp
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AgentHealth {
  id: string;
  name: string;
  avatar: string;
  color: string;
  status: 'online' | 'degraded' | 'offline';
  model: string;
  provider: string;
  lastAction: string;
  lastActionTime: string;
  uptime: number;
  requestsToday: number;
}

interface TokenUsagePoint {
  hour: string;
  input: number;
  output: number;
}

interface CostEntry {
  date: string;
  cost: number;
  budget: number;
}

interface CapabilityRow {
  capability: string;
  wal: boolean;
  don: boolean;
  ali: boolean;
  fred: boolean;
}

interface RateLimitStatus {
  agent: string;
  color: string;
  requestsUsed: number;
  requestsLimit: number;
  tokensUsed: number;
  tokensLimit: number;
  resetIn: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const AGENTS: AgentHealth[] = [
  {
    id: 'wal', name: 'WAL', avatar: '🧠', color: 'violet',
    status: 'online', model: 'claude-3-5-sonnet', provider: 'anthropic',
    lastAction: 'Generated brand compliance report', lastActionTime: '2 min ago',
    uptime: 99.8, requestsToday: 142,
  },
  {
    id: 'don', name: 'DON', avatar: '⚡', color: 'amber',
    status: 'online', model: 'gpt-4-turbo', provider: 'openai',
    lastAction: 'Optimized housekeeping schedule', lastActionTime: '8 min ago',
    uptime: 99.5, requestsToday: 87,
  },
  {
    id: 'ali', name: 'ALI', avatar: '📊', color: 'emerald',
    status: 'degraded', model: 'gemini-pro', provider: 'gemini',
    lastAction: 'Processed revenue forecast', lastActionTime: '14 min ago',
    uptime: 97.2, requestsToday: 63,
  },
  {
    id: 'fred', name: 'FRED', avatar: '🛡️', color: 'sky',
    status: 'online', model: 'llama3.2', provider: 'ollama',
    lastAction: 'Answered guest inquiry #4821', lastActionTime: '1 min ago',
    uptime: 99.9, requestsToday: 318,
  },
];

const TOKEN_USAGE: TokenUsagePoint[] = Array.from({ length: 12 }, (_, i) => ({
  hour: `${(8 + i).toString().padStart(2, '0')}:00`,
  input: Math.floor(Math.random() * 15000) + 3000,
  output: Math.floor(Math.random() * 8000) + 1500,
}));

const COST_TREND: CostEntry[] = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (6 - i));
  return {
    date: d.toLocaleDateString(undefined, { weekday: 'short' }),
    cost: parseFloat((Math.random() * 4 + 1.5).toFixed(2)),
    budget: 5,
  };
});

const CAPABILITIES: CapabilityRow[] = [
  { capability: 'Guest Chat', wal: false, don: false, ali: false, fred: true },
  { capability: 'Brand Compliance', wal: true, don: false, ali: false, fred: false },
  { capability: 'Schedule Optimization', wal: false, don: true, ali: false, fred: false },
  { capability: 'Revenue Analytics', wal: false, don: false, ali: true, fred: false },
  { capability: 'Code Generation', wal: true, don: true, ali: false, fred: false },
  { capability: 'Pattern Learning', wal: false, don: true, ali: true, fred: false },
  { capability: 'System Config', wal: true, don: false, ali: false, fred: false },
  { capability: 'Report Generation', wal: false, don: false, ali: true, fred: false },
];

const RATE_LIMITS: RateLimitStatus[] = [
  { agent: 'WAL', color: 'violet', requestsUsed: 142, requestsLimit: 500, tokensUsed: 38200, tokensLimit: 100000, resetIn: '4h 12m' },
  { agent: 'DON', color: 'amber', requestsUsed: 87, requestsLimit: 300, tokensUsed: 22800, tokensLimit: 80000, resetIn: '4h 12m' },
  { agent: 'ALI', color: 'emerald', requestsUsed: 63, requestsLimit: 200, tokensUsed: 51200, tokensLimit: 60000, resetIn: '4h 12m' },
  { agent: 'FRED', color: 'sky', requestsUsed: 318, requestsLimit: 1000, tokensUsed: 12400, tokensLimit: 50000, resetIn: '4h 12m' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusColor = (s: AgentHealth['status']) => {
  if (s === 'online') return 'bg-emerald-500';
  if (s === 'degraded') return 'bg-amber-500';
  return 'bg-rose-500';
};

const statusBadge = (s: AgentHealth['status']) => {
  if (s === 'online') return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
  if (s === 'degraded') return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
  return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
};

const agentBorder = (color: string) => {
  const map: Record<string, string> = {
    violet: 'border-violet-500/20 hover:border-violet-500/40',
    amber: 'border-amber-500/20 hover:border-amber-500/40',
    emerald: 'border-emerald-500/20 hover:border-emerald-500/40',
    sky: 'border-sky-500/20 hover:border-sky-500/40',
  };
  return map[color] || 'border-zinc-800';
};

const pctBar = (used: number, limit: number) => {
  const pct = Math.min((used / limit) * 100, 100);
  const color = pct > 80 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500';
  return { pct, color };
};

// ─── Component ───────────────────────────────────────────────────────────────

const AIArchitectureDashboard: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const totalCostToday = useMemo(
    () => COST_TREND[COST_TREND.length - 1]?.cost ?? 0,
    [refreshKey]
  );

  const totalTokensToday = useMemo(
    () => TOKEN_USAGE.reduce((s, t) => s + t.input + t.output, 0),
    [refreshKey]
  );

  return (
    <div className="module-container bg-transparent flex flex-col h-full animate-fadeIn">
      {/* Header */}
      <header className="module-header flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <div className="p-3 bg-violet-500/10 rounded-2xl border border-violet-500/20">
            <Brain className="w-6 h-6 text-violet-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-light text-white tracking-tight leading-none">AI Architecture Dashboard</h2>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">4 Agents Active</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Multi-Agent Orchestration</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-2 text-[11px] text-zinc-400 font-semibold hover:text-zinc-100 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </header>

      <main className="module-body space-y-8 overflow-y-auto flex-1">
        {/* Agent Health Cards */}
        <section>
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em] mb-4">Agent Health</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {AGENTS.map(agent => (
              <div
                key={agent.id}
                className={`bg-zinc-900/60 border rounded-2xl p-5 transition-all duration-200 ${agentBorder(agent.color)}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-xl border border-zinc-700">
                      {agent.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{agent.name}</div>
                      <div className="text-[10px] text-zinc-500">{agent.provider}/{agent.model}</div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusBadge(agent.status)}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${statusColor(agent.status)} ${agent.status === 'online' ? 'animate-pulse' : ''}`} />
                    {agent.status}
                  </div>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Last Action</span>
                    <span className="text-zinc-300 text-right max-w-[60%] truncate">{agent.lastAction}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Time</span>
                    <span className="text-zinc-300">{agent.lastActionTime}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Uptime</span>
                    <span className="text-emerald-400 font-semibold">{agent.uptime}%</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Requests Today</span>
                    <span className="text-zinc-200 font-semibold">{agent.requestsToday}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Token Usage + Cost Tracking */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Token Usage Chart */}
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-white">Token Usage</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Today: {totalTokensToday.toLocaleString()} tokens</p>
              </div>
              <Cpu className="w-5 h-5 text-violet-400" />
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={TOKEN_USAGE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="hour" stroke="#52525b" tick={{ fontSize: 9, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#52525b" tick={{ fontSize: 9, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '1rem', fontSize: '11px' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Bar dataKey="input" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Input" />
                  <Bar dataKey="output" fill="#6366f1" radius={[4, 4, 0, 0]} name="Output" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cost Tracking */}
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-white">Cost Tracking</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Today: ${totalCostToday.toFixed(2)} / $5.00 budget</p>
              </div>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={COST_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" stroke="#52525b" tick={{ fontSize: 9, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#52525b" tick={{ fontSize: 9, fontWeight: 'bold' }} axisLine={false} tickLine={false} domain={[0, 8]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '1rem', fontSize: '11px' }}
                    formatter={(v: number) => [`$${v.toFixed(2)}`, '']}
                  />
                  <Line type="monotone" dataKey="cost" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} name="Cost" />
                  <Line type="monotone" dataKey="budget" stroke="#ef4444" strokeWidth={1} strokeDasharray="6 3" dot={false} name="Budget" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Capability Matrix + Rate Limits */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Capability Matrix */}
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-white">Capability Matrix</h3>
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-zinc-500 font-bold uppercase tracking-wider">
                    <th className="text-left py-2 pr-4">Capability</th>
                    <th className="text-center py-2 px-3">WAL</th>
                    <th className="text-center py-2 px-3">DON</th>
                    <th className="text-center py-2 px-3">ALI</th>
                    <th className="text-center py-2 px-3">FRED</th>
                  </tr>
                </thead>
                <tbody>
                  {CAPABILITIES.map((row, i) => (
                    <tr key={i} className="border-t border-zinc-800/50">
                      <td className="py-2.5 pr-4 text-zinc-300 font-medium">{row.capability}</td>
                      {(['wal', 'don', 'ali', 'fred'] as const).map(agent => (
                        <td key={agent} className="text-center py-2.5 px-3">
                          {row[agent] ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                          ) : (
                            <XCircle className="w-4 h-4 text-zinc-700 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rate Limiting Status */}
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-white">Rate Limiting Status</h3>
              <Gauge className="w-5 h-5 text-sky-400" />
            </div>
            <div className="space-y-5">
              {RATE_LIMITS.map(rl => {
                const req = pctBar(rl.requestsUsed, rl.requestsLimit);
                const tok = pctBar(rl.tokensUsed, rl.tokensLimit);
                return (
                  <div key={rl.agent} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{rl.agent}</span>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                        <Clock className="w-3 h-3" />
                        Reset in {rl.resetIn}
                      </div>
                    </div>
                    {/* Requests bar */}
                    <div>
                      <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                        <span>Requests</span>
                        <span>{rl.requestsUsed}/{rl.requestsLimit}</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${req.color}`} style={{ width: `${req.pct}%` }} />
                      </div>
                    </div>
                    {/* Tokens bar */}
                    <div>
                      <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                        <span>Tokens</span>
                        <span>{rl.tokensUsed.toLocaleString()}/{rl.tokensLimit.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${tok.color}`} style={{ width: `${tok.pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIArchitectureDashboard;
