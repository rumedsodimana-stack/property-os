
import React, { useState, useMemo } from 'react';
import { Star, TrendingUp, TrendingDown, MessageSquare, Clock, Send, ThumbsUp, Minus, ThumbsDown, ExternalLink, Filter, RefreshCw, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// ── Types ────────────────────────────────────────────────────────────────────
interface PlatformReview {
  id: string;
  platform: 'Booking.com' | 'TripAdvisor' | 'Google' | 'Expedia';
  guestName: string;
  rating: number;
  date: number;
  snippet: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  responded: boolean;
  responseText?: string;
  category?: string;
}

interface PlatformScore {
  platform: string;
  rating: number;
  reviewCount: number;
  color: string;
  trend: number; // delta vs previous month
}

interface MonthlyTrend {
  month: string;
  rating: number;
  reviews: number;
}

// ── Seed data ────────────────────────────────────────────────────────────────
const SEED_PLATFORMS: PlatformScore[] = [
  { platform: 'Booking.com', rating: 8.7, reviewCount: 1243, color: '#003580', trend: 0.2 },
  { platform: 'TripAdvisor', rating: 4.3, reviewCount: 876, color: '#00af87', trend: -0.1 },
  { platform: 'Google', rating: 4.5, reviewCount: 2104, color: '#4285f4', trend: 0.3 },
  { platform: 'Expedia', rating: 4.2, reviewCount: 534, color: '#ffc439', trend: 0.0 },
];

const SEED_REVIEWS: PlatformReview[] = [
  { id: 'r1', platform: 'Google', guestName: 'Ahmed Al-Khalifa', rating: 5, date: Date.now() - 1 * 86400000, snippet: 'Exceptional service and stunning views from the rooftop pool. The staff went above and beyond during our anniversary celebration.', sentiment: 'positive', responded: true, responseText: 'Thank you for the wonderful review!', category: 'Service' },
  { id: 'r2', platform: 'Booking.com', guestName: 'Sarah M.', rating: 4, date: Date.now() - 2 * 86400000, snippet: 'Great location and clean rooms. Breakfast could use more variety for international guests.', sentiment: 'positive', responded: false, category: 'F&B' },
  { id: 'r3', platform: 'TripAdvisor', guestName: 'TravellerUK2025', rating: 2, date: Date.now() - 3 * 86400000, snippet: 'AC in room 412 was broken for 2 days. Maintenance was slow to respond. Very disappointing for a 5-star property.', sentiment: 'negative', responded: false, category: 'Engineering' },
  { id: 'r4', platform: 'Expedia', guestName: 'JohnD', rating: 3, date: Date.now() - 4 * 86400000, snippet: 'Average experience overall. Nothing particularly bad but nothing special either. Expected more at this price point.', sentiment: 'neutral', responded: true, responseText: 'We appreciate your candid feedback and are working to elevate the experience.', category: 'Value' },
  { id: 'r5', platform: 'Google', guestName: 'Fatima Al-Sayed', rating: 5, date: Date.now() - 5 * 86400000, snippet: 'The concierge arranged a last-minute desert tour that was absolutely magical. Cannot recommend this hotel enough!', sentiment: 'positive', responded: true, responseText: 'We are thrilled you enjoyed the experience!', category: 'Concierge' },
  { id: 'r6', platform: 'Booking.com', guestName: 'Marco R.', rating: 4, date: Date.now() - 6 * 86400000, snippet: 'Beautiful property with attentive staff. The spa was world-class. Only downside was slow WiFi in the lobby.', sentiment: 'positive', responded: false, category: 'IT' },
  { id: 'r7', platform: 'TripAdvisor', guestName: 'WanderlustJane', rating: 1, date: Date.now() - 7 * 86400000, snippet: 'Checked in late and room was not ready despite guarantee. Front desk was unapologetic. Will not return.', sentiment: 'negative', responded: false, category: 'Front Desk' },
  { id: 'r8', platform: 'Google', guestName: 'Khalid B.', rating: 4, date: Date.now() - 8 * 86400000, snippet: 'Solid business hotel with excellent meeting rooms. The executive lounge is one of the best in the region.', sentiment: 'positive', responded: true, responseText: 'Thank you for choosing us for your business travel.', category: 'Facilities' },
  { id: 'r9', platform: 'Expedia', guestName: 'LisaT', rating: 3, date: Date.now() - 10 * 86400000, snippet: 'Room was fine but nothing to write home about. Bathroom amenities were generic.', sentiment: 'neutral', responded: false, category: 'Housekeeping' },
  { id: 'r10', platform: 'Booking.com', guestName: 'Yuki T.', rating: 5, date: Date.now() - 12 * 86400000, snippet: 'Absolutely loved the Japanese-themed suite. The attention to detail in the room design was remarkable.', sentiment: 'positive', responded: true, responseText: 'We are delighted you appreciated the design!', category: 'Rooms' },
];

const SEED_MONTHLY: MonthlyTrend[] = [
  { month: 'Oct', rating: 4.1, reviews: 189 },
  { month: 'Nov', rating: 4.2, reviews: 213 },
  { month: 'Dec', rating: 4.4, reviews: 267 },
  { month: 'Jan', rating: 4.3, reviews: 241 },
  { month: 'Feb', rating: 4.5, reviews: 198 },
  { month: 'Mar', rating: 4.6, reviews: 224 },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const StarRating: React.FC<{ rating: number; max?: number; size?: number }> = ({ rating, max = 5, size = 14 }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: max }, (_, i) => (
      <Star
        key={i}
        size={size}
        className={i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}
      />
    ))}
  </div>
);

const platformIcon = (platform: string) => {
  const colors: Record<string, string> = {
    'Booking.com': 'bg-blue-900/30 text-blue-400 border-blue-500/20',
    'TripAdvisor': 'bg-emerald-900/30 text-emerald-400 border-emerald-500/20',
    'Google': 'bg-sky-900/30 text-sky-400 border-sky-500/20',
    'Expedia': 'bg-yellow-900/30 text-yellow-400 border-yellow-500/20',
  };
  return colors[platform] || 'bg-zinc-800 text-zinc-400 border-zinc-700';
};

const sentimentColor = (s: string) => {
  if (s === 'positive') return 'text-emerald-400';
  if (s === 'negative') return 'text-rose-400';
  return 'text-zinc-400';
};

const sentimentIcon = (s: string) => {
  if (s === 'positive') return <ThumbsUp size={12} />;
  if (s === 'negative') return <ThumbsDown size={12} />;
  return <Minus size={12} />;
};

// ── Component ────────────────────────────────────────────────────────────────
const ReputationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'respond'>('overview');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const reviews = SEED_REVIEWS;
  const platforms = SEED_PLATFORMS;
  const monthlyTrend = SEED_MONTHLY;

  // Computed metrics
  const overallRating = useMemo(() => {
    const total = platforms.reduce((s, p) => s + p.rating * p.reviewCount, 0);
    const count = platforms.reduce((s, p) => s + p.reviewCount, 0);
    return count > 0 ? total / count : 0;
  }, [platforms]);

  const overallTrend = useMemo(() => {
    return platforms.reduce((s, p) => s + p.trend, 0) / platforms.length;
  }, [platforms]);

  const sentimentData = useMemo(() => {
    const pos = reviews.filter(r => r.sentiment === 'positive').length;
    const neu = reviews.filter(r => r.sentiment === 'neutral').length;
    const neg = reviews.filter(r => r.sentiment === 'negative').length;
    return [
      { name: 'Positive', value: pos, color: '#10b981' },
      { name: 'Neutral', value: neu, color: '#71717a' },
      { name: 'Negative', value: neg, color: '#f43f5e' },
    ];
  }, [reviews]);

  const pendingReplies = useMemo(() => reviews.filter(r => !r.responded), [reviews]);

  const filteredReviews = useMemo(() => {
    if (platformFilter === 'all') return reviews;
    return reviews.filter(r => r.platform === platformFilter);
  }, [reviews, platformFilter]);

  const handleSendReply = (reviewId: string) => {
    const draft = replyDrafts[reviewId];
    if (!draft?.trim()) return;
    console.log(`[Reputation] Sending reply for ${reviewId}: ${draft}`);
    setReplyDrafts(prev => {
      const next = { ...prev };
      delete next[reviewId];
      return next;
    });
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: <BarChart3 size={14} /> },
    { id: 'reviews' as const, label: 'All Reviews', icon: <MessageSquare size={14} /> },
    { id: 'respond' as const, label: `Response Queue (${pendingReplies.length})`, icon: <Send size={14} /> },
  ];

  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header glass-panel">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-600/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-light text-white">Reputation Dashboard</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Online Reviews & Sentiment</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                activeTab === t.id
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-zinc-500 hover:text-zinc-200 border border-transparent'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="module-body space-y-6">
        {/* ── Overview Tab ─────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <>
            {/* Overall Score + Platform Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Overall Score Card */}
              <div className="md:col-span-1 bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Overall Score</p>
                <div className="text-5xl font-light text-white mb-2">
                  {overallRating >= 5 ? overallRating.toFixed(1) : (overallRating).toFixed(1)}
                </div>
                <StarRating rating={overallRating} size={18} />
                <div className={`flex items-center gap-1 mt-3 text-xs font-bold ${overallTrend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {overallTrend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {overallTrend >= 0 ? '+' : ''}{overallTrend.toFixed(1)} vs last month
                </div>
              </div>

              {/* Platform Cards */}
              {platforms.map(p => (
                <div key={p.platform} className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${platformIcon(p.platform)}`}>
                      {p.platform}
                    </span>
                    <span className={`text-[10px] font-bold ${p.trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {p.trend >= 0 ? '+' : ''}{p.trend.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-3xl font-light text-white">{p.rating}</div>
                  <p className="text-[10px] text-zinc-500 mt-1">{p.reviewCount.toLocaleString()} reviews</p>
                  <div className="mt-2">
                    <StarRating rating={p.platform === 'Booking.com' ? p.rating / 2 : p.rating} size={12} />
                  </div>
                </div>
              ))}
            </div>

            {/* Sentiment Pie + Monthly Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sentiment Breakdown */}
              <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-zinc-200 mb-4">Sentiment Breakdown</h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        dataKey="value"
                        paddingAngle={3}
                        stroke="none"
                      >
                        {sentimentData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '0.75rem', fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  {sentimentData.map(s => (
                    <div key={s.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-[10px] text-zinc-400 font-semibold">{s.name} ({s.value})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Rating Trend */}
              <div className="lg:col-span-2 bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-zinc-200 mb-4">Monthly Rating Trend</h3>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="month" stroke="#52525b" tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[3.5, 5]} stroke="#52525b" tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '0.75rem', fontSize: '11px' }}
                        itemStyle={{ fontWeight: 'bold' }}
                      />
                      <Line type="monotone" dataKey="rating" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4 }} activeDot={{ r: 6 }} name="Rating" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Reviews Snapshot */}
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-zinc-200">Recent Reviews</h3>
                <button onClick={() => setActiveTab('reviews')} className="text-[10px] text-violet-400 font-bold hover:underline flex items-center gap-1">
                  View All <ExternalLink size={10} />
                </button>
              </div>
              <div className="space-y-3">
                {reviews.slice(0, 4).map(r => (
                  <div key={r.id} className="flex items-start gap-3 bg-zinc-950/40 border border-zinc-800 rounded-xl p-3">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border flex-shrink-0 ${platformIcon(r.platform)}`}>{r.platform}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-zinc-200">{r.guestName}</span>
                        <StarRating rating={r.rating} size={10} />
                        <span className={`flex items-center gap-0.5 text-[10px] font-bold ${sentimentColor(r.sentiment)}`}>
                          {sentimentIcon(r.sentiment)} {r.sentiment}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2">{r.snippet}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[9px] text-zinc-600">{new Date(r.date).toLocaleDateString()}</span>
                        {r.category && <span className="text-[9px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">{r.category}</span>}
                        {r.responded
                          ? <span className="text-[9px] text-emerald-500 font-bold">Responded</span>
                          : <span className="text-[9px] text-amber-500 font-bold">Pending</span>
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── All Reviews Tab ──────────────────────────────────────── */}
        {activeTab === 'reviews' && (
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-200">All Reviews</h3>
              <div className="flex items-center gap-2">
                <Filter size={12} className="text-zinc-500" />
                <select
                  value={platformFilter}
                  onChange={e => setPlatformFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg text-[11px] text-zinc-300 px-2 py-1 outline-none"
                >
                  <option value="all">All Platforms</option>
                  {platforms.map(p => <option key={p.platform} value={p.platform}>{p.platform}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-3">
              {filteredReviews.map(r => (
                <div key={r.id} className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${platformIcon(r.platform)}`}>{r.platform}</span>
                    <span className="text-sm font-semibold text-zinc-200">{r.guestName}</span>
                    <StarRating rating={r.rating} size={12} />
                    <span className={`flex items-center gap-0.5 text-[10px] font-bold ${sentimentColor(r.sentiment)}`}>
                      {sentimentIcon(r.sentiment)} {r.sentiment}
                    </span>
                    <span className="text-[10px] text-zinc-600 ml-auto">{new Date(r.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-2">{r.snippet}</p>
                  {r.responded && r.responseText && (
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 ml-4">
                      <p className="text-[10px] text-emerald-400 font-bold mb-1">Hotel Response</p>
                      <p className="text-xs text-zinc-400">{r.responseText}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {r.category && <span className="text-[9px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">{r.category}</span>}
                    {r.responded
                      ? <span className="text-[9px] text-emerald-500 font-bold flex items-center gap-1"><RefreshCw size={8} /> Responded</span>
                      : <span className="text-[9px] text-amber-500 font-bold flex items-center gap-1"><Clock size={8} /> Awaiting Response</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Response Queue Tab ───────────────────────────────────── */}
        {activeTab === 'respond' && (
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-200">Pending Responses ({pendingReplies.length})</h3>
              <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-medium">
                <Clock size={12} /> Average response time: 4.2 hrs
              </div>
            </div>
            {pendingReplies.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-sm">All reviews have been responded to.</div>
            ) : (
              <div className="space-y-4">
                {pendingReplies.map(r => (
                  <div key={r.id} className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${platformIcon(r.platform)}`}>{r.platform}</span>
                      <span className="text-sm font-semibold text-zinc-200">{r.guestName}</span>
                      <StarRating rating={r.rating} size={12} />
                      <span className={`flex items-center gap-0.5 text-[10px] font-bold ${sentimentColor(r.sentiment)}`}>
                        {sentimentIcon(r.sentiment)}
                      </span>
                      <span className="text-[10px] text-zinc-600 ml-auto">{new Date(r.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-zinc-400 mb-3">{r.snippet}</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={replyDrafts[r.id] || ''}
                        onChange={e => setReplyDrafts(prev => ({ ...prev, [r.id]: e.target.value }))}
                        placeholder="Type your response..."
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none focus:border-violet-500/40 placeholder:text-zinc-600"
                      />
                      <button
                        onClick={() => handleSendReply(r.id)}
                        className="px-3 py-2 bg-violet-600 rounded-lg text-[11px] font-bold text-white hover:bg-violet-500 transition flex items-center gap-1.5"
                      >
                        <Send size={12} /> Reply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReputationDashboard;
