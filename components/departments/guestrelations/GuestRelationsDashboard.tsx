
import React, { useState, useMemo } from 'react';
import {
  Heart, AlertTriangle, Award, Gift, MessageSquare, History,
  Search, Plus, X, Star, Clock, CheckCircle, XCircle, ChevronRight,
  Users, TrendingUp, ThumbsUp, ThumbsDown, Filter, Phone, Mail,
  Eye, Edit2, ArrowUpRight, Sparkles, Crown, Calendar
} from 'lucide-react';
import type {
  VIPGuest, GuestComplaint, LoyaltyMember, SpecialOccasion, GuestFeedback,
  VIPCategory, ComplaintStatus, ComplaintSeverity, LoyaltyProgramTier, FeedbackChannel
} from '../../../types/guestrelations';

// ────────────────────────────────────────────────────────────
// MOCK DATA SEEDS
// ────────────────────────────────────────────────────────────
const MOCK_VIP_GUESTS: VIPGuest[] = [
  {
    id: 'vip_1', guestId: 'g_001', guestName: 'Sheikh Ahmed Al Khalifa', category: 'VVIP',
    roomNumber: '1201', reservationId: 'res_001', checkIn: '2026-03-29', checkOut: '2026-04-05',
    preferences: ['Extra pillows', 'Arabic coffee on arrival', 'Late checkout'],
    allergies: ['Shellfish'], notes: 'Royal family member. Full protocol.',
    amenitiesOrdered: [
      { item: 'Premium Fruit Basket', deliveredAt: Date.now() - 86400000, status: 'Delivered' },
      { item: 'Oud Welcome Amenity', status: 'Pending' }
    ],
    assignedAgent: 'Fatima Al-Rashid', lastVisit: Date.now() - 90 * 86400000,
    totalStays: 12, lifetimeSpend: 185000
  },
  {
    id: 'vip_2', guestId: 'g_002', guestName: 'Dr. Sarah Chen', category: 'VIP',
    roomNumber: '905', reservationId: 'res_002', checkIn: '2026-03-31', checkOut: '2026-04-03',
    preferences: ['Hypoallergenic bedding', 'Green tea', 'Quiet floor'],
    allergies: ['Gluten'], notes: 'Medical conference keynote speaker.',
    amenitiesOrdered: [{ item: 'Welcome Card + Chocolates', status: 'Delivered', deliveredAt: Date.now() - 3600000 }],
    assignedAgent: 'James Whitfield', lastVisit: Date.now() - 180 * 86400000,
    totalStays: 5, lifetimeSpend: 42000
  },
  {
    id: 'vip_3', guestId: 'g_003', guestName: 'Carlos Rivera', category: 'CIP',
    roomNumber: '710', reservationId: 'res_003', checkIn: '2026-04-01', checkOut: '2026-04-04',
    preferences: ['King bed', 'Minibar stocked with craft beer'], allergies: [],
    notes: 'CEO of Rivera Industries. Potential corporate account.',
    amenitiesOrdered: [], assignedAgent: 'Fatima Al-Rashid',
    totalStays: 3, lifetimeSpend: 28500
  },
  {
    id: 'vip_4', guestId: 'g_004', guestName: 'Mia Johnson', category: 'Influencer',
    roomNumber: '1105', reservationId: 'res_004', checkIn: '2026-03-30', checkOut: '2026-04-02',
    preferences: ['Instagram-worthy room setup', 'Balcony view'], allergies: ['Dairy'],
    notes: '2.1M followers on Instagram. Content creation stay.',
    amenitiesOrdered: [{ item: 'Branded Welcome Kit', status: 'Delivered', deliveredAt: Date.now() - 7200000 }],
    assignedAgent: 'James Whitfield', totalStays: 1, lifetimeSpend: 4200
  }
];

const MOCK_COMPLAINTS: GuestComplaint[] = [
  {
    id: 'comp_1', guestId: 'g_010', guestName: 'Robert Hartman', roomNumber: '405',
    category: 'Noise', severity: 'High', status: 'In Progress',
    subject: 'Construction noise early morning',
    description: 'Guest reports loud drilling noise from 6:30 AM disrupting sleep.',
    reportedAt: Date.now() - 7200000, acknowledgedAt: Date.now() - 6800000,
    assignedTo: 'James Whitfield', department: 'Engineering',
    compensationOffered: 'Complimentary breakfast + room move offered'
  },
  {
    id: 'comp_2', guestId: 'g_011', guestName: 'Aisha Bello', roomNumber: '302',
    category: 'Housekeeping', severity: 'Medium', status: 'Open',
    subject: 'Room not cleaned by 3 PM',
    description: 'Guest returned at 3 PM and room was still not serviced.',
    reportedAt: Date.now() - 3600000, assignedTo: 'Fatima Al-Rashid', department: 'Housekeeping'
  },
  {
    id: 'comp_3', guestId: 'g_012', guestName: 'Yuki Tanaka', roomNumber: '810',
    category: 'F&B', severity: 'Low', status: 'Resolved',
    subject: 'Room service order incorrect',
    description: 'Received wrong dish for dinner order. Replacement sent within 20 min.',
    reportedAt: Date.now() - 86400000, acknowledgedAt: Date.now() - 86000000,
    resolvedAt: Date.now() - 84000000, assignedTo: 'James Whitfield', department: 'F&B',
    resolution: 'Correct dish sent + complimentary dessert', guestSatisfied: true
  },
  {
    id: 'comp_4', guestId: 'g_001', guestName: 'Sheikh Ahmed Al Khalifa', roomNumber: '1201',
    category: 'Service', severity: 'Critical', status: 'Escalated',
    subject: 'Butler response time exceeded 15 minutes',
    description: 'VIP guest pressed butler call and waited 18 minutes for response.',
    reportedAt: Date.now() - 1800000, acknowledgedAt: Date.now() - 1500000,
    assignedTo: 'Fatima Al-Rashid', department: 'Guest Relations',
    compensationOffered: 'Personal apology from GM + spa voucher'
  }
];

const MOCK_LOYALTY: LoyaltyMember[] = [
  {
    id: 'loy_1', guestId: 'g_001', guestName: 'Sheikh Ahmed Al Khalifa', email: 'ahmed@alkhalifa.bh',
    tier: 'Diamond', pointsBalance: 245000, pointsEarnedYTD: 82000, pointsRedeemedYTD: 15000,
    enrollmentDate: '2021-06-15', tierExpiryDate: '2027-06-15',
    totalNightsYTD: 28, totalNightsLifetime: 142, totalSpendLifetime: 185000,
    preferredRoom: 'Royal Suite', preferredFloor: 12, referralCode: 'AK2021', referralCount: 8
  },
  {
    id: 'loy_2', guestId: 'g_002', guestName: 'Dr. Sarah Chen', email: 'sarah.chen@med.org',
    tier: 'Gold', pointsBalance: 67000, pointsEarnedYTD: 22000, pointsRedeemedYTD: 5000,
    enrollmentDate: '2023-01-10', tierExpiryDate: '2027-01-10',
    totalNightsYTD: 12, totalNightsLifetime: 38, totalSpendLifetime: 42000,
    dietaryPreferences: ['Gluten-free'], referralCode: 'SC2023', referralCount: 3
  },
  {
    id: 'loy_3', guestId: 'g_020', guestName: 'Emma Thompson', email: 'emma.t@gmail.com',
    tier: 'Silver', pointsBalance: 18500, pointsEarnedYTD: 8500, pointsRedeemedYTD: 2000,
    enrollmentDate: '2024-08-20', tierExpiryDate: '2026-08-20',
    totalNightsYTD: 6, totalNightsLifetime: 14, totalSpendLifetime: 12800,
    referralCode: 'ET2024', referralCount: 1
  },
  {
    id: 'loy_4', guestId: 'g_021', guestName: 'Omar Farouk', email: 'omar.f@corp.ae', phone: '+971501234567',
    tier: 'Platinum', pointsBalance: 128000, pointsEarnedYTD: 45000, pointsRedeemedYTD: 10000,
    enrollmentDate: '2022-03-01', tierExpiryDate: '2027-03-01',
    totalNightsYTD: 20, totalNightsLifetime: 86, totalSpendLifetime: 95000,
    preferredRoom: 'Executive Suite', preferredFloor: 10, referralCode: 'OF2022', referralCount: 12
  }
];

const MOCK_OCCASIONS: SpecialOccasion[] = [
  {
    id: 'occ_1', guestId: 'g_030', guestName: 'David & Lisa Park', roomNumber: '1010',
    occasionType: 'Anniversary', date: '2026-04-02', details: '10th wedding anniversary celebration',
    amenitiesPlanned: [
      { item: 'Champagne & Strawberries', cost: 120, status: 'Ordered' },
      { item: 'Rose petal turndown', cost: 45, status: 'Planned' },
      { item: 'Anniversary cake', cost: 85, status: 'Ordered' }
    ],
    budget: 300, approvedBy: 'GM', assignedTo: 'Fatima Al-Rashid',
    status: 'Approved', guestNotified: false
  },
  {
    id: 'occ_2', guestId: 'g_031', guestName: 'Priya Sharma', roomNumber: '605',
    occasionType: 'Birthday', date: '2026-04-01', details: '30th birthday. Travelling with 4 friends.',
    amenitiesPlanned: [
      { item: 'Birthday cake', cost: 75, status: 'Delivered' },
      { item: 'Balloon decoration', cost: 60, status: 'Delivered' },
      { item: 'Complimentary cocktails (5)', cost: 100, status: 'Ordered' }
    ],
    budget: 250, approvedBy: 'GR Manager', assignedTo: 'James Whitfield',
    status: 'In Progress', guestNotified: true
  },
  {
    id: 'occ_3', guestId: 'g_032', guestName: 'Mark & Julia Fernandez', roomNumber: '1108',
    occasionType: 'Honeymoon', date: '2026-04-01', details: 'Just married. First night of honeymoon.',
    amenitiesPlanned: [
      { item: 'Honeymoon suite decoration', cost: 200, status: 'Planned' },
      { item: 'Couples spa voucher', cost: 350, status: 'Planned' }
    ],
    budget: 600, assignedTo: 'Fatima Al-Rashid',
    status: 'Planning', guestNotified: false
  }
];

const MOCK_FEEDBACK: GuestFeedback[] = [
  {
    id: 'fb_1', guestId: 'g_040', guestName: 'Thomas Mueller', reservationId: 'res_040',
    channel: 'Survey', dateReceived: Date.now() - 86400000, overallRating: 5,
    categories: { cleanliness: 5, service: 5, food: 4, facilities: 5, valueForMoney: 4 },
    comment: 'Exceptional stay. The staff went above and beyond. Special mention to the concierge team.',
    sentiment: 'Positive', responded: true, responseText: 'Thank you for your kind words!',
    respondedBy: 'GR Team', respondedAt: Date.now() - 72000000, actionRequired: false, tags: ['Praise', 'Concierge']
  },
  {
    id: 'fb_2', guestId: 'g_041', guestName: 'Anna Kowalski', reservationId: 'res_041',
    channel: 'OTA Review', dateReceived: Date.now() - 172800000, overallRating: 3,
    categories: { cleanliness: 4, service: 3, food: 2, facilities: 4, valueForMoney: 3 },
    comment: 'Nice hotel but breakfast buffet was disappointing. Limited options and cold food.',
    sentiment: 'Negative', responded: false, actionRequired: true, tags: ['F&B', 'Breakfast']
  },
  {
    id: 'fb_3', guestId: 'g_042', guestName: 'Rashid Al-Mansoori', channel: 'App',
    dateReceived: Date.now() - 43200000, overallRating: 4,
    categories: { cleanliness: 5, service: 4, food: 4, facilities: 4, valueForMoney: 3 },
    comment: 'Great rooms and service. Pricing for minibar is steep. Pool area could be larger.',
    sentiment: 'Neutral', responded: false, actionRequired: false, tags: ['Minibar', 'Pool']
  },
  {
    id: 'fb_4', guestId: 'g_043', guestName: 'Sophie Laurent', channel: 'Email',
    dateReceived: Date.now() - 259200000, overallRating: 2,
    categories: { cleanliness: 3, service: 2, food: 2, facilities: 3, valueForMoney: 1 },
    comment: 'Very disappointed. Check-in took 25 minutes, room was not ready, and spa was overbooked.',
    sentiment: 'Negative', responded: true, responseText: 'We sincerely apologize for the experience. Our GM would like to personally address your concerns.',
    respondedBy: 'Fatima Al-Rashid', respondedAt: Date.now() - 200000000, actionRequired: true,
    actionTaken: 'Offered complimentary return stay', tags: ['Check-in', 'Spa', 'Escalated']
  }
];

// ────────────────────────────────────────────────────────────
// HELPER COMPONENTS
// ────────────────────────────────────────────────────────────

const Badge: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${color}`}>
    {label}
  </span>
);

const vipCategoryColor = (cat: VIPCategory): string => {
  switch (cat) {
    case 'VVIP': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'VIP': return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
    case 'CIP': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'SPATT': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    case 'Repeat': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'Influencer': return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
    default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  }
};

const severityColor = (s: ComplaintSeverity): string => {
  switch (s) {
    case 'Critical': return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'High': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    case 'Medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'Low': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  }
};

const complaintStatusColor = (s: ComplaintStatus): string => {
  switch (s) {
    case 'Open': return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'Acknowledged': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'In Progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'Resolved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'Escalated': return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'Closed': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  }
};

const tierColor = (t: LoyaltyProgramTier): string => {
  switch (t) {
    case 'Diamond': return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20';
    case 'Platinum': return 'bg-violet-500/10 text-violet-300 border-violet-500/20';
    case 'Gold': return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
    case 'Silver': return 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20';
    case 'Classic': return 'bg-zinc-700/10 text-zinc-400 border-zinc-700/20';
  }
};

const sentimentIcon = (s: string) => {
  switch (s) {
    case 'Positive': return <ThumbsUp size={14} className="text-emerald-400" />;
    case 'Negative': return <ThumbsDown size={14} className="text-red-400" />;
    default: return <Star size={14} className="text-amber-400" />;
  }
};

const StarRating: React.FC<{ rating: number; max?: number }> = ({ rating, max = 5 }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: max }, (_, i) => (
      <Star key={i} size={12} className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'} />
    ))}
  </div>
);

const formatTimeAgo = (ts: number): string => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

// ────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────

type GRTab = 'VIP Management' | 'Complaints' | 'Loyalty Program' | 'Special Occasions' | 'Feedback' | 'Guest History';

const GuestRelationsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GRTab>('VIP Management');
  const [searchTerm, setSearchTerm] = useState('');

  // Data state (seeded with mocks; production would use usePms / Firestore)
  const [vipGuests] = useState<VIPGuest[]>(MOCK_VIP_GUESTS);
  const [complaints, setComplaints] = useState<GuestComplaint[]>(MOCK_COMPLAINTS);
  const [loyaltyMembers] = useState<LoyaltyMember[]>(MOCK_LOYALTY);
  const [occasions, setOccasions] = useState<SpecialOccasion[]>(MOCK_OCCASIONS);
  const [feedback, setFeedback] = useState<GuestFeedback[]>(MOCK_FEEDBACK);

  // Modals
  const [selectedVIP, setSelectedVIP] = useState<VIPGuest | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<GuestComplaint | null>(null);
  const [complaintFilter, setComplaintFilter] = useState<ComplaintStatus | 'All'>('All');

  // ── Computed KPIs ────────────────────────────────────────
  const kpis = useMemo(() => {
    const openComplaints = complaints.filter(c => !['Resolved', 'Closed'].includes(c.status)).length;
    const criticalComplaints = complaints.filter(c => c.severity === 'Critical' && c.status !== 'Resolved' && c.status !== 'Closed').length;
    const avgRating = feedback.length > 0 ? (feedback.reduce((s, f) => s + f.overallRating, 0) / feedback.length).toFixed(1) : '0';
    const todayOccasions = occasions.filter(o => o.date === '2026-04-01').length;
    const pendingResponses = feedback.filter(f => !f.responded && f.actionRequired).length;
    return { openComplaints, criticalComplaints, avgRating, todayOccasions, pendingResponses, activeVIPs: vipGuests.length };
  }, [complaints, feedback, occasions, vipGuests]);

  // ── Tab Content Renderers ───────────────────────────────

  const renderVIPManagement = () => {
    const filtered = vipGuests.filter(v =>
      v.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.roomNumber?.includes(searchTerm) ||
      v.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-6">
        {/* VIP Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['VVIP', 'VIP', 'CIP', 'Influencer'] as VIPCategory[]).map(cat => {
            const count = vipGuests.filter(v => v.category === cat).length;
            return (
              <div key={cat} className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge label={cat} color={vipCategoryColor(cat)} />
                  <Crown size={14} className="text-zinc-600" />
                </div>
                <div className="text-2xl font-light text-white">{count}</div>
                <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">In-House</div>
              </div>
            );
          })}
        </div>

        {/* VIP Cards */}
        <div className="space-y-3">
          {filtered.map(vip => (
            <div
              key={vip.id}
              onClick={() => setSelectedVIP(vip)}
              className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5 hover:border-violet-500/20 transition-all cursor-pointer group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-sm">
                    {vip.guestName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-100">{vip.guestName}</span>
                      <Badge label={vip.category} color={vipCategoryColor(vip.category)} />
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      Room {vip.roomNumber} &middot; {vip.checkIn} to {vip.checkOut} &middot; Agent: {vip.assignedAgent}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                  <span>{vip.totalStays} stays</span>
                  <span className="text-emerald-400">${vip.lifetimeSpend.toLocaleString()}</span>
                  <ChevronRight size={14} className="text-zinc-600 group-hover:text-violet-400 transition-colors" />
                </div>
              </div>
              {/* Amenities strip */}
              {vip.amenitiesOrdered.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5">
                  {vip.amenitiesOrdered.map((a, i) => (
                    <span key={i} className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${a.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                      {a.item} &middot; {a.status}
                    </span>
                  ))}
                </div>
              )}
              {/* Preferences + Allergies */}
              {(vip.preferences.length > 0 || vip.allergies.length > 0) && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {vip.preferences.map((p, i) => (
                    <span key={`p-${i}`} className="px-1.5 py-0.5 rounded text-[8px] bg-zinc-800 text-zinc-400 border border-zinc-700/50">{p}</span>
                  ))}
                  {vip.allergies.map((a, i) => (
                    <span key={`a-${i}`} className="px-1.5 py-0.5 rounded text-[8px] bg-red-500/10 text-red-400 border border-red-500/20">Allergy: {a}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-zinc-600 text-sm">No VIP guests match your search.</div>
          )}
        </div>
      </div>
    );
  };

  const renderComplaints = () => {
    const filtered = complaints
      .filter(c => complaintFilter === 'All' || c.status === complaintFilter)
      .filter(c =>
        c.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.category.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return (
      <div className="space-y-6">
        {/* Complaint Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4">
            <div className="text-2xl font-light text-white">{kpis.openComplaints}</div>
            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Open</div>
          </div>
          <div className="bg-zinc-900/40 border border-red-500/10 rounded-2xl p-4">
            <div className="text-2xl font-light text-red-400">{kpis.criticalComplaints}</div>
            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Critical</div>
          </div>
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4">
            <div className="text-2xl font-light text-emerald-400">{complaints.filter(c => c.status === 'Resolved').length}</div>
            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Resolved</div>
          </div>
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4">
            <div className="text-2xl font-light text-amber-400">
              {complaints.filter(c => c.resolvedAt && c.acknowledgedAt).length > 0
                ? `${Math.round(complaints.filter(c => c.resolvedAt && c.acknowledgedAt).reduce((s, c) => s + ((c.resolvedAt! - c.reportedAt) / 3600000), 0) / complaints.filter(c => c.resolvedAt).length)}h`
                : '--'}
            </div>
            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Avg Resolution</div>
          </div>
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-zinc-500" />
          {(['All', 'Open', 'Acknowledged', 'In Progress', 'Escalated', 'Resolved', 'Closed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setComplaintFilter(f)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${complaintFilter === f ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Complaint List */}
        <div className="space-y-3">
          {filtered.map(comp => (
            <div
              key={comp.id}
              onClick={() => setSelectedComplaint(comp)}
              className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5 hover:border-violet-500/20 transition-all cursor-pointer"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-zinc-100">{comp.subject}</span>
                    <Badge label={comp.severity} color={severityColor(comp.severity)} />
                    <Badge label={comp.status} color={complaintStatusColor(comp.status)} />
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {comp.guestName} &middot; Room {comp.roomNumber} &middot; {comp.category} &middot; {formatTimeAgo(comp.reportedAt)}
                  </div>
                  <p className="text-xs text-zinc-400 mt-2 line-clamp-2">{comp.description}</p>
                  {comp.compensationOffered && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <Gift size={12} className="text-violet-400" />
                      <span className="text-[10px] text-violet-300">{comp.compensationOffered}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 text-[10px] text-zinc-500 shrink-0">
                  <span>Assigned: {comp.assignedTo}</span>
                  <span>Dept: {comp.department}</span>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-zinc-600 text-sm">No complaints match the current filter.</div>
          )}
        </div>
      </div>
    );
  };

  const renderLoyaltyProgram = () => {
    const filtered = loyaltyMembers.filter(m =>
      m.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.tier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const tierCounts = loyaltyMembers.reduce((acc, m) => {
      acc[m.tier] = (acc[m.tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="space-y-6">
        {/* Tier Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {(['Classic', 'Silver', 'Gold', 'Platinum', 'Diamond'] as LoyaltyProgramTier[]).map(tier => (
            <div key={tier} className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 text-center">
              <Badge label={tier} color={tierColor(tier)} />
              <div className="text-2xl font-light text-white mt-2">{tierCounts[tier] || 0}</div>
              <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Members</div>
            </div>
          ))}
        </div>

        {/* Member Table */}
        <div className="bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-5 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Member</th>
                <th className="px-5 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Tier</th>
                <th className="px-5 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest hidden md:table-cell">Points</th>
                <th className="px-5 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest hidden lg:table-cell">Nights YTD</th>
                <th className="px-5 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest hidden lg:table-cell">Lifetime Spend</th>
                <th className="px-5 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest hidden xl:table-cell">Referrals</th>
                <th className="px-5 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Expiry</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} className="border-b border-white/5 hover:bg-zinc-800/30 transition-colors cursor-pointer">
                  <td className="px-5 py-3">
                    <div className="text-zinc-100 font-medium text-xs">{m.guestName}</div>
                    <div className="text-[10px] text-zinc-500">{m.email}</div>
                  </td>
                  <td className="px-5 py-3"><Badge label={m.tier} color={tierColor(m.tier)} /></td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <span className="text-zinc-200 font-medium">{m.pointsBalance.toLocaleString()}</span>
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">{m.totalNightsYTD}</td>
                  <td className="px-5 py-3 hidden lg:table-cell text-emerald-400">${m.totalSpendLifetime.toLocaleString()}</td>
                  <td className="px-5 py-3 hidden xl:table-cell">{m.referralCount}</td>
                  <td className="px-5 py-3 text-[10px]">{m.tierExpiryDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-zinc-600 text-sm">No members match your search.</div>
          )}
        </div>
      </div>
    );
  };

  const renderSpecialOccasions = () => {
    const filtered = occasions.filter(o =>
      o.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.occasionType.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const statusColor = (s: string) => {
      switch (s) {
        case 'Planning': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
        case 'Approved': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        case 'In Progress': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        case 'Completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        case 'Cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
        default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
      }
    };

    return (
      <div className="space-y-6">
        {/* Today's Occasions highlight */}
        {kpis.todayOccasions > 0 && (
          <div className="bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-violet-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-violet-400" />
              <span className="text-sm font-semibold text-violet-300">Today's Special Occasions</span>
              <Badge label={`${kpis.todayOccasions} active`} color="bg-violet-500/10 text-violet-400 border-violet-500/20" />
            </div>
            <div className="text-[10px] text-zinc-400">Ensure all amenities are delivered on time and surprise elements are coordinated with F&B and Housekeeping.</div>
          </div>
        )}

        {/* Occasion Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(occ => {
            const totalPlanned = occ.amenitiesPlanned.reduce((s, a) => s + a.cost, 0);
            return (
              <div key={occ.id} className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5 hover:border-violet-500/20 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Gift size={16} className="text-pink-400" />
                    <span className="text-sm font-semibold text-zinc-100">{occ.guestName}</span>
                  </div>
                  <Badge label={occ.status} color={statusColor(occ.status)} />
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3 text-[10px] text-zinc-500">
                  <div>Type: <span className="text-zinc-300">{occ.occasionType}</span></div>
                  <div>Date: <span className="text-zinc-300">{occ.date}</span></div>
                  <div>Room: <span className="text-zinc-300">{occ.roomNumber || 'TBD'}</span></div>
                  <div>Budget: <span className="text-emerald-400">${occ.budget}</span> <span className="text-zinc-600">(${totalPlanned} planned)</span></div>
                </div>
                <p className="text-xs text-zinc-400 mb-3">{occ.details}</p>
                {/* Amenity items */}
                <div className="space-y-1.5">
                  {occ.amenitiesPlanned.map((a, i) => (
                    <div key={i} className="flex items-center justify-between bg-zinc-950/50 rounded-lg px-3 py-1.5">
                      <div className="flex items-center gap-2">
                        {a.status === 'Delivered' ? <CheckCircle size={12} className="text-emerald-400" /> :
                         a.status === 'Ordered' ? <Clock size={12} className="text-amber-400" /> :
                         <Calendar size={12} className="text-zinc-500" />}
                        <span className="text-[10px] text-zinc-300">{a.item}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500">${a.cost}</span>
                        <Badge label={a.status} color={a.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : a.status === 'Ordered' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 text-[10px] text-zinc-500">
                  <span>Assigned: {occ.assignedTo}</span>
                  <span>{occ.guestNotified ? 'Guest notified' : 'Surprise element'}</span>
                </div>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-zinc-600 text-sm">No special occasions found.</div>
        )}
      </div>
    );
  };

  const renderFeedback = () => {
    const filtered = feedback.filter(f =>
      f.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.channel.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sentimentCounts = feedback.reduce((acc, f) => {
      acc[f.sentiment] = (acc[f.sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="space-y-6">
        {/* Feedback Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2"><Star size={14} className="text-amber-400 fill-amber-400" /></div>
            <div className="text-2xl font-light text-white">{kpis.avgRating}</div>
            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Avg Rating</div>
          </div>
          <div className="bg-zinc-900/40 border border-emerald-500/10 rounded-2xl p-4">
            <div className="text-2xl font-light text-emerald-400">{sentimentCounts['Positive'] || 0}</div>
            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Positive</div>
          </div>
          <div className="bg-zinc-900/40 border border-red-500/10 rounded-2xl p-4">
            <div className="text-2xl font-light text-red-400">{sentimentCounts['Negative'] || 0}</div>
            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Negative</div>
          </div>
          <div className="bg-zinc-900/40 border border-amber-500/10 rounded-2xl p-4">
            <div className="text-2xl font-light text-amber-400">{kpis.pendingResponses}</div>
            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Pending Response</div>
          </div>
        </div>

        {/* Feedback Cards */}
        <div className="space-y-3">
          {filtered.map(fb => (
            <div key={fb.id} className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5 hover:border-violet-500/20 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  {sentimentIcon(fb.sentiment)}
                  <span className="text-sm font-semibold text-zinc-100">{fb.guestName}</span>
                  <Badge label={fb.channel} color="bg-zinc-800 text-zinc-400 border-zinc-700" />
                  <StarRating rating={fb.overallRating} />
                </div>
                <div className="text-[10px] text-zinc-500">{formatTimeAgo(fb.dateReceived)}</div>
              </div>
              <p className="text-xs text-zinc-300 mb-3 leading-relaxed">{fb.comment}</p>
              {/* Category breakdown */}
              {fb.categories && (
                <div className="flex flex-wrap gap-3 mb-3 text-[10px]">
                  {Object.entries(fb.categories).map(([key, val]) => val !== undefined && (
                    <div key={key} className="flex items-center gap-1">
                      <span className="text-zinc-500 capitalize">{key}:</span>
                      <StarRating rating={val} />
                    </div>
                  ))}
                </div>
              )}
              {/* Tags */}
              {fb.tags && fb.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {fb.tags.map((t, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-[8px] bg-zinc-800 text-zinc-400 border border-zinc-700/50">{t}</span>
                  ))}
                </div>
              )}
              {/* Response status */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                {fb.responded ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle size={12} className="text-emerald-400" />
                    <span className="text-[10px] text-emerald-400">Responded by {fb.respondedBy}</span>
                  </div>
                ) : fb.actionRequired ? (
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={12} className="text-red-400" />
                    <span className="text-[10px] text-red-400">Action Required - Awaiting Response</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-zinc-500">No response needed</span>
                )}
                <button
                  onClick={() => {
                    if (!fb.responded) {
                      setFeedback(prev => prev.map(f => f.id === fb.id ? { ...f, responded: true, respondedBy: 'GR Team', respondedAt: Date.now(), responseText: 'Thank you for your feedback.' } : f));
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${fb.responded ? 'bg-zinc-800 text-zinc-500 cursor-default' : 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/20'}`}
                  disabled={fb.responded}
                >
                  {fb.responded ? 'Responded' : 'Respond'}
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-zinc-600 text-sm">No feedback matches your search.</div>
          )}
        </div>
      </div>
    );
  };

  const renderGuestHistory = () => (
    <div className="space-y-6">
      <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-8 text-center">
        <History size={32} className="text-zinc-600 mx-auto mb-4" />
        <h3 className="text-lg font-light text-zinc-300 mb-2">Guest History & CRM</h3>
        <p className="text-sm text-zinc-500 max-w-md mx-auto">
          Search any guest to view their complete interaction history including stays, complaints, feedback, loyalty activity, and special occasions across all properties.
        </p>
        <div className="relative max-w-md mx-auto mt-6">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search guest by name, email, or loyalty ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-300 focus:border-violet-500/50 outline-none"
          />
        </div>
      </div>

      {/* Combined timeline from all sources */}
      {searchTerm.length > 1 && (
        <div className="space-y-3">
          {/* VIP records */}
          {vipGuests.filter(v => v.guestName.toLowerCase().includes(searchTerm.toLowerCase())).map(v => (
            <div key={`vip-${v.id}`} className="bg-zinc-900/40 border border-violet-500/10 rounded-2xl p-4 flex items-center gap-4">
              <Crown size={16} className="text-violet-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-zinc-200 font-medium">{v.guestName} - {v.category}</div>
                <div className="text-[10px] text-zinc-500">{v.totalStays} stays &middot; ${v.lifetimeSpend.toLocaleString()} lifetime</div>
              </div>
              <Badge label="VIP" color={vipCategoryColor(v.category)} />
            </div>
          ))}
          {/* Complaint records */}
          {complaints.filter(c => c.guestName.toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
            <div key={`comp-${c.id}`} className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
              <AlertTriangle size={16} className="text-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-zinc-200 font-medium">{c.guestName} - {c.subject}</div>
                <div className="text-[10px] text-zinc-500">{c.category} &middot; {formatTimeAgo(c.reportedAt)}</div>
              </div>
              <Badge label={c.status} color={complaintStatusColor(c.status)} />
            </div>
          ))}
          {/* Loyalty records */}
          {loyaltyMembers.filter(m => m.guestName.toLowerCase().includes(searchTerm.toLowerCase())).map(m => (
            <div key={`loy-${m.id}`} className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
              <Award size={16} className="text-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-zinc-200 font-medium">{m.guestName} - {m.tier} Member</div>
                <div className="text-[10px] text-zinc-500">{m.pointsBalance.toLocaleString()} pts &middot; {m.totalNightsLifetime} lifetime nights</div>
              </div>
              <Badge label={m.tier} color={tierColor(m.tier)} />
            </div>
          ))}
          {/* Feedback records */}
          {feedback.filter(f => f.guestName.toLowerCase().includes(searchTerm.toLowerCase())).map(f => (
            <div key={`fb-${f.id}`} className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
              {sentimentIcon(f.sentiment)}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-zinc-200 font-medium">{f.guestName} - Rating: {f.overallRating}/5</div>
                <div className="text-[10px] text-zinc-500 truncate">{f.comment}</div>
              </div>
              <Badge label={f.channel} color="bg-zinc-800 text-zinc-400 border-zinc-700" />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── Tab Router ───────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      case 'VIP Management': return renderVIPManagement();
      case 'Complaints': return renderComplaints();
      case 'Loyalty Program': return renderLoyaltyProgram();
      case 'Special Occasions': return renderSpecialOccasions();
      case 'Feedback': return renderFeedback();
      case 'Guest History': return renderGuestHistory();
      default: return renderVIPManagement();
    }
  };

  const TABS: { label: GRTab; icon: React.ReactNode }[] = [
    { label: 'VIP Management', icon: <Crown size={14} /> },
    { label: 'Complaints', icon: <AlertTriangle size={14} /> },
    { label: 'Loyalty Program', icon: <Award size={14} /> },
    { label: 'Special Occasions', icon: <Gift size={14} /> },
    { label: 'Feedback', icon: <MessageSquare size={14} /> },
    { label: 'Guest History', icon: <History size={14} /> },
  ];

  return (
    <div className="module-container bg-transparent flex flex-col h-full">
      {/* Header */}
      <header className="module-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <div className="p-3 bg-pink-500/10 rounded-2xl border border-pink-500/20">
            <Heart className="w-6 h-6 text-pink-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-light text-white tracking-tight leading-none">Guest Relations</h2>
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-1">Experience & Loyalty</div>
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide flex-wrap ml-auto min-w-0">
          {/* Tab bar */}
          <div className="flex items-center bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50 flex-wrap">
            {TABS.map(tab => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                className={`min-w-[90px] px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap flex items-center gap-1.5 ${activeTab === tab.label ? 'bg-zinc-800 text-white shadow-xl shadow-black/20' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-shrink-0 w-full sm:w-auto">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search guests..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full sm:w-48 bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-[10px] text-zinc-300 focus:border-violet-500/50 outline-none transition-all sm:focus:w-64"
            />
          </div>
        </div>
      </header>

      {/* KPI Strip */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-3 text-center">
          <div className="text-lg font-light text-violet-400">{kpis.activeVIPs}</div>
          <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">VIPs In-House</div>
        </div>
        <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-3 text-center">
          <div className="text-lg font-light text-red-400">{kpis.openComplaints}</div>
          <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">Open Complaints</div>
        </div>
        <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-3 text-center">
          <div className="text-lg font-light text-red-500">{kpis.criticalComplaints}</div>
          <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">Critical</div>
        </div>
        <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-3 text-center">
          <div className="text-lg font-light text-amber-400">{kpis.avgRating}</div>
          <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">Avg Rating</div>
        </div>
        <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-3 text-center">
          <div className="text-lg font-light text-pink-400">{kpis.todayOccasions}</div>
          <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">Today's Occasions</div>
        </div>
        <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-3 text-center">
          <div className="text-lg font-light text-amber-400">{kpis.pendingResponses}</div>
          <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">Pending Replies</div>
        </div>
      </div>

      {/* Main Content */}
      <main className="module-body">
        {renderContent()}
      </main>

      {/* ── VIP Detail Modal ─────────────────────────────── */}
      {selectedVIP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur p-4" onClick={() => setSelectedVIP(null)}>
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg p-8 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Crown size={20} className="text-violet-400" />
                <h3 className="text-xl font-light text-zinc-100">{selectedVIP.guestName}</h3>
                <Badge label={selectedVIP.category} color={vipCategoryColor(selectedVIP.category)} />
              </div>
              <button onClick={() => setSelectedVIP(null)} className="p-2 hover:bg-zinc-800 rounded-xl"><X size={18} className="text-zinc-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest block mb-1">Room</span><span className="text-zinc-200">{selectedVIP.roomNumber}</span></div>
                <div><span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest block mb-1">Stay</span><span className="text-zinc-200">{selectedVIP.checkIn} to {selectedVIP.checkOut}</span></div>
                <div><span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest block mb-1">Total Stays</span><span className="text-zinc-200">{selectedVIP.totalStays}</span></div>
                <div><span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest block mb-1">Lifetime Spend</span><span className="text-emerald-400">${selectedVIP.lifetimeSpend.toLocaleString()}</span></div>
                <div className="col-span-2"><span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest block mb-1">Assigned Agent</span><span className="text-zinc-200">{selectedVIP.assignedAgent}</span></div>
              </div>
              {selectedVIP.notes && (
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest block mb-1">Notes</span>
                  <p className="text-sm text-zinc-300 bg-zinc-900 rounded-xl p-3 border border-zinc-800">{selectedVIP.notes}</p>
                </div>
              )}
              <div>
                <span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest block mb-2">Preferences</span>
                <div className="flex flex-wrap gap-1.5">{selectedVIP.preferences.map((p, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 text-zinc-300 border border-zinc-800">{p}</span>
                ))}</div>
              </div>
              {selectedVIP.allergies.length > 0 && (
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest block mb-2">Allergies</span>
                  <div className="flex flex-wrap gap-1.5">{selectedVIP.allergies.map((a, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 border border-red-500/20">{a}</span>
                  ))}</div>
                </div>
              )}
              <div>
                <span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest block mb-2">Amenities</span>
                <div className="space-y-1.5">
                  {selectedVIP.amenitiesOrdered.map((a, i) => (
                    <div key={i} className="flex items-center justify-between bg-zinc-900 rounded-lg px-3 py-2 border border-zinc-800">
                      <span className="text-[10px] text-zinc-300">{a.item}</span>
                      <Badge label={a.status} color={a.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Complaint Detail Modal ───────────────────────── */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur p-4" onClick={() => setSelectedComplaint(null)}>
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg p-8 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-light text-zinc-100">{selectedComplaint.subject}</h3>
              <button onClick={() => setSelectedComplaint(null)} className="p-2 hover:bg-zinc-800 rounded-xl"><X size={18} className="text-zinc-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge label={selectedComplaint.severity} color={severityColor(selectedComplaint.severity)} />
                <Badge label={selectedComplaint.status} color={complaintStatusColor(selectedComplaint.status)} />
                <Badge label={selectedComplaint.category} color="bg-zinc-800 text-zinc-400 border-zinc-700" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest block mb-1">Guest</span><span className="text-zinc-200">{selectedComplaint.guestName}</span></div>
                <div><span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest block mb-1">Room</span><span className="text-zinc-200">{selectedComplaint.roomNumber || 'N/A'}</span></div>
                <div><span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest block mb-1">Assigned To</span><span className="text-zinc-200">{selectedComplaint.assignedTo}</span></div>
                <div><span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest block mb-1">Department</span><span className="text-zinc-200">{selectedComplaint.department}</span></div>
                <div><span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest block mb-1">Reported</span><span className="text-zinc-200">{formatTimeAgo(selectedComplaint.reportedAt)}</span></div>
                {selectedComplaint.resolvedAt && (
                  <div><span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest block mb-1">Resolved</span><span className="text-emerald-400">{formatTimeAgo(selectedComplaint.resolvedAt)}</span></div>
                )}
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest block mb-1">Description</span>
                <p className="text-sm text-zinc-300 bg-zinc-900 rounded-xl p-3 border border-zinc-800">{selectedComplaint.description}</p>
              </div>
              {selectedComplaint.resolution && (
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest block mb-1">Resolution</span>
                  <p className="text-sm text-emerald-300 bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/10">{selectedComplaint.resolution}</p>
                </div>
              )}
              {selectedComplaint.compensationOffered && (
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest block mb-1">Compensation</span>
                  <p className="text-sm text-violet-300 bg-violet-500/5 rounded-xl p-3 border border-violet-500/10">{selectedComplaint.compensationOffered}</p>
                </div>
              )}
              {/* Quick actions */}
              {!['Resolved', 'Closed'].includes(selectedComplaint.status) && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? { ...c, status: 'Resolved', resolvedAt: Date.now(), guestSatisfied: true } : c));
                      setSelectedComplaint(null);
                    }}
                    className="flex-1 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-[11px] font-bold hover:bg-emerald-500/20 transition-all"
                  >
                    Mark Resolved
                  </button>
                  <button
                    onClick={() => {
                      setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? { ...c, status: 'Escalated' } : c));
                      setSelectedComplaint(null);
                    }}
                    className="flex-1 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-[11px] font-bold hover:bg-red-500/20 transition-all"
                  >
                    Escalate to GM
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestRelationsDashboard;
