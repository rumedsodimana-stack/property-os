
import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck, Search, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2,
  Star, Eye, FileText, BarChart3, Users, Calendar, TrendingUp, TrendingDown,
  Clock, Filter, Plus, RefreshCw, Award, Target, MessageSquare, ArrowUpRight
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
import type {
  Inspection, InspectionStatus, InspectionCategory, Checklist, MysteryShopperVisit,
  GuestSatisfactionEntry, CorrectiveAction, CorrectiveActionStatus, SeverityLevel,
  QualityStandard, ChecklistTemplate
} from '../../../types/quality';

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_INSPECTIONS: Inspection[] = [
  {
    id: 'insp_001', title: 'Executive Suite 1201 - Turnover Inspection', category: 'room',
    status: 'completed', scheduledDate: '2026-03-31', completedDate: '2026-03-31',
    inspectorId: 'emp_042', inspectorName: 'Maria Chen', location: 'Floor 12 - Suite 1201',
    score: 94, maxScore: 100, items: [], findings: ['Minor scuff on baseboard near entry'],
    correctiveActionIds: ['ca_003'], createdAt: '2026-03-30', updatedAt: '2026-03-31',
  },
  {
    id: 'insp_002', title: 'Main Kitchen Deep Clean Audit', category: 'kitchen',
    status: 'in_progress', scheduledDate: '2026-04-01',
    inspectorId: 'emp_015', inspectorName: 'James Okafor', location: 'B1 - Main Kitchen',
    score: undefined, maxScore: 100, items: [], findings: [],
    correctiveActionIds: [], createdAt: '2026-03-31', updatedAt: '2026-04-01',
  },
  {
    id: 'insp_003', title: 'Pool Deck & Cabana Standards', category: 'pool',
    status: 'scheduled', scheduledDate: '2026-04-02',
    inspectorId: 'emp_042', inspectorName: 'Maria Chen', location: 'Level 3 - Pool Deck',
    score: undefined, maxScore: 100, items: [], findings: [],
    correctiveActionIds: [], createdAt: '2026-03-31', updatedAt: '2026-03-31',
  },
  {
    id: 'insp_004', title: 'Lobby & Reception Standards Check', category: 'public_area',
    status: 'completed', scheduledDate: '2026-03-30', completedDate: '2026-03-30',
    inspectorId: 'emp_028', inspectorName: 'Aisha Rahman', location: 'Ground Floor - Main Lobby',
    score: 88, maxScore: 100, items: [], findings: ['Floral arrangement past prime', 'One recessed light flickering'],
    correctiveActionIds: ['ca_004', 'ca_005'], createdAt: '2026-03-29', updatedAt: '2026-03-30',
  },
  {
    id: 'insp_005', title: 'Back-of-House Corridor Compliance', category: 'back_of_house',
    status: 'failed', scheduledDate: '2026-03-29', completedDate: '2026-03-29',
    inspectorId: 'emp_015', inspectorName: 'James Okafor', location: 'B2 - Service Corridor',
    score: 62, maxScore: 100, items: [], findings: ['Fire extinguisher access blocked', 'Wet floor without signage', 'Expired chemical storage labels'],
    correctiveActionIds: ['ca_006', 'ca_007', 'ca_008'], createdAt: '2026-03-28', updatedAt: '2026-03-29',
  },
];

const MOCK_CHECKLISTS: Checklist[] = [
  { id: 'cl_001', templateId: 'tpl_001', templateName: 'Daily Room Readiness', assigneeId: 'emp_042', assigneeName: 'Maria Chen', scheduledDate: '2026-04-01', status: 'in_progress', items: [], overallScore: undefined, notes: '12 of 18 items checked' },
  { id: 'cl_002', templateId: 'tpl_002', templateName: 'F&B Opening Checklist', assigneeId: 'emp_015', assigneeName: 'James Okafor', scheduledDate: '2026-04-01', completedDate: '2026-04-01', status: 'completed', items: [], overallScore: 96 },
  { id: 'cl_003', templateId: 'tpl_003', templateName: 'Weekly Public Area Audit', assigneeId: 'emp_028', assigneeName: 'Aisha Rahman', scheduledDate: '2026-04-03', status: 'scheduled', items: [], overallScore: undefined },
];

const MOCK_MYSTERY: MysteryShopperVisit[] = [
  {
    id: 'ms_001', agencyName: 'LQA International', shopperAlias: 'Reviewer Alpha',
    visitDate: '2026-03-15', checkInDate: '2026-03-15', checkOutDate: '2026-03-17',
    status: 'completed', overallScore: 87, maxScore: 100,
    categories: [
      { name: 'Arrival & Check-In', score: 92, maxScore: 100, highlights: ['Warm welcome', 'Efficient process'], deficiencies: ['No escort to room'] },
      { name: 'Guest Room', score: 85, maxScore: 100, highlights: ['Immaculate cleanliness'], deficiencies: ['Minibar not fully stocked', 'TV remote low battery'] },
      { name: 'F&B Service', score: 88, maxScore: 100, highlights: ['Excellent wine pairing'], deficiencies: ['15-min wait for dessert course'] },
      { name: 'Spa & Wellness', score: 82, maxScore: 100, highlights: ['Therapist technique excellent'], deficiencies: ['Changing room untidy'] },
      { name: 'Departure', score: 90, maxScore: 100, highlights: ['Proactive checkout'], deficiencies: [] },
    ],
    executiveSummary: 'Overall positive experience with opportunities for improvement in room readiness and spa facilities.',
    correctiveActionIds: ['ca_001', 'ca_002'],
  },
  {
    id: 'ms_002', agencyName: 'Forbes Travel Guide', shopperAlias: 'Reviewer Beta',
    visitDate: '2026-02-20', checkInDate: '2026-02-20', checkOutDate: '2026-02-22',
    status: 'completed', overallScore: 91, maxScore: 100,
    categories: [
      { name: 'Arrival & Check-In', score: 95, maxScore: 100, highlights: ['Name recognition', 'Welcome amenity'], deficiencies: [] },
      { name: 'Guest Room', score: 90, maxScore: 100, highlights: ['Luxury linens', 'Turndown service'], deficiencies: ['Slight delay in room service'] },
      { name: 'F&B Service', score: 93, maxScore: 100, highlights: ['Chef table experience'], deficiencies: [] },
      { name: 'Concierge', score: 88, maxScore: 100, highlights: ['Local expertise'], deficiencies: ['Slow response to email request'] },
    ],
    executiveSummary: 'Exceptional property with strong service culture. Minor operational delays noted.',
    correctiveActionIds: [],
  },
];

const MOCK_SATISFACTION: GuestSatisfactionEntry[] = [
  { id: 'gs_001', source: 'survey', guestName: 'Thomas Wright', reservationId: 'res_1042', date: '2026-03-31', overallRating: 9, maxRating: 10, categories: [{ name: 'Service', rating: 10, maxRating: 10 }, { name: 'Cleanliness', rating: 9, maxRating: 10 }, { name: 'F&B', rating: 8, maxRating: 10 }], comment: 'Outstanding staff, will return.', sentiment: 'positive', responseStatus: 'responded', respondedBy: 'GM Office' },
  { id: 'gs_002', source: 'tripadvisor', guestName: 'Sophia Laurent', date: '2026-03-29', overallRating: 4, maxRating: 5, categories: [{ name: 'Location', rating: 5, maxRating: 5 }, { name: 'Service', rating: 4, maxRating: 5 }], comment: 'Beautiful hotel with exceptional views.', sentiment: 'positive', responseStatus: 'responded' },
  { id: 'gs_003', source: 'google', guestName: 'David Kim', date: '2026-03-28', overallRating: 3, maxRating: 5, categories: [{ name: 'Value', rating: 2, maxRating: 5 }, { name: 'Service', rating: 3, maxRating: 5 }], comment: 'Overpriced for what you get. Slow room service.', sentiment: 'negative', responseStatus: 'pending' },
  { id: 'gs_004', source: 'booking', guestName: 'Elena Vasquez', date: '2026-03-27', overallRating: 8, maxRating: 10, categories: [{ name: 'Comfort', rating: 9, maxRating: 10 }, { name: 'Staff', rating: 8, maxRating: 10 }], sentiment: 'positive', responseStatus: 'no_action' },
  { id: 'gs_005', source: 'internal', guestName: 'Hiroshi Tanaka', reservationId: 'res_1038', date: '2026-03-30', overallRating: 7, maxRating: 10, categories: [{ name: 'Check-In', rating: 6, maxRating: 10 }, { name: 'Room', rating: 8, maxRating: 10 }], comment: 'Long wait at check-in.', sentiment: 'neutral', responseStatus: 'pending' },
];

const MOCK_CORRECTIVE: CorrectiveAction[] = [
  { id: 'ca_001', title: 'Implement room escort SOP for VIP arrivals', description: 'Mystery shopper noted no room escort.', severity: 'minor', status: 'resolved', sourceType: 'mystery_shopper', sourceId: 'ms_001', department: 'Front Office', assigneeId: 'emp_010', assigneeName: 'Sarah Collins', dueDate: '2026-03-25', completedDate: '2026-03-24', rootCause: 'SOP not enforced consistently', actionTaken: 'Retrained all front desk staff, updated checklist', verifiedBy: 'Maria Chen', verifiedDate: '2026-03-26', createdAt: '2026-03-17', updatedAt: '2026-03-26' },
  { id: 'ca_002', title: 'Minibar restocking protocol review', description: 'Minibar not fully stocked on arrival.', severity: 'minor', status: 'in_progress', sourceType: 'mystery_shopper', sourceId: 'ms_001', department: 'Housekeeping', assigneeId: 'emp_033', assigneeName: 'Diego Morales', dueDate: '2026-04-05', createdAt: '2026-03-17', updatedAt: '2026-03-30' },
  { id: 'ca_003', title: 'Repair baseboard scuff - Suite 1201', description: 'Scuff mark found during turnover inspection.', severity: 'observation', status: 'open', sourceType: 'inspection', sourceId: 'insp_001', department: 'Engineering', assigneeId: 'emp_055', assigneeName: 'Raj Patel', dueDate: '2026-04-03', createdAt: '2026-03-31', updatedAt: '2026-03-31' },
  { id: 'ca_006', title: 'Clear fire extinguisher access - B2 Corridor', description: 'Fire extinguisher access blocked by storage boxes.', severity: 'critical', status: 'in_progress', sourceType: 'inspection', sourceId: 'insp_005', department: 'Facilities', assigneeId: 'emp_055', assigneeName: 'Raj Patel', dueDate: '2026-03-30', createdAt: '2026-03-29', updatedAt: '2026-03-30' },
  { id: 'ca_007', title: 'Install wet floor signage protocol', description: 'Wet floor without safety signage in service corridor.', severity: 'major', status: 'pending_review', sourceType: 'inspection', sourceId: 'insp_005', department: 'Housekeeping', assigneeId: 'emp_033', assigneeName: 'Diego Morales', dueDate: '2026-04-01', actionTaken: 'Ordered additional signage, posted reminders', createdAt: '2026-03-29', updatedAt: '2026-04-01' },
];

const MOCK_STANDARDS: QualityStandard[] = [
  { id: 'qs_001', code: 'LQA-5.1', name: 'Guest Room Presentation', description: 'All guest rooms meet LQA 5-star presentation standards.', category: 'Room Quality', complianceLevel: 'mandatory', lastAuditDate: '2026-03-15', lastAuditScore: 87, targetScore: 90, owner: 'Housekeeping', active: true },
  { id: 'qs_002', code: 'FTG-3.2', name: 'F&B Service Timing', description: 'All meals served within Forbes Travel Guide timing standards.', category: 'F&B', complianceLevel: 'mandatory', lastAuditDate: '2026-03-15', lastAuditScore: 88, targetScore: 85, owner: 'F&B', active: true },
  { id: 'qs_003', code: 'INT-1.1', name: 'Check-In Experience', description: 'Guest recognition, welcome amenity, and room escort for all arrivals.', category: 'Front Office', complianceLevel: 'mandatory', lastAuditDate: '2026-03-15', lastAuditScore: 82, targetScore: 90, owner: 'Front Office', active: true },
  { id: 'qs_004', code: 'LQA-7.3', name: 'Spa Treatment Standards', description: 'Spa services delivered per LQA wellness criteria.', category: 'Spa & Wellness', complianceLevel: 'recommended', lastAuditDate: '2026-02-20', lastAuditScore: 82, targetScore: 85, owner: 'Spa', active: true },
  { id: 'qs_005', code: 'INT-2.5', name: 'Public Area Cleanliness', description: 'All public areas maintained to brand cleanliness standards.', category: 'Housekeeping', complianceLevel: 'mandatory', lastAuditDate: '2026-03-30', lastAuditScore: 91, targetScore: 90, owner: 'Housekeeping', active: true },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusColor = (s: InspectionStatus | CorrectiveActionStatus | string): string => {
  const map: Record<string, string> = {
    completed: 'text-emerald-400', resolved: 'text-emerald-400', pass: 'text-emerald-400',
    in_progress: 'text-amber-400', pending_review: 'text-amber-400',
    scheduled: 'text-sky-400', open: 'text-sky-400',
    failed: 'text-rose-400', escalated: 'text-rose-400', critical: 'text-rose-400',
    cancelled: 'text-zinc-500',
  };
  return map[s] || 'text-zinc-400';
};

const statusBg = (s: string): string => {
  const map: Record<string, string> = {
    completed: 'bg-emerald-500/10 border-emerald-500/20', resolved: 'bg-emerald-500/10 border-emerald-500/20',
    in_progress: 'bg-amber-500/10 border-amber-500/20', pending_review: 'bg-amber-500/10 border-amber-500/20',
    scheduled: 'bg-sky-500/10 border-sky-500/20', open: 'bg-sky-500/10 border-sky-500/20',
    failed: 'bg-rose-500/10 border-rose-500/20', escalated: 'bg-rose-500/10 border-rose-500/20',
    cancelled: 'bg-zinc-500/10 border-zinc-500/20',
  };
  return map[s] || 'bg-zinc-500/10 border-zinc-500/20';
};

const severityBadge = (s: SeverityLevel): string => {
  const map: Record<string, string> = {
    critical: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    major: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    minor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    observation: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  };
  return map[s] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
};

const scoreColor = (score: number, max: number): string => {
  const pct = (score / max) * 100;
  if (pct >= 90) return 'text-emerald-400';
  if (pct >= 75) return 'text-amber-400';
  return 'text-rose-400';
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const KpiCard = ({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) => (
  <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition group">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2 rounded-xl border ${color.includes('emerald') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : color.includes('amber') ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : color.includes('rose') ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : color.includes('violet') ? 'bg-violet-500/10 border-violet-500/20 text-violet-400' : 'bg-sky-500/10 border-sky-500/20 text-sky-400'}`}>
        {icon}
      </div>
    </div>
    <div className={`text-2xl font-light tracking-tight ${color}`}>{value}</div>
    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">{label}</div>
    {sub && <div className="text-[10px] text-zinc-600 mt-1">{sub}</div>}
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

type QATab = 'inspections' | 'checklists' | 'mystery_shopper' | 'satisfaction' | 'corrective' | 'standards';

const QualityAssuranceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<QATab>('inspections');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const tabs: { id: QATab; label: string; icon: React.FC<{ size?: number }> }[] = [
    { id: 'inspections', label: 'Inspections', icon: Search },
    { id: 'checklists', label: 'Checklists', icon: ClipboardCheck },
    { id: 'mystery_shopper', label: 'Mystery Shopper', icon: Eye },
    { id: 'satisfaction', label: 'Guest Satisfaction', icon: Star },
    { id: 'corrective', label: 'Corrective Actions', icon: AlertTriangle },
    { id: 'standards', label: 'Standards', icon: Award },
  ];

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const avgInspScore = useMemo(() => {
    const scored = MOCK_INSPECTIONS.filter(i => i.score !== undefined);
    return scored.length ? Math.round(scored.reduce((s, i) => s + (i.score ?? 0), 0) / scored.length) : 0;
  }, []);

  const openCAs = MOCK_CORRECTIVE.filter(ca => ca.status !== 'resolved').length;
  const avgSat = useMemo(() => {
    const entries = MOCK_SATISFACTION;
    return entries.length ? (entries.reduce((s, e) => s + (e.overallRating / e.maxRating) * 100, 0) / entries.length).toFixed(0) : '0';
  }, []);
  const latestMysteryScore = MOCK_MYSTERY[0]?.overallScore ?? 0;

  // ── Inspections Tab ──────────────────────────────────────────────────────
  const renderInspections = () => {
    const filtered = MOCK_INSPECTIONS.filter(i =>
      (statusFilter === 'all' || i.status === statusFilter) &&
      (i.title.toLowerCase().includes(searchQuery.toLowerCase()) || i.location.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded-xl flex-1 min-w-[200px] max-w-md">
            <Search size={14} className="text-zinc-500" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search inspections..." className="bg-transparent outline-none text-sm text-zinc-200 placeholder:text-zinc-600 w-full" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-300 outline-none cursor-pointer">
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <button className="px-4 py-2 bg-violet-600/80 hover:bg-violet-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-2">
            <Plus size={14} /> New Inspection
          </button>
        </div>

        {/* Inspection Cards */}
        <div className="space-y-3">
          {filtered.map(insp => (
            <div key={insp.id} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-sm font-medium text-zinc-100 truncate group-hover:text-violet-400 transition">{insp.title}</h4>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${statusBg(insp.status)} ${statusColor(insp.status)}`}>
                      {insp.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-zinc-500">
                    <span className="flex items-center gap-1"><Calendar size={10} /> {insp.scheduledDate}</span>
                    <span className="flex items-center gap-1"><Users size={10} /> {insp.inspectorName}</span>
                    <span className="uppercase tracking-wider font-bold">{insp.category.replace('_', ' ')}</span>
                  </div>
                  <div className="text-[10px] text-zinc-600 mt-1">{insp.location}</div>
                  {insp.findings.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {insp.findings.map((f, i) => (
                        <div key={i} className="text-[10px] text-zinc-500 flex items-start gap-1.5">
                          <AlertTriangle size={10} className="text-amber-500 mt-0.5 flex-shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  {insp.score !== undefined ? (
                    <div>
                      <div className={`text-2xl font-light ${scoreColor(insp.score, insp.maxScore)}`}>{insp.score}</div>
                      <div className="text-[9px] text-zinc-600 font-bold">/ {insp.maxScore}</div>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-600 italic">Pending</div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-zinc-600 text-sm">No inspections match your criteria</div>
          )}
        </div>
      </div>
    );
  };

  // ── Checklists Tab ───────────────────────────────────────────────────────
  const renderChecklists = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Active Checklists</h3>
        <button className="px-4 py-2 bg-violet-600/80 hover:bg-violet-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-2">
          <Plus size={14} /> Create Checklist
        </button>
      </div>
      <div className="space-y-3">
        {MOCK_CHECKLISTS.map(cl => (
          <div key={cl.id} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <ClipboardCheck size={14} className="text-violet-400 flex-shrink-0" />
                  <h4 className="text-sm font-medium text-zinc-100 truncate">{cl.templateName}</h4>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${statusBg(cl.status)} ${statusColor(cl.status)}`}>
                    {cl.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-zinc-500 mt-1">
                  <span className="flex items-center gap-1"><Users size={10} /> {cl.assigneeName}</span>
                  <span className="flex items-center gap-1"><Calendar size={10} /> {cl.scheduledDate}</span>
                  {cl.notes && <span className="text-zinc-600">{cl.notes}</span>}
                </div>
              </div>
              {cl.overallScore !== undefined && (
                <div className={`text-xl font-light ${scoreColor(cl.overallScore, 100)}`}>{cl.overallScore}%</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Mystery Shopper Tab ──────────────────────────────────────────────────
  const renderMysteryShopper = () => (
    <div className="space-y-6">
      {MOCK_MYSTERY.map(visit => (
        <div key={visit.id} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
          {/* Visit Header */}
          <div className="p-5 border-b border-zinc-800/50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Eye size={16} className="text-violet-400" />
                  <h4 className="text-sm font-medium text-zinc-100">{visit.agencyName}</h4>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${statusBg(visit.status)} ${statusColor(visit.status)}`}>
                    {visit.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-zinc-500 mt-1">
                  <span>Alias: {visit.shopperAlias}</span>
                  <span className="flex items-center gap-1"><Calendar size={10} /> {visit.visitDate}</span>
                  {visit.checkInDate && <span>Stay: {visit.checkInDate} - {visit.checkOutDate}</span>}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-light ${scoreColor(visit.overallScore, visit.maxScore)}`}>{visit.overallScore}</div>
                <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">/ {visit.maxScore}</div>
              </div>
            </div>
            {visit.executiveSummary && (
              <p className="text-xs text-zinc-400 mt-3 italic leading-relaxed">{visit.executiveSummary}</p>
            )}
          </div>

          {/* Category Breakdown */}
          <div className="p-5 space-y-3">
            {visit.categories.map((cat, i) => (
              <div key={i} className="bg-zinc-950/40 border border-zinc-800/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-zinc-200">{cat.name}</span>
                  <span className={`text-sm font-medium ${scoreColor(cat.score, cat.maxScore)}`}>{cat.score}/{cat.maxScore}</span>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all ${(cat.score / cat.maxScore) * 100 >= 90 ? 'bg-emerald-500' : (cat.score / cat.maxScore) * 100 >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${(cat.score / cat.maxScore) * 100}%` }}
                  />
                </div>
                <div className="flex gap-6 mt-2">
                  {cat.highlights.length > 0 && (
                    <div className="flex-1">
                      {cat.highlights.map((h, j) => (
                        <div key={j} className="text-[10px] text-emerald-500/70 flex items-center gap-1">
                          <CheckCircle2 size={9} /> {h}
                        </div>
                      ))}
                    </div>
                  )}
                  {cat.deficiencies.length > 0 && (
                    <div className="flex-1">
                      {cat.deficiencies.map((d, j) => (
                        <div key={j} className="text-[10px] text-rose-400/70 flex items-center gap-1">
                          <AlertTriangle size={9} /> {d}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  // ── Guest Satisfaction Tab ───────────────────────────────────────────────
  const renderSatisfaction = () => {
    const sentimentCounts = {
      positive: MOCK_SATISFACTION.filter(s => s.sentiment === 'positive').length,
      neutral: MOCK_SATISFACTION.filter(s => s.sentiment === 'neutral').length,
      negative: MOCK_SATISFACTION.filter(s => s.sentiment === 'negative').length,
    };
    return (
      <div className="space-y-6">
        {/* Sentiment Overview */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-center">
            <div className="text-2xl font-light text-emerald-400">{sentimentCounts.positive}</div>
            <div className="text-[10px] text-emerald-500/60 uppercase font-bold tracking-widest mt-1">Positive</div>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-center">
            <div className="text-2xl font-light text-amber-400">{sentimentCounts.neutral}</div>
            <div className="text-[10px] text-amber-500/60 uppercase font-bold tracking-widest mt-1">Neutral</div>
          </div>
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 text-center">
            <div className="text-2xl font-light text-rose-400">{sentimentCounts.negative}</div>
            <div className="text-[10px] text-rose-500/60 uppercase font-bold tracking-widest mt-1">Negative</div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-3">
          {MOCK_SATISFACTION.map(entry => (
            <div key={entry.id} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-sm font-medium text-zinc-100">{entry.guestName || 'Anonymous'}</h4>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${entry.sentiment === 'positive' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : entry.sentiment === 'negative' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                      {entry.sentiment}
                    </span>
                    <span className="px-2 py-0.5 bg-zinc-800 rounded text-[9px] font-bold text-zinc-400 uppercase">{entry.source.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: entry.maxRating <= 5 ? entry.maxRating : 5 }).map((_, i) => (
                      <Star key={i} size={12} className={i < (entry.maxRating <= 5 ? entry.overallRating : Math.round(entry.overallRating / 2)) ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'} />
                    ))}
                    <span className="text-[10px] text-zinc-500 ml-2">{entry.overallRating}/{entry.maxRating}</span>
                  </div>
                  {entry.comment && (
                    <p className="text-xs text-zinc-400 mt-2 italic leading-relaxed">"{entry.comment}"</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-600">
                    <span className="flex items-center gap-1"><Calendar size={10} /> {entry.date}</span>
                    {entry.reservationId && <span>Res: {entry.reservationId}</span>}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase border ${entry.responseStatus === 'responded' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : entry.responseStatus === 'pending' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>
                    {entry.responseStatus === 'no_action' ? 'No Action' : entry.responseStatus}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Corrective Actions Tab ───────────────────────────────────────────────
  const renderCorrective = () => {
    const filtered = MOCK_CORRECTIVE.filter(ca =>
      (statusFilter === 'all' || ca.status === statusFilter) &&
      ca.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded-xl flex-1 min-w-[200px] max-w-md">
            <Search size={14} className="text-zinc-500" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search corrective actions..." className="bg-transparent outline-none text-sm text-zinc-200 placeholder:text-zinc-600 w-full" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-300 outline-none cursor-pointer">
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="pending_review">Pending Review</option>
            <option value="resolved">Resolved</option>
            <option value="escalated">Escalated</option>
          </select>
        </div>

        <div className="space-y-3">
          {filtered.map(ca => (
            <div key={ca.id} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="text-sm font-medium text-zinc-100">{ca.title}</h4>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${severityBadge(ca.severity)}`}>{ca.severity}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${statusBg(ca.status)} ${statusColor(ca.status)}`}>{ca.status.replace('_', ' ')}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">{ca.description}</p>
                  <div className="flex items-center gap-4 text-[10px] text-zinc-500 mt-2">
                    <span className="flex items-center gap-1"><Users size={10} /> {ca.assigneeName}</span>
                    <span>{ca.department}</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> Due: {ca.dueDate}</span>
                    <span className="uppercase tracking-wider font-bold">{ca.sourceType.replace('_', ' ')}</span>
                  </div>
                  {ca.actionTaken && (
                    <div className="mt-2 px-3 py-2 bg-zinc-950/40 border border-zinc-800/50 rounded-lg text-[10px] text-zinc-400">
                      <span className="font-bold text-zinc-500">Action: </span>{ca.actionTaken}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-zinc-600 text-sm">No corrective actions match your criteria</div>
          )}
        </div>
      </div>
    );
  };

  // ── Standards Tab ────────────────────────────────────────────────────────
  const renderStandards = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Quality Standards Registry</h3>
        <button className="px-4 py-2 bg-violet-600/80 hover:bg-violet-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-2">
          <Plus size={14} /> Add Standard
        </button>
      </div>
      <div className="space-y-3">
        {MOCK_STANDARDS.map(std => {
          const onTarget = std.lastAuditScore !== undefined && std.lastAuditScore >= std.targetScore;
          return (
            <div key={std.id} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded text-[9px] font-bold text-violet-400 font-mono">{std.code}</span>
                    <h4 className="text-sm font-medium text-zinc-100">{std.name}</h4>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${std.complianceLevel === 'mandatory' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : std.complianceLevel === 'recommended' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-sky-500/10 border-sky-500/20 text-sky-400'}`}>
                      {std.complianceLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">{std.description}</p>
                  <div className="flex items-center gap-4 text-[10px] text-zinc-500 mt-2">
                    <span>Owner: {std.owner}</span>
                    <span>Category: {std.category}</span>
                    {std.lastAuditDate && <span className="flex items-center gap-1"><Calendar size={10} /> Last Audit: {std.lastAuditDate}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {std.lastAuditScore !== undefined && (
                    <div className="flex items-center gap-2">
                      <div>
                        <div className={`text-xl font-light ${onTarget ? 'text-emerald-400' : 'text-rose-400'}`}>{std.lastAuditScore}%</div>
                        <div className="text-[9px] text-zinc-600">Target: {std.targetScore}%</div>
                      </div>
                      {onTarget ? <TrendingUp size={14} className="text-emerald-500" /> : <TrendingDown size={14} className="text-rose-500" />}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Tab Content Router ───────────────────────────────────────────────────
  const renderTabContent = () => {
    switch (activeTab) {
      case 'inspections': return renderInspections();
      case 'checklists': return renderChecklists();
      case 'mystery_shopper': return renderMysteryShopper();
      case 'satisfaction': return renderSatisfaction();
      case 'corrective': return renderCorrective();
      case 'standards': return renderStandards();
      default: return renderInspections();
    }
  };

  // ── Main Render ──────────────────────────────────────────────────────────
  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header glass-panel border border-teal-500/20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-teal-600/10 border border-teal-500/20 rounded-xl flex items-center justify-center text-teal-400">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-light text-white tracking-tight">Quality Assurance</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Standards & Excellence</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchQuery(''); setStatusFilter('all'); }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === tab.id
                ? 'bg-zinc-800 text-white shadow-lg shadow-black/40'
                : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <tab.icon size={12} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-500/5 border border-teal-500/20 rounded-xl text-[10px] font-bold text-teal-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            QA ACTIVE
          </div>
        </div>
      </div>

      {/* Body */}
      <main className="module-body grid grid-cols-12 gap-8">
        {/* Left Main Content */}
        <div className="col-span-8 space-y-6 overflow-y-auto custom-scrollbar pr-4">
          {renderTabContent()}
        </div>

        {/* Right Sidebar - KPIs & Summary */}
        <div className="col-span-4 space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <KpiCard icon={<Target size={18} />} label="Avg Inspection Score" value={`${avgInspScore}%`} sub={`${MOCK_INSPECTIONS.length} inspections`} color="text-emerald-400" />
            <KpiCard icon={<Eye size={18} />} label="Mystery Shopper" value={`${latestMysteryScore}/100`} sub="Latest Visit" color="text-violet-400" />
            <KpiCard icon={<Star size={18} />} label="Guest Satisfaction" value={`${avgSat}%`} sub={`${MOCK_SATISFACTION.length} reviews`} color="text-amber-400" />
            <KpiCard icon={<AlertTriangle size={18} />} label="Open Actions" value={`${openCAs}`} sub="Corrective actions pending" color="text-rose-400" />
          </div>

          {/* Recent Activity */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <RefreshCw size={12} className="text-violet-400" /> Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="text-[10px] text-zinc-400 flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                <span><strong className="text-zinc-300">Suite 1201</strong> inspection completed - Score: 94/100</span>
              </div>
              <div className="text-[10px] text-zinc-400 flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 flex-shrink-0" />
                <span><strong className="text-zinc-300">Main Kitchen</strong> deep clean audit in progress</span>
              </div>
              <div className="text-[10px] text-zinc-400 flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1 flex-shrink-0" />
                <span><strong className="text-zinc-300">LQA Visit</strong> report finalized - Overall: 87/100</span>
              </div>
              <div className="text-[10px] text-zinc-400 flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 flex-shrink-0" />
                <span><strong className="text-zinc-300">B2 Corridor</strong> failed compliance - 3 corrective actions created</span>
              </div>
              <div className="text-[10px] text-zinc-400 flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1 flex-shrink-0" />
                <span><strong className="text-zinc-300">Wet floor signage</strong> corrective action pending review</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <BarChart3 size={12} className="text-teal-400" /> This Month
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">Inspections Completed</span>
                <span className="text-zinc-200 font-medium">12</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">Pass Rate</span>
                <span className="text-emerald-400 font-medium">83%</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">Checklists Completed</span>
                <span className="text-zinc-200 font-medium">47</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">Avg Response Time</span>
                <span className="text-amber-400 font-medium">2.4 days</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">Guest NPS</span>
                <span className="text-emerald-400 font-medium">+62</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QualityAssuranceDashboard;
